import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin only");
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string;
  kyc_status: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
}

export const listUsersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.userId);

    const [{ data: profiles, error: pErr }, { data: wallets, error: wErr }, { data: roles, error: rErr }, { data: usersList, error: uErr }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id,name,kyc_status,created_at").order("created_at", { ascending: false }).limit(500),
        supabaseAdmin.from("wallets").select("user_id,balance"),
        supabaseAdmin.from("user_roles").select("user_id,role"),
        supabaseAdmin.auth.admin.listUsers({ perPage: 500 }),
      ]);
    if (pErr) throw new Error(pErr.message);
    if (wErr) throw new Error(wErr.message);
    if (rErr) throw new Error(rErr.message);
    if (uErr) throw new Error(uErr.message);

    const balMap = new Map(wallets!.map((w: any) => [w.user_id, Number(w.balance)]));
    const adminSet = new Set(roles!.filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
    const emailMap = new Map((usersList?.users ?? []).map((u: any) => [u.id, u.email]));

    return (profiles ?? []).map((p: any) => ({
      id: p.id,
      email: emailMap.get(p.id) ?? null,
      name: p.name,
      kyc_status: p.kyc_status,
      balance: balMap.get(p.id) ?? 0,
      is_admin: adminSet.has(p.id),
      created_at: p.created_at,
    }));
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      if (data.userId === context.userId) throw new Error("You cannot remove your own admin role");
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adjustBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        delta: z.number().refine((n) => n !== 0 && Math.abs(n) <= 1_000_000_000, "Invalid amount"),
        note: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: w, error: wErr } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (wErr) throw new Error(wErr.message);
    const current = Number(w?.balance ?? 0);
    const next = current + data.delta;
    if (next < 0) throw new Error("Resulting balance would be negative");

    const { error: upErr } = await supabaseAdmin
      .from("wallets")
      .upsert({ user_id: data.userId, balance: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (upErr) throw new Error(upErr.message);

    const { error: txErr } = await supabaseAdmin.from("transactions").insert({
      user_id: data.userId,
      type: data.delta > 0 ? "deposit" : "withdraw",
      amount: Math.abs(data.delta),
      currency: "POINT",
      status: "completed",
      notes: data.note ?? `Admin adjustment (${data.delta > 0 ? "+" : ""}${data.delta})`,
    });
    if (txErr) throw new Error(txErr.message);

    return { ok: true, balance: next };
  });

export const setUserKycStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      status: z.enum(["unverified", "pending", "verified", "rejected"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ kyc_status: data.status })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approveDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ transactionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .select("id,user_id,amount,type,status")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (txErr) throw new Error(txErr.message);
    if (!tx) throw new Error("Transaction not found");
    if (tx.type !== "deposit") throw new Error("Not a deposit transaction");
    if (tx.status !== "pending") throw new Error(`Already ${tx.status}`);

    const { data: w, error: wErr } = await supabaseAdmin
      .from("wallets").select("balance").eq("user_id", tx.user_id).maybeSingle();
    if (wErr) throw new Error(wErr.message);
    const next = Number(w?.balance ?? 0) + Number(tx.amount);

    const { error: upWErr } = await supabaseAdmin
      .from("wallets")
      .upsert({ user_id: tx.user_id, balance: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (upWErr) throw new Error(upWErr.message);

    const { error: upTxErr } = await supabaseAdmin
      .from("transactions")
      .update({ status: "completed", notes: "Deposit approved by admin" })
      .eq("id", tx.id);
    if (upTxErr) throw new Error(upTxErr.message);

    return { ok: true, balance: next };
  });

export const rejectDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ transactionId: z.string().uuid(), reason: z.string().max(200).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("transactions")
      .update({ status: "failed", notes: data.reason ? `Rejected: ${data.reason}` : "Rejected by admin" })
      .eq("id", data.transactionId)
      .eq("type", "deposit")
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface AdminDepositRow {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  amount: number;
  status: string;
  created_at: string;
  notes: string | null;
  receipt_path: string | null;
}

export const listDepositsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ status: z.enum(["pending", "completed", "failed"]).default("pending") }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<AdminDepositRow[]> => {
    await assertAdmin(context.userId);

    const { data: txs, error } = await supabaseAdmin
      .from("transactions")
      .select("id,user_id,amount,status,created_at,notes,receipt_path")
      .eq("type", "deposit")
      .eq("status", data.status)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((txs ?? []).map((t: any) => t.user_id)));
    const [{ data: profiles }, { data: usersList }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin.auth.admin.listUsers({ perPage: 500 }),
    ]);
    const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.name]));
    const emailMap = new Map((usersList?.users ?? []).map((u: any) => [u.id, u.email]));

    return (txs ?? []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      user_name: nameMap.get(t.user_id) ?? null,
      user_email: emailMap.get(t.user_id) ?? null,
      amount: Number(t.amount),
      status: t.status,
      created_at: t.created_at,
      notes: t.notes,
      receipt_path: t.receipt_path,
    }));
  });

export const signDepositReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: signed, error } = await supabaseAdmin.storage
      .from("deposit_receipts")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

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

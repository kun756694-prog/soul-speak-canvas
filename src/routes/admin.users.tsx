import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, ArrowLeft, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-kyc";
import { listUsersAdmin, setUserAdmin, adjustBalance, setUserKycStatus, type AdminUserRow } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { KycBadge } from "@/components/kyc/kyc-badge";
import type { KycStatus } from "@/hooks/use-kyc";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: AdminUsersPage });

function AdminUsersPage() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const listFn = useServerFn(listUsersAdmin);
  const setAdminFn = useServerFn(setUserAdmin);
  const adjustFn = useServerFn(adjustBalance);
  const setKycFn = useServerFn(setUserKycStatus);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const q = useQuery({
    queryKey: ["admin_users"],
    enabled: !!user && isAdmin === true,
    queryFn: () => listFn(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin_users"] });

  const toggleAdmin = useMutation({
    mutationFn: (v: { userId: string; makeAdmin: boolean }) => setAdminFn({ data: v }),
    onSuccess: () => { toast.success("Role updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjust = useMutation({
    mutationFn: (v: { userId: string; delta: number; note?: string }) => adjustFn({ data: v }),
    onSuccess: () => { toast.success("Balance updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setKyc = useMutation({
    mutationFn: (v: { userId: string; status: KycStatus }) => setKycFn({ data: v }),
    onSuccess: () => { toast.success("KYC status updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || adminLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Admin only</h2>
        <Button asChild variant="outline"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  const rows = (q.data ?? []).filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (r.email ?? "").toLowerCase().includes(s) || r.name.toLowerCase().includes(s) || r.id.startsWith(s);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon"><Link to="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" />User Management</h1>
          <p className="text-sm text-muted-foreground">Promote admins, adjust balances, manage KYC.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or name" className="pl-9" />
      </div>

      {q.isLoading && <div className="text-center text-muted-foreground p-8"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading users…</div>}
      {q.error && <div className="text-center text-destructive p-4">{(q.error as Error).message}</div>}

      <div className="space-y-3">
        {rows.map((u) => (
          <UserRow
            key={u.id}
            row={u}
            isSelf={u.id === user!.id}
            busy={toggleAdmin.isPending || adjust.isPending || setKyc.isPending}
            onToggleAdmin={(makeAdmin) => toggleAdmin.mutate({ userId: u.id, makeAdmin })}
            onAdjust={(delta, note) => adjust.mutate({ userId: u.id, delta, note })}
            onSetKyc={(status) => setKyc.mutate({ userId: u.id, status })}
          />
        ))}
        {!q.isLoading && rows.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No users found.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function UserRow({
  row, isSelf, busy, onToggleAdmin, onAdjust, onSetKyc,
}: {
  row: AdminUserRow;
  isSelf: boolean;
  busy: boolean;
  onToggleAdmin: (makeAdmin: boolean) => void;
  onAdjust: (delta: number, note?: string) => void;
  onSetKyc: (status: KycStatus) => void;
}) {
  const [amount, setAmount] = useState("");

  const submit = (sign: 1 | -1) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { toast.error("Enter a positive amount"); return; }
    onAdjust(sign * n);
    setAmount("");
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium truncate">{row.name || "(no name)"} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}</p>
            <p className="text-xs text-muted-foreground truncate">{row.email ?? row.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <KycBadge status={row.kyc_status as KycStatus} />
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold">{row.balance.toLocaleString()} pts</span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
            <span className="text-sm">Admin role</span>
            <Switch checked={row.is_admin} disabled={busy || isSelf} onCheckedChange={(v) => onToggleAdmin(v)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap">KYC</span>
            <Select value={row.kyc_status} onValueChange={(v) => onSetKyc(v as KycStatus)} disabled={busy}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number" inputMode="decimal" placeholder="Amount (POINT)"
            value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9"
          />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => submit(1)}>Credit</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => submit(-1)}>Debit</Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-kyc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  listDepositsAdmin,
  approveDeposit,
  rejectDeposit,
  signDepositReceipt,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/deposits")({ component: AdminDepositsPage });

type Status = "pending" | "completed" | "failed";

function AdminDepositsPage() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status>("pending");

  const listFn = useServerFn(listDepositsAdmin);
  const approveFn = useServerFn(approveDeposit);
  const rejectFn = useServerFn(rejectDeposit);
  const signFn = useServerFn(signDepositReceipt);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const q = useQuery({
    queryKey: ["admin_deposits", filter],
    enabled: !!user && isAdmin === true,
    queryFn: () => listFn({ data: { status: filter } }),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { transactionId: id } }),
    onSuccess: () => {
      toast.success("Deposit approved & credited");
      qc.invalidateQueries({ queryKey: ["admin_deposits"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { transactionId: id } }),
    onSuccess: () => {
      toast.success("Deposit rejected");
      qc.invalidateQueries({ queryKey: ["admin_deposits"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openReceipt = async (path: string) => {
    try {
      const { url } = await signFn({ data: { path } });
      window.open(url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open receipt");
    }
  };

  if (loading || adminLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Admin only</h2>
        <Button asChild variant="outline"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" />Deposit Review</h1>
        <p className="text-sm text-muted-foreground">Verify payment receipts before crediting points.</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Approved</TabsTrigger>
          <TabsTrigger value="failed">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {q.isLoading && (
        <div className="text-center text-muted-foreground p-8">
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading…
        </div>
      )}
      {!q.isLoading && (q.data ?? []).length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No {filter} deposits.</CardContent></Card>
      )}

      <div className="space-y-3">
        {(q.data ?? []).map((d) => (
          <Card key={d.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{d.user_name ?? "—"} <span className="text-muted-foreground text-xs">({d.user_email ?? d.user_id.slice(0, 8) + "…"})</span></p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                  {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{d.amount.toLocaleString()} POINT</p>
                  <Badge variant={d.status === "pending" ? "secondary" : d.status === "completed" ? "default" : "destructive"}>
                    {d.status}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {d.receipt_path ? (
                  <Button size="sm" variant="outline" onClick={() => openReceipt(d.receipt_path!)}>View receipt</Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No receipt uploaded</span>
                )}
                {d.status === "pending" && (
                  <>
                    <Button size="sm" className="bg-[oklch(0.72_0.19_160)] hover:bg-[oklch(0.65_0.19_160)] text-white"
                      disabled={approve.isPending || reject.isPending}
                      onClick={() => approve.mutate(d.id)}>
                      Approve & Credit
                    </Button>
                    <Button size="sm" variant="destructive"
                      disabled={approve.isPending || reject.isPending}
                      onClick={() => reject.mutate(d.id)}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

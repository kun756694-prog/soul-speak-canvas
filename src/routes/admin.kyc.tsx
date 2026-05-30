import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-kyc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KycBadge } from "@/components/kyc/kyc-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kyc")({ component: AdminKycPage });

interface Submission {
  id: string;
  user_id: string;
  full_name: string;
  id_type: string;
  document_path: string;
  selfie_path: string | null;
  level: number;
  status: "unverified" | "pending" | "verified" | "rejected";
  submitted_at: string;
  notes: string | null;
}

function AdminKycPage() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "verified" | "rejected">("pending");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const q = useQuery({
    queryKey: ["admin_kyc", filter],
    enabled: !!user && isAdmin === true,
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("id,user_id,full_name,id_type,document_path,status,submitted_at,notes")
        .eq("status", filter)
        .order("submitted_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Submission[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (vars: { id: string; status: "verified" | "rejected" | "pending" }) => {
      const { error } = await supabase
        .from("kyc_submissions")
        .update({ status: vars.status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin_kyc"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["kyc_status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("kyc_documents").createSignedUrl(path, 60 * 10);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  };

  if (loading || adminLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Admin only</h2>
        <p className="text-sm text-muted-foreground">
          You need the admin role to view this page. An existing admin can grant it via the user_roles table
          (role = 'admin').
        </p>
        <Button asChild variant="outline"><Link to="/profile">Back to profile</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" />KYC Review</h1>
        <p className="text-sm text-muted-foreground">Approve or reject identity submissions.</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {q.isLoading && <div className="text-center text-muted-foreground p-8"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading…</div>}
      {!q.isLoading && (q.data ?? []).length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No {filter} submissions.</CardContent></Card>
      )}

      <div className="space-y-3">
        {(q.data ?? []).map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">{s.id_type} · UID {s.user_id.slice(0, 8)}…</p>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(s.submitted_at).toLocaleString()}</p>
                </div>
                <KycBadge status={s.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openDoc(s.document_path)}>View document</Button>
                {s.status !== "verified" && (
                  <Button size="sm" className="bg-[oklch(0.72_0.19_160)] hover:bg-[oklch(0.65_0.19_160)] text-white"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: s.id, status: "verified" })}>
                    Approve
                  </Button>
                )}
                {s.status !== "rejected" && (
                  <Button size="sm" variant="destructive"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: s.id, status: "rejected" })}>
                    Reject
                  </Button>
                )}
                {s.status !== "pending" && (
                  <Button size="sm" variant="ghost"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: s.id, status: "pending" })}>
                    Reset to pending
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

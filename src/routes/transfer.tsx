import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Send, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useKycLevel } from "@/hooks/use-kyc";

export const Route = createFileRoute("/transfer")({ component: TransferPage });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Step = "form" | "confirm" | "done";

function TransferPage() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [recipient, setRecipient] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: kyc, isLoading: kycLoading } = useKycLevel();
  const approvedLevel = kyc?.approvedLevel ?? 0;
  const gated = !kycLoading && approvedLevel < 2;

  const validateMutation = useMutation({
    mutationFn: async () => {
      const id = accountId.trim();
      if (!UUID_RE.test(id)) throw new Error("Please enter a valid Account ID");
      const n = parseFloat(amount);
      if (isNaN(n) || n <= 0) throw new Error("Please enter a valid amount");
      if (user && id.toLowerCase() === user.id.toLowerCase())
        throw new Error("You cannot transfer points to your own account");

      const { data, error } = await supabase.rpc("lookup_account", { _recipient_id: id });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.id) throw new Error("Account ID not found");
      return { id: row.id as string, name: (row.name as string) || "Unknown" };
    },
    onSuccess: (r) => {
      setRecipient(r);
      setStep("confirm");
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!recipient) throw new Error("No recipient");
      const { error } = await supabase.rpc("transfer_points_by_id", {
        _recipient_id: recipient.id,
        _amount: parseFloat(amount),
        _notes: notes || "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setStep("done");
      setTimeout(() => navigate({ to: "/" }), 2000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const onContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    validateMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-10 flex items-center gap-4 border-b border-border bg-background/95 p-4 backdrop-blur">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-lg font-semibold">Transfer Points</h1>
      </div>
      <div className="mx-auto max-w-md space-y-6 p-4">
        {gated && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-5 w-5 text-destructive" />Level 2 verification required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Transferring points requires Level 2 KYC (Live Selfie + Government ID). Please complete verification to continue.
              </p>
              <Button asChild className="w-full"><Link to="/profile">Go to verification</Link></Button>
            </CardContent>
          </Card>
        )}
        {!gated && step === "form" && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="h-5 w-5 text-primary" />Send Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onContinue} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Recipient Account ID</Label>
                  <Input
                    id="accountId"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="e.g. 736354ea-9f7c-42de-a854-085f4c03c899"
                    required
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask the recipient for their Account ID (UUID) from Profile.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (POINT)</Label>
                  <Input id="amount" type="number" placeholder="0.00" value={amount}
                    onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" className="text-lg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input id="notes" type="text" placeholder="What's this for?" value={notes}
                    onChange={(e) => setNotes(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={!accountId || !amount || validateMutation.isPending}>
                  {validateMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validating...</>
                  ) : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!gated && step === "confirm" && recipient && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Confirm Transfer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <Row label="Recipient" value={recipient.name} />
                <Row label="Account ID" value={recipient.id} mono />
                <Row label="Amount" value={`${parseFloat(amount).toLocaleString()} POINT`} />
                {notes && <Row label="Notes" value={notes} />}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep("form"); setError(null); }}
                  disabled={transferMutation.isPending}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => { setError(null); transferMutation.mutate(); }}
                  disabled={transferMutation.isPending}>
                  {transferMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                  ) : "Confirm Transfer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!gated && step === "done" && recipient && (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-[oklch(0.72_0.19_160)]" />
              <h2 className="text-lg font-semibold">Transfer Successful</h2>
              <p className="text-sm text-muted-foreground">
                Sent {parseFloat(amount).toLocaleString()} POINT to {recipient.name}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right text-foreground ${mono ? "font-mono text-xs break-all" : "font-medium"}`}>{value}</span>
    </div>
  );
}

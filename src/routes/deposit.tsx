import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Copy, Check, Wallet, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useWalletMutations } from "@/lib/mock-data";

export const Route = createFileRoute("/deposit")({ component: DepositPage });

const TNG_NUMBER = "161595298259";
const CRYPTO_WALLET = "0x13682F7eF346ad1c579755bA01e2AE4241991c7A";

function CopyRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <code className="break-all text-sm font-medium text-foreground">{value}</code>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onCopy}>
          {copied ? <Check className="h-4 w-4 text-[oklch(0.72_0.19_160)]" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function DepositPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { deposit } = useWalletMutations();
  const quickAmounts = [100, 500, 1000, 5000];

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { setError("Please enter a valid amount"); return; }
    setLoading(true);
    try {
      await deposit.mutateAsync(n);
      setSuccess(`Deposit request for ${n} POINT submitted. Admin will verify and credit your balance.`);
      setAmount("");
      setTimeout(() => navigate({ to: "/" }), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-10 flex items-center gap-4 border-b border-border bg-background/95 p-4 backdrop-blur">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-lg font-semibold">Deposit Points</h1>
      </div>
      <div className="mx-auto max-w-md space-y-6 p-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Methods</CardTitle>
            <p className="text-xs text-muted-foreground">
              Send your payment to one of the addresses below, then submit your deposit request.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CopyRow label="Touch 'n Go (TNG)" value={TNG_NUMBER} icon={Smartphone} />
            <CopyRow label="Crypto Wallet (USDT/ETH — BEP20/ERC20)" value={CRYPTO_WALLET} icon={Wallet} />
            <p className="text-xs text-muted-foreground">
              After paying, enter the amount below. Admin will verify and credit your points.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><CardTitle>Submit Deposit Request</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (POINT)</Label>
                <Input id="amount" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="1" className="text-lg h-12" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((q) => (
                  <Button key={q} type="button" variant="outline" size="sm" onClick={() => setAmount(String(q))}>+{q}</Button>
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-[oklch(0.72_0.19_160)]">{success}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading || !amount}>
                {loading ? "Processing..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

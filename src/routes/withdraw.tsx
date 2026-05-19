import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, AlertCircle, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet, useWalletMutations } from "@/lib/mock-data";

export const Route = createFileRoute("/withdraw")({ component: WithdrawPage });

function WithdrawPage() {
  const { balance } = useWallet();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { withdraw } = useWalletMutations();

  const n = parseFloat(amount) || 0;
  const isValid = address.length > 5 && n > 0 && n <= balance;

  const handleWithdraw = async () => {
    setShowConfirm(false);
    setError(null);
    try {
      await withdraw.mutateAsync({ amount: n, address });
      setSuccess(`Successfully withdrew ${n} POINT!`);
      setAmount(""); setAddress("");
      setTimeout(() => navigate({ to: "/" }), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Withdraw failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-10 flex items-center gap-4 border-b border-border bg-background/95 p-4 backdrop-blur">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-lg font-semibold">Withdraw Points</h1>
      </div>
      <div className="mx-auto max-w-md space-y-6 p-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold">{balance.toLocaleString()} <span className="text-primary">POINT</span></p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Minus className="h-5 w-5 text-destructive" />Withdraw Points</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Destination Address / Account</Label>
              <Input id="address" type="text" placeholder="Enter wallet address or account" value={address} onChange={(e) => setAddress(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount (POINT)</Label>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-primary text-xs" onClick={() => setAmount(String(balance))}>MAX</Button>
              </div>
              <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" max={balance} className="text-lg h-12" />
            </div>
            {n > balance && <p className="text-sm text-destructive">Amount exceeds available balance</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-[oklch(0.72_0.19_160)]">{success}</p>}
          </CardContent>
        </Card>
        <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">Please double-check your withdrawal details. This action cannot be undone.</p>
        </div>
        <Button className="w-full" size="lg" disabled={!isValid} onClick={() => setShowConfirm(true)}>Withdraw</Button>
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Withdrawal</DialogTitle>
              <DialogDescription>Please review your withdrawal details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-secondary p-3"><p className="text-2xl font-bold">{n.toLocaleString()} POINT</p></div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">To Address:</p>
                <code className="block rounded bg-secondary p-2 text-xs break-all">{address}</code>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button onClick={handleWithdraw}>Confirm Withdraw</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { walletStore } from "@/lib/mock-data";

export const Route = createFileRoute("/transfer")({ component: TransferPage });

function TransferPage() {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { setError("Please enter a valid amount"); return; }
    const res = walletStore.transfer(username, n, notes || undefined);
    if ("error" in res && res.error) { setError(res.error); return; }
    setSuccess(`Successfully sent ${n} POINT to ${username}!`);
    setUsername(""); setAmount(""); setNotes("");
    setTimeout(() => navigate({ to: "/" }), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-10 flex items-center gap-4 border-b border-border bg-background/95 p-4 backdrop-blur">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-lg font-semibold">Transfer Points</h1>
      </div>
      <div className="mx-auto max-w-md space-y-6 p-4">
        <Card className="border-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Send className="h-5 w-5 text-primary" />Send Points to User</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Recipient Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (POINT)</Label>
                <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" className="text-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input id="notes" type="text" placeholder="What's this for?" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-[oklch(0.72_0.19_160)]">{success}</p>}
              <Button type="submit" className="w-full" disabled={!username || !amount}>Send Points</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

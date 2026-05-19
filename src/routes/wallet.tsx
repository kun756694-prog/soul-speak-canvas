import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Send, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/mock-data";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

function WalletPage() {
  const { balance } = useWallet();
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Card className="border-border">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Point Balance</p>
          <h1 className="mt-1 text-3xl font-bold">
            {balance.toLocaleString()} <span className="text-primary">POINT</span>
          </h1>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link to="/deposit"><Button className="w-full gap-2"><ArrowDownLeft className="h-4 w-4" />Deposit</Button></Link>
            <Link to="/withdraw"><Button variant="secondary" className="w-full gap-2"><ArrowUpRight className="h-4 w-4" />Withdraw</Button></Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/transfer"><Button variant="outline" className="w-full h-auto flex-col gap-2 py-4"><Send className="h-5 w-5 text-blue-500" /><span className="text-sm">Transfer</span></Button></Link>
            <Link to="/p2p"><Button variant="outline" className="w-full h-auto flex-col gap-2 py-4"><RefreshCw className="h-5 w-5 text-primary" /><span className="text-sm">P2P Trade</span></Button></Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Asset Details</h3>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-bold text-primary">P</span>
              </div>
              <div><p className="font-medium">Point Token</p><p className="text-sm text-muted-foreground">POINT</p></div>
            </div>
            <div className="text-right">
              <p className="font-medium font-mono">{balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

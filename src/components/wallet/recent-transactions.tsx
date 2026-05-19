import { Link } from "@tanstack/react-router";
import { ChevronRight, ArrowDownLeft, ArrowUpRight, Repeat2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Transaction, getTimeAgo } from "@/lib/mock-data";

const typeConfig = {
  deposit: { icon: ArrowDownLeft, label: "Deposit", color: "text-[oklch(0.72_0.19_160)]" },
  withdraw: { icon: ArrowUpRight, label: "Withdraw", color: "text-primary" },
  p2p_buy: { icon: Repeat2, label: "P2P Buy", color: "text-[oklch(0.72_0.19_160)]" },
  p2p_sell: { icon: Repeat2, label: "P2P Sell", color: "text-destructive" },
  transfer_in: { icon: Send, label: "Received", color: "text-[oklch(0.72_0.19_160)]" },
  transfer_out: { icon: Send, label: "Sent", color: "text-[oklch(0.7_0.15_250)]" },
} as const;

const statusColors = {
  completed: "text-[oklch(0.72_0.19_160)]",
  pending: "text-primary",
  failed: "text-destructive",
  cancelled: "text-muted-foreground",
} as const;

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (!transactions.length) {
    return (
      <Card className="border-border">
        <CardHeader><CardTitle className="text-lg">Recent Transactions</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-8">No transactions yet</p></CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <Link to="/history" className="flex items-center text-sm text-primary hover:text-primary/80">
          View All<ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {transactions.map((tx) => {
            const c = typeConfig[tx.type];
            const Icon = c?.icon ?? ArrowDownLeft;
            const incoming = ["deposit", "p2p_buy", "transfer_in"].includes(tx.type);
            return (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-secondary ${c?.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{c?.label ?? tx.type}</p>
                    <p className="text-sm text-muted-foreground">{getTimeAgo(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium font-mono ${incoming ? "text-[oklch(0.72_0.19_160)]" : ""}`}>
                    {incoming ? "+" : "-"}{tx.amount.toLocaleString()} {tx.currency}
                  </p>
                  <p className={`text-xs ${statusColors[tx.status]}`}>
                    {tx.status[0].toUpperCase() + tx.status.slice(1)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

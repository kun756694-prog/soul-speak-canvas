import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Repeat2, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet, type Transaction, getTimeAgo } from "@/lib/mock-data";

export const Route = createFileRoute("/history")({ component: HistoryPage });

const typeConfig = {
  deposit: { icon: ArrowDownLeft, label: "Deposit", color: "text-[oklch(0.72_0.19_160)]" },
  withdraw: { icon: ArrowUpRight, label: "Withdraw", color: "text-primary" },
  p2p_buy: { icon: Repeat2, label: "P2P Buy", color: "text-[oklch(0.72_0.19_160)]" },
  p2p_sell: { icon: Repeat2, label: "P2P Sell", color: "text-destructive" },
  transfer_in: { icon: Send, label: "Received", color: "text-[oklch(0.72_0.19_160)]" },
  transfer_out: { icon: Send, label: "Sent", color: "text-[oklch(0.7_0.15_250)]" },
} as const;
const statusConfig = {
  completed: { label: "Completed", variant: "default" as const },
  pending: { label: "Pending", variant: "secondary" as const },
  failed: { label: "Failed", variant: "destructive" as const },
  cancelled: { label: "Cancelled", variant: "secondary" as const },
} as const;

type FilterType = "all" | "deposit" | "withdraw" | "p2p" | "transfer";

function HistoryPage() {
  const { transactions } = useWallet();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filtered = transactions.filter((tx) => {
    if (filter === "all") return true;
    if (filter === "p2p") return tx.type === "p2p_buy" || tx.type === "p2p_sell";
    if (filter === "transfer") return tx.type === "transfer_in" || tx.type === "transfer_out";
    return tx.type === filter;
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Transaction History</h1>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="p2p">P2P</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card className="border-border">
        <CardContent className="p-4">
          {filtered.length ? (
            <div>
              {filtered.map((tx) => {
                const c = typeConfig[tx.type];
                const s = statusConfig[tx.status];
                const Icon = c?.icon ?? ArrowDownLeft;
                const incoming = ["deposit", "p2p_buy", "transfer_in"].includes(tx.type);
                return (
                  <button key={tx.id} onClick={() => setSelectedTx(tx)} className="flex w-full items-center justify-between py-4 border-b border-border last:border-0 hover:bg-accent/50 px-2 -mx-2 rounded-lg transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-secondary ${c?.color}`}><Icon className="h-5 w-5" /></div>
                      <div>
                        <p className="font-medium">{c?.label ?? tx.type}</p>
                        <p className="text-sm text-muted-foreground">{getTimeAgo(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium font-mono ${incoming ? "text-[oklch(0.72_0.19_160)]" : ""}`}>
                        {incoming ? "+" : "-"}{tx.amount.toLocaleString()} {tx.currency}
                      </p>
                      <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center"><p className="text-muted-foreground">No transactions found</p></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transaction Details</DialogTitle></DialogHeader>
          {selectedTx && (() => {
            const c = typeConfig[selectedTx.type];
            const s = statusConfig[selectedTx.status];
            const Icon = c?.icon ?? ArrowDownLeft;
            const incoming = ["deposit", "p2p_buy", "transfer_in"].includes(selectedTx.type);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-secondary ${c?.color}`}><Icon className="h-6 w-6" /></div>
                  <div>
                    <p className="font-medium">{c?.label ?? selectedTx.type}</p>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className={`font-bold font-mono ${incoming ? "text-[oklch(0.72_0.19_160)]" : ""}`}>{incoming ? "+" : "-"}{selectedTx.amount.toLocaleString()} {selectedTx.currency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(selectedTx.created_at).toLocaleString()}</span></div>
                  {selectedTx.fee && <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span>{selectedTx.fee} {selectedTx.currency}</span></div>}
                  {selectedTx.notes && <div className="space-y-1"><span className="text-muted-foreground text-sm">Notes</span><p className="rounded bg-secondary p-2 text-sm">{selectedTx.notes}</p></div>}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

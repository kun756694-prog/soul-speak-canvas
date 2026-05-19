import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buyMerchants, sellMerchants, formatNumber, type Merchant } from "@/lib/mock-data";

export const Route = createFileRoute("/p2p")({ component: P2PPage });

function P2PPage() {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [selectedFiat, setSelectedFiat] = useState("MMK");
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<Merchant | null>(null);
  const [orderAmount, setOrderAmount] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const merchants = tradeType === "buy" ? buyMerchants : sellMerchants;
  const filtered = merchants.filter((m) => {
    if (m.fiat !== selectedFiat) return false;
    if (amount) {
      const n = parseFloat(amount);
      if (n < m.minLimit || n > m.maxLimit) return false;
    }
    return true;
  });

  const cryptoAmt = selected && orderAmount ? parseFloat(orderAmount) / selected.price : 0;
  const isValidOrder = selected && cryptoAmt > 0 &&
    parseFloat(orderAmount) >= selected.minLimit &&
    parseFloat(orderAmount) <= selected.maxLimit;

  const placeOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => { setSelected(null); setOrderPlaced(false); setOrderAmount(""); }, 2000);
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">P2P Trading</h1>
          <p className="text-sm text-muted-foreground">Buy and sell directly with other users</p>
        </div>
        <Button variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as "buy" | "sell")} className="mb-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="buy" className="data-[state=active]:bg-[oklch(0.72_0.19_160)] data-[state=active]:text-white">Buy</TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-destructive data-[state=active]:text-white">Sell</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value="POINT" onValueChange={() => {}}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="POINT">POINT</SelectItem></SelectContent>
        </Select>
        <Select value={selectedFiat} onValueChange={setSelectedFiat}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["MMK", "USD", "THB"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[150px] max-w-[200px]">
          <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="pr-12" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{selectedFiat}</span>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card className="border-border"><CardContent className="py-12 text-center text-muted-foreground">No merchants match your filters</CardContent></Card>
        )}
        {filtered.map((m) => (
          <Card key={m.id} className="border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">{m.name[0]}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      {m.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{m.totalTrades} orders</span>
                      <span>{m.completionRate}% completion</span>
                      <span>~{m.avgReleaseTime}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(m.price, 0)}<span className="text-sm font-normal text-muted-foreground ml-1">{m.fiat}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">Available:</span><span className="font-medium">{formatNumber(m.available, 0)} {m.crypto}</span></div>
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">Limit:</span><span>{formatNumber(m.minLimit, 0)} - {formatNumber(m.maxLimit, 0)} {m.fiat}</span></div>
                  <div className="flex flex-wrap items-center gap-1 mt-1">{m.paymentMethods.map((p) => <span key={p} className="rounded bg-secondary px-2 py-0.5 text-xs">{p}</span>)}</div>
                </div>
                <Button onClick={() => { setSelected(m); setOrderAmount(""); }} className={tradeType === "buy" ? "bg-[oklch(0.72_0.19_160)] hover:bg-[oklch(0.65_0.19_160)] text-white" : "bg-destructive hover:bg-destructive/90"}>
                  {tradeType === "buy" ? "Buy" : "Sell"} {m.crypto}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tradeType === "buy" ? "Buy" : "Sell"} {selected?.crypto}</DialogTitle>
            <DialogDescription>{tradeType === "buy" ? "Buy from" : "Sell to"} {selected?.name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-primary">{formatNumber(selected.price, 0)} {selected.fiat}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Amount ({selected.fiat})</label>
                <Input type="number" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} placeholder={`Min ${formatNumber(selected.minLimit, 0)}`} />
                {cryptoAmt > 0 && <p className="text-sm text-muted-foreground">You will {tradeType === "buy" ? "receive" : "send"}: <span className="font-bold text-foreground">{formatNumber(cryptoAmt)} {selected.crypto}</span></p>}
              </div>
              {orderPlaced && <p className="text-sm text-[oklch(0.72_0.19_160)]">Order placed (simulated)!</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button disabled={!isValidOrder || orderPlaced} onClick={placeOrder}>Place Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

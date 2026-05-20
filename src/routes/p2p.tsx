import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, MapPin, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/mock-data";
import { CURRENCIES, isSupportedCurrency } from "@/lib/currencies";
import { useGeo } from "@/hooks/use-geo";
import { useKycStatus } from "@/hooks/use-kyc";
import { KycModal } from "@/components/kyc/kyc-modal";

export const Route = createFileRoute("/p2p")({ component: P2PPage });

interface Ad {
  id: string;
  user_id: string;
  type: "buy" | "sell";
  crypto: string;
  currency: string;
  price: number;
  available: number;
  min_limit: number;
  max_limit: number;
  payment_methods: string[];
  notes: string | null;
}

function P2PPage() {
  const geo = useGeo();
  const navigate = useNavigate();
  const { data: kycStatus = "unverified" } = useKycStatus();
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [selectedFiat, setSelectedFiat] = useState<string>("USD");
  const [fiatTouched, setFiatTouched] = useState(false);
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<Ad | null>(null);
  const [orderAmount, setOrderAmount] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [kycGateOpen, setKycGateOpen] = useState(false);
  const [kycFormOpen, setKycFormOpen] = useState(false);

  const handlePostAd = () => {
    if (kycStatus === "verified") navigate({ to: "/post-ad" });
    else setKycGateOpen(true);
  };

  // Apply auto-detected currency once (only if user hasn't manually changed it)
  useEffect(() => {
    if (fiatTouched || !geo.data) return;
    setSelectedFiat(isSupportedCurrency(geo.data.currency) ? geo.data.currency : "USD");
  }, [geo.data, fiatTouched]);

  const adsQ = useQuery({
    queryKey: ["p2p_ads", selectedFiat, tradeType],
    queryFn: async (): Promise<Ad[]> => {
      const { data, error } = await supabase
        .from("p2p_ads")
        .select("id,user_id,type,crypto,currency,price,available,min_limit,max_limit,payment_methods,notes")
        .eq("is_active", true)
        .eq("currency", selectedFiat)
        .eq("type", tradeType)
        .order(tradeType === "buy" ? "price" : "price", { ascending: tradeType === "buy" })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Ad[];
    },
  });

  const filtered = (adsQ.data ?? []).filter((m) => {
    if (!amount) return true;
    const n = parseFloat(amount);
    return n >= m.min_limit && n <= m.max_limit;
  });

  const cryptoAmt = selected && orderAmount ? parseFloat(orderAmount) / selected.price : 0;
  const isValidOrder = selected && cryptoAmt > 0 &&
    parseFloat(orderAmount) >= selected.min_limit &&
    parseFloat(orderAmount) <= selected.max_limit;

  const placeOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => { setSelected(null); setOrderPlaced(false); setOrderAmount(""); }, 2000);
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">P2P Trading</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            Buy and sell directly with other users
            {geo.isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            {geo.data && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                <MapPin className="h-3 w-3" /> {geo.data.countryCode} · {geo.data.currency}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handlePostAd}><Plus className="mr-1 h-4 w-4" />Post Ad</Button>
          <Button variant="outline" size="icon" onClick={() => adsQ.refetch()}><RefreshCw className={`h-4 w-4 ${adsQ.isFetching ? "animate-spin" : ""}`} /></Button>
        </div>
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
        <Select value={selectedFiat} onValueChange={(v) => { setSelectedFiat(v); setFiatTouched(true); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={geo.isLoading ? "Detecting…" : "Currency"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[150px] max-w-[220px]">
          <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="pr-12" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{selectedFiat}</span>
        </div>
      </div>

      <div className="space-y-4">
        {adsQ.isLoading && (
          <Card className="border-border"><CardContent className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading ads…</CardContent></Card>
        )}
        {!adsQ.isLoading && filtered.length === 0 && (
          <Card className="border-border">
            <CardContent className="py-12 text-center text-muted-foreground space-y-3">
              <p>No {tradeType} ads in {selectedFiat} yet.</p>
              <Button asChild variant="outline" size="sm"><Link to="/post-ad"><Plus className="mr-1 h-4 w-4" />Post the first ad</Link></Button>
            </CardContent>
          </Card>
        )}
        {filtered.map((m) => (
          <Card key={m.id} className="border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                    {m.user_id.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">User {m.user_id.slice(0, 6)}</span>
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{m.crypto}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(m.price, 2)}<span className="text-sm font-normal text-muted-foreground ml-1">{m.currency}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">Available:</span><span className="font-medium">{formatNumber(m.available, 0)} {m.crypto}</span></div>
                  <div className="flex items-center gap-2"><span className="text-muted-foreground">Limit:</span><span>{formatNumber(m.min_limit, 0)} - {formatNumber(m.max_limit, 0)} {m.currency}</span></div>
                  <div className="flex flex-wrap items-center gap-1 mt-1">{m.payment_methods.map((p) => <span key={p} className="rounded bg-secondary px-2 py-0.5 text-xs">{p}</span>)}</div>
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
            <DialogDescription>{tradeType === "buy" ? "Buy from" : "Sell to"} User {selected?.user_id.slice(0, 6)}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-primary">{formatNumber(selected.price, 2)} {selected.currency}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Amount ({selected.currency})</label>
                <Input type="number" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} placeholder={`Min ${formatNumber(selected.min_limit, 0)}`} />
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

      <Dialog open={kycGateOpen} onOpenChange={setKycGateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Identity verification required</DialogTitle>
            <DialogDescription>Please complete your Identity Verification (KYC) to unlock P2P trading.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycGateOpen(false)}>Later</Button>
            {kycStatus === "pending" ? (
              <Button disabled>Pending review…</Button>
            ) : (
              <Button onClick={() => { setKycGateOpen(false); setKycFormOpen(true); }}>Verify Identity</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <KycModal open={kycFormOpen} onOpenChange={setKycFormOpen} />
    </div>
  );
}

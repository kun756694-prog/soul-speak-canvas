import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useGeo } from "@/hooks/use-geo";
import { useKycLevel } from "@/hooks/use-kyc";
import { CURRENCIES, PAYMENT_METHODS, isSupportedCurrency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/post-ad")({ component: PostAdPage });

function PostAdPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const geo = useGeo();
  const queryClient = useQueryClient();
  const { data: kyc, isLoading: kycLoading } = useKycLevel();
  const approvedLevel = kyc?.approvedLevel ?? 0;

  const [type, setType] = useState<"buy" | "sell">("sell");
  const [currency, setCurrency] = useState<string>("USD");
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState("");
  const [minLimit, setMinLimit] = useState("");
  const [maxLimit, setMaxLimit] = useState("");
  const [methods, setMethods] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Apply auto-detected currency once (if user hasn't manually changed it)
  useEffect(() => {
    if (!currencyTouched && geo.data?.currency && isSupportedCurrency(geo.data.currency)) {
      setCurrency(geo.data.currency);
    } else if (!currencyTouched && geo.data?.currency && !isSupportedCurrency(geo.data.currency)) {
      setCurrency("USD");
    }
  }, [geo.data, currencyTouched]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const payload = {
        user_id: user.id,
        type,
        crypto: "POINT",
        currency,
        country_code: geo.data?.countryCode ?? null,
        price: Number(price),
        available: Number(available),
        min_limit: Number(minLimit),
        max_limit: Number(maxLimit),
        payment_methods: methods,
        notes: notes || null,
      };
      const { error } = await supabase.from("p2p_ads").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ad posted");
      queryClient.invalidateQueries({ queryKey: ["p2p_ads"] });
      navigate({ to: "/p2p" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-muted-foreground">Please sign in to post an ad.</p>
        <Button asChild><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }
  if (!kycLoading && approvedLevel < 2) {
    return (
      <div className="mx-auto max-w-md p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Level 2 verification required</h2>
        <p className="text-sm text-muted-foreground">Posting P2P ads requires Level 2 (Live Selfie + Government ID).</p>
        <Button asChild><Link to="/profile">Go to verification</Link></Button>
      </div>
    );
  }

  const toggleMethod = (m: string) =>
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const valid =
    Number(price) > 0 && Number(available) > 0 &&
    Number(minLimit) > 0 && Number(maxLimit) >= Number(minLimit) &&
    methods.length > 0;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Post an Ad</h1>
        <p className="text-sm text-muted-foreground">List your offer on the P2P marketplace</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Ad details</CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {geo.isLoading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Detecting location…</>
            ) : geo.data ? (
              <><MapPin className="h-3 w-3" /> {geo.data.countryCode} · {geo.data.currency}</>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as "buy" | "sell")}>
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Currency">
              <Select value={currency} onValueChange={(v) => { setCurrency(v); setCurrencyTouched(true); }}>
                <SelectTrigger>
                  <SelectValue placeholder={geo.isLoading ? "Detecting…" : "Select currency"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={`Price (${currency} per POINT)`}>
              <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Available (POINT)">
              <Input type="number" inputMode="decimal" value={available} onChange={(e) => setAvailable(e.target.value)} placeholder="0" />
            </Field>
            <Field label={`Min limit (${currency})`}>
              <Input type="number" inputMode="decimal" value={minLimit} onChange={(e) => setMinLimit(e.target.value)} placeholder="0" />
            </Field>
            <Field label={`Max limit (${currency})`}>
              <Input type="number" inputMode="decimal" value={maxLimit} onChange={(e) => setMaxLimit(e.target.value)} placeholder="0" />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment methods</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => {
                const on = methods.includes(m);
                return (
                  <button key={m} type="button" onClick={() => toggleMethod(m)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Notes (optional)">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms, response time, etc." />
          </Field>

          <Button className="w-full" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting…</> : "Post Ad"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

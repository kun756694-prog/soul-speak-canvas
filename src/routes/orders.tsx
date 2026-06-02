import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Loader2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatDialog } from "@/components/p2p/chat-dialog";
import { formatNumber } from "@/lib/mock-data";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  fiat_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

function OrdersPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<Order | null>(null);

  const ordersQ = useQuery({
    queryKey: ["p2p_orders", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("p2p_orders")
        .select("id,buyer_id,seller_id,amount,fiat_amount,currency,status,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-muted-foreground mb-4">Sign in to view your P2P orders.</p>
        <Button asChild><Link to="/auth">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-bold mb-4">My P2P Orders</h1>
      {ordersQ.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {!ordersQ.isLoading && (ordersQ.data?.length ?? 0) === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Inbox className="mx-auto h-8 w-8 mb-2" />
            <p>No orders yet.</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {(ordersQ.data ?? []).map((o) => {
          const role = o.buyer_id === user.id ? "Buying" : "Selling";
          const other = o.buyer_id === user.id ? o.seller_id : o.buyer_id;
          return (
            <Card key={o.id} className="border-border">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{role} · {new Date(o.created_at).toLocaleString()}</p>
                  <p className="font-medium">{formatNumber(o.amount)} POINT · {formatNumber(o.fiat_amount, 2)} {o.currency}</p>
                  <p className="text-xs text-muted-foreground">With User {other.slice(0, 6)} · {o.status}</p>
                </div>
                <Button size="sm" onClick={() => setActive(o)}>
                  <MessageSquare className="mr-1 h-4 w-4" /> Chat
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <ChatDialog
        open={!!active}
        onOpenChange={(v) => { if (!v) setActive(null); }}
        orderId={active?.id ?? null}
        counterpartyLabel={active ? `User ${(active.buyer_id === user.id ? active.seller_id : active.buyer_id).slice(0, 6)}` : ""}
        meta={active ? { amount: active.amount, fiat: active.fiat_amount, currency: active.currency, crypto: "POINT" } : null}
      />
    </div>
  );
}

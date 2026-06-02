import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
  counterpartyLabel: string;
  meta?: { amount: number; fiat: number; currency: string; crypto: string } | null;
}

export function ChatDialog({ open, onOpenChange, orderId, counterpartyLabel, meta }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !orderId) return;
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    (async () => {
      const { data, error } = await supabase
        .from("p2p_messages")
        .select("id,order_id,sender_id,body,created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        if (error) toast.error(error.message);
        setMessages((data ?? []) as Message[]);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`p2p_messages:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "p2p_messages", filter: `order_id=eq.${orderId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [open, orderId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || !orderId || !user) return;
    setSending(true);
    const { error } = await supabase
      .from("p2p_messages")
      .insert({ order_id: orderId, sender_id: user.id, body: trimmed });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle>Chat with {counterpartyLabel}</DialogTitle>
          {meta && (
            <DialogDescription>
              {meta.amount} {meta.crypto} · {meta.fiat} {meta.currency}
            </DialogDescription>
          )}
        </DialogHeader>
        <div ref={scrollRef} className="h-80 overflow-y-auto bg-secondary/30 p-4 space-y-2">
          {loading && (
            <div className="flex items-center justify-center text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">Say hi — no messages yet.</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <form
          className="flex items-center gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            maxLength={2000}
            disabled={!orderId || sending}
          />
          <Button type="submit" size="icon" disabled={!body.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

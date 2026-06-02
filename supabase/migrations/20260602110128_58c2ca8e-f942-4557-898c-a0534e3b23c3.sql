
-- P2P orders (conversations between buyer and seller)
CREATE TABLE public.p2p_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.p2p_ads(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount numeric NOT NULL,
  fiat_amount numeric NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.p2p_orders TO authenticated;
GRANT ALL ON public.p2p_orders TO service_role;

ALTER TABLE public.p2p_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants read orders" ON public.p2p_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "buyer creates order" ON public.p2p_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id AND buyer_id <> seller_id);

CREATE POLICY "participants update order" ON public.p2p_orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE INDEX idx_p2p_orders_buyer ON public.p2p_orders(buyer_id, created_at DESC);
CREATE INDEX idx_p2p_orders_seller ON public.p2p_orders(seller_id, created_at DESC);

-- Messages
CREATE TABLE public.p2p_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.p2p_orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.p2p_messages TO authenticated;
GRANT ALL ON public.p2p_messages TO service_role;

ALTER TABLE public.p2p_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants read messages" ON public.p2p_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.p2p_orders o
    WHERE o.id = order_id AND (auth.uid() = o.buyer_id OR auth.uid() = o.seller_id OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "participants send messages" ON public.p2p_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.p2p_orders o
      WHERE o.id = order_id AND (auth.uid() = o.buyer_id OR auth.uid() = o.seller_id)
    )
  );

CREATE INDEX idx_p2p_messages_order ON public.p2p_messages(order_id, created_at);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.p2p_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.p2p_orders;

-- Touch updated_at on order
CREATE OR REPLACE FUNCTION public.touch_p2p_orders_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_p2p_orders_touch
BEFORE UPDATE ON public.p2p_orders
FOR EACH ROW EXECUTE FUNCTION public.touch_p2p_orders_updated_at();

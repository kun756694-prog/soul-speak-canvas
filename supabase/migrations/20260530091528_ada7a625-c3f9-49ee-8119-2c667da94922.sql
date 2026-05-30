
CREATE OR REPLACE FUNCTION public.transfer_points_by_id(_recipient_id uuid, _amount numeric, _notes text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cur numeric;
  recv_exists boolean;
  sender_name text;
  recv_name text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _recipient_id IS NULL THEN RAISE EXCEPTION 'Account ID not found'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF _recipient_id = uid THEN RAISE EXCEPTION 'cannot transfer to your own account'; END IF;

  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _recipient_id) INTO recv_exists;
  IF NOT recv_exists THEN RAISE EXCEPTION 'Account ID not found'; END IF;

  SELECT balance INTO cur FROM public.wallets WHERE user_id = uid FOR UPDATE;
  IF cur IS NULL OR cur < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  -- ensure recipient wallet row exists
  INSERT INTO public.wallets (user_id, balance) VALUES (_recipient_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallets SET balance = balance - _amount, updated_at = now() WHERE user_id = uid;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE user_id = _recipient_id;

  SELECT name INTO sender_name FROM public.profiles WHERE id = uid;
  SELECT name INTO recv_name FROM public.profiles WHERE id = _recipient_id;

  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes)
  VALUES (uid, 'transfer_out', _amount, 'POINT', 'completed', coalesce(_notes, 'To ' || coalesce(recv_name, _recipient_id::text)));
  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes)
  VALUES (_recipient_id, 'transfer_in', _amount, 'POINT', 'completed', 'From ' || coalesce(sender_name, uid::text));
END;
$$;

-- Lookup helper: returns recipient display name if account exists, else null.
-- SECURITY DEFINER so users can validate IDs without broad profile read access.
CREATE OR REPLACE FUNCTION public.lookup_account(_recipient_id uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name FROM public.profiles p WHERE p.id = _recipient_id LIMIT 1;
$$;

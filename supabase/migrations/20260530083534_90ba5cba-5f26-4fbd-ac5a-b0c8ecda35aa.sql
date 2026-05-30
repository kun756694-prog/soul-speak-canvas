
-- 1) Fix deposit_points: do not credit instantly; create a pending transaction for admin review.
CREATE OR REPLACE FUNCTION public.deposit_points(_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount <= 0 OR _amount > 1000000000 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes)
  VALUES (uid, 'deposit', _amount, 'POINT', 'pending', 'Awaiting admin verification');
END; $$;

-- 2) Fix transfer_points: actually credit the recipient atomically.
CREATE OR REPLACE FUNCTION public.transfer_points(_username text, _amount numeric, _notes text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cur numeric;
  recv_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;

  SELECT id INTO recv_id FROM public.profiles WHERE name = _username LIMIT 1;
  IF recv_id IS NULL THEN RAISE EXCEPTION 'recipient not found'; END IF;
  IF recv_id = uid THEN RAISE EXCEPTION 'cannot transfer to self'; END IF;

  SELECT balance INTO cur FROM public.wallets WHERE user_id = uid FOR UPDATE;
  IF cur IS NULL OR cur < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  UPDATE public.wallets SET balance = balance - _amount, updated_at = now() WHERE user_id = uid;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE user_id = recv_id;

  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes)
  VALUES (uid, 'transfer_out', _amount, 'POINT', 'completed', coalesce(_notes, 'To ' || _username));
  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes)
  VALUES (recv_id, 'transfer_in', _amount, 'POINT', 'completed', 'From ' || coalesce((SELECT name FROM public.profiles WHERE id = uid), uid::text));
END; $$;

-- 3) Prevent self-elevation of privileged profile columns.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.kyc_status := OLD.kyc_status;
  NEW.kyc_level := OLD.kyc_level;
  NEW.total_trades := OLD.total_trades;
  NEW.completion_rate := OLD.completion_rate;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_cols ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_cols
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_cols();

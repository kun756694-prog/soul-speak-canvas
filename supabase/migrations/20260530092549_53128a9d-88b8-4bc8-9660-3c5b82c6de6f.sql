
-- Multi-level KYC: add level + selfie path to submissions
ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS level int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS selfie_path text;

ALTER TABLE public.kyc_submissions
  ADD CONSTRAINT kyc_submissions_level_chk CHECK (level BETWEEN 1 AND 3);

CREATE INDEX IF NOT EXISTS kyc_submissions_user_level_idx
  ON public.kyc_submissions(user_id, level, submitted_at DESC);

-- Sync profile.kyc_level (max approved) and kyc_status (latest submission status)
CREATE OR REPLACE FUNCTION public.sync_profile_kyc_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_lvl int;
  latest_status kyc_status;
BEGIN
  SELECT COALESCE(MAX(level), 0) INTO max_lvl
  FROM public.kyc_submissions
  WHERE user_id = NEW.user_id AND status = 'verified';

  SELECT status INTO latest_status
  FROM public.kyc_submissions
  WHERE user_id = NEW.user_id
  ORDER BY submitted_at DESC
  LIMIT 1;

  UPDATE public.profiles
  SET kyc_level = GREATEST(COALESCE(kyc_level, 1), max_lvl),
      kyc_status = COALESCE(latest_status, kyc_status)
  WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS kyc_submissions_sync_profile ON public.kyc_submissions;
CREATE TRIGGER kyc_submissions_sync_profile
AFTER INSERT OR UPDATE ON public.kyc_submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_kyc_status();

-- P2P ads now require kyc_level >= 2 (Level 2 verified)
CREATE OR REPLACE FUNCTION public.validate_p2p_ad()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  k_lvl int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NEW.user_id <> uid AND NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'cannot create or modify ads for another user';
  END IF;

  IF NOT public.has_role(uid, 'admin') THEN
    SELECT kyc_level INTO k_lvl FROM public.profiles WHERE id = uid;
    IF COALESCE(k_lvl, 1) < 2 THEN
      RAISE EXCEPTION 'Level 2 KYC verification required to post P2P ads';
    END IF;
  END IF;

  IF NEW.price IS NULL OR NEW.price <= 0 OR NEW.price > 1e12 THEN RAISE EXCEPTION 'invalid price'; END IF;
  IF NEW.available IS NULL OR NEW.available <= 0 OR NEW.available > 1e12 THEN RAISE EXCEPTION 'invalid available amount'; END IF;
  IF NEW.min_limit IS NULL OR NEW.max_limit IS NULL OR NEW.min_limit < 0 OR NEW.max_limit <= 0 OR NEW.min_limit > NEW.max_limit THEN
    RAISE EXCEPTION 'invalid trade limits'; END IF;
  IF NEW.currency IS NULL OR length(NEW.currency) < 2 OR length(NEW.currency) > 8 THEN RAISE EXCEPTION 'invalid currency'; END IF;
  IF NEW.payment_methods IS NULL OR array_length(NEW.payment_methods, 1) IS NULL THEN RAISE EXCEPTION 'at least one payment method required'; END IF;
  IF array_length(NEW.payment_methods, 1) > 10 THEN RAISE EXCEPTION 'too many payment methods'; END IF;
  RETURN NEW;
END; $$;

-- Transfer requires Level 2 verification
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
  k_lvl int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _recipient_id IS NULL THEN RAISE EXCEPTION 'Account ID not found'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF _recipient_id = uid THEN RAISE EXCEPTION 'cannot transfer to your own account'; END IF;

  IF NOT public.has_role(uid, 'admin') THEN
    SELECT kyc_level INTO k_lvl FROM public.profiles WHERE id = uid;
    IF COALESCE(k_lvl, 1) < 2 THEN
      RAISE EXCEPTION 'Level 2 KYC verification required to transfer points';
    END IF;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _recipient_id) INTO recv_exists;
  IF NOT recv_exists THEN RAISE EXCEPTION 'Account ID not found'; END IF;

  SELECT balance INTO cur FROM public.wallets WHERE user_id = uid FOR UPDATE;
  IF cur IS NULL OR cur < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  INSERT INTO public.wallets (user_id, balance) VALUES (_recipient_id, 0) ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallets SET balance = balance - _amount, updated_at = now() WHERE user_id = uid;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE user_id = _recipient_id;

  SELECT name INTO sender_name FROM public.profiles WHERE id = uid;
  SELECT name INTO recv_name FROM public.profiles WHERE id = _recipient_id;

  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes)
  VALUES (uid, 'transfer_out', _amount, 'POINT', 'completed', coalesce(_notes, 'To ' || coalesce(recv_name, _recipient_id::text)));
  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes)
  VALUES (_recipient_id, 'transfer_in', _amount, 'POINT', 'completed', 'From ' || coalesce(sender_name, uid::text));
END; $$;

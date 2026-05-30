
-- =========================
-- P2P ADS: KYC + value validation trigger
-- =========================
CREATE OR REPLACE FUNCTION public.validate_p2p_ad()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  k_status kyc_status;
BEGIN
  -- Must be authenticated and own the row
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NEW.user_id <> uid AND NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'cannot create or modify ads for another user';
  END IF;

  -- Require verified KYC (admins exempt)
  IF NOT public.has_role(uid, 'admin') THEN
    SELECT kyc_status INTO k_status FROM public.profiles WHERE id = uid;
    IF k_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'KYC verification required to post P2P ads';
    END IF;
  END IF;

  -- Value sanity checks
  IF NEW.price IS NULL OR NEW.price <= 0 OR NEW.price > 1e12 THEN
    RAISE EXCEPTION 'invalid price';
  END IF;
  IF NEW.available IS NULL OR NEW.available <= 0 OR NEW.available > 1e12 THEN
    RAISE EXCEPTION 'invalid available amount';
  END IF;
  IF NEW.min_limit IS NULL OR NEW.max_limit IS NULL
     OR NEW.min_limit < 0 OR NEW.max_limit <= 0
     OR NEW.min_limit > NEW.max_limit THEN
    RAISE EXCEPTION 'invalid trade limits';
  END IF;
  IF NEW.currency IS NULL OR length(NEW.currency) < 2 OR length(NEW.currency) > 8 THEN
    RAISE EXCEPTION 'invalid currency';
  END IF;
  IF NEW.payment_methods IS NULL OR array_length(NEW.payment_methods, 1) IS NULL THEN
    RAISE EXCEPTION 'at least one payment method required';
  END IF;
  IF array_length(NEW.payment_methods, 1) > 10 THEN
    RAISE EXCEPTION 'too many payment methods';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_p2p_ad_ins ON public.p2p_ads;
DROP TRIGGER IF EXISTS trg_validate_p2p_ad_upd ON public.p2p_ads;

CREATE TRIGGER trg_validate_p2p_ad_ins
BEFORE INSERT ON public.p2p_ads
FOR EACH ROW EXECUTE FUNCTION public.validate_p2p_ad();

CREATE TRIGGER trg_validate_p2p_ad_upd
BEFORE UPDATE ON public.p2p_ads
FOR EACH ROW EXECUTE FUNCTION public.validate_p2p_ad();

-- =========================
-- DEPOSIT: rate-limit pending requests
-- =========================
CREATE OR REPLACE FUNCTION public.deposit_points(_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  pending_count int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 1000000 THEN
    RAISE EXCEPTION 'invalid amount (must be between 1 and 1,000,000)';
  END IF;

  SELECT count(*) INTO pending_count
  FROM public.transactions
  WHERE user_id = uid AND type = 'deposit' AND status = 'pending';

  IF pending_count >= 5 THEN
    RAISE EXCEPTION 'too many pending deposit requests; wait for admin review';
  END IF;

  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes)
  VALUES (uid, 'deposit', _amount, 'POINT', 'pending', 'Awaiting admin verification');
END;
$$;

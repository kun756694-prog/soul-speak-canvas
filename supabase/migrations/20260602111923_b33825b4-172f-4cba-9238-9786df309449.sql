-- Add receipt_path to transactions for deposit proof images
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_path text;

-- Allow admins to update deposit transactions (approve/reject)
CREATE POLICY "admins update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins read all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for deposit_receipts
-- Users upload to their own folder: <user_id>/...
CREATE POLICY "users upload own deposit receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'deposit_receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users read own deposit receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'deposit_receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- Update deposit_points RPC to accept an optional receipt path
CREATE OR REPLACE FUNCTION public.deposit_points(_amount numeric, _receipt_path text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  SELECT count(*) INTO pending_count FROM public.transactions
  WHERE user_id = uid AND type = 'deposit' AND status = 'pending';
  IF pending_count >= 5 THEN
    RAISE EXCEPTION 'too many pending deposit requests; wait for admin review';
  END IF;

  IF _receipt_path IS NOT NULL AND _receipt_path <> '' THEN
    IF split_part(_receipt_path, '/', 1) <> uid::text THEN
      RAISE EXCEPTION 'invalid receipt path';
    END IF;
  END IF;

  INSERT INTO public.transactions (user_id, type, amount, currency, status, notes, receipt_path)
  VALUES (uid, 'deposit', _amount, 'POINT', 'pending', 'Awaiting admin verification', _receipt_path);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.deposit_points(numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.deposit_points(numeric, text) TO authenticated;
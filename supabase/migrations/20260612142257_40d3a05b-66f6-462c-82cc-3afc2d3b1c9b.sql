REVOKE EXECUTE ON FUNCTION public.deposit_points(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deposit_points(numeric, text) TO authenticated, service_role;
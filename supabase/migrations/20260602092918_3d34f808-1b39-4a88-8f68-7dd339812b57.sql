REVOKE EXECUTE ON FUNCTION public.lookup_account(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.transfer_points_by_id(uuid, numeric, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_p2p_ad() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_cols() FROM anon, PUBLIC;
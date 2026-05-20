
revoke all on function public.sync_profile_kyc_status() from public, anon, authenticated;
revoke all on function public.touch_p2p_ads_updated_at() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

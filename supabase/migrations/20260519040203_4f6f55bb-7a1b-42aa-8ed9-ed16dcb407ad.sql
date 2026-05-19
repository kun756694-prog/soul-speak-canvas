
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.deposit_points(numeric) from public, anon;
revoke execute on function public.withdraw_points(numeric, text) from public, anon;
revoke execute on function public.transfer_points(text, numeric, text) from public, anon;
grant execute on function public.deposit_points(numeric) to authenticated;
grant execute on function public.withdraw_points(numeric, text) to authenticated;
grant execute on function public.transfer_points(text, numeric, text) to authenticated;

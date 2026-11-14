-- Stage 13: players can delete their own account.

/**
 * Run just before an account is deleted. Leagues it created pass to their longest-standing
 * other member, so deleting one player never deletes a league full of others. A league
 * with nobody else in it is deleted along with the account.
 */
create function public.prepare_account_deletion(p_user_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.leagues l
  set owner_id = (
    select m.user_id from public.league_members m
    where m.league_id = l.id and m.user_id <> p_user_id
    order by m.joined_at, m.user_id
    limit 1
  )
  where l.owner_id = p_user_id
    and exists (
      select 1 from public.league_members m
      where m.league_id = l.id and m.user_id <> p_user_id
    );
$$;

revoke execute on function public.prepare_account_deletion(uuid) from public, anon, authenticated;

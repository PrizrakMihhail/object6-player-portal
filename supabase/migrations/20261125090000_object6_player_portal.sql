begin;

do $$
begin
  if to_regprocedure('object6_private.object6_register(text,text[],text,text,text)') is null
    or to_regprocedure('object6_private.require_user(text)') is null
    or to_regprocedure('public.object6_login(text,text)') is null
    or to_regprocedure('public.object6_logout(text)') is null then
    raise exception 'Apply the Object 6 account migrations before enabling the player portal';
  end if;
end;
$$;

alter table public.object6_users
  add column if not exists email text,
  add column if not exists telegram text,
  add column if not exists char_name text,
  add column if not exists faction text,
  add column if not exists reg_status text;

create unique index if not exists object6_users_player_email_unique
  on public.object6_users (lower(btrim(email))) where email is not null;

-- Keep any existing Data API grants on the legacy columns only.
do $$
declare
  player_columns text[] := array['email', 'telegram', 'char_name', 'faction', 'reg_status'];
  legacy_columns text;
  old_grant record;
begin
  select string_agg(quote_ident(attname), ', ' order by attnum) into legacy_columns
  from pg_attribute
  where attrelid = 'public.object6_users'::regclass and attnum > 0 and not attisdropped
    and attname <> all (player_columns);

  for old_grant in
    select privilege_type, is_grantable,
      case when grantee = 'PUBLIC' then 'PUBLIC' else quote_ident(grantee) end as grantee_sql
    from information_schema.table_privileges
    where table_schema = 'public' and table_name = 'object6_users'
      and grantee in ('PUBLIC', 'anon', 'authenticated')
      and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
  loop
    execute format('revoke %s on public.object6_users from %s',
      old_grant.privilege_type, old_grant.grantee_sql);
    execute format('grant %s (%s) on public.object6_users to %s%s',
      old_grant.privilege_type, legacy_columns, old_grant.grantee_sql,
      case when old_grant.is_grantable = 'YES' then ' with grant option' else '' end);
  end loop;
end;
$$;

revoke select (email, telegram, char_name, faction, reg_status),
  insert (email, telegram, char_name, faction, reg_status),
  update (email, telegram, char_name, faction, reg_status),
  references (email, telegram, char_name, faction, reg_status)
  on public.object6_users from public, anon, authenticated;

create or replace function public.object6_player_register(
  p_email text, p_password text, p_telegram text, p_char_name text, p_faction text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_telegram text := nullif(btrim(p_telegram), '');
  v_char_name text := nullif(btrim(p_char_name), '');
  v_faction text := nullif(btrim(p_faction), '');
  v_id text := left(replace(gen_random_uuid()::text, '-', ''), 16);
  v_username text := 'player-' || v_id;
  v_document text := 'P-' || v_id;
  v_constraint text;
begin
  if v_email is null or char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    or p_password is null or char_length(p_password) < 8 or octet_length(p_password) > 72
    or v_char_name is null or char_length(v_char_name) > 64 or char_length(v_faction) > 64
    or v_telegram !~ '^@?[A-Za-z0-9_]{5,32}$' then
    raise sqlstate 'PT400' using message = 'invalid_registration';
  end if;

  if exists (
    select 1 from public.object6_users u
    where u.email is not null and lower(btrim(u.email)) = v_email
  ) then
    raise sqlstate 'PT409' using message = 'email_taken';
  end if;

  -- Delegate credential creation to the same registration function as the Network.
  perform object6_private.object6_register(v_username, array['CITIZEN']::text[], null, v_document, p_password);
  update public.object6_users
  set email = v_email,
    telegram = case when v_telegram is not null then '@' || ltrim(v_telegram, '@') end,
    char_name = v_char_name,
    faction = v_faction,
    reg_status = 'pending'
  where username = v_username and lower(btrim(id_number)) = lower(v_document);

  if not found then
    raise exception 'Player profile was not created';
  end if;
exception when unique_violation then
  get stacked diagnostics v_constraint = constraint_name;
  if v_constraint = 'object6_users_player_email_unique' then
    raise sqlstate 'PT409' using message = 'email_taken';
  end if;
  raise;
end;
$$;

create or replace function public.object6_player_profile(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_user uuid := object6_private.require_user(p_token);
  v_profile jsonb;
begin
  select jsonb_build_object('email', u.email, 'telegram', u.telegram,
    'char_name', u.char_name, 'faction', u.faction, 'reg_status', u.reg_status)
    into v_profile
  from public.object6_users u
  where u."UUID" = v_user and u.email is not null;

  if v_profile is null then
    raise sqlstate 'PT401' using message = 'session_expired';
  end if;
  return v_profile;
end;
$$;

create or replace function public.object6_player_login(p_email text, p_password text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_user uuid;
  v_username text;
  v_result jsonb;
  v_token text;
begin
  if v_email is null or char_length(v_email) > 254 or p_password is null or octet_length(p_password) > 72 then
    return jsonb_build_object('error', 'invalid_credentials');
  end if;

  select u."UUID", u.username into v_user, v_username
  from public.object6_users u
  where u.email is not null and lower(btrim(u.email)) = v_email;

  if v_user is null then
    return jsonb_build_object('error', 'invalid_credentials');
  end if;

  v_result := public.object6_login(v_username, p_password);
  if v_result ? 'error' then
    return jsonb_build_object('error', v_result ->> 'error');
  end if;

  v_token := v_result ->> 'token';
  if v_token is null then
    return jsonb_build_object('error', 'invalid_credentials');
  end if;
  if object6_private.require_user(v_token) is distinct from v_user then
    perform public.object6_logout(v_token);
    return jsonb_build_object('error', 'invalid_credentials');
  end if;

  return jsonb_build_object('token', v_token, 'profile', public.object6_player_profile(v_token));
end;
$$;

revoke execute on function public.object6_player_register(text, text, text, text, text),
  public.object6_player_profile(text), public.object6_player_login(text, text)
  from public, anon, authenticated;
grant execute on function public.object6_player_register(text, text, text, text, text),
  public.object6_player_profile(text), public.object6_player_login(text, text)
  to anon, authenticated;

notify pgrst, 'reload schema';
commit;

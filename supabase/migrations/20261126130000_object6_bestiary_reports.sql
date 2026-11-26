begin;

alter table public.object6_messages alter column "from" drop not null;

-- The report form has one destination and does not accept sender or recipient IDs.
create or replace function public.object6_send_bestiary_report(p_uuid uuid, p_title text, p_message text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  subject_prefix constant text := 'Перехват в Олегус: ';
  subject text := btrim(p_title);
  recipient uuid;
begin
  if p_uuid is null or subject is null or subject !~ '[^[:space:]]'
    or char_length(subject_prefix || subject) > 120
    or p_message is null or p_message !~ '[^[:space:]]' or char_length(p_message) > 10000 then
    raise sqlstate 'PT400' using message = 'invalid_message';
  end if;

  select u."UUID" into strict recipient
  from public.object6_users u
  where lower(btrim(u.username)) = '1984' or lower(btrim(u.id_number)) = '1984';

  insert into public.object6_messages ("UUID", "from", "to", title, message, sent, unread)
  values (p_uuid, null, recipient, subject_prefix || subject, p_message, now(), 'Yes')
  on conflict ("UUID") do nothing;

  if not found and not exists (
    select 1 from public.object6_messages m
    where m."UUID" = p_uuid and m."from" is null and m."to" = recipient
      and m.title = subject_prefix || subject and m.message = p_message
  ) then
    raise sqlstate 'PT409' using message = 'message_conflict';
  end if;
exception
  when no_data_found then
    raise sqlstate 'PT404' using message = 'recipient_not_found';
  when too_many_rows then
    raise sqlstate 'PT409' using message = 'recipient_ambiguous';
end;
$$;

create or replace function public.object6_inbox(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  recipient uuid := object6_private.require_user(p_token);
  messages jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'uuid', m."UUID", 'sender', coalesce(u.username, m."from"::text, 'Гость'),
    'title', m.title, 'sent', m.sent, 'unread', m.unread = 'Yes'
  ) order by m.sent desc nulls last, m."UUID" desc), '[]'::jsonb)
  into messages
  from public.object6_messages m
  left join public.object6_users u on u."UUID" = m."from"
  where m."to" = recipient and not m.deleted_from_inbox;
  return messages;
end;
$$;

create or replace function public.object6_message_notifications(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  recipient uuid := object6_private.require_user(p_token);
  notifications jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'uuid', m."UUID", 'sender', coalesce(u.username, m."from"::text, 'Гость'),
    'title', left(m.title, 120), 'preview', left(m.message, 180), 'sent', m.sent
  ) order by m.sent desc nulls last, m."UUID" desc), '[]'::jsonb)
  into notifications
  from public.object6_messages m
  left join public.object6_users u on u."UUID" = m."from"
  where m."to" = recipient and m.unread = 'Yes' and not m.deleted_from_inbox;
  return notifications;
end;
$$;

create or replace function public.object6_read_message(p_token text, p_uuid uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  recipient uuid := object6_private.require_user(p_token);
  message jsonb;
begin
  select jsonb_build_object(
    'uuid', m."UUID", 'sender', coalesce(u.username, m."from"::text, 'Гость'),
    'sender_is_guest', m."from" is null,
    'title', m.title, 'sent', m.sent, 'message', m.message
  ) into message
  from public.object6_messages m
  left join public.object6_users u on u."UUID" = m."from"
  where m."UUID" = p_uuid and m."to" = recipient and not m.deleted_from_inbox;

  if not found then
    raise sqlstate 'PT404' using message = 'message_not_found';
  end if;

  update public.object6_messages set unread = 'No'
  where "UUID" = p_uuid and "to" = recipient and unread = 'Yes' and not deleted_from_inbox;
  return message;
end;
$$;

revoke execute on function public.object6_send_bestiary_report(uuid, text, text) from public;
grant execute on function public.object6_send_bestiary_report(uuid, text, text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;

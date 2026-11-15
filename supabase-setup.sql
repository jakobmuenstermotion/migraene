-- Blob Collector: Cloud-Sync des Spielstands (Supabase)
-- Einmalig im Supabase-Projekt ausführen: SQL Editor -> New query -> einfügen -> Run.
--
-- Sicherheit: Die Tabelle ist für die öffentliche API komplett gesperrt (RLS an, keine Policies, keine Rechte).
-- Zugriff gibt es nur über die zwei Funktionen unten, und nur wer den langen, zufälligen Sync-Code kennt,
-- kommt an einen Spielstand. Man kann keine Codes auflisten.
-- Gespeichert wird nur der Spielstand des Spiels (keine Gesundheitsdaten).

create table if not exists public.game_saves (
  code       text primary key check (length(code) between 16 and 64),
  payload    text not null,
  saved_at   bigint not null,
  device     text,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;
revoke all on table public.game_saves from anon, authenticated;

-- Spielstand (oder nur Infos dazu) holen. Gibt null zurück, wenn es den Code nicht gibt.
create or replace function public.save_get(p_code text, p_with_payload boolean default true)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare r public.game_saves;
begin
  select * into r from public.game_saves where code = p_code;
  if not found then
    return null;
  end if;
  return json_build_object(
    'saved_at',   r.saved_at,
    'device',     r.device,
    'updated_at', r.updated_at,
    'payload',    case when p_with_payload then r.payload else null end
  );
end;
$$;

-- Spielstand hochladen. Schutz gegen versehentliches Überschreiben:
-- Nur wenn der Stand, auf dem dieses Gerät aufbaut (p_base), noch der aktuelle in der Cloud ist
-- (oder p_force gesetzt ist). Sonst kommt {"ok":false, "remote_saved_at":...} zurück.
create or replace function public.save_put(
  p_code text, p_payload text, p_saved_at bigint, p_device text, p_base bigint default null, p_force boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare cur bigint;
begin
  if p_code is null or length(p_code) < 16 or length(p_code) > 64 then
    raise exception 'ungueltiger Code';
  end if;
  if p_payload is null or length(p_payload) > 3000000 then
    raise exception 'Spielstand zu gross';
  end if;

  select saved_at into cur from public.game_saves where code = p_code for update;
  if found and not coalesce(p_force, false) and (p_base is null or cur > p_base) then
    return json_build_object('ok', false, 'remote_saved_at', cur);
  end if;

  insert into public.game_saves (code, payload, saved_at, device, updated_at)
  values (p_code, p_payload, p_saved_at, p_device, now())
  on conflict (code) do update
    set payload = excluded.payload, saved_at = excluded.saved_at, device = excluded.device, updated_at = now();

  return json_build_object('ok', true);
end;
$$;

-- Cloud-Kopie löschen (für „Sync ausschalten und Cloud-Kopie löschen“).
create or replace function public.save_delete(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.game_saves where code = p_code;
  return json_build_object('ok', true);
end;
$$;

revoke all on function public.save_get(text, boolean) from public;
revoke all on function public.save_put(text, text, bigint, text, bigint, boolean) from public;
revoke all on function public.save_delete(text) from public;
grant execute on function public.save_get(text, boolean) to anon, authenticated;
grant execute on function public.save_put(text, text, bigint, text, bigint, boolean) to anon, authenticated;
grant execute on function public.save_delete(text) to anon, authenticated;

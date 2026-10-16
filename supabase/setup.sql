-- Run once in the SQL Editor of your own Supabase project.
-- The game never needs a service_role key or database password.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists garden_private;
revoke all on schema garden_private from public, anon, authenticated;
create table if not exists garden_private.settings (
 id boolean primary key default true check(id),
 invite_hash text,
 max_saves integer not null default 10 check(max_saves between 1 and 100)
);
insert into garden_private.settings(id) values(true) on conflict do nothing;
create table if not exists garden_private.saves (
 id text primary key,
 revision bigint not null,
 payload jsonb not null,
 updated_at bigint not null
);
create table if not exists garden_private.history (
 id text not null references garden_private.saves(id) on delete cascade,
 revision bigint not null,
 payload jsonb not null,
 updated_at bigint not null,
 primary key(id,revision)
);
alter table garden_private.settings enable row level security;
alter table garden_private.saves enable row level security;
alter table garden_private.history enable row level security;
revoke all on all tables in schema garden_private from public, anon, authenticated;

create or replace function public.garden_read(p_id text,p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s garden_private.saves;
begin
 if p_id is null or p_token is null or p_id !~ '^[a-f0-9]{64}$' or p_token !~ '^[A-Za-z0-9_-]{43}$' or pg_catalog.encode(extensions.digest(p_token,'sha256'),'hex')<>p_id then
  raise sqlstate 'PT401' using message='Invalid save key';
 end if;
 select * into s from garden_private.saves where id=p_id;
 if not found then return null; end if;
 return pg_catalog.jsonb_build_object('revision',s.revision,'payload',s.payload,'updatedAt',s.updated_at);
end; $$;

create or replace function public.garden_write(p_id text,p_token text,p_expected bigint,p_payload jsonb,p_invite text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s garden_private.saves; cfg garden_private.settings; next_revision bigint; stamp bigint;
begin
 if p_id is null or p_token is null or p_id !~ '^[a-f0-9]{64}$' or p_token !~ '^[A-Za-z0-9_-]{43}$' or pg_catalog.encode(extensions.digest(p_token,'sha256'),'hex')<>p_id then
  raise sqlstate 'PT401' using message='Invalid save key';
 end if;
 if p_expected is null or p_expected<0 or p_payload is null or pg_catalog.octet_length(p_payload::text)>1048576 or p_payload->>'version' is distinct from '1' or coalesce(p_payload->>'iv','') !~ '^[A-Za-z0-9_-]{16}$' or coalesce(p_payload->>'ciphertext','') !~ '^[A-Za-z0-9_-]{22,}$' then
  raise sqlstate 'PT400' using message='Invalid encrypted save';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id,0));
 select * into s from garden_private.saves where id=p_id for update;
 if found then
  if s.revision<>p_expected then raise sqlstate 'PT409' using message='Save changed on another device'; end if;
 else
  if p_expected<>0 then raise sqlstate 'PT409' using message='Save changed on another device'; end if;
  perform pg_catalog.pg_advisory_xact_lock(723645920::bigint);
  select * into cfg from garden_private.settings where id=true;
  if cfg.invite_hash is null then raise sqlstate 'PT503' using message='Save creation is not configured'; end if;
  if p_invite is null or pg_catalog.encode(extensions.digest(p_invite,'sha256'),'hex')<>cfg.invite_hash then raise sqlstate 'PT403' using message='Invitation required'; end if;
  if (select count(*) from garden_private.saves)>=cfg.max_saves then raise sqlstate 'PT507' using message='Save capacity reached'; end if;
 end if;
 next_revision:=coalesce(s.revision,0)+1;
 stamp:=(extract(epoch from pg_catalog.clock_timestamp())*1000)::bigint;
 -- Store only the encrypted envelope, never arbitrary extra JSON properties.
 p_payload:=pg_catalog.jsonb_build_object('version',1,'iv',p_payload->>'iv','ciphertext',p_payload->>'ciphertext');
 insert into garden_private.saves(id,revision,payload,updated_at) values(p_id,next_revision,p_payload,stamp)
 on conflict(id) do update set revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at;
 insert into garden_private.history(id,revision,payload,updated_at) values(p_id,next_revision,p_payload,stamp);
 delete from garden_private.history where id=p_id and revision<=next_revision-10;
 return pg_catalog.jsonb_build_object('revision',next_revision,'updatedAt',stamp);
end; $$;
revoke all on function public.garden_read(text,text) from public;
revoke all on function public.garden_write(text,text,bigint,jsonb,text) from public;
grant execute on function public.garden_read(text,text) to anon,authenticated;
grant execute on function public.garden_write(text,text,bigint,jsonb,text) to anon,authenticated;

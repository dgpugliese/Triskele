-- Triskele initial schema.
-- Server-side stores only ciphertext, wrapped key fragments, and quorum approval state.
-- It cannot decrypt vault contents. RLS prevents leaking blobs across users.

create extension if not exists "pgcrypto";

------------------------------------------------------------
-- Per-user identity: each user has an ECDH P-256 public key
-- (the matching private key never leaves the device).
------------------------------------------------------------
create table public.guardian_identities (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  display_name     text not null,
  public_key_jwk   jsonb not null,
  created_at       timestamptz not null default now()
);

------------------------------------------------------------
-- Vaults: encrypted blobs only.
------------------------------------------------------------
create table public.vaults (
  id               uuid primary key default gen_random_uuid(),
  short_id         text not null unique,
  owner_id         uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  description      text,
  ciphertext       text not null,
  iv               text not null,
  threshold        smallint not null check (threshold >= 2),
  total_shares     smallint not null check (total_shares >= threshold),
  encryption_algo  text not null default 'AES-GCM-256',
  status           text not null default 'sealed' check (status in ('sealed','unsealing','unsealed','revoked')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on public.vaults(owner_id);

------------------------------------------------------------
-- Guardians: who holds a wrapped fragment for a given vault.
-- Each fragment is wrapped to that guardian's public key, so
-- only that guardian's device can decrypt it.
------------------------------------------------------------
create table public.vault_guardians (
  id                       uuid primary key default gen_random_uuid(),
  vault_id                 uuid not null references public.vaults(id) on delete cascade,
  guardian_user_id         uuid not null references auth.users(id) on delete cascade,
  guardian_label           text not null,
  fragment_index           smallint not null,
  fragment_fingerprint     text not null,
  wrapped_fragment_ct      text not null,
  wrapped_fragment_iv      text not null,
  wrapped_fragment_eph_pk  text not null,
  invited_at               timestamptz not null default now(),
  accepted_at              timestamptz,
  unique (vault_id, fragment_index),
  unique (vault_id, guardian_user_id)
);
create index on public.vault_guardians(guardian_user_id);

------------------------------------------------------------
-- Recovery requests: owner asks the quorum to unseal.
------------------------------------------------------------
create table public.recovery_requests (
  id              uuid primary key default gen_random_uuid(),
  short_id        text not null unique,
  vault_id        uuid not null references public.vaults(id) on delete cascade,
  requester_id    uuid not null references auth.users(id) on delete cascade,
  reason          text not null,
  requester_pk_jwk jsonb not null,
  status          text not null default 'pending'
                  check (status in ('pending','approved','denied','expired','completed')),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '7 days'),
  completed_at    timestamptz
);
create index on public.recovery_requests(vault_id, status);

------------------------------------------------------------
-- Guardian responses: each guardian, after approving, re-wraps
-- their plaintext fragment to the *requester's* ephemeral public
-- key so only the requester's device can reconstruct the secret.
------------------------------------------------------------
create table public.fragment_responses (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references public.recovery_requests(id) on delete cascade,
  guardian_id     uuid not null references public.vault_guardians(id) on delete cascade,
  decision        text not null check (decision in ('approve','deny')),
  rewrapped_ct    text,
  rewrapped_iv    text,
  rewrapped_eph_pk text,
  responded_at    timestamptz not null default now(),
  unique (request_id, guardian_id)
);

------------------------------------------------------------
-- Audit log: append-only, hash-chained.
------------------------------------------------------------
create table public.audit_events (
  id              bigserial primary key,
  vault_id        uuid references public.vaults(id) on delete cascade,
  actor_id        uuid references auth.users(id) on delete set null,
  event_type      text not null,
  payload         jsonb not null default '{}'::jsonb,
  prev_hash       text,
  event_hash      text,
  created_at      timestamptz not null default now()
);
create index on public.audit_events(vault_id, created_at desc);

------------------------------------------------------------
-- Row-Level Security
------------------------------------------------------------
alter table public.guardian_identities  enable row level security;
alter table public.vaults               enable row level security;
alter table public.vault_guardians      enable row level security;
alter table public.recovery_requests    enable row level security;
alter table public.fragment_responses   enable row level security;
alter table public.audit_events         enable row level security;

-- Identities: anyone authenticated can look up a public key
-- (needed to invite a guardian); only the user can write their own.
create policy identities_select_authenticated on public.guardian_identities
  for select to authenticated using (true);
create policy identities_upsert_self on public.guardian_identities
  for insert to authenticated with check (auth.uid() = user_id);
create policy identities_update_self on public.guardian_identities
  for update to authenticated using (auth.uid() = user_id);

-- Vaults: owner sees their vaults; guardians see vaults they guard.
create policy vaults_owner_all on public.vaults
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy vaults_guardian_select on public.vaults
  for select to authenticated
  using (exists (
    select 1 from public.vault_guardians g
    where g.vault_id = vaults.id and g.guardian_user_id = auth.uid()
  ));

-- Vault guardians: visible to the vault owner and the guardian themself.
create policy vg_owner_all on public.vault_guardians
  for all to authenticated
  using (exists (select 1 from public.vaults v where v.id = vault_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.vaults v where v.id = vault_id and v.owner_id = auth.uid()));

create policy vg_self_select on public.vault_guardians
  for select to authenticated
  using (guardian_user_id = auth.uid());

-- Recovery requests: requester + the vault's guardians can see them.
create policy rr_requester_all on public.recovery_requests
  for all to authenticated
  using (auth.uid() = requester_id)
  with check (auth.uid() = requester_id);

create policy rr_guardian_select on public.recovery_requests
  for select to authenticated
  using (exists (
    select 1 from public.vault_guardians g
    where g.vault_id = recovery_requests.vault_id and g.guardian_user_id = auth.uid()
  ));

-- Fragment responses: the guardian writes their own, the requester reads them.
create policy fr_guardian_write on public.fragment_responses
  for insert to authenticated
  with check (exists (
    select 1 from public.vault_guardians g
    where g.id = guardian_id and g.guardian_user_id = auth.uid()
  ));

create policy fr_requester_select on public.fragment_responses
  for select to authenticated
  using (exists (
    select 1 from public.recovery_requests r
    where r.id = request_id and r.requester_id = auth.uid()
  ));

create policy fr_guardian_select_own on public.fragment_responses
  for select to authenticated
  using (exists (
    select 1 from public.vault_guardians g
    where g.id = guardian_id and g.guardian_user_id = auth.uid()
  ));

-- Audit events: visible to the vault owner and that vault's guardians.
create policy audit_vault_visible on public.audit_events
  for select to authenticated
  using (
    exists (select 1 from public.vaults v where v.id = vault_id and v.owner_id = auth.uid())
    or exists (
      select 1 from public.vault_guardians g
      where g.vault_id = audit_events.vault_id and g.guardian_user_id = auth.uid()
    )
  );

-- Inserts go through a SECURITY DEFINER function (server-side hash chain) — no direct insert policy.

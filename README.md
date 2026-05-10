# Triskele — Quorum Vault

A privacy-first encrypted vault that requires **three trusted guardians** (a quorum) to
unseal sensitive information. The server cannot read vault contents, cannot reconstruct the
data-encryption key, and cannot bypass the quorum.

## The 3 security controls

The "open it" gate is layered:

| # | Control | Where it lives |
|---|---------|----------------|
| 1 | AES-GCM-256 envelope encryption of the payload | Browser, before any data leaves the device |
| 2 | Shamir Secret Sharing of the data-encryption key (`k`-of-`n`) | Browser, splits key into N fragments — `k` are required to reconstruct |
| 3 | Per-guardian ECDH(P-256) → HKDF-SHA256 → AES-GCM key wrapping of each fragment | Each fragment is sealed to one guardian's public key. Only that guardian's private key can read it. |

To unseal, a guardian must explicitly approve, decrypt their fragment locally, and
**re-wrap it to the requester's ephemeral public key** so only the requester's device can
combine the fragments. The server only ever sees ciphertext.

## Architecture

```
src/
  app/                    Next.js App Router pages
    page.tsx              vault dashboard
    vaults/new/           seal a new vault
    vaults/[id]/          vault detail (ciphertext, quorum gauge, audit log)
    vaults/[id]/recover/  initiate a recovery request
    guardian/             guardian inbox
    guardian/[requestId]/ guardian approval screen
  components/             shell, identity provider, onboarding
  lib/
    crypto/               AES-GCM, Shamir, ECDH/HKDF wrap — all browser-side
    store/                storage abstraction (localStorage demo + Supabase)
    supabase/             Supabase client
supabase/migrations/      0001_init.sql — schema with RLS
scripts/smoke.mjs         end-to-end crypto round-trip test (Node)
```

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

The app starts in **demo mode** (localStorage). Provision four identities — Vault Owner +
G-01/G-02/G-03 — from onboarding. Switch identities from the top bar to play through the
flow:

1. As **Vault Owner**, "Provision a new vault" → choose the three guardians → seal.
2. As **Vault Owner**, click **Open vault** to dispatch a recovery request.
3. Switch to each **Guardian**, open their inbox, **Approve & re-wrap**.
4. Switch back to **Vault Owner**, return to the vault, click **Reconstruct & decrypt**.

## Connecting Supabase (real backend)

1. Create a Supabase project, copy the URL and anon key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
2. Apply the schema:
   ```bash
   supabase link --project-ref <ref>
   supabase db push   # or run supabase/migrations/0001_init.sql in the SQL editor
   ```
3. Wire the Supabase-backed `VaultStore` (the type in `src/lib/store/types.ts`) — the local
   store and Supabase store share the same interface, so a Supabase implementation drops in
   without UI changes.

## Verifying the cryptography

```bash
npx tsx scripts/smoke.mjs
```

This exercises the full seal→recover round-trip and asserts:
- Plaintext recovers exactly after a `k` of `n` quorum.
- Sub-threshold combinations fail.
- A guardian's wrapped fragment cannot be opened by a different guardian's key.

## Threat model — what the server can and can't do

**Can:**
- Store opaque AES-GCM ciphertext blobs.
- Coordinate guardian approval workflows.
- Append immutable events to a transparency log (RLS-enforced).

**Cannot:**
- Read vault contents (client-side encrypted).
- Reconstruct the master key (requires `k` plaintext fragments held only by guardians).
- Bypass the quorum via admin override (no DB column makes this possible).

## Notable simplifications in the demo

- Demo mode stores guardian *private* keys in localStorage so a single browser can play all
  roles. In production, each guardian's private key never leaves their own device
  (IndexedDB-backed, ideally a hardware-bound key).
- The recovery request uses the requester's persistent public key. A production build
  would generate an ephemeral keypair per request for forward-secrecy.
- No real auth: identity = a label on the device. A production build would map identities
  to Supabase Auth users.

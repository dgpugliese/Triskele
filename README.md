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

## Try it live

A live preview is deployed at **https://triskele-6ct.pages.dev** on Cloudflare Pages.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploying to Cloudflare Pages

The app builds with `@cloudflare/next-on-pages` — static pages are prerendered, the three
dynamic routes (`/app/vaults/[id]`, `/app/vaults/[id]/recover`, `/app/guardian/[requestId]`)
ship as edge functions.

```bash
# one-shot deploy from your local checkout (needs `wrangler login` once)
npm run pages:deploy

# or just produce the artifact for inspection
npm run pages:build      # writes .vercel/output/static
npm run pages:preview    # serves it locally with wrangler
```

For continuous deploys, connect this repo in the Cloudflare dashboard with:

- **Build command:** `npx @cloudflare/next-on-pages`
- **Build output dir:** `.vercel/output/static`
- **Compatibility flag:** `nodejs_compat`

The app starts in **demo mode** (localStorage). Provision four identities — Vault Owner +
G-01/G-02/G-03 — from onboarding. Switch identities from the top bar to play through the
flow:

1. As **Vault Owner**, "Provision a new vault" → choose the three guardians → seal.
2. As **Vault Owner**, click **Open vault** to dispatch a recovery request.
3. Switch to each **Guardian**, open their inbox, **Approve & re-wrap**.
4. Switch back to **Vault Owner**, return to the vault, click **Reconstruct & decrypt**.

## Connecting Supabase (real auth + backend)

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, the app
switches from **demo mode** to **Supabase mode**:

- `/login` and `/signup` use Supabase Auth (email+password and magic-link supported).
- `/app/*` is gated — unauthenticated visits redirect to `/login?next=…`.
- Each authenticated user gets one device-bound ECDH keypair (created on first sign-in,
  stored locally). The top-bar identity dropdown is hidden — the auth session is the
  identity.

Setup steps:

1. Create a Supabase project (or use an existing one).
2. Add the env vars locally (`.env.local`) and on the deploy (Cloudflare Pages → Settings →
   Environment variables → Production):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Apply the schema (vaults, guardians, recovery requests, fragment responses, audit
   events, all with RLS):
   ```bash
   supabase link --project-ref <ref>
   supabase db push   # or paste supabase/migrations/0001_init.sql into the SQL editor
   ```
4. (Optional) Enable email confirmation under Authentication → Providers → Email so the
   signup confirmation flow lights up.

The Supabase-backed `VaultStore` is a follow-up — for now, vault metadata still lives in
localStorage even in Supabase mode. Migration is mechanical: implement the `VaultStore`
interface in `src/lib/store/types.ts` against Supabase tables and swap the import in
the pages.

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

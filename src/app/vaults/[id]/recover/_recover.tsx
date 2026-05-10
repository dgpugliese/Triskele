"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { useIdentity } from "@/components/identity-provider";
import { localStore } from "@/lib/store/local-store";
import type { VaultDetail } from "@/lib/store/types";

export function Recover({ vaultId }: { vaultId: string }) {
  const router = useRouter();
  const { identity } = useIdentity();
  const [v, setV] = useState<VaultDetail | null>(null);
  const [reason, setReason] = useState(
    "Estate trustee requested next-of-kin access. Recorded in legal docket #4421.",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void localStore.getVault(vaultId).then((d) => setV(d ?? null));
  }, [vaultId]);

  if (!v || !identity)
    return <p className="text-micro-mono font-mono text-ash">SYNCING…</p>;
  if (v.ownerId !== identity.userId)
    return (
      <div className="panel p-10 text-center">
        <Icon name="block" className="text-breach-red text-3xl" />
        <p className="text-body text-mist mt-3">
          Only the vault owner can initiate recovery for this vault.
        </p>
      </div>
    );

  const handleInitiate = async () => {
    setBusy(true);
    try {
      const req = await localStore.createRecoveryRequest({
        shortId: localStore.shortIdFor("REQ"),
        vaultId,
        requesterId: identity.userId,
        reason,
        requesterPublicKeyJwk: identity.publicKeyJwk,
      });
      router.push(`/vaults/${vaultId}?req=${req.id}`);
    } finally {
      setBusy(false);
    }
  };

  const guardianNames = v.guardians.map((g) => g.guardianLabel).join(" · ");

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-micro-mono font-mono text-ash">
          <Link href="/" className="hover:text-cipher-blue">Vaults</Link>
          <Icon name="chevron_right" className="text-sm" />
          <Link href={`/vaults/${vaultId}`} className="hover:text-cipher-blue">{v.title}</Link>
          <Icon name="chevron_right" className="text-sm" />
          <span className="text-white">Open</span>
        </div>
        <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
          Initiate recovery
        </h1>
        <p className="text-body text-mist max-w-2xl">
          A signed request will be dispatched to {v.guardians.length} guardians. Each must
          re-wrap their fragment to your ephemeral key before you can reconstruct the
          data-encryption key locally.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          <div className="panel p-6 space-y-4">
            <Field label="Reason for recovery (visible to guardians)">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-cipher w-full min-h-[120px]"
              />
            </Field>
            <div className="flex items-start gap-3 px-4 py-3 border border-seal-amber/30 bg-seal-amber/5 rounded">
              <Icon name="warning" className="text-seal-amber" />
              <div>
                <p className="text-small text-white">
                  Recovery is auditable and irreversible.
                </p>
                <p className="text-micro-mono font-mono text-ash mt-1">
                  Guardians: {guardianNames}
                </p>
              </div>
            </div>
            <button onClick={handleInitiate} disabled={busy} className="btn-primary">
              {busy ? (
                <>
                  <Icon name="hourglass_top" /> DISPATCHING…
                </>
              ) : (
                <>
                  <Icon name="send" /> Dispatch to quorum
                </>
              )}
            </button>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="panel p-6 space-y-4">
            <h3 className="text-micro-mono font-mono font-bold text-ash uppercase">
              What happens next
            </h3>
            <ol className="space-y-3 text-small text-mist">
              <Step n={1}>Each guardian sees a pending request in their inbox.</Step>
              <Step n={2}>If they approve, their device decrypts their fragment, then
                re-encrypts it to your ephemeral public key.</Step>
              <Step n={3}>When ≥ {v.threshold} approvals are in, your device combines
                the fragments and decrypts the blob.</Step>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-micro-mono font-mono text-ash uppercase">{label}</span>
      {children}
    </label>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="text-micro-mono font-mono text-cipher-blue mt-0.5">
        {n.toString().padStart(2, "0")}
      </span>
      <span>{children}</span>
    </li>
  );
}

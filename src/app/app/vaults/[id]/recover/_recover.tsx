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
      router.push(`/app/vaults/${vaultId}?req=${req.id}`);
    } finally {
      setBusy(false);
    }
  };

  const guardianNames = v.guardians.map((g) => g.guardianLabel).join(" · ");

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-micro-mono font-mono text-ash">
          <Link href="/app" className="hover:text-cipher-blue">Vaults</Link>
          <Icon name="chevron_right" className="text-sm" />
          <Link href={`/app/vaults/${vaultId}`} className="hover:text-cipher-blue">{v.title}</Link>
          <Icon name="chevron_right" className="text-sm" />
          <span className="text-white">Open</span>
        </div>
        <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
          Ask to open this vault
        </h1>
        <p className="text-body text-mist max-w-2xl">
          We&apos;ll send a request to all {v.guardians.length} of your guardians. Once
          they approve, this device will pull the pieces back together and unlock the vault.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          <div className="panel p-6 space-y-4">
            <Field
              label="Why are you opening this?"
              hint="Your guardians will see this. Be specific — it helps them decide quickly."
            >
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-cipher w-full min-h-[120px]"
                placeholder="e.g. Estate trustee asked for next-of-kin access — case #4421."
              />
            </Field>
            <div className="flex items-start gap-3 px-4 py-3 border border-seal-amber/30 bg-seal-amber/5 rounded">
              <Icon name="warning" className="text-seal-amber" />
              <div>
                <p className="text-small text-white">
                  Every action is logged. Once your guardians approve, the vault opens.
                </p>
                <p className="text-micro-mono font-mono text-ash mt-1">
                  Going to: {guardianNames}
                </p>
              </div>
            </div>
            <button onClick={handleInitiate} disabled={busy} className="btn-primary">
              {busy ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-void/40 border-t-void animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Icon name="send" /> Ask my guardians
                </>
              )}
            </button>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="panel p-6 space-y-4">
            <h3 className="text-micro-mono font-mono font-bold text-ash uppercase tracking-widest">
              What happens next
            </h3>
            <ol className="space-y-3 text-small text-mist">
              <Step n={1}>Your guardians get a notification with the reason you wrote.</Step>
              <Step n={2}>Each one approves — or denies — from their own device.</Step>
              <Step n={3}>
                When {v.threshold} of them say yes, this device unlocks the vault.
              </Step>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-small text-white font-medium block">{label}</span>
      {children}
      {hint && <span className="text-micro-mono font-mono text-ash block">{hint}</span>}
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

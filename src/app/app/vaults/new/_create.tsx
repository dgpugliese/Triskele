"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { useIdentity } from "@/components/identity-provider";
import { localStore } from "@/lib/store/local-store";
import { sealVault } from "@/lib/crypto";
import type { Identity } from "@/lib/store/types";

export function CreateVault() {
  const router = useRouter();
  const { identity, identities } = useIdentity();
  const candidates = useMemo(
    () => identities.filter((i) => i.userId !== identity?.userId),
    [identities, identity],
  );
  const [title, setTitle] = useState("Estate Documents");
  const [description, setDescription] = useState(
    "Will, executor instructions, and access keys for next of kin.",
  );
  const [payload, setPayload] = useState(
    "BEGIN VAULT PAYLOAD\nNotary: 0x9F3A...C21B\nExecutor: Helena Vance\nAccess key: hunter2-but-classier\nEND",
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(3);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (selected.length === 0 && candidates.length >= 3) {
      setSelected(candidates.slice(0, 3).map((c) => c.userId));
    }
  }, [candidates, selected.length]);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const handleSeal = async () => {
    setErr(null);
    if (!identity) return;
    if (selected.length < threshold) {
      setErr(`Select at least ${threshold} guardians.`);
      return;
    }
    setWorking(true);
    try {
      const guardians = selected
        .map((id) => identities.find((i) => i.userId === id))
        .filter((x): x is Identity => Boolean(x))
        .map((i) => ({ id: i.userId, publicKeyJwk: i.publicKeyJwk }));

      const sealed = await sealVault(payload, guardians, threshold);
      const shortId = localStore.shortIdFor("VLT");
      const guardianRows = sealed.fragments.map((f, idx) => {
        const ident = identities.find((i) => i.userId === f.guardianId);
        return {
          guardianUserId: f.guardianId,
          guardianLabel: ident?.displayName ?? `Guardian ${idx + 1}`,
          fragmentIndex: idx + 1,
          fragmentFingerprint: f.fingerprint,
          wrapped: f.wrapped,
          acceptedAt: new Date().toISOString(),
        };
      });
      const created = await localStore.createVault(
        {
          id: crypto.randomUUID(),
          shortId,
          ownerId: identity.userId,
          title,
          description,
          blob: sealed.blob,
          threshold,
          totalShares: sealed.totalShares,
        },
        guardianRows,
      );
      router.push(`/app/vaults/${created.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "sealing failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-micro-mono font-mono text-ash">
          <Link href="/app" className="hover:text-cipher-blue">Vaults</Link>
          <Icon name="chevron_right" className="text-sm" />
          <span className="text-white">New</span>
        </div>
        <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
          Create a new vault
        </h1>
        <p className="text-body text-mist max-w-2xl">
          What you write below stays in this browser until it&apos;s encrypted. The key
          that opens it gets split between your guardians — no one piece is enough.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          <div className="panel p-6 space-y-4">
            <Field label="What is this?" hint="A short name only you and your guardians will see.">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-cipher w-full"
                placeholder="Estate Documents"
              />
            </Field>
            <Field
              label="One-line description"
              hint="Visible without unlocking. Don't put anything secret here."
            >
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-cipher w-full"
              />
            </Field>
          </div>

          <div className="panel p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-graphite/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-micro-mono font-mono font-bold text-cipher-blue tracking-widest">
                  THE SECRET
                </h3>
                <p className="text-micro-mono font-mono text-ash">
                  Whatever you want only your circle to see.
                </p>
              </div>
              <span className="chip chip-cipher">
                <Icon name="lock" className="text-xs" /> {payload.length} CHARS · LOCAL ONLY
              </span>
            </div>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full min-h-[260px] bg-void text-white font-mono text-small leading-relaxed
                         p-6 outline-none resize-y"
              placeholder="Paste a will, a recovery phrase, account credentials — anything."
            />
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="panel p-6 space-y-4">
            <h3 className="text-micro-mono font-mono font-bold text-ash uppercase tracking-widest">
              How many to unlock?
            </h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={2}
                max={Math.max(2, selected.length || 3)}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                className="flex-1 accent-cipher-blue"
              />
              <span className="text-page-title font-display text-white tabular-nums">
                {threshold}/{selected.length || 0}
              </span>
            </div>
            <p className="text-small text-ash">
              <span className="text-mist">{threshold}</span> guardians out of{" "}
              <span className="text-mist">{selected.length || 0}</span> need to approve before
              this can be unsealed.
            </p>
          </div>

          <div className="panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-micro-mono font-mono font-bold text-ash uppercase">
                Guardians
              </h3>
              <span className="text-micro-mono font-mono text-cipher-blue">
                {selected.length} SELECTED
              </span>
            </div>
            {candidates.length === 0 ? (
              <p className="text-small text-ash">
                No guardian identities available. Add more in onboarding.
              </p>
            ) : (
              <ul className="space-y-2">
                {candidates.map((c) => {
                  const on = selected.includes(c.userId);
                  return (
                    <li key={c.userId}>
                      <button
                        onClick={() => toggle(c.userId)}
                        className={`w-full flex items-center justify-between p-3 rounded border transition-colors ${
                          on
                            ? "border-cipher-blue/40 bg-cipher-blue/5"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            name={on ? "check_circle" : "radio_button_unchecked"}
                            className={on ? "text-cipher-blue" : "text-ash"}
                          />
                          <span className="text-body text-white">{c.displayName}</span>
                        </span>
                        <span className="text-micro-mono font-mono text-ash">P-256</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {err && (
            <div className="chip chip-breach w-full justify-start">
              <Icon name="error" /> {err}
            </div>
          )}

          <button
            onClick={handleSeal}
            disabled={working}
            className="btn-primary w-full disabled:opacity-50"
          >
            {working ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-void/40 border-t-void animate-spin" />
                Sealing…
              </>
            ) : (
              <>
                <Icon name="lock" /> Seal this vault
              </>
            )}
          </button>
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

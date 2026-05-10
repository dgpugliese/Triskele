"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useIdentity } from "@/components/identity-provider";
import { localStore } from "@/lib/store/local-store";
import {
  unsealVault,
  unwrapShareWithGuardianKey,
  type ShamirShare,
} from "@/lib/crypto";
import type { VaultDetail } from "@/lib/store/types";

export function VaultDetailScreen({ vaultId }: { vaultId: string }) {
  const { identity } = useIdentity();
  const [v, setV] = useState<VaultDetail | null | "missing">(null);
  const [unsealed, setUnsealed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const detail = await localStore.getVault(vaultId);
    setV(detail ?? "missing");
  };

  useEffect(() => {
    void load();
    const t = window.setInterval(load, 1500);
    return () => window.clearInterval(t);
  }, [vaultId]);

  if (v === null) return <p className="text-micro-mono font-mono text-ash">SYNCING…</p>;
  if (v === "missing")
    return (
      <div className="panel p-10 text-center">
        <Icon name="error_outline" className="text-breach-red text-3xl" />
        <p className="text-body text-mist mt-3">No vault with this id.</p>
        <Link href="/" className="btn-secondary mt-4 inline-flex">
          Back to dashboard
        </Link>
      </div>
    );

  const isOwner = identity?.userId === v.ownerId;
  const approvals =
    v.activeRequest?.responses.filter((r) => r.decision === "approve").length ?? 0;
  const ready = approvals >= v.threshold;

  const handleReconstruct = async () => {
    if (!v.activeRequest) return;
    setErr(null);
    setBusy(true);
    try {
      const requesterPriv = localStore.getPrivateKey(v.activeRequest.requesterId);
      if (!requesterPriv) throw new Error("requester private key missing on this device");
      const responses = v.activeRequest.responses.filter(
        (r) => r.decision === "approve" && r.rewrapped,
      );
      const shares: ShamirShare[] = [];
      for (const r of responses) {
        if (!r.rewrapped) continue;
        const share = await unwrapShareWithGuardianKey(r.rewrapped, requesterPriv);
        shares.push(share);
        if (shares.length >= v.threshold) break;
      }
      if (shares.length < v.threshold) throw new Error("insufficient approved fragments");
      const plaintext = await unsealVault(v.blob, shares);
      setUnsealed(plaintext);
      await localStore.completeRecovery(v.activeRequest.id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "reconstruction failed");
    } finally {
      setBusy(false);
    }
  };

  const cipherPreview = v.blob.ciphertext
    .replace(/[^A-Za-z0-9+/=]/g, "")
    .match(/.{1,32}/g)
    ?.slice(0, 6)
    .join("\n");

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-micro-mono font-mono text-ash">
          <Link href="/" className="hover:text-cipher-blue">
            Vaults
          </Link>
          <Icon name="chevron_right" className="text-sm" />
          <span className="text-white">{v.title}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
                {v.title}
              </h1>
              <span
                className={`chip ${
                  v.activeRequest
                    ? "chip-pending"
                    : v.status === "sealed"
                      ? "chip-sealed"
                      : "chip-ash"
                }`}
              >
                {v.activeRequest ? "RECOVERY PENDING" : `[${v.status.toUpperCase()}]`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-micro-mono font-mono text-ash">
              <Icon name="fingerprint" className="text-sm" />
              <span>ID: {v.shortId}</span>
            </div>
          </div>
          <div className="flex gap-3">
            {isOwner && !v.activeRequest && (
              <Link href={`/vaults/${v.id}/recover`} className="btn-primary">
                <Icon name="key" /> Open vault
              </Link>
            )}
            {isOwner && v.activeRequest && ready && (
              <button onClick={handleReconstruct} disabled={busy} className="btn-primary">
                <Icon name="lock_open" />
                {busy ? "RECONSTRUCTING…" : "Reconstruct & decrypt"}
              </button>
            )}
            {isOwner && v.activeRequest && !ready && (
              <span className="btn-secondary cursor-default">
                <Icon name="hourglass_top" /> Waiting on quorum ({approvals}/{v.threshold})
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 space-y-8">
          <div className="panel overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-graphite/30">
              <h3 className="text-micro-mono font-mono font-bold text-cipher-blue">
                CIPHERTEXT.BLOB
              </h3>
              <span className="text-micro-mono font-mono text-ash">
                {Math.ceil(v.blob.ciphertext.length * 0.75)} B · AES-GCM-256
              </span>
            </div>
            <pre className="p-8 font-mono text-small text-mist break-all whitespace-pre-wrap leading-relaxed bg-void/50 opacity-60 select-none">
              {cipherPreview}
              {"\n[ … data truncated … ]"}
            </pre>
            <div className="px-6 py-6 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-3 py-2 px-4 border border-cipher-blue/20 bg-cipher-blue/5 rounded">
                <Icon name="info" className="text-cipher-blue" />
                <p className="text-small text-cipher-blue italic">
                  Payload was encrypted locally before any storage. Server holds ciphertext
                  and wrapped fragments only.
                </p>
              </div>
            </div>
          </div>

          {unsealed && (
            <div className="panel border-proof-green/40 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Icon name="check_circle" className="text-proof-green" filled />
                <h3 className="text-card-title font-semibold text-white">
                  Plaintext recovered
                </h3>
                <span className="chip chip-sealed">QUORUM SATISFIED</span>
              </div>
              <pre className="bg-void p-4 rounded font-mono text-small text-on-surface whitespace-pre-wrap break-words">
                {unsealed}
              </pre>
              <button
                onClick={() => setUnsealed(null)}
                className="btn-secondary text-micro-mono"
              >
                <Icon name="visibility_off" /> Hide
              </button>
            </div>
          )}

          {err && (
            <div className="chip chip-breach w-full justify-start">
              <Icon name="error" /> {err}
            </div>
          )}

          <AuditTrail v={v} />
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <QuorumGauge approved={approvals} threshold={v.threshold} total={v.totalShares} />
          <GuardiansList v={v} />
        </aside>
      </div>
    </div>
  );
}

function QuorumGauge({
  approved,
  threshold,
  total,
}: {
  approved: number;
  threshold: number;
  total: number;
}) {
  const pct = Math.min(100, Math.round((approved / threshold) * 100));
  const ready = approved >= threshold;
  return (
    <div className="panel p-6">
      <h4 className="text-micro-mono font-mono font-bold text-ash uppercase mb-6">
        Quorum Status
      </h4>
      <div className="flex flex-col items-center justify-center py-4 relative">
        <div
          className="w-32 h-32 rounded-full grid place-items-center"
          style={{
            background: `conic-gradient(${ready ? "#72F0A0" : "#5EE7FF"} ${pct}%, #1B222B 0)`,
          }}
        >
          <div className="w-[7.5rem] h-[7.5rem] rounded-full bg-obsidian grid place-items-center">
            <div className="text-center">
              <div className="text-page-title font-display font-semibold text-white leading-none">
                {approved}/{threshold}
              </div>
              <div
                className={`text-micro-mono font-mono mt-1 ${
                  ready ? "text-proof-green" : "text-cipher-blue"
                }`}
              >
                {ready ? "READY" : "AWAITING"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-small text-mist text-center pt-4 border-t border-white/5">
        {threshold} of {total} guardians required to reconstruct the data-encryption key.
      </p>
    </div>
  );
}

function GuardiansList({ v }: { v: VaultDetail }) {
  const { identity } = useIdentity();
  const responses = v.activeRequest?.responses ?? [];
  return (
    <div className="panel overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-graphite/30">
        <h4 className="text-micro-mono font-mono font-bold text-ash uppercase">Guardians</h4>
        <span className="text-micro-mono font-mono text-cipher-blue">
          {v.guardians.length} ACTIVE
        </span>
      </div>
      <ul className="divide-y divide-white/5">
        {v.guardians.map((g) => {
          const r = responses.find((x) => x.guardianId === g.id);
          const status = r
            ? r.decision === "approve"
              ? "approved"
              : "denied"
            : v.activeRequest
              ? "pending"
              : "idle";
          return (
            <li key={g.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-body text-white">{g.guardianLabel}</span>
                  {identity?.userId === g.guardianUserId && (
                    <span className="chip chip-cipher">YOU</span>
                  )}
                </div>
                <div className="text-micro-mono font-mono text-ash">
                  Fragment #{g.fragmentIndex} · {g.fragmentFingerprint}
                </div>
              </div>
              <span
                className={`chip ${
                  status === "approved"
                    ? "chip-sealed"
                    : status === "denied"
                      ? "chip-breach"
                      : status === "pending"
                        ? "chip-pending"
                        : "chip-ash"
                }`}
              >
                {status.toUpperCase()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AuditTrail({ v }: { v: VaultDetail }) {
  const events = [...v.events].reverse();
  if (events.length === 0) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-micro-mono font-mono font-bold text-ash uppercase tracking-widest px-2">
        Audit Log
      </h3>
      <ol className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span
              className={`absolute -left-[27px] top-1.5 w-[14px] h-[14px] rounded-full ring-4 ring-void border border-void ${
                e.eventType.startsWith("vault.")
                  ? "bg-proof-green"
                  : e.eventType === "recovery.completed"
                    ? "bg-cipher-blue"
                    : "bg-slate"
              }`}
            />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
              <span className="text-body font-semibold text-white">
                {humanEvent(e.eventType)}
              </span>
              <span className="text-micro-mono font-mono text-ash">
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </div>
            {Object.keys(e.payload).length > 0 && (
              <p className="text-small text-mist mt-1 font-mono">
                {JSON.stringify(e.payload)}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function humanEvent(t: string): string {
  switch (t) {
    case "vault.sealed": return "Vault sealed";
    case "recovery.requested": return "Recovery initiated";
    case "recovery.response": return "Guardian response";
    case "recovery.completed": return "Recovery completed";
    default: return t;
  }
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useIdentity } from "@/components/identity-provider";
import { localStore } from "@/lib/store/local-store";
import type { Vault, Guardian, RecoveryRequest } from "@/lib/store/types";

type Row = Vault & { guardianCount: number; activeRequest?: RecoveryRequest };

export function Dashboard() {
  const { identity } = useIdentity();
  const [vaults, setVaults] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!identity) return;
    void (async () => {
      const list = await localStore.listVaults();
      const detailed = await Promise.all(
        list.map(async (v) => {
          const d = await localStore.getVault(v.id);
          return {
            ...v,
            guardianCount: d?.guardians.length ?? 0,
            activeRequest: d?.activeRequest,
          };
        }),
      );
      setVaults(detailed);
    })();
  }, [identity]);

  if (!identity) return null;

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="chip chip-cipher">QUORUM-SEALED</span>
          <span className="chip chip-ash">{identity.displayName.toUpperCase()}</span>
        </div>
        <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
          Active Vaults
        </h1>
        <p className="text-body text-mist max-w-2xl">
          Your cryptographic assets are sealed with AES-GCM-256 and split via Shamir secret
          sharing across your guardians. The server holds ciphertext only — no fragment alone
          can reveal a thing.
        </p>
      </header>

      {vaults === null ? (
        <p className="text-micro-mono font-mono text-ash">SYNCING…</p>
      ) : vaults.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {vaults.map((v) => (
            <VaultCard key={v.id} v={v} mine={v.ownerId === identity.userId} />
          ))}
          <Link
            href="/vaults/new"
            className="col-span-12 md:col-span-6 lg:col-span-4 panel-raised border-dashed p-6 min-h-[180px]
                       flex flex-col items-center justify-center text-ash hover:text-cipher-blue
                       hover:border-cipher-blue/30 transition-colors"
          >
            <Icon name="add" className="text-3xl mb-2" />
            <span className="text-micro-mono font-mono uppercase">Provision new vault</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="panel p-12 text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full border border-cipher-blue/30 grid place-items-center">
        <Icon name="enhanced_encryption" className="text-cipher-blue text-3xl" />
      </div>
      <div className="space-y-2">
        <h2 className="text-section-title font-display text-white">No vaults yet.</h2>
        <p className="text-body text-mist max-w-md mx-auto">
          Provision your first vault. You will pick three guardians, write your secret
          payload, and the data-encryption key will be split across the quorum on this device.
        </p>
      </div>
      <Link href="/vaults/new" className="btn-primary inline-flex">
        <Icon name="key" /> Seal a new vault
      </Link>
    </div>
  );
}

function VaultCard({ v, mine }: { v: Row & { guardianCount: number }; mine: boolean }) {
  const fillPct = (v.guardianCount / v.totalShares) * 100;
  const status = v.activeRequest ? "RECOVERY PENDING" : v.status.toUpperCase();
  const statusClass = v.activeRequest
    ? "chip-pending"
    : v.status === "sealed"
      ? "chip-sealed"
      : "chip-ash";
  return (
    <Link
      href={`/vaults/${v.id}`}
      className="col-span-12 lg:col-span-8 panel p-8 hover:border-white/20 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`chip ${statusClass}`}>{status}</span>
            <span className="text-micro-mono font-mono text-ash">ID: {v.shortId}</span>
            {!mine && <span className="chip chip-cipher">GUARDIAN</span>}
          </div>
          <h2 className="text-section-title font-display text-white">{v.title}</h2>
          {v.description && <p className="text-small text-mist max-w-xl">{v.description}</p>}
          <div className="bg-void/50 border border-slate p-4 rounded-lg inline-flex flex-col gap-3">
            <span className="text-micro-mono font-mono text-ash uppercase tracking-widest">
              Quorum Status ({v.threshold}/{v.totalShares})
            </span>
            <div className="flex gap-4">
              {Array.from({ length: v.totalShares }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      i < v.guardianCount
                        ? "bg-proof-green shadow-proof-glow"
                        : "bg-slate"
                    }`}
                  />
                  <span className="text-micro-mono font-mono text-white">
                    G-{(i + 1).toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="text-right">
            <span className="text-micro-mono font-mono text-ash uppercase">Fragment fill</span>
            <div className="w-48 h-1 bg-slate rounded mt-2 overflow-hidden">
              <div
                className="h-full bg-cipher-blue"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
          <span className="btn-secondary">
            <Icon name="visibility" /> Inspect
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-6 border-t border-white/5">
        <Meta label="Last modified" value={new Date(v.updatedAt).toLocaleString()} />
        <Meta label="Encryption" value="AES-GCM-256" />
        <Meta label="Key split" value={`Shamir ${v.threshold}-of-${v.totalShares}`} />
      </div>
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-micro-mono font-mono text-ash block mb-1 uppercase">{label}</span>
      <span className="text-body text-white">{value}</span>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { useAuth } from "@/components/auth-provider";
import { localStore } from "@/lib/store/local-store";
import type { AuditEvent, Identity, Vault } from "@/lib/store/types";

type Filter = "all" | "vault" | "recovery";

export function AuditLog() {
  const { identity } = useAuth();
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [vaultFilter, setVaultFilter] = useState<string>("all");

  const refresh = async () => {
    const [evts, vs, ids] = await Promise.all([
      localStore.listAuditEvents(),
      localStore.listVaults(),
      localStore.listIdentities(),
    ]);
    setEvents(evts);
    setVaults(vs);
    setIdentities(ids);
  };

  useEffect(() => {
    if (!identity) return;
    void refresh();
    const t = window.setInterval(refresh, 2000);
    return () => window.clearInterval(t);
  }, [identity?.userId]);

  const filtered = useMemo(() => {
    if (!events) return null;
    return events.filter((e) => {
      if (vaultFilter !== "all" && e.vaultId !== vaultFilter) return false;
      if (filter === "vault" && !e.eventType.startsWith("vault.")) return false;
      if (filter === "recovery" && !e.eventType.startsWith("recovery.")) return false;
      return true;
    });
  }, [events, filter, vaultFilter]);

  const stats = useMemo(() => {
    if (!events) return { total: 0, recoveries: 0, seals: 0 };
    return {
      total: events.length,
      recoveries: events.filter((e) => e.eventType.startsWith("recovery.")).length,
      seals: events.filter((e) => e.eventType === "vault.sealed").length,
    };
  }, [events]);

  if (!identity) return null;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="chip chip-cipher">AUDIT LOG</span>
        <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
          Every move, on the record.
        </h1>
        <p className="text-body text-mist max-w-2xl">
          Every seal, approval, denial, and reconstruction is logged here. Visible to the
          vault owner and that vault&apos;s guardians — nobody else.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Stat label="Events" value={stats.total} icon="receipt_long" />
        <Stat label="Vaults sealed" value={stats.seals} icon="lock" />
        <Stat label="Recovery events" value={stats.recoveries} icon="key" />
      </div>

      <div className="panel p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 p-1 bg-graphite/60 rounded-lg border border-white/5 self-start">
          <PillButton active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </PillButton>
          <PillButton active={filter === "vault"} onClick={() => setFilter("vault")}>
            Vault
          </PillButton>
          <PillButton active={filter === "recovery"} onClick={() => setFilter("recovery")}>
            Recovery
          </PillButton>
        </div>
        {vaults.length > 0 && (
          <label className="flex items-center gap-2 text-micro-mono font-mono text-ash uppercase tracking-widest">
            <span>Vault</span>
            <select
              value={vaultFilter}
              onChange={(e) => setVaultFilter(e.target.value)}
              className="bg-graphite text-white text-micro-mono font-mono border border-slate rounded px-3 py-2"
            >
              <option value="all">All vaults</option>
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} · {v.shortId}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {filtered === null ? (
        <p className="text-micro-mono font-mono text-ash">LOADING…</p>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="relative pl-8 sm:pl-10 space-y-5 sm:space-y-6 before:content-[''] before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate">
          {filtered.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              vault={vaults.find((v) => v.id === e.vaultId)}
              actor={identities.find((i) => i.userId === e.actorId)}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function EventRow({
  event,
  vault,
  actor,
}: {
  event: AuditEvent;
  vault?: Vault;
  actor?: Identity;
}) {
  const palette = colorFor(event.eventType);
  return (
    <li className="relative">
      <span
        className={`absolute -left-[26px] sm:-left-[30px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-void border border-void ${palette.dot}`}
      />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon name={palette.icon} className={palette.text} filled />
          <span className="text-body font-semibold text-white">
            {humanEvent(event.eventType)}
          </span>
          {vault && (
            <Link
              href={`/app/vaults/${vault.id}`}
              className="chip chip-ash hover:text-cipher-blue transition-colors"
            >
              {vault.shortId}
            </Link>
          )}
        </div>
        <time className="text-micro-mono font-mono text-ash" dateTime={event.createdAt}>
          {new Date(event.createdAt).toLocaleString()}
        </time>
      </div>
      <p className="text-small text-mist mt-1">
        {humanDescription(event, vault, actor)}
      </p>
    </li>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="panel p-4 sm:p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg border border-cipher-blue/20 bg-cipher-blue/5 grid place-items-center shrink-0">
        <Icon name={icon} className="text-cipher-blue text-xl" />
      </div>
      <div>
        <div className="text-section-title font-display font-semibold text-white">
          {value}
        </div>
        <div className="text-micro-mono font-mono text-ash uppercase tracking-widest">
          {label}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="panel p-10 sm:p-12 text-center space-y-3">
      <Icon name="history" className="text-3xl text-ash" />
      <h2 className="text-section-title font-display text-white">No events yet.</h2>
      <p className="text-body text-mist max-w-md mx-auto">
        Once you seal a vault or run a recovery, every step shows up here in
        chronological order.
      </p>
      <Link href="/app/vaults/new" className="btn-primary inline-flex">
        <Icon name="enhanced_encryption" /> Seal your first vault
      </Link>
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-micro-mono font-mono uppercase tracking-widest py-1.5 px-3 rounded transition-colors ${
        active ? "bg-cipher-blue text-void font-semibold" : "text-ash hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function colorFor(type: string): { dot: string; text: string; icon: string } {
  if (type === "vault.sealed") {
    return { dot: "bg-proof-green", text: "text-proof-green", icon: "lock" };
  }
  if (type === "recovery.completed") {
    return { dot: "bg-cipher-blue", text: "text-cipher-blue", icon: "lock_open" };
  }
  if (type === "recovery.requested") {
    return { dot: "bg-seal-amber", text: "text-seal-amber", icon: "outgoing_mail" };
  }
  if (type === "recovery.response") {
    return { dot: "bg-cipher-blue", text: "text-cipher-blue", icon: "how_to_reg" };
  }
  return { dot: "bg-slate", text: "text-ash", icon: "circle" };
}

function humanEvent(type: string): string {
  switch (type) {
    case "vault.sealed":
      return "Vault sealed";
    case "recovery.requested":
      return "Recovery requested";
    case "recovery.response":
      return "Guardian responded";
    case "recovery.completed":
      return "Recovery completed";
    default:
      return type;
  }
}

function humanDescription(event: AuditEvent, vault?: Vault, actor?: Identity): string {
  const who = actor?.displayName ?? "An identity on this device";
  const where = vault ? `“${vault.title}”` : "a vault";
  switch (event.eventType) {
    case "vault.sealed": {
      const threshold = event.payload.threshold;
      const totalShares = event.payload.totalShares;
      return `${who} sealed ${where} with a ${threshold}-of-${totalShares} quorum.`;
    }
    case "recovery.requested": {
      const reason = (event.payload.reason as string | undefined) ?? "no reason given";
      return `${who} initiated a recovery for ${where}. Reason: “${reason}”.`;
    }
    case "recovery.response": {
      const decision = event.payload.decision === "approve" ? "approved" : "denied";
      return `A guardian ${decision} the active recovery request for ${where}.`;
    }
    case "recovery.completed":
      return `${who} reconstructed the data-encryption key for ${where}. The vault is unsealed.`;
    default:
      return `${who} · ${event.eventType}`;
  }
}

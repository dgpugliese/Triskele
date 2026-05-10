"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useIdentity } from "@/components/identity-provider";
import { localStore } from "@/lib/store/local-store";
import type { RecoveryRequest, Vault } from "@/lib/store/types";

export function GuardianInbox() {
  const { identity } = useIdentity();
  const [items, setItems] = useState<(RecoveryRequest & { vault: Vault })[] | null>(null);

  const load = async () => setItems(await localStore.listIncomingRequestsForGuardian());
  useEffect(() => {
    void load();
    const t = window.setInterval(load, 1500);
    return () => window.clearInterval(t);
  }, [identity?.userId]);

  if (!identity) return null;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="chip chip-pending">GUARDIAN INBOX</span>
          <span className="chip chip-ash">{identity.displayName.toUpperCase()}</span>
        </div>
        <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
          Awaiting your approval
        </h1>
        <p className="text-body text-mist max-w-2xl">
          People you guard for sometimes need help opening their vaults. Each one will tell
          you why. Approve only if you trust the request.
        </p>
      </header>

      {items === null ? (
        <SkeletonList />
      ) : items.length === 0 ? (
        <div className="panel p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full border border-white/10 grid place-items-center">
            <Icon name="inbox" className="text-3xl text-ash" />
          </div>
          <h2 className="text-section-title font-display text-white">All quiet here.</h2>
          <p className="text-body text-mist max-w-md mx-auto">
            When someone you guard for asks to open a vault, it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/app/guardian/${r.id}`}
                className="panel p-6 flex items-center justify-between hover:border-cipher-blue/30 transition-colors group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="chip chip-pending">NEEDS REVIEW</span>
                    <span className="text-micro-mono font-mono text-ash">
                      Expires {new Date(r.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <h3 className="text-card-title font-semibold text-white">
                    Open <span className="text-cipher-blue">{r.vault.title}</span>
                  </h3>
                  <p className="text-small text-mist max-w-xl line-clamp-2">{r.reason}</p>
                </div>
                <Icon
                  name="chevron_right"
                  className="text-ash group-hover:text-cipher-blue transition-colors"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-4">
      {[0, 1].map((i) => (
        <li key={i} className="panel p-6 space-y-3">
          <div className="h-3 w-32 rounded bg-slate animate-pulse" />
          <div className="h-5 w-1/2 rounded bg-slate/70 animate-pulse" />
          <div className="h-3 w-full rounded bg-slate/40 animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

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
        <span className="chip chip-pending">GUARDIAN INBOX</span>
        <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
          Pending Requests
        </h1>
        <p className="text-body text-mist max-w-2xl">
          Requests addressed to <span className="text-white">{identity.displayName}</span>.
          Approving will decrypt your fragment locally and re-wrap it for the requester.
        </p>
      </header>

      {items === null ? (
        <p className="text-micro-mono font-mono text-ash">SYNCING…</p>
      ) : items.length === 0 ? (
        <div className="panel p-10 text-center space-y-3">
          <Icon name="inbox" className="text-3xl text-ash" />
          <p className="text-body text-mist">No pending recovery requests.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/guardian/${r.id}`}
                className="panel p-6 flex items-center justify-between hover:border-cipher-blue/30 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="chip chip-pending">PENDING</span>
                    <span className="text-micro-mono font-mono text-ash">
                      {r.shortId} · expires {new Date(r.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-card-title font-semibold text-white">
                    Recovery: {r.vault.title}
                  </h3>
                  <p className="text-small text-mist max-w-xl line-clamp-2">{r.reason}</p>
                </div>
                <Icon name="chevron_right" className="text-ash" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

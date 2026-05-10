"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useIdentity } from "@/components/identity-provider";
import { localStore } from "@/lib/store/local-store";
import {
  unwrapShareWithGuardianKey,
  wrapShareForGuardian,
} from "@/lib/crypto";
import type {
  Guardian,
  RecoveryRequest,
  Vault,
  FragmentResponse,
} from "@/lib/store/types";

type Loaded = {
  request: RecoveryRequest;
  vault: Vault;
  myGuardianRecord: Guardian;
  myExistingResponse?: FragmentResponse;
};

export function GuardianApproval({ requestId }: { requestId: string }) {
  const { identity } = useIdentity();
  const [data, setData] = useState<Loaded | null | "missing">(null);
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    if (!identity) return;
    const inbox = await localStore.listIncomingRequestsForGuardian();
    const found = inbox.find((r) => r.id === requestId);
    if (!found) {
      const detail = await localStore.getVault(""); // intentional miss
      void detail;
      setData("missing");
      return;
    }
    const vault = await localStore.getVault(found.vaultId);
    const me = vault?.guardians.find((g) => g.guardianUserId === identity.userId);
    const existing = vault?.activeRequest?.responses.find(
      (rsp) => rsp.guardianId === me?.id,
    );
    if (!vault || !me) {
      setData("missing");
      return;
    }
    setData({
      request: found,
      vault,
      myGuardianRecord: me,
      myExistingResponse: existing,
    });
  };

  useEffect(() => {
    void load();
  }, [identity?.userId, requestId]);

  if (!identity)
    return <p className="text-micro-mono font-mono text-ash">SYNCING…</p>;
  if (data === null)
    return <p className="text-micro-mono font-mono text-ash">SYNCING…</p>;
  if (data === "missing")
    return (
      <div className="panel p-10 text-center space-y-3">
        <Icon name="block" className="text-breach-red text-3xl" />
        <p className="text-body text-mist">
          This request is not addressed to you, or has already been resolved.
        </p>
        <Link href="/guardian" className="btn-secondary inline-flex">
          Back to inbox
        </Link>
      </div>
    );

  const { request, vault, myGuardianRecord, myExistingResponse } = data;

  const decide = async (decision: "approve" | "deny") => {
    setErr(null);
    setBusy(decision);
    try {
      let rewrapped;
      if (decision === "approve") {
        const myPriv = localStore.getPrivateKey(identity.userId);
        if (!myPriv) throw new Error("guardian private key missing on this device");
        const share = await unwrapShareWithGuardianKey(myGuardianRecord.wrapped, myPriv);
        rewrapped = await wrapShareForGuardian(share, request.requesterPublicKeyJwk);
      }
      await localStore.submitFragmentResponse({
        requestId: request.id,
        guardianId: myGuardianRecord.id,
        decision,
        rewrapped,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "submission failed");
    } finally {
      setBusy(null);
    }
  };

  const submitted = Boolean(myExistingResponse);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-micro-mono font-mono text-ash">
          <Link href="/guardian" className="hover:text-cipher-blue">Inbox</Link>
          <Icon name="chevron_right" className="text-sm" />
          <span className="text-white">{request.shortId}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-page-title md:text-hero font-display tracking-tight text-white">
            Approval requested
          </h1>
          <span className="chip chip-pending">QUORUM CALL</span>
        </div>
        <p className="text-body text-mist max-w-2xl">
          You hold fragment{" "}
          <span className="text-white font-mono">#{myGuardianRecord.fragmentIndex}</span>{" "}
          (<span className="font-mono">{myGuardianRecord.fragmentFingerprint}</span>) for{" "}
          <span className="text-white">{vault.title}</span>.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          <div className="panel p-6 space-y-4">
            <h3 className="text-micro-mono font-mono font-bold text-ash uppercase">
              Request details
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Vault">{vault.title}</Detail>
              <Detail label="Vault ID">{vault.shortId}</Detail>
              <Detail label="Threshold">
                {vault.threshold} of {vault.totalShares}
              </Detail>
              <Detail label="Expires">
                {new Date(request.expiresAt).toLocaleString()}
              </Detail>
            </dl>
            <div className="border-t border-white/5 pt-4 space-y-1">
              <span className="text-micro-mono font-mono text-ash uppercase">
                Reason cited
              </span>
              <p className="text-body text-white">{request.reason}</p>
            </div>
          </div>

          <div className="panel p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="info" className="text-cipher-blue" />
              <h3 className="text-micro-mono font-mono font-bold text-cipher-blue uppercase">
                What approval does
              </h3>
            </div>
            <ul className="space-y-3 text-small text-mist">
              <li className="flex gap-3">
                <span className="text-micro-mono font-mono text-proof-green mt-0.5">01</span>
                Decrypts your wrapped fragment locally with your private key.
              </li>
              <li className="flex gap-3">
                <span className="text-micro-mono font-mono text-proof-green mt-0.5">02</span>
                Re-wraps the fragment to the requester&apos;s ephemeral public key (only they
                can decrypt it).
              </li>
              <li className="flex gap-3">
                <span className="text-micro-mono font-mono text-proof-green mt-0.5">03</span>
                Posts the wrapped response. The server still cannot read your fragment.
              </li>
            </ul>
          </div>

          {err && (
            <div className="chip chip-breach w-full justify-start">
              <Icon name="error" /> {err}
            </div>
          )}
        </section>

        <aside className="lg:col-span-4 space-y-6">
          {submitted ? (
            <div className="panel p-6 space-y-3 border-proof-green/30">
              <div className="flex items-center gap-2">
                <Icon
                  name={
                    myExistingResponse?.decision === "approve" ? "check_circle" : "cancel"
                  }
                  filled
                  className={
                    myExistingResponse?.decision === "approve"
                      ? "text-proof-green"
                      : "text-breach-red"
                  }
                />
                <h3 className="text-card-title font-semibold text-white">
                  Response submitted
                </h3>
              </div>
              <p className="text-small text-mist">
                You {myExistingResponse?.decision}d this request on{" "}
                {new Date(myExistingResponse?.respondedAt ?? "").toLocaleString()}.
              </p>
              <Link href="/guardian" className="btn-secondary w-full">
                Back to inbox
              </Link>
            </div>
          ) : (
            <div className="panel p-6 space-y-3">
              <h3 className="text-micro-mono font-mono font-bold text-ash uppercase">
                Decision
              </h3>
              <button
                onClick={() => decide("approve")}
                disabled={Boolean(busy)}
                className="btn-primary w-full"
              >
                {busy === "approve" ? (
                  <>
                    <Icon name="hourglass_top" /> SIGNING…
                  </>
                ) : (
                  <>
                    <Icon name="check" /> Approve & re-wrap
                  </>
                )}
              </button>
              <button
                onClick={() => decide("deny")}
                disabled={Boolean(busy)}
                className="btn-danger w-full"
              >
                {busy === "deny" ? (
                  <>
                    <Icon name="hourglass_top" /> RECORDING…
                  </>
                ) : (
                  <>
                    <Icon name="block" /> Deny
                  </>
                )}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-micro-mono font-mono text-ash uppercase block mb-1">
        {label}
      </span>
      <span className="text-body text-white">{children}</span>
    </div>
  );
}

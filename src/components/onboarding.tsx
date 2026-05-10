"use client";

import { useState } from "react";
import { useIdentity } from "./identity-provider";
import { Icon } from "./icon";

const PRESETS = [
  { label: "Vault Owner", hint: "Creates and seals the vault. Holds no fragments." },
  { label: "Guardian G-01", hint: "Independent guardian. Approves recovery." },
  { label: "Guardian G-02", hint: "Independent guardian. Approves recovery." },
  { label: "Guardian G-03", hint: "Independent guardian. Approves recovery." },
];

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { identity, identities, ready, createIdentity, switchTo } = useIdentity();
  const [working, setWorking] = useState<string | null>(null);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-ash text-micro-mono font-mono">
        DERIVING SESSION KEY…
      </div>
    );
  }

  if (identity) return <>{children}</>;

  const handleProvision = async () => {
    setWorking("all");
    try {
      for (const p of PRESETS) {
        if (!identities.find((i) => i.displayName === p.label)) await createIdentity(p.label);
      }
      const owner = identities.find((i) => i.displayName === PRESETS[0].label);
      if (owner) await switchTo(owner.userId);
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="min-h-screen px-gutter py-12 grid place-items-center">
      <div className="max-w-2xl w-full panel p-10 space-y-8">
        <div className="space-y-3">
          <span className="chip chip-cipher">SESSION INITIALIZATION</span>
          <h1 className="text-hero font-display tracking-tight text-white">
            Forge your quorum.
          </h1>
          <p className="text-body text-mist">
            Triskele requires a vault owner and three independent guardians. Each identity gets
            its own ECDH-P256 keypair, generated locally — private keys never leave this device.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESETS.map((p) => {
            const exists = identities.find((i) => i.displayName === p.label);
            return (
              <button
                key={p.label}
                onClick={async () => {
                  setWorking(p.label);
                  try {
                    if (exists) await switchTo(exists.userId);
                    else await createIdentity(p.label);
                  } finally {
                    setWorking(null);
                  }
                }}
                disabled={Boolean(working)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  exists
                    ? "border-proof-green/30 bg-proof-green/5"
                    : "border-white/10 hover:border-cipher-blue/40 hover:bg-graphite"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-card-title font-semibold text-white">{p.label}</span>
                  {exists ? (
                    <span className="chip chip-sealed">
                      <Icon name="verified" className="text-xs" /> READY
                    </span>
                  ) : (
                    <span className="chip chip-ash">PENDING</span>
                  )}
                </div>
                <p className="text-small text-ash">{p.hint}</p>
                {working === p.label && (
                  <p className="text-micro-mono font-mono text-cipher-blue mt-2">
                    GENERATING KEYPAIR…
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-t border-white/5 pt-6">
          <p className="text-small text-ash max-w-md">
            Tip: provision all four to play through the full seal-and-recover flow. You can
            switch between identities from the top bar.
          </p>
          <button
            className="btn-primary"
            onClick={handleProvision}
            disabled={Boolean(working) || identities.length >= PRESETS.length}
          >
            <Icon name="bolt" />
            Provision all four
          </button>
        </div>
      </div>
    </div>
  );
}

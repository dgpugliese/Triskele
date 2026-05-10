"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Icon } from "./icon";

const PRESETS = [
  {
    label: "You (Vault Owner)",
    hint: "Creates and seals vaults. The person whose secrets are being protected.",
    icon: "person",
  },
  {
    label: "Guardian One",
    hint: "Holds one piece of every key. Approves to unseal.",
    icon: "shield_person",
  },
  {
    label: "Guardian Two",
    hint: "Holds one piece of every key. Approves to unseal.",
    icon: "shield_person",
  },
  {
    label: "Guardian Three",
    hint: "Holds one piece of every key. Approves to unseal.",
    icon: "shield_person",
  },
];

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { mode, session, identity, identities, ready, createIdentity, switchTo } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [working, setWorking] = useState<string | null>(null);

  // Supabase mode: bounce unauthenticated visits to /login.
  useEffect(() => {
    if (!ready) return;
    if (mode === "supabase" && !session) {
      const next = encodeURIComponent(pathname || "/app");
      router.replace(`/login?next=${next}`);
    }
  }, [ready, mode, session, pathname, router]);

  if (!ready) return <Loader label="Loading…" />;

  if (mode === "supabase") {
    if (!session) return <Loader label="Redirecting to sign in…" />;
    if (!identity) return <Loader label="Provisioning device keypair…" />;
    return <>{children}</>;
  }

  // Demo mode: show the provisioning UI when no identity is selected.
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

  const allDone = identities.length >= PRESETS.length;

  return (
    <div className="min-h-screen px-5 sm:px-6 md:px-10 py-10 sm:py-12 grid place-items-center">
      <div className="max-w-3xl w-full panel p-6 sm:p-8 md:p-12 space-y-8 sm:space-y-10">
        <div className="space-y-4">
          <div>
            <Link
              href="/"
              className="text-micro-mono font-mono text-ash hover:text-cipher-blue inline-flex items-center gap-1 py-1"
            >
              <Icon name="arrow_back" className="text-sm" /> Back to home
            </Link>
          </div>
          <div>
            <span className="chip chip-cipher">SET UP YOUR VAULT</span>
          </div>
          <h1 className="text-[32px] sm:text-[36px] md:text-hero font-display font-semibold tracking-tight text-white leading-tight">
            Let&apos;s create your trusted circle.
          </h1>
          <p className="text-body text-mist max-w-xl leading-relaxed">
            For this demo, we&apos;ll set up four people on this single device — you, plus
            three guardians — so you can experience both sides of the flow. In real life,
            each guardian would set up Triskele on their own device.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESETS.map((p, i) => {
            const exists = identities.find((i2) => i2.displayName === p.label);
            const busy = working === p.label;
            return (
              <li key={p.label}>
                <button
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
                  className={`w-full text-left p-5 rounded-lg border transition-all duration-200
                    ${
                      exists
                        ? "border-proof-green/30 bg-proof-green/5"
                        : "border-white/10 hover:border-cipher-blue/40 hover:bg-graphite"
                    }
                    ${busy ? "opacity-70" : ""}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 transition-colors ${
                        exists
                          ? "bg-proof-green/10 text-proof-green border border-proof-green/30"
                          : "bg-cipher-blue/5 text-cipher-blue border border-cipher-blue/20"
                      }`}
                    >
                      <Icon name={p.icon} className="text-xl" filled={Boolean(exists)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-card-title font-semibold text-white">
                          {p.label}
                        </span>
                        {exists ? (
                          <span className="chip chip-sealed">
                            <Icon name="check" className="text-xs" /> READY
                          </span>
                        ) : (
                          <span className="text-micro-mono font-mono text-ash">
                            {(i + 1).toString().padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <p className="text-small text-mist">{p.hint}</p>
                      {busy && (
                        <p className="text-micro-mono font-mono text-cipher-blue mt-2 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cipher-blue animate-pulse" />
                          Generating encryption key on this device…
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-t border-white/5 pt-6">
          <p className="text-small text-ash max-w-md">
            One click sets all four up at once so you can dive into the demo flow right away.
          </p>
          <button
            className="btn-primary whitespace-nowrap"
            onClick={handleProvision}
            disabled={Boolean(working) || allDone}
          >
            {working === "all" ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-void/40 border-t-void animate-spin" />
                Setting up…
              </>
            ) : allDone ? (
              <>
                <Icon name="check" /> All set
              </>
            ) : (
              <>
                <Icon name="bolt" /> Set up all four
              </>
            )}
          </button>
        </div>

        <div className="flex items-start gap-3 text-small text-ash border-t border-white/5 pt-6">
          <Icon name="lock" className="text-cipher-blue mt-0.5" />
          <p>
            Every key is generated in your browser. Nothing is uploaded until you create a
            vault, and even then it&apos;s already encrypted before it leaves this page.
          </p>
        </div>
      </div>
    </div>
  );
}

function Loader({ label }: { label: string }) {
  return (
    <div className="min-h-screen grid place-items-center px-5">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 mx-auto rounded-full border-2 border-cipher-blue/30 border-t-cipher-blue animate-spin" />
        <p className="text-micro-mono font-mono text-ash uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}

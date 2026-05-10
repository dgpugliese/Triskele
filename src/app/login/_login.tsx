"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthChrome } from "@/components/auth-chrome";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/icon";
import { localStore } from "@/lib/store/local-store";
import type { Identity } from "@/lib/store/types";

type Tab = "password" | "magic";

export function LoginScreen() {
  const { mode, session, ready, signInWithPassword, signInWithMagicLink } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/app";

  // If already signed in (or in demo mode and identity exists), bounce to /app.
  useEffect(() => {
    if (!ready) return;
    if (mode === "supabase" && session) router.replace(next);
  }, [ready, mode, session, router, next]);

  return (
    <AuthChrome>
      <div className="space-y-7">
        <div className="space-y-2">
          <span className="chip chip-cipher inline-flex">SIGN IN</span>
          <h1 className="text-[28px] sm:text-[32px] leading-tight font-display font-semibold tracking-tight text-white">
            Welcome back.
          </h1>
          <p className="text-body text-mist">
            Open your vaults and review pending guardian requests.
          </p>
        </div>

        {mode === "supabase" ? <SupabaseLogin signInWithPassword={signInWithPassword} signInWithMagicLink={signInWithMagicLink} /> : <DemoLogin />}

        <p className="text-small text-ash text-center pt-2 border-t border-white/5">
          New here?{" "}
          <Link href="/signup" className="text-cipher-blue hover:text-white">
            Set up your circle →
          </Link>
        </p>
      </div>
    </AuthChrome>
  );
}

function SupabaseLogin({
  signInWithPassword,
  signInWithMagicLink,
}: {
  signInWithPassword: (e: string, p: string) => Promise<{ error?: string }>;
  signInWithMagicLink: (e: string) => Promise<{ error?: string }>;
}) {
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (tab === "password") {
        const { error } = await signInWithPassword(email, password);
        if (error) setErr(error);
      } else {
        const { error } = await signInWithMagicLink(email);
        if (error) setErr(error);
        else setLinkSent(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (linkSent) {
    return (
      <div className="panel p-6 space-y-3 border-proof-green/30">
        <div className="flex items-center gap-3">
          <Icon name="mark_email_read" className="text-proof-green text-2xl" filled />
          <h2 className="text-card-title font-semibold text-white">Check your inbox</h2>
        </div>
        <p className="text-small text-mist">
          We sent a sign-in link to <span className="text-white">{email}</span>. Tap it on
          this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div role="tablist" className="grid grid-cols-2 gap-2 p-1 bg-graphite/60 rounded-lg border border-white/5">
        <TabButton active={tab === "password"} onClick={() => setTab("password")}>
          Password
        </TabButton>
        <TabButton active={tab === "magic"} onClick={() => setTab("magic")}>
          Magic link
        </TabButton>
      </div>

      <Field label="Email">
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-cipher w-full"
          placeholder="you@example.com"
        />
      </Field>

      {tab === "password" && (
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-cipher w-full"
          />
        </Field>
      )}

      {err && (
        <div className="chip chip-breach w-full justify-start">
          <Icon name="error" /> {err}
        </div>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? (
          <>
            <Icon name="hourglass_top" />
            {tab === "password" ? "SIGNING IN…" : "SENDING…"}
          </>
        ) : (
          <>
            <Icon name={tab === "password" ? "login" : "send"} />
            {tab === "password" ? "Sign in" : "Email me a link"}
          </>
        )}
      </button>
    </form>
  );
}

function DemoLogin() {
  const [identities, setIdentities] = useState<Identity[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    void localStore.listIdentities().then(setIdentities);
  }, []);

  const handlePick = async (i: Identity) => {
    await localStore.switchIdentity(i.userId);
    router.push("/app");
  };

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex items-start gap-3">
        <Icon name="info" className="text-cipher-blue mt-0.5" />
        <p className="text-small text-mist">
          This deployment is running in <span className="text-white">demo mode</span> — pick
          a local identity to continue. Configure <code className="font-mono text-cipher-blue">NEXT_PUBLIC_SUPABASE_URL</code> to enable real auth.
        </p>
      </div>

      {identities === null ? (
        <p className="text-micro-mono font-mono text-ash">LOADING…</p>
      ) : identities.length === 0 ? (
        <div className="panel p-6 text-center space-y-3">
          <Icon name="person_off" className="text-ash text-2xl" />
          <p className="text-small text-mist">
            No local identities on this device yet.
          </p>
          <Link href="/signup" className="btn-primary w-full">
            <Icon name="bolt" /> Set up your circle
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {identities.map((i) => (
            <li key={i.userId}>
              <button
                onClick={() => void handlePick(i)}
                className="w-full text-left panel p-4 flex items-center justify-between hover:border-cipher-blue/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-cipher-blue/10 border border-cipher-blue/30 grid place-items-center shrink-0">
                    <Icon name="person" className="text-cipher-blue" filled />
                  </div>
                  <div className="min-w-0">
                    <div className="text-card-title font-semibold text-white truncate">
                      {i.displayName}
                    </div>
                    <div className="text-micro-mono font-mono text-ash truncate">
                      {i.userId.slice(0, 12)}…
                    </div>
                  </div>
                </div>
                <Icon name="chevron_right" className="text-ash" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-micro-mono font-mono text-ash uppercase tracking-widest">
        {label}
      </span>
      {children}
    </label>
  );
}

function TabButton({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`text-small py-2 rounded transition-colors ${
        active ? "bg-cipher-blue text-void font-semibold" : "text-ash hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

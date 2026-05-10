"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthChrome } from "@/components/auth-chrome";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/icon";

export function SignupScreen() {
  const { mode, ready, session, signUpWithPassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (mode === "supabase" && session) router.replace("/app");
  }, [ready, mode, session, router]);

  return (
    <AuthChrome>
      <div className="space-y-7">
        <div className="space-y-2">
          <span className="chip chip-cipher inline-flex">CREATE ACCOUNT</span>
          <h1 className="text-[28px] sm:text-[32px] leading-tight font-display font-semibold tracking-tight text-white">
            Set up your trusted circle.
          </h1>
          <p className="text-body text-mist">
            Your account holds the metadata. Your keys live in your browser.
          </p>
        </div>

        {mode === "supabase" ? (
          <SupabaseSignup signUpWithPassword={signUpWithPassword} />
        ) : (
          <DemoSignup />
        )}

        <p className="text-small text-ash text-center pt-2 border-t border-white/5">
          Already have an account?{" "}
          <Link href="/login" className="text-cipher-blue hover:text-white">
            Sign in →
          </Link>
        </p>
      </div>
    </AuthChrome>
  );
}

function SupabaseSignup({
  signUpWithPassword,
}: {
  signUpWithPassword: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr("Use at least 8 characters for your password.");
      return;
    }
    setBusy(true);
    try {
      const { error, needsConfirmation } = await signUpWithPassword(email, password, displayName);
      if (error) {
        setErr(error);
        return;
      }
      if (needsConfirmation) {
        setNeedsConfirm(true);
      } else {
        router.replace("/app");
      }
    } finally {
      setBusy(false);
    }
  };

  if (needsConfirm) {
    return (
      <div className="panel p-6 space-y-3 border-proof-green/30">
        <div className="flex items-center gap-3">
          <Icon name="mark_email_read" className="text-proof-green text-2xl" filled />
          <h2 className="text-card-title font-semibold text-white">Confirm your email</h2>
        </div>
        <p className="text-small text-mist">
          We sent a confirmation link to <span className="text-white">{email}</span>. Open
          it to activate your account and sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Display name">
        <input
          type="text"
          autoComplete="name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input-cipher w-full"
          placeholder="What your guardians will see"
        />
      </Field>
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
      <Field label="Password">
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-cipher w-full"
          placeholder="At least 8 characters"
        />
      </Field>

      {err && (
        <div className="chip chip-breach w-full justify-start">
          <Icon name="error" /> {err}
        </div>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? (
          <>
            <Icon name="hourglass_top" /> CREATING ACCOUNT…
          </>
        ) : (
          <>
            <Icon name="bolt" /> Create account
          </>
        )}
      </button>

      <p className="text-small text-ash text-center">
        Triskele encrypts everything in your browser. We never see your vault contents.
      </p>
    </form>
  );
}

function DemoSignup() {
  return (
    <div className="space-y-4">
      <div className="panel p-4 flex items-start gap-3">
        <Icon name="info" className="text-cipher-blue mt-0.5" />
        <p className="text-small text-mist">
          This deployment is running in <span className="text-white">demo mode</span>. The
          full provisioning flow is inside the app.
        </p>
      </div>
      <Link href="/app" className="btn-primary w-full">
        <Icon name="bolt" /> Provision a demo circle →
      </Link>
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

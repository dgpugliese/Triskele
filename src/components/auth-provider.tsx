"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { generateGuardianKeypair } from "@/lib/crypto";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore } from "@/lib/store/local-store";
import type { Identity } from "@/lib/store/types";

export type AuthMode = "supabase" | "demo";

type AuthCtx = {
  mode: AuthMode;
  ready: boolean;
  session: Session | null;
  user: User | null;
  identity: Identity | null;
  identities: Identity[];
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (email: string, password: string, displayName: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  /** Demo-mode helper to create a new local identity (with fresh ECDH keypair). */
  createIdentity: (displayName: string) => Promise<Identity>;
  /** Demo-mode helper to switch the active local identity. */
  switchTo: (userId: string) => Promise<void>;
  /** Force a re-read of local identity state from storage. */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

const mode: AuthMode = isSupabaseConfigured() ? "supabase" : "demo";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setIdentities(await localStore.listIdentities());
    setIdentity(localStore.getCurrentIdentity());
  }, []);

  // Hydrate Supabase session on mount and subscribe to changes.
  useEffect(() => {
    if (mode !== "supabase") {
      void refresh().finally(() => setReady(true));
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
      setUser(sess?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  // When the authenticated user changes, ensure a matching local identity (keypair + label).
  useEffect(() => {
    if (mode !== "supabase") return;
    if (!user) {
      setIdentity(null);
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const existing = await localStore.getIdentityByAuthUserId(user.id);
      if (existing) {
        await localStore.switchIdentityByAuthUserId(user.id);
        if (cancelled) return;
        await refresh();
        setReady(true);
        return;
      }
      const displayName =
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "You";
      const kp = await generateGuardianKeypair();
      const created = await localStore.ensureIdentityForAuthUser(user.id, displayName, kp.publicKeyJwk);
      localStore.storePrivateKey(created.userId, kp.privateKeyJwk);
      if (cancelled) return;
      await refresh();
      setReady(true);
      void created;
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refresh]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth is not configured on this deployment." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUpWithPassword = useCallback(
    async (email: string, password: string, displayName: string) => {
      const supabase = getSupabase();
      if (!supabase) return { error: "Auth is not configured on this deployment." };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) return { error: error.message };
      const needsConfirmation = !data.session;
      return { needsConfirmation };
    },
    [],
  );

  const signInWithMagicLink = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: "Auth is not configured on this deployment." };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/app` : undefined,
      },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIdentity(null);
  }, []);

  const createIdentity = useCallback(
    async (displayName: string) => {
      const kp = await generateGuardianKeypair();
      const created = await localStore.ensureIdentity(displayName, kp.publicKeyJwk);
      // Demo-only: persist private key locally so this device can act as that guardian.
      // In Supabase mode each guardian's private key stays on their own device.
      localStore.storePrivateKey(created.userId, kp.privateKeyJwk);
      await refresh();
      return created;
    },
    [refresh],
  );

  const switchTo = useCallback(
    async (userId: string) => {
      await localStore.switchIdentity(userId);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<AuthCtx>(
    () => ({
      mode,
      ready,
      session,
      user,
      identity,
      identities,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      signOut,
      createIdentity,
      switchTo,
      refresh,
    }),
    [
      ready,
      session,
      user,
      identity,
      identities,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      signOut,
      createIdentity,
      switchTo,
      refresh,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

/** Back-compat alias for the existing useIdentity() consumers. */
export const useIdentity = useAuth;

export function getAuthMode(): AuthMode {
  return mode;
}

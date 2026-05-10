"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { generateGuardianKeypair } from "@/lib/crypto";
import { localStore } from "@/lib/store/local-store";
import type { Identity } from "@/lib/store/types";

type Ctx = {
  identity: Identity | null;
  identities: Identity[];
  ready: boolean;
  createIdentity: (displayName: string) => Promise<Identity>;
  switchTo: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const IdentityContext = createContext<Ctx | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const list = await localStore.listIdentities();
    setIdentities(list);
    setIdentity(localStore.getCurrentIdentity());
  }, []);

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [refresh]);

  const createIdentity = useCallback(
    async (displayName: string) => {
      const kp = await generateGuardianKeypair();
      const created = await localStore.ensureIdentity(displayName, kp.publicKeyJwk);
      // Demo-only: persist private key locally so this device can act as that guardian.
      // In production each guardian's private key stays only on their own device.
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

  return (
    <IdentityContext.Provider value={{ identity, identities, ready, createIdentity, switchTo, refresh }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be inside IdentityProvider");
  return ctx;
}

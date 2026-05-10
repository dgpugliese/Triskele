"use client";

import { bytesToHex } from "@/lib/crypto";
import type {
  AuditEvent,
  FragmentResponse,
  Guardian,
  Identity,
  RecoveryRequest,
  Vault,
  VaultDetail,
  VaultStore,
} from "./types";

const NS = "triskele.v1";
const ACTIVE_KEY = `${NS}.activeUserId`;
const IDENTITIES_KEY = `${NS}.identities`;
const PRIVATE_KEYS_KEY = `${NS}.privateKeys`;
const VAULTS_KEY = `${NS}.vaults`;
const GUARDIANS_KEY = `${NS}.guardians`;
const REQUESTS_KEY = `${NS}.requests`;
const RESPONSES_KEY = `${NS}.responses`;
const EVENTS_KEY = `${NS}.events`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function uuid(): string {
  return crypto.randomUUID();
}

function shortIdFor(prefix: "VLT" | "REQ"): string {
  return `${prefix}-${bytesToHex(crypto.getRandomValues(new Uint8Array(4))).toUpperCase()}`;
}

export class LocalVaultStore implements VaultStore {
  getCurrentIdentity(): Identity | null {
    const id = read<string | null>(ACTIVE_KEY, null);
    if (!id) return null;
    const list = read<Identity[]>(IDENTITIES_KEY, []);
    return list.find((i) => i.userId === id) ?? null;
  }

  async ensureIdentity(displayName: string, publicKeyJwk: JsonWebKey): Promise<Identity> {
    const list = read<Identity[]>(IDENTITIES_KEY, []);
    const existing = list.find((i) => i.displayName === displayName);
    if (existing) {
      write(ACTIVE_KEY, existing.userId);
      return existing;
    }
    const identity: Identity = { userId: uuid(), displayName, publicKeyJwk };
    list.push(identity);
    write(IDENTITIES_KEY, list);
    write(ACTIVE_KEY, identity.userId);
    return identity;
  }

  async listIdentities(): Promise<Identity[]> {
    return read<Identity[]>(IDENTITIES_KEY, []);
  }

  async switchIdentity(userId: string): Promise<void> {
    write(ACTIVE_KEY, userId);
  }

  storePrivateKey(userId: string, jwk: JsonWebKey) {
    const map = read<Record<string, JsonWebKey>>(PRIVATE_KEYS_KEY, {});
    map[userId] = jwk;
    write(PRIVATE_KEYS_KEY, map);
  }

  getPrivateKey(userId: string): JsonWebKey | null {
    const map = read<Record<string, JsonWebKey>>(PRIVATE_KEYS_KEY, {});
    return map[userId] ?? null;
  }

  async listVaults(): Promise<Vault[]> {
    const me = this.getCurrentIdentity();
    if (!me) return [];
    const all = read<Vault[]>(VAULTS_KEY, []);
    const guardians = read<Guardian[]>(GUARDIANS_KEY, []);
    const guardingVaultIds = new Set(
      guardians.filter((g) => g.guardianUserId === me.userId).map((g) => g.vaultId),
    );
    return all.filter((v) => v.ownerId === me.userId || guardingVaultIds.has(v.id));
  }

  async getVault(id: string): Promise<VaultDetail | null> {
    const v = read<Vault[]>(VAULTS_KEY, []).find((x) => x.id === id);
    if (!v) return null;
    const guardians = read<Guardian[]>(GUARDIANS_KEY, []).filter((g) => g.vaultId === id);
    const requests = read<RecoveryRequest[]>(REQUESTS_KEY, []).filter((r) => r.vaultId === id);
    const responses = read<FragmentResponse[]>(RESPONSES_KEY, []);
    const events = read<AuditEvent[]>(EVENTS_KEY, []).filter((e) => e.vaultId === id);
    const active = requests.find((r) => r.status === "pending" || r.status === "approved");
    return {
      ...v,
      guardians,
      activeRequest: active
        ? { ...active, responses: responses.filter((rsp) => rsp.requestId === active.id) }
        : undefined,
      events,
    };
  }

  async createVault(
    input: Omit<Vault, "createdAt" | "updatedAt" | "status">,
    guardians: Omit<Guardian, "id" | "vaultId">[],
  ): Promise<Vault> {
    const now = new Date().toISOString();
    const vault: Vault = { ...input, status: "sealed", createdAt: now, updatedAt: now };
    const all = read<Vault[]>(VAULTS_KEY, []);
    all.push(vault);
    write(VAULTS_KEY, all);

    const gAll = read<Guardian[]>(GUARDIANS_KEY, []);
    for (const g of guardians) {
      gAll.push({ ...g, id: uuid(), vaultId: vault.id });
    }
    write(GUARDIANS_KEY, gAll);

    this.recordEvent(vault.id, vault.ownerId, "vault.sealed", {
      threshold: vault.threshold,
      totalShares: vault.totalShares,
    });
    return vault;
  }

  async createRecoveryRequest(
    req: Omit<RecoveryRequest, "id" | "createdAt" | "expiresAt" | "status">,
  ): Promise<RecoveryRequest> {
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const full: RecoveryRequest = {
      ...req,
      id: uuid(),
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    const all = read<RecoveryRequest[]>(REQUESTS_KEY, []);
    all.push(full);
    write(REQUESTS_KEY, all);
    this.recordEvent(full.vaultId, full.requesterId, "recovery.requested", { reason: full.reason });
    return full;
  }

  async listIncomingRequestsForGuardian(): Promise<(RecoveryRequest & { vault: Vault })[]> {
    const me = this.getCurrentIdentity();
    if (!me) return [];
    const guardians = read<Guardian[]>(GUARDIANS_KEY, []).filter(
      (g) => g.guardianUserId === me.userId,
    );
    const vaultIds = new Set(guardians.map((g) => g.vaultId));
    const requests = read<RecoveryRequest[]>(REQUESTS_KEY, []).filter(
      (r) => vaultIds.has(r.vaultId) && r.status === "pending",
    );
    const vaults = read<Vault[]>(VAULTS_KEY, []);
    return requests
      .map((r) => {
        const vault = vaults.find((v) => v.id === r.vaultId);
        return vault ? { ...r, vault } : null;
      })
      .filter((x): x is RecoveryRequest & { vault: Vault } => Boolean(x));
  }

  async submitFragmentResponse(
    input: Omit<FragmentResponse, "id" | "respondedAt">,
  ): Promise<FragmentResponse> {
    const all = read<FragmentResponse[]>(RESPONSES_KEY, []);
    const dedup = all.filter(
      (r) => !(r.requestId === input.requestId && r.guardianId === input.guardianId),
    );
    const full: FragmentResponse = {
      ...input,
      id: uuid(),
      respondedAt: new Date().toISOString(),
    };
    dedup.push(full);
    write(RESPONSES_KEY, dedup);

    const requests = read<RecoveryRequest[]>(REQUESTS_KEY, []);
    const req = requests.find((r) => r.id === input.requestId);
    if (req) {
      this.recordEvent(req.vaultId, req.requesterId, "recovery.response", {
        decision: input.decision,
        guardianId: input.guardianId,
      });
    }
    return full;
  }

  async completeRecovery(requestId: string): Promise<void> {
    const all = read<RecoveryRequest[]>(REQUESTS_KEY, []);
    const next = all.map((r) =>
      r.id === requestId
        ? { ...r, status: "completed" as const, completedAt: new Date().toISOString() }
        : r,
    );
    write(REQUESTS_KEY, next);
    const req = next.find((r) => r.id === requestId);
    if (req) this.recordEvent(req.vaultId, req.requesterId, "recovery.completed", {});
  }

  recordEvent(vaultId: string, actorId: string, eventType: string, payload: Record<string, unknown>) {
    const events = read<AuditEvent[]>(EVENTS_KEY, []);
    events.push({
      id: uuid(),
      vaultId,
      actorId,
      eventType,
      payload,
      createdAt: new Date().toISOString(),
    });
    write(EVENTS_KEY, events);
  }

  getIdentityById(userId: string): Identity | null {
    return read<Identity[]>(IDENTITIES_KEY, []).find((i) => i.userId === userId) ?? null;
  }

  shortIdFor = shortIdFor;
}

export const localStore = new LocalVaultStore();

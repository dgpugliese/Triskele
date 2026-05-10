import type { EncryptedBlob, WrappedFragment } from "@/lib/crypto";

export type Identity = {
  userId: string;
  displayName: string;
  publicKeyJwk: JsonWebKey;
};

export type Vault = {
  id: string;
  shortId: string;
  ownerId: string;
  title: string;
  description?: string;
  blob: EncryptedBlob;
  threshold: number;
  totalShares: number;
  status: "sealed" | "unsealing" | "unsealed" | "revoked";
  createdAt: string;
  updatedAt: string;
};

export type Guardian = {
  id: string;
  vaultId: string;
  guardianUserId: string;
  guardianLabel: string;
  fragmentIndex: number;
  fragmentFingerprint: string;
  wrapped: WrappedFragment;
  acceptedAt?: string;
};

export type RecoveryRequest = {
  id: string;
  shortId: string;
  vaultId: string;
  requesterId: string;
  reason: string;
  requesterPublicKeyJwk: JsonWebKey;
  status: "pending" | "approved" | "denied" | "expired" | "completed";
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
};

export type FragmentResponse = {
  id: string;
  requestId: string;
  guardianId: string;
  decision: "approve" | "deny";
  rewrapped?: WrappedFragment;
  respondedAt: string;
};

export type AuditEvent = {
  id: string;
  vaultId: string;
  actorId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type VaultDetail = Vault & {
  guardians: Guardian[];
  activeRequest?: RecoveryRequest & { responses: FragmentResponse[] };
  events: AuditEvent[];
};

export interface VaultStore {
  // identity
  getCurrentIdentity(): Identity | null;
  ensureIdentity(displayName: string, publicKeyJwk: JsonWebKey): Promise<Identity>;
  listIdentities(): Promise<Identity[]>;
  switchIdentity(userId: string): Promise<void>;

  // vaults
  listVaults(): Promise<Vault[]>;
  getVault(id: string): Promise<VaultDetail | null>;
  createVault(input: Omit<Vault, "createdAt" | "updatedAt" | "status">, guardians: Omit<Guardian, "id" | "vaultId">[]): Promise<Vault>;

  // recovery
  createRecoveryRequest(req: Omit<RecoveryRequest, "id" | "createdAt" | "expiresAt" | "status">): Promise<RecoveryRequest>;
  listIncomingRequestsForGuardian(): Promise<(RecoveryRequest & { vault: Vault })[]>;
  submitFragmentResponse(input: Omit<FragmentResponse, "id" | "respondedAt">): Promise<FragmentResponse>;
  completeRecovery(requestId: string): Promise<void>;
}

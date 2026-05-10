export * from "./aes";
export * from "./shamir";
export * from "./wrap";
export * from "./encoding";

import { generateDataKey, exportKeyRaw, importKeyRaw, encryptString, decryptString, type EncryptedBlob } from "./aes";
import { splitSecret, combineShares, shareFingerprint, type ShamirShare } from "./shamir";
import { wrapShareForGuardian, unwrapShareWithGuardianKey, type WrappedFragment } from "./wrap";
import { bytesToHex } from "./encoding";

export type SealedVault = {
  vaultId: string;
  blob: EncryptedBlob;
  threshold: number;
  totalShares: number;
  fragments: { guardianId: string; fingerprint: string; wrapped: WrappedFragment }[];
};

export type GuardianRef = { id: string; publicKeyJwk: JsonWebKey };

/**
 * Seal a vault: AES-GCM-256 encrypt the plaintext with a fresh data key, split the data key
 * via Shamir({threshold} of {guardians.length}), and wrap each share for its guardian.
 *
 * The cleartext data key is never persisted — only ciphertext + wrapped shares.
 */
export async function sealVault(
  plaintext: string,
  guardians: GuardianRef[],
  threshold: number,
): Promise<SealedVault> {
  if (guardians.length < threshold) throw new Error("not enough guardians for threshold");
  const key = await generateDataKey();
  const blob = await encryptString(plaintext, key);
  const raw = await exportKeyRaw(key);
  const shares = await splitSecret(raw, guardians.length, threshold);
  const fragments = await Promise.all(
    guardians.map(async (g, i) => ({
      guardianId: g.id,
      fingerprint: shareFingerprint(shares[i]),
      wrapped: await wrapShareForGuardian(shares[i], g.publicKeyJwk),
    })),
  );
  raw.fill(0);
  const vaultId = bytesToHex(crypto.getRandomValues(new Uint8Array(8))).toUpperCase();
  return { vaultId, blob, threshold, totalShares: guardians.length, fragments };
}

/**
 * Unseal: combine `threshold` plaintext Shamir shares back into the data key, decrypt the blob.
 */
export async function unsealVault(
  blob: EncryptedBlob,
  shares: ShamirShare[],
): Promise<string> {
  const raw = await combineShares(shares);
  const key = await importKeyRaw(raw);
  raw.fill(0);
  return decryptString(blob, key);
}

export type { ShamirShare, EncryptedBlob, WrappedFragment };

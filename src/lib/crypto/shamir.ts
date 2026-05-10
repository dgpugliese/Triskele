import { bytesToHex, hexToBytes } from "./encoding";

export type ShamirShare = string;

// Lazy-imported because `secrets.js-grempe` initializes a CSPRNG at module load,
// which fails in Next.js SSR bundles. All call sites are async / browser-only.
async function lib() {
  const mod = await import("secrets.js-grempe");
  return (mod as unknown as { default: typeof import("secrets.js-grempe") }).default ?? mod;
}

export async function splitSecret(
  secret: Uint8Array,
  shares: number,
  threshold: number,
): Promise<ShamirShare[]> {
  if (threshold < 2) throw new Error("threshold must be >= 2");
  if (shares < threshold) throw new Error("shares must be >= threshold");
  const s = await lib();
  return s.share(bytesToHex(secret), shares, threshold);
}

export async function combineShares(shares: ShamirShare[]): Promise<Uint8Array> {
  const s = await lib();
  return hexToBytes(s.combine(shares));
}

export function shareFingerprint(share: ShamirShare): string {
  let hash = 0;
  for (let i = 0; i < share.length; i++) {
    hash = (hash * 31 + share.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").toUpperCase();
}

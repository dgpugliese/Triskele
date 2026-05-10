// Minimal Shamir Secret Sharing over GF(2^8) with the AES Rijndael polynomial 0x11b.
// Bytes-native, deterministic, no module-load side effects.
//
// Each byte of the secret is split independently using a random degree-(t-1) polynomial
// f(x) where f(0) = secret_byte. A share is the evaluation at a non-zero x coordinate.
// Reconstruction uses Lagrange interpolation at x=0 across `threshold` shares.
//
// Output share format: hex of `[x_byte, ...y_bytes]` — one self-contained hex string
// per share, where the first byte is the share's x-coordinate (1..255).

import { bytesToHex, hexToBytes } from "./encoding";

export type ShamirShare = string;

// GF(2^8) tables with generator g=3 and AES Rijndael polynomial 0x11b.
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    // x = x * 3 = (x*2) XOR x, with reduction by 0x11b when the high bit set.
    let twoX = x << 1;
    if (x & 0x80) twoX ^= 0x11b;
    x = (twoX ^ x) & 0xff;
  }
  // Mirror to avoid `% 255` in multiply hot-path.
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error("gf division by zero");
  if (a === 0) return 0;
  return EXP[LOG[a] + 255 - LOG[b]];
}

function gfPolyEval(coeffs: number[], x: number): number {
  // Horner's method.
  let acc = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) {
    acc = gfMul(acc, x) ^ coeffs[i];
  }
  return acc & 0xff;
}

function randomByte(): number {
  const b = new Uint8Array(1);
  crypto.getRandomValues(b);
  return b[0];
}

export async function splitSecret(
  secret: Uint8Array,
  shares: number,
  threshold: number,
): Promise<ShamirShare[]> {
  if (threshold < 2) throw new Error("threshold must be >= 2");
  if (shares < threshold) throw new Error("shares must be >= threshold");
  if (shares > 255) throw new Error("shares must be <= 255");

  const xs = new Uint8Array(shares);
  for (let i = 0; i < shares; i++) xs[i] = i + 1;

  const out: Uint8Array[] = Array.from({ length: shares }, () => new Uint8Array(secret.length + 1));
  for (let s = 0; s < shares; s++) out[s][0] = xs[s];

  for (let i = 0; i < secret.length; i++) {
    const coeffs: number[] = [secret[i]];
    for (let k = 1; k < threshold; k++) coeffs.push(randomByte());
    for (let s = 0; s < shares; s++) {
      out[s][i + 1] = gfPolyEval(coeffs, xs[s]);
    }
  }

  return out.map((u) => bytesToHex(u));
}

export async function combineShares(shares: ShamirShare[]): Promise<Uint8Array> {
  if (shares.length < 2) throw new Error("need at least 2 shares");
  const decoded = shares.map((h) => hexToBytes(h));
  const len = decoded[0].length;
  for (const d of decoded) {
    if (d.length !== len) throw new Error("share length mismatch");
  }
  const xs = decoded.map((d) => d[0]);
  if (new Set(xs).size !== xs.length) throw new Error("duplicate share x-coords");

  const out = new Uint8Array(len - 1);
  for (let i = 0; i < out.length; i++) {
    let secret = 0;
    for (let j = 0; j < decoded.length; j++) {
      let num = 1;
      let den = 1;
      for (let m = 0; m < decoded.length; m++) {
        if (m === j) continue;
        num = gfMul(num, xs[m]);
        den = gfMul(den, xs[m] ^ xs[j]);
      }
      const lagrange = gfDiv(num, den);
      secret ^= gfMul(decoded[j][i + 1], lagrange);
    }
    out[i] = secret;
  }
  return out;
}

export function shareFingerprint(share: ShamirShare): string {
  let hash = 0;
  for (let i = 0; i < share.length; i++) {
    hash = (hash * 31 + share.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").toUpperCase();
}

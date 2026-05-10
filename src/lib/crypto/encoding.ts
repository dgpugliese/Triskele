// `BufferSource` typing in TS 5.6+ rejects Uint8Array<ArrayBufferLike>; this widens it.
export type Bytes = Uint8Array & { buffer: ArrayBuffer };

export function asBytes(u8: Uint8Array): Bytes {
  return u8 as Bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2) throw new Error("invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function shortId(hex: string): string {
  const trimmed = hex.replace(/^0x/, "").toUpperCase();
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

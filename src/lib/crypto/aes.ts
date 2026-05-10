import { asBytes, base64ToBytes, bytesToBase64 } from "./encoding";

const ALG = "AES-GCM";
const KEY_BITS = 256;
const IV_BYTES = 12;

export type EncryptedBlob = { ciphertext: string; iv: string };

export async function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: ALG, length: KEY_BITS }, true, ["encrypt", "decrypt"]);
}

export async function exportKeyRaw(key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}

export async function importKeyRaw(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", asBytes(raw), { name: ALG }, true, ["encrypt", "decrypt"]);
}

export async function encryptString(plaintext: string, key: CryptoKey): Promise<EncryptedBlob> {
  const iv = asBytes(crypto.getRandomValues(new Uint8Array(IV_BYTES)));
  const enc = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: ALG, iv }, key, enc));
  return { ciphertext: bytesToBase64(ct), iv: bytesToBase64(iv) };
}

export async function decryptString(blob: EncryptedBlob, key: CryptoKey): Promise<string> {
  const iv = asBytes(base64ToBytes(blob.iv));
  const ct = asBytes(base64ToBytes(blob.ciphertext));
  const pt = await crypto.subtle.decrypt({ name: ALG, iv }, key, ct);
  return new TextDecoder().decode(pt);
}

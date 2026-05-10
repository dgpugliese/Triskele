import { asBytes, base64ToBytes, bytesToBase64 } from "./encoding";

const KDF_INFO = "triskele-fragment-wrap-v1";

export type WrappedFragment = {
  ciphertext: string;
  iv: string;
  ephemeralPublicKey: string;
};

export type GuardianKeypair = {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
};

export async function generateGuardianKeypair(): Promise<GuardianKeypair> {
  const kp = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"],
  );
  const [pub, priv] = await Promise.all([
    crypto.subtle.exportKey("jwk", kp.publicKey),
    crypto.subtle.exportKey("jwk", kp.privateKey),
  ]);
  return { publicKeyJwk: pub, privateKeyJwk: priv };
}

async function deriveAesKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256,
  );
  const baseKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: asBytes(salt),
      info: asBytes(new TextEncoder().encode(KDF_INFO)),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Wrap a Shamir share so only the guardian holding the matching private key can read it.
 * Uses ECDH(P-256) → HKDF → AES-GCM-256 with a fresh ephemeral keypair per wrap.
 */
export async function wrapShareForGuardian(
  share: string,
  guardianPublicJwk: JsonWebKey,
): Promise<WrappedFragment> {
  const guardianPub = await crypto.subtle.importKey(
    "jwk",
    guardianPublicJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits", "deriveKey"],
  );
  const iv = asBytes(crypto.getRandomValues(new Uint8Array(12)));
  const aes = await deriveAesKey(ephemeral.privateKey, guardianPub, iv);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aes,
      asBytes(new TextEncoder().encode(share)),
    ),
  );
  const ephemeralJwk = await crypto.subtle.exportKey("jwk", ephemeral.publicKey);
  return {
    ciphertext: bytesToBase64(ct),
    iv: bytesToBase64(iv),
    ephemeralPublicKey: JSON.stringify(ephemeralJwk),
  };
}

export async function unwrapShareWithGuardianKey(
  wrapped: WrappedFragment,
  guardianPrivateJwk: JsonWebKey,
): Promise<string> {
  const guardianPriv = await crypto.subtle.importKey(
    "jwk",
    guardianPrivateJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits", "deriveKey"],
  );
  const ephemeralPub = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(wrapped.ephemeralPublicKey) as JsonWebKey,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
  const iv = asBytes(base64ToBytes(wrapped.iv));
  const aes = await deriveAesKey(guardianPriv, ephemeralPub, iv);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aes,
    asBytes(base64ToBytes(wrapped.ciphertext)),
  );
  return new TextDecoder().decode(pt);
}

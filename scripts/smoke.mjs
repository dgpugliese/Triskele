// End-to-end smoke test for the Triskele cryptography:
// owner seals a vault, three guardians re-wrap their fragments to a recovery request,
// owner reconstructs the data-encryption key and decrypts the original plaintext.
//
// Uses Node's WebCrypto + tsx to load TS sources directly. Skips the storage layer
// (which is browser-coupled via localStorage); the crypto layer is what we want
// to validate independently.

import { webcrypto } from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { sealVault, unsealVault, generateGuardianKeypair, unwrapShareWithGuardianKey, wrapShareForGuardian } =
  await import("../src/lib/crypto/index.ts");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok ─", msg);
}

const PLAINTEXT =
  "BEGIN VAULT PAYLOAD\nNotary: 0x9F3A...C21B\nAccess key: hunter2-but-classier\nEND";

// 1. Three guardians generate keypairs locally.
const guardians = await Promise.all(
  ["G-01", "G-02", "G-03"].map(async (label) => {
    const kp = await generateGuardianKeypair();
    return { id: label, label, ...kp };
  }),
);
assert(guardians.length === 3, "three guardian keypairs generated");

// 2. Owner seals the payload with a 3-of-3 quorum.
const sealed = await sealVault(
  PLAINTEXT,
  guardians.map((g) => ({ id: g.id, publicKeyJwk: g.publicKeyJwk })),
  3,
);
assert(sealed.fragments.length === 3, "vault produced 3 wrapped fragments");
assert(sealed.threshold === 3, "threshold preserved");
assert(typeof sealed.blob.ciphertext === "string", "ciphertext present");

// 3. Owner generates an ephemeral keypair for this recovery request.
const requesterKp = await generateGuardianKeypair();

// 4. Each guardian decrypts their wrapped fragment, then re-wraps it to the requester.
const responses = [];
for (const frag of sealed.fragments) {
  const guardian = guardians.find((g) => g.id === frag.guardianId);
  const share = await unwrapShareWithGuardianKey(frag.wrapped, guardian.privateKeyJwk);
  const rewrapped = await wrapShareForGuardian(share, requesterKp.publicKeyJwk);
  responses.push(rewrapped);
}
assert(responses.length === 3, "three rewrapped responses collected");

// 5. Requester unwraps each response with their private key and reconstructs.
const shares = [];
for (const r of responses) {
  shares.push(await unwrapShareWithGuardianKey(r, requesterKp.privateKeyJwk));
}
const recovered = await unsealVault(sealed.blob, shares);
assert(recovered === PLAINTEXT, "round-trip plaintext matches");

// 6. Confirm that fewer than threshold shares is insufficient (catch the misuse).
let threw = false;
try {
  await unsealVault(sealed.blob, shares.slice(0, 2));
} catch {
  threw = true;
}
assert(threw, "decrypting with sub-threshold shares fails");

// 7. Confirm a wrong guardian's private key cannot unwrap a fragment.
let wrongKey = false;
try {
  await unwrapShareWithGuardianKey(sealed.fragments[0].wrapped, guardians[1].privateKeyJwk);
} catch {
  wrongKey = true;
}
assert(wrongKey, "fragment cannot be unwrapped by another guardian's key");

console.log("\nALL OK · Triskele crypto round-trip verified.");

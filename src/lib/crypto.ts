// AES-GCM-256 with PBKDF2-derived keys via Web Crypto API.
// Used by the optional E2E encrypted cloud sync feature.

const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

const enc = new TextEncoder();

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export type Ciphertext = { salt: Uint8Array; iv: Uint8Array; data: ArrayBuffer };

export async function encryptBlob(blob: Blob, passphrase: string): Promise<Ciphertext> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const data = await blob.arrayBuffer();
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { salt, iv, data: ct };
}

export async function decryptBlob(c: Ciphertext, passphrase: string, mimeType = 'application/octet-stream'): Promise<Blob> {
  const key = await deriveKey(passphrase, c.salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: c.iv }, key, c.data);
  return new Blob([pt], { type: mimeType });
}

export function packCiphertext(c: Ciphertext): Uint8Array {
  const out = new Uint8Array(SALT_BYTES + IV_BYTES + c.data.byteLength);
  out.set(c.salt, 0);
  out.set(c.iv, SALT_BYTES);
  out.set(new Uint8Array(c.data), SALT_BYTES + IV_BYTES);
  return out;
}

export function unpackCiphertext(buf: Uint8Array): Ciphertext {
  return {
    salt: buf.slice(0, SALT_BYTES),
    iv: buf.slice(SALT_BYTES, SALT_BYTES + IV_BYTES),
    data: buf.slice(SALT_BYTES + IV_BYTES).buffer,
  };
}

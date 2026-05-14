# E2E Encrypted Cloud Sync

## Goal

Optional cross-device sync where the cloud provider never sees plaintext video,
audio, or transcripts. Recovery is by passphrase only.

## Threat model

- Provider is untrusted: assume the storage backend can read every byte at rest
  and in transit.
- Device is trusted: the passphrase lives only in memory + Web Crypto key
  material on the user's device.
- Network is untrusted: TLS plus payload encryption, defense in depth.

## Crypto

- KDF: PBKDF2-SHA256, 250k iterations, 16-byte random salt per blob.
- Cipher: AES-GCM-256, 12-byte random IV per blob, no AAD.
- Packing: `salt(16) || iv(12) || ciphertext` (see `src/lib/crypto.ts`).
- Future: switch KDF to Argon2id via `@noble/hashes` once we have a need.

## Flow

1. User enables sync, enters a passphrase. We derive a verifier (hash of
   passphrase + sentinel), store it under a public key. On future logins we
   re-derive and compare.
2. On entry creation: encrypt the video blob + transcript JSON, upload via
   `SyncAdapter.uploadBlob`.
3. On new device: enter passphrase, fetch IDs via `listIds`, then per-ID
   `downloadBlob`, decrypt, write into local Dexie.

## Server

Provider stores `{ id, bytes, createdAt }` rows. The `id` is a client-generated
UUID, it does not encode any information about the entry.

## Failure modes

- Lost passphrase: data is irrecoverable. This is by design. UI must scream
  this at sign-up.
- Adapter offline: queue uploads in IndexedDB, retry with exponential backoff.

## Adapter interface

See `src/lib/sync.ts`. `SupabaseSyncAdapter` is a stub. `uploadBlob` /
`downloadBlob` need to hit `${url}/storage/v1/object/${bucket}/${id}` with the
anon key as bearer.

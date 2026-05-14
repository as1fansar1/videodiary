// Sync adapter interface + Supabase stub.
// All payloads are encrypted client-side via crypto.ts before they reach the adapter.

export type SyncBlob = { id: string; bytes: Uint8Array; createdAt: number };

export interface SyncAdapter {
  isConfigured(): boolean;
  uploadBlob(blob: SyncBlob): Promise<void>;
  downloadBlob(id: string): Promise<SyncBlob | null>;
  listIds(): Promise<string[]>;
}

export class SupabaseSyncAdapter implements SyncAdapter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private url: string, private anonKey: string, private bucket = 'diary') {}
  isConfigured(): boolean {
    return Boolean(this.url && this.anonKey);
  }
  async uploadBlob(_b: SyncBlob): Promise<void> {
    // TODO: POST `${this.url}/storage/v1/object/${this.bucket}/${_b.id}` with
    // bearer auth. Body = _b.bytes.
    throw new Error('SupabaseSyncAdapter.upload not implemented yet');
  }
  async downloadBlob(_id: string): Promise<SyncBlob | null> {
    throw new Error('SupabaseSyncAdapter.download not implemented yet');
  }
  async listIds(): Promise<string[]> {
    return [];
  }
}

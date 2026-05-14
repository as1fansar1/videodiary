// Dexie-style extension DB for new product features.
// Coexists with src/lib/db.ts (raw IDB) — the original DB owns video entries,
// this DB owns derived per-feature data (prompts, streaks, mood/chapters cache).
//
// Dexie v3+ patterns. If Dexie isn't installed yet, run `npm i dexie`.
import Dexie, { type Table } from 'dexie';

export type FeatureEntry = {
  id: string;
  createdAt: number;
  blobId: string;
  durationSec: number;
  transcript?: string;
  mood?: number;
  chapters?: { tStart: number; title: string }[];
  audioOnly: boolean;
};

export type BlobRow = { id: string; blob: Blob };

export type PromptRow = {
  id: string;
  date: string;
  promptText: string;
  entryId?: string;
};

export type StreakRow = {
  key: string;
  value: string | number;
};

class DiaryDexie extends Dexie {
  entries!: Table<FeatureEntry, string>;
  blobs!: Table<BlobRow, string>;
  prompts!: Table<PromptRow, string>;
  streaks!: Table<StreakRow, string>;

  constructor() {
    super('diary-features');
    this.version(1).stores({
      entries: 'id, createdAt, audioOnly',
      blobs: 'id',
      prompts: 'id, date',
      streaks: 'key',
    });
  }
}

export const featureDb = new DiaryDexie();

export async function upsertFeatureEntry(e: FeatureEntry): Promise<void> {
  await featureDb.entries.put(e);
}

export async function getFeatureEntry(id: string): Promise<FeatureEntry | undefined> {
  return featureDb.entries.get(id);
}

export async function allFeatureEntries(): Promise<FeatureEntry[]> {
  return featureDb.entries.orderBy('createdAt').reverse().toArray();
}

export async function getStreakValue(key: string): Promise<string | number | undefined> {
  const row = await featureDb.streaks.get(key);
  return row?.value;
}

export async function setStreakValue(key: string, value: string | number): Promise<void> {
  await featureDb.streaks.put({ key, value });
}

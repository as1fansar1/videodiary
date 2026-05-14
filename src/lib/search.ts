// Transcript search over the videodiary Dexie database.
//
// NOTE: At the time this file landed, no Dexie schema file existed under
// src/lib. To stay non-breaking, this module lazily imports `./db` (the
// conventional name in Vite/Dexie projects) only when search is invoked. If
// the import fails, search returns an empty array and logs a warning so the
// UI can render gracefully. Wire your real Dexie instance into `./db` (named
// or default export) and either:
//   1. Add a `transcripts` table:  `{ id?, entryId, segments }`
//   2. Or extend each entry with `transcript: TranscriptSegment[]`
// Both shapes are supported below.

import type { TranscriptSegment } from './transcribe';

export interface SearchResult {
  entryId: string | number;
  segmentStart: number;
  snippet: string;
}

interface TranscriptRow {
  id?: number;
  entryId: string | number;
  segments: TranscriptSegment[];
}

interface EntryWithTranscript {
  id: string | number;
  transcript?: TranscriptSegment[];
}

interface DexieLike {
  transcripts?: {
    toArray(): Promise<TranscriptRow[]>;
  };
  entries?: {
    toArray(): Promise<EntryWithTranscript[]>;
  };
}

async function loadDb(): Promise<DexieLike | null> {
  try {
    const mod = (await import(/* @vite-ignore */ './db')) as {
      db?: DexieLike;
      default?: DexieLike;
    };
    return mod.db ?? mod.default ?? null;
  } catch {
    console.warn(
      '[search] No Dexie module found at src/lib/db. ' +
        'Create it and export { db } to enable transcript search.'
    );
    return null;
  }
}

function makeSnippet(text: string, query: string, radius = 40): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text.length > 80 ? text.slice(0, 80) + '…' : text;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return prefix + text.slice(start, end) + suffix;
}

/**
 * Substring search across every transcript segment. Returns one result per
 * matching segment, sorted by entry then time.
 */
export async function searchTranscripts(
  query: string
): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const db = await loadDb();
  if (!db) return [];

  const needle = q.toLowerCase();
  const results: SearchResult[] = [];

  // Preferred shape: a dedicated `transcripts` table.
  if (db.transcripts) {
    const rows = await db.transcripts.toArray();
    for (const row of rows) {
      for (const seg of row.segments ?? []) {
        if (seg.text.toLowerCase().includes(needle)) {
          results.push({
            entryId: row.entryId,
            segmentStart: seg.start,
            snippet: makeSnippet(seg.text, q),
          });
        }
      }
    }
    return results;
  }

  // Fallback: transcripts attached to entries directly.
  if (db.entries) {
    const entries = await db.entries.toArray();
    for (const entry of entries) {
      for (const seg of entry.transcript ?? []) {
        if (seg.text.toLowerCase().includes(needle)) {
          results.push({
            entryId: entry.id,
            segmentStart: seg.start,
            snippet: makeSnippet(seg.text, q),
          });
        }
      }
    }
  }

  return results;
}

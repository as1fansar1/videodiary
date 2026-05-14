// Sentiment scoring for transcripts using @xenova/transformers.
// Caches scores in the feature DB (entries.mood). Range: -1..+1.

import { pipeline, type Pipeline } from '@xenova/transformers';
import { upsertFeatureEntry, getFeatureEntry } from './diaryDb';

let _clf: Pipeline | null = null;

async function getClassifier(): Promise<Pipeline> {
  if (_clf) return _clf;
  _clf = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
  return _clf;
}

export async function scoreTranscript(text: string): Promise<number> {
  if (!text || !text.trim()) return 0;
  const clf = await getClassifier();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out = (await clf(text)) as any;
  const top = Array.isArray(out) ? out[0] : out;
  const label = String(top.label || '').toUpperCase();
  const score = Number(top.score ?? 0);
  return label.startsWith('POS') ? score : -score;
}

export async function scoreEntry(entryId: string, createdAt: number, durationSec: number, transcript: string, audioOnly: boolean): Promise<number> {
  const cached = await getFeatureEntry(entryId);
  if (cached?.mood != null && cached.transcript === transcript) return cached.mood;
  const mood = await scoreTranscript(transcript);
  await upsertFeatureEntry({
    id: entryId, createdAt, blobId: entryId, durationSec, transcript, mood, audioOnly,
  });
  return mood;
}

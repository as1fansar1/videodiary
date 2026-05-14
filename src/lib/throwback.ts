import { listEntries, type Entry } from './db';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 2;
const ANCHORS = [30, 180, 365];

export type ThrowbackHit = {
  entry: Entry;
  daysAgo: number;
  label: string;
};

function labelFor(daysAgo: number): string {
  if (daysAgo >= 360) return '1 year ago today';
  if (daysAgo >= 170) return '6 months ago today';
  if (daysAgo >= 25) return '1 month ago today';
  return `${daysAgo} days ago`;
}

export async function pickThrowback(now: number = Date.now()): Promise<ThrowbackHit | null> {
  const entries = await listEntries();
  if (entries.length === 0) return null;
  const matches: ThrowbackHit[] = [];
  for (const anchor of ANCHORS) {
    const target = now - anchor * DAY_MS;
    const minT = target - WINDOW_DAYS * DAY_MS;
    const maxT = target + WINDOW_DAYS * DAY_MS;
    for (const e of entries) {
      if (e.createdAt >= minT && e.createdAt <= maxT) {
        matches.push({ entry: e, daysAgo: anchor, label: labelFor(anchor) });
      }
    }
  }
  if (matches.length === 0) return null;
  return matches[Math.floor(Math.random() * matches.length)];
}

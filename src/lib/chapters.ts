// Auto-chaptering for long entries.
// Primary path: Xenova/Phi-3-mini-4k-instruct (heavy on first load).
// Fallback heuristic: chapter every 30s using the first sentence as the title.

export type WhisperSegment = { start: number; end: number; text: string };
export type Chapter = { tStart: number; title: string };

const CHAPTER_WINDOW = 30;
const MAX_TITLE = 60;

function firstSentence(text: string): string {
  const m = text.trim().match(/^(.+?[.!?])\s/);
  const raw = (m ? m[1] : text).trim();
  return raw.length > MAX_TITLE ? raw.slice(0, MAX_TITLE - 1) + '…' : raw;
}

export function heuristicChapters(segments: WhisperSegment[]): Chapter[] {
  if (segments.length === 0) return [];
  const chapters: Chapter[] = [];
  let bucketStart = segments[0].start;
  let bucketText: string[] = [];
  const flush = () => {
    if (bucketText.length === 0) return;
    const joined = bucketText.join(' ').trim();
    if (!joined) return;
    chapters.push({ tStart: bucketStart, title: firstSentence(joined) });
  };
  for (const seg of segments) {
    if (seg.start - bucketStart >= CHAPTER_WINDOW) {
      flush();
      bucketStart = seg.start;
      bucketText = [];
    }
    bucketText.push(seg.text);
  }
  flush();
  return chapters;
}

export async function generateChapters(segments: WhisperSegment[], opts?: { useLLM?: boolean }): Promise<Chapter[]> {
  if (!opts?.useLLM) return heuristicChapters(segments);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformers = (await import('@xenova/transformers')) as any;
    const gen = await transformers.pipeline('text-generation', 'Xenova/Phi-3-mini-4k-instruct');
    const prompt = `Summarize each ~30s window as a short chapter title. Return JSON array of {tStart, title}.\n${JSON.stringify(segments).slice(0, 4000)}`;
    const out = await gen(prompt, { max_new_tokens: 256 });
    const text = String(out?.[0]?.generated_text ?? '');
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed as Chapter[];
    }
    return heuristicChapters(segments);
  } catch {
    return heuristicChapters(segments);
  }
}

// Export entries to a Markdown bundle (Obsidian-friendly) plus video blobs.

import type { Entry } from './db';
import { allFeatureEntries } from './diaryDb';

export type ExportBundle = {
  md: string;
  assets: Array<{ filename: string; blob: Blob }>;
};

function pad(n: number) { return n.toString().padStart(2, '0'); }
function dateStr(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function exportToMarkdown(entries: Entry[]): Promise<ExportBundle> {
  const feature = await allFeatureEntries();
  const featureById = new Map(feature.map((f) => [f.id, f]));

  const lines: string[] = [];
  const assets: ExportBundle['assets'] = [];

  for (const e of [...entries].sort((a, b) => a.createdAt - b.createdAt)) {
    const f = featureById.get(e.id);
    const filename = `entry-${dateStr(e.createdAt)}-${e.id.slice(0, 6)}.webm`;
    assets.push({ filename, blob: e.videoBlob });

    lines.push('---');
    lines.push(`date: ${dateStr(e.createdAt)}`);
    lines.push(`duration: ${Math.round(e.duration)}s`);
    if (f?.mood != null) lines.push(`mood: ${f.mood.toFixed(3)}`);
    if (e.prompt) lines.push(`prompt: "${e.prompt.replace(/"/g, '\\"')}"`);
    lines.push('---');
    lines.push('');
    lines.push(`# Entry #${e.number} — ${dateStr(e.createdAt)}`);
    lines.push('');
    if (f?.transcript) {
      lines.push(f.transcript);
      lines.push('');
    }
    lines.push(`![[${filename}]]`);
    lines.push('');
  }

  return { md: lines.join('\n'), assets };
}

export async function exportToZip(entries: Entry[]): Promise<Blob> {
  const bundle = await exportToMarkdown(entries);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const JSZipMod = (await import('jszip')) as any;
  const JSZip = JSZipMod.default ?? JSZipMod;
  const zip = new JSZip();
  zip.file('diary.md', bundle.md);
  for (const a of bundle.assets) zip.file(a.filename, a.blob);
  return zip.generateAsync({ type: 'blob' });
}

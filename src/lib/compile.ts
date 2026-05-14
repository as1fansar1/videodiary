// Weekly 60s auto-compilation via FFmpeg.wasm.
//
// Loads @ffmpeg/ffmpeg lazily so the main bundle stays light. Concatenates up
// to 7 entries (most recent first), each trimmed to 8-10 seconds, then encodes
// an MP4 blob. Designed to be called from a button now and from a service-
// worker job on Sundays later.
//
// TODO: @ffmpeg/ffmpeg's API has changed between 0.11 and 0.12+. This file
// targets the 0.12+ `new FFmpeg()` API. If your installed version is 0.11.x,
// swap to createFFmpeg() + ff.FS(...) calls.

import type { Entry } from './db';

const TARGET_PER_CLIP = 9;
const MAX_CLIPS = 7;
const MAX_TOTAL = 60;

let _ff: unknown = null;

async function loadFFmpeg() {
  if (_ff) return _ff;
  const mod = await import('@ffmpeg/ffmpeg');
  const utilMod = await import('@ffmpeg/util');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FFmpegCtor = (mod as any).FFmpeg ?? (mod as any).default?.FFmpeg;
  if (!FFmpegCtor) throw new Error('FFmpeg constructor not found. Check @ffmpeg/ffmpeg version.');
  const ff = new FFmpegCtor();
  await ff.load();
  _ff = { ff, util: utilMod };
  return _ff;
}

export async function compileWeek(entries: Entry[]): Promise<Blob> {
  if (entries.length === 0) throw new Error('No entries to compile');
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_CLIPS);
  const perClip = Math.min(TARGET_PER_CLIP, Math.floor(MAX_TOTAL / sorted.length));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ff, util } = (await loadFFmpeg()) as any;
  const { fetchFile } = util;

  const inputNames: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const name = `in${i}.webm`;
    await ff.writeFile(name, await fetchFile(sorted[i].videoBlob));
    inputNames.push(name);
  }

  const trimmed: string[] = [];
  for (let i = 0; i < inputNames.length; i++) {
    const out = `t${i}.mp4`;
    await ff.exec([
      '-i', inputNames[i],
      '-t', String(perClip),
      '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '96k',
      '-vf', 'scale=720:-2',
      out,
    ]);
    trimmed.push(out);
  }

  const listText = trimmed.map((n) => `file '${n}'`).join('\n');
  await ff.writeFile('list.txt', new TextEncoder().encode(listText));
  await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'out.mp4']);

  const data = (await ff.readFile('out.mp4')) as Uint8Array;
  return new Blob([data], { type: 'video/mp4' });
}

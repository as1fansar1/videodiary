import { useEffect, useRef, useState } from 'react';
import { allFeatureEntries, type FeatureEntry } from '../lib/diaryDb';

const MIN_SCORED = 5;

// Lightweight inline chart using <canvas> as a fallback so we don't hard-block
// on Chart.js. TODO: swap to `new Chart(ctx, ...)` once chart.js is installed.

export default function MoodArc() {
  const [rows, setRows] = useState<FeatureEntry[] | null>(null);
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    allFeatureEntries().then((all) => setRows(all.filter((e) => typeof e.mood === 'number' && e.transcript)));
  }, []);

  useEffect(() => {
    if (!rows || !ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (rows.length < 2) return;
    const sorted = [...rows].sort((a, b) => a.createdAt - b.createdAt);
    ctx.strokeStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    sorted.forEach((r, i) => {
      const x = (i / (sorted.length - 1)) * W;
      const y = H / 2 - ((r.mood ?? 0) * (H / 2 - 6));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [rows]);

  if (!rows) return null;
  if (rows.length < MIN_SCORED) {
    return (
      <div className="mood-arc-empty" data-testid="mood-arc">
        Mood arc unlocks after {MIN_SCORED} entries with transcripts ({rows.length}/{MIN_SCORED}).
      </div>
    );
  }

  return (
    <div className="mood-arc" data-testid="mood-arc">
      <div className="mood-arc-title">mood arc · {rows.length} entries</div>
      <canvas ref={ref} width={480} height={120} />
    </div>
  );
}

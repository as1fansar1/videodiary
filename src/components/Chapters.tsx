import type { Chapter } from '../lib/chapters';

type Props = {
  durationSec: number;
  chapters: Chapter[];
  onSeek?: (t: number) => void;
};

export default function Chapters({ durationSec, chapters, onSeek }: Props) {
  if (durationSec <= 120 || chapters.length === 0) return null;
  return (
    <ul className="chapters" data-testid="chapters">
      {chapters.map((c, i) => (
        <li key={i} className="chapters-item">
          <button className="chapters-btn" onClick={() => onSeek?.(c.tStart)}>
            <span className="chapters-time">{formatTime(c.tStart)}</span>
            <span className="chapters-title">{c.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

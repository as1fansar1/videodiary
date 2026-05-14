import { useEffect, useState } from 'react';
import { pickThrowback, type ThrowbackHit } from '../lib/throwback';

type Props = { onOpen?: (entryId: string) => void };

export default function Throwback({ onOpen }: Props) {
  const [hit, setHit] = useState<ThrowbackHit | null>(null);
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    let revoked = false;
    pickThrowback().then((h) => {
      if (!h || revoked) return;
      setHit(h);
      try {
        const u = URL.createObjectURL(h.entry.videoBlob);
        setUrl(u);
      } catch {
        // ignore
      }
    });
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hit) return null;

  return (
    <div className="throwback" data-testid="throwback-card">
      <div className="throwback-label">{hit.label}</div>
      <button
        className="throwback-card"
        onClick={() => onOpen?.(hit.entry.id)}
        aria-label={`Open throwback entry from ${hit.label}`}
      >
        {url ? (
          <video src={url} autoPlay muted loop playsInline className="throwback-video" />
        ) : (
          <div className="throwback-placeholder">▶</div>
        )}
        <div className="throwback-meta">
          <div className="throwback-title">#{hit.entry.number} — {new Date(hit.entry.createdAt).toLocaleDateString()}</div>
          {hit.entry.prompt && <div className="throwback-prompt">{hit.entry.prompt}</div>}
        </div>
      </button>
    </div>
  );
}

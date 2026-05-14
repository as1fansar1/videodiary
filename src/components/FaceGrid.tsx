import { useState } from 'react';

type PlaceholderCluster = { id: string; label: string; count: number };

export default function FaceGrid() {
  const [clusters] = useState<PlaceholderCluster[]>([]);
  return (
    <div className="face-grid" data-testid="face-grid">
      <div className="face-grid-title">faces</div>
      {clusters.length === 0 ? (
        <div className="face-grid-empty">No face clusters yet. Once you have a handful of entries, faces you see often will appear here.</div>
      ) : (
        <ul className="face-grid-list">
          {clusters.map((c) => (
            <li key={c.id} className="face-grid-item">
              <div className="face-grid-thumb">👤</div>
              <div className="face-grid-meta">{c.label} · {c.count}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

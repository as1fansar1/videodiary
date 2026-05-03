import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEntries, deleteEntry, storageUsedMB, type Entry } from '../lib/db';
import PlaybackOverlay from '../components/PlaybackOverlay';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatEntryDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function weekGroupLabel(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThisWeek = new Date(startOfToday);
  startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  if (date >= startOfThisWeek) return 'this week';
  if (date >= startOfLastWeek) return 'last week';
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

type EntryWithUrls = Entry & { videoUrl: string; thumbUrl: string };

function groupByWeek(entries: EntryWithUrls[]): { label: string; items: EntryWithUrls[] }[] {
  const groups: Map<string, EntryWithUrls[]> = new Map();
  for (const entry of entries) {
    const label = weekGroupLabel(entry.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

type OverlayState = { entry: EntryWithUrls } | null;
type DeleteState = { entry: EntryWithUrls } | null;

export default function Library() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [usedMB, setUsedMB] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteState>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const load = () => {
    listEntries().then(setEntries).catch(() => setEntries([]));
    storageUsedMB().then(setUsedMB).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const items = useMemo<EntryWithUrls[]>(() => {
    return (entries ?? []).map((e) => ({
      ...e,
      videoUrl: URL.createObjectURL(e.videoBlob),
      thumbUrl: e.thumbnailBlob?.size ? URL.createObjectURL(e.thumbnailBlob) : '',
    }));
  }, [entries]);

  useEffect(() => {
    return () => {
      items.forEach((i) => {
        URL.revokeObjectURL(i.videoUrl);
        if (i.thumbUrl) URL.revokeObjectURL(i.thumbUrl);
      });
    };
  }, [items]);

  const groups = useMemo(() => groupByWeek(items), [items]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteEntry(deleteTarget.entry.id);
    setDeleteTarget(null);
    setOverlay(null);
    load();
  };

  return (
    <div className="page">
      <header className="header">
        <div className="logo">📹 diary</div>
        <nav className="nav">
          <Link to="/record" className="nav-link">record</Link>
          <Link to="/" className="nav-link nav-link-active">library</Link>
        </nav>
      </header>

      <main className="library">
        {entries === null ? null : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">📔</div>
            <h1 className="empty-state-title">No entries yet</h1>
            <p className="empty-state-text">Start your video diary — record your first entry.</p>
            <Link to="/record" className="cta">
              <span className="cta-dot" /> record first entry
            </Link>
          </div>
        ) : (
          <div className="entries">
            <div className="entries-toolbar">
              <div className="entries-title">
                journal{' '}
                <span className="entries-count">
                  · {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
                  {usedMB != null ? ` · ${usedMB} MB used` : ''}
                </span>
              </div>
              <Link to="/record" className="cta">
                <span className="cta-dot" /> new entry
              </Link>
            </div>

            {groups.map(({ label, items: groupItems }) => (
              <div key={label} className="entry-group">
                <div className="entry-group-label">{label}</div>
                <ul className="entries-list">
                  {groupItems.map((entry) => (
                    <li key={entry.id} className="entry-card">
                      <button
                        className="entry-card-main"
                        onClick={() => setOverlay({ entry })}
                        aria-label={`Play entry #${entry.number}`}
                      >
                        <div className="entry-thumb">
                          {entry.thumbUrl ? (
                            <img src={entry.thumbUrl} alt="" className="entry-thumb-img" />
                          ) : (
                            <div className="entry-thumb-placeholder">▶</div>
                          )}
                        </div>
                        <div className="entry-info">
                          <div className="entry-title">
                            #{entry.number ?? '?'} — {formatEntryDate(entry.createdAt)}
                          </div>
                          {entry.prompt && (
                            <div className="entry-prompt">{entry.prompt}</div>
                          )}
                          <div className="entry-meta">
                            {formatEntryDate(entry.createdAt)} · {formatDuration(entry.duration ?? 0)}
                          </div>
                        </div>
                      </button>

                      <div className="entry-menu-wrap" ref={openMenuId === entry.id ? menuRef : null}>
                        <button
                          className="entry-menu-btn"
                          aria-label="entry options"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === entry.id ? null : entry.id);
                          }}
                        >
                          ···
                        </button>
                        {openMenuId === entry.id && (
                          <div className="entry-menu">
                            <button
                              className="entry-menu-item entry-menu-item-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setDeleteTarget({ entry });
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>

      {overlay && (
        <PlaybackOverlay
          url={overlay.entry.videoUrl}
          title={`#${overlay.entry.number} — ${formatEntryDate(overlay.entry.createdAt)}`}
          onClose={() => setOverlay(null)}
        />
      )}

      {deleteTarget && (
        <div className="overlay-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <p className="dialog-title">Delete this entry?</p>
            <p className="dialog-body">This can't be undone.</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { searchTranscripts, type SearchResult } from '../lib/search';

interface SearchBarProps {
  onResultClick: (entryId: string | number, segmentStart: number) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Debounced search input that queries `searchTranscripts` and renders
 * clickable results. Tailwind-free so it inherits ambient styles from
 * App.css; the markup uses plain class names you can target there.
 */
export function SearchBar({
  onResultClick,
  placeholder = 'Search transcripts…',
  debounceMs = 250,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = window.setTimeout(async () => {
      try {
        const r = await searchTranscripts(query);
        setResults(r);
      } catch (err) {
        console.error('[SearchBar] search failed', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-bar__input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search transcripts"
      />
      {loading && <div className="search-bar__status">Searching…</div>}
      {!loading && query && results.length === 0 && (
        <div className="search-bar__status">No matches.</div>
      )}
      {results.length > 0 && (
        <ul className="search-bar__results">
          {results.map((r, i) => (
            <li key={`${r.entryId}-${r.segmentStart}-${i}`}>
              <button
                type="button"
                className="search-bar__result"
                onClick={() => onResultClick(r.entryId, r.segmentStart)}
              >
                <span className="search-bar__time">
                  {formatTime(r.segmentStart)}
                </span>
                <span className="search-bar__snippet">{r.snippet}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default SearchBar;

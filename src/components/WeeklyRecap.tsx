import { useState } from 'react';
import { listEntries } from '../lib/db';
import { compileWeek } from '../lib/compile';

export default function WeeklyRecap() {
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [err, setErr] = useState<string>('');
  const [url, setUrl] = useState<string>('');

  const run = async () => {
    setStatus('working');
    setErr('');
    try {
      const entries = await listEntries();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const week = entries.filter((e) => e.createdAt >= weekAgo);
      if (week.length === 0) throw new Error('No entries in the last 7 days');
      const blob = await compileWeek(week);
      const u = URL.createObjectURL(blob);
      setUrl(u);
      setStatus('done');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  return (
    <div className="weekly-recap" data-testid="weekly-recap">
      <button className="cta" onClick={run} disabled={status === 'working'} data-testid="weekly-recap-btn">
        {status === 'working' ? 'compiling…' : 'compile this week (60s)'}
      </button>
      {status === 'error' && <div className="weekly-recap-error">{err}</div>}
      {status === 'done' && url && (
        <a className="weekly-recap-download" href={url} download="weekly-recap.mp4">
          download weekly recap
        </a>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { listEntries } from '../lib/db';
import { exportToZip } from '../lib/export';

export default function ExportButton() {
  const [count, setCount] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listEntries().then((es) => setCount(es.length)).catch(() => setCount(0));
  }, []);

  const click = async () => {
    setBusy(true);
    try {
      const entries = await listEntries();
      const blob = await exportToZip(entries);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `videodiary-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className="export-btn cta"
      onClick={click}
      disabled={count === 0 || busy}
      data-testid="export-btn"
    >
      {busy ? 'exporting…' : `export ${count} entr${count === 1 ? 'y' : 'ies'} (.zip)`}
    </button>
  );
}

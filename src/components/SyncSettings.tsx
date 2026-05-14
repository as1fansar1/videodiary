import { useState } from 'react';

export default function SyncSettings() {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="sync-settings" data-testid="sync-settings">
      <div className="sync-settings-row">
        <div>
          <div className="sync-settings-title">E2E encrypted cloud sync</div>
          <div className="sync-settings-sub">Coming soon. Your videos will be encrypted on this device before upload, so the server stores opaque bytes.</div>
        </div>
        <label className="sync-toggle" aria-label="Toggle cloud sync">
          <input
            type="checkbox"
            disabled
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span>off</span>
        </label>
      </div>
    </div>
  );
}

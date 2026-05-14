import { useEffect, useState } from 'react';
import { listEntries } from '../lib/db';
import { canInstall, showInstallPrompt } from '../lib/installPrompt';

const KEY_DISMISSED = 'installNudgeDismissedAt';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export default function InstallNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(KEY_DISMISSED) || 0);
    if (Date.now() - dismissedAt < COOLDOWN_MS) return;
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;
    listEntries().then((es) => {
      if (es.length >= 3 && canInstall()) setShow(true);
    });
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY_DISMISSED, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    await showInstallPrompt();
    setShow(false);
  };

  return (
    <div className="install-nudge" role="dialog" data-testid="install-nudge">
      <div className="install-nudge-body">
        <div className="install-nudge-title">Install diary?</div>
        <div className="install-nudge-text">Add to your home screen for one-tap recording.</div>
      </div>
      <div className="install-nudge-actions">
        <button className="btn-secondary" onClick={dismiss}>not now</button>
        <button className="cta" onClick={install}>install</button>
      </div>
    </div>
  );
}

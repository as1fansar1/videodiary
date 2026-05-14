// Capture the beforeinstallprompt event so we can fire it at a good moment.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _deferred: any = null;

export function captureInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferred = e;
  });
}

export function canInstall(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return false;
  return Boolean(_deferred);
}

export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!_deferred) return 'unavailable';
  _deferred.prompt();
  const choice = await _deferred.userChoice;
  _deferred = null;
  return choice.outcome;
}

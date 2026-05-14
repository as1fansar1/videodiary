import { useEffect, useState } from 'react';
import { getStreak, type StreakState } from '../lib/streak';

export default function Streak() {
  const [state, setState] = useState<StreakState | null>(null);
  useEffect(() => {
    getStreak().then(setState).catch(() => setState(null));
  }, []);
  if (!state) return null;
  const flame = state.current > 0 ? '🔥 ' : '';
  return (
    <div className="streak-badge" data-testid="streak-badge">
      {flame}{state.current} day streak
      {state.longest > state.current ? ` · best ${state.longest}` : ''}
      {state.freezesAvailable > 0 ? ` · ${state.freezesAvailable} freeze` : ''}
    </div>
  );
}

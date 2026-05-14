import { useMemo } from 'react';
import { promptForDate } from '../lib/prompts';

export default function DailyPrompt() {
  const prompt = useMemo(() => promptForDate(), []);
  return (
    <div className="daily-prompt" data-testid="daily-prompt">
      <div className="daily-prompt-cat">today · {prompt.category}</div>
      <div className="daily-prompt-text" data-testid="daily-prompt-text">{prompt.text}</div>
    </div>
  );
}

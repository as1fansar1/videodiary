// 30 daily prompts across gratitude / reflection / observation (10 each).
// Deterministic selection by date so the same date always returns the same prompt.

export type PromptCategory = 'gratitude' | 'reflection' | 'observation';

export type Prompt = { id: number; category: PromptCategory; text: string };

export const PROMPTS: Prompt[] = [
  { id: 1, category: 'gratitude', text: 'What is one small thing today that made life a little better?' },
  { id: 2, category: 'gratitude', text: 'Who are you grateful for right now, and why?' },
  { id: 3, category: 'gratitude', text: 'Name a comfort you usually overlook.' },
  { id: 4, category: 'gratitude', text: 'What body part are you thankful for today?' },
  { id: 5, category: 'gratitude', text: 'A meal, a song, or a place that gave you joy this week.' },
  { id: 6, category: 'gratitude', text: 'Recall a kindness someone showed you recently.' },
  { id: 7, category: 'gratitude', text: 'What tool or object made your work easier this week?' },
  { id: 8, category: 'gratitude', text: 'A skill you have that you take for granted.' },
  { id: 9, category: 'gratitude', text: 'Something in nature you noticed today.' },
  { id: 10, category: 'gratitude', text: 'A piece of past-you is paying off today. What is it?' },
  { id: 11, category: 'reflection', text: 'What is the question you keep avoiding?' },
  { id: 12, category: 'reflection', text: 'Where did you spend your energy today, and was it worth it?' },
  { id: 13, category: 'reflection', text: 'What did you learn this week that surprised you?' },
  { id: 14, category: 'reflection', text: 'Describe a moment you felt fully present.' },
  { id: 15, category: 'reflection', text: 'What would you tell yourself from a month ago?' },
  { id: 16, category: 'reflection', text: 'Where are you being too hard on yourself?' },
  { id: 17, category: 'reflection', text: 'What habit is quietly shaping your life right now?' },
  { id: 18, category: 'reflection', text: 'A belief you no longer hold. When did it change?' },
  { id: 19, category: 'reflection', text: 'What did you say yes to that you wish you had said no to?' },
  { id: 20, category: 'reflection', text: 'What does success look like for you this season?' },
  { id: 21, category: 'observation', text: 'Describe the room you are in like a stranger would.' },
  { id: 22, category: 'observation', text: 'What sound has been with you most today?' },
  { id: 23, category: 'observation', text: 'A face you saw today that you cannot stop thinking about.' },
  { id: 24, category: 'observation', text: 'What pattern did you notice this week?' },
  { id: 25, category: 'observation', text: 'Describe the light right now.' },
  { id: 26, category: 'observation', text: 'A conversation fragment you overheard recently.' },
  { id: 27, category: 'observation', text: 'What is the weather of your mood today?' },
  { id: 28, category: 'observation', text: 'What did your hands do most of today?' },
  { id: 29, category: 'observation', text: 'A small change in your neighborhood you noticed.' },
  { id: 30, category: 'observation', text: 'What is the most repeated word in your inner monologue today?' },
];

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function promptForDate(date: Date = new Date()): Prompt {
  const key = todayKey(date);
  const idx = hashString(key) % PROMPTS.length;
  return PROMPTS[idx];
}

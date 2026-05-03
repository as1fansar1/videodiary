export const PROMPTS: readonly string[] = [
  "what's one small win from today?",
  "how are you feeling right now?",
  "what's something you're grateful for today?",
  "what's been on your mind this week?",
  "describe a moment that made you smile today.",
  "what's one thing you'd like to remember about today?",
  "what's challenging you right now?",
  "what did you learn today?",
  "if today had a soundtrack, what would it be?",
  "what's something kind you did for yourself today?",
  "who did you connect with today?",
  "what's one thing you're looking forward to?",
  "what would you tell yourself a year ago?",
  "what's a goal you're working toward?",
  "what surprised you today?",
  "describe your mood in three words.",
  "what's something you want to let go of?",
  "what's the best thing you ate this week?",
  "what's a small habit you want to build?",
  "what made you laugh recently?",
  "what's a question you've been sitting with?",
  "what's one thing you'd do differently this week?",
  "describe a place you've been thinking about.",
  "what's something you're proud of?",
  "what does rest look like for you right now?",
  "what's a story you keep telling yourself?",
  "what's a tiny adventure you could take this week?",
  "who deserves a thank-you from you?",
  "what's one boundary you want to honor?",
  "what's something you're curious about?",
  "what would make tomorrow great?",
  "what's a song stuck in your head?",
];

export function pickRandomPrompt(exclude?: string | null): string {
  if (PROMPTS.length === 1) return PROMPTS[0];
  let next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  // Avoid repeating the same prompt back-to-back when shuffling.
  let safety = 10;
  while (exclude && next === exclude && safety-- > 0) {
    next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  }
  return next;
}

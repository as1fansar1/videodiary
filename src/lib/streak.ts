import { getStreakValue, setStreakValue } from './diaryDb';
import { todayKey } from './prompts';

const KEY_CURRENT = 'currentStreak';
const KEY_LONGEST = 'longestStreak';
const KEY_LAST = 'lastEntryDate';
const KEY_FREEZE = 'freezesAvailable';
const KEY_FREEZE_REFILL = 'lastFreezeRefill';

export type StreakState = {
  current: number;
  longest: number;
  lastEntryDate: string | null;
  freezesAvailable: number;
};

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / (24 * 60 * 60 * 1000));
}

async function refillFreezeIfDue(today: string): Promise<number> {
  const lastRefill = (await getStreakValue(KEY_FREEZE_REFILL)) as string | undefined;
  const cur = ((await getStreakValue(KEY_FREEZE)) as number | undefined) ?? 1;
  if (!lastRefill) {
    await setStreakValue(KEY_FREEZE_REFILL, today);
    if (cur < 1) await setStreakValue(KEY_FREEZE, 1);
    return Math.max(cur, 1);
  }
  if (dayDiff(lastRefill, today) >= 7 && cur < 1) {
    await setStreakValue(KEY_FREEZE, 1);
    await setStreakValue(KEY_FREEZE_REFILL, today);
    return 1;
  }
  return cur;
}

export async function getStreak(): Promise<StreakState> {
  const today = todayKey();
  const freezes = await refillFreezeIfDue(today);
  const current = ((await getStreakValue(KEY_CURRENT)) as number | undefined) ?? 0;
  const longest = ((await getStreakValue(KEY_LONGEST)) as number | undefined) ?? 0;
  const last = ((await getStreakValue(KEY_LAST)) as string | undefined) ?? null;
  return { current, longest, lastEntryDate: last, freezesAvailable: freezes };
}

export async function recordStreakDay(date: Date = new Date()): Promise<StreakState> {
  const today = todayKey(date);
  const state = await getStreak();
  let { current, longest, freezesAvailable } = state;
  const last = state.lastEntryDate;

  if (last === today) {
    // already counted
  } else if (!last) {
    current = 1;
  } else {
    const gap = dayDiff(last, today);
    if (gap === 1) {
      current += 1;
    } else if (gap === 2 && freezesAvailable > 0) {
      freezesAvailable -= 1;
      current += 1;
    } else if (gap > 1) {
      current = 1;
    }
  }
  longest = Math.max(longest, current);

  await setStreakValue(KEY_CURRENT, current);
  await setStreakValue(KEY_LONGEST, longest);
  await setStreakValue(KEY_LAST, today);
  await setStreakValue(KEY_FREEZE, freezesAvailable);

  return { current, longest, lastEntryDate: today, freezesAvailable };
}

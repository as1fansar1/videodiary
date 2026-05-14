import { test, expect } from '@playwright/test';

// DailyPrompt renders today's deterministic prompt.
test('daily prompt renders for today', async ({ page }) => {
  await page.goto('/');
  const el = page.getByTestId('daily-prompt-text');
  await expect(el).toBeVisible();
  const text = (await el.textContent())?.trim() ?? '';
  expect(text.length).toBeGreaterThan(5);
});

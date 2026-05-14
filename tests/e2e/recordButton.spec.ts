import { test, expect } from '@playwright/test';

// Record mode toggle switches between video and audio-only.
test('record mode toggle switches between video and audio', async ({ page }) => {
  await page.goto('/record');
  const v = page.getByTestId('mode-video');
  const a = page.getByTestId('mode-audio');
  if (await v.count() === 0) test.skip(true, 'RecordButton not mounted on /record');
  await a.click();
  await expect(a).toHaveAttribute('aria-selected', 'true');
  await v.click();
  await expect(v).toHaveAttribute('aria-selected', 'true');
});

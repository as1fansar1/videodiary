import { test, expect } from '@playwright/test';

async function clearDB(page: import('@playwright/test').Page) {
  await page.evaluate(() => indexedDB.deleteDatabase('diary'));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await clearDB(page);
  await page.reload();
});

test('golden path: record, save, playback, delete', async ({ page }) => {
  // 1. Empty state
  await expect(page.getByText('No entries yet')).toBeVisible();

  // 2. Navigate to record
  await page.getByRole('link', { name: 'record first entry' }).click();
  await expect(page).toHaveURL('/record');

  // 3. Wait for stream to be fully acquired — mic dropdown only appears after
  //    getUserMedia + enumerateDevices both complete. Fake devices give 3 mics.
  await expect(page.locator('select[aria-label="microphone"]')).toBeVisible({ timeout: 10_000 });

  // 4. Start recording (triggers 3s countdown then records)
  await page.getByRole('button', { name: /start recording/i }).click();

  // Wait for countdown, then recording phase
  await expect(page.locator('.countdown-overlay')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('.rec-badge')).toBeVisible({ timeout: 10_000 });

  // Record for ~2 seconds then stop
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /stop recording/i }).click();

  // 5. Preview screen — save
  await expect(page.getByRole('button', { name: 'save entry' })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: 'save entry' }).click();

  // 6. Back to library, see the entry
  await expect(page).toHaveURL('/');
  await expect(page.getByText('#1 —')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('1 entry')).toBeVisible();

  // 7. Open playback overlay
  await page.getByRole('button', { name: /Play entry #1/i }).click();
  await expect(page.locator('.overlay-panel')).toBeVisible();

  // Close overlay with Escape
  await page.keyboard.press('Escape');
  await expect(page.locator('.overlay-panel')).not.toBeVisible();

  // 8. Delete entry via overflow menu
  await page.getByRole('button', { name: 'entry options' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();

  // Confirm delete
  await expect(page.getByText('Delete this entry?')).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).last().click();

  // 9. Back to empty state
  await expect(page.getByText('No entries yet')).toBeVisible({ timeout: 5_000 });
});

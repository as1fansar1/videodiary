import { test, expect } from '@playwright/test';

// Throwback renders nothing when the DB is empty.
test('throwback is absent on an empty diary', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('throwback-card')).toHaveCount(0);
});

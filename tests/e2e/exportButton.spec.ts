import { test, expect } from '@playwright/test';

// ExportButton: visible and disabled when there are 0 entries.
test('export button visible and disabled with 0 entries', async ({ page }) => {
  await page.goto('/');
  const btn = page.getByTestId('export-btn');
  await expect(btn).toBeVisible();
  await expect(btn).toBeDisabled();
});

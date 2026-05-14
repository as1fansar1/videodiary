import { test, expect } from '@playwright/test';

// Streak badge renders on the home screen.
test('streak badge renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('streak-badge')).toBeVisible();
});

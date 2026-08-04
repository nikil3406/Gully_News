const { test, expect } = require('@playwright/test');

test('login page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page.getByText(/welcome back/i)).toBeVisible();
});

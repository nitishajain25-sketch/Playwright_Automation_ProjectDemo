import { test, expect } from '@playwright/test';

const loginPath = '/web/index.php/auth/login';
const validUsername = process.env.ORANGEHRM_USERNAME || 'Admin';
const validPassword = process.env.ORANGEHRM_PASSWORD || 'admin123';

test.describe('OrangeHRM login validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(loginPath);
  });

  test('logs in with valid username and password', async ({ page }) => {
    await page.locator('input[name="username"]').fill(validUsername);
    await page.locator('input[name="password"]').fill(validPassword);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard\/index/);
  });

  test('shows an error for an invalid username', async ({ page }) => {
    await page.locator('input[name="username"]').fill('invalid-user');
    await page.locator('input[name="password"]').fill(validPassword);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.oxd-alert-content-text'))
      .toContainText(/Invalid credentials/i);
  });

  test('shows an error for an invalid password', async ({ page }) => {
    await page.locator('input[name="username"]').fill(validUsername);
    await page.locator('input[name="password"]').fill('invalid-password');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.oxd-alert-content-text'))
      .toContainText(/Invalid credentials/i);
  });

  test('requires both username and password', async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.oxd-input-field-error-message'))
      .toHaveCount(2);
  });
});

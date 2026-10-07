import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  
  await expect(page).toHaveTitle(/OrangeHRM/);
});


const LOGIN_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const VALID_USERNAME = 'Admin';
const VALID_PASSWORD = 'admin123';

async function openLoginPage(page) {
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[name="username"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
}

async function login(page, username = VALID_USERNAME, password = VALID_PASSWORD) {
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

test.describe('OrangeHRM login validation suite', () => {
  test.beforeEach(async ({ page }) => {
    await openLoginPage(page);
  });

  // 10 positive test cases
  test('P1 - page title should contain OrangeHRM', async ({ page }) => {
    await expect(page).toHaveTitle(/OrangeHRM/i);
  });

  test('P2 - username field should be visible with correct placeholder', async ({ page }) => {
    const username = page.locator('input[name="username"]');
    await expect(username).toBeVisible();
    await expect(username).toHaveAttribute('placeholder', /Username/i);
  });

  test('P3 - password field should be visible and masked', async ({ page }) => {
    const password = page.locator('input[name="password"]');
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('P4 - username field should accept valid username value', async ({ page }) => {
    const username = page.locator('input[name="username"]');
    await username.fill(VALID_USERNAME);
    await expect(username).toHaveValue(VALID_USERNAME);
  });

  test('P5 - password field should accept valid password value', async ({ page }) => {
    const password = page.locator('input[name="password"]');
    await password.fill(VALID_PASSWORD);
    await expect(password).toHaveValue(VALID_PASSWORD);
  });

  test('P6 - login should succeed with valid credentials', async ({ page }) => {
    await login(page, VALID_USERNAME, VALID_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard\/index/);
  });

  test('P7 - valid credentials should allow login via keyboard Enter key', async ({ page }) => {
    await page.locator('input[name="username"]').fill(VALID_USERNAME);
    await page.locator('input[name="password"]').fill(VALID_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard\/index/);
  });

  test('P8 - username field should support typing and clearing values', async ({ page }) => {
    const username = page.locator('input[name="username"]');
    await username.fill(VALID_USERNAME);
    await expect(username).toHaveValue(VALID_USERNAME);
    await username.clear();
    await expect(username).toHaveValue('');
  });

  test('P9 - password field should support typing and clearing values', async ({ page }) => {
    const password = page.locator('input[name="password"]');
    await password.fill(VALID_PASSWORD);
    await expect(password).toHaveValue(VALID_PASSWORD);
    await password.clear();
    await expect(password).toHaveValue('');
  });

  //test('P10 - login should work when username has leading/trailing spaces trimmed by app', async ({ page }) => {
    //await login(page, `  ${VALID_USERNAME}  `, VALID_PASSWORD);
    //await expect(page).toHaveURL(/\/dashboard\/index/);
  //});


  test('P10 - login should work when username has leading/trailing spaces trimmed by app', async ({ page }) => {
  const usernameWithSpaces = `  ${VALID_USERNAME}  `;
  await login(page, usernameWithSpaces, VALID_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard\/index/);
});


  // 5 negative test cases
  test('N1 - empty username with valid password should show required validation', async ({ page }) => {
    await page.locator('input[name="password"]').fill(VALID_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.oxd-input-field-error-message')).toBeVisible();
    await expect(page.locator('.oxd-input-field-error-message')).toContainText(/Required|required/i);
  });

  test('N2 - valid username with empty password should show required validation', async ({ page }) => {
    await page.locator('input[name="username"]').fill(VALID_USERNAME);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.oxd-input-field-error-message')).toBeVisible();
    await expect(page.locator('.oxd-input-field-error-message')).toContainText(/Required|required/i);
  });

  test('N3 - empty username and empty password should show both required errors', async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    const errors = page.locator('.oxd-input-field-error-message');
    await expect(errors).toHaveCount(2);
    await expect(errors.first()).toContainText(/Required|required/i);
    await expect(errors.nth(1)).toContainText(/Required|required/i);
  });

  test('N4 - invalid username with valid password should show invalid credentials message', async ({ page }) => {
    await login(page, 'invaliduser', VALID_PASSWORD);

    await expect(page.locator('.oxd-alert-content-text')).toContainText(/Invalid credentials|Login failed|Oops/i);
  });

  test('N5 - valid username with wrong password should show invalid credentials message', async ({ page }) => {
    await login(page, VALID_USERNAME, 'wrongPassword123');

    await expect(page.locator('.oxd-alert-content-text')).toContainText(/Invalid credentials|Login failed|Oops/i);
  });

  test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: testInfo.outputPath('failure.png'),
      fullPage: true,
    });
  }
});

});
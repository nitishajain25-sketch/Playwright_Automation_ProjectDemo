import { test, expect } from '@playwright/test';
test.use({ video: 'on' });
 
test('login Hrms', async ({ page }) => {
 
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
 
  await page.getByRole('textbox', { name: 'Username' }).fill('Admin');
 
  await page.getByRole('textbox', { name: 'Password' }).fill('admin1234');
 
  await page.getByRole('button', { name: 'Login' }).click();   });
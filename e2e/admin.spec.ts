import { expect, test } from '@playwright/test';

const adminURL = process.env.E2E_ADMIN_URL ?? 'http://localhost:5174';

test.describe('admin back office', () => {
  test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL and run the app + API + test DB.');

  test('admin can sign in and view the dashboard', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!email || !password, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.');

    await page.goto(`${adminURL}/login`);
    await page.getByLabel('Email').fill(email as string);
    await page.getByLabel('Password').fill(password as string);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(`${adminURL}/`);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(/Confirmed revenue/i)).toBeVisible();
  });

  test('admin can open orders and products', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!email || !password, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.');

    await page.goto(`${adminURL}/login`);
    await page.getByLabel('Email').fill(email as string);
    await page.getByLabel('Password').fill(password as string);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();

    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });
});

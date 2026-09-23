import { expect, test } from '@playwright/test';

test.describe('authentication and authorization', () => {
  test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL and run the app + API + test DB.');

  test('guest is redirected from a protected route and returned after login', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/\/login/);

    const email = process.env.E2E_CUSTOMER_EMAIL;
    const password = process.env.E2E_CUSTOMER_PASSWORD;
    test.skip(!email || !password, 'Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD.');

    await page.getByLabel('Email').fill(email as string);
    await page.getByLabel('Password').fill(password as string);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/account\/orders/);
  });

  test('customer cannot access the admin application', async ({ page }) => {
    await page.goto(`${process.env.E2E_ADMIN_URL ?? 'http://localhost:5174'}/orders`);
    // Without an admin session the guard redirects to login.
    await expect(page).toHaveURL(/\/login/);
  });
});

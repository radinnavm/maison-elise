import { expect, test } from '@playwright/test';

test.describe('cart behaviour', () => {
  test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL and run the app + API + test DB.');

  test('guest cart survives a page refresh', async ({ page }) => {
    await page.goto('/shop');
    await page
      .getByRole('link', { name: /view aurelia satin dress/i })
      .first()
      .click();
    await page.getByRole('radio', { name: 'M' }).check();
    await page.getByRole('button', { name: /add to bag/i }).click();

    await page.reload();
    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: /Aurelia Satin Dress/i })).toBeVisible();
  });

  test('guest cart merges into the server cart after login', async ({ page }) => {
    const email = process.env.E2E_CUSTOMER_EMAIL;
    const password = process.env.E2E_CUSTOMER_PASSWORD;
    test.skip(!email || !password, 'Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD.');

    await page.goto('/shop');
    await page
      .getByRole('link', { name: /view aurelia satin dress/i })
      .first()
      .click();
    await page.getByRole('radio', { name: 'M' }).check();
    await page.getByRole('button', { name: /add to bag/i }).click();

    await page.goto('/login');
    await page.getByLabel('Email').fill(email as string);
    await page.getByLabel('Password').fill(password as string);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Aurelia Satin Dress/i })).toBeVisible();
  });
});

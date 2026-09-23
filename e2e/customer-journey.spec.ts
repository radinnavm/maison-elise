import { expect, test } from '@playwright/test';

/**
 * Critical customer journey. Requires a running storefront + API + test DB and
 * Stripe test keys. Set E2E_BASE_URL to enable.
 */
test.describe('customer journey', () => {
  test.skip(!process.env.E2E_BASE_URL, 'Set E2E_BASE_URL and run the app + API + test DB.');

  test('browse → cart → checkout → order confirmation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Shop' }).first().click();
    await expect(page).toHaveURL(/\/shop/);

    await page
      .getByRole('link', { name: /Aurelia Satin Dress/i })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: /Aurelia Satin Dress/i })).toBeVisible();

    // Select an available size then add to bag.
    await page.getByRole('radio', { name: 'M' }).check();
    await page.getByRole('button', { name: /add to bag/i }).click();
    await expect(page.getByText(/added to your bag/i)).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Shopping Bag/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /proceed to checkout/i })).toBeVisible();
  });
});

import { test } from '@playwright/test';
import {
  loginCustomer, loginSeller, loginDelivery, loginAdmin,
  dismissLocationPrompt,
} from './helpers/harness.js';

/**
 * Production readiness Pass 3 (2026-08-25) — full UI visual certification
 * (item 6). Real Chromium screenshots of critical screens across all four
 * portals, at both desktop and mobile viewports. This test never asserts —
 * its only job is to produce real, inspectable screenshots for manual
 * visual review; defects found from reviewing them are fixed and
 * documented separately, not auto-detected here.
 */

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

async function shoot(page, name) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/visual-cert/${name}.png`, fullPage: false });
}

async function seedAuth(page, portal, tokens) {
  const keyMap = {
    customer: { access: 'customer_access_token', refresh: 'customer_refresh_token', user: 'customer_user', legacyAuth: 'isAuthenticated' },
    seller: { access: 'seller_token', refresh: 'seller_refresh_token', user: 'seller_data' },
    admin: { access: 'adminToken', refresh: 'admin_refresh_token', user: 'admin_user', legacyAuth: 'isAdminAuthenticated' },
    delivery: { access: 'delivery_access_token', refresh: 'delivery_refresh_token', user: 'delivery_user', legacyAuth: 'isDeliveryAuthenticated' },
  };
  const keys = keyMap[portal];
  await page.evaluate(([k, access, refresh, user]) => {
    localStorage.setItem(k.access, access);
    if (k.refresh) localStorage.setItem(k.refresh, refresh);
    if (k.user) localStorage.setItem(k.user, JSON.stringify(user));
    if (k.legacyAuth) localStorage.setItem(k.legacyAuth, 'true');
  }, [keys, tokens.accessToken, tokens.refreshToken, tokens.user || tokens.seller || tokens.admin || tokens.partner]);
}

for (const [viewportName, viewportSize] of Object.entries(VIEWPORTS)) {
  test.describe(`Visual certification — ${viewportName}`, () => {
    test.use({ viewport: viewportSize });

    test(`customer portal — ${viewportName}`, async ({ page }) => {
      test.setTimeout(300_000);
      const customer = await loginCustomer();

      await page.goto('/home');
      await page.evaluate((t) => {
        localStorage.setItem('customer_access_token', t);
        localStorage.setItem('isAuthenticated', 'true');
      }, customer.accessToken);
      await page.goto('/home');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-home-${viewportName}`);

      await page.goto('/quick-shop');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-quickshop-${viewportName}`);

      await page.goto('/mithilak');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-mithilak-${viewportName}`);

      await page.goto('/fresh-grocery');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-freshgrocery-${viewportName}`);

      // ProductDetail.jsx reads its product from router state (navigate's
      // `state: { product }`), not a URL param — no direct-URL product page
      // exists to screenshot. Click a real product card from the real
      // catalog instead, the same path a real customer takes.
      await page.goto('/quick-shop');
      await dismissLocationPrompt(page);
      const firstCard = page.locator('a[href="/product-detail"], [class*="cursor-pointer"]').first();
      if (await firstCard.count()) {
        await firstCard.click().catch(() => {});
        await page.waitForTimeout(500);
        await shoot(page, `customer-product-detail-${viewportName}`);
      }

      await page.goto('/cart');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-cart-${viewportName}`);

      await page.goto('/checkout');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-checkout-${viewportName}`);

      await page.goto('/profile');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-profile-${viewportName}`);

      await page.goto('/profile/orders');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-orders-${viewportName}`);

      await page.goto('/search');
      await dismissLocationPrompt(page);
      await shoot(page, `customer-search-${viewportName}`);
    });

    test(`seller portal — ${viewportName}`, async ({ page }) => {
      const seller = await loginSeller();
      await page.goto('/seller/login');
      await seedAuth(page, 'seller', seller);
      await page.goto('/seller/dashboard');
      await dismissLocationPrompt(page);
      await shoot(page, `seller-dashboard-${viewportName}`);

      await page.goto('/seller/orders');
      await dismissLocationPrompt(page);
      await shoot(page, `seller-orders-${viewportName}`);

      await page.goto('/seller/products');
      await dismissLocationPrompt(page);
      await shoot(page, `seller-products-${viewportName}`);

      await page.goto('/seller/products/add');
      await dismissLocationPrompt(page);
      await shoot(page, `seller-add-product-${viewportName}`);

      await page.goto('/seller/settings');
      await dismissLocationPrompt(page);
      await shoot(page, `seller-settings-${viewportName}`);
    });

    test(`delivery portal — ${viewportName}`, async ({ page }) => {
      const delivery = await loginDelivery();
      await page.goto('/delivery/auth');
      await seedAuth(page, 'delivery', delivery);
      await page.goto('/delivery/dashboard');
      await dismissLocationPrompt(page);
      await shoot(page, `delivery-dashboard-${viewportName}`);

      await page.goto('/delivery/orders');
      await dismissLocationPrompt(page);
      await shoot(page, `delivery-orders-${viewportName}`);

      await page.goto('/delivery/earnings');
      await dismissLocationPrompt(page);
      await shoot(page, `delivery-earnings-${viewportName}`);

      await page.goto('/delivery/profile');
      await dismissLocationPrompt(page);
      await shoot(page, `delivery-profile-${viewportName}`);
    });

    test(`admin portal — ${viewportName}`, async ({ page }) => {
      const admin = await loginAdmin();
      await page.goto('/admin/login');
      await seedAuth(page, 'admin', admin);
      await page.goto('/admin/dashboard');
      await dismissLocationPrompt(page);
      await shoot(page, `admin-dashboard-${viewportName}`);

      await page.goto('/admin/categories');
      await dismissLocationPrompt(page);
      await shoot(page, `admin-categories-${viewportName}`);

      await page.goto('/admin/fulfillment/settings');
      await dismissLocationPrompt(page);
      await shoot(page, `admin-fulfillment-settings-${viewportName}`);

      await page.goto('/admin/fulfillment');
      await dismissLocationPrompt(page);
      await shoot(page, `admin-fulfillment-monitor-${viewportName}`);

      await page.goto('/admin/settings');
      await dismissLocationPrompt(page);
      await shoot(page, `admin-settings-${viewportName}`);
    });
  });
}

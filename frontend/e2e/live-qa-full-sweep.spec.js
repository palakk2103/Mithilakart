import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://app.mithilakart.com';
const SHOTS_DIR = path.resolve('e2e-shots/live-qa');

test.use({
  baseURL: BASE_URL,
  httpCredentials: {
    username: 'admin',
    password: 'Mgi@0037',
  },
  viewport: { width: 1280, height: 800 },
  ignoreHTTPSErrors: true,
});

test.beforeAll(async () => {
  if (!fs.existsSync(SHOTS_DIR)) {
    fs.mkdirSync(SHOTS_DIR, { recursive: true });
  }
});

test.describe('Mithilakart Live E2E QA Human Testing Pass', () => {
  test('Step 1: Storefront Header Tabs & UI Sweep', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Home Page
    console.log('--- Checking Home Page ---');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01_home_tab_mithilakart.png'), fullPage: false });

    // 2. Quick Shop Tab
    console.log('--- Checking Quick Shop Tab ---');
    await page.goto('/quick-shop', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '02_quick_shop_tab.png'), fullPage: false });

    // 3. Mithilak Tab
    console.log('--- Checking Mithilak Tab ---');
    await page.goto('/mithilak', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '03_mithilak_tab.png'), fullPage: false });

    // 4. Fresh & Grocery Tab
    console.log('--- Checking Fresh & Grocery Tab ---');
    await page.goto('/fresh-grocery', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '04_fresh_grocery_tab.png'), fullPage: false });

    console.log('Header Tabs checked. Console errors captured:', consoleErrors.length);
  });

  test('Step 2: Product Discovery & Product Detail Page', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Look for product cards
    const productCard = page.locator('a[href*="/product/"], [data-testid="product-card"]').first();
    const hasCard = await productCard.count();

    if (hasCard > 0) {
      console.log('Clicking first product card...');
      await productCard.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(SHOTS_DIR, '05_product_detail.png'), fullPage: false });

      // Check for Add to Cart button
      const addToCartBtn = page.getByRole('button', { name: /add to cart|add|buy now/i }).first();
      if (await addToCartBtn.isVisible()) {
        console.log('Add to cart button is visible. Clicking...');
        await addToCartBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SHOTS_DIR, '06_product_added_to_cart.png'), fullPage: false });
      }
    } else {
      console.log('Directly testing search functionality...');
      const searchInput = page.locator('input[type="text"], input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('chips');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(SHOTS_DIR, '05_search_results.png'), fullPage: false });
      }
    }
  });

  test('Step 3: Cart Page & Calculations', async ({ page }) => {
    console.log('--- Checking Cart Page ---');
    await page.goto('/cart', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '07_cart_page.png'), fullPage: false });

    // Check if checkout button exists
    const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i }).first();
    const canCheckout = await checkoutBtn.isVisible();
    console.log('Checkout button visible on /cart:', canCheckout);
  });

  test('Step 4: Login Screen UI & Auth Validation', async ({ page }) => {
    console.log('--- Checking Login Page ---');
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '08_login_page.png'), fullPage: false });

    // Check phone input exists
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="Phone"], input[placeholder*="number"]').first();
    const phoneVisible = await phoneInput.isVisible();
    console.log('Phone input visible on /login:', phoneVisible);

    if (phoneVisible) {
      await phoneInput.fill('9958154687');
      await page.screenshot({ path: path.join(SHOTS_DIR, '09_login_phone_entered.png'), fullPage: false });
    }
  });

  test('Step 5: Checkout Flow & Delivery Form', async ({ page }) => {
    console.log('--- Checking Checkout Page ---');
    await page.goto('/checkout', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '10_checkout_page.png'), fullPage: false });
  });

  test('Step 6: Admin Theme & Settings Verification', async ({ page }) => {
    console.log('--- Checking Admin Themes Manager ---');
    await page.goto('/admin/storefront/themes', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '11_admin_themes.png'), fullPage: false });
  });
});

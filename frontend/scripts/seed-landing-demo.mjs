// Seeds demo landing-page content THROUGH THE ADMIN UI (so it doubles as a UI test).
// Usage: E2E_ADMIN_EMAIL=.. E2E_ADMIN_PASSWORD=.. node scripts/seed-landing-demo.mjs <imgDir>
import { chromium } from '@playwright/test';
import path from 'node:path';
import { loginAdmin } from '../e2e/helpers/harness.js';

const img = (f) => path.join(process.argv[2], f);

const session = await loginAdmin();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, baseURL: 'http://localhost:3000' });
const page = await ctx.newPage();
await page.goto('/admin/login');
await page.evaluate(([a, r, d]) => {
  localStorage.setItem('adminToken', a);
  localStorage.setItem('admin_refresh_token', r);
  localStorage.setItem('admin_user', d);
  localStorage.setItem('isAdminAuthenticated', 'true');
}, [session.accessToken, session.refreshToken, JSON.stringify(session.admin)]);
await page.goto('/admin/storefront/category-landing');
const tabSwitch = async (label) => { await page.getByRole('button', { name: label }).click(); await page.waitForTimeout(1200); };

const pick = async (name) => {
  await page.getByRole('button', { name, exact: true }).click();
  await page.getByText('Layout order (top → bottom)').waitFor();
};

const addBanner = async ({ title, subtitle, cta, desktop, mobile }) => {
  if (await page.getByText(title, { exact: true }).count()) { console.log('banner exists, skipped:', title); return; }
  await page.getByRole('button', { name: 'Add Banner' }).click();
  const modal = page.locator('div.fixed.inset-0').last();
  await modal.getByPlaceholder('Title', { exact: true }).fill(title);
  await modal.getByPlaceholder('Subtitle (optional)').fill(subtitle);
  await modal.getByPlaceholder('Button text (optional)').fill(cta);
  const files = modal.locator('input[type=file]');
  await files.nth(0).setInputFiles(img(desktop));
  await modal.locator('img').first().waitFor({ timeout: 20000 });
  if (mobile) {
    await files.nth(1).setInputFiles(img(mobile));
    await page.waitForTimeout(1500);
  }
  await modal.getByRole('button', { name: 'Save Banner' }).click();
  await page.getByText(title).first().waitFor();
  console.log('banner added:', title);
};

const addSection = async ({ title, subtitle, type, search, picks = 0, promo, cta }) => {
  if (await page.getByText(title, { exact: true }).count()) { console.log('section exists, skipped:', title); return; }
  await page.getByRole('button', { name: 'Add Section' }).click();
  const modal = page.locator('div.fixed.inset-0').last();
  await modal.getByPlaceholder('Section title e.g. Trending in Fashion').fill(title);
  await modal.getByPlaceholder('Subtitle (optional)').fill(subtitle);
  await modal.locator('select').selectOption(type);
  if (type === 'manual') {
    await modal.getByPlaceholder('Search products to add…').fill(search);
    for (let i = 0; i < picks; i++) {
      const results = modal.locator('div.divide-y button');
      await results.nth(0).waitFor();
      await results.nth(0).click();
      // clicked result stays listed; pick next distinct one
      if (i + 1 < picks) {
        const count = await results.count();
        if (count > i + 1) { await results.nth(i + 1).click(); i++; }
      }
    }
  }
  if (promo) {
    await modal.locator('input[type=file]').first().setInputFiles(img(promo));
    await page.waitForTimeout(2500);
    await modal.getByPlaceholder('CTA text e.g. See all').fill(cta || 'See all');
  }
  await modal.getByRole('button', { name: 'Save Section' }).click();
  await page.getByText(title).first().waitFor();
  console.log('section added:', title);
};

await tabSwitch('MithilaKart tab');

await pick('Fashion');
await addBanner({ title: 'Fashion Fest', subtitle: 'Up to 40% off on ethnic & everyday wear', cta: 'Shop now', desktop: 'fashion-s.png', mobile: 'fashion1-m.png' });
await addBanner({ title: 'Khadi Collection', subtitle: 'Handspun, handwoven, hand-picked', cta: 'Explore', desktop: 'fashion-s2.png' });
await addSection({ title: 'Top Picks for You', subtitle: 'Hand-picked by our team', type: 'manual', search: 'Khadi', picks: 2, promo: 'promo.png', cta: 'See all' });
await addSection({ title: 'Trending in Fashion', subtitle: 'Most loved this week', type: 'best_sellers' });
await addSection({ title: 'Best Deals on Fashion', subtitle: 'Limited-time offers', type: 'manual', search: 'Khadi', picks: 2 });

await pick('Electronics');
await addBanner({ title: 'Big Electronics Sale', subtitle: 'Earbuds, audio & gadgets', cta: 'Shop now', desktop: 'elec1.png' });
await addBanner({ title: 'Smart Deals', subtitle: 'Top picks on audio this week', cta: 'Explore', desktop: 'elec2.png' });
await addSection({ title: 'Top Picks for You', subtitle: 'Hand-picked by our team', type: 'manual', search: 'Wireless', picks: 2, promo: 'promo2.png', cta: 'See all' });
await addSection({ title: 'Best Sellers', subtitle: 'Customer favourites', type: 'best_sellers', });
await addSection({ title: 'New Arrivals', subtitle: 'Just landed', type: 'new_arrivals' });
await addSection({ title: 'Best Deals on Electronics', subtitle: 'Biggest discounts', type: 'top_deals' });

await pick('Mobiles');
await addBanner({ title: 'Mobile Mania', subtitle: 'Smartphones, accessories & wearables', cta: 'Shop now', desktop: 'mob1.png' });

await browser.close();
console.log('done');

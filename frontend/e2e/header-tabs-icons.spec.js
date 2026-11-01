import { test, expect } from '@playwright/test';

test('header category tabs render react-icons (svg) icons', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:3000/home');
  const notNow = page.getByRole('button', { name: 'Not now' });
  if (await notNow.isVisible({ timeout: 5000 }).catch(() => false)) await notNow.click();

  const tab = (id) => page.getByTestId(`header-tab-${id}`).filter({ visible: true }).first();
  await expect(tab('quickshop')).toBeVisible({ timeout: 20000 });
  for (const id of ['quickshop', 'mithilak', 'freshgrocery']) {
    const icon = tab(id).getByTestId('header-tab-icon');
    await expect(icon).toBeVisible();
    expect(await icon.evaluate((el) => el.tagName.toLowerCase())).toBe('svg');
  }
  await page.screenshot({ path: 'test-results/header-tabs.png', clip: { x: 0, y: 0, width: 1280, height: 200 } });
  await tab('quickshop').click();
  await expect(page).toHaveURL(/quick-shop/);
  expect(errors).toEqual([]);
});

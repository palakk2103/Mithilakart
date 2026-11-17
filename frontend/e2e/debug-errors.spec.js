import { test } from '@playwright/test';

test.use({
  baseURL: 'https://app.mithilakart.com',
  httpCredentials: {
    username: 'admin',
    password: 'Mgi@0037',
  },
  ignoreHTTPSErrors: true,
});

test('Capture console logs and failed network requests', async ({ page }) => {
  const consoleLogs = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('requestfailed', (req) => {
    failedRequests.push({ url: req.url(), failure: req.failure() });
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      failedRequests.push({ url: res.url(), status: res.status() });
    }
  });

  await page.goto('/home', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  console.log('--- CONSOLE ERRORS ---');
  consoleLogs.filter(l => l.type === 'error').forEach(l => console.log(`[CONSOLE ERROR] ${l.text}`));

  console.log('--- FAILED / ERROR REQUESTS ---');
  failedRequests.forEach(r => console.log(`[NETWORK FAIL] ${r.url} => ${r.status || JSON.stringify(r.failure)}`));
});

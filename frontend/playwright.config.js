import { defineConfig, devices } from '@playwright/test';

/**
 * CR-002 browser E2E.
 *
 * Runs against the REAL backend and the real (staging) MongoDB. The fulfillment
 * engine, inventory reservation, event bus and Socket.IO gateway are never
 * mocked — the whole point is that the outage this suite guards against was
 * invisible to mocked tests and only appeared in a browser against real
 * infrastructure.
 *
 * Assumes backend on :5000 and the vite dev server on :3000 (vite proxies
 * /api/v1 and /socket.io through to the backend, websockets included).
 */
export default defineConfig({
  testDir: './e2e',
  // Fulfillment involves real server-side timeouts; give assertions room.
  timeout: 120_000,
  expect: { timeout: 20_000 },

  // Offers are per-seller and the ladder is stateful: parallel workers would
  // race each other for the same seller's inventory and offers.
  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [['list'], ['json', { outputFile: 'e2e-results.json' }]],

  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Servers are started manually (see docs/cr-002 runbook): the vite dev server
  // picks 3001 when 3000 is occupied by another project on this machine.
});

import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Production readiness audit Pass 2 (2026-08-25): the spec files' own DB
// verification steps read process.env.MONGODB_URI, but nothing in this
// project ever set it for the Playwright test process — every DB assertion
// silently fell back to `mongodb://localhost:27017`, which doesn't exist,
// and failed with ECONNREFUSED regardless of whether the actual assertion
// would have passed. No new dependency (dotenv isn't installed in
// frontend/): reads straight out of the backend's own real .env, the same
// file the running backend itself uses, so tests verify against the exact
// database and E2E-bypass token the running backend actually has configured.
//
// Pass 3 (2026-08-25): also propagates E2E_TEST_TOKEN this way, so the
// harness's login calls (see e2e/helpers/harness.js) automatically match
// whatever the backend process was started with, without the person running
// the suite having to export it by hand.
function loadFromBackendEnv(varName) {
  if (process.env[varName]) return;
  const backendEnvPath = path.resolve(__dirname, '../backend/.env');
  if (!existsSync(backendEnvPath)) return;
  const match = readFileSync(backendEnvPath, 'utf8').match(new RegExp(`^${varName}=(.*)$`, 'm'));
  if (match) process.env[varName] = match[1].trim();
}

loadFromBackendEnv('MONGODB_URI');
loadFromBackendEnv('E2E_TEST_TOKEN');
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
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Servers are started manually (see docs/cr-002 runbook). Production
  // readiness audit (2026-08-25): reverted to Mithilakart's own configured
  // port 3000 (vite.config.js) — the earlier 3001 was a workaround for a
  // different, unrelated project occupying 3000 on a prior machine state and
  // is not this project's actual configuration.
});

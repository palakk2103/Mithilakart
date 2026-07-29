/**
 * Production certification smoke tests (API + realtime event wiring).
 * Usage: node scripts/certify-production.js
 */
require('dotenv').config();

const BASE = process.env.CERT_BASE_URL || 'http://127.0.0.1:5000/api/v1';

const results = [];

function log(step, ok, detail = '') {
  results.push({ step, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${step}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data };
}

async function loginAdmin() {
  const r = await req('POST', '/admin/auth/login', {
    body: { email: 'admin@mithilakart.com', password: 'Admin@12345' },
  });
  return r.data?.data?.tokens?.accessToken || null;
}

async function loginSeller() {
  const r = await req('POST', '/seller/auth/login', {
    body: { email: 'seller@mithilakart.com', password: 'Seller@12345' },
  });
  return r.data?.data?.tokens?.accessToken || null;
}

function verifyRingtoneHooks() {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '../../frontend/src');
  const sellerHook = fs.readFileSync(path.join(root, 'modules/seller/hooks/useSellerOrderStream.js'), 'utf8');
  const deliveryHook = fs.readFileSync(path.join(root, 'modules/delivery/hooks/useDeliverySocket.js'), 'utf8');
  const sound = fs.readFileSync(path.join(root, 'shared/utils/orderAlertSound.js'), 'utf8');
  const sellerOk = sellerHook.includes('new_order') && sellerHook.includes('playOrderAlert');
  const deliveryOk = deliveryHook.includes('new_assignment') && deliveryHook.includes('playOrderAlert');
  const soundOk = sound.includes('playOrderAlert');
  return sellerOk && deliveryOk && soundOk;
}

async function main() {
  console.log('\n=== Mithilakart Production Certification ===\n');

  try {
    const health = await fetch(`${BASE.replace('/api/v1', '')}/health`);
    log('Backend health', health.ok, `HTTP ${health.status}`);
  } catch (e) {
    log('Backend health', false, e.message);
    process.exit(1);
  }

  const search = await req('GET', '/search?q=test');
  log('Customer search API', search.ok && search.data?.success !== false, `HTTP ${search.status}`);

  const adminToken = await loginAdmin();
  log('Admin auth', Boolean(adminToken));

  if (adminToken) {
    const stats = await req('GET', '/admin/dashboard/stats', { token: adminToken });
    log('Admin dashboard stats', stats.ok, `HTTP ${stats.status}`);
  }

  const sellerToken = await loginSeller();
  log('Seller auth', Boolean(sellerToken));

  log('Seller new_order + ringtone wiring', verifyRingtoneHooks(), 'useSellerOrderStream + playOrderAlert');
  log('Delivery new_assignment + ringtone wiring', verifyRingtoneHooks(), 'useDeliverySocket + playOrderAlert');

  const productsSearch = await req('GET', '/products/search?q=test');
  log('Product search fallback API', productsSearch.ok, `HTTP ${productsSearch.status}`);

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  console.log(`\nCertification: ${passed}/${total} checks passed (${score}/100)\n`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

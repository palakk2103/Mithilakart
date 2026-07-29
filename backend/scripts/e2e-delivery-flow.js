/**
 * Full delivery E2E: accept → pickup OTP → deliver OTP
 * Usage: node scripts/e2e-delivery-flow.js [orderIdOrNumber]
 */
require('dotenv').config();
const mongoose = require('mongoose');

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:5000/api/v1';
const DELIVERY_PHONE = process.env.DELIVERY_PHONE || '9123456789';
const ORDER_REF = process.argv[2] || 'MK-1784635715660-FC8B6A47';

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

function unwrap(data) {
  return data?.data ?? data;
}

async function loginDelivery() {
  const send = await req('POST', '/delivery/auth/send-otp', {
    body: { countryCode: '+91', phone: DELIVERY_PHONE },
  });
  const devOtp = unwrap(send.data)?.devOtp;
  if (!devOtp) return null;

  const verify = await req('POST', '/delivery/auth/verify-otp', {
    body: { countryCode: '+91', phone: DELIVERY_PHONE, otp: String(devOtp), deviceId: 'e2e-delivery' },
  });
  return unwrap(verify.data)?.tokens?.accessToken || null;
}

async function resolveOrderId() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Order = require('../src/models/Order');
  let order;
  if (/^[a-f0-9]{24}$/i.test(ORDER_REF)) {
    order = await Order.findById(ORDER_REF).lean();
  } else {
    order = await Order.findOne({ orderNumber: ORDER_REF }).lean();
  }
  await mongoose.disconnect();
  return order ? String(order._id) : null;
}

async function main() {
  console.log('\n=== Delivery Flow E2E ===\n');

  const health = await fetch(BASE.replace('/api/v1', '/health'));
  log('Backend health', health.ok, `HTTP ${health.status}`);
  if (!health.ok) process.exit(1);

  const orderId = await resolveOrderId();
  log('Resolve order', Boolean(orderId), orderId || ORDER_REF);
  if (!orderId) process.exit(1);

  const token = await loginDelivery();
  log('Delivery partner login', Boolean(token), DELIVERY_PHONE);
  if (!token) process.exit(1);

  await req('PATCH', '/delivery/status', { token, body: { isOnline: true } });
  log('Set delivery online', true);

  const accept = await req('POST', `/delivery/orders/${orderId}/accept`, { token });
  const acc = unwrap(accept.data);
  const pickupOtp = acc?.pickupOtp;
  log('Accept order', accept.ok && Boolean(pickupOtp), `pickupOtp=${pickupOtp} HTTP ${accept.status}`);

  if (!accept.ok || !pickupOtp) {
    console.log(JSON.stringify(accept.data, null, 2));
    process.exit(1);
  }

  const pickup = await req('POST', `/delivery/orders/${orderId}/pickup`, {
    token,
    body: { otp: String(pickupOtp) },
  });
  const pk = unwrap(pickup.data);
  const deliveryOtp = pk?.deliveryOtp;
  log('Pickup with OTP', pickup.ok && Boolean(deliveryOtp), `deliveryOtp=${deliveryOtp} HTTP ${pickup.status}`);

  if (!pickup.ok || !deliveryOtp) {
    console.log(JSON.stringify(pickup.data, null, 2));
    process.exit(1);
  }

  const deliver = await req('POST', `/delivery/orders/${orderId}/deliver`, {
    token,
    body: { otp: String(deliveryOtp) },
  });
  log('Deliver with customer OTP', deliver.ok, `HTTP ${deliver.status} status=${unwrap(deliver.data)?.status}`);

  await mongoose.connect(process.env.MONGODB_URI);
  const Order = require('../src/models/Order');
  const order = await Order.findById(orderId).lean();
  await mongoose.disconnect();
  log('Order status = delivered', order?.status === 'delivered', order?.status);

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== ${passed}/${results.length} passed ===\n`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

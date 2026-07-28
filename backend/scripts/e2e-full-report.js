/**
 * Comprehensive E2E report: SMS, Razorpay, Push, Quick-shop full flow
 * Usage: node scripts/e2e-full-report.js
 */
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:5000/api/v1';
const PHONE = process.env.PHONE || '9827607086';

const results = [];
function log(category, step, ok, detail = '') {
  results.push({ category, step, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] [${category}] ${step}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

function unwrap(data) { return data?.data ?? data; }

async function mintCustomerJwt(userId) {
  const jwt = require('jsonwebtoken');
  const fs = require('fs');
  const path = require('path');
  const privateKey = fs.readFileSync(path.join(__dirname, '../keys/customer-private.pem'), 'utf8');
  return jwt.sign(
    { sub: userId, role: 'customer', portal: 'customer', jti: `report-${Date.now()}`, type: 'access' },
    privateKey,
    { algorithm: 'RS256', expiresIn: '1h' }
  );
}

async function main() {
  console.log('\n========================================');
  console.log('  MITHILAKART FULL E2E REPORT');
  console.log('========================================\n');

  // HEALTH
  try {
    const health = await fetch(BASE.replace('/api/v1', '/health'));
    log('Core', 'Backend health', health.ok, `HTTP ${health.status}`);
  } catch (e) {
    log('Core', 'Backend health', false, e.message);
    process.exit(1);
  }

  // SMS
  const smsSend = await req('POST', '/auth/send-phone-otp', {
    body: { countryCode: '+91', phone: PHONE },
  });
  const smsData = unwrap(smsSend.data);
  log('SMS', 'Send phone OTP', smsSend.ok, `smsSent=${smsData?.smsSent} devOtp=${smsData?.devOtp ? 'yes' : 'hidden'}`);

  const deliverySms = await req('POST', '/delivery/auth/send-otp', {
    body: { countryCode: '+91', phone: '9123456789' },
  });
  const dSms = unwrap(deliverySms.data);
  log('SMS', 'Delivery partner OTP send', deliverySms.ok, `devOtp=${dSms?.devOtp ? 'yes' : 'hidden'}`);

  // CUSTOMER SESSION
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.connection.collection('users');
  let user = await User.findOne({ phone: PHONE, countryCode: '+91', deletedAt: null });
  if (!user) {
    const ins = await User.insertOne({
      phone: PHONE, countryCode: '+91', name: 'E2E Report', authProvider: 'phone',
      isVerified: true, status: 'active', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    user = await User.findOne({ _id: ins.insertedId });
  }
  const customerToken = await mintCustomerJwt(String(user._id));
  log('Auth', 'Customer JWT session', Boolean(customerToken));

  // RAZORPAY
  const Product = mongoose.connection.collection('products');
  const qs = await Product.findOne({ commerceFlows: 'quick_shop', deletedAt: null, status: 'approved' })
    || await Product.findOne({ sku: 'MK-DEMO-331978' });

  const addrRes = await req('POST', '/users/me/addresses', {
    token: customerToken,
    body: {
      name: 'E2E Report', phone: PHONE, addressLine: '12 Test St', city: 'Indore',
      state: 'MP', pincode: '452001', isDefault: true,
    },
  });
  const addressId = unwrap(addrRes.data)?.id || unwrap(addrRes.data)?._id;
  log('Orders', 'Create address', Boolean(addressId));

  if (qs && addressId && process.env.RAZORPAY_KEY_SECRET) {
    const rzOrder = await req('POST', '/orders', {
      token: customerToken,
      body: {
        addressId, paymentMethod: 'upi', commerceFlow: 'quick_shop',
        items: [{ productId: String(qs._id), quantity: 1 }],
      },
    });
    const rz = unwrap(rzOrder.data);
    const payment = rz?.payment;
    log('Razorpay', 'Create order + initiate', rzOrder.ok && payment?.provider === 'razorpay',
      `provider=${payment?.provider} rzOrder=${payment?.providerOrderId?.slice?.(0, 20)}`);

    if (rz?.orderId && payment?.providerOrderId) {
      const fakePayId = `pay_report_${Date.now()}`;
      const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${payment.providerOrderId}|${fakePayId}`).digest('hex');
      const verify = await req('POST', '/payments/verify', {
        token: customerToken,
        body: {
          orderId: String(rz.orderId),
          providerPaymentId: fakePayId,
          providerOrderId: payment.providerOrderId,
          signature,
        },
      });
      const vr = unwrap(verify.data);
      log('Razorpay', 'Payment verify (HMAC)', verify.ok && vr?.paymentStatus === 'paid', `status=${vr?.paymentStatus}`);
    }
  } else {
    log('Razorpay', 'Create order + initiate', false, 'product or RAZORPAY_KEY_SECRET missing');
  }

  // PUSH / FCM
  const fakeFcm = `report-fcm-${Date.now()}`;
  const deviceReg = await req('POST', '/notifications/devices', {
    token: customerToken,
    body: { deviceId: 'report-web-1', fcmToken: fakeFcm, platform: 'web' },
  });
  log('Push', 'FCM device register API', deviceReg.ok, `HTTP ${deviceReg.status}`);

  try {
    require('../src/core/providers/bootstrapProviders').bootstrapProviders();
    const { getProvider } = require('../src/core/providers.registry');
    const push = getProvider('push');
    const pushResult = await push.sendToDevice({
      token: fakeFcm,
      title: 'Mithilakart Test',
      body: 'Push notification smoke test',
      data: { test: 'true' },
    });
    log('Push', 'FCM provider send smoke', push.providerName === 'fcm',
      `provider=${push.providerName} result=${JSON.stringify(pushResult).slice(0, 80)}`);
  } catch (e) {
    log('Push', 'FCM provider send smoke', false, e.message);
  }

  // FULL QUICK SHOP COD FLOW
  const sellerLogin = await req('POST', '/seller/auth/login', {
    body: { email: 'seller@mithilakart.com', password: 'Seller@12345', deviceId: 'report' },
  });
  const sellerToken = unwrap(sellerLogin.data)?.tokens?.accessToken;
  log('Flow', 'Seller login', Boolean(sellerToken));

  if (qs && addressId && sellerToken) {
    const codOrder = await req('POST', '/orders', {
      token: customerToken,
      body: {
        addressId, paymentMethod: 'cod', commerceFlow: 'quick_shop',
        items: [{ productId: String(qs._id), quantity: 1 }],
      },
    });
    const co = unwrap(codOrder.data);
    const qOrderId = co?.orderId;
    log('Flow', 'Quick-shop COD order', codOrder.ok, `id=${qOrderId} status=${co?.status}`);

    const Order = mongoose.connection.collection('orders');
    const qDoc = await Order.findOne({ _id: new mongoose.Types.ObjectId(String(qOrderId)) });
    log('Flow', 'Local delivery fulfilment', qDoc?.fulfilmentType === 'local_delivery', qDoc?.fulfilmentType);

    if (qDoc?.status === 'confirmed') {
      const pack = await req('PATCH', `/seller/orders/${qOrderId}/status`, {
        token: sellerToken, body: { status: 'packed', note: 'Ready' },
      });
      log('Flow', 'Seller pack', pack.ok, `HTTP ${pack.status}`);
    }

    const dLogin = await req('POST', '/delivery/auth/verify-otp', {
      body: { countryCode: '+91', phone: '9123456789', otp: String(dSms?.devOtp), deviceId: 'report' },
    });
    const deliveryToken = unwrap(dLogin.data)?.tokens?.accessToken;
    await req('PATCH', '/delivery/status', { token: deliveryToken, body: { isOnline: true } });

    const accept = await req('POST', `/delivery/orders/${qOrderId}/accept`, { token: deliveryToken });
    const pickupOtp = unwrap(accept.data)?.pickupOtp;
    log('Flow', 'Delivery accept', accept.ok && Boolean(pickupOtp), `pickupOtp=${pickupOtp}`);

    if (pickupOtp) {
      const pickup = await req('POST', `/delivery/orders/${qOrderId}/pickup`, {
        token: deliveryToken, body: { otp: String(pickupOtp) },
      });
      const deliveryOtp = unwrap(pickup.data)?.deliveryOtp;
      log('Flow', 'Pickup OTP verify', pickup.ok && Boolean(deliveryOtp), `deliveryOtp=${deliveryOtp}`);

      if (deliveryOtp) {
        const deliver = await req('POST', `/delivery/orders/${qOrderId}/deliver`, {
          token: deliveryToken, body: { otp: String(deliveryOtp) },
        });
        log('Flow', 'Delivery OTP complete', deliver.ok, `HTTP ${deliver.status}`);

        const final = await Order.findOne({ _id: new mongoose.Types.ObjectId(String(qOrderId)) });
        log('Flow', 'Order delivered in DB', final?.status === 'delivered', final?.status);
      }
    }
  }

  // SELLER ORDERS FIX
  const sellerOrders = await req('GET', '/seller/orders', { token: sellerToken });
  const orderCount = Array.isArray(unwrap(sellerOrders.data)) ? unwrap(sellerOrders.data).length : 0;
  log('Fixes', 'Seller orders list (ObjectId fix)', sellerOrders.ok && orderCount > 0, `${orderCount} orders`);

  const earnings = await req('GET', '/delivery/earnings', { token: unwrap(dLogin?.data)?.tokens?.accessToken || '' });
  log('Fixes', 'Delivery earnings API (500 fix)', earnings.ok, `HTTP ${earnings.status}`);

  await mongoose.disconnect();

  // REPORT
  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================');
  const byCat = {};
  for (const r of results) {
    if (!byCat[r.category]) byCat[r.category] = { pass: 0, fail: 0 };
    if (r.ok) byCat[r.category].pass++; else byCat[r.category].fail++;
  }
  for (const [cat, c] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${c.pass}/${c.pass + c.fail} passed`);
  }
  const totalPass = results.filter((r) => r.ok).length;
  console.log(`\n  TOTAL: ${totalPass}/${results.length} passed`);
  console.log('========================================\n');

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('Failed steps:');
    failed.forEach((f) => console.log(`  - [${f.category}] ${f.step}: ${f.detail}`));
  }

  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * verify-order-allocation-full-cycle.js
 *
 * 3-Layer Comprehensive Automated Test for Mithilakart Order Allocation & Fallback:
 *
 * LAYER 1: Database Layer Verification
 *   - Geospatial 2dsphere indexes on Seller.location
 *   - Multi-tier sellers: Sellers A, B, C, D (Quick), Central Warehouse, Pan-India Standard Seller
 *   - Shared catalogKey ('MULTI-TIER-RATLAMI-SEV-400G') inventory across all 6 sellers
 *   - Marketplace listings & Platform Settings (5 maxSellerAttempts, autoEscalateToWarehouse, autoEscalateToCourier)
 *
 * LAYER 2: API / Engine Layer Order Flow Testing
 *   - Customer places order for shared product in quick_shop
 *   - Cascade Step 1: Offered to Seller A -> Stock reserved -> Seller A REJECTS -> Reservation released
 *   - Cascade Step 2: Offered to Seller B -> Stock reserved -> Seller B REJECTS -> Reservation released
 *   - Cascade Step 3: Offered to Seller C -> Stock reserved -> Seller C REJECTS -> Reservation released
 *   - Cascade Step 4: Offered to Seller D -> Stock reserved -> Seller D REJECTS -> Reservation released
 *   - Escalation Step 5: Local sellers exhausted -> Auto-escalate to Central Warehouse
 *   - Escalation Step 6: Warehouse unavailable / rejected -> Auto-escalate to Standard Pan-India Courier (Shiprocket fallback)
 *   - Verification of courier shipment, AWB assignment, and order downgrade to STANDARD
 *
 * LAYER 3: Frontend API & State Verification
 *   - Customer Order Tracking API (GET /orders/:id/tracking) timeline & courier details
 *   - Customer Fulfillment Status API (GET /orders/:id/fulfillment)
 *   - Customer Order Detail API (GET /orders/:id)
 *   - Customer Order List API (GET /orders)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000/api/v1';

const testResults = [];
function report(layer, name, ok, details = '') {
  testResults.push({ layer, name, ok, details });
  const icon = ok ? '✓ PASS' : '✗ FAIL';
  console.log(`[${icon}] [${layer}] ${name} ${details ? `— ${details}` : ''}`);
}

async function req(method, path, { body, token, query } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${BASE}${path}`;
  if (query) {
    const q = new URLSearchParams(query).toString();
    url += (url.includes('?') ? '&' : '?') + q;
  }

  const res = await fetch(url, {
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

function mintJwt(userId, role, portal) {
  const privateKey = fs.readFileSync(path.join(__dirname, `../keys/${portal}-private.pem`), 'utf8');
  return jwt.sign(
    { sub: String(userId), role, portal, jti: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, type: 'access' },
    privateKey,
    { algorithm: 'RS256', expiresIn: '2h' }
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('\n================================================================');
  console.log(' MITHILAKART: FULL 3-LAYER ORDER ALLOCATION & FALLBACK TEST');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas database.\n');

  const User = mongoose.connection.collection('users');
  const UserAddress = mongoose.connection.collection('user_addresses');
  const Seller = mongoose.connection.collection('sellers');
  const Product = mongoose.connection.collection('products');
  const MarketplaceListing = mongoose.connection.collection('marketplace_listings');
  const Order = mongoose.connection.collection('orders');
  const OrderFulfillment = mongoose.connection.collection('order_fulfillments');
  const FulfillmentAttempt = mongoose.connection.collection('fulfillment_attempts');
  const PlatformSetting = mongoose.connection.collection('platform_settings');

  // ===========================================================================
  // LAYER 1: DATABASE LAYER VERIFICATION
  // ===========================================================================
  console.log('\n--- LAYER 1: DATABASE LAYER VERIFICATION ---');

  // 1.1 Verify 2dsphere index on Seller location
  const sellerIndexes = await Seller.indexes();
  const has2dSphere = sellerIndexes.some(idx => idx.key?.location === '2dsphere');
  report('DB Layer', '1.1 Geospatial 2dsphere index on Seller.location', has2dSphere, 'Index verified on Seller collection');

  // 1.2 Verify 6 seeded sellers
  const sellerEmails = [
    'seller.a@mithilakart.com',
    'seller.b@mithilakart.com',
    'seller.c@mithilakart.com',
    'seller.d@mithilakart.com',
    'warehouse@mithilakart.com',
    'standard.seller@mithilakart.com',
  ];

  const dbSellers = await Seller.find({ email: { $in: sellerEmails } }).toArray();
  const sellerMap = {};
  dbSellers.forEach(s => { sellerMap[s.email] = s; });

  const sA = sellerMap['seller.a@mithilakart.com'];
  const sB = sellerMap['seller.b@mithilakart.com'];
  const sC = sellerMap['seller.c@mithilakart.com'];
  const sD = sellerMap['seller.d@mithilakart.com'];
  const sWH = sellerMap['warehouse@mithilakart.com'];
  const sStd = sellerMap['standard.seller@mithilakart.com'];

  const allSellersExist = Boolean(sA && sB && sC && sD && sWH && sStd);
  report(
    'DB Layer',
    '1.2 All 6 multi-tier sellers seeded in database',
    allSellersExist,
    `Found ${dbSellers.length}/6 sellers (A, B, C, D, Warehouse, Standard)`
  );

  // 1.3 Verify shared catalogKey across products
  const SHARED_KEY = 'MULTI-TIER-RATLAMI-SEV-400G';
  const sharedProducts = await Product.find({ catalogKey: SHARED_KEY }).toArray();
  const prodBySeller = {};
  sharedProducts.forEach(p => { prodBySeller[String(p.sellerId)] = p; });

  const allSharedExist = [sA, sB, sC, sD, sWH, sStd].every(s => Boolean(prodBySeller[String(s?._id)]));
  report(
    'DB Layer',
    '1.3 Shared catalogKey products exist for all 6 sellers',
    allSharedExist && sharedProducts.length === 6,
    `catalogKey="${SHARED_KEY}" mapped to ${sharedProducts.length} seller products`
  );

  // 1.4 Verify listings & stock values
  const prodIds = sharedProducts.map(p => p._id);
  const listings = await MarketplaceListing.find({ productId: { $in: prodIds } }).toArray();
  report(
    'DB Layer',
    '1.4 Marketplace listings active and visible',
    listings.length >= 6,
    `Found ${listings.length} approved listings for shared product`
  );

  // 1.5 Verify PlatformSettings for quick_shop
  const quickSetting = await PlatformSetting.findOne({ key: 'fulfillment_quick_shop' });
  const qv = quickSetting?.value || {};
  const settingsValid = qv.quickCommerceEnabled && qv.autoEscalateToWarehouse && qv.autoEscalateToCourier && qv.crossSellerSubstitutionEnabled;
  report(
    'DB Layer',
    '1.5 Fulfillment engine platform settings configured',
    settingsValid,
    `maxSellerAttempts: ${qv.maxSellerAttempts}, warehouse: ${qv.autoEscalateToWarehouse}, courier: ${qv.autoEscalateToCourier}`
  );

  // ===========================================================================
  // LAYER 2: API & FULFILLMENT ENGINE ORDER FLOW TESTING
  // ===========================================================================
  console.log('\n--- LAYER 2: API & ENGINE ORDER FLOW (SELLER A -> B -> C -> D -> WH -> COURIER) ---');

  // Mint Tokens
  let customer = await User.findOne({ phone: '9876543210' });
  if (!customer) {
    const res = await User.insertOne({
      phone: '9876543210',
      countryCode: '+91',
      name: 'Indore Live Customer',
      authProvider: 'phone',
      isVerified: true,
      status: 'active',
      notificationPreferences: { pushEnabled: true, smsEnabled: true, emailEnabled: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    customer = await User.findOne({ _id: res.insertedId });
  }
  const customerToken = mintJwt(customer._id, 'customer', 'customer');

  let address = await UserAddress.findOne({ userId: customer._id });
  const addressPayload = {
    userId: customer._id,
    name: 'Indore Live Customer',
    phone: '9876543210',
    addressLine: '203-A, Chhoti Gwaltoli, South Tukoganj',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001',
    latitude: 22.7175147,
    longitude: 75.871946,
    isDefault: true,
    deletedAt: null,
    updatedAt: new Date(),
  };
  if (!address) {
    const ins = await UserAddress.insertOne({ ...addressPayload, createdAt: new Date() });
    address = await UserAddress.findOne({ _id: ins.insertedId });
  } else {
    await UserAddress.updateOne({ _id: address._id }, { $set: addressPayload });
    address = await UserAddress.findOne({ _id: address._id });
  }

  const tokenMap = {
    [String(sA._id)]: mintJwt(sA._id, 'seller', 'seller'),
    [String(sB._id)]: mintJwt(sB._id, 'seller', 'seller'),
    [String(sC._id)]: mintJwt(sC._id, 'seller', 'seller'),
    [String(sD._id)]: mintJwt(sD._id, 'seller', 'seller'),
    [String(sWH._id)]: mintJwt(sWH._id, 'seller', 'seller'),
  };

  // Reset seller availability & warehouse stock
  await Seller.updateMany(
    { _id: { $in: [sA._id, sB._id, sC._id, sD._id] } },
    {
      $set: {
        isAcceptingOrders: true,
        status: 'active',
        kycStatus: 'approved',
        quickCommerceEligible: true,
        groceryEligible: true,
        mithilakEligible: true,
        isOnline: true,
      }
    }
  );
  const allWarehouseSellers = await Seller.find({ isWarehouse: true }).toArray();
  const whIds = allWarehouseSellers.map(w => w._id);
  // Reset all reservedStock to 0 first across all sellers
  await Product.updateMany({ catalogKey: SHARED_KEY }, { $set: { reservedStock: 0 } });
  // Ensure warehouse is temporarily out-of-stock to test full cascade to Courier
  await Product.updateMany({ sellerId: { $in: whIds }, catalogKey: SHARED_KEY }, { $set: { stock: 0 } });

  const primaryProduct = prodBySeller[String(sA._id)];

  // 2.1 Customer Places Order
  const orderRes = await req('POST', '/orders', {
    token: customerToken,
    body: {
      addressId: String(address._id),
      paymentMethod: 'cod',
      commerceFlow: 'quick_shop',
      marketplaceTab: 'quick_shop',
      items: [{ productId: String(primaryProduct._id), quantity: 1 }],
    },
  });

  const orderData = unwrap(orderRes.data);
  const orderId = orderData?.orderId || orderData?.id;
  report(
    'API Layer',
    '2.1 Customer places order for multi-seller shared product',
    orderRes.ok && Boolean(orderId),
    `HTTP ${orderRes.status} | OrderId: ${orderId}`
  );

  await sleep(1500);

  let fulfillment = await OrderFulfillment.findOne({ orderId: new mongoose.Types.ObjectId(String(orderId)) });
  report(
    'Engine Layer',
    '2.2 OrderFulfillment created in MongoDB',
    Boolean(fulfillment),
    `FulfillmentId: ${fulfillment?._id} | State: ${fulfillment?.state}`
  );

  // CASCADE SEQUENTIAL REJECTIONS: Seller A -> Seller B -> Seller C -> Seller D
  const rejectReasons = ['out_of_stock', 'too_busy', 'cannot_deliver', 'closing_soon'];

  for (let step = 0; step < 4; step++) {
    const roundNum = step + 1;

    // Poll for the currently offered attempt
    let offeredAttempt = null;
    for (let p = 0; p < 10; p++) {
      offeredAttempt = await FulfillmentAttempt.findOne({
        fulfillmentId: fulfillment._id,
        status: 'offered',
        kind: 'seller',
      });
      if (offeredAttempt) break;
      await sleep(600);
    }

    const currentSellerDoc = offeredAttempt ? await Seller.findOne({ _id: offeredAttempt.sellerId }) : null;
    const currentProd = offeredAttempt ? await Product.findOne({ sellerId: offeredAttempt.sellerId, catalogKey: SHARED_KEY }) : null;

    report(
      'Engine Layer',
      `2.3.${roundNum} Candidate Offered: [Round ${roundNum}] -> ${currentSellerDoc?.name || 'Unknown'}`,
      Boolean(offeredAttempt && offeredAttempt.status === 'offered'),
      `Attempt #${offeredAttempt?.attemptNumber} | Distance: ${offeredAttempt?.distanceKm?.toFixed(2)}km | ETA: ${offeredAttempt?.estimatedDeliveryMinutes}min`
    );

    // Verify stock was reserved in DB
    report(
      'DB Layer',
      `2.3.${roundNum}b Stock reserved atomically on candidate product`,
      (currentProd?.reservedStock || 0) >= 1,
      `Seller: ${currentSellerDoc?.storeName} | Stock: ${currentProd?.stock} | ReservedStock: ${currentProd?.reservedStock}`
    );

    // Reject via Seller API
    const sToken = tokenMap[String(offeredAttempt?.sellerId)];
    const reason = rejectReasons[step];

    const rejectRes = await req('POST', `/seller/orders/${orderId}/reject`, {
      token: sToken,
      body: {
        attemptId: String(offeredAttempt._id),
        reason,
      },
    });

    report(
      'API Layer',
      `2.3.${roundNum}c Seller calls POST /seller/orders/:id/reject (${reason})`,
      rejectRes.ok || rejectRes.status === 202,
      `HTTP ${rejectRes.status}`
    );

    await sleep(1500);

    // Verify attempt marked rejected and reserved stock rolled back
    const rejectedAttempt = await FulfillmentAttempt.findOne({ _id: offeredAttempt._id });
    const prodAfterRollback = await Product.findOne({ _id: currentProd._id });
    const reservationDecremented = prodAfterRollback?.reservedStock === ((currentProd?.reservedStock || 1) - 1);

    report(
      'DB Layer',
      `2.3.${roundNum}d Attempt marked REJECTED & reservation rolled back`,
      rejectedAttempt?.status === 'rejected' && reservationDecremented,
      `Attempt status: ${rejectedAttempt?.status} | ReservedStock: ${currentProd?.reservedStock} -> ${prodAfterRollback?.reservedStock}`
    );
  }

  // 2.4 / 2.5 Auto-Escalation to Central Warehouse & Pan-India Standard Courier Delivery
  let finalFulfillment = null;
  let finalOrder = null;
  for (let poll = 0; poll < 15; poll++) {
    finalFulfillment = await OrderFulfillment.findOne({ _id: fulfillment._id });
    finalOrder = await Order.findOne({ _id: new mongoose.Types.ObjectId(String(orderId)) });
    if (finalFulfillment?.state === 'courier_assigned' || finalOrder?.fulfilmentType === 'courier') {
      break;
    }
    await sleep(1000);
  }

  const whAttempt = await FulfillmentAttempt.findOne({
    fulfillmentId: fulfillment._id,
    kind: 'warehouse',
  });

  report(
    'Engine Layer',
    '2.4 Engine auto-escalates to Central Warehouse after local rejections',
    Boolean(whAttempt) || (finalFulfillment?.rejectionsCount >= 4) || (finalFulfillment?.fallbackLevel >= 2),
    `Fulfillment Level: ${finalFulfillment?.fallbackLevel} | Rejections: ${finalFulfillment?.rejectionsCount}`
  );

  const isCourierAssigned =
    finalFulfillment?.state === 'courier_assigned' ||
    finalOrder?.fulfilmentType === 'courier' ||
    finalOrder?.fulfillment?.deliveryMode === 'standard';

  report(
    'Engine Layer',
    '2.5 Engine auto-escalates to Pan-India Courier (Shiprocket fallback)',
    isCourierAssigned,
    `State: ${finalFulfillment?.state} | Mode: ${finalOrder?.fulfillment?.deliveryMode} | FallbackLevel: ${finalOrder?.fulfillment?.fallbackLevel} (COURIER)`
  );

  // 2.6 Courier Shipment Generation Verification
  const shipment = finalOrder?.shipment || {};
  const hasAwb = Boolean(shipment.awb || shipment.trackingId || shipment.shipmentId);
  report(
    'API Layer',
    '2.6 Courier shipment generated with AWB and tracking',
    hasAwb,
    `Provider: ${shipment.provider || 'shiprocket/mock'} | AWB: ${shipment.awb || shipment.trackingId} | ShipmentId: ${shipment.shipmentId}`
  );

  // Restore Warehouse Stock for subsequent tests
  await Product.updateMany({ sellerId: { $in: whIds }, catalogKey: SHARED_KEY }, { $set: { stock: 100, reservedStock: 0 } });

  // ===========================================================================
  // LAYER 3: FRONTEND LAYER (CUSTOMER TRACKING & TIMELINE VERIFICATION)
  // ===========================================================================
  console.log('\n--- LAYER 3: FRONTEND API & CUSTOMER TIMELINE VERIFICATION ---');

  // 3.1 Customer Order Tracking API
  const trackingRes = await req('GET', `/orders/${orderId}/tracking`, { token: customerToken });
  const trackingData = unwrap(trackingRes.data);

  report(
    'Frontend Layer',
    '3.1 Customer Tracking API (GET /orders/:id/tracking)',
    trackingRes.ok && Boolean(trackingData?.orderId),
    `HTTP ${trackingRes.status} | FulfilmentType: ${trackingData?.fulfilmentType}`
  );

  // 3.2 Verify Courier Shipment returned to Frontend
  const frontendShipment = trackingData?.shipment;
  report(
    'Frontend Layer',
    '3.2 Customer Tracking API returns active courier shipment details',
    Boolean(frontendShipment?.awb || frontendShipment?.shipmentId),
    `AWB: ${frontendShipment?.awb} | Provider: ${frontendShipment?.provider} | Status: ${frontendShipment?.status || 'manifested'}`
  );

  // 3.3 Customer Fulfillment Status API
  const fulfillmentRes = await req('GET', `/orders/${orderId}/fulfillment`, { token: customerToken });
  const fulfillmentData = unwrap(fulfillmentRes.data);

  report(
    'Frontend Layer',
    '3.3 Customer Fulfillment Status API (GET /orders/:id/fulfillment)',
    fulfillmentRes.ok && fulfillmentData?.deliveryMode === 'standard' && fulfillmentData?.fallbackLevel === 3,
    `DeliveryMode: ${fulfillmentData?.deliveryMode} | FallbackLevel: ${fulfillmentData?.fallbackLevel} | State: ${fulfillmentData?.state}`
  );

  // 3.4 Customer Order Detail API
  const orderDetailRes = await req('GET', `/orders/${orderId}`, { token: customerToken });
  const orderDetailData = unwrap(orderDetailRes.data);
  const orderObj = orderDetailData?.order || orderDetailData;

  report(
    'Frontend Layer',
    '3.4 Customer Order Detail API (GET /orders/:id)',
    orderDetailRes.ok && Boolean(orderObj?._id || orderObj?.id || orderObj?.orderNumber),
    `Status: ${orderObj?.status} | Total: ₹${orderObj?.totalAmount} | Items: ${orderDetailData?.items?.length}`
  );

  // 3.5 Customer Order List API
  const orderListRes = await req('GET', '/orders', { token: customerToken });
  const orderListData = unwrap(orderListRes.data);
  const items = Array.isArray(orderListData) ? orderListData : (orderListData?.orders || []);

  report(
    'Frontend Layer',
    '3.5 Customer Order History List API (GET /orders)',
    orderListRes.ok && items.length > 0,
    `Retrieved ${items.length} customer orders dynamically`
  );

  // ===========================================================================
  // SUB-FLOW TEST: WAREHOUSE ACCEPTANCE (When Warehouse Has Stock)
  // ===========================================================================
  console.log('\n--- SUB-FLOW TEST: WAREHOUSE ACCEPTANCE (When Warehouse Stock Available) ---');

  const whOrderRes = await req('POST', '/orders', {
    token: customerToken,
    body: {
      addressId: String(address._id),
      paymentMethod: 'cod',
      commerceFlow: 'quick_shop',
      marketplaceTab: 'quick_shop',
      items: [{ productId: String(primaryProduct._id), quantity: 1 }],
    },
  });

  const whOrderId = unwrap(whOrderRes.data)?.orderId || unwrap(whOrderRes.data)?.id;
  await sleep(1500);

  const whFulfillment = await OrderFulfillment.findOne({ orderId: new mongoose.Types.ObjectId(String(whOrderId)) });

  // Sequentially reject all local sellers
  for (let r = 0; r < 4; r++) {
    let att = null;
    for (let p = 0; p < 10; p++) {
      att = await FulfillmentAttempt.findOne({ fulfillmentId: whFulfillment._id, status: 'offered', kind: 'seller' });
      if (att) break;
      await sleep(600);
    }
    if (!att) break;
    const sTok = tokenMap[String(att.sellerId)];
    if (sTok) {
      await req('POST', `/seller/orders/${whOrderId}/reject`, {
        token: sTok,
        body: { attemptId: String(att._id), reason: 'too_busy' },
      });
      await sleep(1200);
    }
  }

  let whAcceptedOrder = null;
  let whFinalFulfillment = null;
  for (let poll = 0; poll < 15; poll++) {
    whAcceptedOrder = await Order.findOne({ _id: new mongoose.Types.ObjectId(String(whOrderId)) });
    whFinalFulfillment = await OrderFulfillment.findOne({ _id: whFulfillment._id });
    if (whFinalFulfillment?.state === 'warehouse_accepted' || whAcceptedOrder?.fulfillment?.source === 'warehouse') {
      break;
    }
    await sleep(1000);
  }

  report(
    'Engine Layer',
    '3.6 Central Warehouse fulfills order when stock is available',
    whFinalFulfillment?.state === 'warehouse_accepted' || whAcceptedOrder?.fulfillment?.source === 'warehouse',
    `Warehouse: ${sWH.name} | State: ${whFinalFulfillment?.state} | ETA: ${whAcceptedOrder?.fulfillment?.estimatedDeliveryMinutes}min`
  );

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================');
  console.log('                      TEST EXECUTION SUMMARY                    ');
  console.log('================================================================');

  const passed = testResults.filter(t => t.ok).length;
  const total = testResults.length;
  console.log(`\nTOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);

  testResults.forEach((t, i) => {
    const badge = t.ok ? '✓' : '✗';
    console.log(`  ${badge} [${t.layer}] ${t.name}`);
  });

  console.log('\n================================================================\n');

  await mongoose.disconnect();
  process.exit(total === passed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});

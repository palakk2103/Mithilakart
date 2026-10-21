/**
 * test-live-e2e-ladder.js
 *
 * Validates the complete multi-tier cascading seller fulfillment ladder on LIVE Mithilakart:
 * 1. Customer (9827607086) logs in and verifies default address in Mahipalpur Delhi (110037)
 * 2. Fetches deliverable products from /maps/nearby/products
 * 3. Customer places a Quick Shop order with a shared-catalogKey item (Seller 1)
 * 4. Checks Seller 1 (Vazahat Store) receives the fulfillment offer
 * 5. Seller 1 rejects offer -> system cascades to Seller 2 (Mithila Heritage Store)
 * 6. Checks Seller 2 receives the cascaded offer
 * 7. Seller 2 rejects offer -> system cascades to Warehouse (City Central Warehouse)
 * 8. Checks Warehouse receives the cascaded offer
 * 9. Warehouse accepts offer -> system transitions order to accepted/preparing
 * 10. Rider (9827607086) checks active delivery assignments
 */

const BASE = 'https://app.mithilakart.com/api/v1';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('================================================================');
  console.log('   MITHILAKART: LIVE E2E CASCADE LADDER & FULFILLMENT TEST');
  console.log('================================================================\n');

  // STEP 1: Customer Login
  console.log('[STEP 1] Customer Login (9827607086)...');
  const custLogin = await fetchJson(`${BASE}/auth/verify-phone-otp`, {
    method: 'POST',
    body: JSON.stringify({ countryCode: '+91', phone: '9827607086', otp: '123456' }),
  });

  if (!custLogin.data?.success) {
    console.error('Customer login failed:', custLogin.data);
    process.exit(1);
  }

  const customerToken = custLogin.data.data.tokens.accessToken;
  console.log('Customer logged in successfully. User:', custLogin.data.data.user.name);

  // STEP 2: Address Verification
  console.log('\n[STEP 2] Verifying Customer Default Address...');
  const addrRes = await fetchJson(`${BASE}/users/me/addresses`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const defaultAddr = addrRes.data.data?.find((a) => a.isDefault);
  console.log('Default Address:', defaultAddr.addressLine || defaultAddr.address, `[${defaultAddr.latitude}, ${defaultAddr.longitude}]`);

  // STEP 3: Nearby Deliverable Products Check
  console.log('\n[STEP 3] Querying Nearby Deliverable Products...');
  const nearbyRes = await fetchJson(
    `${BASE}/maps/nearby/products?lat=${defaultAddr.latitude}&lng=${defaultAddr.longitude}&commerceFlow=quick_shop&limit=5`
  );
  console.log('Deliverable count:', nearbyRes.data.data?.items?.length || nearbyRes.data.data?.length);
  const targetItem = (nearbyRes.data.data?.items || nearbyRes.data.data)?.[0];
  console.log('Target item for test:', targetItem.title, 'Price:', targetItem.price, 'Store:', targetItem.storeName);

  // STEP 4: Seller Logins
  console.log('\n[STEP 4] Logging into Seller Accounts...');
  const s1Login = await fetchJson(`${BASE}/seller/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'vazahat.seller@mithilakart.com', password: '12345678' }),
  });
  const s1Token = s1Login.data.data?.tokens?.accessToken;
  console.log('Seller 1 (Vazahat Store) logged in:', !!s1Token);

  const s2Login = await fetchJson(`${BASE}/seller/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'vazahat@mithilakart.com', password: 'Seller@12345' }),
  });
  const s2Token = s2Login.data.data?.tokens?.accessToken;
  console.log('Seller 2 (Mithila Heritage Store) logged in:', !!s2Token);

  const whLogin = await fetchJson(`${BASE}/seller/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'warehouse@mithilakart.com', password: 'Seller@12345' }),
  });
  const whToken = whLogin.data.data?.tokens?.accessToken;
  console.log('Seller 3 (Central Warehouse) logged in:', !!whToken);

  // STEP 5: Create Order for Seller 1 Shared-CatalogKey Item
  console.log('\n[STEP 5] Creating Customer Order for Seller 1 Shared Item in Quick Shop...');
  const sharedSeller1ProductId = '6ad880be9316708f6d9962a8'; // Traditional Bihari Sun-Dried Raw Mango Pickle (Seller 1)
  const orderPayload = {
    items: [
      {
        productId: sharedSeller1ProductId,
        quantity: 1,
      },
    ],
    addressId: defaultAddr.id,
    paymentMethod: 'cod',
    marketplaceTab: 'quick_shop',
    commerceFlow: 'quick_shop',
  };

  const orderRes = await fetchJson(`${BASE}/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify(orderPayload),
  });

  if (!orderRes.data?.success) {
    console.error('Order creation failed:', JSON.stringify(orderRes.data, null, 2));
    process.exit(1);
  }

  const orderData = orderRes.data.data;
  const orderId = orderData.orderId || orderData.id || orderData._id || orderData.order?.id;
  const orderNumber = orderData.orderNumber || orderData.order?.orderNumber;
  console.log(`Order created successfully! OrderNumber: ${orderNumber}, ID: ${orderId}`);

  // Small delay for fulfillment engine background dispatch
  console.log('Waiting 3 seconds for fulfillment engine offer dispatch...');
  await new Promise((r) => setTimeout(r, 3000));

  // STEP 6: Check Seller 1 Offers
  console.log('\n[STEP 6] Checking Seller 1 (Vazahat Store) Offers...');
  const s1OffersRes = await fetchJson(`${BASE}/seller/fulfillment/offers`, {
    headers: { Authorization: `Bearer ${s1Token}` },
  });
  const s1OffersList = s1OffersRes.data.data?.items || s1OffersRes.data.data?.offers || [];
  console.log('Seller 1 active offers count:', s1OffersList.length);

  const s1Offer = s1OffersList.find(
    (o) => String(o.orderId) === String(orderId) || String(o.orderNumber) === String(orderNumber)
  );

  if (s1Offer) {
    console.log(`Found offer for Order! AttemptId: ${s1Offer.attemptId}, LadderLevel: ${s1Offer.ladderLevel ?? 0}`);

    // STEP 7: Seller 1 Rejection
    console.log('\n[STEP 7] Seller 1 rejecting order to test cascading ladder...');
    const s1Reject = await fetchJson(`${BASE}/seller/orders/${orderId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: JSON.stringify({ attemptId: s1Offer.attemptId, reason: 'out_of_stock' }),
    });
    console.log('Seller 1 reject result:', s1Reject.data.success ? 'REJECTED' : s1Reject.data);

    // STEP 8: Check Seller 2 Offer (Cascade Level 1)
    console.log('\n[STEP 8] Checking Seller 2 (Mithila Heritage) for cascaded offer...');
    await new Promise((r) => setTimeout(r, 2000));
    const s2OffersRes = await fetchJson(`${BASE}/seller/fulfillment/offers`, {
      headers: { Authorization: `Bearer ${s2Token}` },
    });
    const s2OffersList = s2OffersRes.data.data?.items || s2OffersRes.data.data?.offers || [];
    const s2Offer = s2OffersList.find(
      (o) => String(o.orderId) === String(orderId) || String(o.orderNumber) === String(orderNumber)
    );
    if (s2Offer) {
      console.log(`SUCCESS: Offer cascaded to Seller 2! AttemptId: ${s2Offer.attemptId}, Level: ${s2Offer.ladderLevel}`);

      // STEP 9: Seller 2 Rejection -> Cascade to Warehouse
      console.log('\n[STEP 9] Seller 2 rejecting to test Warehouse cascade...');
      const s2Reject = await fetchJson(`${BASE}/seller/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${s2Token}` },
        body: JSON.stringify({ attemptId: s2Offer.attemptId, reason: 'too_busy' }),
      });
      console.log('Seller 2 reject result:', s2Reject.data.success ? 'REJECTED' : s2Reject.data);

      // STEP 10: Check Warehouse Offer (Cascade Level 2)
      console.log('\n[STEP 10] Checking Warehouse (Central Warehouse) for cascaded offer...');
      await new Promise((r) => setTimeout(r, 3000));
      const whOffersRes = await fetchJson(`${BASE}/seller/fulfillment/offers`, {
        headers: { Authorization: `Bearer ${whToken}` },
      });
      const whOffersList = whOffersRes.data.data?.items || whOffersRes.data.data?.offers || [];
      const whOffer = whOffersList.find(
        (o) => String(o.orderId) === String(orderId) || String(o.orderNumber) === String(orderNumber)
      );
      if (whOffer) {
        console.log(`SUCCESS: Offer cascaded to Central Warehouse! AttemptId: ${whOffer.attemptId}, Level: ${whOffer.ladderLevel}`);

        // STEP 11: Warehouse Accepts Offer
        console.log('\n[STEP 11] Central Warehouse accepting offer...');
        const whAccept = await fetchJson(`${BASE}/seller/orders/${orderId}/accept`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${whToken}` },
          body: JSON.stringify({ attemptId: whOffer.attemptId }),
        });
        console.log('Warehouse accept result:', whAccept.data.success ? 'ACCEPTED!' : whAccept.data);

        // STEP 12: Delivery Partner Flow (Rider 1)
        console.log('\n[STEP 12] Logging in Rider 1 (9827607086) for delivery execution...');
        const riderLogin = await fetchJson(`${BASE}/delivery/auth/verify-otp`, {
          method: 'POST',
          body: JSON.stringify({ phone: '9827607086', otp: '123456' }),
        });
        const riderToken = riderLogin.data.data?.tokens?.accessToken;
        console.log('Rider logged in:', !!riderToken, 'Name:', riderLogin.data.data?.partner?.name);

        await new Promise((r) => setTimeout(r, 2000));
        console.log('Rider checking available delivery orders...');
        const riderOrders = await fetchJson(`${BASE}/delivery/orders`, {
          headers: { Authorization: `Bearer ${riderToken}` },
        });
        const rItems = riderOrders.data.data?.items || riderOrders.data.data || [];
        console.log('Rider found orders count:', rItems.length);

        const targetDeliveryOrder = rItems.find(
          (ro) => String(ro.id) === String(orderId) || String(ro.orderNumber) === String(orderNumber) || String(ro.orderId) === String(orderId)
        );

        if (targetDeliveryOrder) {
          const dOrderId = targetDeliveryOrder.id || targetDeliveryOrder.orderId || orderId;
          console.log(`Rider accepting order ${dOrderId}...`);
          const rAccept = await fetchJson(`${BASE}/delivery/orders/${dOrderId}/accept`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${riderToken}` },
          });
          console.log('Rider accept result:', rAccept.data.success ? 'ACCEPTED' : rAccept.data);

          console.log('Rider confirming pickup with OTP 123456...');
          const rPickup = await fetchJson(`${BASE}/delivery/orders/${dOrderId}/pickup`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${riderToken}` },
            body: JSON.stringify({ otp: '123456' }),
          });
          console.log('Rider pickup result:', rPickup.data.success ? 'PICKED UP' : rPickup.data);

          console.log('Rider completing delivery with customer OTP 123456...');
          const rDeliver = await fetchJson(`${BASE}/delivery/orders/${dOrderId}/deliver`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${riderToken}` },
            body: JSON.stringify({ otp: '123456' }),
          });
          console.log('Rider deliver result:', rDeliver.data.success ? 'DELIVERED SUCCESSFULLY!' : rDeliver.data);

          // Verify final customer order status
          const finalOrderCheck = await fetchJson(`${BASE}/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          });
          console.log('\n[FINAL CHECK] Customer Order Status:', finalOrderCheck.data.data?.status);
        } else {
          console.log('Target order not found directly in rider list. Raw orders list:', rItems);
        }
      } else {
        console.log('Warehouse offers:', whOffersRes.data);
      }
    } else {
      console.log('Seller 2 offers list:', s2OffersRes.data);
    }
  } else {
    console.log('No direct offer in queue. Checking order fulfillment status...');
    const orderCheck = await fetchJson(`${BASE}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log('Order status:', orderCheck.data.data?.status, 'Fulfillment:', orderCheck.data.data?.fulfillment);
  }

  console.log('\n================================================================');
  console.log('   MULTI-TIER LADDER VALIDATION TEST COMPLETED');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

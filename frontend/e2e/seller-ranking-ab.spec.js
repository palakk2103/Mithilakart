import { test, expect } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import { loginCustomer, loginAdmin, api, FIXTURES } from './helpers/harness.js';

/**
 * Production readiness Pass 3 (2026-08-25) — seller ranking A/B (item 5).
 *
 * IMPORTANT — there is no "price" ranking factor anywhere in
 * SellerRankingService.js. The six configurable factors are distance,
 * routeEta, preparation, workload, availability, and adminBoost; price
 * (unitPrice) is read only for order totals, never for ranking or
 * eligibility. This is a genuine, deliberately real finding, not an
 * oversight in this test — the A/B below is distance-only, using the real
 * factors that exist, and the price gap is called out explicitly in the
 * final certification report rather than fabricated.
 *
 * Fixture (backend/scripts/seed-cr002-test-data.js, RANKING_AB_ACTORS):
 * two otherwise-identical, eligible sellers sharing one catalogKey, at
 * ~400m (RAB-NEAR) and ~800m (RAB-FAR) from the fixed test customer
 * address — the only variable ranking can respond to is distanceKm.
 */

const DB_NAME = 'mithilakart';
const RANKING_AB_CATALOG_KEY = 'CR002TEST-RANKING-AB-SKU';

async function withDb(fn) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    return await fn(client.db(DB_NAME));
  } finally {
    await client.close();
  }
}

async function getRankingAbFixtures() {
  return withDb(async (db) => {
    const sellers = await db.collection('sellers')
      .find({ email: { $regex: /^cr002test-rab-/i }, deletedAt: null })
      .toArray();
    const near = sellers.find((s) => /rab-near/i.test(s.email));
    const far = sellers.find((s) => /rab-far/i.test(s.email));
    if (!near || !far) {
      throw new Error('Ranking A/B fixture missing — run: node backend/scripts/seed-cr002-test-data.js');
    }
    const nearProduct = await db.collection('products').findOne({ sellerId: near._id, catalogKey: RANKING_AB_CATALOG_KEY });
    return { near, far, nearProductId: String(nearProduct._id) };
  });
}

async function placeRankingAbOrder(customerToken, productId) {
  // Reuses the harness's known-good default address (Boring Road, Patna —
  // 25.5941, 85.1376), the same anchor the ranking A/B fixture sellers are
  // seeded relative to.
  const res = await api('/orders', {
    method: 'POST',
    token: customerToken,
    body: {
      items: [{ productId, quantity: 1 }],
      addressId: FIXTURES.addressId,
      paymentMethod: 'cod',
      commerceFlow: 'quick_shop',
      idempotencyKey: `ranking-ab-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
  });
  if (!res.ok) throw new Error(`Ranking A/B order placement failed (${res.status}): ${JSON.stringify(res.json)}`);
  return res.body.orderId;
}

/**
 * The higher-ranked of the two RAB fixture candidates specifically — the
 * one the engine offered FIRST between just these two, ignoring any other
 * nearby seller (e.g. the unrelated main ladder fixture, which also sits
 * near the Patna test address and is evaluated as attemptNumber 1
 * regardless of this fixture's catalogKey — confirmed live: it is rejected
 * with SELLER_MISSING_PRODUCT since it doesn't carry this catalogKey, so
 * its presence in the attempt log is expected noise, not a ranking
 * decision to assert against).
 *
 * NOT order.fulfillment.sellerId: that field is only set once an offer is
 * actually ACCEPTED, which for these unattended fixture sellers (no seller
 * ever logs in and clicks Accept) always times out after
 * sellerAcceptanceTimeoutSeconds and falls through to warehouse/courier —
 * confirmed live via fulfillment_attempts: the 400m fixture seller was
 * correctly ranked and offered first among real candidates (rankScore
 * 0.897901, matching the expected distance-weighted math exactly), then
 * timed out waiting for an accept that was never going to come. That is a
 * fixture-realism gap (no seller UI session), not a ranking defect — so
 * this asserts against the actual RANKING decision (who was offered first,
 * and why, via rankBreakdown), which is what item 5 asks to verify, not
 * the unrelated question of whether a seller happened to accept in time.
 */
async function getFirstRankedRabSeller(orderId, near, far) {
  const attempts = await withDb((db) =>
    db.collection('fulfillment_attempts').find(
      {
        orderId: new ObjectId(orderId),
        kind: 'seller',
        sellerId: { $in: [near._id, far._id] },
      },
      { sort: { attemptNumber: 1 } }
    ).toArray()
  );
  return attempts[0] || null;
}

test.describe('Seller ranking A/B — price is not a ranking factor; distance is', () => {
  test('default weights: the nearer seller (400m) wins over the farther seller (800m)', async () => {
    const { near, far, nearProductId } = await getRankingAbFixtures();
    const customer = await loginCustomer();

    const orderId = await placeRankingAbOrder(customer.accessToken, nearProductId);

    await expect.poll(async () => Boolean(await getFirstRankedRabSeller(orderId, near, far)), {
      timeout: 20_000, message: 'waiting for the fulfillment engine to record a ranking A/B seller attempt',
    }).toBe(true);

    const attempt = await getFirstRankedRabSeller(orderId, near, far);
    const winnerId = String(attempt.sellerId || '');
    expect(
      winnerId,
      `expected the engine to rank and offer the 400m seller (${near._id}) first, ahead of the 800m seller (${far._id}), under default weights — distance is weighted 0.3, the largest single factor. Actual first attempt: ${JSON.stringify(attempt)}`
    ).toBe(String(near._id));
    expect(attempt.rankBreakdown?.distance?.weight).toBeCloseTo(0.3, 2);

    test.info().annotations.push({
      type: 'step',
      description: `Default weights: 400m seller ranked and offered first (rankScore=${attempt.rankScore}, distance contribution=${attempt.rankBreakdown.distance.contribution}), confirmed via fulfillment_attempts.`,
    });
  });

  test('re-weighted config: boosting the farther seller\'s adminBoost while zeroing distance flips the winner', async () => {
    const { near, far, nearProductId } = await getRankingAbFixtures();
    const customer = await loginCustomer();
    const adminToken = (await loginAdmin()).accessToken;

    const before = await withDb((db) => db.collection('platform_settings').findOne({ key: 'sellerRankingWeights' }));

    try {
      // Real Admin config change: distance weight set to 0 (redistributed
      // across the remaining five factors, per normalizeWeights), and the
      // 800m seller is given a maximal admin boost — the only lever besides
      // distance that can plausibly favour it, since stock, prep time, and
      // workload are identical between the two fixture sellers by design.
      const reweight = await api('/admin/fulfillment/settings', {
        method: 'PUT',
        token: adminToken,
        body: {
          sellerRankingWeights: {
            distance: 0,
            routeEta: 0.1,
            preparation: 0.1,
            workload: 0.1,
            availability: 0.1,
            adminBoost: 0.6,
          },
        },
      });
      expect(reweight.ok, `failed to update ranking weights: ${JSON.stringify(reweight.json)}`).toBe(true);

      const boost = await withDb((db) =>
        db.collection('sellers').updateOne({ _id: far._id }, { $set: { rankingBoost: 1 } })
      );
      expect(boost.modifiedCount).toBe(1);
      await withDb((db) => db.collection('sellers').updateOne({ _id: near._id }, { $set: { rankingBoost: 0 } }));

      const orderId = await placeRankingAbOrder(customer.accessToken, nearProductId);

      await expect.poll(async () => Boolean(await getFirstRankedRabSeller(orderId, near, far)), {
        timeout: 20_000, message: 'waiting for the fulfillment engine to record a ranking A/B seller attempt',
      }).toBe(true);

      const attempt = await getFirstRankedRabSeller(orderId, near, far);
      const winnerId = String(attempt.sellerId || '');

      expect(
        winnerId,
        `expected the 800m seller (${far._id}, rankingBoost=1) to be ranked and offered first after distance weight was zeroed and adminBoost weighted 0.6. Actual first attempt: ${JSON.stringify(attempt)}`
      ).toBe(String(far._id));
      expect(attempt.rankBreakdown?.distance?.weight).toBe(0);
      expect(attempt.rankBreakdown?.adminBoost?.contribution).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'step',
        description: `Re-weighted config (distance=0, adminBoost=0.6, far seller rankingBoost=1): winner flipped to the 800m seller (rankScore=${attempt.rankScore}).`,
      });
    } finally {
      // Always restore, pass or fail — both the global weights and the
      // per-seller boost fields this test mutated.
      await withDb((db) => db.collection('sellers').updateOne({ _id: far._id }, { $set: { rankingBoost: 0 } }));
      await withDb((db) => db.collection('sellers').updateOne({ _id: near._id }, { $set: { rankingBoost: 0 } }));
      if (before?.value) {
        const restore = await api('/admin/fulfillment/settings', {
          method: 'PUT', token: adminToken, body: { sellerRankingWeights: before.value },
        });
        expect(restore.ok, `failed to restore sellerRankingWeights: ${JSON.stringify(restore.json)}`).toBe(true);
      }
    }
  });
});

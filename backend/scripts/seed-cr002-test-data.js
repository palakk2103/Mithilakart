/**
 * CR-002 — E2E test fixtures (STAGING ONLY).
 *
 * Creates three sellers, one warehouse, and a shared-catalogKey product for
 * each, so the seller -> seller -> warehouse -> courier fallback chain can be
 * exercised through the real UI.
 *
 * Deliberately separate from migrate-cr002.js: this WRITES TEST DATA and must
 * never run against production. Everything it creates is namespaced with the
 * CR002TEST prefix and can be removed with --cleanup.
 *
 * Usage:
 *   node scripts/seed-cr002-test-data.js --dry-run
 *   node scripts/seed-cr002-test-data.js
 *   node scripts/seed-cr002-test-data.js --cleanup
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Seller = require('../src/models/Seller');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const MarketplaceListing = require('../src/models/MarketplaceListing');

const DRY_RUN = process.argv.includes('--dry-run');
const CLEANUP = process.argv.includes('--cleanup');

const PREFIX = 'CR002TEST';
const CATALOG_KEY = 'CR002TEST-ATTA-5KG';
const TAB = 'quick_shop';

// Customer test address sits at Connaught Place, Delhi.
const ORIGIN = { lat: 28.6139, lng: 77.2090 };

/** Stock levels chosen to walk the whole fallback ladder in order. */
const ACTORS = [
  { key: 'A', name: 'Seller A (nearest, empty)', stock: 0, isWarehouse: false, lat: 28.6145, lng: 77.2095 },
  { key: 'B', name: 'Seller B', stock: 5, isWarehouse: false, lat: 28.6200, lng: 77.2150 },
  { key: 'C', name: 'Seller C', stock: 5, isWarehouse: false, lat: 28.6300, lng: 77.2250 },
  { key: 'W', name: 'Warehouse W', stock: 5, isWarehouse: true, lat: 28.7041, lng: 77.1025 },
];

/**
 * Production readiness Pass 3 (2026-08-25) — courier-fallback fixture.
 *
 * The ACTORS ladder above always has stock somewhere (B/C/W), so it is the
 * wrong fixture for "prove courier fallback actually happens": a test using
 * it depends on incidental data state, not a deterministic guarantee.
 *
 * IMPORTANT — why these have real stock, not stock=0:
 * OrderService._buildCartFromItems() checks the ORIGIN product's own stock
 * as a placement-time gate, entirely independent of the CR-002 fulfillment
 * engine's seller-selection logic (confirmed live: stock=0 on the origin
 * product made every order placement itself fail with 409 before the engine
 * ever ran). A genuine "all sellers unavailable" premise therefore needs the
 * origin product to have real stock (so the order can be placed at all), but
 * every candidate seller — via `isAcceptingOrders: false`, which
 * SellerEligibilityService genuinely checks (FAIL.SELLER_NOT_ACCEPTING) —
 * to be ineligible for the fulfillment engine's OWN selection. This mirrors
 * a real operational scenario: a seller who paused taking orders without
 * also zeroing their stock.
 */
const COURIER_CATALOG_KEY = 'CR002TEST-COURIER-ONLY-SKU';
const COURIER_ACTORS = [
  { key: 'CO-A', name: 'Courier-fallback Seller A (paused)', stock: 5, isWarehouse: false, isAcceptingOrders: false, lat: 28.6145, lng: 77.2095 },
  { key: 'CO-B', name: 'Courier-fallback Seller B (paused)', stock: 5, isWarehouse: false, isAcceptingOrders: false, lat: 28.6200, lng: 77.2150 },
  { key: 'CO-C', name: 'Courier-fallback Seller C (paused)', stock: 5, isWarehouse: false, isAcceptingOrders: false, lat: 28.6300, lng: 77.2250 },
  { key: 'CO-W', name: 'Courier-fallback Warehouse (paused)', stock: 5, isWarehouse: true, isAcceptingOrders: false, lat: 28.7041, lng: 77.1025 },
];

/**
 * Production readiness Pass 3 (2026-08-25) — price+distance ranking A/B
 * fixture (item 5 of the final blocker-closure pass).
 *
 * IMPORTANT — there is no "price" ranking factor. SellerRankingService.js
 * scores six factors (distance, routeEta, preparation, workload,
 * availability, adminBoost); price/unitPrice is never read by ranking or
 * eligibility anywhere in the codebase. This fixture is a genuine
 * distance-only A/B: two otherwise-identical sellers (same stock, same
 * prep time, workload 0, no admin boost) at deliberately different
 * distances, so the only variable ranking can respond to is distanceKm.
 *
 * Anchored at the harness's real default customer address (Boring Road,
 * Patna — frontend/e2e/helpers/harness.js FIXTURES.addressId), NOT the
 * Delhi ORIGIN used by the courier-fallback ladder above: those sellers are
 * deliberately isAcceptingOrders:false so their real distance from the
 * customer never matters. This fixture needs the sellers to actually be
 * found nearby and eligible, which requires sitting within
 * sellerSearchRadiusKm of an address that genuinely has a customer fixture.
 * RAB-NEAR sits ~400m away, RAB-FAR ~800m (1 degree of latitude is ~111km,
 * so 0.0036 deg ~= 400m, 0.0072 deg ~= 800m).
 */
const RANKING_AB_ORIGIN = { lat: 25.5941, lng: 85.1376 };
const RANKING_AB_CATALOG_KEY = 'CR002TEST-RANKING-AB-SKU';
const RANKING_AB_ACTORS = [
  { key: 'RAB-NEAR', name: 'Ranking A/B Seller (400m)', stock: 20, isWarehouse: false, lat: RANKING_AB_ORIGIN.lat + 0.0036, lng: RANKING_AB_ORIGIN.lng },
  { key: 'RAB-FAR', name: 'Ranking A/B Seller (800m)', stock: 20, isWarehouse: false, lat: RANKING_AB_ORIGIN.lat + 0.0072, lng: RANKING_AB_ORIGIN.lng },
];

function assertSafeTarget(uri) {
  const dbName = (uri.split('/').pop() || '').split('?')[0].toLowerCase();
  if (dbName.includes('prod')) {
    throw new Error(`Refusing to seed test data into database "${dbName}"`);
  }
}

async function cleanup() {
  const sellers = await Seller.find({ email: new RegExp(`^${PREFIX}`) }).lean();
  const sellerIds = sellers.map((s) => s._id);

  const products = await Product.find({ sku: new RegExp(`^${PREFIX}`) }).lean();
  const productIds = products.map((p) => p._id);

  if (!DRY_RUN) {
    await MarketplaceListing.deleteMany({ productId: { $in: productIds } });
    await Product.deleteMany({ _id: { $in: productIds } });
    await Seller.deleteMany({ _id: { $in: sellerIds } });
  }

  return { sellers: sellerIds.length, products: productIds.length };
}

async function seedGroup(actors, catalogKey, titleSuffix, category) {
  const created = [];

  for (const actor of actors) {
    const email = `${PREFIX}-${actor.key}@test.local`.toLowerCase();

    // isAcceptingOrders defaults true unless the actor explicitly overrides
    // it (the courier-fallback group sets isAcceptingOrders: false so the
    // fulfillment engine's own eligibility check excludes them, independent
    // of stock — see COURIER_ACTORS's comment above).
    const isAcceptingOrders = actor.isAcceptingOrders !== undefined ? actor.isAcceptingOrders : true;

    let seller = await Seller.findOne({ email });
    if (!seller && !DRY_RUN) {
      seller = await Seller.create({
        name: actor.name,
        email,
        // Placeholder hash — these accounts are for fulfillment routing, not login.
        passwordHash: 'CR002TEST-NOT-A-REAL-LOGIN',
        storeName: actor.name,
        status: 'active',
        kycStatus: 'approved',
        isAcceptingOrders,
        isWarehouse: actor.isWarehouse,
        quickCommerceEligible: true,
        groceryEligible: true,
        latitude: actor.lat,
        longitude: actor.lng,
        location: { type: 'Point', coordinates: [actor.lng, actor.lat] },
        city: 'Delhi',
        pincode: '110001',
      });
    } else if (seller && !DRY_RUN) {
      // Re-running the seed must correct a previously-seeded seller's flags
      // AND location too — not just leave stale ones from an earlier
      // fixture design (confirmed live: the ranking A/B fixture's location
      // was silently left at its original Delhi coordinates across two
      // re-seeds until this branch also updated latitude/longitude).
      await Seller.updateOne(
        { _id: seller._id },
        {
          $set: {
            isAcceptingOrders,
            latitude: actor.lat,
            longitude: actor.lng,
            location: { type: 'Point', coordinates: [actor.lng, actor.lat] },
          },
        }
      );
    }

    if (DRY_RUN) {
      created.push({ actor: actor.key, seller: email, stock: actor.stock, action: 'would create' });
      continue;
    }

    const sku = `${PREFIX}-${actor.key}-ATTA`;
    let product = await Product.findOne({ sku, sellerId: seller._id });

    if (!product) {
      product = await Product.create({
        sellerId: seller._id,
        title: `CR002TEST Aashirvaad Atta 5kg${titleSuffix}`,
        sku,
        price: 250,
        mrp: 300,
        stock: actor.stock,
        reservedStock: 0,
        categoryId: category._id,
        status: 'approved',
        masterStatus: 'approved',
        // The join key that makes these substitutable for one another.
        catalogKey,
        commerceFlows: ['quick_shop'],
      });
    } else {
      await Product.updateOne(
        { _id: product._id },
        { $set: { stock: actor.stock, reservedStock: 0, catalogKey, status: 'approved' } }
      );
    }

    // Without an approved+visible listing the seller is skipped entirely.
    await MarketplaceListing.updateOne(
      { productId: product._id, marketplaceTab: TAB },
      {
        $set: {
          productId: product._id,
          sellerId: seller._id,
          marketplaceTab: TAB,
          price: 250,
          mrp: 300,
          listingStatus: 'approved',
          isVisible: true,
          deliveryType: 'fixed_promise',
          deliveryPromiseMinutes: 20,
        },
      },
      { upsert: true }
    );

    created.push({
      actor: actor.key,
      sellerId: String(seller._id),
      productId: String(product._id),
      stock: actor.stock,
      isWarehouse: actor.isWarehouse,
    });
  }

  return created;
}

async function seed() {
  // Reuse any category — the fallback chain does not depend on which.
  let category = await Category.findOne({ deletedAt: null }).lean();
  if (!category) {
    if (DRY_RUN) return { note: 'no category found; would create one' };
    category = await Category.create({ name: `${PREFIX} Category`, slug: `${PREFIX.toLowerCase()}-category` });
  }

  const ladder = await seedGroup(ACTORS, CATALOG_KEY, '', category);
  const courierOnly = await seedGroup(COURIER_ACTORS, COURIER_CATALOG_KEY, ' (Courier-Fallback Fixture)', category);
  const rankingAB = await seedGroup(RANKING_AB_ACTORS, RANKING_AB_CATALOG_KEY, ' (Ranking A/B Fixture)', category);

  return {
    ladder: { created: ladder, catalogKey: CATALOG_KEY },
    courierOnly: { created: courierOnly, catalogKey: COURIER_CATALOG_KEY },
    rankingAB: { created: rankingAB, catalogKey: RANKING_AB_CATALOG_KEY },
    origin: ORIGIN,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mithilakart';
  assertSafeTarget(uri);
  await mongoose.connect(uri);

  if (DRY_RUN) process.stdout.write('DRY RUN — no writes will be performed.\n\n');

  const result = CLEANUP ? await cleanup() : await seed();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (!CLEANUP && !DRY_RUN) {
    process.stdout.write('\nRemember: enable crossSellerSubstitutionEnabled in Admin,\n');
    process.stdout.write('otherwise seller-to-seller fallback will not run.\n');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

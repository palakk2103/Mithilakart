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

async function seed() {
  // Reuse any category — the fallback chain does not depend on which.
  let category = await Category.findOne({ deletedAt: null }).lean();
  if (!category) {
    if (DRY_RUN) return { note: 'no category found; would create one' };
    category = await Category.create({ name: `${PREFIX} Category`, slug: `${PREFIX.toLowerCase()}-category` });
  }

  const created = [];

  for (const actor of ACTORS) {
    const email = `${PREFIX}-${actor.key}@test.local`.toLowerCase();

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
        isAcceptingOrders: true,
        isWarehouse: actor.isWarehouse,
        quickCommerceEligible: true,
        groceryEligible: true,
        latitude: actor.lat,
        longitude: actor.lng,
        location: { type: 'Point', coordinates: [actor.lng, actor.lat] },
        city: 'Delhi',
        pincode: '110001',
      });
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
        title: 'CR002TEST Aashirvaad Atta 5kg',
        sku,
        price: 250,
        mrp: 300,
        stock: actor.stock,
        reservedStock: 0,
        categoryId: category._id,
        status: 'approved',
        masterStatus: 'approved',
        // The join key that makes these substitutable for one another.
        catalogKey: CATALOG_KEY,
        commerceFlows: ['quick_shop'],
      });
    } else {
      await Product.updateOne(
        { _id: product._id },
        { $set: { stock: actor.stock, reservedStock: 0, catalogKey: CATALOG_KEY, status: 'approved' } }
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

  return { created, catalogKey: CATALOG_KEY, origin: ORIGIN };
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

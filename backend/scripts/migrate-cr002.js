/**
 * CR-002 migration: indexes, seller operational defaults, fulfillment settings,
 * historical order fulfillment backfill.
 *
 * Every step is idempotent and individually reversible. No existing field is
 * modified or removed, so rolling back the CODE alone restores prior behaviour
 * even if these fields remain in the database.
 *
 * NOTE: populating products.catalogKey is deliberately NOT done here. Deciding
 * that two sellers' products are the same sellable item is a business/curation
 * decision with real customer-facing consequences (a wrong key means the
 * customer receives a different product). It goes through the admin catalog
 * matching workflow, never a bulk script.
 *
 * Usage: node scripts/migrate-cr002.js [--dry-run]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Seller = require('../src/models/Seller');
const Order = require('../src/models/Order');
const OrderFulfillment = require('../src/models/OrderFulfillment');
const FulfillmentAttempt = require('../src/models/FulfillmentAttempt');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');
const PlatformSetting = require('../src/models/PlatformSetting');
const {
  PLATFORM_SETTING_KEYS,
  DEFAULT_PLATFORM_SETTINGS,
} = require('../src/constants/platformSettings');
const {
  FULFILLMENT_TYPE,
  DELIVERY_MODE,
  FALLBACK_LEVEL,
} = require('../src/constants/fulfillment');
const { isQuickCommerceTab } = require('../src/utils/marketplaceTab');

const DRY_RUN = process.argv.includes('--dry-run');

/** CR-002 settings, seeded ONLY when absent — never overwrites an admin value. */
const CR002_SETTING_KEYS = [
  PLATFORM_SETTING_KEYS.QUICK_FULFILLMENT_SEARCH_TIMEOUT_SECONDS,
  PLATFORM_SETTING_KEYS.SELLER_ACCEPTANCE_TIMEOUT_SECONDS,
  PLATFORM_SETTING_KEYS.DELIVERY_PARTNER_ASSIGNMENT_TIMEOUT_SECONDS,
  PLATFORM_SETTING_KEYS.SELLER_SEARCH_RADIUS_KM,
  PLATFORM_SETTING_KEYS.DEFAULT_PREPARATION_TIME_MINUTES,
  PLATFORM_SETTING_KEYS.DELIVERY_BUFFER_MINUTES,
  PLATFORM_SETTING_KEYS.WAREHOUSE_FALLBACK_ENABLED,
  PLATFORM_SETTING_KEYS.COURIER_FALLBACK_ENABLED,
  PLATFORM_SETTING_KEYS.MAX_SELLER_ATTEMPTS_PER_ORDER,
  PLATFORM_SETTING_KEYS.SELLER_RANKING_WEIGHTS,
  PLATFORM_SETTING_KEYS.FULFILLMENT_SWEEPER_INTERVAL_SECONDS,
  PLATFORM_SETTING_KEYS.DELIVERY_ASSIGNMENT_MODE,
  PLATFORM_SETTING_KEYS.CROSS_SELLER_SUBSTITUTION_ENABLED,
  PLATFORM_SETTING_KEYS.ROUTING_PROVIDER_ENABLED,
  PLATFORM_SETTING_KEYS.ROUTING_FALLBACK_SPEED_KMPH,
];

/** Step 1 — create the new indexes. */
async function createIndexes() {
  if (DRY_RUN) return 'skipped (dry run)';

  await Promise.all([
    Product.syncIndexes(),
    Seller.syncIndexes(),
    Order.syncIndexes(),
    DeliveryAssignment.syncIndexes(),
    OrderFulfillment.syncIndexes(),
    FulfillmentAttempt.syncIndexes(),
  ]);

  return 'created';
}

/** Steps 2 + 3 — seller operational defaults. */
async function backfillSellerDefaults() {
  const acceptingFilter = { isAcceptingOrders: { $exists: false } };
  const warehouseFilter = { isWarehouse: { $exists: false } };

  const [acceptingCount, warehouseCount] = await Promise.all([
    Seller.countDocuments(acceptingFilter),
    Seller.countDocuments(warehouseFilter),
  ]);

  if (!DRY_RUN) {
    // Defaults chosen so every pre-CR-002 seller stays exactly as eligible as
    // it is today: accepting orders, and not a warehouse.
    await Seller.updateMany(acceptingFilter, { $set: { isAcceptingOrders: true } });
    await Seller.updateMany(warehouseFilter, { $set: { isWarehouse: false } });
  }

  return { acceptingCount, warehouseCount };
}

/** Step 4 — seed settings only where absent. */
async function seedFulfillmentSettings() {
  let created = 0;
  let skipped = 0;

  for (const key of CR002_SETTING_KEYS) {
    const existing = await PlatformSetting.findOne({ key, deletedAt: null }).lean();
    if (existing) {
      skipped += 1;
      continue;
    }

    if (!DRY_RUN) {
      await PlatformSetting.create({ key, value: DEFAULT_PLATFORM_SETTINGS[key] });
    }
    created += 1;
  }

  return { created, skipped };
}

/**
 * Step 5 — reconstruct a fulfillment snapshot for historical orders from the
 * legacy fulfilmentType / deliveryType fields. Read-only reconstruction: it
 * derives the new block from what the order already records and never changes
 * an existing value.
 */
async function backfillOrderFulfillment() {
  const filter = {
    $or: [
      { fulfillment: { $exists: false } },
      { 'fulfillment.type': null },
    ],
  };

  const orders = await Order.find(filter)
    .select({
      fulfilmentType: 1,
      marketplaceTab: 1,
      commerceFlow: 1,
      deliveryPromiseMinutes: 1,
      estimatedDeliveryAt: 1,
      sellerSubOrders: 1,
      shipment: 1,
    })
    .lean();

  let updated = 0;

  for (const order of orders) {
    const isCourier = order.fulfilmentType === 'courier';
    const isQuick = !isCourier && isQuickCommerceTab(order.marketplaceTab);

    const fulfillment = {
      type: isCourier ? FULFILLMENT_TYPE.COURIER : FULFILLMENT_TYPE.QUICK_LOCAL,
      source: isCourier ? 'courier' : 'seller',
      sellerId: order.sellerSubOrders?.[0]?.sellerId || null,
      warehouseId: null,
      courierProvider: isCourier ? (order.shipment?.provider || null) : null,
      deliveryMode: isQuick ? DELIVERY_MODE.QUICK : DELIVERY_MODE.STANDARD,
      estimatedDeliveryMinutes: isQuick ? (order.deliveryPromiseMinutes || null) : null,
      estimatedDeliveryAt: order.estimatedDeliveryAt || null,
      fallbackLevel: isCourier ? FALLBACK_LEVEL.COURIER : FALLBACK_LEVEL.PRIMARY_SELLER,
      fallbackReason: null,
      decidedAt: null,
      // Historical orders predate configurable rules; an empty snapshot records
      // that honestly rather than inventing values that were never applied.
      configSnapshot: null,
    };

    if (!DRY_RUN) {
      await Order.updateOne({ _id: order._id }, { $set: { fulfillment } });
    }
    updated += 1;
  }

  return updated;
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mithilakart';
  await mongoose.connect(uri);

  if (DRY_RUN) {
    process.stdout.write('DRY RUN — no writes will be performed.\n\n');
  }

  const indexes = await createIndexes();
  const sellers = await backfillSellerDefaults();
  const settings = await seedFulfillmentSettings();
  const ordersUpdated = await backfillOrderFulfillment();

  process.stdout.write('CR-002 migration complete.\n');
  process.stdout.write(`Indexes: ${indexes}\n`);
  process.stdout.write(`Sellers defaulted — isAcceptingOrders: ${sellers.acceptingCount}, isWarehouse: ${sellers.warehouseCount}\n`);
  process.stdout.write(`Settings seeded: ${settings.created}, already present: ${settings.skipped}\n`);
  process.stdout.write(`Orders backfilled: ${ordersUpdated}\n`);
  process.stdout.write('\ncatalogKey NOT populated — use the admin catalog matching workflow.\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

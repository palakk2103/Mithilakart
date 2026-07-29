/**
 * CR-001 migration: seed marketplace_config, backfill listings + category visibleTabs
 * Usage: node scripts/migrate-cr001.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceConfig = require('../src/models/MarketplaceConfig');
const {
  LEGACY_FLOW_TO_TAB,
  LISTING_STATUS,
  DELIVERY_TYPE,
  MARKETPLACE_TABS,
} = require('../src/constants/marketplace');

const TAB_SEEDS = [
  { tab: MARKETPLACE_TABS.MITHILAKART, displayName: 'Mithilakart', deliveryModel: DELIVERY_TYPE.STANDARD, sellerEligibilityRule: 'all_approved' },
  { tab: MARKETPLACE_TABS.MITHILAK, displayName: 'Mithilak', deliveryModel: DELIVERY_TYPE.STANDARD, sellerEligibilityRule: 'mithilak_approved' },
  { tab: MARKETPLACE_TABS.QUICK_SHOP, displayName: 'Quick Shop', deliveryModel: DELIVERY_TYPE.FIXED_PROMISE, sellerEligibilityRule: 'quick_enabled', allowedPromiseMinutes: [15, 20, 25, 30] },
  { tab: MARKETPLACE_TABS.GROCERIES_FRESH, displayName: 'Groceries & Fresh', deliveryModel: DELIVERY_TYPE.FIXED_PROMISE, sellerEligibilityRule: 'grocery_enabled', allowedPromiseMinutes: [15, 20, 25, 30] },
];

function mapProductStatus(status) {
  if (status === 'approved') return LISTING_STATUS.APPROVED;
  if (status === 'rejected') return LISTING_STATUS.REJECTED;
  return LISTING_STATUS.PENDING;
}

async function seedMarketplaceConfig() {
  for (const seed of TAB_SEEDS) {
    await MarketplaceConfig.updateOne(
      { tab: seed.tab },
      { $set: { ...seed, isActive: true } },
      { upsert: true }
    );
  }
}

async function migrateCategories() {
  const categories = await Category.find({ deletedAt: null });
  let updated = 0;

  for (const category of categories) {
    const visibleTabs = (category.commerceFlows || ['standard'])
      .map((flow) => LEGACY_FLOW_TO_TAB[flow])
      .filter(Boolean);

    if (!category.visibleTabs?.length) {
      category.visibleTabs = visibleTabs.length ? visibleTabs : [MARKETPLACE_TABS.MITHILAKART];
      await category.save();
      updated += 1;
    }
  }

  return updated;
}

async function migrateProductsToListings() {
  const products = await Product.find({ deletedAt: null });
  let created = 0;
  let skipped = 0;

  for (const product of products) {
    if (!product.masterStatus) {
      product.masterStatus = product.status;
      await product.save();
    }

    const flows = product.commerceFlows?.length ? product.commerceFlows : ['standard'];

    for (const flow of flows) {
      const tab = LEGACY_FLOW_TO_TAB[flow];
      if (!tab) continue;

      const exists = await MarketplaceListing.findOne({
        productId: product._id,
        marketplaceTab: tab,
        deletedAt: null,
      });

      if (exists) {
        skipped += 1;
        continue;
      }

      const isQuick = tab === MARKETPLACE_TABS.QUICK_SHOP || tab === MARKETPLACE_TABS.GROCERIES_FRESH;
      const listingStatus = mapProductStatus(product.status);
      const isApproved = listingStatus === LISTING_STATUS.APPROVED;

      await MarketplaceListing.create({
        productId: product._id,
        sellerId: product.sellerId,
        marketplaceTab: tab,
        price: product.price,
        mrp: product.mrp,
        listingStatus,
        isVisible: isApproved,
        deliveryType: isQuick ? DELIVERY_TYPE.FIXED_PROMISE : DELIVERY_TYPE.STANDARD,
        deliveryPromiseMinutes: isQuick ? 30 : null,
        publishedAt: product.createdAt,
        approvedAt: isApproved ? new Date() : null,
      });
      created += 1;
    }
  }

  return { created, skipped };
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mithilakart';
  await mongoose.connect(uri);

  await seedMarketplaceConfig();
  const categoriesUpdated = await migrateCategories();
  const listingStats = await migrateProductsToListings();

  process.stdout.write(`CR-001 migration complete.\n`);
  process.stdout.write(`Categories updated: ${categoriesUpdated}\n`);
  process.stdout.write(`Listings created: ${listingStats.created}, skipped: ${listingStats.skipped}\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

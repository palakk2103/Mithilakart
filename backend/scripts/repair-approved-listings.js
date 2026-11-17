/**
 * One-off repair: products an admin approved BEFORE approve() started syncing
 * listings still have pending/invisible marketplace listings, so they never
 * show on the storefront (e.g. a product added to a category "but not seen").
 *
 * Also creates the missing listing for approved products whose commerceFlows
 * name a tab that has no listing yet.
 *
 * Usage:  node scripts/repair-approved-listings.js            (dry run)
 *         node scripts/repair-approved-listings.js --apply    (writes)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const {
  LEGACY_FLOW_TO_TAB,
  LISTING_STATUS,
  DELIVERY_TYPE,
  MARKETPLACE_TABS,
} = require('../src/constants/marketplace');

const APPLY = process.argv.includes('--apply');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const products = await Product.find({ status: 'approved', deletedAt: null }).lean();
  const now = new Date();
  let fixed = 0;
  let created = 0;

  for (const product of products) {
    const flows = product.commerceFlows?.length ? product.commerceFlows : ['standard'];
    const tabs = [...new Set(flows.map((f) => LEGACY_FLOW_TO_TAB[f] || f).filter(Boolean))];

    for (const tab of tabs) {
      const listing = await MarketplaceListing.findOne({ productId: product._id, marketplaceTab: tab, deletedAt: null });
      const isQuick = tab === MARKETPLACE_TABS.QUICK_SHOP || tab === MARKETPLACE_TABS.GROCERIES_FRESH;

      if (!listing) {
        created += 1;
        console.log(`[create] ${product.title} -> ${tab}`);
        if (APPLY) {
          await MarketplaceListing.create({
            productId: product._id,
            sellerId: product.sellerId,
            marketplaceTab: tab,
            price: product.price,
            mrp: product.mrp || product.price,
            listingStatus: LISTING_STATUS.APPROVED,
            isVisible: true,
            deliveryType: isQuick ? DELIVERY_TYPE.FIXED_PROMISE : DELIVERY_TYPE.STANDARD,
            deliveryPromiseMinutes: isQuick ? 30 : null,
            publishedAt: now,
            approvedAt: now,
          });
        }
        continue;
      }

      const stuck = [LISTING_STATUS.PENDING, LISTING_STATUS.DRAFT].includes(listing.listingStatus) || !listing.isVisible;
      // Admin-rejected/suspended listings are a deliberate decision — leave them.
      const deliberate = [LISTING_STATUS.REJECTED, LISTING_STATUS.SUSPENDED].includes(listing.listingStatus);
      if (stuck && !deliberate) {
        fixed += 1;
        console.log(`[approve] ${product.title} -> ${tab} (was ${listing.listingStatus}, visible=${listing.isVisible})`);
        if (APPLY) {
          await MarketplaceListing.updateOne(
            { _id: listing._id },
            { $set: { listingStatus: LISTING_STATUS.APPROVED, isVisible: true, approvedAt: now, publishedAt: listing.publishedAt || now, rejectedAt: null } }
          );
        }
      }
    }
  }

  console.log(`${APPLY ? 'Applied' : 'Dry run'}: ${fixed} listings approved, ${created} listings created.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

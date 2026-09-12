require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const {
  MARKETPLACE_TABS,
  DELIVERY_TYPE,
  LISTING_STATUS,
  LEGACY_FLOW_TO_TAB,
} = require('../src/constants/marketplace');
const { PRODUCT_STATUS } = require('../src/constants/catalog');

function mapProductStatus(status) {
  switch (status) {
    case PRODUCT_STATUS.APPROVED:
    case 'active':
      return LISTING_STATUS.APPROVED;
    case PRODUCT_STATUS.PENDING:
      return LISTING_STATUS.PENDING;
    case PRODUCT_STATUS.REJECTED:
      return LISTING_STATUS.REJECTED;
    default:
      return LISTING_STATUS.APPROVED;
  }
}

async function sync() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({ deletedAt: null });
  console.log(`Found ${products.length} products`);

  let created = 0;
  let updated = 0;

  for (const product of products) {
    const flows = Array.isArray(product.commerceFlows) && product.commerceFlows.length
      ? product.commerceFlows
      : ['standard'];

    for (const flow of flows) {
      const tab = LEGACY_FLOW_TO_TAB[flow] || flow;
      if (!tab) continue;

      const isQuick = tab === MARKETPLACE_TABS.QUICK_SHOP || tab === MARKETPLACE_TABS.GROCERIES_FRESH;
      const listingStatus = mapProductStatus(product.status);
      const isApproved = listingStatus === LISTING_STATUS.APPROVED;

      const res = await MarketplaceListing.findOneAndUpdate(
        { productId: product._id, marketplaceTab: tab },
        {
          $setOnInsert: {
            productId: product._id,
            sellerId: product.sellerId,
            marketplaceTab: tab,
          },
          $set: {
            price: product.price,
            mrp: product.mrp || product.price,
            listingStatus,
            isVisible: isApproved,
            deliveryType: isQuick ? DELIVERY_TYPE.FIXED_PROMISE : DELIVERY_TYPE.STANDARD,
            deliveryPromiseMinutes: isQuick ? 30 : null,
            publishedAt: product.createdAt || new Date(),
            approvedAt: isApproved ? new Date() : null,
            deletedAt: null,
          }
        },
        { upsert: true, new: true }
      );

      if (res.createdAt?.getTime() === res.updatedAt?.getTime()) {
        created++;
      } else {
        updated++;
      }
    }
  }

  console.log(`Sync complete: ${created} created, ${updated} updated`);
  await mongoose.disconnect();
}

sync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});

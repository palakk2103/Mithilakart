/**
 * seed-multi-tier-sellers.js
 *
 * Seeds comprehensive multi-tier sellers, central warehouse, standard delivery sellers,
 * and delivery partner with shared-catalogKey products for end-to-end cascading testing.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Seller = require('../src/models/Seller');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const PlatformSetting = require('../src/models/PlatformSetting');
const DeliveryPartner = require('../src/models/DeliveryPartner');

const PASSWORD_HASH = bcrypt.hashSync('Password@123', 10);

const SELLER_TIERS = [
  {
    key: 'SELLER-A',
    name: 'Indore Express Mart (Palasia)',
    storeName: 'Indore Express Mart',
    email: 'seller.a@mithilakart.com',
    phone: '9826011111',
    model: 'Quick Commerce (10-30 mins)',
    lat: 22.7240, // ~1.2 km from customer center (22.7175, 75.8719)
    lng: 75.8830,
    addressLine: '14/2 Old Palasia, Main Road',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001',
    preparationMinutes: 8,
    isWarehouse: false,
    rating: 4.8,
  },
  {
    key: 'SELLER-B',
    name: 'Indore Super Store (Vijay Nagar)',
    storeName: 'Indore Super Store',
    email: 'seller.b@mithilakart.com',
    phone: '9826022222',
    model: 'Quick Commerce (10-30 mins)',
    lat: 22.7350, // ~2.5 km
    lng: 75.8890,
    addressLine: 'Scheme No 54, Vijay Nagar Square',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452010',
    preparationMinutes: 10,
    isWarehouse: false,
    rating: 4.6,
  },
  {
    key: 'SELLER-C',
    name: 'Indore Quick Hub (Bhawarkua)',
    storeName: 'Indore Quick Hub',
    email: 'seller.c@mithilakart.com',
    phone: '9826033333',
    model: 'Quick Commerce (10-30 mins)',
    lat: 22.6920, // ~3.5 km
    lng: 75.8670,
    addressLine: 'Bhawarkua Main Road, Near Tower',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452014',
    preparationMinutes: 12,
    isWarehouse: false,
    rating: 4.5,
  },
  {
    key: 'SELLER-D',
    name: 'Indore West Mart (Annapurna)',
    storeName: 'Indore West Mart',
    email: 'seller.d@mithilakart.com',
    phone: '9826044444',
    model: 'Quick Commerce (10-30 mins)',
    lat: 22.6980, // ~4.8 km
    lng: 75.8340,
    addressLine: 'Annapurna Road, Narendra Tiwari Marg',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452009',
    preparationMinutes: 15,
    isWarehouse: false,
    rating: 4.3,
  },
  {
    key: 'WAREHOUSE',
    name: 'Indore Central Warehouse (Dewas Naka)',
    storeName: 'Indore Central Warehouse',
    email: 'warehouse@mithilakart.com',
    phone: '9826055555',
    model: 'Warehouse Hub',
    lat: 22.7850, // ~9.5 km
    lng: 75.9100,
    addressLine: 'Sector A, Dewas Naka Industrial Area',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452010',
    preparationMinutes: 20,
    isWarehouse: true,
    rating: 5.0,
  },
  {
    key: 'STANDARD-SELLER',
    name: 'Mithila Heritage Crafts (Madhubani Hub)',
    storeName: 'Mithila Heritage Crafts',
    email: 'standard.seller@mithilakart.com',
    phone: '9826066666',
    model: 'Standard Delivery (Pan-India Courier)',
    lat: 26.3540, // Madhubani, Bihar (Out of city / Pan India)
    lng: 86.0720,
    addressLine: 'Station Road, Madhubani Art Center',
    city: 'Madhubani',
    state: 'Bihar',
    pincode: '847211',
    preparationMinutes: 60,
    isWarehouse: false,
    rating: 4.9,
  }
];

async function runSeed() {
  console.log('=== SEEDING MULTI-TIER SELLERS & SHARED CATALOG DATA ===\n');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas.\n');

  // 1. Seed or update all 6 sellers
  const sellerMap = {};
  for (const item of SELLER_TIERS) {
    const doc = await Seller.findOneAndUpdate(
      { email: item.email },
      {
        $set: {
          name: item.name,
          storeName: item.storeName,
          email: item.email,
          phone: item.phone,
          passwordHash: PASSWORD_HASH,
          status: 'active',
          kycStatus: 'approved',
          quickCommerceEligible: true,
          groceryEligible: true,
          mithilakEligible: true,
          latitude: item.lat,
          longitude: item.lng,
          fulfillmentRadiusKm: 25,
          isOnline: true,
          isAcceptingOrders: true,
          isWarehouse: item.isWarehouse,
          preparationTimeMinutes: item.preparationMinutes,
          addressLine: item.addressLine,
          city: item.city,
          state: item.state,
          pincode: item.pincode,
          rating: item.rating,
          reviewCount: 42,
          location: {
            type: 'Point',
            coordinates: [item.lng, item.lat],
          },
        }
      },
      { upsert: true, new: true }
    );
    sellerMap[item.key] = doc;
    console.log(`[SELLER SEEDED] ${item.key}: ${doc.name} (${item.model}) - ID: ${doc._id}`);
  }

  // Clean up legacy/orphan product if present
  await Product.deleteOne({ sku: 'SNACK-RATLAMI-SEV-400G' });

  // 2. Ensure 2dsphere index exists on Seller location
  try {
    await Seller.collection.createIndex({ location: '2dsphere' });
    console.log('\n[INDEX] Verified 2dsphere index on Seller.location');
  } catch (err) {
    console.warn('[INDEX] Index creation notice:', err.message);
  }

  // 3. Seed or update Delivery Partner
  const partner = await DeliveryPartner.findOneAndUpdate(
    { phone: '9826099999' },
    {
      $set: {
        name: 'Raju Sharma (Indore Express Rider)',
        phone: '9826099999',
        email: 'rider@mithilakart.com',
        password: PASSWORD_HASH,
        status: 'approved',
        isApproved: true,
        isActive: true,
        isOnline: true,
        vehicleType: 'bike',
        rating: 4.9,
        location: {
          type: 'Point',
          coordinates: [75.8750, 22.7200],
        },
      }
    },
    { upsert: true, new: true }
  );
  console.log(`[DELIVERY PARTNER SEEDED] ${partner.name} (Phone: ${partner.phone}) - ID: ${partner._id}`);

  // 4. Configure PlatformSettings for smooth 5-stage cascading
  const tabs = ['quick_shop', 'groceries_fresh', 'standard', 'mithilak'];
  for (const tab of tabs) {
    await PlatformSetting.findOneAndUpdate(
      { key: `fulfillment_${tab}` },
      {
        $set: {
          key: `fulfillment_${tab}`,
          value: {
            quickCommerceEnabled: true,
            sellerDiscoveryWindowSeconds: 45,
            sellerSearchRadiusKm: 15,
            maxSellerAttempts: 5,
            autoEscalateToWarehouse: true,
            autoEscalateToCourier: true,
            courierProvider: 'shiprocket',
            crossSellerSubstitutionEnabled: true,
          }
        }
      },
      { upsert: true }
    );
  }
  console.log('[PLATFORM SETTINGS] Configured 5-attempt fallback & auto-escalation on all tabs.');

  // 5. Seed Core Categories
  const catSnacks = await Category.findOneAndUpdate(
    { slug: 'quick-snacks' },
    {
      $set: {
        name: 'Quick Snacks & Munchies',
        slug: 'quick-snacks',
        level: 0,
        status: 'active',
        marketplaceTab: 'quick_shop',
        imageUrl: '/assets/categories/snacks.png',
      }
    },
    { upsert: true, new: true }
  );

  const catCrafts = await Category.findOneAndUpdate(
    { slug: 'mithila-handicrafts' },
    {
      $set: {
        name: 'Mithila Handicrafts & Art',
        slug: 'mithila-handicrafts',
        level: 0,
        status: 'active',
        marketplaceTab: 'standard',
        imageUrl: '/assets/categories/art.png',
      }
    },
    { upsert: true, new: true }
  );

  // 6. Seed Shared-CatalogKey Products across all tiers
  const SHARED_SNACK_KEY = 'MULTI-TIER-RATLAMI-SEV-400G';
  const SHARED_CRAFT_KEY = 'MULTI-TIER-MADHUBANI-TREE-OF-LIFE';

  const snackTiers = [
    { key: 'SELLER-A', sku: 'SNACK-RATLAMI-SEV-400G-A', stock: 15, price: 140, tab: 'quick_shop', deliveryType: 'fixed_promise' },
    { key: 'SELLER-B', sku: 'SNACK-RATLAMI-SEV-400G-B', stock: 15, price: 140, tab: 'quick_shop', deliveryType: 'fixed_promise' },
    { key: 'SELLER-C', sku: 'SNACK-RATLAMI-SEV-400G-C', stock: 15, price: 140, tab: 'quick_shop', deliveryType: 'fixed_promise' },
    { key: 'SELLER-D', sku: 'SNACK-RATLAMI-SEV-400G-D', stock: 15, price: 140, tab: 'quick_shop', deliveryType: 'fixed_promise' },
    { key: 'WAREHOUSE', sku: 'SNACK-RATLAMI-SEV-400G-WH', stock: 100, price: 140, tab: 'quick_shop', deliveryType: 'fixed_promise' },
    { key: 'STANDARD-SELLER', sku: 'SNACK-RATLAMI-SEV-400G-STD', stock: 50, price: 140, tab: 'standard', deliveryType: 'standard' },
  ];

  let originSnack = null;

  for (const tier of snackTiers) {
    const sDoc = sellerMap[tier.key];
    const prodDoc = await Product.findOneAndUpdate(
      { sellerId: sDoc._id, sku: tier.sku },
      {
        $set: {
          sellerId: sDoc._id,
          title: `Indore Special Ratlami Sev (400g Pouch) - ${sDoc.storeName}`,
          name: `Indore Special Ratlami Sev (400g Pouch) - ${sDoc.storeName}`,
          sku: tier.sku,
          catalogKey: SHARED_SNACK_KEY,
          price: tier.price,
          mrp: 180,
          stock: tier.stock,
          categoryId: catSnacks._id,
          category: catSnacks.name,
          marketplaceTab: tier.tab,
          commerceFlows: ['quick_shop', 'groceries_fresh', 'standard'],
          status: 'approved',
          masterStatus: 'approved',
          isApproved: true,
          images: [{ url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60', alt: 'Indore Ratlami Sev', sortOrder: 0 }],
          pickupCoordinates: [sDoc.location.coordinates[0], sDoc.location.coordinates[1]],
        }
      },
      { upsert: true, new: true }
    );

    if (tier.key === 'SELLER-A') {
      originSnack = prodDoc;
    }

    await MarketplaceListing.findOneAndUpdate(
      { productId: prodDoc._id, marketplaceTab: tier.tab },
      {
        $set: {
          productId: prodDoc._id,
          sellerId: sDoc._id,
          marketplaceTab: tier.tab,
          price: tier.price,
          mrp: 180,
          listingStatus: 'approved',
          isVisible: true,
          deliveryType: tier.deliveryType,
          deliveryPromiseMinutes: sDoc.preparationMinutes || 15,
          publishedAt: new Date(),
          approvedAt: new Date(),
        }
      },
      { upsert: true }
    );
    console.log(`  └─ Product & Listing seeded: [${tier.key}] ${sDoc.storeName} -> Stock: ${tier.stock}, Price: ₹${tier.price}`);
  }

  // Seed Standard Pan-India Art Product
  const originCraft = await Product.findOneAndUpdate(
    { sku: 'CRAFT-MADHUBANI-TREE-01' },
    {
      $set: {
        title: 'Authentic Madhubani Handpainted Canvas - Tree of Life',
        name: 'Authentic Madhubani Handpainted Canvas - Tree of Life',
        sku: 'CRAFT-MADHUBANI-TREE-01',
        catalogKey: SHARED_CRAFT_KEY,
        price: 1850,
        mrp: 2400,
        stock: 25,
        sellerId: sellerMap['STANDARD-SELLER']._id,
        categoryId: catCrafts._id,
        category: catCrafts.name,
        marketplaceTab: 'standard',
        commerceFlows: ['standard', 'mithilak'],
        status: 'approved',
        masterStatus: 'approved',
        isApproved: true,
        images: [{ url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60', alt: 'Tree of Life', sortOrder: 0 }],
        pickupCoordinates: [sellerMap['STANDARD-SELLER'].location.coordinates[0], sellerMap['STANDARD-SELLER'].location.coordinates[1]],
      }
    },
    { upsert: true, new: true }
  );

  await MarketplaceListing.findOneAndUpdate(
    { productId: originCraft._id, marketplaceTab: 'standard' },
    {
      $set: {
        productId: originCraft._id,
        sellerId: sellerMap['STANDARD-SELLER']._id,
        marketplaceTab: 'standard',
        price: 1850,
        mrp: 2400,
        listingStatus: 'approved',
        isVisible: true,
        deliveryType: 'standard',
        deliveryPromiseMinutes: 1440,
        publishedAt: new Date(),
        approvedAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log(`[PAN-INDIA PRODUCT & LISTING SEEDED] ${originCraft.title} (SKU: ${originCraft.sku})`);

  console.log('\n=== MULTI-TIER SEEDING COMPLETED SUCCESSFULLY! ===');
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

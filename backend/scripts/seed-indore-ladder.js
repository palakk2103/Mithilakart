/**
 * seed-indore-ladder.js
 *
 * Seeds 4 local approved sellers and 1 central warehouse in Indore (matching
 * the user's live browser testing coordinates 22.7175, 75.8719).
 *
 * Also configures platform settings for 5-attempt fallback, enables cross-seller
 * substitution, and seeds products for all 4 marketplace tabs:
 * 1. standard (mithilakart)
 * 2. quick_shop (Quick Shop)
 * 3. fresh_grocery (groceries_fresh)
 * 4. mithilak (Mithilak Special)
 *
 * All passwords set to: 123456
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

const PASSWORD_PLAIN = '123456';
const SHARED_CATALOG_KEY = 'INDORE-ATTA-5KG';

// Indore customer coordinates (live browser testing center)
const INDORE_CENTER = { lat: 22.7175, lng: 75.8719, city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' };

const SELLERS = [
  {
    key: 'SELLER-1',
    name: 'Indore Express Mart (Palasia)',
    email: 'indore.seller1@mithilakart.com',
    storeName: 'Indore Express Mart',
    phone: '9826011111',
    lat: 22.7240, // ~1.2 km from center
    lng: 75.8830,
    addressLine: '14/2 Old Palasia, Main Road',
    pincode: '452001',
    preparationMinutes: 8,
    isWarehouse: false,
    stock: 25,
  },
  {
    key: 'SELLER-2',
    name: 'Indore Super Store (Vijay Nagar)',
    email: 'indore.seller2@mithilakart.com',
    storeName: 'Indore Super Store',
    phone: '9826022222',
    lat: 22.7533, // ~4.5 km from center
    lng: 75.8937,
    addressLine: 'Scheme No 54, Vijay Nagar Square',
    pincode: '452010',
    preparationMinutes: 10,
    isWarehouse: false,
    stock: 25,
  },
  {
    key: 'SELLER-3',
    name: 'Indore Quick Hub (Bhawarkua)',
    email: 'indore.seller3@mithilakart.com',
    storeName: 'Indore Quick Hub',
    phone: '9826033333',
    lat: 22.6920, // ~3.1 km from center
    lng: 75.8670,
    addressLine: 'Bhawarkua Main Road, Near Tower',
    pincode: '452014',
    preparationMinutes: 12,
    isWarehouse: false,
    stock: 25,
  },
  {
    key: 'SELLER-4',
    name: 'Indore West Mart (Annapurna)',
    email: 'indore.seller4@mithilakart.com',
    storeName: 'Indore West Mart',
    phone: '9826044444',
    lat: 22.6980, // ~4.8 km from center
    lng: 75.8340,
    addressLine: 'Annapurna Road, Narendra Tiwari Marg',
    pincode: '452009',
    preparationMinutes: 15,
    isWarehouse: false,
    stock: 25,
  },
  {
    key: 'WAREHOUSE',
    name: 'Indore Central Warehouse (Dewas Naka)',
    email: 'indore.warehouse@mithilakart.com',
    storeName: 'Indore Central Warehouse',
    phone: '9826055555',
    lat: 22.7850, // ~9.5 km from center
    lng: 75.9100,
    addressLine: 'Sector A, Dewas Naka Industrial Area',
    pincode: '452010',
    preparationMinutes: 20,
    isWarehouse: true,
    stock: 200,
  },
];

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected successfully.');

  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 12);

  // 1. Ensure Platform Settings are set for full 5-tier fallback ladder
  console.log('\n--- Updating Platform Settings ---');
  await PlatformSetting.findOneAndUpdate(
    { key: 'crossSellerSubstitutionEnabled' },
    { key: 'crossSellerSubstitutionEnabled', value: true },
    { upsert: true, new: true }
  );
  await PlatformSetting.findOneAndUpdate(
    { key: 'maxSellerAttemptsPerOrder' },
    { key: 'maxSellerAttemptsPerOrder', value: 5 },
    { upsert: true, new: true }
  );
  await PlatformSetting.findOneAndUpdate(
    { key: 'sellerSearchRadiusKm' },
    { key: 'sellerSearchRadiusKm', value: 25 },
    { upsert: true, new: true }
  );
  await PlatformSetting.findOneAndUpdate(
    { key: 'warehouseFallbackEnabled' },
    { key: 'warehouseFallbackEnabled', value: true },
    { upsert: true, new: true }
  );
  await PlatformSetting.findOneAndUpdate(
    { key: 'courierFallbackEnabled' },
    { key: 'courierFallbackEnabled', value: true },
    { upsert: true, new: true }
  );
  console.log('Platform settings updated: crossSellerSubstitution=true, maxSellerAttempts=5, searchRadius=25km');

  // 2. Ensure Categories exist for each of the 4 tabs
  console.log('\n--- Ensuring Categories for All 4 Tabs ---');
  const categoryDefs = [
    {
      name: 'Electronics & Gadgets',
      slug: 'indore-electronics',
      commerceFlows: ['standard'],
      visibleTabs: ['mithilakart'],
    },
    {
      name: 'Quick Snacks & Munchies',
      slug: 'indore-quick-snacks',
      commerceFlows: ['quick_shop', 'standard'],
      visibleTabs: ['quick_shop', 'mithilakart'],
    },
    {
      name: 'Atta, Flours & Grains',
      slug: 'indore-atta-grains',
      commerceFlows: ['fresh_grocery', 'quick_shop', 'standard'],
      visibleTabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
    },
    {
      name: 'Mithila Heritage & Crafts',
      slug: 'indore-mithila-crafts',
      commerceFlows: ['mithilak', 'standard'],
      visibleTabs: ['mithilak', 'mithilakart'],
    },
  ];

  const categoryMap = {};
  for (const catDef of categoryDefs) {
    let cat = await Category.findOne({ slug: catDef.slug });
    if (!cat) {
      cat = await Category.create({
        ...catDef,
        description: `${catDef.name} for Mithilakart marketplace`,
        isActive: true,
      });
      console.log(`Created category: ${cat.name} (${cat.slug})`);
    } else {
      cat.commerceFlows = catDef.commerceFlows;
      cat.visibleTabs = catDef.visibleTabs;
      cat.isActive = true;
      await cat.save();
      console.log(`Updated category: ${cat.name} (${cat.slug})`);
    }
    categoryMap[catDef.slug] = cat;
  }

  // 3. Upsert Indore Sellers & Warehouse
  console.log('\n--- Upserting Indore Sellers & Central Warehouse ---');
  const sellerDocMap = {};
  for (const s of SELLERS) {
    let seller = await Seller.findOne({ email: s.email });
    const sellerData = {
      name: s.name,
      email: s.email,
      passwordHash,
      storeName: s.storeName,
      phone: s.phone,
      countryCode: '+91',
      status: 'active',
      kycStatus: 'approved',
      failedLoginAttempts: 0,
      lockUntil: null,
      isWarehouse: s.isWarehouse,
      isAcceptingOrders: true,
      preparationTimeMinutes: s.preparationMinutes,
      fulfillmentRadiusKm: 25,
      quickCommerceEligible: true,
      groceryEligible: true,
      mithilakEligible: true,
      addressLine: s.addressLine,
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: s.pincode,
      latitude: s.lat,
      longitude: s.lng,
      location: {
        type: 'Point',
        coordinates: [s.lng, s.lat],
      },
    };

    if (!seller) {
      seller = await Seller.create(sellerData);
      console.log(`Created Seller: ${s.name} (${s.email})`);
    } else {
      Object.assign(seller, sellerData);
      await seller.save();
      console.log(`Updated Seller: ${s.name} (${s.email})`);
    }
    sellerDocMap[s.key] = seller;
  }

  // 4. Ensure an Indore Delivery Partner exists
  console.log('\n--- Ensuring Delivery Partner in Indore ---');
  let partner = await DeliveryPartner.findOne({ phone: '9123456789' });
  if (!partner) {
    partner = await DeliveryPartner.create({
      name: 'Raju Sharma (Indore Express Delivery)',
      phone: '9123456789',
      countryCode: '+91',
      status: 'approved',
      isOnline: true,
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [INDORE_CENTER.lng, INDORE_CENTER.lat],
      },
      latitude: INDORE_CENTER.lat,
      longitude: INDORE_CENTER.lng,
    });
    console.log('Created Delivery Partner Raju Sharma');
  } else {
    partner.status = 'approved';
    partner.isOnline = true;
    partner.isAvailable = true;
    partner.latitude = INDORE_CENTER.lat;
    partner.longitude = INDORE_CENTER.lng;
    partner.currentLocation = { type: 'Point', coordinates: [INDORE_CENTER.lng, INDORE_CENTER.lat] };
    await partner.save();
    console.log('Updated Delivery Partner Raju Sharma (online & ready)');
  }

  // 5. Create the Multi-Seller Shared Product (Fortune Atta 5kg) for Ladder Routing
  console.log('\n--- Seeding Multi-Seller Shared Product (INDORE-ATTA-5KG) ---');
  const attaCategory = categoryMap['indore-atta-grains'];

  for (const s of SELLERS) {
    const seller = sellerDocMap[s.key];
    const sku = `INDORE-ATTA-5KG-${s.key}`;

    let product = await Product.findOne({ sellerId: seller._id, sku });
    const productPayload = {
      sellerId: seller._id,
      title: 'Fortune Chakki Fresh Atta 5kg',
      description: '100% pure whole wheat flour processed with traditional stone chakki grinding.',
      sku,
      price: 215,
      mrp: 260,
      stock: s.stock,
      reservedStock: 0,
      categoryId: attaCategory._id,
      status: 'approved',
      masterStatus: 'approved',
      catalogKey: SHARED_CATALOG_KEY,
      commerceFlows: ['quick_shop', 'fresh_grocery', 'standard'],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop',
          alt: 'Fortune Chakki Fresh Atta 5kg',
          sortOrder: 0,
        },
      ],
      brand: 'Fortune',
      tags: ['atta', 'flour', 'chakki fresh', 'grocery', 'quick delivery'],
      deletedAt: null,
    };

    if (!product) {
      product = await Product.create(productPayload);
      console.log(`Created product for ${s.name}: ${sku} (Stock: ${s.stock})`);
    } else {
      Object.assign(product, productPayload);
      await product.save();
      console.log(`Updated product for ${s.name}: ${sku} (Stock: ${s.stock})`);
    }

    // Ensure MarketplaceListing for quick_shop & groceries_fresh & mithilakart
    for (const tab of ['quick_shop', 'groceries_fresh', 'mithilakart']) {
      let listing = await MarketplaceListing.findOne({ productId: product._id, marketplaceTab: tab });
      const isQuick = tab === 'quick_shop' || tab === 'groceries_fresh';
      const listingData = {
        productId: product._id,
        sellerId: seller._id,
        marketplaceTab: tab,
        price: 215,
        mrp: 260,
        maxOrderQuantity: 10,
        listingStatus: 'approved',
        isVisible: true,
        deliveryType: isQuick ? 'fixed_promise' : 'standard',
        deliveryPromiseMinutes: tab === 'quick_shop' ? 20 : tab === 'groceries_fresh' ? 25 : null,
        publishedAt: new Date(),
        approvedAt: new Date(),
      };
      if (!listing) {
        await MarketplaceListing.create(listingData);
      } else {
        Object.assign(listing, listingData);
        await listing.save();
      }
    }
  }

  // 6. Create showcase products for the other tabs
  console.log('\n--- Seeding Tab Showcase Products ---');
  const seller1 = sellerDocMap['SELLER-1'];

  const showcaseProducts = [
    {
      sku: 'INDORE-HEADPHONE-001',
      title: 'boAt Rockerz 450 Bluetooth On-Ear Headphones',
      description: 'Up to 15 hours battery backup, 40mm dynamic drivers, padded ear cushions.',
      price: 1299,
      mrp: 2999,
      stock: 40,
      categoryId: categoryMap['indore-electronics']._id,
      commerceFlows: ['standard'],
      tab: 'mithilakart',
      brand: 'boAt',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop',
    },
    {
      sku: 'INDORE-SNACK-001',
      title: 'Cadbury Dairy Milk Silk Chocolate Bar 150g',
      description: 'Rich, smooth and creamy chocolate made with the goodness of milk.',
      price: 175,
      mrp: 195,
      stock: 50,
      categoryId: categoryMap['indore-quick-snacks']._id,
      commerceFlows: ['quick_shop'],
      tab: 'quick_shop',
      brand: 'Cadbury',
      image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=600&auto=format&fit=crop',
    },
    {
      sku: 'INDORE-ART-001',
      title: 'Authentic Madhubani Handpainted Tree of Life Canvas',
      description: 'Handmade traditional painting using natural dyes on handmade paper.',
      price: 2499,
      mrp: 3500,
      stock: 15,
      categoryId: categoryMap['indore-mithila-crafts']._id,
      commerceFlows: ['mithilak'],
      tab: 'mithilak',
      brand: 'MithilaCraft',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop',
    },
  ];

  for (const sp of showcaseProducts) {
    let p = await Product.findOne({ sellerId: seller1._id, sku: sp.sku });
    const payload = {
      sellerId: seller1._id,
      title: sp.title,
      description: sp.description,
      sku: sp.sku,
      price: sp.price,
      mrp: sp.mrp,
      stock: sp.stock,
      reservedStock: 0,
      categoryId: sp.categoryId,
      status: 'approved',
      masterStatus: 'approved',
      commerceFlows: sp.commerceFlows,
      images: [{ url: sp.image, alt: sp.title, sortOrder: 0 }],
      brand: sp.brand,
      tags: [sp.brand, 'indore', ...sp.commerceFlows],
      deletedAt: null,
    };
    if (!p) {
      p = await Product.create(payload);
      console.log(`Created showcase product: ${sp.title} (${sp.sku})`);
    } else {
      Object.assign(p, payload);
      await p.save();
      console.log(`Updated showcase product: ${sp.title} (${sp.sku})`);
    }

    let listing = await MarketplaceListing.findOne({ productId: p._id, marketplaceTab: sp.tab });
    const isQuick = sp.tab === 'quick_shop' || sp.tab === 'groceries_fresh';
    const lData = {
      productId: p._id,
      sellerId: seller1._id,
      marketplaceTab: sp.tab,
      price: sp.price,
      mrp: sp.mrp,
      maxOrderQuantity: 10,
      listingStatus: 'approved',
      isVisible: true,
      deliveryType: isQuick ? 'fixed_promise' : 'standard',
      deliveryPromiseMinutes: sp.tab === 'quick_shop' ? 20 : null,
      publishedAt: new Date(),
      approvedAt: new Date(),
    };
    if (!listing) {
      await MarketplaceListing.create(lData);
    } else {
      Object.assign(listing, lData);
      await listing.save();
    }
  }

  console.log('\n=== INDORE SEEDING COMPLETE ===');
  console.log('Indore Sellers Ready:');
  SELLERS.forEach((s) => {
    console.log(`- ${s.name} | ${s.email} | Pass: 123456 | Dist: ~${s.lat === 22.724 ? '1.2km' : s.lat === 22.7533 ? '4.5km' : s.lat === 22.692 ? '3.0km' : s.lat === 22.698 ? '4.8km' : '9.5km'}`);
  });

  await mongoose.disconnect();
  console.log('Database disconnected cleanly.');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

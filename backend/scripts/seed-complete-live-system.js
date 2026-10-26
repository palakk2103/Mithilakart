/**
 * seed-complete-live-system.js
 *
 * Comprehensive Master Seed Script for Mithilakart
 * 1. Synchronizes all target user accounts & passwords (Admin, Sellers, Riders, Customer)
 * 2. Positions sellers, warehouse, and riders in Mahipalpur Delhi for the client's test address
 * 3. Seeds the exact client address as the default address for customer 9827607086
 * 4. Seeds rich categories and subcategories across all 4 tabs (Mithilakart, Quick Shop, Groceries & Fresh, Mithilak)
 * 5. Seeds shared-catalogKey products across Seller 1, Seller 2, Warehouse, and Standard Seller for full cascading ladder testing
 * 6. Seeds complete category catalog so no category or tab is empty
 * 7. Creates approved MarketplaceListing records for all tabs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const PASSWORD_12345678 = bcrypt.hashSync('12345678', 10);
const PASSWORD_SELLER12345 = bcrypt.hashSync('Seller@12345', 10);
const PASSWORD_ADMIN12345 = bcrypt.hashSync('Admin@12345', 10);

// Client test coordinates (Rangpuri-Mahipalpur, South West Delhi - 110037)
const CLIENT_LOCATION = {
  addressLine1: 'House-1918, Flat-211/2nd Floor, Khasra-605, Behind Tata Telco, Rangpuri-Mahipalpur',
  city: 'New Delhi',
  state: 'Delhi',
  pincode: '110037',
  lat: 28.5385859,
  lng: 77.1182734,
};

async function main() {
  console.log('===============================================================');
  console.log(' MITHILAKART: COMPLETE LIVE SYSTEM SEED & MULTI-TIER LADDER');
  console.log('===============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas.\n');

  const db = mongoose.connection.db;

  // 1. ADMIN USER
  await db.collection('admin_users').findOneAndUpdate(
    { email: 'vazahat@mithilakart.com' },
    {
      $set: {
        name: 'Vazahat Qureshi',
        email: 'vazahat@mithilakart.com',
        passwordHash: PASSWORD_ADMIN12345,
        role: 'super_admin',
        status: 'active',
        deletedAt: null,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
  console.log('[OK] Admin seeded: vazahat@mithilakart.com / Admin@12345');

  // 2. SELLERS SETUP (Multi-tier ladder for Delhi test address)
  const sellersData = [
    {
      key: 'SELLER-1-PRIMARY',
      email: 'vazahat.seller@mithilakart.com',
      passwordHash: PASSWORD_12345678,
      name: 'Vazahat Qureshi',
      storeName: 'Vazahat Store',
      phone: '8770620342',
      addressLine: 'Shop 12, Behind Tata Telco, Mahipalpur Main Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110037',
      lat: 28.5395, // ~400 meters from client location
      lng: 77.1210,
      radiusKm: 25,
      isWarehouse: false,
      preparationMinutes: 5,
      rating: 4.9,
    },
    {
      key: 'SELLER-2-SECONDARY',
      email: 'vazahat@mithilakart.com',
      passwordHash: PASSWORD_SELLER12345,
      name: 'Vazahat Qureshi',
      storeName: 'Mithila Heritage Store',
      phone: '9876543210',
      addressLine: 'Sector C Pocket 8, Vasant Kunj / Aerocity',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110070',
      lat: 28.5320, // ~2.5 km from client location
      lng: 77.1400,
      radiusKm: 25,
      isWarehouse: false,
      preparationMinutes: 8,
      rating: 4.8,
    },
    {
      key: 'SELLER-3-WAREHOUSE',
      email: 'warehouse@mithilakart.com',
      passwordHash: PASSWORD_SELLER12345,
      name: 'MK Central Warehouse',
      storeName: 'Mithilakart Central Warehouse',
      phone: '9800000001',
      addressLine: 'Sector 8 Industrial Hub, Dwarka / Mahipalpur Highway',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110077',
      lat: 28.5700, // ~6.5 km from client location
      lng: 77.0700,
      radiusKm: 50,
      isWarehouse: true,
      preparationMinutes: 15,
      rating: 5.0,
    },
    {
      key: 'SELLER-4-STANDARD',
      email: 'standard.seller@mithilakart.com',
      passwordHash: PASSWORD_SELLER12345,
      name: 'Mithila Heritage Crafts (Madhubani Hub)',
      storeName: 'Mithila Heritage Crafts',
      phone: '9826066666',
      addressLine: 'Station Road, Madhubani Art Center',
      city: 'Madhubani',
      state: 'Bihar',
      pincode: '847211',
      lat: 26.3540,
      lng: 86.0720,
      radiusKm: 25,
      isWarehouse: false,
      preparationMinutes: 60,
      rating: 4.9,
    },
  ];

  const sellerDocs = {};
  for (const s of sellersData) {
    const doc = await db.collection('sellers').findOneAndUpdate(
      { email: s.email },
      {
        $set: {
          name: s.name,
          storeName: s.storeName,
          email: s.email,
          phone: s.phone,
          passwordHash: s.passwordHash,
          status: 'active',
          kycStatus: 'approved',
          quickCommerceEligible: true,
          groceryEligible: true,
          mithilakEligible: true,
          latitude: s.lat,
          longitude: s.lng,
          fulfillmentRadiusKm: s.radiusKm,
          isOnline: true,
          isAcceptingOrders: true,
          isWarehouse: s.isWarehouse,
          preparationTimeMinutes: s.preparationMinutes,
          addressLine: s.addressLine,
          city: s.city,
          state: s.state,
          pincode: s.pincode,
          rating: s.rating,
          reviewCount: 48,
          location: {
            type: 'Point',
            coordinates: [s.lng, s.lat],
          },
          deletedAt: null,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' }
    );
    sellerDocs[s.key] = doc;
    console.log(`[OK] Seller seeded: ${s.storeName} (${s.email}) at [${s.lng}, ${s.lat}]`);
  }

  // Ensure 2dsphere index on sellers
  try {
    await db.collection('sellers').createIndex({ location: '2dsphere' });
    console.log('[OK] 2dsphere index verified on sellers.location');
  } catch (err) {
    console.warn('[NOTICE] sellers index:', err.message);
  }

  // 3. RIDERS SETUP
  const ridersData = [
    {
      name: 'Vazahat Qureshi',
      phone: '9827607086',
      lat: 28.5385859,
      lng: 77.1182734,
      addressLine: 'Mahipalpur Main Chowk, South West Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110037',
    },
    {
      name: 'Rahul Kumar',
      phone: '9123456789',
      lat: 28.5410,
      lng: 77.1250,
      addressLine: 'Aerocity Metro Station, Mahipalpur',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110037',
    },
  ];

  for (const r of ridersData) {
    await db.collection('delivery_partners').findOneAndUpdate(
      { phone: r.phone },
      {
        $set: {
          name: r.name,
          phone: r.phone,
          countryCode: '+91',
          vehicleType: 'bike',
          status: 'approved',
          isOnline: true,
          latitude: r.lat,
          longitude: r.lng,
          addressLine: r.addressLine,
          city: r.city,
          state: r.state,
          pincode: r.pincode,
          location: {
            type: 'Point',
            coordinates: [r.lng, r.lat],
          },
          lastLocationAt: new Date(),
          deletedAt: null,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`[OK] Rider seeded: ${r.name} (${r.phone}) in Delhi`);
  }

  // Ensure 2dsphere index on delivery_partners
  try {
    await db.collection('delivery_partners').createIndex({ location: '2dsphere' });
    console.log('[OK] 2dsphere index verified on delivery_partners.location');
  } catch (err) {
    console.warn('[NOTICE] delivery_partners index:', err.message);
  }

  // 4. CUSTOMER SETUP & DEFAULT DELHI ADDRESS
  const customerUser = await db.collection('users').findOneAndUpdate(
    { phone: '9827607086' },
    {
      $set: {
        name: 'Vazahat Qureshi',
        phone: '9827607086',
        countryCode: '+91',
        status: 'active',
        deletedAt: null,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  );

  const customerId = customerUser._id;

  // Unset all existing default addresses for this user
  await db.collection('user_addresses').updateMany(
    { userId: customerId },
    { $set: { isDefault: false } }
  );

  // Upsert the client test address as default
  await db.collection('user_addresses').findOneAndUpdate(
    { userId: customerId, pincode: '110037' },
    {
      $set: {
        userId: customerId,
        name: 'Vazahat Qureshi',
        phone: '9827607086',
        addressLine1: CLIENT_LOCATION.addressLine1,
        address: CLIENT_LOCATION.addressLine1,
        city: CLIENT_LOCATION.city,
        state: CLIENT_LOCATION.state,
        pincode: CLIENT_LOCATION.pincode,
        latitude: CLIENT_LOCATION.lat,
        longitude: CLIENT_LOCATION.lng,
        location: {
          type: 'Point',
          coordinates: [CLIENT_LOCATION.lng, CLIENT_LOCATION.lat],
        },
        isDefault: true,
        addressType: 'home',
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
  console.log('[OK] Customer test address set to Rangpuri-Mahipalpur Delhi (110037) as default');

  // 5. CATEGORIES CATALOG SETUP
  // Parent & subcategories covering all 4 tabs
  const CATEGORIES_TREE = [
    // Groceries & Fresh
    {
      name: 'Fruits & Vegetables',
      slug: 'fruits-vegetables',
      visibleTabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      commerceFlows: ['fresh_grocery', 'quick_shop', 'standard'],
      imageUrl: 'https://images.dealshare.in/1740817873208fruits-&-Vegetables.png?tr=f-webp',
      subcategories: [
        { name: 'Fresh Vegetables', slug: 'fresh-vegetables', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
        { name: 'Fresh Fruits', slug: 'fresh-fruits', imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400' },
        { name: 'Season Greens & Herbs', slug: 'greens-herbs', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400' },
      ],
    },
    {
      name: 'Bakery, Dairy & Eggs',
      slug: 'bakery-dairy-eggs',
      visibleTabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      commerceFlows: ['fresh_grocery', 'quick_shop', 'standard'],
      imageUrl: 'https://images.dealshare.in/1740817857338bakery.png?tr=f-webp',
      subcategories: [
        { name: 'Milk & Butter', slug: 'milk-butter', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
        { name: 'Paneer & Curd', slug: 'paneer-curd', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400' },
        { name: 'Bread & Bakery', slug: 'bread-bakery', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
        { name: 'Farm Eggs', slug: 'farm-eggs', imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400' },
      ],
    },
    {
      name: 'Cooking Essentials',
      slug: 'cooking-essentials',
      visibleTabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      commerceFlows: ['fresh_grocery', 'quick_shop', 'standard'],
      imageUrl: 'https://images.dealshare.in/1743273719046wbstaples-1.png?tr=f-webp',
      subcategories: [
        { name: 'Atta, Flours & Grains', slug: 'atta-flours-grains', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
        { name: 'Rice & Pulses', slug: 'rice-and-pulses', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
        { name: 'Edible Oils & Ghee', slug: 'edible-oils-ghee', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
        { name: 'Spices & Masalas', slug: 'spices-masalas', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
      ],
    },
    {
      name: 'Packaged Food',
      slug: 'packaged-food',
      visibleTabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      commerceFlows: ['quick_shop', 'fresh_grocery', 'standard'],
      imageUrl: 'https://images.dealshare.in/1743273218633WhatsAppImage2025-03-30at12.03.19AM.jpeg?tr=f-webp',
      subcategories: [
        { name: 'Noodles & Pasta', slug: 'noodles-pasta', imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400' },
        { name: 'Sauces & Spreads', slug: 'sauces-spreads', imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=400' },
        { name: 'Breakfast Cereals', slug: 'breakfast-cereals', imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=400' },
      ],
    },
    {
      name: 'Beverages',
      slug: 'beverages',
      visibleTabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      commerceFlows: ['quick_shop', 'fresh_grocery', 'standard'],
      imageUrl: 'https://images.dealshare.in/1743272484060RJPF.png?tr=f-webp',
      subcategories: [
        { name: 'Cold Drinks & Juices', slug: 'cold-drinks-juices', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
        { name: 'Tea & Coffee', slug: 'tea-coffee', imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400' },
      ],
    },
    {
      name: 'Snacks & Munchies',
      slug: 'snacks-munchies',
      visibleTabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      commerceFlows: ['quick_shop', 'fresh_grocery', 'standard'],
      imageUrl: 'https://images.dealshare.in/1740817839812top-deals.png?tr=f-webp',
      subcategories: [
        { name: 'Chips & Crisps', slug: 'chips-crisps', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400' },
        { name: 'Namkeen & Bhujia', slug: 'namkeen-bhujia', imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400' },
        { name: 'Biscuits & Cookies', slug: 'biscuits-cookies', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' },
      ],
    },
    {
      name: 'Household & Cleaning',
      slug: 'household-cleaning',
      visibleTabs: ['quick_shop', 'mithilakart'],
      commerceFlows: ['quick_shop', 'standard'],
      imageUrl: 'https://images.dealshare.in/1743272803279omnihpc-1.png?tr=f-webp',
      subcategories: [
        { name: 'Detergents & Laundry', slug: 'detergents-laundry', imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400' },
        { name: 'Kitchen & Surface Cleaners', slug: 'surface-cleaners', imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400' },
      ],
    },
    // Mithilak Tab (Heritage & Culture)
    {
      name: 'Mithila Heritage & Crafts',
      slug: 'mithila-heritage-crafts',
      visibleTabs: ['mithilak', 'mithilakart'],
      commerceFlows: ['mithilak', 'standard'],
      imageUrl: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=400',
      subcategories: [
        { name: 'Madhubani Art & Paintings', slug: 'madhubani-paintings', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400' },
        { name: 'Mithila Paridhan & Handloom', slug: 'mithila-paridhan', imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
        { name: 'Mithila Lac Bangles', slug: 'mithila-lac-bangles', imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400' },
        { name: 'Mithila Handcrafted Items', slug: 'mithila-handcrafted', imageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400' },
        { name: 'Mithila Special Cuisines & Achaar', slug: 'mithila-cuisines-achaar', imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400' },
        { name: 'Mithila Pooja Needs', slug: 'mithila-pooja-needs', imageUrl: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400' },
      ],
    },
    // Standard Mithilakart Tab Categories
    {
      name: 'Beauty',
      slug: 'beauty',
      visibleTabs: ['mithilakart', 'quick_shop'],
      commerceFlows: ['standard', 'quick_shop'],
      imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      subcategories: [
        { name: 'Cosmetics & Makeup', slug: 'cosmetics-makeup', imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400' },
        { name: 'Skincare Essentials', slug: 'skincare-essentials', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },
        { name: 'Hair Care', slug: 'hair-care-products', imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400' },
      ],
    },
    {
      name: 'Fashion',
      slug: 'fashion',
      visibleTabs: ['mithilakart'],
      commerceFlows: ['standard'],
      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
      subcategories: [
        { name: 'Ethnic Wear', slug: 'ethnic-wear-fashion', imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
        { name: "Men's Wear", slug: 'mens-wear-fashion', imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400' },
        { name: "Women's Wear", slug: 'womens-wear-fashion', imageUrl: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400' },
      ],
    },
    {
      name: 'Electronics',
      slug: 'electronics',
      visibleTabs: ['mithilakart', 'quick_shop'],
      commerceFlows: ['standard', 'quick_shop'],
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      subcategories: [
        { name: 'Smartphones & Accessories', slug: 'smartphones-accessories', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
        { name: 'Audio & Earbuds', slug: 'audio-earbuds', imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400' },
      ],
    },
    {
      name: 'Jewellery',
      slug: 'jewellery',
      visibleTabs: ['mithilakart'],
      commerceFlows: ['standard'],
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
      subcategories: [
        { name: '1g Gold Jewellery', slug: '1g-gold-jewellery', imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400' },
        { name: 'Art. Jewellery', slug: 'artificial-jewellery', imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400' },
      ],
    },
    {
      name: 'Toys',
      slug: 'toys',
      visibleTabs: ['mithilakart'],
      commerceFlows: ['standard'],
      imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400',
      subcategories: [
        { name: 'Educational Toys', slug: 'educational-toys-kids', imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400' },
        { name: 'Wooden Toys & Puzzles', slug: 'wooden-toys-puzzles', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      ],
    },
    {
      name: 'Stationery',
      slug: 'stationery',
      visibleTabs: ['mithilakart'],
      commerceFlows: ['standard'],
      imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400',
      subcategories: [
        { name: 'Notebooks & Planners', slug: 'notebooks-planners', imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' },
        { name: 'Art & Craft Supplies', slug: 'art-craft-supplies', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400' },
      ],
    },
    {
      name: 'Gifting',
      slug: 'gifting',
      visibleTabs: ['mithilakart'],
      commerceFlows: ['standard'],
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400',
      subcategories: [
        { name: 'Gift Hampers & Boxes', slug: 'gift-hampers-boxes', imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400' },
      ],
    },
    {
      name: 'Electrical',
      slug: 'electrical',
      visibleTabs: ['mithilakart'],
      commerceFlows: ['standard'],
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      subcategories: [
        { name: 'Fans & Air Coolers', slug: 'fans-air-coolers', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400' },
      ],
    },
  ];

  // Safely rename slugs of any soft-deleted categories to avoid partial index collisions
  const softDeletedCats = await db.collection('categories').find({ deletedAt: { $ne: null } }).toArray();
  for (const sdc of softDeletedCats) {
    if (!sdc.slug.includes('_deleted_')) {
      await db.collection('categories').updateOne(
        { _id: sdc._id },
        { $set: { slug: `${sdc.slug}_deleted_${sdc._id}` } }
      );
    }
  }

  const categoryMap = new Map();

  for (const cat of CATEGORIES_TREE) {
    const parentDoc = await db.collection('categories').findOneAndUpdate(
      { slug: cat.slug, deletedAt: null },
      {
        $set: {
          name: cat.name,
          slug: cat.slug,
          description: cat.name + ' collection on Mithilakart',
          imageUrl: cat.imageUrl,
          iconUrl: cat.imageUrl,
          visibleTabs: cat.visibleTabs,
          commerceFlows: cat.commerceFlows,
          isActive: true,
          deletedAt: null,
          parentId: null,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' }
    );
    categoryMap.set(cat.slug, parentDoc);
    categoryMap.set(cat.name, parentDoc);

    if (Array.isArray(cat.subcategories)) {
      for (const sub of cat.subcategories) {
        const subDoc = await db.collection('categories').findOneAndUpdate(
          { slug: sub.slug, deletedAt: null },
          {
            $set: {
              name: sub.name,
              slug: sub.slug,
              description: sub.name,
              imageUrl: sub.imageUrl,
              iconUrl: sub.imageUrl,
              visibleTabs: cat.visibleTabs,
              commerceFlows: cat.commerceFlows,
              isActive: true,
              deletedAt: null,
              parentId: parentDoc._id,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true, returnDocument: 'after' }
        );
        categoryMap.set(sub.slug, subDoc);
        categoryMap.set(sub.name, subDoc);
      }
    }
  }
  console.log(`[OK] Categories hierarchy seeded: ${categoryMap.size} category entries mapped.`);

  // 6. MASTER PRODUCT DEFINITIONS
  // Master products include shared-catalogKey products (seeded across all 4 sellers) + specialized catalog
  const MASTER_PRODUCTS = [
    // --- STAPLES & GROCERIES ---
    {
      catalogKey: 'AGRO-FRESH-ATTA-10KG',
      title: 'Agro Fresh Chakki Atta - 10 Kg',
      description: '100% whole wheat chakki fresh atta, soft and fluffy rotis.',
      price: 395,
      mrp: 525,
      brand: 'Agro Fresh',
      categorySlug: 'atta-flours-grains',
      tabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1743489478375:01935F21ED_DEAL.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'DAINIK-MINIKIT-RICE-10KG',
      title: 'Dainik Minikit Rice - 10 Kg',
      description: 'Premium everyday minikit rice, aromatic and long grains.',
      price: 635,
      mrp: 830,
      brand: 'Dainik',
      categorySlug: 'rice-and-pulses',
      tabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1742374265318:0DB212E68E_1.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'FORTUNE-MOGRA-BASMATI-5KG',
      title: 'Fortune Mogra Basmati Rice - 5 Kg',
      description: 'Aromatic long grain Mogra Basmati Rice for pulao and biryani.',
      price: 289,
      mrp: 465,
      brand: 'Fortune',
      categorySlug: 'rice-and-pulses',
      tabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1742371274774:F870A3D320_1.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'ORGANIC-TOOR-DAL-1KG',
      title: 'Sampoorti Organic Toor Dal - 1 Kg',
      description: 'Unpolished premium Toor Dal, high protein and rich taste.',
      price: 145,
      mrp: 199,
      brand: 'Sampoorti',
      categorySlug: 'rice-and-pulses',
      tabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'JHARNA-GHEE-250ML',
      title: 'Jharna Pure Cow Ghee (Jar) - 250 Ml',
      description: 'Traditional pure cow ghee with rich golden aroma.',
      price: 169,
      mrp: 182,
      brand: 'Jharna',
      categorySlug: 'edible-oils-ghee',
      tabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1741690753063:21825CB9A8_1.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'SOYABEAN-OIL-800GM',
      title: 'Best Choice Refined Soyabean Oil (Pouch) - 800 Gm',
      description: 'Light and healthy refined soyabean cooking oil with Vitamin A & D.',
      price: 129,
      mrp: 170,
      brand: 'Best Choice',
      categorySlug: 'edible-oils-ghee',
      tabs: ['groceries_fresh', 'quick_shop', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1742622718265:8438AE2D63_DEAL.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'FRESH-MILK-1L',
      title: 'Fresh Cow Milk 1L - Pure & Chilled',
      description: 'Farm-fresh pasteurized pure cow milk delivered chilled in 25 mins.',
      price: 48,
      mrp: 60,
      brand: 'Mithila Dairy',
      categorySlug: 'milk-butter',
      tabs: ['groceries_fresh', 'quick_shop'],
      imageUrl: 'https://images.dealshare.in/1743765229447Fresh-Milk-Strip.jpg?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'FRESH-TOMATO-1KG',
      title: 'Fresh Farm Red Tomatoes - 1 Kg',
      description: 'Juicy, farm-picked ripe red tomatoes.',
      price: 45,
      mrp: 70,
      brand: 'Fresh Farm',
      categorySlug: 'fresh-vegetables',
      tabs: ['groceries_fresh', 'quick_shop'],
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'FRESH-POTATO-1KG',
      title: 'Fresh Farm Potatoes - 1 Kg',
      description: 'High grade clean potatoes, staple for every kitchen.',
      price: 25,
      mrp: 35,
      brand: 'Fresh Farm',
      categorySlug: 'fresh-vegetables',
      tabs: ['groceries_fresh', 'quick_shop'],
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',
      sharedMultiTier: true,
    },

    // --- PACKAGED FOOD & BEVERAGES ---
    {
      catalogKey: 'MAGGI-NOODLES-12PACK',
      title: 'Maggi 2-Minute Masala Instant Noodles (Pack of 12)',
      description: 'Classic Maggi masala noodles pack, loved by all.',
      price: 159,
      mrp: 180,
      brand: 'Nestle Maggi',
      categorySlug: 'noodles-pasta',
      tabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1743489479369:CD0FE93AB9_DEAL.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'SPRITE-SOFT-DRINK-2L',
      title: 'Sprite Lime Soft Drink - 2 Ltr Bottle',
      description: 'Refreshing clear lemon-lime flavored carbonated beverage.',
      price: 82,
      mrp: 99,
      brand: 'Sprite',
      categorySlug: 'cold-drinks-juices',
      tabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1742970096678:666568D881_DEAL.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'THUMS-UP-2L',
      title: 'Thums Up Charged Soft Drink - 2 Ltr Bottle',
      description: 'Strong cola taste with high fizz and thunderous refreshment.',
      price: 82,
      mrp: 99,
      brand: 'Thums Up',
      categorySlug: 'cold-drinks-juices',
      tabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1742379091788:DD58563CAC_DEAL.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'SLICE-MANGO-175L',
      title: 'Slice Thick Mango Drink - 1.75 Ltr',
      description: 'Rich Alphonso mango taste in every sip.',
      price: 74,
      mrp: 99,
      brand: 'Slice',
      categorySlug: 'cold-drinks-juices',
      tabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/148457EB39_1.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'CHARMINAR-ASSAM-TEA-1KG',
      title: 'Charminar Assam Tea (Pouch) - 1 Kg',
      description: 'Strong orthodox kadak Assam tea leaves for perfect morning cup.',
      price: 159,
      mrp: 280,
      brand: 'Charminar',
      categorySlug: 'tea-coffee',
      tabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1743489477578:221C39FB44_DEAL.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'MIRAJ-BHUJIA-800GM',
      title: 'Miraj Crispy Bikaneri Bhujia - 800 Gm',
      description: 'Crispy spicy authentic moth and besan bhujia sev.',
      price: 125,
      mrp: 280,
      brand: 'Miraj',
      categorySlug: 'namkeen-bhujia',
      tabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1742374265578:4B97197919_1.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'CREMICA-COCONUT-900GM',
      title: 'Cremica Real Coconut Cookies - 900 Gm',
      description: 'Crisp crunchy cookies packed with real toasted coconut flakes.',
      price: 99,
      mrp: 240,
      brand: 'Cremica',
      categorySlug: 'biscuits-cookies',
      tabs: ['quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/6AF1600575_1.webp?tr=f-webp',
      sharedMultiTier: true,
    },

    // --- HOUSEHOLD & PERSONAL CARE ---
    {
      catalogKey: 'SAFED-DETERGENT-2KG',
      title: 'Safed Heavy-Duty Detergent Powder - 2 Kg',
      description: 'Tough stain remover powder with pleasant floral freshness.',
      price: 119,
      mrp: 160,
      brand: 'Safed',
      categorySlug: 'detergents-laundry',
      tabs: ['quick_shop', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1743489477473:41F2FE80D3_DEAL.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'DYNA-LIME-SOAP-5PACK',
      title: 'Dyna Lime & Aloe Vera Soap - 100 Gm (Pack of 5)',
      description: 'Grade 1 soap with natural lime and aloe vera extracts.',
      price: 95,
      mrp: 110,
      brand: 'Dyna',
      categorySlug: 'skincare-essentials',
      tabs: ['quick_shop', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/3BDBC4EEF3_1.webp?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'TRIBBO-STEEL-BOTTLE-1L',
      title: 'Tribbo Stainless Steel Eco Bottle (1 Ltr)',
      description: 'BPA-free rust-proof stainless steel water bottle.',
      price: 99,
      mrp: 299,
      brand: 'Tribbo',
      categorySlug: 'surface-cleaners',
      tabs: ['quick_shop', 'mithilakart'],
      imageUrl: 'https://images.dealshare.in/1743206413715:0A4BA7F764_CD.png?tr=f-webp',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'LOREAL-SHAMPOO-200ML',
      title: "L'Oreal Paris Hyaluron Moisture Hydrating Shampoo 200ml",
      description: 'Hydrating formula with Hyaluronic acid for 72hr bounce and shine.',
      price: 225,
      mrp: 249,
      brand: "L'Oreal",
      categorySlug: 'hair-care-products',
      tabs: ['quick_shop', 'mithilakart', 'beauty'],
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'PILGRIM-SERUM-30ML',
      title: 'Pilgrim 10% Niacinamide Clarifying Serum 30ml',
      description: 'Dermatologically tested facial serum for blemishes and pores.',
      price: 202,
      mrp: 249,
      brand: 'Pilgrim',
      categorySlug: 'skincare-essentials',
      tabs: ['quick_shop', 'mithilakart', 'beauty'],
      imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600',
      sharedMultiTier: true,
    },

    // --- MITHILA HERITAGE & CRAFTS ---
    {
      catalogKey: 'MADHUBANI-FISH-PAINTING-L',
      title: 'Handmade Madhubani Fish Motif Canvas Painting (Large A2)',
      description: 'Authentic handcrafted Madhubani painting on handmade paper by national awardee artisan from Madhubani.',
      price: 2499,
      mrp: 3499,
      brand: 'Mithila Heritage Crafts',
      categorySlug: 'madhubani-paintings',
      tabs: ['mithilak', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'MADHUBANI-PEACOCK-A3',
      title: 'Vibrant Madhubani Peacock Motif Framed Wall Art (A3)',
      description: 'Traditional peacock design with natural organic dyes on handmade canvas.',
      price: 1299,
      mrp: 1999,
      brand: 'Mithila Heritage Crafts',
      categorySlug: 'madhubani-paintings',
      tabs: ['mithilak', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'SILK-SAREE-MITHILA',
      title: 'Pure Tussar Silk Saree with Madhubani Handpainted Border',
      description: 'Pure handwoven silk saree with intricate Madhubani border artwork.',
      price: 4999,
      mrp: 6999,
      brand: 'Mithila Handloom',
      categorySlug: 'mithila-paridhan',
      tabs: ['mithilak', 'mithilakart', 'fashion'],
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'DOKRA-BRASS-JEWELLERY-SET',
      title: 'Traditional Mithila Dokra Brass Necklace & Earrings Set',
      description: 'Authentic lost-wax casting tribal brass jewellery set.',
      price: 899,
      mrp: 1299,
      brand: 'Mithila Heritage',
      categorySlug: 'mithila-handcrafted',
      tabs: ['mithilak', 'mithilakart', 'jewellery'],
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'LAC-BANGLE-SET-MULTICOLOR',
      title: 'Handcrafted Bihari Lac Bangles Set (8 Pieces Multicolor)',
      description: 'Natural lac bangles studded with ethnic beads and traditional motifs.',
      price: 349,
      mrp: 499,
      brand: 'Mithila Jewels',
      categorySlug: 'mithila-lac-bangles',
      tabs: ['mithilak', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1573408301185-9519f94f7a61?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'MITHILA-MAKHAANA-250G',
      title: 'Premium GI-Tagged Mithila Phool Makhana (Fox Nuts) - 250 Gm',
      description: 'Jumbo size authentic Mithila fox nuts directly from Darbhanga lakes.',
      price: 299,
      mrp: 450,
      brand: 'Mithila Naturals',
      categorySlug: 'mithila-cuisines-achaar',
      tabs: ['mithilak', 'quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'MITHILA-AAM-ACHAAR-500G',
      title: 'Traditional Bihari Sun-Dried Raw Mango Pickle (Aam Achaar) - 500 Gm',
      description: 'Homemade grandmother recipe mango pickle in mustard oil and fenugreek.',
      price: 249,
      mrp: 350,
      brand: 'Mithila Naturals',
      categorySlug: 'mithila-cuisines-achaar',
      tabs: ['mithilak', 'quick_shop', 'groceries_fresh', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600',
      sharedMultiTier: true,
    },

    // --- ELECTRONICS, GADGETS & TOYS ---
    {
      catalogKey: 'SAMSUNG-GALAXY-S24',
      title: 'Samsung Galaxy S24 AI Flagship Smartphone (8GB/256GB)',
      description: 'Flagship Dynamic AMOLED 2X, Galaxy AI live translation and camera.',
      price: 79999,
      mrp: 89999,
      brand: 'Samsung',
      categorySlug: 'smartphones-accessories',
      tabs: ['electronics', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'WIRELESS-EARBUDS-ANC',
      title: 'Wireless Active Noise Cancelling Earbuds (40H Playtime)',
      description: 'Bluetooth 5.3 earbuds with 32dB active noise cancellation and IPX5.',
      price: 2499,
      mrp: 5999,
      brand: 'boAt',
      categorySlug: 'audio-earbuds',
      tabs: ['quick_shop', 'electronics', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'WOODEN-ELEPHANT-PAIR',
      title: 'Handcrafted Wooden Carved Elephant Figurine Pair',
      description: 'Hand-carved wooden elephant statues with Madhubani lacquer art.',
      price: 799,
      mrp: 1199,
      brand: 'Mithila Handicrafts',
      categorySlug: 'wooden-toys-puzzles',
      tabs: ['toys', 'mithilak', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'EDUCATIONAL-WOODEN-PUZZLE',
      title: 'Educational Wooden Alphabet & Numbers Learning Board',
      description: 'Non-toxic eco-friendly wooden puzzle board for early child learning.',
      price: 499,
      mrp: 799,
      brand: 'PlayCraft',
      categorySlug: 'educational-toys-kids',
      tabs: ['toys', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600',
      sharedMultiTier: true,
    },

    // --- STATIONERY, APPLIANCES & BEAUTY ---
    {
      catalogKey: 'PREMIUM-NOTEBOOK-SET',
      title: 'Premium Hardcover Ruled Journal Notebooks (Pack of 3)',
      description: '120 GSM thick paper journals with bookmark ribbon and elastic band.',
      price: 499,
      mrp: 899,
      brand: 'Notesmart',
      categorySlug: 'notebooks-planners',
      tabs: ['stationery', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'SMART-SPLIT-AC',
      title: 'Smart Split Inverter AC 1.5 Ton 5-Star (Copper Condenser)',
      description: 'Energy efficient dual inverter fast cooling split air conditioner.',
      price: 35999,
      mrp: 51199,
      brand: 'Voltas',
      categorySlug: 'fans-air-coolers',
      tabs: ['electrical', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'GOLD-COIN-1G',
      title: '24K 999 Pure Gold Coin 1 Gram (BIS Hallmarked)',
      description: 'Assay certified tamper-proof packaging pure gold coin.',
      price: 6499,
      mrp: 7200,
      brand: 'Mithila Gold',
      categorySlug: '1g-gold-jewellery',
      tabs: ['jewellery', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'LUXURY-MATTE-LIPSTICK',
      title: 'Velvet Matte Long Stay Waterproof Lipstick',
      description: '12-hour transfer-proof pigmented matte liquid lipstick.',
      price: 499,
      mrp: 999,
      brand: 'Priya Naturals',
      categorySlug: 'cosmetics-makeup',
      tabs: ['beauty', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'PREMIUM-GIFT-HAMPER',
      title: 'Luxury Assorted Festive Gift Hamper Box',
      description: 'Handcrafted wooden box with organic honey, makhana, cookies and brass diya.',
      price: 1299,
      mrp: 1999,
      brand: 'Mithilakart Gifting',
      categorySlug: 'gift-hampers-boxes',
      tabs: ['gifting', 'mithilakart'],
      imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600',
      sharedMultiTier: true,
    },
    {
      catalogKey: 'MENS-KHADI-KURTA',
      title: "Men's Handspun Khadi Cotton Kurta (Ivory White)",
      description: 'Comfortable eco-friendly breathable pure khadi cotton traditional kurta.',
      price: 799,
      mrp: 1199,
      brand: 'Mithila Handloom',
      categorySlug: 'mens-wear-fashion',
      tabs: ['fashion', 'mithilakart', 'mithilak'],
      imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600',
      sharedMultiTier: true,
    },
  ];

  // 7. SEED PRODUCTS ACROSS SELLERS
  // For sharedMultiTier products:
  // - Seller 1 (Vazahat Store): has stock 50
  // - Seller 2 (Mithila Heritage Store): has stock 50
  // - Seller 3 (Warehouse): has stock 500
  // - Seller 4 (Standard Seller): has stock 100
  console.log('\nSeeding products and marketplace listings...');
  let totalProductsSeeded = 0;
  let totalListingsSeeded = 0;

  for (const p of MASTER_PRODUCTS) {
    const cat = categoryMap.get(p.categorySlug) || categoryMap.get('groceries') || categoryMap.get('mithila-heritage-crafts');
    const categoryId = cat ? cat._id : null;

    // Determine which sellers receive this product
    const sellersForProduct = p.sharedMultiTier
      ? [
          { seller: sellerDocs['SELLER-1-PRIMARY'], stock: 50, price: p.price, mrp: p.mrp },
          { seller: sellerDocs['SELLER-2-SECONDARY'], stock: 50, price: p.price, mrp: p.mrp },
          { seller: sellerDocs['SELLER-3-WAREHOUSE'], stock: 500, price: p.price - 2, mrp: p.mrp },
          { seller: sellerDocs['SELLER-4-STANDARD'], stock: 100, price: p.price, mrp: p.mrp },
        ]
      : [
          { seller: sellerDocs['SELLER-1-PRIMARY'], stock: 40, price: p.price, mrp: p.mrp },
          { seller: sellerDocs['SELLER-2-SECONDARY'], stock: 30, price: p.price, mrp: p.mrp },
        ];

    for (const item of sellersForProduct) {
      const seller = item.seller;
      if (!seller) continue;

      const sku = `${seller.phone.slice(-4)}-${p.catalogKey}`;

      const productDoc = await db.collection('products').findOneAndUpdate(
        { sellerId: seller._id, sku, deletedAt: null },
        {
          $set: {
            title: p.title,
            description: p.description,
            price: item.price,
            mrp: item.mrp,
            costPrice: Math.round(item.price * 0.75),
            stock: item.stock,
            reservedStock: 0,
            sku,
            catalogKey: p.catalogKey,
            sellerId: seller._id,
            categoryId,
            brand: p.brand,
            images: [{ url: p.imageUrl, alt: p.title }],
            status: 'approved',
            isActive: true,
            commerceFlows: p.tabs.map(t => {
              if (t === 'quick_shop') return 'quick_shop';
              if (t === 'groceries_fresh') return 'fresh_grocery';
              if (t === 'mithilak') return 'mithilak';
              return 'standard';
            }),
            tags: [p.brand.toLowerCase(), p.categorySlug],
            rating: 4.8,
            reviewCount: 32,
            deletedAt: null,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, returnDocument: 'after' }
      );
      totalProductsSeeded++;

      // Create marketplace listings for each applicable tab
      for (const tab of p.tabs) {
        const isQuick = tab === 'quick_shop' || tab === 'groceries_fresh';
        await db.collection('marketplace_listings').findOneAndUpdate(
          { productId: productDoc._id, marketplaceTab: tab, deletedAt: null },
          {
            $set: {
              productId: productDoc._id,
              sellerId: seller._id,
              marketplaceTab: tab,
              price: item.price,
              mrp: item.mrp,
              listingStatus: 'approved',
              isVisible: true,
              deliveryType: isQuick ? 'fixed_promise' : 'standard',
              deliveryPromiseMinutes: isQuick ? 25 : null,
              publishedAt: new Date(),
              approvedAt: new Date(),
              deletedAt: null,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
        totalListingsSeeded++;
      }
    }
  }

  console.log(`[OK] Total Products seeded/updated: ${totalProductsSeeded}`);
  console.log(`[OK] Total Marketplace Listings seeded/updated: ${totalListingsSeeded}`);

  // 8. VERIFY PLATFORM SETTINGS FOR LADDER ESCALATION
  await db.collection('platform_settings').findOneAndUpdate(
    { key: 'crossSellerSubstitutionEnabled' },
    { $set: { key: 'crossSellerSubstitutionEnabled', value: true, updatedAt: new Date() } },
    { upsert: true }
  );
  await db.collection('platform_settings').findOneAndUpdate(
    { key: 'warehouseFallbackEnabled' },
    { $set: { key: 'warehouseFallbackEnabled', value: true, updatedAt: new Date() } },
    { upsert: true }
  );
  await db.collection('platform_settings').findOneAndUpdate(
    { key: 'courierFallbackEnabled' },
    { $set: { key: 'courierFallbackEnabled', value: true, updatedAt: new Date() } },
    { upsert: true }
  );
  await db.collection('platform_settings').findOneAndUpdate(
    { key: 'maxSellerAttemptsPerOrder' },
    { $set: { key: 'maxSellerAttemptsPerOrder', value: 5, updatedAt: new Date() } },
    { upsert: true }
  );
  await db.collection('platform_settings').findOneAndUpdate(
    { key: 'sellerSearchRadiusKm' },
    { $set: { key: 'sellerSearchRadiusKm', value: 25, updatedAt: new Date() } },
    { upsert: true }
  );
  console.log('[OK] Platform Settings verified (substitution=true, warehouseFallback=true, courierFallback=true)');

  console.log('\n===============================================================');
  console.log(' SEED COMPLETE! SUMMARY:');
  console.log(' - Customer: 9827607086 (OTP: 123456) default at Mahipalpur Delhi 110037');
  console.log(' - Admin: vazahat@mithilakart.com / Admin@12345');
  console.log(' - Seller 1 (Primary): vazahat.seller@mithilakart.com / 12345678 (Mahipalpur 400m)');
  console.log(' - Seller 2 (Secondary): vazahat@mithilakart.com / Seller@12345 (Vasant Kunj 2.5km)');
  console.log(' - Seller 3 (Warehouse): warehouse@mithilakart.com / Seller@12345 (Dwarka Hub 6.5km)');
  console.log(' - Seller 4 (Standard): standard.seller@mithilakart.com / Seller@12345 (Pan-India Courier)');
  console.log(' - Riders: 9827607086, 9123456789 (Active in Mahipalpur Delhi, OTP: 123456)');
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

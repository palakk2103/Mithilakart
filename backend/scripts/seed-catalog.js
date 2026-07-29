require('dotenv').config();

const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const { connectRedis, disconnectRedis } = require('../src/config/redis');
const config = require('../src/config');
const { registerProvider } = require('../src/core/providers.registry');
const { LocalStorageProvider } = require('../src/core/providers/LocalStorageProvider');

const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');
const Banner = require('../src/models/Banner');
const CategoryChip = require('../src/models/CategoryChip');
const HomeSection = require('../src/models/HomeSection');
const LegalPage = require('../src/models/LegalPage');
const Seller = require('../src/models/Seller');
const { PRODUCT_STATUS, COMMERCE_FLOWS, HOME_SECTION_KEYS, LEGAL_PAGE_TYPES } = require('../src/constants/catalog');

async function seedCatalog() {
  await connectDatabase();
  await connectRedis(config);
  registerProvider('storage', new LocalStorageProvider());

  const seller = await Seller.findOne({ email: 'seller@mithilakart.com' });
  if (!seller) {
    throw new Error('Seed seller not found. Run npm run seed:auth first.');
  }

  const categories = [
    { name: 'Handicrafts', slug: 'handicrafts', commerceFlows: ['standard', 'mithilak'] },
    { name: 'Madhubani Art', slug: 'madhubani-art', parentSlug: 'handicrafts', commerceFlows: ['mithilak'] },
    { name: 'Groceries', slug: 'groceries', commerceFlows: ['fresh_grocery', 'standard'] },
    { name: 'Quick Shop', slug: 'quick-shop', commerceFlows: ['quick_shop', 'standard'] },
    { name: 'Beauty', slug: 'beauty', commerceFlows: ['standard'] },
    { name: 'Toys', slug: 'toys', commerceFlows: ['standard'] },
  ];

  const categoryMap = new Map();

  for (const entry of categories) {
    if (!entry.parentSlug) {
      const doc = await Category.findOneAndUpdate(
        { slug: entry.slug },
        {
          name: entry.name,
          slug: entry.slug,
          commerceFlows: entry.commerceFlows,
          isActive: true,
          deletedAt: null,
        },
        { upsert: true, new: true }
      );
      categoryMap.set(entry.slug, doc);
    }
  }

  for (const entry of categories.filter((item) => item.parentSlug)) {
    const parent = categoryMap.get(entry.parentSlug);
    const doc = await Category.findOneAndUpdate(
      { slug: entry.slug },
      {
        name: entry.name,
        slug: entry.slug,
        parentId: parent?._id || null,
        commerceFlows: entry.commerceFlows,
        isActive: true,
        deletedAt: null,
      },
      { upsert: true, new: true }
    );
    categoryMap.set(entry.slug, doc);
  }

  const madhubani = categoryMap.get('madhubani-art');
  const groceries = categoryMap.get('groceries');
  const quickShop = categoryMap.get('quick-shop');
  const beauty = categoryMap.get('beauty');
  const toys = categoryMap.get('toys');

  const productSeeds = [
    { sku: 'MK-ART-001', title: 'Traditional Madhubani Painting', price: 1499, mrp: 2499, stock: 25, categoryId: madhubani._id, flows: [COMMERCE_FLOWS.MITHILAK, COMMERCE_FLOWS.STANDARD], brand: 'Mithila Heritage', tags: ['madhubani', 'art'] },
    { sku: 'MK-ART-002', title: 'Handpainted Mithila Pot', price: 699, mrp: 999, stock: 40, categoryId: madhubani._id, flows: [COMMERCE_FLOWS.MITHILAK], brand: 'Mithila Heritage', tags: ['handicraft'] },
    { sku: 'MK-GR-001', title: 'Organic Basmati Rice 5kg', price: 499, mrp: 650, stock: 100, categoryId: groceries._id, flows: [COMMERCE_FLOWS.FRESH_GROCERY, COMMERCE_FLOWS.STANDARD], brand: 'Fresh Farm', tags: ['grocery', 'rice'] },
    { sku: 'MK-GR-002', title: 'Fresh Seasonal Vegetables Pack', price: 199, mrp: 280, stock: 80, categoryId: groceries._id, flows: [COMMERCE_FLOWS.FRESH_GROCERY], brand: 'Green Basket', tags: ['vegetables'] },
    { sku: 'MK-QS-001', title: 'Daily Essentials Combo', price: 299, mrp: 450, stock: 60, categoryId: quickShop._id, flows: [COMMERCE_FLOWS.QUICK_SHOP, COMMERCE_FLOWS.STANDARD], brand: 'QuickMart', tags: ['essentials'] },
    { sku: 'MK-QS-002', title: 'Instant Snacks Bundle', price: 149, mrp: 220, stock: 120, categoryId: quickShop._id, flows: [COMMERCE_FLOWS.QUICK_SHOP], brand: 'QuickMart', tags: ['snacks'] },
    { sku: 'MK-BT-001', title: 'Herbal Glow Face Cream', price: 349, mrp: 499, stock: 55, categoryId: beauty._id, flows: [COMMERCE_FLOWS.STANDARD], brand: 'GlowCare', tags: ['beauty', 'skincare'] },
    { sku: 'MK-TY-001', title: 'Wooden Learning Puzzle Set', price: 599, mrp: 799, stock: 35, categoryId: toys._id, flows: [COMMERCE_FLOWS.STANDARD], brand: 'PlayCraft', tags: ['toys', 'learning'] },
  ];

  const createdProducts = [];

  for (const seed of productSeeds) {
    const product = await Product.findOneAndUpdate(
      { sku: seed.sku },
      {
        sellerId: seller._id,
        title: seed.title,
        description: `${seed.title} — authentic seller listing on Mithilakart.`,
        sku: seed.sku,
        price: seed.price,
        mrp: seed.mrp,
        stock: seed.stock,
        categoryId: seed.categoryId,
        status: PRODUCT_STATUS.APPROVED,
        images: [{ url: '/uploads/cms/sample-banner.jpg', alt: seed.title, sortOrder: 0 }],
        tags: seed.tags,
        commerceFlows: seed.flows,
        rating: 4.6,
        reviewCount: 8,
        brand: seed.brand,
        deletedAt: null,
      },
      { upsert: true, new: true }
    );
    createdProducts.push(product);
  }

  const product = createdProducts[0];

  await ProductVariant.findOneAndUpdate(
    { sku: 'MK-ART-001-A4' },
    {
      productId: product._id,
      name: 'A4 Size',
      sku: 'MK-ART-001-A4',
      price: 1499,
      mrp: 2499,
      stock: 15,
      attributes: { size: 'A4' },
      isActive: true,
      deletedAt: null,
    },
    { upsert: true, new: true }
  );

  await Banner.findOneAndUpdate(
    { title: 'Mithila Heritage Launch' },
    {
      title: 'Mithila Heritage Launch',
      imageUrl: '/uploads/cms/sample-banner.jpg',
      linkUrl: '/products',
      commerceFlow: COMMERCE_FLOWS.STANDARD,
      sortOrder: 0,
      isActive: true,
      deletedAt: null,
    },
    { upsert: true, new: true }
  );

  const chipsToSeed = [
    { label: 'You Buy', categoryId: madhubani._id, sortOrder: 0 },
    { label: 'Fashion', categoryId: madhubani._id, sortOrder: 1 },
    { label: 'Beauty', categoryId: beauty._id, sortOrder: 2 },
    { label: 'Electronics', categoryId: quickShop._id, sortOrder: 3 },
    { label: 'Jewellery', categoryId: madhubani._id, sortOrder: 4 },
    { label: 'Toys', categoryId: toys._id, sortOrder: 5 },
    { label: 'Stationery', categoryId: quickShop._id, sortOrder: 6 },
    { label: 'Gifting', categoryId: madhubani._id, sortOrder: 7 },
    { label: 'Electrical', categoryId: quickShop._id, sortOrder: 8 },
  ];

  for (const chip of chipsToSeed) {
    await CategoryChip.findOneAndUpdate(
      { label: chip.label },
      {
        label: chip.label,
        categoryId: chip.categoryId,
        commerceFlow: COMMERCE_FLOWS.STANDARD,
        sortOrder: chip.sortOrder,
        isActive: true,
        deletedAt: null,
      },
      { upsert: true, new: true }
    );
  }

  for (const [index, sectionKey] of HOME_SECTION_KEYS.entries()) {
    await HomeSection.findOneAndUpdate(
      { sectionKey, commerceFlow: COMMERCE_FLOWS.STANDARD },
      {
        sectionKey,
        title: sectionKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        productIds: createdProducts.map((item) => item._id),
        commerceFlow: COMMERCE_FLOWS.STANDARD,
        isActive: true,
        sortOrder: index,
      },
      { upsert: true, new: true }
    );
  }

  for (const [index, sectionKey] of HOME_SECTION_KEYS.entries()) {
    await HomeSection.findOneAndUpdate(
      { sectionKey, commerceFlow: COMMERCE_FLOWS.MITHILAK },
      {
        sectionKey,
        title: sectionKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        productIds: createdProducts.filter((item) => item.commerceFlows.includes(COMMERCE_FLOWS.MITHILAK)).map((item) => item._id),
        commerceFlow: COMMERCE_FLOWS.MITHILAK,
        isActive: true,
        sortOrder: index,
      },
      { upsert: true, new: true }
    );
  }

  const legalSeeds = [
    { type: LEGAL_PAGE_TYPES.TERMS, title: 'Terms of Use', content: '<h1>Terms of Use</h1><p>Welcome to Mithilakart.</p>' },
    { type: LEGAL_PAGE_TYPES.PRIVACY, title: 'Privacy Policy', content: '<h1>Privacy Policy</h1><p>Your privacy matters.</p>' },
    { type: LEGAL_PAGE_TYPES.SHIPPING, title: 'Shipping Policy', content: '<h1>Shipping Policy</h1><p>Delivery timelines vary by region.</p>' },
    { type: LEGAL_PAGE_TYPES.CANCELLATION, title: 'Cancellation & Returns', content: '<h1>Cancellation & Returns</h1><p>Review our return policy.</p>' },
  ];

  for (const legal of legalSeeds) {
    await LegalPage.findOneAndUpdate(
      { type: legal.type },
      legal,
      { upsert: true, new: true }
    );
  }

  process.stdout.write('Catalog & CMS seed completed\n');
  await disconnectDatabase();
  await disconnectRedis();
}

seedCatalog().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});

/**
 * Phase 3 migration — recreates hardcoded user-app catalog/CMS data
 * through the same services used by Admin & Seller panels.
 *
 * Prerequisites: npm run seed:auth (seller must exist with KYC approved)
 * Usage: npm run seed:phase3
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const { connectRedis, disconnectRedis } = require('../src/config/redis');
const config = require('../src/config');
const { registerProvider } = require('../src/core/providers.registry');
const { LocalStorageProvider } = require('../src/core/providers/LocalStorageProvider');
const { getContainer } = require('../src/bootstrap/container');
const { COMMERCE_FLOWS, HOME_SECTION_KEYS, PRODUCT_STATUS } = require('../src/constants/catalog');

const Seller = require('../src/models/Seller');
const AdminUser = require('../src/models/AdminUser');

const SAMPLE_IMAGE = '/uploads/cms/sample-banner.jpg';

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const STANDARD_NAV = [
  { legacyKey: 'nav-you-buy', name: 'You Buy', slug: 'you-buy', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 0, chipOnly: true },
  { legacyKey: 'nav-beauty', name: 'Beauty', slug: 'beauty', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 1 },
  { legacyKey: 'nav-gifting', name: 'Gifting', slug: 'gifting', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 2 },
  { legacyKey: 'nav-electronics', name: 'Electronics', slug: 'electronics', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 3 },
  { legacyKey: 'nav-jewellery', name: 'Jewellery', slug: 'jewellery', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 4 },
  { legacyKey: 'nav-toys', name: 'Toys', slug: 'toys', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 5 },
  { legacyKey: 'nav-stationery', name: 'Stationery', slug: 'stationery', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 6 },
  { legacyKey: 'nav-fashion', name: 'Fashion', slug: 'fashion', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 7 },
  { legacyKey: 'nav-electrical', name: 'Electrical', slug: 'electrical', flows: [COMMERCE_FLOWS.STANDARD], sortOrder: 8 },
];

const QUICK_SHOP_GROUPS = [
  {
    legacyKey: 'qs-grocery',
    name: 'Grocery',
    children: [
      'Fruits & Vegetables',
      'Atta, Rice & Dal',
      'Oil, Ghee & Masala',
      'Dairy, Bread & Eggs',
      'Cereals & Dry Fruits',
      'Chicken, Meat & Fish',
      'Instant & Frozen Food',
    ],
  },
  {
    legacyKey: 'qs-snacks-drinks',
    name: 'Snacks & Drinks',
    children: [
      'Chips & Namkeens',
      'Ice Creams',
      'Drinks & Juices',
      'Sweets & Chocolates',
      'Tea, Coffee & Milk Drinks',
      'Bakery & Biscuits',
      'Sauces & Spreads',
    ],
  },
  {
    legacyKey: 'qs-beauty-personal',
    name: 'Beauty & Personal Care',
    children: [
      'Bath, Body & Grooming',
      'Baby Care',
      'Hair Care',
      'Healthcare & Pharma',
      'Wellness & Hygiene',
      'Beauty & Fragrances',
    ],
  },
  {
    legacyKey: 'qs-household',
    name: 'Household, Stationery & Lifestyle',
    children: [
      'Cleaning Essentials',
      'Stationery Supplies',
      'Toys & Games',
      'Sports & Fitness',
      'Home & Kitchen',
      'Electricals & Tools',
      'Fashion Accessories',
      'Pet Supplies',
    ],
  },
  {
    legacyKey: 'qs-mobiles-electronics',
    name: 'Mobiles & Electronics',
    children: ['Mobiles', 'Electronics & Gadgets', 'Audio & Smart Watches'],
  },
];

const MITHILA_CATEGORIES = [
  { legacyKey: 'mithila-festival', name: 'Mithila Festival & Cultural' },
  { legacyKey: 'mithila-paridhan', name: 'Mithila Paridhan' },
  { legacyKey: 'mithila-cuisines', name: 'Mithila Special Cuisines' },
  { legacyKey: 'mithila-bangles', name: 'Mithila Lac Bangles' },
  { legacyKey: 'mithila-handcrafted', name: 'Mithila Handcrafted Items' },
  { legacyKey: 'mithila-pooja', name: 'Mithila Pooja Needs' },
  { legacyKey: 'mithila-books', name: 'Mithila Books & Panchang' },
  { legacyKey: 'mithila-achaar', name: 'Mithila Achaar' },
];

const BANNERS = [
  { legacyKey: 'banner-summer-sale', title: 'Summer Sale', linkUrl: '/vendor/deals' },
  { legacyKey: 'banner-new-arrivals', title: 'New Arrivals', linkUrl: '/vendor/home' },
  { legacyKey: 'banner-electronics-deal', title: 'Electronics Deal', linkUrl: '/vendor/category-products?category=Electronics' },
  { legacyKey: 'banner-grocery-offers', title: 'Grocery Offers', linkUrl: '/vendor/quick-shop' },
];

const PRODUCT_SEEDS = [
  { legacyKey: 'product-beauty-face-cream', sku: 'MK-P3-BTY-001', title: 'Herbal Glow Face Cream', price: 349, mrp: 499, categorySlug: 'beauty', flows: [COMMERCE_FLOWS.STANDARD], brand: 'GlowCare', tags: ['beauty'] },
  { legacyKey: 'product-gift-hamper', sku: 'MK-P3-GFT-001', title: 'Premium Gift Hamper', price: 1299, mrp: 1899, categorySlug: 'gifting', flows: [COMMERCE_FLOWS.STANDARD], brand: 'Mithila Gifts', tags: ['gifting'] },
  { legacyKey: 'product-wireless-earbuds', sku: 'MK-P3-ELC-001', title: 'Wireless Earbuds Pro', price: 1499, mrp: 2999, categorySlug: 'electronics', flows: [COMMERCE_FLOWS.STANDARD], brand: 'SoundMax', tags: ['electronics'] },
  { legacyKey: 'product-jewellery-set', sku: 'MK-P3-JWL-001', title: 'Art Jewellery Set', price: 899, mrp: 1499, categorySlug: 'jewellery', flows: [COMMERCE_FLOWS.STANDARD], brand: 'Mithila Craft', tags: ['jewellery'] },
  { legacyKey: 'product-wooden-puzzle', sku: 'MK-P3-TYS-001', title: 'Wooden Learning Puzzle Set', price: 599, mrp: 799, categorySlug: 'toys', flows: [COMMERCE_FLOWS.STANDARD], brand: 'PlayCraft', tags: ['toys'] },
  { legacyKey: 'product-notebook-set', sku: 'MK-P3-STN-001', title: 'Premium Notebook Set', price: 249, mrp: 399, categorySlug: 'stationery', flows: [COMMERCE_FLOWS.STANDARD], brand: 'WriteWell', tags: ['stationery'] },
  { legacyKey: 'product-cotton-kurta', sku: 'MK-P3-FSH-001', title: 'Trendy Cotton Kurta', price: 799, mrp: 1299, categorySlug: 'fashion', flows: [COMMERCE_FLOWS.STANDARD], brand: 'Ethnic Lane', tags: ['fashion'] },
  { legacyKey: 'product-led-lamp', sku: 'MK-P3-ELT-001', title: 'LED Desk Lamp', price: 699, mrp: 999, categorySlug: 'electrical', flows: [COMMERCE_FLOWS.STANDARD], brand: 'BrightHome', tags: ['electrical'] },
  { legacyKey: 'product-madhubani-wall-art', sku: 'MK-P3-MTH-001', title: 'Madhubani Wall Art', price: 899, mrp: 1299, categorySlug: 'mithila-handcrafted-items', flows: [COMMERCE_FLOWS.MITHILAK, COMMERCE_FLOWS.STANDARD], brand: 'Mithila Heritage', tags: ['madhubani', 'art'] },
  { legacyKey: 'product-handpainted-pot', sku: 'MK-P3-MTH-002', title: 'Handpainted Pot', price: 699, mrp: 999, categorySlug: 'mithila-handcrafted-items', flows: [COMMERCE_FLOWS.MITHILAK], brand: 'Mithila Heritage', tags: ['handicraft'] },
  { legacyKey: 'product-mithila-jewellery', sku: 'MK-P3-MTH-003', title: 'Mithila Jewellery Set', price: 499, mrp: 799, categorySlug: 'mithila-lac-bangles', flows: [COMMERCE_FLOWS.MITHILAK], brand: 'Mithila Heritage', tags: ['jewellery'] },
  { legacyKey: 'product-basmati-rice', sku: 'MK-P3-QS-001', title: 'Organic Basmati Rice 5kg', price: 499, mrp: 650, categorySlug: 'atta-rice-dal', flows: [COMMERCE_FLOWS.QUICK_SHOP, COMMERCE_FLOWS.FRESH_GROCERY], brand: 'Fresh Farm', tags: ['grocery'] },
  { legacyKey: 'product-snacks-bundle', sku: 'MK-P3-QS-002', title: 'Instant Snacks Bundle', price: 149, mrp: 220, categorySlug: 'chips-namkeens', flows: [COMMERCE_FLOWS.QUICK_SHOP], brand: 'QuickMart', tags: ['snacks'] },
  { legacyKey: 'product-veggies-pack', sku: 'MK-P3-QS-003', title: 'Fresh Seasonal Vegetables Pack', price: 199, mrp: 280, categorySlug: 'fruits-vegetables', flows: [COMMERCE_FLOWS.QUICK_SHOP, COMMERCE_FLOWS.FRESH_GROCERY], brand: 'Green Basket', tags: ['vegetables'] },
];

async function upsertCategory(categoryService, categoryRepository, checklist, entry, parentId = null) {
  const existing = await categoryRepository.findBySlug(entry.slug);
  if (existing && !existing.deletedAt) {
    checklist.categories[entry.legacyKey] = {
      oldLabel: entry.name,
      id: String(existing._id),
      slug: existing.slug,
      action: 'existing',
    };
    return existing;
  }

  const created = await categoryService.create({
    name: entry.name,
    slug: entry.slug,
    parentId,
    imageUrl: entry.imageUrl || SAMPLE_IMAGE,
    iconUrl: entry.iconUrl || null,
    sortOrder: entry.sortOrder ?? 0,
    isActive: true,
    commerceFlows: entry.flows || [COMMERCE_FLOWS.STANDARD],
    description: entry.description || '',
  });

  checklist.categories[entry.legacyKey] = {
    oldLabel: entry.name,
    id: String(created._id),
    slug: created.slug,
    action: 'created',
  };

  return created;
}

async function upsertChip(cmsService, categoryChipRepository, checklist, { legacyKey, label, categoryId, commerceFlow, sortOrder }) {
  const existing = await categoryChipRepository.findOne({
    label,
    commerceFlow,
    deletedAt: null,
  });

  if (existing) {
    checklist.chips[legacyKey] = {
      oldLabel: label,
      id: String(existing._id),
      categoryId: existing.categoryId ? String(existing.categoryId) : null,
      action: 'existing',
    };
    return existing;
  }

  const created = await cmsService.createChip({
    label,
    categoryId: categoryId || null,
    commerceFlow,
    sortOrder,
    isActive: true,
    imageUrl: SAMPLE_IMAGE,
  });

  checklist.chips[legacyKey] = {
    oldLabel: label,
    id: String(created._id),
    categoryId: categoryId ? String(categoryId) : null,
    action: 'created',
  };

  return created;
}

async function upsertBanner(cmsService, bannerRepository, checklist, entry, commerceFlow) {
  const existing = await bannerRepository.findOne({
    title: entry.title,
    commerceFlow,
    deletedAt: null,
  });

  if (existing) {
    checklist.banners[entry.legacyKey] = {
      oldLabel: entry.title,
      id: String(existing._id),
      action: 'existing',
    };
    return existing;
  }

  const created = await cmsService.createBanner({
    title: entry.title,
    imageUrl: SAMPLE_IMAGE,
    linkUrl: entry.linkUrl,
    commerceFlow,
    sortOrder: entry.sortOrder ?? 0,
    isActive: true,
  });

  checklist.banners[entry.legacyKey] = {
    oldLabel: entry.title,
    id: String(created._id),
    action: 'created',
  };

  return created;
}

async function upsertProduct(services, checklist, sellerId, adminId, seed, categoryBySlug) {
  const category = categoryBySlug.get(seed.categorySlug);
  if (!category) {
    throw new Error(`Category slug not found for product ${seed.sku}: ${seed.categorySlug}`);
  }

  const existing = await services.repositories.productRepository.findOne({ sku: seed.sku, deletedAt: null });
  if (existing) {
    if (existing.status !== PRODUCT_STATUS.APPROVED) {
      await services.productService.approve(String(existing._id), adminId);
    }
    checklist.products[seed.legacyKey] = {
      oldLabel: seed.title,
      id: String(existing._id),
      sku: seed.sku,
      categoryId: String(category._id),
      action: 'existing',
    };
    return existing;
  }

  const product = await services.sellerProductService.create(sellerId, {
    title: seed.title,
    description: `${seed.title} — authentic seller listing on Mithilakart.`,
    sku: seed.sku,
    price: seed.price,
    mrp: seed.mrp,
    stock: seed.stock ?? 50,
    categoryId: category._id,
    images: [{ url: SAMPLE_IMAGE, alt: seed.title, sortOrder: 0 }],
    tags: seed.tags || [],
    commerceFlows: seed.flows,
    brand: seed.brand || 'Mithilakart',
  });

  await services.productService.approve(String(product._id), adminId);

  checklist.products[seed.legacyKey] = {
    oldLabel: seed.title,
    id: String(product._id),
    sku: seed.sku,
    categoryId: String(category._id),
    action: 'created',
  };

  return product;
}

async function migratePhase3() {
  await connectDatabase();
  await connectRedis(config);
  registerProvider('storage', new LocalStorageProvider());

  const container = getContainer();
  const { categoryService, cmsService, sellerProductService, productService } = container.services;
  const { categoryRepository, categoryChipRepository, bannerRepository, productRepository } = container.repositories;

  const seller = await Seller.findOne({ email: 'seller@mithilakart.com', deletedAt: null });
  if (!seller) {
    throw new Error('Seed seller not found. Run npm run seed:auth first.');
  }

  const admin = await AdminUser.findOne({ email: 'admin@mithilakart.com', deletedAt: null });
  if (!admin) {
    throw new Error('Seed admin not found. Run npm run seed:auth first.');
  }

  const checklist = {
    migratedAt: new Date().toISOString(),
    categories: {},
    chips: {},
    banners: {},
    products: {},
    homeSections: {},
  };

  const categoryBySlug = new Map();

  process.stdout.write('Creating standard nav categories...\n');
  for (const entry of STANDARD_NAV) {
    if (entry.chipOnly) continue;
    const cat = await upsertCategory(categoryService, categoryRepository, checklist, entry);
    categoryBySlug.set(entry.slug, cat);
  }

  process.stdout.write('Creating Mithila categories...\n');
  const mithilaParent = await upsertCategory(
    categoryService,
    categoryRepository,
    checklist,
    {
      legacyKey: 'mithila-specialities',
      name: 'Mithila Specialities',
      slug: 'mithila-specialities',
      flows: [COMMERCE_FLOWS.MITHILAK],
      sortOrder: 0,
    }
  );
  categoryBySlug.set('mithila-specialities', mithilaParent);

  for (const [index, entry] of MITHILA_CATEGORIES.entries()) {
    const slug = slugify(entry.name);
    const cat = await upsertCategory(
      categoryService,
      categoryRepository,
      checklist,
      {
        legacyKey: entry.legacyKey,
        name: entry.name,
        slug,
        flows: [COMMERCE_FLOWS.MITHILAK],
        sortOrder: index,
      },
      mithilaParent._id
    );
    categoryBySlug.set(slug, cat);
  }

  process.stdout.write('Creating Quick Shop category tree...\n');
  for (const [groupIndex, group] of QUICK_SHOP_GROUPS.entries()) {
    const parentSlug = slugify(group.name);
    const parent = await upsertCategory(
      categoryService,
      categoryRepository,
      checklist,
      {
        legacyKey: group.legacyKey,
        name: group.name,
        slug: parentSlug,
        flows: [COMMERCE_FLOWS.QUICK_SHOP, COMMERCE_FLOWS.FRESH_GROCERY],
        sortOrder: groupIndex,
      }
    );
    categoryBySlug.set(parentSlug, parent);

    for (const [childIndex, childName] of group.children.entries()) {
      const childSlug = slugify(childName);
      const child = await upsertCategory(
        categoryService,
        categoryRepository,
        checklist,
        {
          legacyKey: `${group.legacyKey}-${childSlug}`,
          name: childName,
          slug: childSlug,
          flows: [COMMERCE_FLOWS.QUICK_SHOP, COMMERCE_FLOWS.FRESH_GROCERY],
          sortOrder: childIndex,
        },
        parent._id
      );
      categoryBySlug.set(childSlug, child);
    }
  }

  process.stdout.write('Creating nav chips...\n');
  for (const [index, entry] of STANDARD_NAV.entries()) {
    const category = entry.chipOnly ? null : categoryBySlug.get(entry.slug);
    await upsertChip(cmsService, categoryChipRepository, checklist, {
      legacyKey: entry.legacyKey,
      label: entry.name,
      categoryId: category?._id || null,
      commerceFlow: COMMERCE_FLOWS.STANDARD,
      sortOrder: index,
    });
  }

  process.stdout.write('Creating banners...\n');
  for (const [index, banner] of BANNERS.entries()) {
    await upsertBanner(cmsService, bannerRepository, checklist, { ...banner, sortOrder: index }, COMMERCE_FLOWS.STANDARD);
    await upsertBanner(cmsService, bannerRepository, checklist, { ...banner, sortOrder: index, legacyKey: `${banner.legacyKey}-mithilak` }, COMMERCE_FLOWS.MITHILAK);
    await upsertBanner(cmsService, bannerRepository, checklist, { ...banner, sortOrder: index, legacyKey: `${banner.legacyKey}-quick-shop` }, COMMERCE_FLOWS.QUICK_SHOP);
  }

  process.stdout.write('Creating products via seller flow + admin approval...\n');
  const services = {
    categoryService,
    cmsService,
    sellerProductService,
    productService,
    repositories: { productRepository },
  };

  const createdProducts = [];
  for (const seed of PRODUCT_SEEDS) {
    const product = await upsertProduct(services, checklist, String(seller._id), String(admin._id), seed, categoryBySlug);
    createdProducts.push(product);
  }

  process.stdout.write('Creating home sections...\n');
  const standardProductIds = createdProducts
    .filter((p) => (p.commerceFlows || []).includes(COMMERCE_FLOWS.STANDARD))
    .map((p) => p._id);

  const mithilakProductIds = createdProducts
    .filter((p) => (p.commerceFlows || []).includes(COMMERCE_FLOWS.MITHILAK))
    .map((p) => p._id);

  const quickShopProductIds = createdProducts
    .filter((p) => (p.commerceFlows || []).includes(COMMERCE_FLOWS.QUICK_SHOP))
    .map((p) => p._id);

  const sectionFlows = [
    { flow: COMMERCE_FLOWS.STANDARD, productIds: standardProductIds },
    { flow: COMMERCE_FLOWS.MITHILAK, productIds: mithilakProductIds },
    { flow: COMMERCE_FLOWS.QUICK_SHOP, productIds: quickShopProductIds },
  ];

  for (const { flow, productIds } of sectionFlows) {
    for (const [index, sectionKey] of HOME_SECTION_KEYS.entries()) {
      const section = await cmsService.updateSection(sectionKey, flow, {
        title: sectionKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        productIds,
        isActive: true,
        sortOrder: index,
      });
      checklist.homeSections[`${flow}:${sectionKey}`] = {
        id: String(section._id),
        sectionKey,
        commerceFlow: flow,
        productCount: productIds.length,
        action: 'upserted',
      };
    }
  }

  const docsDir = path.join(__dirname, '..', '..', 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  const checklistPath = path.join(docsDir, 'phase3-migration-checklist.json');
  fs.writeFileSync(checklistPath, JSON.stringify(checklist, null, 2));

  process.stdout.write(`Phase 3 migration complete.\n`);
  process.stdout.write(`Checklist written to ${checklistPath}\n`);
  process.stdout.write(`Categories: ${Object.keys(checklist.categories).length}\n`);
  process.stdout.write(`Chips: ${Object.keys(checklist.chips).length}\n`);
  process.stdout.write(`Banners: ${Object.keys(checklist.banners).length}\n`);
  process.stdout.write(`Products: ${Object.keys(checklist.products).length}\n`);

  await disconnectDatabase();
  await disconnectRedis();
}

migratePhase3().catch(async (error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  try {
    await disconnectDatabase();
    await disconnectRedis();
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});

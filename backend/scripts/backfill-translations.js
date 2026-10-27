require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../src/config');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { TranslationService } = require('../src/services/translation/TranslationService');

async function backfill() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(config.mongodb.uri, { autoIndex: false });
  console.log('Connected to MongoDB.');

  const translationService = new TranslationService();

  // 1. Backfill Categories
  const categories = await Category.find({ deletedAt: null });
  console.log(`Found ${categories.length} categories to check.`);
  let catUpdated = 0;

  for (const cat of categories) {
    if (!cat.translations?.hi?.name || !cat.translations?.mai?.name) {
      try {
        console.log(`Translating Category: "${cat.name}"...`);
        const trans = await translationService.translateFields({
          name: cat.name,
          description: cat.description || '',
        });
        cat.translations = { ...(cat.translations || {}), ...trans };
        cat.markModified('translations');
        await cat.save();
        catUpdated++;
      } catch (err) {
        console.warn(`Failed to translate category ${cat.name}:`, err.message);
      }
    }
  }
  console.log(`Updated ${catUpdated} categories with translations.`);

  // 2. Backfill Products (batch top 20 or all)
  const products = await Product.find({ deletedAt: null }).limit(50);
  console.log(`Found ${products.length} products to check.`);
  let prodUpdated = 0;

  for (const prod of products) {
    if (!prod.translations?.hi?.title || !prod.translations?.mai?.title) {
      try {
        console.log(`Translating Product: "${prod.title}"...`);
        const trans = await translationService.translateFields({
          title: prod.title,
          description: prod.description || '',
        });
        prod.translations = { ...(prod.translations || {}), ...trans };
        prod.markModified('translations');
        await prod.save();
        prodUpdated++;
      } catch (err) {
        console.warn(`Failed to translate product ${prod.title}:`, err.message);
      }
    }
  }
  console.log(`Updated ${prodUpdated} products with translations.`);

  await mongoose.disconnect();
  console.log('Migration completed successfully.');
}

backfill().catch((err) => {
  console.error('Backfill error:', err);
  process.exit(1);
});

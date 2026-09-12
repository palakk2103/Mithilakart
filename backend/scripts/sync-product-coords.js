require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Seller = require('../src/models/Seller');

async function sync() {
  await mongoose.connect(process.env.MONGODB_URI);
  const sellers = await Seller.find({ latitude: { $ne: null } }).lean();
  for (const s of sellers) {
    const res = await Product.updateMany(
      { sellerId: s._id },
      {
        $set: {
          pickupCoordinates: { latitude: s.latitude, longitude: s.longitude },
          pickupAddress: s.addressLine || s.geocodedAddress,
          city: s.city,
        },
      }
    );
    console.log('Synced seller', s.storeName, 'products updated:', res.modifiedCount);
  }
  const mobile = await Product.findOne({ title: /mobile/i }).lean();
  console.log('Updated mobile product:', JSON.stringify({
    title: mobile?.title,
    commerceFlows: mobile?.commerceFlows,
    pickupCoordinates: mobile?.pickupCoordinates,
    city: mobile?.city
  }, null, 2));
  await mongoose.disconnect();
}

sync().catch(console.error);

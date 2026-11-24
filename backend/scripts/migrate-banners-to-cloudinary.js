// Moves banner images stored on local disk (/uploads/...) to Cloudinary and rewrites imageUrl.
// Usage: node scripts/migrate-banners-to-cloudinary.js [--dry-run]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const dryRun = process.argv.includes('--dry-run');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.db.collection('banners');
  const banners = await col.find({ imageUrl: { $regex: '^/uploads/' } }).toArray();
  fs.writeFileSync(path.join(__dirname, `banners-backup-${Date.now()}.json`), JSON.stringify(banners, null, 2));

  for (const b of banners) {
    const rel = b.imageUrl.replace(/^\/uploads\//, '');
    const file = path.join(__dirname, '..', 'uploads', rel);
    if (!fs.existsSync(file)) { console.log(`SKIP (file missing) ${b.title}: ${b.imageUrl}`); continue; }
    const publicId = rel.replace(/\.[^.]+$/, '');
    if (dryRun) { console.log(`WOULD upload ${b.title}: ${file}`); continue; }
    const res = await cloudinary.uploader.upload(file, { public_id: publicId, overwrite: true, resource_type: 'image' });
    await col.updateOne({ _id: b._id }, { $set: { imageUrl: res.secure_url } });
    console.log(`OK ${b.title}: ${res.secure_url}`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });

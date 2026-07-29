const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../src/config');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: config.storage.cloudinary.cloudName,
  api_key: config.storage.cloudinary.apiKey,
  api_secret: config.storage.cloudinary.apiSecret,
});

async function run() {
  try {
    console.log('Listing resources...');
    const res = await cloudinary.api.resources({ max_results: 1 });
    console.log('Resources:', res);
  } catch (err) {
    console.error('List resources failed:', err);
  }
}

run();

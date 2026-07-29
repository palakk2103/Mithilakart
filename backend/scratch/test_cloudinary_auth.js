const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../src/config');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: config.storage.cloudinary.cloudName,
  api_key: config.storage.cloudinary.apiKey,
  api_secret: config.storage.cloudinary.apiSecret,
});

async function checkAuth() {
  try {
    console.log('Pinging Cloudinary API...');
    const result = await cloudinary.api.ping();
    console.log('Ping result:', result);
  } catch (err) {
    console.error('Ping failed:', err);
  }
}

checkAuth();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../src/config');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: config.storage.cloudinary.cloudName,
  api_key: config.storage.cloudinary.apiKey,
  api_secret: config.storage.cloudinary.apiSecret,
});

const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const buffer = Buffer.from(base64Png, 'base64');

async function testWithOptions(options, label) {
  try {
    console.log(`--- Testing ${label} with options:`, options);
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
    console.log(`${label} SUCCESS:`, result.secure_url);
  } catch (err) {
    console.error(`${label} FAILED:`, err.message || err);
  }
}

async function run() {
  // Test 1: no options at all (plain upload of a valid PNG)
  await testWithOptions({}, 'No options');

  // Test 2: only public_id (no resource_type)
  await testWithOptions({ public_id: 'test_public_id_only' }, 'Only public_id');

  // Test 3: public_id and resource_type: 'image'
  await testWithOptions({ public_id: 'test_image_type', resource_type: 'image' }, 'public_id + image type');

  // Test 4: public_id and resource_type: 'auto'
  await testWithOptions({ public_id: 'test_auto_type', resource_type: 'auto' }, 'public_id + auto type');
}

run();

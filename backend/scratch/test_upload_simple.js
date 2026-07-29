const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../src/config');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: config.storage.cloudinary.cloudName,
  api_key: config.storage.cloudinary.apiKey,
  api_secret: config.storage.cloudinary.apiSecret,
});

async function testSimple() {
  try {
    console.log('Testing simple upload...');
    const buffer = Buffer.from('dummy file content');
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
  } catch (err) {
    console.error('Simple upload failed:', err);
  }
}

testSimple()
  .then(res => console.log('Simple upload success:', res))
  .catch(err => console.error('Simple upload failed outer:', err));

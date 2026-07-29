const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../src/config');
const crypto = require('crypto');

// Cloudinary credentials
const cloudName = config.storage.cloudinary.cloudName;
const apiKey = config.storage.cloudinary.apiKey;
const apiSecret = config.storage.cloudinary.apiSecret;

// Manual upload function
async function manualUpload() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const publicId = 'test_manual_1x1';
  
  // Create signature
  // Sign parameters in alphabetical order: public_id, timestamp
  const paramString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramString).digest('hex');

  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const fileData = `data:image/png;base64,${base64Png}`;

  const bodyData = new URLSearchParams({
    file: fileData,
    api_key: apiKey,
    timestamp: timestamp.toString(),
    public_id: publicId,
    signature: signature,
  });

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log('Sending manual signed upload to:', url);

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: bodyData,
    });
    
    console.log('Status code:', res.status);
    console.log('Headers:', [...res.headers.entries()]);
    const responseText = await res.text();
    console.log('Response text:', responseText);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

manualUpload();

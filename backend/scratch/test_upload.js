const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../src/config');
const { CloudinaryStorageProvider } = require('../src/core/providers/CloudinaryStorageProvider');

async function test() {
  try {
    console.log('Config:', config.storage);
    const provider = new CloudinaryStorageProvider(config.storage.cloudinary);
    const buffer = Buffer.from('dummy file content for testing upload');
    const storageKey = 'cms/test-uuid.txt';
    console.log('Writing local file (uploading to Cloudinary)...');
    const result = await provider.writeLocalFile(storageKey, buffer);
    console.log('Upload result:', result);
    console.log('Confirming upload...');
    const confirmed = await provider.confirmUpload({ storageKey, mimeType: 'text/plain' });
    console.log('Confirmed:', confirmed);
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

test();

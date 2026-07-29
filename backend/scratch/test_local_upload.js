const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../src/config');
const { LocalStorageProvider } = require('../src/core/providers/LocalStorageProvider');

async function testLocal() {
  try {
    const provider = new LocalStorageProvider();
    const buffer = Buffer.from('dummy file content for testing local upload');
    const storageKey = 'cms/test-local-uuid.txt';
    console.log('Writing local file...');
    const result = await provider.writeLocalFile(storageKey, buffer);
    console.log('Write local file result:', result);
    console.log('Confirming upload...');
    const confirmed = await provider.confirmUpload({ storageKey, mimeType: 'text/plain' });
    console.log('Confirmed:', confirmed);
  } catch (err) {
    console.error('Local upload failed:', err);
  }
}

testLocal();

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const request = require('supertest');
const { buildContainer } = require('../src/bootstrap/container');
const express = require('express');

async function run() {
  try {
    console.log('Initializing app container...');
    const container = buildContainer();
    const app = express();
    
    app.use(express.json());
    app.use('/api/v1/uploads', container.routes.uploads);
    
    app.use((err, req, res, next) => {
      console.error('SERVER ERROR LOGGED IN TEST:', err);
      res.status(500).json({ error: err.message, stack: err.stack });
    });

    console.log('1. Calling presign...');
    const presignRes = await request(app)
      .post('/api/v1/uploads/presign')
      .send({
        context: 'cms',
        fileName: 'test.png',
        mimeType: 'image/png'
      });
    
    console.log('Presign Response:', presignRes.status, presignRes.body);
    if (presignRes.status !== 200) {
      throw new Error('Presign failed');
    }

    const { uploadUrl, storageKey } = presignRes.body.data;

    console.log('2. Uploading local file...');
    const buffer = Buffer.from('dummy image content');
    const uploadRes = await request(app)
      .post(uploadUrl)
      .attach('file', buffer, 'test.png');
      
    console.log('Upload Response:', uploadRes.status, uploadRes.body);
    if (uploadRes.status !== 200) {
      throw new Error('Upload failed');
    }

    console.log('3. Calling confirm...');
    const confirmRes = await request(app)
      .post('/api/v1/uploads/confirm')
      .send({
        context: 'cms',
        storageKey: storageKey,
        mimeType: 'image/png'
      });

    console.log('Confirm Response Status:', confirmRes.status);
    console.log('Confirm Response Body:', confirmRes.body);

  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

run();

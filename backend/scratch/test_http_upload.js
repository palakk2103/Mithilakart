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
    
    // Setup body parsers, routes, error handlers similarly to app.js
    app.use(express.json());
    app.use('/api/v1/uploads', container.routes.uploads);
    
    // Error handler to log full error
    app.use((err, req, res, next) => {
      console.error('SERVER ERROR LOGGED IN TEST:', err);
      res.status(500).json({ error: err.message, stack: err.stack });
    });

    const buffer = Buffer.from('dummy image content');
    const storageKey = 'cms/test-http-uuid.png';

    console.log('Sending mock POST request to local upload route...');
    const response = await request(app)
      .post(`/api/v1/uploads/local/${encodeURIComponent(storageKey)}`)
      .attach('file', buffer, 'test.png');

    console.log('Response Status:', response.status);
    console.log('Response Body:', response.body);
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

run();

require('dotenv').config();

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.REDIS_USE_MEMORY = 'true';
process.env.SHIPPING_PROVIDER = 'mock';
process.env.PAYMENT_PROVIDER = 'mock';

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/mithilakart_test';
}

jest.setTimeout(30000);

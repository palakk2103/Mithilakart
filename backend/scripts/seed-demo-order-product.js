/**
 * Adds one approved test product to seed seller for E2E order testing.
 * Usage: node scripts/seed-demo-order-product.js
 */
require('dotenv').config();

const BASE = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

async function req(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || data?.message || res.statusText;
    throw new Error(`${method} ${path} failed (${res.status}): ${message}`);
  }

  return data?.data ?? data;
}

async function main() {
  const sellerLogin = await req('POST', '/seller/auth/login', {
    body: { email: 'seller@mithilakart.com', password: 'Seller@12345', deviceId: 'seed-demo-product' },
  });
  const sellerToken = sellerLogin?.tokens?.accessToken;
  if (!sellerToken) throw new Error('Seller login failed');

  const categories = await req('GET', '/categories?commerceFlow=standard', { token: sellerToken });
  const category = (Array.isArray(categories) ? categories : categories?.items || [])[0];
  if (!category?.id && !category?._id) {
    throw new Error('No category found — run npm run seed:catalog first');
  }
  const categoryId = category.id || category._id;

  const sku = `MK-DEMO-${Date.now().toString().slice(-6)}`;
  const productPayload = {
    title: 'Demo Order Product — Mithila Handicraft',
    description: 'Test product for customer → seller → delivery order flow.',
    sku,
    price: 299,
    mrp: 499,
    stock: 100,
    categoryId,
    brand: 'Mithila Heritage',
    commerceFlows: ['standard', 'quick_shop'],
    tags: ['demo', 'handicraft', 'test'],
    images: [{
      url: 'https://via.placeholder.com/600x600.png?text=Demo+Product',
      alt: 'Demo Order Product',
      sortOrder: 0,
    }],
  };

  const created = await req('POST', '/seller/products', {
    token: sellerToken,
    body: productPayload,
  });

  const productId = created?.id || created?._id;
  if (!productId) throw new Error('Product create did not return id');

  const adminLogin = await req('POST', '/admin/auth/login', {
    body: { email: 'admin@mithilakart.com', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345' },
  });
  const adminToken = adminLogin?.tokens?.accessToken;
  if (!adminToken) throw new Error('Admin login failed');

  await req('PATCH', `/admin/products/${productId}/approve`, { token: adminToken });

  process.stdout.write('\n=== Demo order product ready ===\n');
  process.stdout.write(`Product ID: ${productId}\n`);
  process.stdout.write(`SKU: ${sku}\n`);
  process.stdout.write(`Title: ${productPayload.title}\n`);
  process.stdout.write(`Price: ₹${productPayload.price} | Stock: ${productPayload.stock}\n`);
  process.stdout.write(`Seller: seller@mithilakart.com / Seller@12345\n`);
  process.stdout.write(`Customer URL: http://localhost:3000/vendor/product-detail (search "${productPayload.title}")\n`);
  process.stdout.write(`Or open: http://localhost:3000/vendor/home\n\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});

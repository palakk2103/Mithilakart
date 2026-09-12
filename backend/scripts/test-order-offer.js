require('dotenv').config();
const mongoose = require('mongoose');
const { getContainer } = require('../src/bootstrap/container');
const Product = require('../src/models/Product');
const Seller = require('../src/models/Seller');
const User = require('../src/models/User');
const UserAddress = require('../src/models/UserAddress');
const Order = require('../src/models/Order');
const OrderFulfillment = require('../src/models/OrderFulfillment');
const FulfillmentAttempt = require('../src/models/FulfillmentAttempt');

const { connectRedis } = require('../src/config/redis');
const config = require('../src/config');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  await connectRedis(config);
  const container = getContainer();

  // 1. Get mobile product and seller
  const product = await Product.findOne({ title: /mobile/i });
  console.log('Product:', product.title, 'Price:', product.price, 'Tab:', product.commerceFlows, 'Coords:', product.pickupCoordinates);

  const seller = await Seller.findById(product.sellerId);
  console.log('Seller:', seller.name, 'Store:', seller.storeName, 'Online:', seller.isOnline, 'Coords:', seller.latitude, seller.longitude);

  // 2. Find a test user and test address in Indore (near Palasia Square: 22.7248, 75.8839)
  let user = await User.findOne({ email: /test/i }) || await User.findOne({});
  let address = await UserAddress.findOne({ userId: user._id });
  if (!address) {
    address = await UserAddress.create({
      userId: user._id,
      name: 'Test Customer',
      phone: '9876543210',
      addressLine: 'RNT Marg, South Tukoganj',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      latitude: 22.7196,
      longitude: 75.8577,
      isDefault: true,
    });
  } else {
    // Ensure coordinates are in Indore
    address.latitude = 22.7196;
    address.longitude = 75.8577;
    await address.save();
  }
  console.log('Customer Address:', address.addressLine, address.city, 'Coords:', address.latitude, address.longitude);

  // 3. Create order via orderService.placeOrder
  const orderResult = await container.services.orderService.placeOrder({
    userId: user._id,
    addressId: address._id,
    paymentMethod: 'cod',
    items: [
      { productId: String(product._id), quantity: 1 }
    ],
  });

  console.log('Order created:', orderResult.orderNumber, 'ID:', orderResult.orderId);

  // Wait 1.5s for async fulfillment engine to evaluate candidates and dispatch offer
  await new Promise(r => setTimeout(r, 1500));

  const orderDoc = await Order.findById(orderResult.orderId).lean();
  console.log('Order Doc:', {
    orderNumber: orderDoc.orderNumber,
    status: orderDoc.status,
    marketplaceTab: orderDoc.marketplaceTab,
    commerceFlow: orderDoc.commerceFlow,
    fulfilmentType: orderDoc.fulfilmentType,
  });

  const fulfillment = await OrderFulfillment.findOne({ orderId: orderResult.orderId }).lean();
  console.log('Order Fulfillment State:', fulfillment?.state, 'Attempts Count:', fulfillment?.attemptCount);

  const attempt = await FulfillmentAttempt.findOne({ orderId: orderResult.orderId }).lean();
  console.log('Fulfillment Attempt:', {
    candidateId: attempt?.candidateId,
    candidateType: attempt?.candidateType,
    state: attempt?.state,
    offeredAt: attempt?.offeredAt,
    expiresAt: attempt?.expiresAt,
  });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});

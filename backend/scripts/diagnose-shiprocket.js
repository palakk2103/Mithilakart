require('dotenv').config();
const { ShiprocketClient } = require('../src/core/providers/shipping/ShiprocketClient');
const { createShippingProvider } = require('../src/core/providers/shipping/createShippingProvider');
const config = require('../src/config');

async function testShiprocket() {
  console.log('=== SHIPROCKET CONFIGURATION DIAGNOSTIC ===');
  console.log('SHIPPING_PROVIDER:', process.env.SHIPPING_PROVIDER);
  console.log('SHIPROCKET_EMAIL:', process.env.SHIPROCKET_EMAIL ? `${process.env.SHIPROCKET_EMAIL.slice(0, 4)}***` : 'NOT SET');
  console.log('SHIPROCKET_PASSWORD:', process.env.SHIPROCKET_PASSWORD ? '********' : 'NOT SET');
  console.log('SHIPROCKET_PICKUP_LOCATION:', process.env.SHIPROCKET_PICKUP_LOCATION);
  console.log('SHIPROCKET_API_BASE_URL:', config.shiprocket.apiBaseUrl);

  const client = new ShiprocketClient({
    email: config.shiprocket.email,
    password: config.shiprocket.password,
    apiBaseUrl: config.shiprocket.apiBaseUrl,
  });

  console.log('\n--- Test 1: Testing Credentials & Authentication ---');
  try {
    const token = await client.getToken(true);
    console.log('✅ Authentication SUCCESS! Token obtained:', token.slice(0, 15) + '...');
    
    console.log('\n--- Test 2: Listing Registered Pickup Locations ---');
    try {
      const locations = await client.listPickupLocations({ forceRefresh: true });
      console.log('Registered Locations Count:', locations.length);
      console.log('Locations:', JSON.stringify(locations, null, 2));
    } catch (locErr) {
      console.error('❌ Failed to list pickup locations:', locErr.message, locErr.response || '');
    }

    console.log('\n--- Test 3: Checking Pincode Serviceability ---');
    try {
      const sResult = await client.checkServiceability({
        pickupPincode: 110001,
        deliveryPincode: 846004, // Darbhanga, Bihar
        weightKg: 0.5,
      });
      console.log('Serviceable:', sResult.serviceable);
      console.log('Available couriers count:', sResult.couriers?.length || 0);
    } catch (sErr) {
      console.error('❌ Serviceability check failed:', sErr.message, sErr.response || '');
    }

  } catch (authErr) {
    console.error('❌ Authentication FAILED:', authErr.message);
    if (authErr.response) {
      console.error('API Response details:', JSON.stringify(authErr.response, null, 2));
    }
    console.error('HTTP Status:', authErr.statusCode);
  }

  console.log('\n--- Test 4: Provider Initialization in Mithilakart ---');
  try {
    const provider = createShippingProvider(config.shipping.provider);
    console.log('Provider created:', provider.name, '(', provider.code, ')');
    console.log('Provider isEnabled:', typeof provider.isEnabled === 'function' ? provider.isEnabled() : 'N/A');

    console.log('\n--- Test 5: Simulating createShipment via Provider ---');
    try {
      const mockOrder = {
        orderId: '66e123456789012345678901',
        orderNumber: `ORD-TEST-${Date.now()}`,
        address: {
          name: 'Ramesh Kumar',
          phone: '9876543210',
          line1: 'Station Road, Mirzapur',
          city: 'Darbhanga',
          state: 'Bihar',
          pincode: '846004',
          email: 'customer@mithilakart.com',
        },
        items: [
          { name: 'Madhubani Fish Art Handpainted', sku: 'ART-MDF-01', quantity: 1, unitPrice: 850 }
        ],
        paymentMethod: 'cod',
        subtotal: 850,
      };

      const result = await provider.createShipment(mockOrder);
      console.log('✅ createShipment SUCCESS!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (shipErr) {
      console.error('❌ createShipment FAILED:', shipErr.message);
      if (shipErr.response) {
        console.error('Shiprocket Response:', JSON.stringify(shipErr.response, null, 2));
      }
      if (shipErr.errors) {
        console.error('Validation errors:', shipErr.errors);
      }
      console.error('Error stack:', shipErr.stack);
    }
    console.log('\n--- Test 6: Testing Mock Courier Provider (Fallback/Local dev) ---');
    const { MockCourierShippingProvider } = require('../src/core/providers/MockCourierShippingProvider');
    const mockProvider = new MockCourierShippingProvider();
    const mockResult = await mockProvider.createShipment({
      orderId: '66e123456789012345678902',
      orderNumber: 'ORD-TEST-MOCK-01',
      address: { city: 'Madhubani', pincode: '847211' },
      weightKg: 0.5,
    });
    console.log('✅ Mock Courier createShipment SUCCESS!');
    console.log('Mock AWB:', mockResult.awb);
    console.log('Mock Label:', mockResult.labelUrl);
    console.log('Mock Status:', mockResult.status);
  } catch (provErr) {
    console.error('❌ Provider creation failed:', provErr.message);
  }
}

testShiprocket().then(() => process.exit(0)).catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

require('dotenv').config();

const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const { GeocodingService } = require('../src/services/maps/GeocodingService');
const { NearbyService } = require('../src/services/maps/NearbyService');
const { SellerRepository } = require('../src/repositories/SellerRepository');
const { ProductRepository } = require('../src/repositories/ProductRepository');

async function main() {
  await connectDatabase();

  const geocoding = new GeocodingService();
  const nearby = new NearbyService({
    sellerRepository: new SellerRepository(),
    productRepository: new ProductRepository(),
    geocodingService: geocoding,
  });

  const lat = 22.7248;
  const lng = 75.8839;

  console.log('Maps enabled:', geocoding.isEnabled());

  const reverse = await nearby.reverseGeocode({ lat, lng });
  console.log('Reverse geocode:', reverse?.city, reverse?.formattedAddress?.slice(0, 60));

  const sellers = await nearby.nearbySellers({ lat, lng, radiusKm: 50 });
  console.log('Nearby sellers:', sellers.length, sellers[0]?.storeName || 'none');

  const products = await nearby.nearbyProducts({ lat, lng, radiusKm: 50, limit: 5 });
  console.log('Nearby products:', products.items.length, 'sellerCount:', products.sellerCount);

  await disconnectDatabase();
  console.log('Maps API test passed');
}

main().catch((err) => {
  console.error('Maps API test failed:', err.message);
  process.exit(1);
});

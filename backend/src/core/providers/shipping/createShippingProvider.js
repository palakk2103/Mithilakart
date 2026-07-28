const config = require('../../../config');
const { MockCourierShippingProvider } = require('../MockCourierShippingProvider');
const { ShiprocketShippingProvider } = require('./ShiprocketShippingProvider');
const { DelhiveryShippingProvider } = require('./DelhiveryShippingProvider');

const PROVIDERS = {
  mock: MockCourierShippingProvider,
  shiprocket: ShiprocketShippingProvider,
  delhivery: DelhiveryShippingProvider,
};

function createShippingProvider(providerName = 'mock') {
  const key = String(providerName || 'mock').toLowerCase();
  const ProviderClass = PROVIDERS[key] || MockCourierShippingProvider;

  if (key === 'shiprocket') {
    return new ShiprocketShippingProvider(config.shiprocket);
  }

  return new ProviderClass();
}

module.exports = { createShippingProvider, PROVIDERS };

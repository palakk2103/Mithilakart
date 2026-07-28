const { BaseCourierShippingProvider } = require('./BaseCourierShippingProvider');

class DelhiveryShippingProvider extends BaseCourierShippingProvider {
  constructor() {
    super('delhivery', 'Delhivery');
  }
}

module.exports = { DelhiveryShippingProvider };

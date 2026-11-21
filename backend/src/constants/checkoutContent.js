/**
 * CART-1/2/3 admin-editable content for the cart, summary and payment steps.
 *
 * Offers and ratings are claims to customers, so they ship OFF / empty: the
 * cashback banner and payment-offer lines appear only once an admin enters a
 * real offer, and the rating only once an admin enters the real figure.
 */
const CART_RAIL_SOURCES = [
  'recently_viewed', // products this customer opened (sent by the app)
  'bestsellers', // most units sold in the tab, last 30 days
  'highly_ordered', // in the most orders, last 90 days
  'price_drops', // biggest % off MRP
  'new_arrivals', // newest live listings
  'order_again', // this customer's past orders
  'missed', // past orders that are not in the cart now
  'brands_in_trend', // products of the best-selling brands
  'recommended', // same categories as the cart
  'wishlist', // this customer's wishlist
  'budget', // at or below maxPrice
  'manual', // productIds picked by the admin
];

const DEFAULT_CART_RAILS = {
  itemsPerRail: 10,
  rails: [
    { key: 'recently_viewed', title: 'Recently Viewed Products', enabled: true, source: 'recently_viewed' },
    {
      key: 'bestsellers',
      title: 'Bestsellers',
      enabled: true,
      source: 'bestsellers',
      subTabs: [
        { key: 'bestsellers', title: 'Bestsellers', enabled: true, source: 'bestsellers' },
        { key: 'price_drops', title: 'Price Drops', enabled: true, source: 'price_drops' },
        { key: 'order_again', title: 'Order Again', enabled: true, source: 'order_again' },
        { key: 'brands_in_trend', title: 'Brands in Trend', enabled: true, source: 'brands_in_trend' },
        { key: 'festival', title: 'Chhath Puja', enabled: false, source: 'manual', productIds: [] },
        { key: 'new_arrivals', title: 'New Arrivals', enabled: true, source: 'new_arrivals' },
      ],
    },
    { key: 'highly_ordered', title: 'Highly Ordered Products', enabled: true, source: 'highly_ordered' },
    { key: 'late_evening', title: 'Late Evening Products', enabled: true, source: 'manual', productIds: [], fallbackSource: 'new_arrivals' },
    { key: 'wishlist', title: 'My Wishlist', enabled: true, source: 'wishlist' },
    { key: 'quick_grabs', title: 'Quick Grabs', enabled: true, source: 'budget', maxPrice: 99 },
    { key: 'missed', title: 'You Might Have Missed', enabled: true, source: 'missed' },
    { key: 'recommended', title: 'Recommended for You', enabled: true, source: 'recommended' },
  ],
};

const DEFAULT_CHECKOUT_CONTENT = {
  cashbackBanner: {
    enabled: false,
    title: 'Get up to ₹100 Cashback on UPI Payments',
    linkText: 'Know More',
    details: '',
  },
  // One line under each payment method, e.g. phonepe: 'Flat ₹25 cashback on PhonePe UPI'.
  paymentOffers: { upi: '', phonepe: '', card: '', cod: '' },
  trust: {
    enabled: true,
    title: 'Trusted & Happy Customers With Us',
    rating: null, // e.g. 4.8 — shown only when set
    reviewsLabel: '', // e.g. '1L+ Reviews'
  },
  deliveryHero: {
    enabled: true,
    title: 'Reward Your Delivery Hero',
    subtitle: 'Tip, Review & Earn Rewards',
  },
  vouchers: {
    enabled: true,
    title: 'Vouchers & Offers',
    subtitle: 'View & Apply Offers',
  },
  policyTitle: 'Return & Exchange / Cancellation Policy',
  policyPoints: [
    'Eligible products must be returned or exchanged within the specified time.',
    'Products must be unused and have original packaging and tags.',
    'Refunds will be credited to the source account.',
    'If the order does not meet your expectations, you can cancel the order or refuse items at the doorstep.',
  ],
};

module.exports = { CART_RAIL_SOURCES, DEFAULT_CART_RAILS, DEFAULT_CHECKOUT_CONTENT };

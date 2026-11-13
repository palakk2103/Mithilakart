/**
 * Customer "Help & Support" page content, fully admin-editable.
 * Stored as one JSON value under HELP_CENTER_SETTING_KEY in platform settings.
 * When nothing has been saved the storefront falls back to its built-in copy.
 */
const HELP_CENTER_SETTING_KEY = 'helpCenterConfig';

const LIMITS = {
  MAX_FAQS: 50,
  SHORT: 120,
  MEDIUM: 300,
  LONG: 2000,
};

const CONTACT_METHOD_IDS = ['call', 'email', 'chat'];

const DEFAULT_HELP_CENTER = Object.freeze({
  contactMethods: [
    { id: 'call', title: 'Call Us', subtitle: 'Mon-Sat (9am-6pm)', detail: '+91 1800-123-4567', enabled: true },
    { id: 'email', title: 'Email Us', subtitle: '24/7 support', detail: 'support@mithilakart.com', enabled: true },
    { id: 'chat', title: 'Live Chat', subtitle: 'Instant response', detail: 'Chat with us now', enabled: true },
  ],
  faqs: [
    { id: 'faq-1', question: 'How to track my order?', answer: 'You can track your order in the "My Orders" section. Click on any order to see real-time tracking updates and estimated delivery time.', enabled: true },
    { id: 'faq-2', question: 'How to return a product?', answer: 'Go to "My Orders", select the item you want to return, and click "Return". You have 10 days from delivery to initiate a return. Items must be unused and in original packaging.', enabled: true },
    { id: 'faq-3', question: 'Payment failed but money deducted', answer: "Don't worry! If payment fails but money is deducted, the refund will be automatically processed within 5-7 business days to your original payment method.", enabled: true },
    { id: 'faq-4', question: 'How do I cancel my order?', answer: 'You can cancel your order before it\'s shipped. Go to "My Orders", select the order, and click "Cancel Order". Refund will be processed within 3-5 business days.', enabled: true },
    { id: 'faq-5', question: 'What is the warranty policy?', answer: 'Warranty varies by product. Check the product description for specific warranty details. Most electronics come with 1-year manufacturer warranty.', enabled: true },
    { id: 'faq-6', question: 'How to change delivery address?', answer: 'You can change the delivery address before the order is shipped. Go to "My Orders", select the order, and click "Change Address".', enabled: true },
  ],
  contactSection: {
    intro: "Can't find what you're looking for? Our support team is here to help you 24/7.",
    phone: '+91 1800-123-4567',
    phoneNote: 'Mon-Sat: 9:00 AM - 6:00 PM',
    email: 'support@mithilakart.com',
    emailNote: 'Response within 24 hours',
    address: 'Mithilakart Pvt Ltd\n123 Business Park, Andheri East\nMumbai, Maharashtra 400069',
    hours: 'Monday - Saturday: 9:00 AM - 6:00 PM\nSunday: Closed',
  },
});

module.exports = {
  HELP_CENTER_SETTING_KEY,
  HELP_CENTER_LIMITS: LIMITS,
  CONTACT_METHOD_IDS,
  DEFAULT_HELP_CENTER,
};

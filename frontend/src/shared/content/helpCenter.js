/**
 * Help Center content. Stored by the admin as the CMS page `help-center`
 * (JSON in `content`); these defaults show until the admin saves their own.
 */
export const HELP_CENTER_SLUG = 'help-center';

export const DEFAULT_HELP_CENTER = {
  faqs: [
    { q: 'How to track my order?', a: 'Open "My Orders" and tap the order to see live tracking and the expected delivery time.' },
    { q: 'How to return a product?', a: 'Open "My Orders", choose the delivered order and tap "Request Return". You can request a return within 10 days of delivery; items must be unused and in original packaging.' },
    { q: 'Payment failed but money deducted', a: 'If a payment fails after money is deducted, it is refunded automatically to your original payment method within 5–7 business days.' },
    { q: 'How do I cancel my order?', a: 'You can cancel before the order is shipped: open "My Orders", choose the order and tap "Cancel Order". Online payments are refunded to the original payment method.' },
    { q: 'How do I change my delivery address?', a: 'Choose or add an address at checkout. After an order is placed, contact support before it ships and we will help.' },
  ],
  phoneHours: 'Mon–Sat, 9:00 AM – 6:00 PM',
  emailNote: 'Reply within 24 hours',
  address: 'Mithilakart Pvt Ltd\n123 Business Park, Andheri East\nMumbai, Maharashtra 400069',
  hours: 'Monday – Saturday: 9:00 AM – 6:00 PM\nSunday: Closed',
};

/** Parses the stored page; anything missing or malformed falls back to the defaults. */
export function parseHelpCenter(content) {
  let data;
  try {
    data = content ? JSON.parse(content) : null;
  } catch {
    data = null;
  }
  if (!data || typeof data !== 'object') return DEFAULT_HELP_CENTER;
  const faqs = Array.isArray(data.faqs)
    ? data.faqs.filter((f) => f && String(f.q || '').trim() && String(f.a || '').trim())
    : DEFAULT_HELP_CENTER.faqs;
  return {
    faqs,
    phoneHours: data.phoneHours ?? DEFAULT_HELP_CENTER.phoneHours,
    emailNote: data.emailNote ?? DEFAULT_HELP_CENTER.emailNote,
    address: data.address ?? DEFAULT_HELP_CENTER.address,
    hours: data.hours ?? DEFAULT_HELP_CENTER.hours,
  };
}

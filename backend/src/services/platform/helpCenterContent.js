const { AppError } = require('../../utils/AppError');
const {
  HELP_CENTER_LIMITS: L,
  CONTACT_METHOD_IDS,
  DEFAULT_HELP_CENTER,
} = require('../../constants/helpCenter');

const clone = (v) => JSON.parse(JSON.stringify(v));

const text = (value, field, max, { required = false, multiline = false } = {}) => {
  if (value == null) value = '';
  if (typeof value !== 'string') throw AppError.validation(`${field} must be text`);
  const cleaned = multiline
    ? value.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
    : value.trim().replace(/\s+/g, ' ');
  if (required && !cleaned) throw AppError.validation(`${field} is required`);
  if (cleaned.length > max) throw AppError.validation(`${field} must be at most ${max} characters`);
  return cleaned;
};

/** Strict validation for admin writes. Returns the cleaned config. */
function validateHelpCenter(input) {
  if (!input || typeof input !== 'object') throw AppError.validation('content must be an object');

  const { contactMethods, faqs, contactSection } = input;
  if (!Array.isArray(contactMethods)) throw AppError.validation('contactMethods must be an array');
  if (!Array.isArray(faqs)) throw AppError.validation('faqs must be an array');
  if (faqs.length > L.MAX_FAQS) throw AppError.validation(`At most ${L.MAX_FAQS} FAQs are allowed`);
  if (!contactSection || typeof contactSection !== 'object') {
    throw AppError.validation('contactSection must be an object');
  }

  const seen = new Set();
  const cleanMethods = contactMethods.map((m) => {
    if (!m || !CONTACT_METHOD_IDS.includes(m.id)) throw AppError.validation('Unknown contact method');
    if (seen.has(m.id)) throw AppError.validation(`Duplicate contact method: ${m.id}`);
    seen.add(m.id);
    return {
      id: m.id,
      title: text(m.title, 'Contact title', L.SHORT, { required: true }),
      subtitle: text(m.subtitle, 'Contact subtitle', L.SHORT),
      detail: text(m.detail, 'Contact detail', L.SHORT),
      enabled: m.enabled !== false,
    };
  });

  const cleanFaqs = faqs.map((f, i) => {
    if (!f || typeof f !== 'object') throw AppError.validation('Invalid FAQ');
    return {
      id: typeof f.id === 'string' && f.id.trim() ? f.id.trim().slice(0, 40) : `faq-${Date.now()}-${i}`,
      question: text(f.question, `FAQ ${i + 1} question`, L.MEDIUM, { required: true }),
      answer: text(f.answer, `FAQ ${i + 1} answer`, L.LONG, { required: true, multiline: true }),
      enabled: f.enabled !== false,
    };
  });

  const c = contactSection;
  return {
    contactMethods: cleanMethods,
    faqs: cleanFaqs,
    contactSection: {
      intro: text(c.intro, 'Intro', L.MEDIUM),
      phone: text(c.phone, 'Phone', L.SHORT),
      phoneNote: text(c.phoneNote, 'Phone note', L.SHORT),
      email: text(c.email, 'Email', L.SHORT),
      emailNote: text(c.emailNote, 'Email note', L.SHORT),
      address: text(c.address, 'Address', L.MEDIUM, { multiline: true }),
      hours: text(c.hours, 'Business hours', L.MEDIUM, { multiline: true }),
    },
  };
}

/** Tolerant read: stored value (or null) → full, safe config. */
function resolveHelpCenter(stored) {
  if (!stored || typeof stored !== 'object') return { content: clone(DEFAULT_HELP_CENTER), isCustom: false };
  try {
    return { content: validateHelpCenter(stored), isCustom: true };
  } catch {
    return { content: clone(DEFAULT_HELP_CENTER), isCustom: false };
  }
}

/** Customer-safe view: disabled items removed. */
function toPublicHelpCenter(stored) {
  const { content, isCustom } = resolveHelpCenter(stored);
  return {
    isCustom,
    contactMethods: content.contactMethods.filter((m) => m.enabled),
    faqs: content.faqs.filter((f) => f.enabled),
    contactSection: content.contactSection,
  };
}

module.exports = { validateHelpCenter, resolveHelpCenter, toPublicHelpCenter };

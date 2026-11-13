import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Phone, Mail, HelpCircle, ChevronRight, FileText, Send, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SearchInput from '../../../../shared/components/SearchInput';
import useTabTheme from '../../../../shared/hooks/useTabTheme';
import { useSupportContact } from '../../../../shared/config/publicConfig';
import { isAuthenticated } from '../../../../shared/api/tokenStorage';
import { DEFAULT_HELP_CENTER, HELP_CENTER_SLUG, parseHelpCenter } from '../../../../shared/content/helpCenter';
import { createSupportTicket } from '../../services/userApi';
import { getCmsPage } from '../../services/storefrontApi';

const POLICIES = [
  { title: 'Privacy Policy', path: '/privacy' },
  { title: 'Terms of Service', path: '/terms' },
  { title: 'Cancellation & Returns', path: '/cancellation-returns' },
  { title: 'Shipping Policy', path: '/shipping' },
];

const MultiLine = ({ text, className }) => (
  <p className={className}>
    {String(text || '').split('\n').map((line, i) => (
      <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
    ))}
  </p>
);

const HelpCenter = () => {
  const navigate = useNavigate();
  const theme = useTabTheme();
  const contact = useSupportContact();
  const [content, setContent] = useState(DEFAULT_HELP_CENTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // FAQs, address and hours are edited by the admin (Content → Help Center).
  useEffect(() => {
    let cancelled = false;
    getCmsPage(HELP_CENTER_SLUG)
      .then((page) => { if (!cancelled) setContent(parseHelpCenter(page?.content)); })
      .catch(() => { /* not set up yet: defaults stay */ });
    return () => { cancelled = true; };
  }, []);

  const faqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return content.faqs;
    return content.faqs.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q));
  }, [content.faqs, searchQuery]);

  const handleCreateTicket = async () => {
    if (!isAuthenticated('customer')) {
      navigate('/login', { state: { from: '/profile/help-center' } });
      return;
    }
    const message = ticketMessage.trim();
    if (message.length < 5) {
      toast.error('Please describe your issue');
      return;
    }
    setSubmitting(true);
    try {
      await createSupportTicket({ subject: message.slice(0, 80), message });
      setTicketMessage('');
      toast.success('Message sent — our team will get back to you');
    } catch (err) {
      toast.error(err?.message || 'Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactMethods = [
    { icon: <Phone size={22} />, title: 'Call Us', subtitle: content.phoneHours, detail: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, '')}` },
    { icon: <Mail size={22} />, title: 'Email Us', subtitle: content.emailNote, detail: contact.email, href: `mailto:${contact.email}` },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header — follows the active tab's (admin-set) colours */}
      <div className={`sticky top-0 z-50 p-4 shadow-sm ${theme.headerBg}`}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} aria-label="Back" className="text-white active:scale-90 transition-transform">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="text-[18px] font-bold text-white">Help & Support</h1>
        </div>
        <SearchInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions…"
        />
      </div>

      <div className="px-4 py-6 space-y-8 pb-24">
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-4">How can we help you?</h2>
          <div className="grid grid-cols-1 gap-3">
            {contactMethods.map((method) => (
              <motion.a
                key={method.title}
                href={method.href}
                whileTap={{ scale: 0.98 }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm active:shadow-md transition-all"
              >
                <div className={`p-3 rounded-full ${theme.primaryLightBg} ${theme.primaryText}`}>{method.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-slate-900">{method.title}</h3>
                  <p className="text-[12px] text-gray-500 font-medium">{method.subtitle}</p>
                  <p className={`text-[13px] font-bold mt-1 break-all ${theme.primaryText}`}>{method.detail}</p>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </motion.a>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          {faqs.length === 0 ? (
            <p className="text-[13px] text-gray-500 bg-white border border-gray-200 rounded-xl p-4">
              No answers match “{searchQuery}”. Send us a message below and we will help.
            </p>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div key={`${faq.q}-${idx}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    aria-expanded={expandedFaq === idx}
                    className="w-full p-4 flex items-center justify-between text-left active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <HelpCircle size={18} className={`flex-shrink-0 ${theme.primaryText}`} />
                      <span className="text-[13px] font-bold text-slate-900">{faq.q}</span>
                    </div>
                    <ChevronRight size={18} className={`text-gray-400 transition-transform ${expandedFaq === idx ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-4 pb-4">
                      <MultiLine text={faq.a} className="text-[12.5px] text-gray-600 leading-relaxed pl-7" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-full ${theme.primaryBg}`}>
              <Send size={16} className="text-white" />
            </div>
            <h2 className="text-[16px] font-bold text-slate-900">Send us a message</h2>
          </div>
          <label htmlFor="support-message" className="sr-only">Your message</label>
          <textarea
            id="support-message"
            value={ticketMessage}
            onChange={(e) => setTicketMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Tell us what went wrong — include your order number if it is about an order."
            className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3 text-[13px] text-slate-800 outline-none focus:border-slate-400"
          />
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateTicket}
            disabled={submitting}
            className={`w-full mt-3 text-white py-3 rounded-xl font-bold text-[14px] shadow-md transition-all disabled:opacity-60 ${theme.primaryBg}`}
          >
            {submitting ? 'Sending…' : 'Send message'}
          </motion.button>

          <div className="mt-6 space-y-4">
            {content.address && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <MapPin size={16} className={theme.primaryText} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">Office Address</p>
                  <MultiLine text={content.address} className="text-[12px] text-gray-600 leading-relaxed" />
                </div>
              </div>
            )}
            {content.hours && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <Clock size={16} className={theme.primaryText} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">Business Hours</p>
                  <MultiLine text={content.hours} className="text-[12px] text-gray-600 leading-relaxed" />
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-4">Policies & Information</h2>
          <div className="space-y-2">
            {POLICIES.map((item) => (
              <motion.button
                key={item.path}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl active:bg-gray-50 transition-all"
              >
                <span className="flex items-center gap-3">
                  <FileText size={18} className="text-gray-400" />
                  <span className="text-[13px] font-bold text-slate-900">{item.title}</span>
                </span>
                <ChevronRight size={18} className="text-gray-300" />
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;

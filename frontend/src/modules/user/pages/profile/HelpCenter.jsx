import React, { useState, useEffect } from 'react';
import { fetchHelpCenter } from '../../../../config/helpCenter';
import { ArrowLeft, Search, MessageCircle, Phone, Mail, HelpCircle, ChevronRight, FileText, Send, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchInput from '../../../../shared/components/SearchInput';
import { createSupportTicket } from '../../services/userApi';
import { useTranslation } from 'react-i18next';
import { tName } from '../../../../shared/utils/translateName';

const HelpCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticketMessage, setTicketMessage] = useState('');

  const handleCreateTicket = async () => {
    setSubmitting(true);
    try {
      await createSupportTicket({
        subject: 'Customer support request',
        message: ticketMessage || searchQuery || t('auto.needHelpWithMyOrder'),
        category: 'general',
      });
      setTicketMessage('');
      setSearchQuery('');
    } catch {
      // keep UI unchanged
    } finally {
      setSubmitting(false);
    }
  };

  // Admin-managed content (Admin → Storefront → Help & Support Page). Until the admin
  // customises it, the built-in (translated) copy below is shown.
  const [remote, setRemote] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchHelpCenter().then((data) => { if (alive && data?.isCustom) setRemote(data); });
    return () => { alive = false; };
  }, []);

  const defaultFaqs = [
    {
      q: 'How to track my order?',
      a: 'You can track your order in the "My Orders" section. Click on any order to see real-time tracking updates and estimated delivery time.' 
    },
    { 
      q: 'How to return a product?', 
      a: 'Go to "My Orders", select the item you want to return, and click "Return". You have 10 days from delivery to initiate a return. Items must be unused and in original packaging.' 
    },
    { 
      q: 'Payment failed but money deducted', 
      a: 'Don\'t worry! If payment fails but money is deducted, the refund will be automatically processed within 5-7 business days to your original payment method.' 
    },
    { 
      q: 'How do I cancel my order?', 
      a: 'You can cancel your order before it\'s shipped. Go to "My Orders", select the order, and click "Cancel Order". Refund will be processed within 3-5 business days.' 
    },
    { 
      q: 'What is the warranty policy?', 
      a: 'Warranty varies by product. Check the product description for specific warranty details. Most electronics come with 1-year manufacturer warranty.' 
    },
    { 
      q: 'How to change delivery address?', 
      a: 'You can change the delivery address before the order is shipped. Go to "My Orders", select the order, and click "Change Address".' 
    }
  ];

  const methodStyle = {
    call: { icon: <Phone size={24} />, color: 'bg-primary-light text-[#3E5A44]' },
    email: { icon: <Mail size={24} />, color: 'bg-green-50 text-green-600' },
    chat: { icon: <MessageCircle size={24} />, color: 'bg-purple-50 text-purple-600' },
  };

  const defaultContactMethods = [
    { id: 'call', title: 'Call Us', subtitle: 'Mon-Sat (9am-6pm)', detail: '+91 1800-123-4567' },
    { id: 'email', title: 'Email Us', subtitle: '24/7 support', detail: 'support@mithilakart.com' },
    { id: 'chat', title: 'Live Chat', subtitle: 'Instant response', detail: 'Chat with us now' },
  ];

  const faqs = remote ? remote.faqs.map((f) => ({ q: f.question, a: f.answer })) : defaultFaqs;
  const contactMethods = (remote ? remote.contactMethods : defaultContactMethods)
    .map((m) => ({ ...m, ...methodStyle[m.id] }));

  const lines = (s) => String(s || '').split('\n').filter(Boolean);
  const cs = remote?.contactSection;
  const intro = cs ? cs.intro : t('auto.canTFindWhatYou');
  const phone = cs ? cs.phone : '+91 1800-123-4567';
  const phoneNote = cs ? cs.phoneNote : t('auto.monSat900Am');
  const email = cs ? cs.email : 'support@mithilakart.com';
  const emailNote = cs ? cs.emailNote : t('auto.responseWithin24Hours');
  const addressLines = cs ? lines(cs.address) : [t('x.companyName'), t('x.companyStreet'), t('auto.mumbaiMaharashtra400069')];
  const hoursLines = cs ? lines(cs.hours) : [t('auto.mondaySaturday900Am'), t('auto.sundayClosed')];

  const isQuickShopFlow = localStorage.getItem('isQuickShopFlow') === 'true';
  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';

  const pageBg = isMithilakFlow ? 'bg-gradient-to-b from-[#f3e8ff]/60 via-[#faf5ff] to-[#f5f3ff]' : isFreshGroceryFlow ? 'bg-gradient-to-b from-[#FFF0A0]/25 via-[#FFFDF3] to-[#FFF]' : (isQuickShopFlow ? 'bg-[#fff5f7]' : 'bg-bg-cream');
  const headerBg = isMithilakFlow ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1]' : isFreshGroceryFlow ? 'bg-[#FFF0A0]' : (isQuickShopFlow ? 'bg-gradient-to-r from-[#F26522] to-[#FF7A00]' : 'bg-[#FCF7EE] border-b border-[#F3E3CD]/60');
  const headerTextColor = (isMithilakFlow || isQuickShopFlow) ? 'text-white' : (isFreshGroceryFlow ? 'text-black' : 'text-[#3C2415]');

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${pageBg}`}>
      {/* Global Repeating Mithila Art Page Background Texture */}
      {!(isMithilakFlow || isQuickShopFlow || isFreshGroceryFlow) && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
          style={{
            backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
            backgroundSize: '360px',
          }}
        />
      )}

      {/* Header */}
      <div className={`sticky top-0 z-50 p-4 shadow-sm relative z-10 transition-colors duration-300 ${headerBg}`}>
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className={`active:scale-90 transition-transform ${headerTextColor}`}
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className={`text-[18px] font-bold ${headerTextColor}`}>{t('auto.helpSupport')}</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <SearchInput
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('auto.searchForHelp')} 
          />
        </div>
      </div>

      <div className="px-4 py-6 space-y-8 pb-24 relative z-10">
        {/* Contact Methods */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-4">{t('auto.howCanWeHelpYou')}</h2>
          <div className="grid grid-cols-1 gap-3">
            {contactMethods.map((method, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.98 }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm active:shadow-md transition-all cursor-pointer"
              >
                <div className={`p-3 ${method.color} rounded-full`}>
                  {method.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-slate-900">{tName(method.title)}</h3>
                  <p className="text-[12px] text-gray-500 font-medium">{tName(method.subtitle)}</p>
                  <p className="text-[13px] text-[#3E5A44] font-bold mt-1">{tName(method.detail)}</p>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-4">{t('auto.frequentlyAskedQuestions')}</h2>
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <HelpCircle size={18} className="text-[#3E5A44] flex-shrink-0" />
                    <span className="text-[13px] font-bold text-slate-900">{tName(faq.q)}</span>
                  </div>
                  <ChevronRight 
                    size={18} 
                    className={`text-gray-400 transition-transform ${expandedFaq === idx ? 'rotate-90' : ''}`}
                  />
                </button>
                {expandedFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                  >
                    <p className="text-[12px] text-gray-600 leading-relaxed pl-7">
                      {tName(faq.a)}
                    </p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="bg-gradient-to-br from-blue-50 to-white border border-primary-green/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-[#3E5A44] rounded-full">
              <Send size={18} className="text-white" />
            </div>
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.contactUs')}</h2>
          </div>
          
          {intro && (
            <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
              {intro}
            </p>
          )}

          <div className="space-y-3">
            {/* Phone */}
            {phone && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <Phone size={16} className="text-[#3E5A44]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">{t('auto.phoneSupport')}</p>
                  <p className="text-[13px] text-[#3E5A44] font-bold">{phone}</p>
                  {phoneNote && <p className="text-[11px] text-gray-500">{phoneNote}</p>}
                </div>
              </div>
            )}

            {/* Email */}
            {email && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <Mail size={16} className="text-[#3E5A44]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">{t('auto.emailSupport')}</p>
                  <p className="text-[13px] text-[#3E5A44] font-bold">{email}</p>
                  {emailNote && <p className="text-[11px] text-gray-500">{emailNote}</p>}
                </div>
              </div>
            )}

            {/* Address */}
            {addressLines.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <MapPin size={16} className="text-[#3E5A44]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">{t('auto.officeAddress')}</p>
                  <p className="text-[12px] text-gray-600 leading-relaxed">
                    {addressLines.map((line, i) => (
                      <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            )}

            {/* Business Hours */}
            {hoursLines.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <Clock size={16} className="text-[#3E5A44]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">{t('auto.businessHours')}</p>
                  {hoursLines.map((line, i) => (
                    <p key={i} className="text-[12px] text-gray-600">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateTicket}
            disabled={submitting}
            className="w-full mt-6 bg-[#3E5A44] text-white py-3 rounded-xl font-bold text-[14px] shadow-md active:shadow-sm transition-all disabled:opacity-60"
          >
            {submitting ? t('auto.sending') : t('auto.sendUsAMessage')}
          </motion.button>
        </section>

        {/* Policies */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-4">{t('auto.policiesInformation')}</h2>
          <div className="space-y-2">
            {[
              { title: t('auto.privacyPolicy'), path: '/privacy' },
              { title: t('auto2.termsOfService'), path: '/terms' },
              { title: t('auto.cancellationsReturns'), path: '/cancellation-returns' },
              { title: t('auto.shippingPolicy'), path: '/shipping' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => item.path !== '#' && navigate(item.path)}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl active:bg-gray-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-gray-400" />
                  <span className="text-[13px] font-bold text-slate-900">{item.title}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;



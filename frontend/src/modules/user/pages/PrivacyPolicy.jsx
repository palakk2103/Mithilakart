import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../../../shared/components/Footer';
import useLegalPage from '../hooks/useLegalPage';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { page, loading, error } = useLegalPage('privacy');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#6FAE4A] px-4 py-4 flex items-center gap-3 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="text-white active:scale-90 transition-transform"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-[18px] font-bold text-white">Privacy Policy</h1>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {page?.content ? (
          <>
            <div className="text-[11px] text-gray-400">
              Last Updated: {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
            <div className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{page.content}</div>
          </>
        ) : (
          <>
        <div className="text-[11px] text-gray-400">
          Last Updated: May 8, 2026
        </div>

        {/* Introduction */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">1. Introduction</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            At Mithilakart, we are committed to protecting your privacy and ensuring the security of your personal 
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
            information when you use our Platform. Please read this policy carefully.
          </p>
        </section>

        {/* Information We Collect */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">2. Information We Collect</h2>
          
          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-3">2.1 Personal Information</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Name, email address, and phone number</li>
            <li>Shipping and billing addresses</li>
            <li>Payment information (processed securely by third-party providers)</li>
            <li>Account credentials</li>
            <li>Purchase history and preferences</li>
          </ul>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-3">2.2 Automatically Collected Information</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            When you use our Platform, we automatically collect:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages viewed, time spent, click patterns)</li>
            <li>Location information (with your permission)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            We use your information for the following purposes:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your account and orders</li>
            <li>Provide customer support</li>
            <li>Personalize your shopping experience</li>
            <li>Send promotional offers and updates (with your consent)</li>
            <li>Improve our Platform and services</li>
            <li>Detect and prevent fraud and security threats</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        {/* Information Sharing */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">4. Information Sharing and Disclosure</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            We may share your information with:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li><strong>Service Providers:</strong> Third parties who perform services on our behalf (payment processing, shipping, analytics)</li>
            <li><strong>Business Partners:</strong> Sellers and vendors whose products you purchase</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-2">
            We do not sell your personal information to third parties for their marketing purposes.
          </p>
        </section>

        {/* Data Security */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">5. Data Security</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. However, no method of 
            transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* Cookies and Tracking */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">6. Cookies and Tracking Technologies</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Remember your preferences and settings</li>
            <li>Analyze site traffic and usage patterns</li>
            <li>Provide personalized content and advertisements</li>
            <li>Improve Platform functionality</li>
          </ul>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-2">
            You can control cookies through your browser settings, but disabling them may affect Platform functionality.
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">7. Your Rights and Choices</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Access and update your personal information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt-out of marketing communications</li>
            <li>Disable location tracking</li>
            <li>Request a copy of your data</li>
            <li>Object to certain data processing activities</li>
          </ul>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-2">
            To exercise these rights, please contact us using the information provided below.
          </p>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">8. Children's Privacy</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Our Platform is not intended for children under 18 years of age. We do not knowingly collect 
            personal information from children. If you believe we have collected information from a child, 
            please contact us immediately.
          </p>
        </section>

        {/* Third-Party Links */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">9. Third-Party Links</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Our Platform may contain links to third-party websites. We are not responsible for the privacy 
            practices of these external sites. We encourage you to review their privacy policies before 
            providing any personal information.
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">10. Data Retention</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            We retain your personal information for as long as necessary to fulfill the purposes outlined in 
            this Privacy Policy, unless a longer retention period is required by law. When we no longer need 
            your information, we will securely delete or anonymize it.
          </p>
        </section>

        {/* International Transfers */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">11. International Data Transfers</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Your information may be transferred to and processed in countries other than your country of 
            residence. We ensure appropriate safeguards are in place to protect your information in accordance 
            with this Privacy Policy.
          </p>
        </section>

        {/* Changes to Policy */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">12. Changes to This Privacy Policy</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of significant changes by 
            posting the new policy on our Platform and updating the "Last Updated" date. Your continued use 
            of the Platform after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* Contact Information */}
        <section className="pb-8">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">13. Contact Us</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="text-[13px] text-gray-600 space-y-1 ml-2">
            <p><strong>Email:</strong> privacy@mithilakart.com</p>
            <p><strong>Phone:</strong> +91 1800-123-4567</p>
            <p><strong>Address:</strong> Mithilakart Pvt Ltd, Data Protection Officer, Mumbai, India</p>
          </div>
          <div className="mt-4 p-4 bg-primary-light border-l-4 border-[#6FAE4A] rounded">
            <p className="text-[12px] text-gray-700 leading-relaxed">
              <strong>Your privacy matters to us.</strong> We are committed to protecting your personal 
              information and being transparent about our data practices. If you have any concerns, please 
              don't hesitate to reach out.
            </p>
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
};

export default PrivacyPolicy;



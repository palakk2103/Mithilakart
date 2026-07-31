import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../../../shared/components/Footer';
import useLegalPage from '../hooks/useLegalPage';

const TermsOfUse = () => {
  const navigate = useNavigate();
  const { page, loading, error } = useLegalPage('terms');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#3E5A44] px-4 py-4 flex items-center gap-3 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="text-white active:scale-90 transition-transform"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-[18px] font-bold text-white">Terms of Use</h1>
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
        {/* Last Updated */}
        <div className="text-[11px] text-gray-400">
          Last Updated: May 8, 2026
        </div>

        {/* Introduction */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">1. Introduction</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Welcome to Mithilakart! These Terms of Use ("Terms") govern your access to and use of the Mithilakart platform, 
            including our website, mobile applications, and services (collectively, the "Platform"). By accessing 
            or using our Platform, you agree to be bound by these Terms.
          </p>
        </section>

        {/* Eligibility */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">2. Eligibility</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            To use Mithilakart, you must:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Be at least 18 years of age</li>
            <li>Have the legal capacity to enter into binding contracts</li>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
          </ul>
        </section>

        {/* Account Registration */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">3. Account Registration</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            You may be required to create an account to access certain features. You are responsible for 
            maintaining the confidentiality of your account information and for all activities that occur 
            under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        {/* Use of Platform */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">4. Use of Platform</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            You agree to use the Platform only for lawful purposes. You must not:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit harmful or malicious code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use the Platform for fraudulent purposes</li>
            <li>Harass, abuse, or harm other users</li>
          </ul>
        </section>

        {/* Products and Services */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">5. Products and Services</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            All products and services offered on Mithilakart are subject to availability. We reserve the right to 
            limit quantities, discontinue products, or refuse service at our discretion. Prices are subject 
            to change without notice. Product descriptions and images are provided for convenience and may 
            not be entirely accurate.
          </p>
        </section>

        {/* Orders and Payments */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">6. Orders and Payments</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            By placing an order, you make an offer to purchase products at the listed price. We reserve the 
            right to accept or reject your order. Payment must be made through our approved payment methods. 
            All transactions are processed securely, and we do not store your complete payment information.
          </p>
        </section>

        {/* Shipping and Delivery */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">7. Shipping and Delivery</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Delivery times are estimates and may vary. We are not responsible for delays caused by third-party 
            carriers or circumstances beyond our control. Risk of loss passes to you upon delivery to the carrier.
          </p>
        </section>

        {/* Returns and Refunds */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">8. Returns and Refunds</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Our return policy allows returns within 10 days of delivery for eligible products. Items must be 
            unused, in original packaging, and in resalable condition. Refunds will be processed to the original 
            payment method within 7-10 business days after we receive the returned item.
          </p>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">9. Intellectual Property</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            All content on the Platform, including text, graphics, logos, images, and software, is the property 
            of Mithilakart or its licensors and is protected by copyright, trademark, and other intellectual property 
            laws. You may not reproduce, distribute, or create derivative works without our express written permission.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">10. Limitation of Liability</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            To the maximum extent permitted by law, Mithilakart shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages arising from your use of the Platform. Our total 
            liability shall not exceed the amount you paid for the product or service in question.
          </p>
        </section>

        {/* Modifications */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">11. Modifications to Terms</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon 
            posting. Your continued use of the Platform after changes are posted constitutes acceptance of the 
            modified Terms.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">12. Governing Law</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of India, without regard 
            to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of 
            the courts in Mumbai, India.
          </p>
        </section>

        {/* Contact Information */}
        <section className="pb-8">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">13. Contact Us</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            If you have any questions about these Terms, please contact us:
          </p>
          <div className="text-[13px] text-gray-600 space-y-1 ml-2">
            <p>Email: support@mithilakart.com</p>
            <p>Phone: +91 1800-123-4567</p>
            <p>Address: Mithilakart Pvt Ltd, Mumbai, India</p>
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
};

export default TermsOfUse;


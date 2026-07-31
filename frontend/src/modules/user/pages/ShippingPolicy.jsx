import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, Clock, Package, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react';
import Footer from '../../../shared/components/Footer';
import useLegalPage from '../hooks/useLegalPage';

const ShippingPolicy = () => {
  const navigate = useNavigate();
  const { page, loading, error } = useLegalPage('shipping');

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
        <h1 className="text-[18px] font-bold text-white">Shipping Policy</h1>
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
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">Introduction</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            At Mithilakart, we are committed to delivering your orders quickly and safely. This shipping policy 
            outlines our delivery process, timelines, and charges to help you understand what to expect 
            when you shop with us.
          </p>
        </section>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary-light border border-primary-green/30 rounded-xl p-3 text-center">
            <Truck size={20} className="text-[#3E5A44] mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-900">Fast Delivery</p>
            <p className="text-[9px] text-gray-500">2-7 Days</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <MapPin size={20} className="text-green-600 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-900">Pan India</p>
            <p className="text-[9px] text-gray-500">20,000+ Pincodes</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
            <Package size={20} className="text-purple-600 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-900">Safe Packaging</p>
            <p className="text-[9px] text-gray-500">Secure Delivery</p>
          </div>
        </div>

        {/* Shipping Coverage */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">Shipping Coverage</h2>
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            We deliver to over <strong>20,000+ pincodes</strong> across India. Enter your pincode on the 
            product page to check if delivery is available in your area.
          </p>
          
          <div className="bg-primary-light border-l-4 border-[#3E5A44] p-4 rounded-r-lg">
            <p className="text-[12px] font-bold text-slate-900 mb-2">Serviceable Areas:</p>
            <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
              <li>All major cities and metro areas</li>
              <li>Tier 2 and Tier 3 cities</li>
              <li>Most rural and remote locations</li>
              <li>Union Territories and special regions</li>
            </ul>
          </div>
        </section>

        {/* Delivery Timeline */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">Delivery Timeline</h2>
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-slate-900 mb-1">Standard Delivery</h3>
                  <p className="text-[12px] text-gray-600 mb-2">
                    <strong>Metro Cities:</strong> 2-4 business days<br />
                    <strong>Other Cities:</strong> 4-7 business days
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Most orders are delivered within this timeframe
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck size={20} className="text-[#3E5A44]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-slate-900 mb-1">Quick Delivery</h3>
                  <p className="text-[12px] text-gray-600 mb-2">
                    <strong>Select Cities:</strong> 1-2 business days
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Available for select products and locations (additional charges apply)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-slate-900 mb-1">Remote Areas</h3>
                  <p className="text-[12px] text-gray-600 mb-2">
                    <strong>Remote Locations:</strong> 7-10 business days
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Delivery to remote pincodes may take additional time
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-slate-900 mb-1">Please Note:</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Delivery timelines are estimates and may vary due to weather conditions, festivals, 
                  strikes, or other unforeseen circumstances. We'll keep you updated via SMS and email.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Shipping Charges */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <IndianRupee size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">Shipping Charges</h2>
          </div>

          <div className="space-y-3">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-slate-900 mb-2">FREE Shipping</p>
                  <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
                    <li>Orders above ₹499</li>
                    <li>Mithilakart Plus members (all orders)</li>
                    <li>Special promotional offers</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-2">Standard Shipping Charges</p>
              <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
                <li>Orders below ₹499: ₹40 per order</li>
                <li>Bulky items: ₹80-150 (based on weight and size)</li>
                <li>Remote areas: Additional ₹50</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Order Processing */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">Order Processing</h2>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">Processing Time</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            Orders are typically processed within <strong>24-48 hours</strong> of placement. You will 
            receive a confirmation email once your order is shipped with tracking details.
          </p>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">Order Tracking</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            Track your order in real-time:
          </p>
          <ol className="list-decimal list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Go to "My Orders" in your account</li>
            <li>Click on the order you want to track</li>
            <li>View real-time tracking updates</li>
            <li>Get estimated delivery date</li>
          </ol>
        </section>

        {/* Delivery Process */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">Delivery Process</h2>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                1
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Order Confirmation</p>
                <p className="text-[12px] text-gray-600">You'll receive an email/SMS confirming your order</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                2
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Order Processing</p>
                <p className="text-[12px] text-gray-600">Your order is being prepared for shipment</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                3
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Shipped</p>
                <p className="text-[12px] text-gray-600">Order dispatched with tracking number</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                4
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Out for Delivery</p>
                <p className="text-[12px] text-gray-600">Package is on its way to your address</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                5
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Delivered</p>
                <p className="text-[12px] text-gray-600">Order successfully delivered to your address</p>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Attempts */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">Delivery Attempts</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            Our delivery partner will make <strong>3 attempts</strong> to deliver your order:
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2 mb-3">
            <li>You'll receive a call/SMS before each delivery attempt</li>
            <li>If delivery fails, the package will be held at the local hub</li>
            <li>After 3 failed attempts, the order will be returned to us</li>
            <li>Refund will be processed after we receive the returned item</li>
          </ul>
          <p className="text-[12px] text-gray-500 italic">
            Please ensure someone is available to receive the package or provide alternate delivery instructions.
          </p>
        </section>

        {/* Packaging */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">Packaging & Safety</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            We take great care in packaging your orders to ensure they reach you in perfect condition:
          </p>
          <div className="bg-primary-light border border-blue-200 rounded-xl p-4">
            <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-2">
              <li>Sturdy, eco-friendly packaging materials</li>
              <li>Bubble wrap and cushioning for fragile items</li>
              <li>Tamper-proof sealing</li>
              <li>Weather-resistant outer packaging</li>
              <li>Clear labeling and handling instructions</li>
            </ul>
          </div>
        </section>

        {/* International Shipping */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">International Shipping</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Currently, we only ship within India. International shipping is not available at this time. 
            We're working on expanding our services globally. Stay tuned!
          </p>
        </section>

        {/* Contact Support */}
        <section className="pb-8">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">Shipping Support</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            Have questions about shipping? Our customer support team is here to help.
          </p>
          <div className="bg-primary-light border border-blue-200 rounded-xl p-4">
            <div className="text-[13px] text-gray-700 space-y-2">
              <p><strong>Email:</strong> shipping@mithilakart.com</p>
              <p><strong>Phone:</strong> +91 1800-123-4567</p>
              <p><strong>Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ShippingPolicy;



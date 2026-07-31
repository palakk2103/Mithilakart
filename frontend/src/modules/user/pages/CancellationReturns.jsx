import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Footer from '../../../shared/components/Footer';
import useLegalPage from '../hooks/useLegalPage';

const CancellationReturns = () => {
  const navigate = useNavigate();
  const { page, loading, error } = useLegalPage('cancellation');

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
        <h1 className="text-[18px] font-bold text-white">Cancellation & Returns</h1>
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
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">Introduction</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            At Mithilakart, we are committed to completely satisfying you with your purchase. This policy outlines our 
            cancellation and return procedures to ensure a smooth and hassle-free experience.
          </p>
        </section>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-light border border-primary-green/30 rounded-xl p-4 text-center">
            <Clock size={24} className="text-[#3E5A44] mx-auto mb-2" />
            <p className="text-[12px] font-bold text-slate-900">10 Days</p>
            <p className="text-[10px] text-gray-500">Return Window</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
            <RotateCcw size={24} className="text-green-600 mx-auto mb-2" />
            <p className="text-[12px] font-bold text-slate-900">Easy Returns</p>
            <p className="text-[10px] text-gray-500">Hassle-free Process</p>
          </div>
        </div>

        {/* Order Cancellation */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">Order Cancellation</h2>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">1.1 When Can I Cancel?</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            You can cancel your order anytime before it is shipped. Once the order is shipped, 
            cancellation is not possible, but you can return the product after delivery.
          </p>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">1.2 How to Cancel</h3>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Go to "My Orders" section in your account</li>
            <li>Select the order you want to cancel</li>
            <li>Click on "Cancel Order" button</li>
            <li>Choose a cancellation reason</li>
            <li>Confirm cancellation</li>
          </ul>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">1.3 Cancellation Refund</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Refunds for cancelled orders will be processed within 3-5 business days to your original 
            payment method. For Cash on Delivery orders, no payment is required.
          </p>
        </section>

        {/* Return Policy */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">Return Policy</h2>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">2.1 Return Window</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            You have <strong>10 days</strong> from the date of delivery to initiate a return. Returns 
            requested after this period will not be accepted.
          </p>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">2.2 Eligible Items for Return</h3>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-3">
            <div className="flex items-start gap-2">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-slate-900 mb-2">Items that can be returned:</p>
                <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
                  <li>Defective or damaged products</li>
                  <li>Wrong item delivered</li>
                  <li>Products not matching description</li>
                  <li>Unused items in original packaging</li>
                  <li>Items with all tags and labels intact</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">2.3 Non-Returnable Items</h3>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-3">
            <div className="flex items-start gap-2">
              <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-slate-900 mb-2">Items that cannot be returned:</p>
                <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
                  <li>Innerwear and lingerie</li>
                  <li>Cosmetics and personal care items</li>
                  <li>Perishable goods</li>
                  <li>Customized or personalized products</li>
                  <li>Items marked as "Non-Returnable"</li>
                  <li>Software and digital products</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">2.4 How to Return</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                1
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Initiate Return</p>
                <p className="text-[12px] text-gray-600">Go to "My Orders" and select "Return" for the item</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                2
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Choose Reason</p>
                <p className="text-[12px] text-gray-600">Select the reason for return and provide details</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                3
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Schedule Pickup</p>
                <p className="text-[12px] text-gray-600">Our delivery partner will pick up the item from your address</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                4
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Quality Check</p>
                <p className="text-[12px] text-gray-600">Item will be inspected at our warehouse</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                5
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Refund Processed</p>
                <p className="text-[12px] text-gray-600">Refund will be initiated within 7-10 business days</p>
              </div>
            </div>
          </div>
        </section>

        {/* Refund Policy */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">Refund Policy</h2>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">3.1 Refund Timeline</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            Once we receive and inspect your returned item, we will process your refund within 
            7-10 business days.
          </p>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">3.2 Refund Method</h3>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li><strong>Online Payments:</strong> Refund to original payment method (Credit/Debit Card, UPI, Wallet)</li>
            <li><strong>Cash on Delivery:</strong> Bank transfer to your registered account</li>
            <li><strong>Store Credit:</strong> Instant credit to your Mithilakart wallet (optional)</li>
          </ul>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">3.3 Partial Refunds</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Partial refunds may be issued if the item shows signs of use, damage, or missing accessories.
          </p>
        </section>

        {/* Exchange Policy */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">4. Exchange Policy</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            We currently do not offer direct exchanges. If you wish to exchange an item:
          </p>
          <ol className="list-decimal list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>Return the original item following our return process</li>
            <li>Place a new order for the desired item</li>
            <li>Refund from the returned item will be processed separately</li>
          </ol>
        </section>

        {/* Important Notes */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} className="text-orange-500" />
            <h2 className="text-[16px] font-bold text-slate-900">Important Notes</h2>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <ul className="list-disc list-inside text-[12px] text-gray-700 space-y-2">
              <li>Return shipping is free for defective or wrong items</li>
              <li>For other returns, shipping charges may apply</li>
              <li>Items must be returned in original packaging with all accessories</li>
              <li>Refunds do not include original shipping charges (if any)</li>
              <li>Sale and clearance items may have different return policies</li>
              <li>Return requests are subject to verification and approval</li>
            </ul>
          </div>
        </section>

        {/* Contact Support */}
        <section className="pb-8">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">Need Help?</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            If you have any questions about cancellations or returns, our customer support team is here to help.
          </p>
          <div className="bg-primary-light border border-blue-200 rounded-xl p-4">
            <div className="text-[13px] text-gray-700 space-y-2">
              <p><strong>Email:</strong> returns@mithilakart.com</p>
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

export default CancellationReturns;



import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Footer from '../../../shared/components/Footer';
import useLegalPage from '../hooks/useLegalPage';
import LegalContentRenderer from '../components/LegalContentRenderer';
import { useTranslation } from 'react-i18next';

const CancellationReturns = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { page, loading } = useLegalPage('cancellation');

  const pageTitle = t('auto.cancellationAndReturns', 'Cancellation & Returns');
  const updatedDate = t('auto.may82026');

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-[#3E5A44] px-4 py-4 flex items-center gap-3 shadow-md">
          <button 
            onClick={() => navigate(-1)}
            className="text-white active:scale-90 transition-transform"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="text-[18px] font-bold text-white">{pageTitle}</h1>
        </div>

        {/* Content */}
        <main className="flex-1 px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
          {/* Last Updated */}
          <div className="text-[11px] text-gray-400">
            {t('policy.lastUpdated')}: {updatedDate}
          </div>

        <LegalContentRenderer
          content={null}
          loading={loading}
          fallbackContent={(
            <div className="space-y-6">

        {/* Introduction */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.introduction')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.atMithilakartWeAreCommitted3')}
          </p>
        </section>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-light border border-primary-green/30 rounded-xl p-4 text-center">
            <Clock size={24} className="text-[#3E5A44] mx-auto mb-2" />
            <p className="text-[12px] font-bold text-slate-900">{t('auto.n10Days')}</p>
            <p className="text-[10px] text-gray-500">{t('auto.returnWindow')}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
            <RotateCcw size={24} className="text-green-600 mx-auto mb-2" />
            <p className="text-[12px] font-bold text-slate-900">{t('auto.easyReturns')}</p>
            <p className="text-[10px] text-gray-500">{t('auto.hassleFreeProcess')}</p>
          </div>
        </div>

        {/* Order Cancellation */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.orderCancellation')}</h2>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n11WhenCanI')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.youCanCancelYourOrder')}
          </p>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n12HowToCancel')}</h3>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.goToMyOrdersSection')}</li>
            <li>{t('auto.selectTheOrderYouWant')}</li>
            <li>{t('auto.clickOnCancelOrderButton')}</li>
            <li>{t('auto.chooseACancellationReason')}</li>
            <li>{t('auto.confirmCancellation')}</li>
          </ul>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n13CancellationRefund')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.refundsForCancelledOrdersWill')}
          </p>
        </section>

        {/* Return Policy */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.returnPolicy')}</h2>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n21ReturnWindow')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('policy.youHave')} <strong>{t('auto.n10Days2')}</strong> {t('policy.fromDelivery')}
          </p>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n22EligibleItemsFor')}</h3>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-3">
            <div className="flex items-start gap-2">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-slate-900 mb-2">{t('auto.itemsThatCanBeReturned')}</p>
                <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
                  <li>{t('auto.defectiveOrDamagedProducts')}</li>
                  <li>{t('auto.wrongItemDelivered')}</li>
                  <li>{t('auto.productsNotMatchingDescription')}</li>
                  <li>{t('auto.unusedItemsInOriginalPackaging')}</li>
                  <li>{t('auto.itemsWithAllTagsAnd')}</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n23NonReturnableItems')}</h3>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-3">
            <div className="flex items-start gap-2">
              <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-slate-900 mb-2">{t('auto.itemsThatCannotBeReturned')}</p>
                <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
                  <li>{t('auto.innerwearAndLingerie')}</li>
                  <li>{t('auto.cosmeticsAndPersonalCareItems')}</li>
                  <li>{t('auto.perishableGoods')}</li>
                  <li>{t('auto.customizedOrPersonalizedProducts')}</li>
                  <li>{t('auto.itemsMarkedAsNonReturnable')}</li>
                  <li>{t('auto.softwareAndDigitalProducts')}</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n24HowToReturn')}</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                1
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.initiateReturn')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.goToMyOrdersAnd')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                2
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.chooseReason')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.selectTheReasonForReturn')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                3
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.schedulePickup')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.ourDeliveryPartnerWillPick')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                4
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.qualityCheck')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.itemWillBeInspectedAt')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                5
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.refundProcessed')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.refundWillBeInitiatedWithin')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Refund Policy */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.refundPolicy')}</h2>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n31RefundTimeline')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.onceWeReceiveAndInspect')}
          </p>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n32RefundMethod')}</h3>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li><strong>{t('auto.onlinePayments')}</strong> {t('auto.refundToOriginalPaymentMethod')}</li>
            <li><strong>{t('auto.cashOnDelivery')}</strong> {t('auto.bankTransferToYourRegistered')}</li>
            <li><strong>{t('auto.storeCredit')}</strong> {t('auto.instantCreditToYourMithilakart')}</li>
          </ul>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.n33PartialRefunds')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.partialRefundsMayBeIssued')}
          </p>
        </section>

        {/* Exchange Policy */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n4ExchangePolicy')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.weCurrentlyDoNotOffer')}
          </p>
          <ol className="list-decimal list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.returnTheOriginalItemFollowing')}</li>
            <li>{t('auto.placeANewOrderFor')}</li>
            <li>{t('auto.refundFromTheReturnedItem')}</li>
          </ol>
        </section>

        {/* Important Notes */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} className="text-orange-500" />
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.importantNotes')}</h2>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <ul className="list-disc list-inside text-[12px] text-gray-700 space-y-2">
              <li>{t('auto.returnShippingIsFreeFor')}</li>
              <li>{t('auto.forOtherReturnsShippingCharges')}</li>
              <li>{t('auto.itemsMustBeReturnedIn')}</li>
              <li>{t('auto.refundsDoNotIncludeOriginal')}</li>
              <li>{t('auto.saleAndClearanceItemsMay')}</li>
              <li>{t('auto.returnRequestsAreSubjectTo')}</li>
            </ul>
          </div>
        </section>

        {/* Contact Support */}
        <section className="pb-8">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.needHelp')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            {t('auto.ifYouHaveAnyQuestions')}
          </p>
          <div className="bg-primary-light border border-blue-200 rounded-xl p-4">
            <div className="text-[13px] text-gray-700 space-y-2">
              <p><strong>{t('auto.email')}</strong> returns@mithilakart.com</p>
              <p><strong>{t('auto.phone')}</strong> +91 1800-123-4567</p>
              <p><strong>{t('auto.hours2')}</strong> {t('auto.mondaySaturday900Am2')}</p>
            </div>
          </div>
        </section>
      </div>
    )}
  />
</main>
</div>
{!loading && <Footer />}
    </div>
  );
};

export default CancellationReturns;



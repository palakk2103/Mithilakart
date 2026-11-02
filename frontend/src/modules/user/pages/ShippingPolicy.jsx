import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, Clock, Package, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react';
import Footer from '../../../shared/components/Footer';
import useLegalPage from '../hooks/useLegalPage';
import LegalContentRenderer from '../components/LegalContentRenderer';
import { useTranslation } from 'react-i18next';

const ShippingPolicy = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { page, loading } = useLegalPage('shipping');

  const pageTitle = page?.title || t('auto.shippingPolicy');
  const updatedDate = page?.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : t('auto.may82026');

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
          <div className="text-[11px] text-gray-400">
            {t('policy.lastUpdated')}: {updatedDate}
          </div>

        <LegalContentRenderer
          content={null}
          loading={false}
          fallbackContent={(
            <div className="space-y-6">

        {/* Introduction */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.introduction')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.atMithilakartWeAreCommitted2')}
          </p>
        </section>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary-light border border-primary-green/30 rounded-xl p-3 text-center">
            <Truck size={20} className="text-[#3E5A44] mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-900">{t('auto.fastDelivery')}</p>
            <p className="text-[9px] text-gray-500">{t('auto.n27Days')}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <MapPin size={20} className="text-green-600 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-900">{t('auto.panIndia')}</p>
            <p className="text-[9px] text-gray-500">{t('auto.n20000Pincodes')}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
            <Package size={20} className="text-purple-600 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-900">{t('auto.safePackaging')}</p>
            <p className="text-[9px] text-gray-500">{t('auto.secureDelivery')}</p>
          </div>
        </div>

        {/* Shipping Coverage */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.shippingCoverage')}</h2>
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            {t('policy.deliverOver')} <strong>{t('auto.n20000Pincodes2')}</strong> {t('policy.acrossIndia')}
          </p>
          
          <div className="bg-primary-light border-l-4 border-[#3E5A44] p-4 rounded-r-lg">
            <p className="text-[12px] font-bold text-slate-900 mb-2">{t('auto.serviceableAreas')}</p>
            <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
              <li>{t('auto.allMajorCitiesAndMetro')}</li>
              <li>{t('auto.tier2AndTier3')}</li>
              <li>{t('auto.mostRuralAndRemoteLocations')}</li>
              <li>{t('auto.unionTerritoriesAndSpecialRegions')}</li>
            </ul>
          </div>
        </section>

        {/* Delivery Timeline */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.deliveryTimeline')}</h2>
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-slate-900 mb-1">{t('auto.standardDelivery')}</h3>
                  <p className="text-[12px] text-gray-600 mb-2">
                    <strong>{t('auto.metroCities')}</strong> {t('auto.n24BusinessDays')}<br />
                    <strong>{t('auto.otherCities')}</strong> {t('policy.days47')}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t('auto.mostOrdersAreDeliveredWithin')}
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
                  <h3 className="text-[14px] font-bold text-slate-900 mb-1">{t('auto.quickDelivery')}</h3>
                  <p className="text-[12px] text-gray-600 mb-2">
                    <strong>{t('auto.selectCities')}</strong> {t('policy.days12')}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t('auto.availableForSelectProductsAnd')}
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
                  <h3 className="text-[14px] font-bold text-slate-900 mb-1">{t('auto.remoteAreas')}</h3>
                  <p className="text-[12px] text-gray-600 mb-2">
                    <strong>{t('auto.remoteLocations')}</strong> {t('policy.days710')}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t('auto.deliveryToRemotePincodesMay')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-slate-900 mb-1">{t('auto.pleaseNote')}</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {t('auto.deliveryTimelinesAreEstimatesAnd')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Shipping Charges */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <IndianRupee size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.shippingCharges')}</h2>
          </div>

          <div className="space-y-3">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-slate-900 mb-2">{t('auto.freeShipping')}</p>
                  <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
                    <li>{t('auto.ordersAbove499')}</li>
                    <li>{t('auto.mithilakartPlusMembersAllOrders')}</li>
                    <li>{t('auto.specialPromotionalOffers')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-2">{t('auto.standardShippingCharges')}</p>
              <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1 ml-2">
                <li>{t('auto.ordersBelow49940Per')}</li>
                <li>{t('auto.bulkyItems80150Based')}</li>
                <li>{t('auto.remoteAreasAdditional50')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Order Processing */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package size={20} className="text-[#3E5A44]" />
            <h2 className="text-[16px] font-bold text-slate-900">{t('auto.orderProcessing')}</h2>
          </div>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.processingTime')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            {t('policy.processedWithin')} <strong>{t('auto.n2448Hours')}</strong> {t('policy.ofPlacement')}
          </p>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-4">{t('auto.orderTracking')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.trackYourOrderInReal')}
          </p>
          <ol className="list-decimal list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.goToMyOrdersIn')}</li>
            <li>{t('auto.clickOnTheOrderYou')}</li>
            <li>{t('auto.viewRealTimeTrackingUpdates')}</li>
            <li>{t('auto.getEstimatedDeliveryDate')}</li>
          </ol>
        </section>

        {/* Delivery Process */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.deliveryProcess')}</h2>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                1
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.orderConfirmation')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.youLlReceiveAnEmail')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                2
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.orderProcessing')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.yourOrderIsBeingPrepared')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                3
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.shipped')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.orderDispatchedWithTrackingNumber')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#3E5A44] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                4
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.outForDelivery')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.packageIsOnItsWay')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                5
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{t('auto.delivered')}</p>
                <p className="text-[12px] text-gray-600">{t('auto.orderSuccessfullyDeliveredToYour')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Attempts */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.deliveryAttempts')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('policy.partnerWillMake')} <strong>{t('auto.n3Attempts')}</strong> {t('policy.toDeliver')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2 mb-3">
            <li>{t('auto.youLlReceiveACall')}</li>
            <li>{t('auto.ifDeliveryFailsThePackage')}</li>
            <li>{t('auto.after3FailedAttemptsThe')}</li>
            <li>{t('auto.refundWillBeProcessedAfter')}</li>
          </ul>
          <p className="text-[12px] text-gray-500 italic">
            {t('auto.pleaseEnsureSomeoneIsAvailable')}
          </p>
        </section>

        {/* Packaging */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.packagingSafety')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            {t('auto.weTakeGreatCareIn')}
          </p>
          <div className="bg-primary-light border border-blue-200 rounded-xl p-4">
            <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-2">
              <li>{t('auto.sturdyEcoFriendlyPackagingMaterials')}</li>
              <li>{t('auto.bubbleWrapAndCushioningFor')}</li>
              <li>{t('auto.tamperProofSealing')}</li>
              <li>{t('auto.weatherResistantOuterPackaging')}</li>
              <li>{t('auto.clearLabelingAndHandlingInstructions')}</li>
            </ul>
          </div>
        </section>

        {/* International Shipping */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.internationalShipping')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.currentlyWeOnlyShipWithin')}
          </p>
        </section>

        {/* Contact Support */}
        <section className="pb-8">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.shippingSupport')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
            {t('auto.haveQuestionsAboutShippingOur')}
          </p>
          <div className="bg-primary-light border border-blue-200 rounded-xl p-4">
            <div className="text-[13px] text-gray-700 space-y-2">
              <p><strong>{t('auto.email')}</strong> shipping@mithilakart.com</p>
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

export default ShippingPolicy;



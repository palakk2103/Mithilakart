import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../../../shared/components/Footer';
import LegalContentRenderer from '../components/LegalContentRenderer';
import { useTranslation } from 'react-i18next';

const TermsOfUse = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const loading = false;

  const pageTitle = t('auto.termsOfUse');
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
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n1Introduction')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.welcomeToMithilakartTheseTerms')}
          </p>
        </section>

        {/* Eligibility */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n2Eligibility')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.toUseMithilakartYouMust')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.beAtLeast18Years')}</li>
            <li>{t('auto.haveTheLegalCapacityTo')}</li>
            <li>{t('auto.provideAccurateAndCompleteRegistrati')}</li>
            <li>{t('auto.maintainTheSecurityOfYour')}</li>
          </ul>
        </section>

        {/* Account Registration */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n3AccountRegistration')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.youMayBeRequiredTo')}
          </p>
        </section>

        {/* Use of Platform */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n4UseOfPlatform')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.youAgreeToUseThe')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.violateAnyApplicableLawsOr')}</li>
            <li>{t('auto.infringeUponTheRightsOf')}</li>
            <li>{t('auto.transmitHarmfulOrMaliciousCode')}</li>
            <li>{t('auto.attemptToGainUnauthorizedAccess')}</li>
            <li>{t('auto.useThePlatformForFraudulent')}</li>
            <li>{t('auto.harassAbuseOrHarmOther')}</li>
          </ul>
        </section>

        {/* Products and Services */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n5ProductsAndServices')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.allProductsAndServicesOffered')}
          </p>
        </section>

        {/* Orders and Payments */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n6OrdersAndPayments')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.byPlacingAnOrderYou')}
          </p>
        </section>

        {/* Shipping and Delivery */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n7ShippingAndDelivery')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.deliveryTimesAreEstimatesAnd')}
          </p>
        </section>

        {/* Returns and Refunds */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n8ReturnsAndRefunds')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.ourReturnPolicyAllowsReturns')}
          </p>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n9IntellectualProperty')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.allContentOnThePlatform')}
          </p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n10LimitationOfLiability')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.toTheMaximumExtentPermitted')}
          </p>
        </section>

        {/* Modifications */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n11ModificationsToTerms')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.weReserveTheRightTo')}
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n12GoverningLaw')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.theseTermsShallBeGoverned')}
          </p>
        </section>

        {/* Contact Information */}
        <section className="pb-8">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n13ContactUs')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.ifYouHaveAnyQuestions3')}
          </p>
          <div className="text-[13px] text-gray-600 space-y-1 ml-2">
            <p>{t('auto.email')} support@mithilakart.com</p>
            <p>{t('auto.phone9118001234567')}</p>
            <p>{t('auto.addressMithilakartPvtLtdMumbai')}</p>
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

export default TermsOfUse;


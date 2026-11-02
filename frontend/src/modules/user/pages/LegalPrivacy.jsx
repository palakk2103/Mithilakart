import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../../../shared/components/Footer';
import useLegalPage from '../hooks/useLegalPage';
import LegalContentRenderer from '../components/LegalContentRenderer';
import { useTranslation } from 'react-i18next';

const LegalPrivacy = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { page, loading } = useLegalPage('privacy');

  const pageTitle = page?.title || t('auto.privacyPolicy');
  const updatedDate = page?.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : t('auto.may82026');

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-[#6FAE4A] px-4 py-4 flex items-center gap-3 shadow-md">
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
          content={page?.content}
          loading={loading}
          fallbackContent={(
            <div className="space-y-6">

        {/* Introduction */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n1Introduction')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.atMithilakartWeAreCommitted')}
          </p>
        </section>

        {/* Information We Collect */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n2InformationWeCollect')}</h2>
          
          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-3">{t('auto.n21PersonalInformation')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.weCollectInformationThatYou')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.nameEmailAddressAndPhone')}</li>
            <li>{t('auto.shippingAndBillingAddresses')}</li>
            <li>{t('auto.paymentInformationProcessedSecurelyB')}</li>
            <li>{t('auto.accountCredentials')}</li>
            <li>{t('auto.purchaseHistoryAndPreferences')}</li>
          </ul>

          <h3 className="text-[14px] font-bold text-slate-800 mb-2 mt-3">{t('auto.n22AutomaticallyCollectedInformation')}</h3>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.whenYouUseOurPlatform')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.deviceInformationIpAddressBrowser')}</li>
            <li>{t('auto.usageDataPagesViewedTime')}</li>
            <li>{t('auto.locationInformationWithYourPermissio')}</li>
            <li>{t('auto.cookiesAndSimilarTrackingTechnologie')}</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n3HowWeUseYour')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.weUseYourInformationFor')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.processAndFulfillYourOrders')}</li>
            <li>{t('auto.communicateWithYouAboutYour')}</li>
            <li>{t('auto.provideCustomerSupport')}</li>
            <li>{t('auto.personalizeYourShoppingExperience')}</li>
            <li>{t('auto.sendPromotionalOffersAndUpdates')}</li>
            <li>{t('auto.improveOurPlatformAndServices')}</li>
            <li>{t('auto.detectAndPreventFraudAnd')}</li>
            <li>{t('auto.complyWithLegalObligations')}</li>
          </ul>
        </section>

        {/* Information Sharing */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n4InformationSharingAndDisclosure')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.weMayShareYourInformation')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li><strong>{t('auto.serviceProviders')}</strong> {t('auto.thirdPartiesWhoPerformServices')}</li>
            <li><strong>{t('auto.businessPartners')}</strong> {t('auto.sellersAndVendorsWhoseProducts')}</li>
            <li><strong>{t('auto.legalRequirements')}</strong> {t('auto.whenRequiredByLawOr')}</li>
            <li><strong>{t('auto.businessTransfers')}</strong> {t('auto.inConnectionWithAMerger')}</li>
          </ul>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-2">
            {t('auto.weDoNotSellYour')}
          </p>
        </section>

        {/* Data Security */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n5DataSecurity')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.weImplementAppropriateTechnicalAnd')}
          </p>
        </section>

        {/* Cookies and Tracking */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n6CookiesAndTrackingTechnologies')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.weUseCookiesAndSimilar')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.rememberYourPreferencesAndSettings')}</li>
            <li>{t('auto.analyzeSiteTrafficAndUsage')}</li>
            <li>{t('auto.providePersonalizedContentAndAdverti')}</li>
            <li>{t('auto.improvePlatformFunctionality')}</li>
          </ul>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-2">
            {t('auto.youCanControlCookiesThrough')}
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n7YourRightsAndChoices')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.youHaveTheRightTo')}
          </p>
          <ul className="list-disc list-inside text-[13px] text-gray-600 space-y-1 ml-2">
            <li>{t('auto.accessAndUpdateYourPersonal')}</li>
            <li>{t('auto.requestDeletionOfYourAccount')}</li>
            <li>{t('auto.optOutOfMarketingCommunications')}</li>
            <li>{t('auto.disableLocationTracking')}</li>
            <li>{t('auto.requestACopyOfYour')}</li>
            <li>{t('auto.objectToCertainDataProcessing')}</li>
          </ul>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-2">
            {t('auto.toExerciseTheseRightsPlease')}
          </p>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n8ChildrenSPrivacy')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.ourPlatformIsNotIntended')}
          </p>
        </section>

        {/* Third-Party Links */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n9ThirdPartyLinks')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.ourPlatformMayContainLinks')}
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n10DataRetention')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.weRetainYourPersonalInformation')}
          </p>
        </section>

        {/* International Transfers */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n11InternationalDataTransfers')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.yourInformationMayBeTransferred')}
          </p>
        </section>

        {/* Changes to Policy */}
        <section>
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n12ChangesToThisPrivacy')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {t('auto.weMayUpdateThisPrivacy')}
          </p>
        </section>

        {/* Contact Information */}
        <section className="pb-8">
          <h2 className="text-[16px] font-bold text-slate-900 mb-3">{t('auto.n13ContactUs')}</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
            {t('auto.ifYouHaveAnyQuestions2')}
          </p>
          <div className="text-[13px] text-gray-600 space-y-1 ml-2">
            <p><strong>{t('auto.email')}</strong> privacy@mithilakart.com</p>
            <p><strong>{t('auto.phone')}</strong> +91 1800-123-4567</p>
            <p><strong>{t('auto.address2')}</strong> {t('auto.mithilakartPvtLtdDataProtection')}</p>
          </div>
          <div className="mt-4 p-4 bg-primary-light border-l-4 border-[#6FAE4A] rounded">
            <p className="text-[12px] text-gray-700 leading-relaxed">
              <strong>{t('auto.yourPrivacyMattersToUs')}</strong> 
              {t('x.privacyCommitRest')}
            </p>
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

export default LegalPrivacy;

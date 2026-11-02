import React from 'react';
import { User, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MainSidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity" 
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <div className="relative w-full max-w-[320px] bg-white h-full flex flex-col shadow-xl animate-in slide-in-from-left duration-300">
        {/* Header - Fixed at top */}
        <div className="bg-secondary text-white px-6 py-3 flex items-center gap-3 shrink-0 z-10 shadow-md">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <span className="text-lg font-bold">{t('sidebar.hello', { name: 'Shikha' })}</span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {/* Trending Section */}
          <div className="py-2.5 border-b border-gray-200">
            <h3 className="px-6 text-base font-bold text-gray-900 mb-1">{t('sidebar.trending')}</h3>
            <ul className="space-y-0.5">
              {[
                { key: 'bestsellers', label: 'Bestsellers' },
                { key: 'newReleases', label: 'New Releases' },
                { key: 'moversAndShakers', label: t('auto.moversAndShakers') }
              ].map((item) => (
                <li key={item.key}>
                  <Link to="#" className="px-6 py-2 text-[14px] text-gray-800 font-medium hover:bg-gray-100 flex items-center justify-between group">
                    {t(`sidebar.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Digital Content Section */}
          <div className="py-2.5 border-b border-gray-200">
            <h3 className="px-6 text-base font-bold text-gray-900 mb-1">{t('sidebar.digitalContent')}</h3>
            <ul className="space-y-0.5">
              {[
                { key: 'echoAlexa', label: 'Echo & Alexa' },
                { key: 'fireTv', label: 'Fire TV' },
                { key: 'kindleBooks', label: 'Kindle E-Readers & eBooks' },
                { key: 'audibleAudiobooks', label: 'Audible Audiobooks' },
                { key: 'primeVideo', label: 'Amazon Prime Video' },
                { key: 'primeMusic', label: t('auto.amazonPrimeMusic') }
              ].map((item) => (
                <li key={item.key}>
                  <Link to="#" className="px-6 py-2 text-[14px] text-gray-800 font-medium hover:bg-gray-100 flex items-center justify-between group">
                    {t(`sidebar.${item.key}`)}
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop by Category Section */}
          <div className="py-2.5 border-b border-gray-200">
            <h3 className="px-6 text-base font-bold text-gray-900 mb-1">{t('sidebar.shopByCategory')}</h3>
            <ul className="space-y-0.5">
              {[
                { key: 'mobilesComputers', label: 'Mobiles, Computers' },
                { key: 'tvAppliancesElectronics', label: 'TV, Appliances, Electronics' },
                { key: 'mensFashion', label: "Men's Fashion" },
                { key: 'womensFashion', label: "Women's Fashion" }
              ].map((item) => (
                <li key={item.key}>
                  <Link to="#" className="px-6 py-2 text-[14px] text-gray-800 font-medium hover:bg-gray-100 flex items-center justify-between group">
                    {t(`sidebar.${item.key}`)}
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                </li>
              ))}
              <li>
                <button className="w-full px-6 py-2 text-[14px] text-gray-800 font-medium hover:bg-gray-100 flex items-center gap-2">
                  {t('sidebar.seeAll')} <ChevronDown size={16} className="text-gray-500" />
                </button>
              </li>
            </ul>
          </div>

          {/* Programs & Features Section */}
          <div className="py-2.5 border-b border-gray-200">
            <h3 className="px-6 text-base font-bold text-gray-900 mb-1">{t('sidebar.programsAndFeatures')}</h3>
            <ul className="space-y-0.5">
              <li>
                <Link to="#" className="px-6 py-2 text-[14px] text-gray-800 font-medium hover:bg-gray-100 flex items-center justify-between group">
                  {t('sidebar.giftCards')}
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              </li>
              {[
                { key: 'launchpad', label: 'Amazon Launchpad' },
                { key: 'business', label: 'Amazon Business' },
                { key: 'handloomHandicrafts', label: t('auto.handloomAndHandicrafts') }
              ].map((item) => (
                <li key={item.key}>
                  <Link to="#" className="px-6 py-2 text-[14px] text-gray-800 font-medium hover:bg-gray-100 flex items-center justify-between group">
                    {t(`sidebar.${item.key}`)}
                  </Link>
                </li>
              ))}
              <li>
                <button className="w-full px-6 py-2 text-[14px] text-gray-800 font-medium hover:bg-gray-100 flex items-center gap-2">
                  {t('sidebar.seeAll')} <ChevronDown size={16} className="text-gray-500" />
                </button>
              </li>
            </ul>
          </div>

          {/* Help & Settings Section */}
          <div className="py-2.5">
            <h3 className="px-6 text-base font-bold text-gray-900 mb-1">{t('sidebar.helpAndSettings')}</h3>
            <ul className="space-y-0.5">
              {[
                { key: 'yourAccount', label: 'Your Account' },
                { key: 'customerService', label: 'Customer Service' },
                { key: 'signOut', label: t('auto.signOut') }
              ].map((item) => (
                <li key={item.key}>
                  <Link to="#" className="px-6 py-2 text-[14px] text-gray-800 font-medium hover:bg-gray-100 flex items-center justify-between group">
                    {t(`sidebar.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="relative ml-2 mt-4 text-white hover:text-gray-200 h-fit"
      >
        <X size={36} strokeWidth={2} />
      </button>
    </div>
  );
};

export default MainSidebar;

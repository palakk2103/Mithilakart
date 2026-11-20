import React from 'react';
import { Zap } from 'lucide-react';
import { usePublicConfig } from '../../../../shared/config/publicConfig';

/**
 * FEE-3 — "Place an order above ₹499 to avoid surge charge" at the top of the
 * Quick Shop and Fresh & Groceries landings. Shown only while the admin has
 * surge on for this tab (incl. its time windows); texts come from admin.
 */
const SurgeBanner = ({ marketplaceTab, className = '' }) => {
  const { surge } = usePublicConfig();
  if (!surge?.enabled || !(surge.activeTabs || []).includes(marketplaceTab)) return null;

  return (
    <div
      role="note"
      className={`mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-3.5 py-3 shadow-sm ${className}`}
    >
      <span className="w-10 h-10 shrink-0 rounded-full bg-orange-500 text-white flex items-center justify-center">
        <Zap size={20} className="fill-white" />
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-extrabold text-slate-900 leading-snug">{surge.bannerTitle}</p>
        {surge.bannerText && <p className="text-[12px] font-semibold text-orange-800 leading-snug mt-0.5">{surge.bannerText}</p>}
      </div>
    </div>
  );
};

export default SurgeBanner;

import { ArrowLeft } from 'lucide-react';
import PujaCartLinks from './PujaCartLinks';
import { useBackToMithilak } from '../../../../features/purohit/navigation';

/**
 * Back bar for the Purohit pages. The site header is hidden on these routes
 * (see VendorLayout + isPurohitPagePath), so this bar sticks to the very top.
 */
const PurohitTopBar = ({ title, subtitle }) => {
  const goBack = useBackToMithilak();
  return (
    <div className="sticky top-0 z-30 bg-[#F5F9FA]/95 backdrop-blur-md border-b border-[color:var(--ml-primary,#207C8A)]/15 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-[1200px] mx-auto px-3 md:px-6 py-2.5 flex items-center gap-2">
        <button type="button" onClick={goBack} aria-label="Go back" data-testid="purohit-back" className="p-2 -ml-1 rounded-full hover:bg-white text-[#3F2A20] cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] md:text-[20px] font-black text-[#3F2A20] truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-[11px] md:text-[12px] font-semibold text-slate-500 truncate">{subtitle}</p>}
        </div>
        <PujaCartLinks compact className="flex-nowrap justify-end" />
      </div>
    </div>
  );
};

export default PurohitTopBar;

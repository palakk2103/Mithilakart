import { useNavigate } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import { RitualCard } from '../components/purohit/PurohitCards';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import { usePurohitCatalog, useActiveRituals } from '../../../features/purohit/selectors';
import { ritualPath, useMithilakFlowFlags } from '../../../features/purohit/navigation';

/** "View All": every active ritual. */
const PurohitServices = () => {
  const navigate = useNavigate();
  useMithilakFlowFlags();
  const { settings } = usePurohitCatalog();
  const rituals = useActiveRituals();

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-10" data-testid="purohit-all-page">
      <SEO title={settings.heading} />
      <PurohitTopBar title={settings.heading} />

      <div className="max-w-[1200px] mx-auto px-3 md:px-6 pt-4">
        {rituals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <Flower2 size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
            <p className="text-[15px] font-black text-[#3F2A20]">Ritual services are coming soon</p>
          </div>
        ) : (
          <>
            {rituals.length > 0 && (
              <>
                <h2 className="text-[14px] md:text-[16px] font-black text-[#3F2A20] mb-2.5">All rituals</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2.5 md:gap-4 mb-6">
                  {rituals.map((ritual) => <RitualCard key={ritual.id} ritual={ritual} onClick={(r) => navigate(ritualPath(r))} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PurohitServices;

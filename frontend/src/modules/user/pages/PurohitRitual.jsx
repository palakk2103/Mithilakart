import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import { PanditPosterCard } from '../components/purohit/PanditPoster';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import { usePurohitCatalog, useRitualListings, ritualImage } from '../../../features/purohit/selectors';
import { useBackToMithilak, useMithilakFlowFlags, panditCardPath } from '../../../features/purohit/navigation';
import { handleImageError } from '../../../shared/utils/imageUtils';

/** Dedicated page for one ritual: only the pandits/services assigned to it. */
const PurohitRitual = () => {
  const { ritualId } = useParams();
  const navigate = useNavigate();
  const goBack = useBackToMithilak();
  useMithilakFlowFlags();
  const { rituals, settings } = usePurohitCatalog();
  const ritual = useMemo(() => rituals.find((x) => x.id === ritualId && x.active), [rituals, ritualId]);
  const listings = useRitualListings(ritual?.id);

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-10" data-testid="purohit-ritual-page">
      <SEO title={ritual ? `${ritual.name} – Book a Purohit` : 'Ritual not found'} />
      <PurohitTopBar title={ritual ? ritual.name : 'Ritual not found'} />

      <div className="max-w-[1200px] mx-auto px-3 md:px-6 pt-4">
        {!ritual ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <Flower2 size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
            <p className="text-[15px] font-black text-[#3F2A20]">This ritual isn&apos;t available right now</p>
            <button type="button" onClick={goBack} className="mt-4 px-5 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">Back to Mithilak</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 md:gap-4 bg-white rounded-[20px] border border-[#EADCC9]/70 p-2.5 md:p-3 mb-4">
              <img src={ritualImage(ritual)} alt={ritual.name} className="w-[64px] h-[80px] md:w-[84px] md:h-[105px] rounded-[14px] object-cover flex-shrink-0" onError={handleImageError} />
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-[color:var(--ml-primary,#207C8A)]">Purohit &amp; Ritual Services</p>
                {ritual.description && <p className="text-[12.5px] md:text-[14px] text-slate-600 font-semibold mt-0.5">{ritual.description}</p>}
                <p className="text-[11.5px] text-slate-400 font-bold mt-1" data-testid="purohit-listing-count">
                  {listings.length} purohit{listings.length === 1 ? '' : 's'} available
                </p>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-3xl border border-slate-100" data-testid="purohit-empty">
                <Flower2 size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
                <p className="text-[15px] font-black text-[#3F2A20]">No purohits available yet</p>
                <p className="text-[12px] text-slate-500 font-semibold mt-1">Please check back soon for {ritual.name}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {listings.map((listing) => (
                  <PanditPosterCard key={listing.service.id} listing={listing} settings={settings} onOpen={(l) => navigate(panditCardPath(l.service))} testId={`listing-card-${listing.service.id}`} compact />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PurohitRitual;

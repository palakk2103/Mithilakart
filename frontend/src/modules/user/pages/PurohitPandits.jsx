import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import { PanditPosterCard } from '../components/purohit/PanditPoster';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import { usePurohitCatalog, useAllLiveListings } from '../../../features/purohit/selectors';
import { panditCardPath, useMithilakFlowFlags } from '../../../features/purohit/navigation';

/** "See All" from the homepage pandit row: every live pandit card, filterable by puja. */
const PurohitPandits = () => {
  const navigate = useNavigate();
  useMithilakFlowFlags();
  const [params, setParams] = useSearchParams();
  const { settings } = usePurohitCatalog();
  const listings = useAllLiveListings();
  const ritualFilter = params.get('ritual') || '';

  // Only rituals that actually have cards get a chip, in admin order.
  const ritualChips = useMemo(() => {
    const seen = new Map();
    listings.forEach(({ ritual }) => { if (!seen.has(ritual.id)) seen.set(ritual.id, ritual); });
    return [...seen.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [listings]);
  const shown = ritualFilter ? listings.filter((l) => l.ritual.id === ritualFilter) : listings;
  const title = settings.panditsTitle || 'All Purohit Services';

  const chip = (id, label) => {
    const active = ritualFilter === id;
    return (
      <button
        key={id || 'all'}
        type="button"
        onClick={() => setParams(id ? { ritual: id } : {}, { replace: true })}
        aria-pressed={active}
        data-testid={`pandits-filter-${id || 'all'}`}
        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] md:text-[13px] font-black whitespace-nowrap border cursor-pointer transition-colors ${active ? 'bg-[color:var(--ml-primary,#207C8A)] text-white border-[color:var(--ml-primary,#207C8A)]' : 'bg-white text-[#3F2A20] border-[#EADCC9] hover:border-[color:var(--ml-primary,#207C8A)]'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-10" data-testid="purohit-pandits-page">
      <SEO title={title} />
      <PurohitTopBar title={title} subtitle={`${shown.length} purohit card${shown.length === 1 ? '' : 's'}`} />

      <div className="max-w-[1200px] mx-auto px-3 md:px-6 pt-3">
        {ritualChips.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 -mx-3 px-3 md:mx-0 md:px-0">
            {chip('', 'All')}
            {ritualChips.map((r) => chip(r.id, r.name))}
          </div>
        )}

        {shown.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100" data-testid="purohit-empty">
            <Flower2 size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
            <p className="text-[15px] font-black text-[#3F2A20]">No purohit cards available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {shown.map((listing) => (
              <PanditPosterCard key={listing.service.id} listing={listing} settings={settings} onOpen={(l) => navigate(panditCardPath(l.service))} testId={`listing-card-${listing.service.id}`} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurohitPandits;

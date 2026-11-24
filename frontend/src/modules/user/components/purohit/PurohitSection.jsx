import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ScrollRow from '../vendor/home/ScrollRow';
import { RitualCard } from './PurohitCards';
import { PanditPosterCard } from './PanditPoster';
import PujaCartLinks from './PujaCartLinks';
import { usePurohitCatalog, useActiveRituals, useHomeListings } from '../../../../features/purohit/selectors';
import { ritualPath, PUROHIT_ALL_PATH, PUROHIT_PANDITS_PATH, panditCardPath } from '../../../../features/purohit/navigation';

/**
 * Mithilak homepage block: ritual category image cards + horizontal pandit/service row.
 * Content and visibility come entirely from Admin → Purohit & Ritual Services.
 * Rendered only by pages/Mithilak.jsx.
 */
const PurohitSection = () => {
  const navigate = useNavigate();
  const { settings } = usePurohitCatalog();
  const rituals = useActiveRituals();
  const listings = useHomeListings();

  if (!settings.sectionVisible) return null;
  const shownRituals = rituals.slice(0, Math.max(1, Number(settings.maxHomeRituals) || 12));
  const shownListings = listings.slice(0, Math.max(1, Number(settings.maxHomeServices) || 12));
  if (!shownRituals.length && !shownListings.length) return null;

  const openRitual = (ritual) => navigate(ritualPath(ritual));

  return (
    <section
      data-testid="purohit-section"
      aria-labelledby="purohit-heading"
      className="w-full max-w-[1600px] mx-auto mb-6 md:mb-8 rounded-[22px] bg-gradient-to-b from-[#FFF8EE] to-[#FFFDF9] border border-[#EADCC9]/70 px-3 md:px-5 pt-4 pb-3 shadow-[0_3px_12px_rgba(61,35,20,0.03)]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 id="purohit-heading" className="text-[16px] md:text-[19px] font-black text-[#3F2A20] tracking-tight leading-tight">
            {settings.heading}
          </h2>
          {settings.subheading && (
            <p className="text-[11px] md:text-[12.5px] text-slate-500 font-semibold mt-0.5">{settings.subheading}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(PUROHIT_ALL_PATH)}
          className="flex-shrink-0 text-[12px] md:text-[13px] font-bold text-[color:var(--ml-primary,#207C8A)] hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          View All <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>

      <PujaCartLinks className="mb-3" />

      {shownRituals.length > 0 && (
        <>
          {settings.ritualsTitle && <h3 className="text-[12.5px] md:text-[14px] font-black text-[#3F2A20]/80 mb-2">{settings.ritualsTitle}</h3>}
          <ScrollRow className="flex items-start gap-2.5 md:gap-4 pb-2 pt-0.5 -mx-1 px-1 snap-x">
            {shownRituals.map((ritual) => (
              <RitualCard
                key={ritual.id}
                ritual={ritual}
                onClick={openRitual}
                className="flex-shrink-0 w-[122px] sm:w-[140px] md:w-[168px] snap-start"
              />
            ))}
          </ScrollRow>
        </>
      )}

      {shownListings.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-[12.5px] md:text-[14px] font-black text-[#3F2A20]/80">{settings.panditsTitle || 'Purohit services'}</h3>
            <button
              type="button"
              onClick={() => navigate(PUROHIT_PANDITS_PATH)}
              data-testid="pandits-see-all"
              className="flex-shrink-0 text-[12px] md:text-[13px] font-bold text-[color:var(--ml-primary,#207C8A)] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              See All <ChevronRight size={13} strokeWidth={2.5} />
            </button>
          </div>
          <ScrollRow className="flex items-stretch gap-3 md:gap-4 snap-x pb-2 pt-0.5 -mx-1 px-1">
            {shownListings.map((listing) => (
              <div key={listing.service.id} className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-24px)/3)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] xl:w-[calc((100%-64px)/5)] flex-shrink-0 snap-start flex flex-col">
                <PanditPosterCard listing={listing} settings={settings} onOpen={(l) => navigate(panditCardPath(l.service))} testId={`pandit-card-${listing.service.id}`} compact />
              </div>
            ))}
          </ScrollRow>
        </div>
      )}
    </section>
  );
};

export default PurohitSection;

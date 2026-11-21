import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Flower2, Clock, Landmark, GraduationCap, Sparkles, ChevronRight, CircleCheck, CircleX, MapPin, Languages, Star, Images, MessageSquareText, Video } from 'lucide-react';
import SEO from '../../../shared/components/SEO';
import { PanditPoster, PanditPosterCard } from '../components/purohit/PanditPoster';
import { ServiceAddControl } from '../components/purohit/PurohitCards';
import PurohitTopBar from '../components/purohit/PurohitTopBar';
import ScrollRow from '../components/vendor/home/ScrollRow';
import {
  usePurohitCatalog, useLiveListing, useAllLiveListings, qualificationList, ritualImage, formatINR,
} from '../../../features/purohit/selectors';
import { panditCardPath, ritualPath, useBackToMithilak, useMithilakFlowFlags } from '../../../features/purohit/navigation';
import { handleImageError } from '../../../shared/utils/imageUtils';
import { usePanditRatings, usePanditReviews } from '../../../features/purohit/reviews';
import { formatDate, toISODate } from '../../../features/purohit/booking';

const Block = ({ title, icon: Icon, children, testId }) => (
  <section className="bg-white rounded-[18px] border border-[#EADCC9]/70 p-3.5 md:p-4" data-testid={testId}>
    <h3 className="flex items-center gap-1.5 text-[13px] md:text-[14px] font-black text-[#3F2A20] mb-2">
      {Icon && <Icon size={15} className="text-[color:var(--ml-primary,#207C8A)]" />}
      {title}
    </h3>
    {children}
  </section>
);

/** Detail page for one pandit card (pandit × puja), opened from any poster card. */
const PurohitPanditDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const goBack = useBackToMithilak();
  useMithilakFlowFlags();
  const { settings } = usePurohitCatalog();
  const listing = useLiveListing(serviceId);
  const all = useAllLiveListings();
  const ratings = usePanditRatings();
  const reviews = usePanditReviews(listing?.pandit.id);

  const { otherRituals, otherPandits } = useMemo(() => {
    if (!listing) return { otherRituals: [], otherPandits: [] };
    return {
      otherRituals: all.filter((l) => l.pandit.id === listing.pandit.id && l.service.id !== listing.service.id),
      otherPandits: all.filter((l) => l.ritual.id === listing.ritual.id && l.pandit.id !== listing.pandit.id),
    };
  }, [all, listing]);

  if (!listing) {
    return (
      <div className="bg-[#F5F9FA] min-h-screen pb-10" data-testid="purohit-detail-page">
        <SEO title="Purohit not found" />
        <PurohitTopBar title="Purohit not found" />
        <div className="max-w-[600px] mx-auto px-3 pt-6">
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100" data-testid="purohit-detail-missing">
            <Flower2 size={40} className="mx-auto mb-3 text-[color:var(--ml-primary,#207C8A)] opacity-50" />
            <p className="text-[15px] font-black text-[#3F2A20]">This purohit service isn&apos;t available right now</p>
            <button type="button" onClick={goBack} className="mt-4 px-5 py-2 rounded-xl bg-[color:var(--ml-primary,#207C8A)] text-white text-[12.5px] font-black cursor-pointer">Go back</button>
          </div>
        </div>
      </div>
    );
  }

  const { pandit, ritual, service } = listing;
  const quals = qualificationList(pandit.qualifications);
  const exp = Number(pandit.experienceYears) || 0;
  const available = pandit.available !== false;
  const about = service.note || pandit.description;
  const rating = ratings[pandit.id];
  const gallery = (pandit.gallery || []).filter(Boolean);
  const coverage = (pandit.serviceAreas || []).filter(Boolean);
  const languages = (pandit.languages || []).filter(Boolean);

  return (
    <div className="bg-[#F5F9FA] min-h-screen pb-12" data-testid="purohit-detail-page">
      <SEO title={`${pandit.name} – ${ritual.name}`} />
      <PurohitTopBar title={pandit.name} subtitle={ritual.name} />

      <div className="max-w-[1100px] mx-auto px-3 md:px-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-4 md:gap-6 items-start">
          {/* Poster */}
          <div className="w-full max-w-[420px] mx-auto md:sticky md:top-20 rounded-[18px] bg-white border border-[#E6C77A]/70 shadow-[0_4px_14px_rgba(122,16,16,0.08)] p-1.5" data-testid="purohit-detail-poster">
            <PanditPoster listing={listing} settings={settings} />
          </div>

          {/* Details */}
          <div className="space-y-3 min-w-0">
            <section className="bg-white rounded-[18px] border border-[#EADCC9]/70 p-3.5 md:p-5">
              <div className="flex items-start gap-2 flex-wrap">
                <h2 className="text-[19px] md:text-[24px] font-black text-[#3F2A20] leading-tight" data-testid="purohit-detail-name">{pandit.name}</h2>
                {pandit.verified && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10.5px] font-black uppercase text-[color:var(--ml-primary,#207C8A)] bg-[#E3F3F5] px-2 py-0.5 rounded-md">
                    <BadgeCheck size={13} /> {settings.posterVerifiedText || 'Verified Purohit'}
                  </span>
                )}
              </div>
              {pandit.designation && <p className="text-[13px] md:text-[14.5px] font-bold text-slate-600 mt-0.5">{pandit.designation}</p>}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-slate-600" data-testid="purohit-detail-facts">
                {rating ? (
                  <span className="inline-flex items-center gap-1 font-black text-slate-800"><Star size={14} className="fill-amber-400 stroke-amber-400" /> {rating.avg.toFixed(1)} <span className="font-semibold text-slate-400">({rating.count} review{rating.count === 1 ? '' : 's'})</span></span>
                ) : (
                  <span className="px-1.5 py-[1px] rounded bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase">New on MithilaKart</span>
                )}
                {pandit.location && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {pandit.location}</span>}
                {languages.length > 0 && <span className="inline-flex items-center gap-1"><Languages size={13} /> {languages.join(', ')}</span>}
              </div>

              <button
                type="button"
                onClick={() => navigate(ritualPath(ritual))}
                className="mt-2.5 inline-flex items-center gap-2 pr-3 rounded-full bg-[#FFF4E0] border border-[#EADCC9] text-[12.5px] font-black text-[#7A1010] cursor-pointer hover:border-[#C9A227]"
              >
                <img src={ritualImage(ritual)} alt="" className="w-7 h-7 rounded-full object-cover" onError={handleImageError} />
                {ritual.name}
                <ChevronRight size={13} />
              </button>

              <div className="mt-4 flex items-end justify-between gap-3 flex-wrap border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{settings.posterPriceLabel || 'Dakshina'} · starting price</p>
                  <p className="flex items-baseline gap-2">
                    <span className="text-[24px] md:text-[28px] font-black text-slate-900" data-testid="purohit-detail-price">{formatINR(service.price)}</span>
                    {service.mrp > service.price && <span className="text-[13px] text-gray-400 line-through font-semibold">{formatINR(service.mrp)}</span>}
                  </p>
                  {service.duration && <p className="flex items-center gap-1 text-[12px] font-semibold text-slate-500"><Clock size={12} /> {service.duration}</p>}
                </div>
                <div className="w-full sm:w-[220px]">
                  <ServiceAddControl listing={listing} disabled={!available} />
                </div>
              </div>
              <p className={`mt-2.5 flex items-center gap-1.5 text-[12px] font-bold ${available ? 'text-emerald-700' : 'text-rose-600'}`}>
                {available ? <CircleCheck size={14} /> : <CircleX size={14} />}
                {available ? (settings.posterAvailableText || 'Available for Puja Services') : (settings.posterUnavailableText || 'Currently not available')}
              </p>
            </section>

            {about && (
              <Block title="About" icon={Sparkles}>
                <p className="text-[13px] md:text-[14px] text-slate-600 leading-relaxed">{about}</p>
              </Block>
            )}

            {(exp > 0 || pandit.institution || pandit.specializations?.length > 0) && (
              <Block title="Experience & background" icon={Landmark}>
                <ul className="space-y-1.5 text-[13px] md:text-[14px] text-slate-700">
                  {exp > 0 && <li><span className="font-bold">Experience:</span> {exp}+ years</li>}
                  {pandit.institution && <li><span className="font-bold">From:</span> {pandit.institution}</li>}
                </ul>
                {pandit.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {pandit.specializations.map((sp) => (
                      <span key={sp} className="text-[11.5px] font-bold text-[#3F2A20] bg-[#F5EFE6] px-2 py-0.5 rounded-md">{sp}</span>
                    ))}
                  </div>
                )}
              </Block>
            )}

            {quals.length > 0 && (
              <Block title={settings.posterQualificationsTitle || 'Qualifications'} icon={GraduationCap} testId="purohit-detail-quals">
                <ul className="space-y-1.5">
                  {quals.map((q) => (
                    <li key={q} className="flex items-start gap-2 text-[13px] md:text-[14px] text-slate-700">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#C62828] flex-shrink-0" />
                      {q}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {(coverage.length > 0 || service.online || pandit.onlineAvailable) && (
              <Block title="Service coverage" icon={MapPin} testId="purohit-detail-coverage">
                {coverage.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {coverage.map((c) => <span key={c} className="text-[11.5px] font-bold text-[#3F2A20] bg-[#F5EFE6] px-2 py-0.5 rounded-md">{c}</span>)}
                  </div>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-slate-600 font-semibold">
                  {service.online && pandit.onlineAvailable
                    ? <><Video size={14} className="text-[color:var(--ml-primary,#207C8A)]" /> Also available as an online (video) puja</>
                    : <>In-person puja only for this service</>}
                </p>
              </Block>
            )}

            {gallery.length > 0 && (
              <Block title="Photos" icon={Images} testId="purohit-detail-gallery">
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((g, i) => (
                    <img key={`${i}-${g.slice(-12)}`} src={g} alt={`${pandit.name} photo ${i + 1}`} loading="lazy" onError={handleImageError} className="w-full aspect-square object-cover rounded-xl border border-slate-100" />
                  ))}
                </div>
              </Block>
            )}

            <Block title={`Reviews${rating ? ` (${rating.count})` : ''}`} icon={MessageSquareText} testId="purohit-detail-reviews">
              {reviews.length === 0 ? (
                <p className="text-[12.5px] text-slate-500 font-semibold">No reviews yet. Reviews appear here after customers complete a puja with this purohit.</p>
              ) : (
                <ul className="space-y-3">
                  {reviews.slice(0, 6).map((r) => (
                    <li key={r.id} className="border-b border-slate-100 last:border-0 pb-2.5 last:pb-0">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="inline-flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={12} className={n <= r.rating ? 'fill-amber-400 stroke-amber-400' : 'stroke-slate-300'} />)}</span>
                        <span className="font-bold text-slate-700">{r.name}</span>
                        <span className="text-slate-400">· {formatDate(toISODate(new Date(r.at)))}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{r.ritualName}</p>
                      {r.text && <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">{r.text}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            {otherRituals.length > 0 && (
              <Block title={`Other puja services (${otherRituals.length})`} icon={Flower2} testId="purohit-detail-also">
                <ul className="divide-y divide-slate-100">
                  {otherRituals.map((l) => (
                    <li key={l.service.id}>
                      <button
                        type="button"
                        onClick={() => navigate(panditCardPath(l.service))}
                        className="w-full flex items-center gap-3 py-2 text-left cursor-pointer hover:bg-slate-50 rounded-lg px-1"
                      >
                        <img src={ritualImage(l.ritual)} alt="" className="w-9 h-11 rounded-lg object-cover flex-shrink-0" onError={handleImageError} />
                        <span className="flex-1 min-w-0 text-[13px] md:text-[14px] font-bold text-[#3F2A20] truncate">{l.ritual.name}</span>
                        <span className="text-[13px] font-black text-slate-900">{formatINR(l.service.price)}</span>
                        <ChevronRight size={15} className="text-slate-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </div>
        </div>

        {otherPandits.length > 0 && (
          <div className="mt-6" data-testid="purohit-detail-others">
            <h3 className="text-[14px] md:text-[16px] font-black text-[#3F2A20] mb-2.5">Other purohits for {ritual.name}</h3>
            <ScrollRow className="flex items-stretch gap-3 md:gap-4 snap-x pb-2 pt-0.5 -mx-1 px-1">
              {otherPandits.map((l) => (
                <div key={l.service.id} className="w-[172px] sm:w-[200px] md:w-[230px] flex-shrink-0 snap-start flex flex-col">
                  <PanditPosterCard listing={l} settings={settings} onOpen={(x) => navigate(panditCardPath(x.service))} testId={`other-card-${l.service.id}`} compact />
                </div>
              ))}
            </ScrollRow>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurohitPanditDetail;

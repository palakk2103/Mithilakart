import { memo } from 'react';
import { Check, Landmark, Star, MapPin } from 'lucide-react';
import { handleImageError } from '../../../../shared/utils/imageUtils';
import { POSTER_ASSETS } from '../../../../features/purohit/purohitSeed';
import { qualificationList, badgeLines, posterImages, formatINR } from '../../../../features/purohit/selectors';
import { usePanditRatings } from '../../../../features/purohit/reviews';
import { ServiceAddControl } from './PurohitCards';

/**
 * Pandit poster card — the client's "Verified Purohit" template.
 *
 * The artwork (deity, altar, temples, leaves, ribbons, frame) is a background template image
 * (public/purohit/poster/template-default.webp by default; admin can replace it globally,
 * per ritual or per card). Every dynamic detail — photo, name, badge, title, institution,
 * experience, availability, qualifications, footer — is overlaid at the template's exact
 * positions on its 555 × 647 grid, using container-query units so it scales with the card.
 */

const TW = 555;
const u = (px) => `${((px / TW) * 100).toFixed(3)}cqw`;
const SERIF = "'Times New Roman', 'Noto Serif', Georgia, serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
// Text shrinks with length so long names / badges stay inside their frames.
const badgeSize = (t) => (t.length <= 8 ? 27 : t.length <= 11 ? 24 : t.length <= 13 ? 21 : 18);
const nameSizeFor = (t) => (t.length <= 18 ? 33 : t.length <= 24 ? 29 : t.length <= 30 ? 25 : 21);

const abs = (style) => ({ position: 'absolute', ...style });
const oneLine = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const centred = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

const CheckBadge = ({ size = 24, bg = '#2E7D32' }) => (
  <span style={{ width: u(size), height: u(size), borderRadius: '50%', background: bg, flexShrink: 0, boxShadow: 'inset 0 -2px 3px rgba(0,0,0,.25)', ...centred }}>
    <Check color="#fff" strokeWidth={4} style={{ width: u(size * 0.62), height: u(size * 0.62) }} />
  </span>
);

const Pill = ({ top, height, children, tone = 'green' }) => {
  const tones = {
    green: { bg: 'linear-gradient(180deg,#F4FCEA 0%,#D5EEB4 100%)', border: '#8BC34A' },
    red: { bg: 'linear-gradient(180deg,#FFF3F1 0%,#FBD3CF 100%)', border: '#E57373' },
    gold: { bg: 'linear-gradient(180deg,#FFFDF0 0%,#FFF0C2 100%)', border: '#D4A017' },
  }[tone];
  return (
    <div style={abs({ top: u(top), left: '50%', transform: 'translateX(-50%)', height: u(height), maxWidth: u(400), display: 'flex', alignItems: 'center', gap: u(8), padding: `0 ${u(16)} 0 ${u(5)}`, borderRadius: 999, background: tones.bg, border: `${u(2)} solid ${tones.border}`, boxShadow: '0 1px 3px rgba(0,0,0,.18)', whiteSpace: 'nowrap' })}>
      {children}
    </div>
  );
};

export const PanditPoster = memo(({ listing, settings }) => {
  const { pandit, service, ritual } = listing;
  const s = settings || {};
  const img = posterImages(listing, s);
  const [b1, b2] = badgeLines(service, ritual);
  const quals = qualificationList(pandit.qualifications).slice(0, 3);
  const exp = Number(pandit.experienceYears) || 0;
  const available = pandit.available !== false;
  const name = pandit.name || 'Pandit name';

  return (
    <div style={{ containerType: 'inline-size', width: '100%' }}>
      <div
        style={{
          position: 'relative', width: '100%', aspectRatio: '555 / 647', overflow: 'hidden', borderRadius: u(8),
          background: '#FFF4D6', fontFamily: SERIF, color: '#3B1F0E', fontVariantNumeric: 'lining-nums',
        }}
      >
        {/* Template artwork */}
        <img
          src={img.template}
          alt=""
          aria-hidden="true"
          draggable={false}
          onError={(e) => { if (!e.currentTarget.src.endsWith(POSTER_ASSETS.template)) e.currentTarget.src = POSTER_ASSETS.template; }}
          style={abs({ inset: 0, width: '100%', height: '100%', objectFit: 'fill' })}
        />

        {/* Verified pill */}
        {pandit.verified && (
          <Pill top={12} height={34}>
            <CheckBadge size={27} />
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: u(18.5), color: '#1B5E20', ...oneLine }}>{s.posterVerifiedText || 'Verified Purohit'}</span>
          </Pill>
        )}

        {/* Photo inside the gold ring */}
        <img
          src={img.photo}
          alt={name}
          onError={handleImageError}
          style={abs({ left: u(181), top: u(53), width: u(197), height: u(201), borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' })}
        />

        {/* Ritual badge text (badge frame is part of the template) */}
        {(b1 || b2) && (
          <div style={abs({ left: u(394), top: u(66), width: u(138), height: u(56), flexDirection: 'column', textAlign: 'center', fontWeight: 700, lineHeight: 1.08, ...centred })}>
            {b1 && <span style={{ color: '#FFFFFF', fontSize: u(badgeSize(b1)), textShadow: '0 1px 2px rgba(0,0,0,.35)', maxWidth: '100%', ...oneLine }}>{b1}</span>}
            {b2 && <span style={{ color: '#FFE14D', fontSize: u(badgeSize(b2)), textShadow: '0 1px 2px rgba(0,0,0,.35)', maxWidth: '100%', ...oneLine }}>{b2}</span>}
          </div>
        )}

        {/* Name (ribbon is part of the template) */}
        <div style={abs({ left: u(114), top: u(272), width: u(338), height: u(38), ...centred })}>
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: u(nameSizeFor(name)), textShadow: '0 1px 2px rgba(0,0,0,.45)', maxWidth: '100%', ...oneLine }}>{name}</span>
        </div>

        {/* Designation */}
        {pandit.designation && (
          <div style={abs({ left: u(110), top: u(314), width: u(335), height: u(31), ...centred })}>
            <span style={{ fontWeight: 700, fontSize: u(23), color: '#4A0D0D', maxWidth: '100%', ...oneLine }}>{pandit.designation}</span>
          </div>
        )}

        {/* From: institution */}
        {pandit.institution && (
          <Pill top={348} height={35} tone="gold">
            <Landmark color="#9B1C1C" strokeWidth={2.4} style={{ width: u(24), height: u(24), flexShrink: 0, marginLeft: u(8) }} />
            <span style={{ fontWeight: 700, fontSize: u(18.5), color: '#9B1C1C', ...oneLine }}>From: {pandit.institution}</span>
          </Pill>
        )}

        {/* Experience (gold side lines are part of the template) */}
        {exp > 0 && (
          <div style={abs({ left: u(174), top: u(385), width: u(228), height: u(28), ...centred })}>
            <span style={{ fontWeight: 700, fontSize: u(21.5), color: '#3B1F0E', ...oneLine }}>Experience: {exp}+ Years</span>
          </div>
        )}

        {/* Availability */}
        <Pill top={414} height={34} tone={available ? 'green' : 'red'}>
          <CheckBadge size={27} bg={available ? '#2E7D32' : '#C62828'} />
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: u(17.5), color: available ? '#1B5E20' : '#B71C1C', ...oneLine }}>
            {available ? (s.posterAvailableText || 'Available for Puja Services') : (s.posterUnavailableText || 'Currently not available')}
          </span>
        </Pill>

        {/* Qualifications title (ribbon + cap are part of the template) */}
        <div style={abs({ left: u(220), top: u(461), width: u(228), height: u(27), display: 'flex', alignItems: 'center' })}>
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: u(25), textShadow: '0 1px 2px rgba(0,0,0,.4)', ...oneLine }}>{s.posterQualificationsTitle || 'Qualifications'}</span>
        </div>

        {/* Qualification lines (box is part of the template) */}
        <div style={abs({ left: u(116), top: u(497), width: u(334), height: u(80), display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: u(2) })}>
          {quals.map((q) => (
            <div key={q} style={{ display: 'flex', alignItems: 'center', gap: u(14), height: u(25), fontFamily: SANS, fontWeight: 500, fontSize: u(17), color: '#1E2A5A' }}>
              <span style={{ width: u(10), height: u(10), borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #FF6B6B, #B71C1C)', flexShrink: 0 }} />
              <span style={oneLine}>{q}</span>
            </div>
          ))}
        </div>

        {/* Footer (bar is part of the template) */}
        <div style={abs({ left: u(96), top: u(596), width: u(388), height: u(35), ...centred })}>
          <span style={{ color: '#FFF6DC', fontStyle: 'italic', fontWeight: 700, fontSize: u(19), textShadow: '0 1px 2px rgba(0,0,0,.4)', maxWidth: '100%', ...oneLine }}>
            {s.posterFooterText || 'Book Your Puja with Trusted Mithila Purohit'}
          </span>
        </div>
      </div>
    </div>
  );
});

/** Rating · location · languages line under the poster (step 3 of the customer flow). */
const PanditMeta = ({ pandit }) => {
  const ratings = usePanditRatings();
  const r = ratings[pandit.id];
  const langs = (pandit.languages || []).slice(0, 2).join(', ');
  return (
    <div className="px-1 pt-1.5 flex items-center gap-1.5 text-[10px] md:text-[11px] font-semibold text-slate-500 min-w-0" data-testid="pandit-meta">
      {r ? (
        <span className="inline-flex items-center gap-0.5 flex-shrink-0 font-black text-slate-800">
          <Star size={11} className="fill-amber-400 stroke-amber-400" /> {r.avg.toFixed(1)}
          <span className="font-semibold text-slate-400">({r.count})</span>
        </span>
      ) : (
        <span className="flex-shrink-0 px-1.5 py-[1px] rounded bg-emerald-50 text-emerald-700 font-black text-[9px] md:text-[10px] uppercase">New</span>
      )}
      {pandit.location && (
        <span className="inline-flex items-center gap-0.5 min-w-0 truncate"><MapPin size={10} className="flex-shrink-0" />{pandit.location}</span>
      )}
      {langs && <span className="truncate min-w-0 hidden min-[380px]:inline">· {langs}</span>}
    </div>
  );
};

/**
 * Poster + price/Add strip. `onOpen` (optional) makes the poster clickable.
 */
export const PanditPosterCard = memo(({ listing, settings, onOpen, testId, compact = false }) => {
  const { service, pandit } = listing;
  const available = pandit.available !== false;
  const poster = <PanditPoster listing={listing} settings={settings} />;
  return (
    <div data-testid={testId} className="h-full flex flex-col rounded-[18px] bg-white border border-[#E6C77A]/70 shadow-[0_4px_14px_rgba(122,16,16,0.08)] overflow-hidden p-1.5">
      {onOpen ? (
        <button type="button" onClick={() => onOpen(listing)} className="block w-full cursor-pointer text-left" aria-label={`${pandit.name} – ${listing.ritual.name}`}>
          {poster}
        </button>
      ) : poster}
      <PanditMeta pandit={pandit} />
      <div className={`mt-auto px-1 pt-1.5 pb-0.5 ${compact ? 'flex flex-col gap-1.5' : 'flex items-center gap-2'}`}>
        <div className="flex-1 min-w-0">
          <p className="text-[9.5px] md:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 leading-none">{settings?.posterPriceLabel || 'Dakshina'}</p>
          <p className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[15px] md:text-[17px] font-black text-slate-900">{formatINR(service.price)}</span>
            {service.mrp > service.price && <span className="text-[10.5px] text-gray-400 line-through font-semibold">{formatINR(service.mrp)}</span>}
          </p>
        </div>
        <div className={compact ? 'w-full' : 'w-[48%] flex-shrink-0'}>
          <ServiceAddControl listing={listing} disabled={!available} />
        </div>
      </div>
    </div>
  );
});

import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useActiveTabThemes, resolvedTabColours } from '../theme/tabThemes';
import { effectsLive, normalizeEffects } from '../theme/effects';
import SeasonalScene from '../theme/SeasonalScenes';
import useTabTheme from '../hooks/useTabTheme';

/**
 * Presentational festive banner: gradient from the tab's own colours, an illustrated scene
 * on the right, headline + CTA on the left. Also used (static) by the admin live preview.
 */
export const HeroCard = ({ effects, colours, onCta, className = '' }) => {
  const e = normalizeEffects(effects);
  const { headline, subtext, ctaLabel } = e.hero;
  return (
    <section
      className={`@container relative overflow-hidden rounded-3xl shadow-[0_10px_30px_-12px_rgba(0,0,0,.35)] ${className}`}
      style={{ background: `linear-gradient(118deg, ${colours.dark} 0%, ${colours.primary} 52%, ${colours.accent} 100%)` }}
      aria-label={headline}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(70% 90% at 85% 10%, rgba(255,255,255,.28), transparent 60%)' }} />
      <SeasonalScene type={e.type} accent={colours.accent} className="absolute right-0 bottom-0 h-full w-[66%] pointer-events-none" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 34%)', maskImage: 'linear-gradient(to right, transparent 0%, #000 34%)' }} />
      <div className="relative z-10 px-5 py-5 @[560px]:px-8 @[560px]:py-7 max-w-[72%] @[560px]:max-w-[55%] min-h-[160px] @[560px]:min-h-[200px] flex flex-col justify-center">
        <h2 className="text-white font-extrabold leading-[1.1] text-[19px] @[380px]:text-[22px] @[560px]:text-[32px] tracking-tight drop-shadow-sm line-clamp-3 [overflow-wrap:break-word]">{headline}</h2>
        {subtext && <p className="text-white/90 text-[12.5px] @[560px]:text-[15px] font-medium leading-snug mt-1.5 line-clamp-2">{subtext}</p>}
        {ctaLabel && (
          <button
            type="button"
            onClick={onCta}
            className="mt-3.5 self-start inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white text-[13px] font-bold whitespace-nowrap shadow-md active:scale-95 transition-transform"
            style={{ color: colours.dark }}
          >
            {ctaLabel} <ArrowRight size={15} strokeWidth={2.6} />
          </button>
        )}
      </div>
    </section>
  );
};

/** Drop-in for any tab's home page; renders nothing unless the admin enabled a hero for this tab. */
const SeasonalHero = ({ className = 'mx-3 mb-5 md:mb-8' }) => {
  const themes = useActiveTabThemes();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { activeFlow } = useTabTheme();
  const effects = useMemo(() => normalizeEffects(themes?.effects), [themes]);

  const onThisTab = effects.tabs.length === 0 || effects.tabs.includes(activeFlow);
  if (!effectsLive(effects) || !onThisTab || !effects.hero.enabled || !effects.hero.headline.trim()) return null;
  if (pathname.startsWith('/admin')) return null;

  return (
    <div className={className}>
      <HeroCard
        effects={effects}
        colours={resolvedTabColours(activeFlow, themes)}
        onCta={() => { if (effects.hero.ctaLink) navigate(effects.hero.ctaLink); }}
      />
    </div>
  );
};

export default SeasonalHero;

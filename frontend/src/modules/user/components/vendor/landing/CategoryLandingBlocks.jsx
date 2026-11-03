import { ChevronRight } from 'lucide-react';
import ScrollRow from '../home/ScrollRow';
import LandingBanner from './LandingBanner';
import useCategoryLanding from './useCategoryLanding';
import { getImageUrl, handleImageError } from '../../../../../shared/utils/imageUtils';

/**
 * Admin-configured landing blocks (banner slider + promo sections) for a main
 * category, rendered inside the existing category page. The page's own
 * subcategory row is the "subcategories" block, so `part` splits the admin's
 * saved order around it: "before" = blocks above it, "after" = blocks below it.
 */
const CategoryLandingBlocks = ({ categoryId, tab, part, renderProduct, onNavigate, accent = '#3E5A44' }) => {
  const landing = useCategoryLanding(categoryId, tab);
  if (!landing || landing.enabled === false || !landing.blocks?.length) return null;

  const idx = landing.blocks.findIndex((b) => b.type === 'subcategories');
  const blocks = idx === -1
    ? (part === 'before' ? landing.blocks : [])
    : (part === 'before' ? landing.blocks.slice(0, idx) : landing.blocks.slice(idx + 1));
  if (!blocks.length) return null;

  const go = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) window.location.assign(link);
    else onNavigate(link);
  };

  return (
    <div className="space-y-5 mb-5" data-testid={`landing-blocks-${part}`}>
      {blocks.map((block) => {
        if (block.type === 'banner') {
          return <LandingBanner key="banner" banners={block.banners} onOpen={go} accent={accent} />;
        }
        if (block.type !== 'section') return null;
        return (
          <section key={block.id} data-testid="landing-section" data-section-title={block.title}>
            <div className="flex items-end justify-between mb-3 px-1 gap-3">
              <div className="min-w-0">
                <h3 className="text-[16px] md:text-[18px] font-black text-[#3F2A20] tracking-tight leading-tight">{block.title}</h3>
                {block.subtitle && (
                  <p className="text-[10.5px] font-extrabold tracking-wide uppercase mt-0.5 line-clamp-1" style={{ color: accent }}>{block.subtitle}</p>
                )}
              </div>
              {block.ctaText && (
                <button type="button" onClick={() => go(block.ctaLink)} className="text-[12px] font-bold hover:underline flex items-center gap-0.5 flex-shrink-0" style={{ color: accent }}>
                  {block.ctaText} <ChevronRight size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
            {block.imageUrl && (
              <div
                role={block.ctaLink ? 'link' : undefined}
                onClick={() => block.ctaLink && go(block.ctaLink)}
                className={`mb-3 w-full aspect-[16/5] md:aspect-[21/5] rounded-[18px] overflow-hidden border border-black/5 bg-slate-100 ${block.ctaLink ? 'cursor-pointer' : ''}`}
              >
                <img src={getImageUrl(block.imageUrl)} alt={block.title} loading="lazy" decoding="async" onError={handleImageError} className="w-full h-full object-cover" />
              </div>
            )}
            <ScrollRow className="flex items-stretch gap-3 md:gap-4 snap-x pb-2 pt-1 -mx-1 px-1">
              {block.products.map((p) => (
                <div key={p.listingId || p.id} className="w-[165px] sm:w-[195px] md:w-[220px] flex-shrink-0 snap-start flex flex-col">
                  {renderProduct(p)}
                </div>
              ))}
            </ScrollRow>
          </section>
        );
      })}
    </div>
  );
};

export default CategoryLandingBlocks;

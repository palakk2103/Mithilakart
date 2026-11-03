import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../../../../shared/utils/imageUtils';

const BANNER_INTERVAL_MS = 4500;

const LandingBanner = ({ banners, onOpen, accent = '#207C8A' }) => {
  const [rawIndex, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;
  const index = count ? rawIndex % count : 0;

  // Preload the next slide so the cross-fade never shows a blank frame.
  useEffect(() => {
    if (count < 2) return;
    const next = banners[(index + 1) % count];
    [next.imageUrl, next.mobileImageUrl].filter(Boolean).forEach((src) => {
      const img = new Image();
      img.src = getImageUrl(src);
    });
  }, [index, count, banners]);

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), BANNER_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  const go = (delta) => setIndex((index + delta + count) % count);

  return (
    <section
      aria-label="Promotions"
      data-testid="landing-banner"
      className="relative w-full overflow-hidden rounded-[18px] md:rounded-[24px] bg-slate-100 aspect-[16/7] md:aspect-[21/6] border border-black/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((b, i) => {
        const clickable = Boolean(b.linkUrl);
        return (
          <div
            key={b.id}
            role={clickable ? 'link' : undefined}
            tabIndex={clickable && i === index ? 0 : -1}
            aria-hidden={i !== index}
            onClick={() => clickable && onOpen(b.linkUrl)}
            onKeyDown={(e) => { if (clickable && e.key === 'Enter') onOpen(b.linkUrl); }}
            className={`absolute inset-0 transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${clickable ? 'cursor-pointer' : ''}`}
          >
            <picture>
              {b.mobileImageUrl && <source media="(max-width: 767px)" srcSet={getImageUrl(b.mobileImageUrl)} />}
              <img
                src={getImageUrl(b.imageUrl)}
                alt={b.title}
                className="w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchpriority={i === 0 ? 'high' : 'auto'}
                decoding="async"
                onError={handleImageError}
              />
            </picture>
            {(b.subtitle || b.ctaText) && (
              <div className="absolute inset-x-0 bottom-0 p-3 md:p-6 bg-gradient-to-t from-black/55 to-transparent text-white">
                {b.subtitle && <p className="text-[12px] md:text-[16px] font-bold leading-tight line-clamp-2">{b.subtitle}</p>}
                {b.ctaText && (
                  <span className="inline-block mt-1.5 px-3 py-1 rounded-full bg-white text-[11px] md:text-[12px] font-black" style={{ color: accent }}>
                    {b.ctaText}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous banner" onClick={() => go(-1)} className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow items-center justify-center hover:bg-white" style={{ color: accent }}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Next banner" onClick={() => go(1)} className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow items-center justify-center hover:bg-white" style={{ color: accent }}>
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default LandingBanner;

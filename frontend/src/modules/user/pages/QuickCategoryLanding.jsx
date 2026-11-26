import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import { getCategoryLanding } from '../services/storefrontApi';
import { mapProductForCard } from '../utils/mappers';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';
import LandingBanner from '../components/vendor/landing/LandingBanner';
import SurgeBanner from '../components/vendor/SurgeBanner';
import RailCard from '../components/checkout/RailCard';
import WishlistHeart from '../components/common/WishlistHeart';
import LazySection from '../components/vendor/home/LazySection';

/**
 * Category landing of the quick-commerce tabs:
 *   tab home → category (this page: banner, subcategories, product sections)
 *            → subcategory (scrollable child-category list with products).
 * Banner, sections and their order come from admin (Category Landing Pages);
 * with nothing configured the server supplies Top Deals / Best Sellers / New Arrivals.
 */
const QuickCategoryLanding = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTabTheme();
  const isFresh = location.pathname.includes('/fresh-grocery');
  const base = isFresh ? '/fresh-grocery' : '/quick-shop';
  const tab = isFresh ? 'groceries_fresh' : 'quick_shop';

  const [landing, setLanding] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [attempt, setAttempt] = useState(0);
  const name = landing?.category?.name || location.state?.category || '';

  const openListing = useCallback((cat, options, isSubcategory = false) => {
    navigate(`${base}/category`, { state: { category: cat.name, categoryId: String(cat.id), isSubcategory }, ...options });
  }, [navigate, base]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getCategoryLanding(categoryId, tab)
      .then((data) => {
        if (cancelled) return;
        // Landing switched off by admin, or nothing at all to show: the product list is the page.
        if (!data || data.enabled === false || !data.blocks?.length) {
          openListing({ id: categoryId, name: data?.category?.name || location.state?.category }, { replace: true });
          return;
        }
        setLanding(data);
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, tab, attempt]);

  const openLink = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) window.location.assign(link);
    else navigate(link);
  };
  const openProduct = (item) => navigate('/product-detail', { state: { productId: item.productId, listingId: item.listingId, product: item } });

  return (
    <div className="pb-28" data-testid="quick-category-landing">
      <div className="px-4 pt-2 flex items-center gap-2">
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 active:scale-95"><ArrowLeft size={21} /></button>
        <h1 className="text-[18px] font-bold text-slate-900 truncate">{name}</h1>
      </div>
      <SurgeBanner marketplaceTab={tab} />

      <div className="px-4 pt-3 flex flex-col gap-6 max-w-[1400px] mx-auto">
        {status === 'loading' && (
          <div className="animate-pulse space-y-5" aria-busy data-testid="landing-skeleton">
            <div className="grid grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-slate-200" />)}</div>
            <div className="flex gap-3 overflow-hidden">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-[140px] h-[230px] flex-shrink-0 rounded-xl bg-slate-200" />)}</div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-16 text-center">
            <p className="text-[15px] font-bold text-slate-800">We couldn&apos;t load this page.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className="h-11 px-6 rounded-full text-white text-[14px] font-bold" style={{ background: theme.primaryHex }}>Try again</button>
              <button type="button" onClick={() => openListing({ id: categoryId, name }, { replace: true })} className="h-11 px-6 rounded-full border text-[14px] font-bold bg-white" style={{ borderColor: theme.primaryHex, color: theme.primaryHex }}>Browse products</button>
            </div>
          </div>
        )}

        {status === 'ready' && landing.blocks.map((block, index) => {
          if (block.type === 'banner') return <LandingBanner key="banner" banners={block.banners} onOpen={openLink} accent={theme.primaryHex} />;

          if (block.type === 'subcategories') {
            return (
              <section key="subcategories" data-testid="landing-subcategories">
                <h2 className="text-[16px] font-bold text-slate-900 mb-2.5">Shop by sub category</h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-2.5 gap-y-3.5">
                  {block.items.map((sub) => (
                    <button key={sub.id} type="button" data-testid="landing-subcategory" onClick={() => openListing({ id: sub.id, name: sub.originalName || sub.name }, undefined, true)} className="min-w-0 flex flex-col items-center active:scale-95 transition-transform">
                      <span className="w-full aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200/70 p-1">
                        <img src={getImageUrl(sub.imageUrl || sub.iconUrl)} alt="" loading="lazy" decoding="async" onError={handleImageError} className="w-full h-full object-cover rounded-xl" />
                      </span>
                      <span className="mt-1.5 w-full text-[12px] font-semibold text-slate-800 text-center leading-[1.2] line-clamp-2 min-h-[2.4em]">{sub.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          }

          const section = (
            <section key={block.id} data-testid="landing-section" data-section-title={block.title}>
              <div className="flex items-end justify-between gap-3 mb-2.5">
                <div className="min-w-0">
                  <h2 className="text-[16px] font-bold text-slate-900 leading-tight">{block.title}</h2>
                  {block.subtitle && <p className="text-[12.5px] text-slate-500 mt-0.5 truncate">{block.subtitle}</p>}
                </div>
                <button type="button" onClick={() => (block.ctaLink ? openLink(block.ctaLink) : openListing({ id: categoryId, name }))} className="min-h-[36px] text-[13px] font-bold flex items-center flex-shrink-0" style={{ color: theme.primaryHex }}>
                  {block.ctaText || 'View All'} <ChevronRight size={15} />
                </button>
              </div>
              {block.imageUrl && <img src={getImageUrl(block.imageUrl)} alt={block.title} loading="lazy" onError={handleImageError} className="w-full aspect-[16/5] object-cover rounded-2xl mb-3" />}
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {block.products.map((p) => {
                  const item = mapProductForCard(p);
                  return (
                    <RailCard key={item.listingId || item.id} item={{ ...item, price: p.price ?? item.price, mrp: p.mrp ?? item.mrp, marketplaceTab: tab }} onOpen={openProduct} className="w-[140px]">
                      <WishlistHeart product={item} className="absolute top-12 right-3 z-10" />
                    </RailCard>
                  );
                })}
              </div>
            </section>
          );
          // Sections further down load when the shopper scrolls near them.
          return index < 3 ? section : <LazySection key={block.id} height="300px">{section}</LazySection>;
        })}
      </div>
    </div>
  );
};

export default QuickCategoryLanding;

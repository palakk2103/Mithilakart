import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCategoryLanding, getHome } from '../services/storefrontApi';
import { getCategories } from '../services/catalogApi';
import { mapMithilaCategoryCards, mapNavChips } from '../utils/mappers';
import { openMithilaCategory, openMithilaListing, resolveChipCategory } from '../utils/categoryLandingNav';
import { addProductToCart } from '../utils/cartUtils';
import { MithilaDealCard, MithilaHeaderChips } from './Mithilak';
import LandingBanner from '../components/vendor/landing/LandingBanner';
import ScrollRow from '../components/vendor/home/ScrollRow';
import LazySection from '../components/vendor/home/LazySection';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

// ───────────────────────── Subcategory slider ─────────────────────────
const SubcategorySlider = ({ items, onSelect, title }) => (
  <section data-testid="landing-subcategories">
    <h2 className="text-[17px] md:text-[19px] font-bold text-[#3F2A20] mb-2 px-1">{title}</h2>
    <ScrollRow className="flex items-start gap-3 md:gap-5 pb-2 pt-1 -mx-1 px-1">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          data-testid="landing-subcategory"
          onClick={() => onSelect(item)}
          className="flex-shrink-0 w-[96px] sm:w-[112px] md:w-[130px] flex flex-col items-center cursor-pointer group active:scale-95 transition-transform outline-none"
        >
          <div className="w-full aspect-square rounded-[18px] overflow-hidden bg-[#FAF9F5] border border-[#EADCC9]/60 group-hover:border-[#207C8A]/40 group-hover:shadow-[0_6px_15px_rgba(32,124,138,0.08)] transition-all p-1">
            <img
              src={getImageUrl(item.imageUrl || item.iconUrl)}
              alt={item.name}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              className="w-full h-full object-cover rounded-[14px] group-hover:scale-[1.04] transition-transform duration-500"
            />
          </div>
          <span className="w-full mt-1.5 text-[12px] md:text-[13px] font-bold text-[#3F2A20] text-center leading-[1.2] line-clamp-2 break-words min-h-[2.4em]">
            {item.name}
          </span>
        </button>
      ))}
    </ScrollRow>
  </section>
);

// ───────────────────────── Promotional product section ─────────────────────────
const ProductSection = ({ block, onProduct, onAdd, onCta }) => (
  <section data-testid="landing-section" data-section-title={block.title}>
    <div className="flex items-end justify-between mb-3 px-1 gap-3">
      <div className="min-w-0">
        <h2 className="text-[17px] md:text-[19px] font-bold text-[#3F2A20] tracking-tight leading-tight">{block.title}</h2>
        {block.subtitle && <p className="text-[11px] text-[#207C8A] font-extrabold tracking-wide uppercase mt-0.5 line-clamp-1">{block.subtitle}</p>}
      </div>
      {block.ctaText && (
        <button type="button" onClick={() => onCta(block)} className="text-[12px] text-[#207C8A] font-bold hover:underline flex items-center gap-0.5 flex-shrink-0">
          {block.ctaText} <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      )}
    </div>

    {block.imageUrl && (
      <div
        role={block.ctaLink ? 'link' : undefined}
        onClick={() => block.ctaLink && onCta(block)}
        className={`mb-3 w-full aspect-[16/5] md:aspect-[21/5] rounded-[18px] overflow-hidden border border-[#207C8A]/20 bg-[#E3F3F5] ${block.ctaLink ? 'cursor-pointer' : ''}`}
      >
        <img src={getImageUrl(block.imageUrl)} alt={block.title} loading="lazy" decoding="async" onError={handleImageError} className="w-full h-full object-cover" />
      </div>
    )}

    <ScrollRow className="flex items-stretch gap-3 md:gap-4 snap-x pb-2 pt-1 -mx-1 px-1">
      {block.products.map((prod) => (
        <div key={prod.listingId || prod.id} className="w-[165px] sm:w-[195px] md:w-[220px] flex-shrink-0 snap-start flex flex-col">
          <MithilaDealCard prod={prod} onNavigate={onProduct} onAddToCart={onAdd} />
        </div>
      ))}
    </ScrollRow>
  </section>
);

// ───────────────────────── Skeleton ─────────────────────────
const LandingSkeleton = () => (
  <div className="space-y-5 animate-pulse" data-testid="landing-skeleton">
    <div className="w-full aspect-[16/7] md:aspect-[21/6] rounded-[18px] bg-slate-200" />
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="w-[96px] md:w-[130px] flex-shrink-0"><div className="aspect-square rounded-[18px] bg-slate-200" /><div className="h-3 mt-2 rounded bg-slate-200" /></div>)}
    </div>
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-[165px] md:w-[220px] h-[250px] flex-shrink-0 rounded-[18px] bg-slate-200" />)}
    </div>
  </div>
);

// ───────────────────────── Page ─────────────────────────
const CategoryLanding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();

  const [landing, setLanding] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [headerChips, setHeaderChips] = useState([]);
  const [categoryCards, setCategoryCards] = useState([]);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fallbackToListing = useCallback((name) => {
    openMithilaListing(navigate, { id: categoryId, name: name || location.state?.category }, { replace: true });
  }, [navigate, categoryId, location.state]);

  // Flow flags: this page lives inside the MithilaKart tab.
  useEffect(() => {
    try {
      localStorage.setItem('isMithilakFlow', 'true');
      localStorage.setItem('isQuickShopFlow', 'false');
      localStorage.setItem('isFreshGroceryFlow', 'false');
    } catch { /* ignore */ }
    window.dispatchEvent(new Event('storage'));
  }, []);

  // Existing header category navigation (same data the MithilaKart page uses).
  useEffect(() => {
    let cancelled = false;
    getHome('mithilak').then((data) => { if (!cancelled) setHeaderChips(mapNavChips(data?.chips || [])); }).catch(() => {});
    getCategories({ commerceFlow: 'mithilak' })
      .then((data) => { if (!cancelled) setCategoryCards(mapMithilaCategoryCards(data)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getCategoryLanding(categoryId)
      .then((data) => {
        if (cancelled) return;
        // Landing disabled or nothing configured: keep the original behaviour.
        if (!data || data.enabled === false || !data.blocks?.length) {
          fallbackToListing(data?.category?.name);
          return;
        }
        setLanding(data);
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, reloadKey]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  };

  const go = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) window.location.assign(link);
    else navigate(link);
  };

  const isChipActive = (chip) => {
    const target = resolveChipCategory(chip, categoryCards);
    return Boolean(target && String(target.id) === String(categoryId));
  };

  const handleProduct = (p) => {
    navigate('/vendor/product-detail', { state: { productId: p.productId || p.id, product: p.product || p } });
  };

  const handleAdd = async (p, e) => {
    e.stopPropagation();
    e.preventDefault();
    const name = p.title || p.name || 'Product';
    try {
      await addProductToCart({
        id: p.productId || p.product?._id || p.product?.id || p.id,
        listingId: p.listingId,
        marketplaceTab: 'mithilak',
        name,
        price: p.product?.price ?? p.price ?? 0,
        image: p.img || p.image,
      });
      showToast(`${name} added to cart!`);
    } catch (err) {
      showToast(err?.message || t('auto.couldNotAddToCart'));
    }
  };

  const handleSectionCta = (block) => {
    if (block.ctaLink) return go(block.ctaLink);
    openMithilaListing(navigate, { id: categoryId, name: landing?.category?.name });
  };

  return (
    <div className="bg-[#F5F9FA] min-h-screen select-none pb-24" data-testid="category-landing">
      <MithilaHeaderChips
        chips={headerChips}
        isChipActive={isChipActive}
        onSelect={(chip) => {
          const target = resolveChipCategory(chip, categoryCards);
          if (target && String(target.id) !== String(categoryId)) openMithilaCategory(navigate, target);
        }}
      />

      <div className="px-4 py-5 space-y-6 max-w-[1400px] mx-auto">
        {status === 'loading' && <LandingSkeleton />}

        {status === 'error' && (
          <div className="py-16 text-center space-y-3" data-testid="landing-error">
            <p className="text-[#3F2A20] font-bold">We couldn&apos;t load this page.</p>
            <div className="flex justify-center gap-2">
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="px-4 py-2 rounded-full bg-[#207C8A] text-white text-[12px] font-black">
                Try again
              </button>
              <button type="button" onClick={() => fallbackToListing()} className="px-4 py-2 rounded-full border border-[#207C8A] text-[#207C8A] text-[12px] font-black">
                Browse products
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && landing && (
          <>
            <h1 className="sr-only">{landing.category.name}</h1>
            {landing.blocks.map((block, i) => {
              if (block.type === 'banner') {
                return <LandingBanner key="banner" banners={block.banners} onOpen={go} />;
              }
              if (block.type === 'subcategories') {
                return (
                  <SubcategorySlider
                    key="subcategories"
                    title={landing.category.name}
                    items={block.items}
                    onSelect={(sub) => openMithilaListing(navigate, { id: sub.id, name: sub.originalName || sub.name })}
                  />
                );
              }
              const section = (
                <ProductSection key={block.id} block={block} onProduct={handleProduct} onAdd={handleAdd} onCta={handleSectionCta} />
              );
              // Below-the-fold sections render lazily; the first stays eager.
              return i < 3 ? section : <LazySection key={block.id} height="380px">{section}</LazySection>;
            })}
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900 text-white px-6 py-3 rounded-full text-[13px] font-bold shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
};

export default CategoryLanding;

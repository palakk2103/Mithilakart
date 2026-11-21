import { AddButton } from '../components/common/AddToCartButton';
import SeasonalHero from '../../../shared/components/SeasonalHero';
import PackagePromo from '../components/vendor/PackagePromo';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useWishlistToggle from '../hooks/useWishlistToggle';
import { ChevronRight, Heart, Star, ShoppingBag, MoreHorizontal } from 'lucide-react';
import useVendorStore from '../../../store/useVendorStore';
import { addProductToCart } from '../utils/cartUtils';
import { getCategories } from '../services/catalogApi';
import { mapMithilaCategoryCards, mapNavChips } from '../utils/mappers';
import { openCategoryExplorer, resolveChipCategory } from '../utils/categoryLandingNav';
import { getHeaderChipIcon } from '../../../shared/constants/headerChipIcons';

// Shared Home Components for Merchandising Pattern Alignment
import LazySection from '../components/vendor/home/LazySection';
import TopSelection from '../components/vendor/home/TopSelection';
import BrandsSpotlight from '../components/vendor/home/BrandsSpotlight';
import BestQuality from '../components/vendor/home/BestQuality';
import TrendingThisWeek from '../components/vendor/home/TrendingThisWeek';
import AlreadyBoughtSection from '../components/vendor/home/AlreadyBoughtSection';

import bannerIllustration from '../../../assets/banner_illustration.png';
import { handleImageError } from '../../../shared/utils/imageUtils';
import ScrollRow from '../components/vendor/home/ScrollRow';
import { useTranslation } from 'react-i18next';
import { tName } from '../../../shared/utils/translateName';
import PurohitSection from '../components/purohit/PurohitSection';

const getDisplayName = (name) => {
  if (name === 'Mithila Festival & Cultural') return 'Festival & Cultural';
  if (name === 'Mithila Special Cuisines') return 'Special Cuisines';
  if (name === 'Mithila Lac Bangles') return 'Lac Bangles';
  if (name === 'Mithila Handcrafted Items') return 'Handcrafted Decor';
  if (name === 'Mithila Pooja Needs') return 'Pooja Needs';
  if (name === 'Mithila Books & Panchang') return 'Books & Panchang';
  if (name === 'Mithila Achaar') return 'Mithila Achaar';
  return name;
};

// Mithila Decorative Corner Flower (Teal Theme)
const MithilaCornerFlower = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[10px] h-[10px] md:w-[13px] md:h-[13px] opacity-85 select-none pointer-events-none">
    <path d="M12 2C13 4.5 13 4.5 12 7C11 4.5 11 4.5 12 2Z" fill="#207C8A" />
    <path d="M12 22C13 19.5 13 19.5 12 17C11 19.5 11 19.5 12 22Z" fill="#207C8A" />
    <path d="M2 12C4.5 13 4.5 13 7 12C4.5 11 4.5 11 2 12Z" fill="#207C8A" />
    <path d="M22 12C19.5 13 19.5 13 17 12C19.5 11 19.5 11 22 12Z" fill="#207C8A" />
    <circle cx="12" cy="8.5" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="15.5" r="2.2" fill="#E67E22" />
    <circle cx="8.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="15.5" cy="12" r="2.2" fill="#E67E22" />
    <circle cx="12" cy="12" r="2.4" fill="#D35400" />
    <circle cx="12" cy="12" r="0.8" fill="#FFF" />
  </svg>
);

// Mithila Bottom Flourish Divider (Teal Theme)
const MithilaCardBottomDivider = () => (
  <div className="w-full flex items-center justify-center my-1 select-none pointer-events-none">
    <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65px] md:w-[85px] h-auto">
      <path d="M45 12 C35 14, 20 15, 10 12" stroke="#207C8A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 13 C34 11, 31 11, 30 12.5" fill="#207C8A" />
      <circle cx="32" cy="14.5" r="1.2" fill="#D35400" />
      <path d="M75 12 C85 14, 100 15, 110 12" stroke="#207C8A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M85 13 C86 11, 89 11, 90 12.5" fill="#207C8A" />
      <circle cx="88" cy="14.5" r="1.2" fill="#D35400" />
      <circle cx="60" cy="12" r="3.5" fill="#E67E22" />
      <circle cx="60" cy="5.5" r="2.2" fill="#D35400" />
      <circle cx="60" cy="18.5" r="2.2" fill="#D35400" />
      <circle cx="53.5" cy="12" r="2.2" fill="#D35400" />
      <circle cx="66.5" cy="12" r="2.2" fill="#D35400" />
    </svg>
  </div>
);

// Styled Product Card matching the reference image layout and structure
export const MithilaDealCard = React.memo(({ prod, onNavigate, onAddToCart, ctaLabel, ctaDisabled = false }) => {
  const { t } = useTranslation();
  const { isWishlisted: checkWishlisted, toggle: toggleWishlist } = useWishlistToggle();
  const wishlistTarget = prod.product?.id || prod.product?.productId ? prod.product : prod;
  const isWishlisted = checkWishlisted(wishlistTarget);
  const name =prod.title || prod.name || prod.label || 'Product';
  const price = prod.product?.price ?? prod.price ?? 0;
  const mrp = prod.product?.mrp || prod.mrp;
  const image = prod.img || prod.image;
  const brand = prod.product?.brand || 'MITHILAK';
  const discount = prod.product?.discount || prod.discount || (mrp && price && mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : null);
  const rating = prod.product?.rating || prod.product?.ratingAvg || 4.7;

  return (
    <div
      onClick={() => onNavigate(prod)}
      className="flex flex-col cursor-pointer group w-full h-full relative bg-[#FFFDF9] border border-[color:var(--ml-primary,#207C8A)]/25 rounded-[18px] md:rounded-[24px] p-2 md:p-3 shadow-[0_2px_8px_rgba(32,124,138,0.02)] hover:shadow-[0_6px_18px_rgba(32,124,138,0.06)] hover:border-[color:var(--ml-primary,#207C8A)]/50 transition-all duration-300 transform select-none justify-between"
    >
      {/* Inner Decorative Dashed Border */}
      <div className="absolute inset-0.5 md:inset-1 pointer-events-none border border-dashed border-[color:var(--ml-primary,#207C8A)]/20 rounded-[15px] md:rounded-[20px]" />

      {/* Corner Ornaments */}
      <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 z-10"><MithilaCornerFlower /></div>
      <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 z-10"><MithilaCornerFlower /></div>
      <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 z-10"><MithilaCornerFlower /></div>
      <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 z-10"><MithilaCornerFlower /></div>

      {/* Product Image Section */}
      <div className="relative aspect-square rounded-[14px] md:rounded-[18px] overflow-hidden bg-white/50 border border-[color:var(--ml-primary,#207C8A)]/15 p-1">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover rounded-[11px] md:rounded-[15px] group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy" onError={handleImageError} />

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist({ ...wishlistTarget, image: wishlistTarget.image || image, title: wishlistTarget.title || name });
          }}
          className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-sm flex items-center justify-center text-slate-700 hover:text-red-500 z-10 transition-all duration-200 active:scale-85"
        >
          <Heart
            size={11}
            className={`transition-colors ${isWishlisted ? 'fill-red-500 stroke-red-500 text-red-500' : 'stroke-[#3F2A20] fill-none'}`}
          />
        </button>

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-1.5 left-1.5 bg-[color:var(--ml-primary,#207C8A)] text-white text-[7.5px] md:text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-2xs leading-none z-10">
            {tName(discount)}
          </div>
        )}

        {/* Rating Badge */}
        {rating > 0 && (
          <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded-[4px] shadow-xs border border-[color:var(--ml-primary,#207C8A)]/20">
            <span className="text-[8px] md:text-[9.5px] font-black text-slate-800">{rating}</span>
            <Star size={7} fill="currentColor" className="text-amber-500 stroke-none" />
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="pt-2 pb-0.5 px-0.5 relative z-10 flex flex-col justify-between flex-1">
        <div>
          <span className="text-slate-400 text-[8.5px] md:text-[9.5px] font-bold block uppercase tracking-wider">{brand}</span>
          <h3 className="text-[11px] md:text-[13px] font-black text-[#3F2A20] line-clamp-1 leading-tight mt-0.5">
            {name}
          </h3>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[12px] md:text-[14px] font-black text-slate-900">₹{price}</span>
            {mrp && (
              <span className="text-[9px] md:text-[10px] text-gray-400 line-through font-semibold">₹{mrp}</span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mt-2.5 flex items-center justify-between gap-1 pt-1 border-t border-[color:var(--ml-primary,#207C8A)]/20">
          <AddButton onClick={(e) => onAddToCart(prod, e)} disabled={ctaDisabled} label={ctaLabel} />
        </div>

        <MithilaCardBottomDivider />
      </div>
    </div>
  );
});

// Adapter so shared sections (AlreadyBoughtSection) can render the teal Mithila card
const MithilaBoughtCard = ({ deal, ...rest }) => <MithilaDealCard prod={deal} {...rest} />;

// Header categories row for the Mithilak tab: same folder-tab design as the
// Mithilakart tab (thumbnail + name side by side), in Mithilak teal.
// Colours are mixed from the Mithilak tab theme colour (--ml-primary), so they
// follow whatever theme admin sets for the tab.
const ML = 'var(--ml-primary,#207C8A)';
const TAB_BG = `color-mix(in srgb, ${ML} 10%, white)`;         // bar + selected tab fill (same, so they merge)
const TAB_LINE = ML;                                            // selected tab outline — theme colour
const TAB_IDLE_FILL = `color-mix(in srgb, ${ML} 18%, white)`;  // unselected tab fill
const TAB_IDLE_LINE = `color-mix(in srgb, ${ML} 55%, white)`;  // unselected tab outline
const TAB_EDGE_W = 20;              // width of each slanted side
const TAB_W = 140;                  // every tab is the same width
const TAB_PAD_X = 10;               // inner left/right space of each tab
const TAB_OVERLAP = 10;             // neighbouring tabs overlap at their feet

// One slanted folder side (left). Right side is the same SVG mirrored.
const FolderEdge = ({ h, fill, stroke, mirror }) => {
  const W = TAB_EDGE_W;
  const b = h - 0.5;
  const curve = `M0,${b} C5,${b} 6,${h - 3} 7,${h - 10} L11,12 Q13,0.5 ${W},0.5`;
  return (
    <svg
      width={W}
      height={h}
      viewBox={`0 0 ${W} ${h}`}
      className="flex-shrink-0 block"
      style={mirror ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      {/* style (not attributes) so CSS var()/color-mix() colours work */}
      <path d={`${curve} L${W + 1},0.5 L${W + 1},${h} L0,${h} Z`} style={{ fill }} />
      <path d={curve} style={{ fill: 'none', stroke }} strokeWidth="1" />
    </svg>
  );
};

const MithilaChip = ({ chip, onClick, active = false, icon = null, buttonRef, ...rest }) => {
  const DynamicIcon = getHeaderChipIcon(chip.iconKey);
  const label = chip.label ? tName(chip.label) : chip.rawLabel;
  const h = active ? 66 : 60;
  const fill = active ? TAB_BG : TAB_IDLE_FILL;
  const stroke = active ? TAB_LINE : TAB_IDLE_LINE;
  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      data-active={active ? 'true' : undefined}
      {...rest}
      className={`relative flex-shrink-0 -ml-2.5 first:ml-0 cursor-pointer outline-none transition-[height] duration-200 ${
        active ? 'z-10' : 'hover:brightness-[0.98]'
      }`}
      style={{ height: h, width: TAB_W }}
    >
      {/* Folder shape: slanted left side + top edge + slanted right side */}
      <span className="absolute inset-0 flex pointer-events-none" aria-hidden="true">
        <FolderEdge h={h} fill={fill} stroke={stroke} />
        <span className="flex-1 -mx-px" style={{ backgroundColor: fill, borderTop: `1px solid ${stroke}` }} />
        <FolderEdge h={h} fill={fill} stroke={stroke} mirror />
      </span>

      <span className="relative h-full w-full flex items-center gap-2" style={{ paddingLeft: TAB_PAD_X, paddingRight: TAB_PAD_X }}>
        <span className="w-[44px] h-[44px] rounded-[12px] overflow-hidden flex items-center justify-center flex-shrink-0 text-[color:var(--ml-primary,#207C8A)] [&_svg]:w-[24px] [&_svg]:h-[24px]">
          {icon ? (
            icon
          ) : chip.imageUrl ? (
            <img src={chip.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" onError={handleImageError} />
          ) : DynamicIcon ? (
            <DynamicIcon size={24} />
          ) : (
            <ShoppingBag size={24} />
          )}
        </span>
        <span
          className={`text-[13px] leading-[1.15] tracking-tight text-left flex-1 min-w-0 whitespace-normal break-words line-clamp-2 ${
            active ? 'font-extrabold text-[color:var(--ml-primary,#207C8A)]' : 'font-semibold text-[#3F2A20]'
          }`}
        >
          {label}
        </span>
      </span>
    </button>
  );
};

export const MithilaHeaderChips = ({ chips, onSelect, isChipActive = null }) => {
  const { t } = useTranslation();
  const rowRef = useRef(null);
  const moreBtnRef = useRef(null);
  const menuRef = useRef(null);
  // { first, second } — null = show everything until measured.
  const [pageCounts, setPageCounts] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // Same logic as the Mithilakart header: all tabs share one width, ~3 screens of
  // tabs are shown (last one ends with "More"), the rest go in More.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;
    const compute = () => {
      const total = chips.length;
      const available = row.clientWidth - 20; // strip has pl-1 + pr-4
      const step = TAB_W - TAB_OVERLAP;
      const perScreen = Math.max(1, Math.floor((available - TAB_W) / step) + 1);
      if (total <= perScreen * 3) {
        setPageCounts({ first: Math.min(perScreen, total), second: Math.max(total - perScreen, 0) });
        return;
      }
      setPageCounts({ first: perScreen, second: Math.max(perScreen * 2 - 1, 1) });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(row);
    return () => ro.disconnect();
  }, [chips.length]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const inside = (el, target) => el && (el === target || el.contains(target));
    const onDown = (e) => {
      if (inside(menuRef.current, e.target) || inside(moreBtnRef.current, e.target)) return;
      setMoreOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    const onScroll = (e) => { if (!inside(menuRef.current, e.target)) setMoreOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [moreOpen]);

  const toggleMore = () => {
    if (!moreOpen && moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect();
      const menuWidth = 220;
      const margin = 12;
      const left = Math.min(Math.max(rect.right - menuWidth, margin), window.innerWidth - menuWidth - margin);
      setMenuPos({ top: rect.bottom + 8, left });
    }
    setMoreOpen((p) => !p);
  };

  if (!chips.length) return null;
  const shownCount = pageCounts ? pageCounts.first + pageCounts.second : chips.length;
  const hidden = chips.slice(shownCount);

  return (
    <>
      <div
        className="sticky top-[var(--mobile-header-height,170px)] md:top-[var(--desktop-header-height,57px)] z-40 pt-3 transition-all duration-200"
        style={{ backgroundColor: TAB_BG }}
      >
        <div ref={rowRef} className="relative overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Folder-tab strip: the bottom line is the "panel" edge the active tab opens into */}
          <div className="relative flex items-end pl-1 pr-4 pt-1 w-max min-w-full md:justify-center">
            {chips.slice(0, shownCount).map((chip) => (
              <MithilaChip
                key={chip.id}
                chip={chip}
                active={Boolean(isChipActive && isChipActive(chip))}
                onClick={(e) => {
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  onSelect(chip);
                }}
              />
            ))}
            {hidden.length > 0 && (
              <MithilaChip
                buttonRef={moreBtnRef}
                chip={{ id: 'more', label: t('common.more') }}
                icon={<MoreHorizontal size={22} />}
                onClick={toggleMore}
                aria-haspopup="true"
                aria-expanded={moreOpen}
              />
            )}
          </div>
        </div>
      </div>

      {moreOpen && hidden.length > 0 && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[70] w-[220px] overflow-y-auto overscroll-contain rounded-2xl border border-[color:var(--ml-primary,#207C8A)]/20 bg-white shadow-[0_12px_30px_rgba(32,124,138,0.2)] p-2"
          style={{ top: menuPos.top, left: menuPos.left, maxHeight: `min(70vh, calc(100dvh - ${menuPos.top + 76}px))` }}
        >
          {hidden.map((chip) => {
            const DynamicIcon = getHeaderChipIcon(chip.iconKey);
            const label = chip.label ? tName(chip.label) : chip.rawLabel;
            return (
              <button
                key={chip.id}
                type="button"
                role="menuitem"
                onClick={() => { onSelect(chip); setMoreOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-[#3F2A20] hover:bg-[#F0F9FA] transition-colors cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-[color:var(--ml-primary,#207C8A)]/10 flex items-center justify-center flex-shrink-0 text-[color:var(--ml-primary,#207C8A)]">
                  {chip.imageUrl ? (
                    <img src={chip.imageUrl} alt={label} className="w-4 h-4 object-contain rounded-full" loading="lazy" decoding="async" onError={handleImageError} />
                  ) : DynamicIcon ? (
                    <DynamicIcon size={14} />
                  ) : (
                    <ShoppingBag size={14} />
                  )}
                </span>
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

const Mithilak = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mithilaCategories, setMithilaCategories] = useState([]);
  const { fetchHomeSections, homeSections, bannersByFlow } = useVendorStore();
  const homeBanners = bannersByFlow.mithilak;
  const [bannerIndex, setBannerIndex] = useState(0);
  // Header categories (chips) created by admin for the Mithilak tab
  const [headerChips, setHeaderChips] = useState([]);
  const adminBanners = (Array.isArray(homeBanners) ? homeBanners : [])
    .filter((b) => b?.imageUrl || b?.image)
    .map((b, idx) => ({
      id: b.id || b._id || `banner-${idx}`,
      image: b.imageUrl || b.image,
      title: b.title || '',
      link: b.linkUrl || b.link || '',
    }));

  useEffect(() => {
    if (adminBanners.length <= 1) return undefined;
    const timer = setInterval(() => setBannerIndex((i) => (i + 1) % adminBanners.length), 3500);
    return () => clearInterval(timer);
  }, [adminBanners.length]);

  useEffect(() => {
    localStorage.setItem('isMithilakFlow', 'true');
    localStorage.setItem('isQuickShopFlow', 'false');
    localStorage.setItem('isFreshGroceryFlow', 'false');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cartUpdated'));
    fetchHomeSections('mithilak').then((data) => {
      setHeaderChips(mapNavChips(data?.chips || []));
    });
  }, [fetchHomeSections]);

  useEffect(() => {
    let cancelled = false;

    getCategories({ commerceFlow: 'mithilak' })
      .then((data) => {
        if (!cancelled) setMithilaCategories(mapMithilaCategoryCards(data));
      })
      .catch(() => {
        if (!cancelled) setMithilaCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="bg-[#F5F9FA] min-h-screen select-none pb-6">
      {/* 0. Header Categories (admin-managed for Mithilak tab) */}
      <MithilaHeaderChips
        chips={headerChips}
        // On the Mithilak home, "You Buy" is the selected tab (same as Mithilakart)
        isChipActive={(chip) => chip?.id === 'for-you' || String(chip?.rawLabel || chip?.label || '').trim().toLowerCase() === 'you buy'}
        onSelect={(chip) => {
          const target = resolveChipCategory(chip, mithilaCategories);
          if (!target) {
            // Chips that aren't tied to a category used to do nothing on tap.
            const key = String(chip?.rawLabel || chip?.label || '').trim().toLowerCase();
            if (chip?.id === 'for-you' || key === 'you buy') {
              // "You Buy" = this tab's home: just return to the top.
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            } else if (/deal/.test(key) || /deal/.test(String(chip?.id || '').toLowerCase())) {
              navigate('/deals');
            } else {
              navigate('/categories?flow=mithilak', { state: { flow: 'mithilak' } });
            }
            return;
          }
          openCategoryExplorer(navigate, { flow: 'mithilak', id: target.id, name: target.name });
        }}
      />

      <SeasonalHero className="mx-4 mt-4" />
      <PackagePromo marketplaceTab="mithilak" />

      <div className="px-4 py-5">
      {/* 1. Page Title Header */}

      {/* 2. Hero Promotional Banner */}
      {adminBanners.length > 0 ? (
        <div className="mb-6 relative rounded-2xl overflow-hidden shadow-sm h-[165px] md:h-[300px] bg-[#EAF4F6]">
          {adminBanners.map((banner, idx) => (
            <div
              key={banner.id}
              onClick={() => banner.link && navigate(banner.link)}
              className={`absolute inset-0 transition-opacity duration-500 ${idx === bannerIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${banner.link ? 'cursor-pointer' : ''}`}
            >
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={handleImageError} />
            </div>
          ))}
          {adminBanners.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {adminBanners.map((banner, idx) => (
                <button
                  key={banner.id}
                  onClick={() => setBannerIndex(idx)}
                  aria-label={`Banner ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === bannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="mb-6 bg-gradient-to-r from-[color:var(--ml-primary,#207C8A)] to-[#5DB6C3] rounded-2xl p-4 text-white relative overflow-hidden shadow-sm flex items-center justify-between h-[165px]">
        <div className="z-10 flex-1 max-w-[65%] flex flex-col justify-center h-full">
          <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
            {t('auto.mithilaUtsav')}
          </span>
          <h3 className="text-[17px] font-bold mt-2 leading-tight tracking-tight">
            {t('auto.authenticMithilaArtistry')}
          </h3>
          <p className="text-[11.5px] text-white/90 font-medium mt-1">
            {t('auto.flat20OffOnPaintings')}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 h-full w-[42%] flex items-end justify-end pointer-events-none overflow-hidden">
          <img
            src={bannerIllustration}
            alt="Mithila Artistry Illustration"
            className="h-[95%] object-contain object-bottom select-none pr-2" loading="lazy" decoding="async" onError={handleImageError} />
        </div>
      </div>
      )}

      {/* 3. Shop by Categories (same pattern as Mithilakart, teal theme) */}
      {mithilaCategories.length > 0 && (
        <div className="py-4 w-full max-w-[1600px] mx-auto mb-5 md:mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[16px] md:text-[18px] font-black text-[#3F2A20] tracking-tight">
              {t('auto.shopByCategories')}
            </h2>
            <span
              onClick={() => {
                localStorage.setItem('isMithilakFlow', 'true');
                localStorage.setItem('isQuickShopFlow', 'false');
                navigate('/categories?flow=mithilak');
              }}
              className="text-[13px] font-bold text-[color:var(--ml-primary,#207C8A)] hover:text-[#17606B] cursor-pointer hover:underline transition-colors"
            >
              {t('auto.viewAll')}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-full text-[12px] md:text-[13px] font-black whitespace-nowrap border bg-[color:var(--ml-primary,#207C8A)] text-white border-[color:var(--ml-primary,#207C8A)] shadow-xs"
            >
              {t('auto.allCategories')}
            </button>
          </div>

          <ScrollRow className="flex items-center gap-3 md:gap-5 pb-2 pt-1 -mx-1 px-1">
            {mithilaCategories.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => openCategoryExplorer(navigate, { flow: 'mithilak', id: item.id, name: item.name })}
                className="flex-shrink-0 w-[104px] sm:w-[120px] md:w-[140px] flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-full aspect-[1/1.25] bg-white border border-[#EADCC9]/60 rounded-[20px] overflow-hidden flex flex-col items-center justify-between p-2 md:p-2.5 shadow-[0_3px_8px_rgba(61,35,20,0.015)] group-hover:shadow-[0_6px_15px_rgba(32,124,138,0.08)] group-hover:border-[color:var(--ml-primary,#207C8A)]/40 transition-all duration-300 transform">
                  <div className="w-full h-[38px] sm:h-[40px] md:h-[44px] flex items-center justify-center px-0.5">
                    <span className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#3F2A20] text-center leading-[1.2] line-clamp-2 break-words">
                      {getDisplayName(item.name)}
                    </span>
                  </div>
                  <div className="w-[84%] aspect-square rounded-[14px] overflow-hidden bg-[#FAF9F5] border border-[#EADCC9]/40 flex items-center justify-center p-0.5 mb-0.5 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover rounded-[11px] group-hover:scale-[1.04] transition-transform duration-500" loading="lazy" decoding="async" />
                    ) : (
                      <span className="text-[12px] font-black text-[color:var(--ml-primary,#207C8A)]">{item.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </ScrollRow>
        </div>
      )}

      {/* 3a. Mithila Purohit & Ritual Services (admin-managed, Mithilak tab only) */}
      <PurohitSection />

      {/* 3b. Already Bought Products (authenticated customers with purchases only) */}
      <div className="mb-6 md:mb-8 empty:hidden">
        <AlreadyBoughtSection CardComponent={MithilaBoughtCard} />
      </div>

      {/* 4. Trending This Week Section */}
      <div className="mb-6 md:mb-8 w-full md:max-w-[1600px] md:mx-auto">
        <TrendingThisWeek theme="mithilak" />
      </div>

      {/* 5. Today's Special Deals / Best Sellers Section */}
      <div className="md:max-w-[1600px] md:mx-auto md:w-full mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[17px] font-bold text-[#3F2A20] leading-none">{t('auto.todaySSpecialDeals')}</h2>
          <span 
            onClick={() => {
              localStorage.setItem('isMithilakFlow', 'true');
              localStorage.setItem('isQuickShopFlow', 'false');
              navigate('/mithilak/category', { state: { category: mithilaCategories[0]?.name || 'Mithila Handcrafted Items', categoryId: mithilaCategories[0]?.id } });
            }}
            className="text-[12px] text-[color:var(--ml-primary,#207C8A)] font-bold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            {t('common.viewAll')} <ChevronRight size={13} strokeWidth={2.5} className="inline-block" />
          </span>
        </div>

        {/* Horizontal Scrolling Single Row */}
        <ScrollRow className="flex items-stretch gap-3 md:gap-4 snap-x pb-2 pt-1 -mx-1 px-1">
          {(homeSections.todaysSpecialDeals?.length ? homeSections.todaysSpecialDeals : (homeSections.topSelection?.length ? homeSections.topSelection : homeSections.brandsSpotlight || [])).map((prod) => (
            <div key={prod.id} className="w-[165px] sm:w-[195px] md:w-[220px] flex-shrink-0 snap-start flex flex-col">
              <MithilaDealCard
                prod={prod}
                onNavigate={(p) => {
                  localStorage.setItem('isMithilakFlow', 'true');
                  localStorage.setItem('isQuickShopFlow', 'false');
                  navigate('/vendor/product-detail', { state: { productId: p.id, product: p.product || p } });
                }}
                onAddToCart={async (p, e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const name = p.title || p.name || p.label || 'Product';
                  const price = p.product?.price ?? p.price ?? 0;
                  const image = p.img || p.image;
                  try {
                    await addProductToCart({
                      id: p.productId || p.product?._id || p.product?.id || p.id,
                      listingId: p.listingId,
                      marketplaceTab: 'mithilak',
                      name,
                      price,
                      image,
                    });
                    triggerToast(`${name} added to cart!`);
                  } catch (err) {
                    triggerToast(err?.message || t('auto.couldNotAddToCart'));
                  }
                }}
              />
            </div>
          ))}
        </ScrollRow>
      </div>

      {/* 6. Top Selection Section */}
      {homeSections.topSelection?.length > 0 && (
        <div className="mb-5 md:mb-8">
          <LazySection height="400px">
            <TopSelection items={homeSections.topSelection} />
          </LazySection>
        </div>
      )}

      {/* 7. Brands / Artisans Spotlight Section */}
      {(homeSections.brandsSpotlight?.length > 0 || homeSections.topSelection?.length > 0) && (
        <div className="mb-5 md:mb-8">
          <LazySection height="350px">
            <BrandsSpotlight items={homeSections.brandsSpotlight?.length ? homeSections.brandsSpotlight : homeSections.topSelection} />
          </LazySection>
        </div>
      )}

      {/* 8. Best Quality Guaranteed Section */}
      {(homeSections.bestQualityGuaranteed?.length > 0 || homeSections.bestQuality?.length > 0 || homeSections.topSelection?.length > 0) && (
        <div className="mb-5 md:mb-8">
          <LazySection height="500px">
            <BestQuality items={homeSections.bestQualityGuaranteed?.length ? homeSections.bestQualityGuaranteed : (homeSections.bestQuality?.length ? homeSections.bestQuality : homeSections.topSelection)} />
          </LazySection>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900 text-white px-6 py-3 rounded-full text-[13px] font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
      </div>
    </div>
  );
};

export default Mithilak;

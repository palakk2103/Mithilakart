import React, { useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import useVendorStore from '../../../store/useVendorStore';
import { SECTION_PAGES } from '../utils/sectionLinks';
import { handleImageError, getProductImage } from '../../../shared/utils/imageUtils';
import AddToCartButton from '../components/common/AddToCartButton';

// "View All" page for a home section: lists every product the admin put in that section.
const SectionProducts = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const page = SECTION_PAGES[slug];
  const homeSections = useVendorStore((s) => s.homeSections);
  const homeLoading = useVendorStore((s) => s.homeLoading);
  const activeFlow = useVendorStore((s) => s.activeFlow);
  const fetchHomeSections = useVendorStore((s) => s.fetchHomeSections);
  const fetchFlowHome = useVendorStore((s) => s.fetchFlowHome);

  const items = useMemo(() => {
    if (!page) return [];
    const key = page.storeKeys.find((k) => homeSections?.[k]?.length);
    return key ? homeSections[key] : [];
  }, [page, homeSections]);

  // Opened directly / refreshed: the home store is empty, so load it.
  useEffect(() => {
    if (!page || items.length) return;
    if (activeFlow && activeFlow !== 'mithilakart' && activeFlow !== 'standard') {
      fetchFlowHome(activeFlow);
    } else {
      fetchHomeSections('standard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!page) return <Navigate to="/all-offers" replace />;

  const openProduct = (item) => {
    const prod = item.product && Object.keys(item.product).length ? item.product : null;
    navigate('/product-detail', {
      state: {
        productId: item.id,
        product: prod || {
          id: item.id,
          name: item.name || item.title,
          brand: item.brand,
          price: item.price,
          oldPrice: item.mrp || item.price,
          image: item.img,
        },
      },
    });
  };

  return (
    <div className="bg-[#f4faf6] min-h-screen pb-24 font-sans" data-testid="section-products-page">
      <div className="sticky top-0 z-50 bg-[#3E5A44] text-white px-4 py-3 flex items-center gap-4 shadow-md">
        <button onClick={() => navigate(-1)} aria-label="Back" className="active:scale-95 p-1 hover:bg-white/10 rounded-full">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[19px] font-black tracking-tight">{page.title}</h1>
      </div>

      <div className="px-5 py-3 bg-white/70 border-b border-slate-100/50">
        <h2 className="text-[15px] font-black text-[#3F2A20] tracking-tight">
          {page.title} <span className="text-[10.5px] font-semibold text-slate-500 ml-1" data-testid="section-products-count">({items.length} products)</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {!items.length ? (
          <p className="text-sm text-slate-500 col-span-full text-center py-8">
            {homeLoading ? 'Loading…' : 'No products in this section yet.'}
          </p>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || idx}
              data-testid="section-product-card"
              onClick={() => openProduct(item)}
              className="bg-white rounded-[24px] p-3 border border-slate-100 flex flex-col items-center justify-between cursor-pointer active:scale-[0.98] transition-all group hover:shadow-sm"
            >
              <div className="aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden p-2 flex items-center justify-center w-full mb-3">
                <img
                  src={getProductImage(item.img || item.image)}
                  alt={item.name || item.title}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>
              <div className="text-center w-full space-y-1">
                <h3 className="text-[11px] md:text-[12.5px] font-black text-[#3F2A20] line-clamp-1 leading-tight">
                  {item.name || item.title}
                </h3>
                <div className="flex items-baseline gap-1.5 justify-center pt-1">
                  <span className="text-[12px] md:text-[14px] font-black text-slate-900">₹{item.price}</span>
                  {item.mrp > item.price && <span className="text-[9px] md:text-[10px] text-gray-400 line-through font-semibold">₹{item.mrp}</span>}
                </div>
              </div>
              {item.price > 0 && (
                <div className="w-[68px] mt-2" onClick={(e) => e.stopPropagation()}>
                  <AddToCartButton product={item} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SectionProducts;

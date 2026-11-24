import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Gift } from 'lucide-react';
import { getPackages } from '../../services/packageApi';
import { formatPrice } from '../../../../shared/utils/priceFormatter';
import { getImageUrl, handleImageError } from '../../../../shared/utils/imageUtils';

/**
 * Entry cards for admin-managed customisable packages (e.g. Mithila Dwirangman).
 * Renders nothing when the tab has no active package. Inside a category
 * (`categoryId` / `categoryName`) only that category's packages show — or all
 * of them when the category itself is the packages category.
 */
const PackagePromo = ({ marketplaceTab = 'mithilak', categoryId = null, categoryName = '' }) => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPackages(marketplaceTab)
      .then((data) => { if (!cancelled) setPackages(Array.isArray(data) ? data : (data?.data || [])); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [marketplaceTab]);

  const inCategory = Boolean(categoryId || categoryName);
  const isPackageCategory = /packag|combo|dwirag|dwirang|पैकेज/i.test(categoryName || '');
  const shown = !inCategory || isPackageCategory
    ? packages
    : packages.filter((p) => (p.categoryIds || []).includes(String(categoryId)));
  if (!shown.length) return null;

  return (
    <div className="px-4 pt-4 space-y-3" data-testid="package-promo">
      {shown.map((pkg) => (
        <button
          key={pkg.id}
          type="button"
          onClick={() => navigate(`/package/${pkg.slug}`)}
          className="w-full text-left bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden flex items-stretch active:scale-[0.99] transition-transform"
        >
          <span className="w-28 flex-shrink-0 relative bg-slate-100">
            <img src={getImageUrl(pkg.imageUrl)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" onError={handleImageError} />
          </span>
          <span className="flex-1 min-w-0 p-3.5">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ml-primary,#207C8A)' }}>
              <Gift size={13} /> Customisable package
            </span>
            <span className="block text-[16px] font-extrabold text-slate-900 leading-snug mt-0.5">{pkg.name}</span>
            <span className="block text-[12.5px] text-slate-500 mt-0.5">{pkg.items.length} items · tick only what you need</span>
            <span className="flex items-center justify-between mt-2">
              <span className="text-[15px] font-extrabold text-slate-900">
                {formatPrice(pkg.minPrice)} <span className="text-[12px] font-semibold text-slate-500">– {formatPrice(pkg.fullPrice)}</span>
              </span>
              <ChevronRight size={20} className="text-slate-400" />
            </span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default PackagePromo;

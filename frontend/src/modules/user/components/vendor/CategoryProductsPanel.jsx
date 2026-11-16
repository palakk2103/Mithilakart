import { useCallback } from 'react';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { getCategoryProducts } from '../../services/catalogApi';
import { extractList, mapProductForCard } from '../../utils/mappers';
import useInfiniteProducts from '../../../../shared/hooks/useInfiniteProducts';
import InfiniteScrollSentinel from '../../../../shared/components/InfiniteScrollSentinel';
import ProductCard from '../common/ProductCard';

/**
 * Products of one (child) category, rendered inside the Categories page itself so
 * tapping a child category no longer leaves the page. The parent owns "back": it
 * pops the history entry it pushed, which returns to exactly the subcategory grid
 * (and scroll position) the shopper tapped from.
 */
const CategoryProductsPanel = ({ categoryId, categoryName, parentName, marketplaceTab, onBack }) => {
  const fetchPage = useCallback(async (page, limit) => {
    const res = await getCategoryProducts(categoryId, { marketplaceTab, page, limit });
    const list = extractList(res?.data ?? res);
    const meta = res?.meta ?? res?.data?.meta;
    return {
      items: list.map((p) => mapProductForCard(p)),
      hasMore: meta ? Boolean(meta.hasMore ?? (meta.page < meta.totalPages)) : list.length >= limit,
    };
  }, [categoryId, marketplaceTab]);

  const { items, loading, loadingMore, error, hasMore, loadMore, retry } = useInfiniteProducts(
    fetchPage,
    [categoryId, marketplaceTab],
    { limit: 24 }
  );

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Back to subcategories"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1 min-w-0">
          {parentName && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{parentName}</p>}
          <h2 className="text-[16px] font-extrabold text-slate-900 leading-tight break-words">{categoryName}</h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3" aria-busy>
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border border-slate-100 p-3 animate-pulse">
              <div className="aspect-square rounded-lg bg-slate-100" />
              <div className="h-3 bg-slate-100 rounded mt-3 w-3/4" />
              <div className="h-3 bg-slate-100 rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      ) : error && items.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-[14px] font-semibold text-slate-700">Couldn&apos;t load products</p>
          <button type="button" onClick={retry} className="mt-3 px-5 h-10 rounded-full bg-slate-900 text-white text-[13px] font-bold">Try again</button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center flex flex-col items-center">
          <PackageOpen size={44} className="text-slate-300" />
          <p className="text-[14px] font-bold text-slate-700 mt-3">No products here yet</p>
          <p className="text-[12.5px] text-slate-500 mt-1">Try browsing other subcategories.</p>
          <button type="button" onClick={onBack} className="mt-4 px-5 h-10 rounded-full bg-slate-900 text-white text-[13px] font-bold">Back to subcategories</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {items.map((product) => <ProductCard key={product.listingId || product.id} product={product} />)}
          </div>
          <InfiniteScrollSentinel
            onVisible={loadMore}
            disabled={!hasMore}
            loadingMore={loadingMore}
            error={error}
            onRetry={retry}
            watch={items.length}
          />
        </>
      )}
    </div>
  );
};

export default CategoryProductsPanel;

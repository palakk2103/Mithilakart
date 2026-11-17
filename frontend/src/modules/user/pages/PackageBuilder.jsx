import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ShoppingCart, RotateCcw, CheckCheck, Lock, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPackage } from '../services/packageApi';
import { addCartItem } from '../services/cartApi';
import { dispatchCartUpdated, ensureLoggedIn } from '../utils/cartUtils';
import { quoteSelection } from '../utils/packagePricing';
import { formatPrice } from '../../../shared/utils/priceFormatter';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const ACCENT = 'var(--ml-primary, #207C8A)';

/**
 * Customise a package: tick or untick any item, the price follows, and "Add to Cart"
 * adds exactly that selection. Price rules (full price, minimum value) come from the
 * admin-managed package; the server re-checks and re-prices the selection on add.
 */
const PackageBuilder = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing
  const [selected, setSelected] = useState(() => new Set());
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getPackage(slug || 'mithila-dwirangman')
      .then((data) => {
        if (cancelled) return;
        const p = data?.data ?? data;
        setPkg(p);
        setSelected(new Set((p.items || []).map((it) => it.id)));
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('missing'); });
    return () => { cancelled = true; };
  }, [slug]);

  const quote = useMemo(() => (pkg ? quoteSelection(pkg, selected) : null), [pkg, selected]);

  const toggle = (item) => {
    if (item.isMandatory) return;
    setAdded(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
      return next;
    });
  };
  const selectAll = () => { setAdded(false); setSelected(new Set(pkg.items.map((it) => it.id))); };
  const clearAll = () => { setAdded(false); setSelected(new Set(pkg.items.filter((it) => it.isMandatory).map((it) => it.id))); };

  const addToCart = async () => {
    if (!quote?.valid || adding) return;
    try {
      ensureLoggedIn('Please log in to add this package to your cart');
    } catch {
      return; // the login prompt is already on its way
    }
    setAdding(true);
    try {
      await addCartItem({
        packageId: pkg.id,
        selectedItemIds: pkg.items.filter((it) => it.isMandatory || selected.has(it.id)).map((it) => it.id),
        quantity: 1,
        marketplaceTab: pkg.marketplaceTab || 'mithilak',
        commerceFlow: 'mithilak',
      });
      dispatchCartUpdated();
      setAdded(true);
      toast.success('Package added to your cart');
    } catch (err) {
      toast.error(err?.message || 'Could not add the package to your cart');
    } finally {
      setAdding(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F9FA] p-4 space-y-3 animate-pulse" aria-busy>
        <div className="h-12 bg-white rounded-xl" /><div className="h-40 bg-white rounded-2xl" />
        {[0, 1, 2, 3, 4].map((n) => <div key={n} className="h-20 bg-white rounded-2xl" />)}
      </div>
    );
  }

  if (status === 'missing' || !pkg) {
    return (
      <div className="min-h-screen bg-[#F5F9FA] flex flex-col items-center justify-center text-center px-6">
        <p className="text-[17px] font-bold text-slate-900">This package isn&apos;t available right now</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-5 px-8 h-11 rounded-full text-white font-bold text-[14px]" style={{ background: ACCENT }}>Go back</button>
      </div>
    );
  }

  const minMarkerPct = Math.min(100, (quote.minPrice / quote.fullPrice) * 100);
  const fillPct = Math.min(100, (quote.price / quote.fullPrice) * 100);

  return (
    <div className="min-h-screen bg-[#F5F9FA] pb-44 font-sans text-slate-800">
      <header className="sticky top-0 z-40 h-14 px-4 flex items-center gap-3 text-white shadow-sm" style={{ background: ACCENT }}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:scale-95">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold truncate">Customise your package</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Package summary */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          {pkg.imageUrl && (
            <div className="relative aspect-[16/9] bg-slate-100">
              <img src={getImageUrl(pkg.imageUrl)} alt={pkg.name} className="absolute inset-0 w-full h-full object-cover" onError={handleImageError} />
            </div>
          )}
          <div className="p-4">
            <h2 className="text-[19px] font-extrabold text-slate-900 leading-snug">{pkg.name}</h2>
            {pkg.description && <p className="text-[13.5px] text-slate-600 mt-1 leading-relaxed">{pkg.description}</p>}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-[24px] font-extrabold text-slate-900">{formatPrice(pkg.fullPrice)}</span>
              <span className="text-[13px] text-slate-500">for all {quote.totalCount} items</span>
            </div>
          </div>
        </section>

        {/* Rule + progress */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4">
          <div className="flex items-start gap-2 text-[13px] text-slate-600">
            <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
            <p>Tick the items you want. Your package must be worth at least <b className="text-slate-900">{formatPrice(quote.minPrice)}</b>.</p>
          </div>
          <div className="relative h-2.5 rounded-full bg-slate-200 mt-4" role="progressbar" aria-valuemin={0} aria-valuemax={quote.fullPrice} aria-valuenow={quote.price} aria-label="Package value">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${fillPct}%`, background: quote.valid ? '#16A34A' : '#F59E0B' }} />
            <span className="absolute -top-1 w-0.5 h-4.5 bg-slate-700 rounded" style={{ left: `${minMarkerPct}%` }} aria-hidden />
          </div>
          <div className="flex justify-between text-[11.5px] font-semibold text-slate-500 mt-1.5">
            <span>₹0</span>
            <span style={{ marginLeft: `${Math.max(0, minMarkerPct - 18)}%` }}>Min {formatPrice(quote.minPrice)}</span>
            <span>{formatPrice(quote.fullPrice)}</span>
          </div>
        </section>

        {/* Items */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-[15px] font-bold text-slate-900">Items in this package ({quote.selectedCount}/{quote.totalCount})</h3>
            <div className="flex gap-1">
              <button type="button" onClick={selectAll} className="h-9 px-3 rounded-full text-[12.5px] font-bold flex items-center gap-1 active:scale-95" style={{ color: ACCENT }}>
                <CheckCheck size={15} /> All
              </button>
              <button type="button" onClick={clearAll} className="h-9 px-3 rounded-full text-[12.5px] font-bold text-slate-500 flex items-center gap-1 active:scale-95">
                <RotateCcw size={14} /> Clear
              </button>
            </div>
          </div>

          <ul className="space-y-2.5">
            {pkg.items.map((item) => {
              const on = item.isMandatory || selected.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={`${item.name}${item.isMandatory ? ' (included)' : ''}`}
                    onClick={() => toggle(item)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl border bg-white transition-colors min-h-[72px] ${on ? 'border-transparent shadow-sm ring-2' : 'border-slate-200 opacity-80'}`}
                    style={on ? { '--tw-ring-color': ACCENT } : undefined}
                  >
                    <span
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${on ? 'text-white' : 'border-slate-300 bg-white'}`}
                      style={on ? { background: ACCENT, borderColor: ACCENT } : undefined}
                    >
                      {on && (item.isMandatory ? <Lock size={12} /> : <Check size={15} strokeWidth={3} />)}
                    </span>
                    <span className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 relative">
                      <img src={getImageUrl(item.imageUrl)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" onError={handleImageError} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14.5px] font-bold text-slate-900 leading-snug">{item.name}</span>
                      {item.description && <span className="block text-[12px] text-slate-500 leading-snug line-clamp-1">{item.description}</span>}
                      {item.isMandatory && <span className="inline-block mt-0.5 text-[11px] font-bold text-slate-500">Always included</span>}
                    </span>
                    {Number(item.price) > 0 && (
                      <span className="text-[13.5px] font-bold text-slate-700 flex-shrink-0">{formatPrice(item.price)}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {/* Sticky total + add to cart */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 shadow-[0_-6px_20px_rgba(0,0,0,0.07)] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          {quote.message && <p className="text-[12.5px] font-semibold text-amber-700 mb-2 leading-snug" role="status">{quote.message}</p>}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <p className="text-[11.5px] font-semibold text-slate-500">{quote.selectedCount} of {quote.totalCount} items</p>
              <p className="text-[22px] font-extrabold text-slate-900 leading-none mt-0.5" data-testid="package-price">{formatPrice(quote.price, quote.price % 1 !== 0)}</p>
              {quote.savings > 0 && <p className="text-[11px] font-semibold text-slate-500 line-through mt-0.5">{formatPrice(quote.fullPrice)}</p>}
            </div>
            {added ? (
              <button type="button" onClick={() => navigate('/cart')} className="flex-1 h-12 rounded-full text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-95" style={{ background: '#16A34A' }}>
                <ShoppingCart size={18} /> Go to Cart
              </button>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                disabled={!quote.valid || adding}
                className="flex-1 h-12 rounded-full text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-45 disabled:active:scale-100"
                style={{ background: ACCENT }}
              >
                <ShoppingCart size={18} /> {adding ? 'Adding…' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageBuilder;

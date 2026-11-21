import { useRef, useState } from 'react';
import { Upload, Loader2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { fileToCompressedDataUrl } from '../../../../features/purohit/imageFile';
import { POSTER_ASSETS } from '../../../../features/purohit/purohitSeed';

export const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm font-semibold outline-none focus:border-blue-500';
export const labelCls = 'text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1';
export const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer hover:bg-blue-700';
export const btnGhost = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 cursor-pointer';
export const iconBtn = 'p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export const Field = ({ label, children, className = '', hint }) => (
  <div className={className}>
    {label && <label className={labelCls}>{label}</label>}
    {children}
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const StatusBadge = ({ active, onLabel = 'Active', offLabel = 'Inactive' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
    {active ? onLabel : offLabel}
  </span>
);

export const Pill = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    teal: 'bg-teal-50 text-teal-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
};

/** Accessible on/off switch. */
export const Toggle = ({ checked, onChange, label, testId }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    data-testid={testId}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
  </button>
);

export const CheckboxRow = ({ checked, onChange, children }) => (
  <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-blue-600" />
    {children}
  </label>
);

export const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="relative flex-1 min-w-[180px]">
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input className={`${inputCls} pl-9 bg-white`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
  </div>
);

export const EmptyState = ({ icon: Icon, title, children }) => (
  <div className="text-center py-14 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400">
    {Icon && <Icon size={36} className="mx-auto mb-3 opacity-40" />}
    <p className="text-sm font-bold text-slate-500">{title}</p>
    {children && <div className="text-xs mt-1">{children}</div>}
  </div>
);

/**
 * Image picker: choose a file (resized + stored locally as a data URL) or paste a URL.
 * Frontend-only — no upload request is made.
 */
/** Link + guidance for designers making a new pandit card template. */
export const TemplateHelp = () => (
  <>
    Use the same layout (555 × 647 or the same proportion) with the text areas left blank —{' '}
    <a href={POSTER_ASSETS.template} download="pandit-card-template.webp" className="font-bold text-blue-600 hover:underline">download the blank template</a>.
  </>
);

/** "+ Add photo" tile: choose a file, it is resized and handed to onAdd(dataUrl). */
export const GalleryAdd = ({ onAdd, disabled }) => {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try { onAdd(await fileToCompressedDataUrl(file, { maxSize: 560 })); } catch (err) { toast.error(err?.message || 'Could not use that image'); } finally { setBusy(false); }
  };
  return (
    <>
      <button type="button" disabled={disabled || busy} onClick={() => ref.current?.click()} aria-label="Add photo" className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 flex flex-col items-center justify-center text-[10px] font-bold hover:border-blue-400 hover:text-blue-500 disabled:opacity-40 cursor-pointer">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Add
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} data-testid="gallery-input" />
    </>
  );
};

export const ImagePicker = ({ value, onChange, fallback, aspect = 'aspect-square', label = 'Image', testId, maxSize }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const isData = typeof value === 'string' && value.startsWith('data:');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      onChange(await fileToCompressedDataUrl(file, maxSize ? { maxSize } : undefined));
    } catch (err) {
      toast.error(err?.message || 'Could not use that image');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-3 items-start">
        <div className={`w-24 ${aspect} flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50`}>
          <img src={value || fallback} alt="Preview" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Choose image
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 cursor-pointer">
                <X size={14} /> Remove
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} data-testid={testId} />
          </div>
          <input
            className={inputCls}
            value={isData ? '' : (value || '')}
            onChange={(e) => onChange(e.target.value.trim())}
            placeholder={isData ? 'Using chosen image file' : '…or paste an image URL'}
            aria-label={`${label} URL`}
          />
          <p className="text-[11px] text-slate-400">No image? A generated illustration is shown instead.</p>
        </div>
      </div>
    </div>
  );
};

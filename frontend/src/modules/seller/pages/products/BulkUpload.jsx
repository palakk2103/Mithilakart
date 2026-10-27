/**
 * Bulk Product Upload
 * Seller uploads a CSV / Excel sheet (+ optional image files), reviews a full
 * preview with images, then confirms to save everything in one go.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Upload, FileSpreadsheet, Images, X, Loader2, CheckCircle2,
  AlertCircle, AlertTriangle, ListTree, RefreshCw, ImageOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/common';
import { bulkImportProducts } from '../../services/sellerApi';
import { customerApi } from '../../../../shared/api/client';
import { uploadProductMedia } from '../../../../shared/services/uploadService';
import { parseSpreadsheet, downloadCsv, stripRowMeta, SPREADSHEET_ACCEPT } from '../../../../shared/utils/spreadsheet';
import { getImageUrl, handleImageError } from '../../../../shared/utils/imageUtils';

const PENDING_UPLOAD_PREFIX = '/pending-upload/';

const TAB_LABELS = {
  mithilakart: 'Mithilakart',
  mithilak: 'Mithilak',
  quick_shop: 'Quick Shop',
  groceries_fresh: 'Groceries & Fresh',
};

const COLUMNS = [
  { key: 'title', label: 'Product Title', aliases: ['title', 'name', 'product name'], required: true, example: 'Alphonso Mango 1kg', help: 'Required. 2–200 characters.' },
  { key: 'sku', label: 'SKU', aliases: ['sku code', 'item code'], required: true, example: 'MANGO-1KG', help: 'Required, unique per product. Uploading the same SKU again updates that product.' },
  { key: 'description', label: 'Description', aliases: ['full description', 'details'], example: 'Sweet Ratnagiri mangoes', help: 'Optional.' },
  { key: 'category', label: 'Category', required: true, example: 'Fruits & Vegetables', help: 'Required. Must match a category name (see "Category list").' },
  { key: 'subcategory', label: 'Subcategory', aliases: ['sub category'], example: 'Fresh Fruits', help: 'Optional. Must be under the category.' },
  { key: 'tabs', label: 'Marketplace Tabs', aliases: ['tabs', 'tab', 'marketplace', 'marketplace tab'], example: 'Groceries & Fresh, Quick Shop', help: 'Comma-separated: Mithilakart, Mithilak, Quick Shop, Groceries & Fresh. Default Mithilakart.' },
  { key: 'price', label: 'Selling Price', aliases: ['price', 'sale price'], required: true, example: '249', help: 'Required. Must not exceed MRP.' },
  { key: 'mrp', label: 'MRP', aliases: ['max retail price'], example: '299', help: 'Optional. Defaults to selling price.' },
  { key: 'stock', label: 'Stock', aliases: ['quantity', 'qty', 'inventory'], example: '40', help: 'Whole number. Default 0.' },
  { key: 'brand', label: 'Brand', example: 'Mithila Farms', help: 'Optional.' },
  { key: 'tags', label: 'Tags', aliases: ['keywords'], example: 'mango, fruit, summer', help: 'Comma-separated.' },
  { key: 'imageUrls', label: 'Images', aliases: ['image', 'image url', 'image urls', 'photos'], example: 'mango-front.jpg | https://cdn.example.com/mango-2.jpg', help: 'Up to 10, separated by |. Use https:// links or file names of images you attach below.' },
  { key: 'videoUrls', label: 'Videos', aliases: ['video', 'video url', 'video urls'], example: '', help: 'Optional, same format as Images.' },
  { key: 'deliveryPromiseMinutes', label: 'Delivery Promise (mins)', aliases: ['delivery promise', 'delivery minutes'], example: '20', help: 'Quick Shop / Groceries only: 15, 20, 25 or 30.' },
  { key: 'serviceableRadiusKm', label: 'Serviceable Radius (km)', aliases: ['serviceable radius', 'radius'], example: '5', help: 'Quick Shop / Groceries only.' },
  { key: 'weightKg', label: 'Weight (kg)', aliases: ['weight'], example: '1', help: 'Optional, for courier shipping.' },
  { key: 'dimensionsCm', label: 'Dimensions (LxWxH cm)', aliases: ['dimensions'], example: '20x15x10', help: 'Optional, for courier shipping.' },
  { key: 'deliveryEstimate', label: 'Delivery Estimate', example: '2-3 Days', help: 'Optional text shown for standard delivery.' },
  { key: 'specifications', label: 'Specifications', aliases: ['specs', 'attributes'], example: 'Origin: Ratnagiri; Grade: A', help: 'Key: Value pairs separated by ;' },
];

const TEMPLATE_ROWS = [
  COLUMNS.map((c) => c.example),
  ['Madhubani Painted Saree', 'SAREE-MB-01', 'Hand-painted Madhubani art on pure silk', 'Mithila Paridhan', '', 'Mithilak, Mithilakart',
    '4999', '6499', '5', 'Mithila Crafts', 'saree, madhubani, handmade', 'https://cdn.example.com/saree-front.jpg | saree-back.jpg', '',
    '', '', '0.6', '35x25x5', '3-5 Business Days', 'Fabric: Silk; Length: 6.3 m'],
];

const isUrl = (value) => /^https?:\/\//i.test(value) || value.startsWith('/');
const baseName = (value) => value.split(/[\\/]/).pop().trim().toLowerCase();
const indexFiles = (list) => new Map(list.map((f) => [f.name.toLowerCase(), f]));

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Large batches can hit the per-minute API limit — wait it out instead of failing. */
async function uploadWithRetry(file, onWait) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await uploadProductMedia(file);
    } catch (err) {
      if (err?.status !== 429 || attempt >= 6) throw err;
      for (let secs = 20; secs > 0; secs -= 1) {
        onWait(secs);
        await wait(1000);
      }
    }
  }
}

/** "a.jpg, b.jpg | https://x/y,z.jpg" → refs; commas only split file names, never URLs. */
const splitMediaCell = (cell) => {
  if (Array.isArray(cell)) return cell;
  return String(cell ?? '')
    .split(/\s*\|\s*|\n/)
    .flatMap((part) => (isUrl(part.trim()) ? [part] : part.split(',')))
    .map((part) => part.trim())
    .filter(Boolean);
};

const ACTION_BADGE = {
  create: 'bg-green-50 text-green-700 border-green-100',
  update: 'bg-amber-50 text-amber-700 border-amber-100',
};

const formatPrice = (value) => (value === null || value === undefined ? '—' : `₹${Number(value).toLocaleString('en-IN')}`);

const Stat = ({ label, value, tone = 'text-slate-900' }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-2xs">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className={`text-lg font-black leading-tight ${tone}`}>{value}</p>
  </div>
);

const BulkUpload = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [sheetName, setSheetName] = useState('');
  const [ignoredColumns, setIgnoredColumns] = useState([]);
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState('');
  const [filter, setFilter] = useState('all');
  const sheetInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const fileIndex = useMemo(() => indexFiles(files), [files]);
  // One object URL per attached file, revoked when the set changes.
  const previewUrls = useMemo(() => new Map(files.map((file) => [file, URL.createObjectURL(file)])), [files]);
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  const resolveMedia = (cell, index = fileIndex) => splitMediaCell(cell).map((ref) => {
    if (isUrl(ref)) return { ref, kind: 'url', src: getImageUrl(ref), value: ref };
    const file = index.get(baseName(ref));
    if (file) {
      return { ref, kind: 'file', file, src: previewUrls.get(file), value: `${PENDING_UPLOAD_PREFIX}${file.name}` };
    }
    // Sent as-is so the server reports it on the row.
    return { ref, kind: 'missing', src: null, value: ref };
  });

  const buildRows = (sheetRows, { uploadedUrls = null, index = fileIndex } = {}) => stripRowMeta(sheetRows).map((row) => {
    const toValues = (cell) => resolveMedia(cell, index).map((m) => (
      uploadedUrls && m.kind === 'file' ? uploadedUrls.get(m.file.name) : m.value
    ));
    return { ...row, imageUrls: toValues(row.imageUrls), videoUrls: toValues(row.videoUrls) };
  });

  const runPreview = async (sheetRows, index = fileIndex) => {
    setBusy('preview');
    try {
      const data = await bulkImportProducts({ rows: buildRows(sheetRows, { index }), dryRun: true });
      setPreview(data);
    } catch (err) {
      toast.error(err?.message || 'Could not check the sheet');
      setPreview(null);
    } finally {
      setBusy('');
    }
  };

  // Re-check after images are attached/removed so "image not attached" errors update.
  const updateFiles = (nextFiles) => {
    setFiles(nextFiles);
    if (rows.length && !result) runPreview(rows, indexFiles(nextFiles));
  };

  const handleSheet = async (file) => {
    if (!file) return;
    setResult(null);
    setBusy('parse');
    try {
      const parsed = await parseSpreadsheet(file, COLUMNS);
      if (parsed.missingColumns.length) {
        toast.error(`Missing column: ${parsed.missingColumns.join(', ')}. Download the template to see the format.`);
        return;
      }
      if (!parsed.rows.length) {
        toast.error('The sheet has a header but no product rows');
        return;
      }
      if (parsed.rows.length > 500) {
        toast.error('Upload at most 500 products per sheet — split the file and upload in parts');
        return;
      }
      setSheetName(file.name);
      setRows(parsed.rows);
      setIgnoredColumns(parsed.ignoredColumns);
      await runPreview(parsed.rows);
    } catch (err) {
      toast.error(err?.message || 'Could not read the file');
    } finally {
      setBusy((b) => (b === 'parse' ? '' : b));
    }
  };

  const addImages = (list) => {
    const incoming = Array.from(list || []).filter((f) => /^(image|video)\//.test(f.type));
    if (!incoming.length) return;
    const byName = indexFiles(files);
    incoming.forEach((f) => byName.set(f.name.toLowerCase(), f));
    updateFiles([...byName.values()]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const reset = () => {
    setRows([]);
    setSheetName('');
    setIgnoredColumns([]);
    setFiles([]);
    setPreview(null);
    setResult(null);
    setFilter('all');
    if (sheetInputRef.current) sheetInputRef.current.value = '';
  };

  const downloadCategoryList = async () => {
    try {
      const lines = [];
      for (const [tab, label] of Object.entries(TAB_LABELS)) {
        const tree = await customerApi.get('/categories', { params: { marketplaceTab: tab } });
        (Array.isArray(tree) ? tree : []).forEach((cat) => {
          if (!cat.children?.length) lines.push([label, cat.name, '']);
          cat.children?.forEach((child) => lines.push([label, cat.name, child.name]));
        });
      }
      downloadCsv('mithilakart-category-list.csv', ['Marketplace Tab', 'Category', 'Subcategory'], lines);
    } catch (err) {
      toast.error(err?.message || 'Could not load categories');
    }
  };

  const handleConfirm = async () => {
    const readyIndexes = (preview?.rows || []).map((r, i) => (r.status === 'ok' ? i : -1)).filter((i) => i >= 0);
    const readyRows = readyIndexes.map((i) => rows[i]);
    if (!readyRows.length) return;

    setBusy('commit');
    try {
      // 1. Upload attached files referenced by the rows being saved (each once).
      const needed = new Map();
      readyRows.forEach((row) => {
        [...resolveMedia(row.imageUrls), ...resolveMedia(row.videoUrls)]
          .filter((m) => m.kind === 'file')
          .forEach((m) => needed.set(m.file.name, m.file));
      });
      const uploaded = new Map();
      let done = 0;
      for (const [name, file] of needed) {
        setProgress(`Uploading images ${done + 1} of ${needed.size}…`);
        uploaded.set(name, await uploadWithRetry(file, (secs) => (
          setProgress(`Upload limit reached — continuing in ${secs}s (image ${done + 1} of ${needed.size})…`)
        )));
        done += 1;
      }

      // 2. Save products.
      setProgress(`Saving ${readyRows.length} products…`);
      const data = await bulkImportProducts({ rows: buildRows(readyRows, { uploadedUrls: uploaded }), dryRun: false });
      setResult({ ...data, rowNumbers: readyRows.map((r) => r.__rowNumber), sourceRows: readyRows });
      if (data.summary.errorRows) {
        toast.error(`${data.summary.errorRows} product(s) could not be saved — see the list`);
      } else {
        toast.success(`${data.summary.validRows} products saved`);
      }
    } catch (err) {
      toast.error(err?.message || 'Upload failed — nothing after this point was saved');
    } finally {
      setBusy('');
      setProgress('');
    }
  };

  const report = result || preview;
  const reportRows = (report?.rows || []).map((row, i) => {
    const source = result ? result.sourceRows[i] : rows[i];
    return {
      ...row,
      sheetRow: source?.__rowNumber ?? row.rowNumber,
      media: source ? resolveMedia(source.imageUrls) : [],
      brand: source?.brand,
    };
  });
  const counts = {
    all: reportRows.length,
    ok: reportRows.filter((r) => r.status === 'ok').length,
    error: reportRows.filter((r) => r.status === 'error').length,
  };
  const visibleRows = filter === 'all' ? reportRows : reportRows.filter((r) => r.status === filter);
  const referencedNames = new Set(rows.flatMap((r) => [...splitMediaCell(r.imageUrls), ...splitMediaCell(r.videoUrls)])
    .filter((ref) => !isUrl(ref)).map(baseName));

  return (
    <div className="space-y-4 pb-6">
      <PageHeader title="Bulk Upload Products" subtitle="Add or update many products at once from a CSV or Excel sheet">
        <button
          onClick={() => navigate('/seller/products')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={14} /> Products
        </button>
        <button
          onClick={downloadCategoryList}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-50"
        >
          <ListTree size={14} /> Category list
        </button>
        <button
          onClick={() => downloadCsv('product-upload-template.csv', COLUMNS.map((c) => c.label), TEMPLATE_ROWS)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-800"
        >
          <Download size={14} /> Template
        </button>
      </PageHeader>

      {!result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sheet */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">1 · Product sheet</p>
            {sheetName ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <FileSpreadsheet size={22} className="text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{sheetName}</p>
                    <p className="text-[11px] text-slate-400">
                      {rows.length} products{ignoredColumns.length ? ` · ignored columns: ${ignoredColumns.join(', ')}` : ''}
                    </p>
                  </div>
                </div>
                <button onClick={reset} disabled={busy === 'commit'} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white" title="Start over">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleSheet(e.dataTransfer.files?.[0]); }}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 cursor-pointer text-center"
              >
                {busy === 'parse' ? <Loader2 size={24} className="animate-spin text-slate-400" /> : <Upload size={24} className="text-slate-400" />}
                <p className="text-sm font-bold text-slate-700">Drop your .csv or .xlsx here, or click to choose</p>
                <p className="text-[11px] text-slate-400">Up to 500 products per sheet. Start from the Template button above.</p>
                <input ref={sheetInputRef} type="file" accept={SPREADSHEET_ACCEPT} className="hidden" onChange={(e) => handleSheet(e.target.files?.[0])} />
              </label>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">2 · Product images <span className="normal-case font-semibold text-slate-400">(optional)</span></p>
            <p className="text-[11px] text-slate-400 mb-3">
              If the Images column has file names (e.g. <span className="font-mono">mango-front.jpg</span>), attach those files here. Links (https://…) need nothing.
            </p>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addImages(e.dataTransfer.files); }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 cursor-pointer"
            >
              <Images size={18} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Add image / video files</span>
              <input ref={imageInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
            </label>
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {files.map((file) => {
                  const previewUrl = previewUrls.get(file);
                  const used = referencedNames.has(file.name.toLowerCase());
                  return (
                    <div key={file.name} className={`relative w-16 ${used ? '' : 'opacity-50'}`} title={used ? file.name : `${file.name} — not used in the sheet`}>
                      {file.type.startsWith('video/')
                        ? <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">VIDEO</div>
                        : <img src={previewUrl} alt={file.name} className="w-16 h-16 rounded-lg object-cover border border-slate-100" />}
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">{file.name}</p>
                      <button
                        onClick={() => updateFiles(files.filter((f) => f !== file))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-2xs"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {!report && !busy && (
        <details className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4">
          <summary className="text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer">Column guide</summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <tbody>
                {COLUMNS.map((col) => (
                  <tr key={col.key} className="border-t border-slate-50">
                    <td className="py-2 pr-3 font-bold text-slate-800 whitespace-nowrap">{col.label}{col.required && <span className="text-red-500"> *</span>}</td>
                    <td className="py-2 pr-3 text-slate-500">{col.help}</td>
                    <td className="py-2 font-mono text-slate-400 whitespace-nowrap">{col.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {busy === 'preview' && (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-bold">Checking every product…</span>
        </div>
      )}

      {report && busy !== 'preview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Stat label="Products" value={report.summary.totalRows} />
            <Stat label={result ? 'Saved' : 'Ready'} value={report.summary.validRows} tone="text-green-600" />
            <Stat label="Errors" value={report.summary.errorRows} tone={report.summary.errorRows ? 'text-red-600' : 'text-slate-900'} />
            <Stat label="New" value={report.summary.toCreate} tone="text-blue-600" />
            <Stat label="Updates (same SKU)" value={report.summary.toUpdate} tone="text-amber-600" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
              {[['all', 'All'], ['ok', result ? 'Saved' : 'Ready'], ['error', 'Errors']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 rounded-md text-xs font-bold ${filter === key ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'}`}
                >
                  {label} ({counts[key]})
                </button>
              ))}
            </div>
            {!result && <p className="text-[11px] font-semibold text-slate-400">Preview only — nothing is saved until you confirm.</p>}
          </div>

          <div className="space-y-2">
            {visibleRows.map((row) => (
              <div
                key={row.sheetRow}
                className={`bg-white rounded-2xl border p-3 shadow-2xs flex flex-col md:flex-row gap-3 ${row.status === 'error' ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}
              >
                <div className="flex gap-1.5 overflow-x-auto md:w-56 shrink-0">
                  {row.media.length === 0 && (
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-300">
                      <ImageOff size={18} />
                      <span className="text-[9px] font-bold mt-1">No image</span>
                    </div>
                  )}
                  {row.media.map((m) => (m.src ? (
                    <img key={m.ref} src={m.src} alt="" onError={handleImageError} className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0" />
                  ) : (
                    <div key={m.ref} className="w-20 h-20 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center justify-center text-red-400 shrink-0 p-1" title={`${m.ref} not attached`}>
                      <ImageOff size={16} />
                      <span className="text-[8px] font-bold mt-1 truncate w-full text-center">{m.ref}</span>
                    </div>
                  )))}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Row {row.sheetRow}</span>
                    {row.action && (
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${ACTION_BADGE[row.action]}`}>
                        {row.action === 'create' ? 'New' : 'Update'}
                      </span>
                    )}
                    {row.status === 'ok' && <CheckCircle2 size={14} className="text-green-500" />}
                    {row.status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                    {result && row.productStatus && row.productStatus !== 'approved' && (
                      <span className="text-[10px] font-bold text-amber-600">Pending approval</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{row.title || <span className="text-slate-400">No title</span>}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>SKU <b className="text-slate-700">{row.sku || '—'}</b></span>
                    <span>
                      <b className="text-slate-900">{formatPrice(row.price)}</b>
                      {row.mrp > row.price && <span className="line-through ml-1">{formatPrice(row.mrp)}</span>}
                      {row.mrp > row.price && <span className="text-green-600 font-bold ml-1">{Math.round(((row.mrp - row.price) / row.mrp) * 100)}% off</span>}
                    </span>
                    <span>Stock <b className="text-slate-700">{row.stock ?? '—'}</b></span>
                    {row.brand && <span>Brand <b className="text-slate-700">{row.brand}</b></span>}
                    {row.categoryPath && <span>{row.categoryPath}</span>}
                  </div>
                  {row.tabs?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {row.tabs.map((tab) => (
                        <span key={tab} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{TAB_LABELS[tab] || tab}</span>
                      ))}
                    </div>
                  )}
                  {row.errors?.map((e) => <p key={e} className="text-xs font-semibold text-red-600 mt-1">{e}</p>)}
                  {row.warnings?.map((w) => (
                    <p key={w} className="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle size={11} />{w}</p>
                  ))}
                </div>
              </div>
            ))}
            {!visibleRows.length && <p className="text-center text-sm font-bold text-slate-400 py-6">Nothing here</p>}
          </div>

          <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-100 -mx-1 px-1 py-3 flex flex-wrap items-center justify-end gap-2">
            {progress && <span className="text-xs font-bold text-slate-500 mr-auto flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" />{progress}</span>}
            {!result ? (
              <>
                <button onClick={reset} disabled={busy === 'commit'} className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100">Cancel</button>
                <button
                  onClick={handleConfirm}
                  disabled={busy === 'commit' || !counts.ok}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy === 'commit' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Confirm &amp; save {counts.ok} product{counts.ok === 1 ? '' : 's'}
                  {counts.error ? ` (skip ${counts.error} with errors)` : ''}
                </button>
              </>
            ) : (
              <>
                <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <RefreshCw size={13} /> Upload another sheet
                </button>
                <button onClick={() => navigate('/seller/products')} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg">
                  View products
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;

import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, AlertTriangle, X, ArrowRight, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../services/api';
import { customerApi } from '../../../shared/api/client';
import { parseSpreadsheet, downloadCsv, stripRowMeta, SPREADSHEET_ACCEPT } from '../../../shared/utils/spreadsheet';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const TARGET_TABS = [
  { value: 'mithilakart', label: 'Mithilakart', hint: 'Main marketplace' },
  { value: 'mithilak', label: 'Mithilak', hint: 'Mithila culture & crafts' },
  { value: 'quick_shop', label: 'Quick Shop', hint: 'Quick commerce' },
  { value: 'groceries_fresh', label: 'Fresh & Groceries', hint: 'Daily groceries' },
];

const COLUMNS = [
  { key: 'category', label: 'Category', aliases: ['category name', 'parent category', 'main category'], required: true },
  { key: 'subcategory', label: 'Subcategory', aliases: ['sub category', 'subcategory name', 'sub-category'] },
  { key: 'childCategory', label: 'Childcategory', aliases: ['child category', 'childcategory', 'child-category', 'sub-subcategory', 'sub subcategory', 'child'] },
  { key: 'slug', label: 'Slug', aliases: ['category slug', 'category_slug', 'url slug', 'slug url'] },
  { key: 'description', label: 'Description' },
  { key: 'imageUrl', label: 'Image URL', aliases: ['image', 'image link', 'photo'] },
  { key: 'iconUrl', label: 'Icon URL', aliases: ['icon'] },
  { key: 'sortOrder', label: 'Sort Order', aliases: ['sort', 'order', 'position'] },
  { key: 'isActive', label: 'Active', aliases: ['is active', 'status', 'enabled'] },
];

const TEMPLATE_ROWS = [
  ['Pooja Needs', 'Pooja Prasad & Bhog', 'Sweets', 'pooja-prasad-sweets', 'Fresh sweets for pooja and bhog', 'https://example.com/sweets.png', '', 0, 'yes'],
  ['Pooja Needs', 'Pooja Prasad & Bhog', 'Dry-Fruits', 'pooja-prasad-dry-fruits', 'Premium dry fruits', 'https://example.com/dry-fruits.png', '', 1, 'yes'],
  ['Pooja Needs', 'Pooja Prasad & Bhog', 'Panchamrit', 'pooja-prasad-panchamrit', 'Pure panchamrit samagri', '', '', 2, 'yes'],
  ['Fruits & Vegetables', 'Fresh Fruits', '', 'fresh-fruits', 'Farm fresh produce', 'https://example.com/fresh-fruits.png', '', 0, 'yes'],
  ['Fruits & Vegetables', 'Fresh Vegetables', '', 'fresh-vegetables', 'Farm fresh produce', 'https://example.com/fresh-veg.png', '', 1, 'yes'],
  ['Dairy, Bread & Eggs', 'Milk', '', 'dairy-milk', '', '', '', 0, 'yes'],
];

const ACTION_BADGES = {
  create: { label: 'New', className: 'bg-green-50 text-green-700' },
  'add-to-tab': { label: 'Add to tab', className: 'bg-blue-50 text-blue-700' },
  update: { label: 'Update', className: 'bg-amber-50 text-amber-700' },
  unchanged: { label: 'Exists', className: 'bg-slate-100 text-slate-500' },
};

const ActionBadge = ({ action }) => {
  if (!action) return <span className="text-slate-300">—</span>;
  const badge = ACTION_BADGES[action] || ACTION_BADGES.unchanged;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badge.className}`}>
      {badge.label}
    </span>
  );
};

const StatCard = ({ label, value, tone = 'slate' }) => {
  const tones = {
    slate: 'text-slate-900',
    green: 'text-green-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-black leading-none ${tones[tone]}`}>{value}</p>
    </div>
  );
};

const CategoryBulkImport = () => {
  const [targetTab, setTargetTab] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [ignoredColumns, setIgnoredColumns] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [liveTree, setLiveTree] = useState([]);
  const [busy, setBusy] = useState('');
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const tabLabel = TARGET_TABS.find((t) => t.value === targetTab)?.label || '';

  const runPreview = useCallback(async (tab, sheetRows) => {
    setBusy('preview');
    const { data, error } = await categoriesApi.bulkImport({
      marketplaceTab: tab,
      dryRun: true,
      rows: stripRowMeta(sheetRows),
    });
    setBusy('');
    if (error) {
      toast.error(error);
      setPreview(null);
      return;
    }
    setPreview(data);
  }, []);

  const reset = () => {
    setFileName('');
    setRows([]);
    setIgnoredColumns([]);
    setPreview(null);
    setResult(null);
    setLiveTree([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!targetTab) {
      toast.error('Select the target tab first');
      return;
    }
    setResult(null);
    setBusy('parse');
    try {
      const parsed = await parseSpreadsheet(file, COLUMNS);
      if (parsed.missingColumns.length) {
        toast.error(`Missing column: ${parsed.missingColumns.join(', ')}. Download the template to see the format.`);
        setBusy('');
        return;
      }
      if (!parsed.rows.length) {
        toast.error('The sheet has a header but no data rows');
        setBusy('');
        return;
      }
      setFileName(file.name);
      setRows(parsed.rows);
      setIgnoredColumns(parsed.ignoredColumns);
      await runPreview(targetTab, parsed.rows);
    } catch (err) {
      toast.error(err.message || 'Could not read the file');
      setBusy('');
    }
  };

  const changeTab = (tab) => {
    setTargetTab(tab);
    setResult(null);
    if (rows.length) runPreview(tab, rows);
  };

  const handleConfirm = async () => {
    setBusy('commit');
    const { data, error } = await categoriesApi.bulkImport({
      marketplaceTab: targetTab,
      dryRun: false,
      rows: stripRowMeta(rows),
    });
    if (error) {
      setBusy('');
      toast.error(error);
      return;
    }
    setResult(data);
    setPreview(null);
    try {
      const tree = await customerApi.get('/categories', { params: { marketplaceTab: targetTab } });
      setLiveTree(Array.isArray(tree) ? tree : []);
    } catch {
      setLiveTree([]);
    }
    setBusy('');
    if (data.summary.errorRows) {
      toast.error(`${data.summary.errorRows} row(s) could not be imported`);
    } else {
      toast.success(`Imported into ${tabLabel}`);
    }
  };

  const shownReport = result || preview;
  const reportRows = (shownReport?.rows || []).map((row, i) => ({ ...row, sheetRow: rows[i]?.__rowNumber ?? row.rowNumber }));
  const visibleRows = onlyProblems
    ? reportRows.filter((r) => r.status === 'error' || r.warnings?.length)
    : reportRows;
  const summary = shownReport?.summary;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat uppercase">Bulk Category Import</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-raleway">
            Upload a CSV / Excel sheet of categories, subcategories &amp; child categories into one marketplace tab
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv('category-import-template.csv', COLUMNS.map((c) => c.label), TEMPLATE_ROWS)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-slate-50"
        >
          <Download size={14} /> Download template
        </button>
      </div>

      {/* Step 1 — target tab */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">1 · Select target tab</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TARGET_TABS.map((tab) => {
            const active = targetTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                disabled={Boolean(busy)}
                onClick={() => changeTab(tab.value)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  active ? 'border-blue-500 bg-blue-50/60' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <p className={`text-sm font-black ${active ? 'text-blue-700' : 'text-slate-800'}`}>{tab.label}</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{tab.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2 — file */}
      <section className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${!targetTab ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">2 · Upload sheet</h2>
        {fileName ? (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <FileSpreadsheet className="text-green-600 shrink-0" size={22} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{fileName}</p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {rows.length} data rows{ignoredColumns.length ? ` · ignored columns: ${ignoredColumns.join(', ')}` : ''}
                </p>
              </div>
            </div>
            <button type="button" onClick={reset} disabled={busy === 'commit'} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white" title="Remove file">
              <X size={16} />
            </button>
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
            className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {busy === 'parse' ? <Loader2 className="animate-spin text-slate-400" size={26} /> : <Upload className="text-slate-400" size={26} />}
            <p className="text-sm font-bold text-slate-700">Drop a .csv or .xlsx file here, or click to choose</p>
            <p className="text-[11px] text-slate-400 font-semibold text-center max-w-md">
              One row per category, subcategory, or child category. Leave “Childcategory” empty for subcategories, or leave “Subcategory” empty for top-level. Optional: specify “Slug” to set custom URLs or disambiguate identical category names.
              Existing categories with the same name are reused and enabled for {tabLabel || 'the tab'}.
            </p>
            <input ref={inputRef} type="file" accept={SPREADSHEET_ACCEPT} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
        )}
      </section>

      {busy === 'preview' && (
        <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-bold">Checking every row…</span>
        </div>
      )}

      {/* Step 3 — preview / result */}
      {shownReport && busy !== 'preview' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              {result ? '3 · Import result' : `3 · Preview — nothing is saved until you confirm`}
            </h2>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
              <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
              Show only rows with problems
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard label="Rows" value={summary.totalRows} />
            <StatCard label="Ready" value={summary.validRows} tone="green" />
            <StatCard label="Errors" value={summary.errorRows} tone={summary.errorRows ? 'red' : 'slate'} />
            <StatCard label="New categories" value={summary.categoriesToCreate} tone="blue" />
            <StatCard label="New subcategories" value={summary.subcategoriesToCreate} tone="blue" />
            {summary.childCategoriesToCreate > 0 ? (
              <StatCard label="New child categories" value={summary.childCategoriesToCreate} tone="blue" />
            ) : (
              <StatCard label="Existing → tab / updated" value={`${summary.existingAddedToTab} / ${summary.existingUpdated}`} tone="amber" />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-100">
                    {['Row', 'Image', 'Category', 'Subcategory', 'Childcategory', 'Slug', 'Status', 'Notes'].map((h) => (
                      <th key={h} className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.sheetRow} className={`border-b border-slate-50 ${row.status === 'error' ? 'bg-red-50/40' : ''}`}>
                      <td className="py-2.5 px-4 text-xs font-bold text-slate-400">{row.sheetRow}</td>
                      <td className="py-2.5 px-4">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                          {/^(https?:\/\/|\/)/i.test(row.imageUrl || '') && (
                            <img src={getImageUrl(row.imageUrl)} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="text-[13px] font-bold text-slate-800">{row.category || '—'}</p>
                        <ActionBadge action={row.categoryAction} />
                      </td>
                      <td className="py-2.5 px-4">
                        {row.subcategory ? (
                          <>
                            <p className="text-[13px] font-semibold text-slate-700">{row.subcategory}</p>
                            <ActionBadge action={row.subcategoryAction} />
                          </>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {row.childCategory ? (
                          <>
                            <p className="text-[13px] font-semibold text-slate-700">{row.childCategory}</p>
                            <ActionBadge action={row.childCategoryAction} />
                          </>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[12px] font-mono font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          {row.slug || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {row.status === 'ok' && <CheckCircle2 size={16} className="text-green-500" />}
                        {row.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                        {row.status === 'skipped' && <span className="text-[10px] font-bold text-slate-400 uppercase">Skipped</span>}
                      </td>
                      <td className="py-2.5 px-4 text-xs">
                        {row.errors?.map((e) => <p key={e} className="text-red-600 font-semibold">{e}</p>)}
                        {row.warnings?.map((w) => (
                          <p key={w} className="text-amber-600 font-semibold flex items-center gap-1"><AlertTriangle size={11} />{w}</p>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {!visibleRows.length && (
                    <tr><td colSpan={8} className="py-8 text-center text-sm font-bold text-slate-400">No rows with problems 🎉</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!result ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button type="button" onClick={reset} disabled={busy === 'commit'} className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={busy === 'commit' || !summary.validRows}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
              >
                {busy === 'commit' ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                Confirm &amp; import {summary.validRows} row{summary.validRows === 1 ? '' : 's'} into {tabLabel}
                {summary.errorRows ? ` (skip ${summary.errorRows})` : ''}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-black text-green-800">
                Done — {summary.validRows} row{summary.validRows === 1 ? '' : 's'} imported into {tabLabel}. The customer app shows them now.
              </p>
              {liveTree.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2">Customers now see in {tabLabel}:</p>
                  <div className="flex flex-wrap gap-2">
                    {liveTree.map((node) => (
                      <span key={node.id} className="px-2.5 py-1 bg-white rounded-lg border border-green-100 text-xs font-bold text-slate-700">
                        {node.name}{node.children?.length ? ` · ${node.children.length} sub` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                <button type="button" onClick={reset} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-green-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-green-800">
                  <RefreshCw size={13} /> Import another file
                </button>
                <Link to="/admin/categories" className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest">
                  Open Category Manager <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CategoryBulkImport;

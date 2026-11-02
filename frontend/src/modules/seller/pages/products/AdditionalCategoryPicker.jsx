import { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';

const idOf = (n) => String(n?.id || n?._id || '');

/**
 * Every category path in the tree, to any depth. A category that has several
 * parents shows up once per parent path but keeps the same id, so selecting any
 * of its paths assigns the same underlying category.
 */
const flattenPaths = (nodes, trail = [], out = []) => {
  (nodes || []).forEach((node) => {
    const id = idOf(node);
    if (!id || trail.some((t) => t.id === id)) return; // cycle guard
    const next = [...trail, { id, name: node.name }];
    out.push({ id, label: next.map((p) => p.name).join(' › ') });
    flattenPaths(node.children, next, out);
  });
  return out;
};

/**
 * "Also list this product under" selector. The product stays ONE record; this only
 * adds extra category assignments next to its primary category.
 */
const AdditionalCategoryPicker = ({ tree, value = [], onChange, primaryId = '', disabled = false, inputClass = '', labelClass = '' }) => {
  const [query, setQuery] = useState('');
  const paths = useMemo(() => flattenPaths(tree), [tree]);
  const labelById = useMemo(() => {
    const map = new Map();
    paths.forEach((p) => { if (!map.has(p.id)) map.set(p.id, p.label); });
    return map;
  }, [paths]);

  const selected = new Set(value.map(String));
  const q = query.trim().toLowerCase();
  const matches = q
    ? paths
        .filter((p) => p.label.toLowerCase().includes(q) && p.id !== String(primaryId) && !selected.has(p.id))
        .slice(0, 40)
    : [];

  const add = (id) => {
    if (selected.has(id) || id === String(primaryId)) return;
    onChange([...value.map(String), id]);
    setQuery('');
  };
  const remove = (id) => onChange(value.map(String).filter((v) => v !== id));

  return (
    <div>
      <label className={labelClass}>Also list under other categories (optional)</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((id) => (
            <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
              {labelById.get(String(id)) || id}
              <button type="button" onClick={() => remove(String(id))} aria-label="Remove category" className="hover:text-red-600">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a category path, e.g. Dairy Products › Lassi"
          className={`${inputClass} pl-9`}
        />
        {matches.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-xl shadow-lg">
            {matches.map((p, i) => (
              <li key={`${p.id}-${i}`}>
                <button type="button" onClick={() => add(p.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50">
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">The same product (price and stock) will appear in each selected category.</p>
    </div>
  );
};

export default AdditionalCategoryPicker;

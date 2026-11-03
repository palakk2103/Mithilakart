// Navigation helpers for the MithilaKart category landing pages.

/** Opens a main category's landing page (which falls back to the product listing when none is configured). */
export const openMithilaCategory = (navigate, { id, name }) => {
  if (!id) return;
  try {
    localStorage.setItem('isMithilakFlow', 'true');
    localStorage.setItem('isQuickShopFlow', 'false');
  } catch { /* storage may be unavailable */ }
  navigate(`/mithilak/c/${id}`, { state: { category: name, categoryId: id } });
};

/** Opens a subcategory's product listing — the existing listing page, unchanged. */
export const openMithilaListing = (navigate, { id, name }, options = {}) => {
  try {
    localStorage.setItem('isMithilakFlow', 'true');
    localStorage.setItem('isQuickShopFlow', 'false');
  } catch { /* storage may be unavailable */ }
  navigate('/mithilak/category', { state: { category: name, categoryId: id }, ...options });
};

const norm = (v) => String(v || '').trim().toLowerCase();

/** A header chip links to a category by id when admin set one, otherwise by matching its label. */
export const resolveChipCategory = (chip, categories = []) => {
  if (chip?.categoryId) return { id: String(chip.categoryId), name: chip.rawLabel || chip.label };
  const label = norm(chip?.rawLabel || chip?.label);
  const match = label && categories.find((c) => norm(c.name) === label);
  return match ? { id: String(match.id), name: match.name } : null;
};

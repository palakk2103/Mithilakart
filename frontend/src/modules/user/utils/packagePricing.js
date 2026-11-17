const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Live price of a package selection, mirroring the server's formula
 * (PackageService.quote) so the shopper sees the total change as they tick items.
 * The cart re-prices on the server, so this can never decide what is charged.
 */
export const quoteSelection = (pkg, selectedIds) => {
  const items = pkg?.items || [];
  const selected = items.filter((it) => it.isMandatory || selectedIds.has(it.id));
  const totalWeight = items.reduce((s, it) => s + (Number(it.price) || 0), 0);
  const weightOf = (it) => (totalWeight > 0 ? (Number(it.price) || 0) : 1);
  const allWeight = totalWeight > 0 ? totalWeight : (items.length || 1);
  const selectedWeight = selected.reduce((s, it) => s + weightOf(it), 0);

  const price = items.length ? round2((pkg.fullPrice * selectedWeight) / allWeight) : 0;
  const minPrice = Number(pkg?.minPrice) || 0;

  let message = null;
  if (!selected.length) message = 'Select at least one item to build your package';
  else if (price < minPrice) message = `Add ₹${round2(minPrice - price)} more of items — the package must be worth at least ₹${minPrice}`;

  return {
    price,
    minPrice,
    fullPrice: pkg?.fullPrice || 0,
    savings: round2((pkg?.fullPrice || 0) - price),
    selectedCount: selected.length,
    totalCount: items.length,
    valid: !message,
    message,
  };
};

const crypto = require('crypto');
const mongoose = require('mongoose');
const { BaseService } = require('../../core/BaseService');
const { AppError } = require('../../utils/AppError');
const CustomPackage = require('../../models/CustomPackage');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

class PackageService extends BaseService {
  constructor({ productRepository = null, platformConfigService = null } = {}) {
    super();
    this.productRepository = productRepository;
    this.platformConfigService = platformConfigService;
  }

  // ── pricing (single source of truth) ────────────────────────────────────────

  async _defaultMinPercent() {
    if (!this.platformConfigService) return 40;
    const cfg = await this.platformConfigService.getConfig();
    const pct = Number(cfg.packageMinPricePercent);
    return Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : 40;
  }

  async minimumPrice(pkg) {
    if (pkg.minPriceAmount != null) return round2(Math.min(pkg.minPriceAmount, pkg.fullPrice));
    const pct = pkg.minPricePercent != null ? pkg.minPricePercent : await this._defaultMinPercent();
    return round2(Math.ceil((pkg.fullPrice * pct) / 100));
  }

  /**
   * Prices a selection. Returns { valid, price, ... } and, when invalid, a customer-facing
   * `message` — it never throws for a rule violation so the UI can show it live.
   */
  async quote(pkgInput, selectedItemIds = []) {
    const pkg = pkgInput.toObject ? pkgInput.toObject() : pkgInput;
    const items = [...(pkg.items || [])].sort((a, b) => (a.sortOrder - b.sortOrder));
    const byId = new Map(items.map((it) => [String(it._id), it]));

    const requested = [...new Set((selectedItemIds || []).map(String))];
    const unknown = requested.filter((id) => !byId.has(id));
    if (unknown.length) throw AppError.validation('Selection contains items that are not part of this package');

    const selectedSet = new Set(requested);
    items.filter((it) => it.isMandatory).forEach((it) => selectedSet.add(String(it._id)));
    const selected = items.filter((it) => selectedSet.has(String(it._id)));

    const totalWeight = items.reduce((s, it) => s + (it.price || 0), 0);
    const weightOf = (it) => (totalWeight > 0 ? (it.price || 0) : 1);
    const allWeight = totalWeight > 0 ? totalWeight : items.length || 1;
    const selectedWeight = selected.reduce((s, it) => s + weightOf(it), 0);

    const price = items.length ? round2((pkg.fullPrice * selectedWeight) / allWeight) : 0;
    const minPrice = await this.minimumPrice(pkg);

    let message = null;
    if (!selected.length) message = 'Select at least one item to build your package';
    else if (price < minPrice) message = `Your package must be worth at least ₹${minPrice}. Add ₹${round2(minPrice - price)} more of items.`;

    return {
      valid: !message,
      message,
      price,
      fullPrice: pkg.fullPrice,
      minPrice,
      savings: round2(pkg.fullPrice - price),
      selectedCount: selected.length,
      totalCount: items.length,
      selectedItemIds: selected.map((it) => String(it._id)),
      selectedItems: selected.map((it) => ({ id: String(it._id), name: it.name, imageUrl: it.imageUrl || '' })),
    };
  }

  /** Stable fingerprint so the same customisation merges into one cart line. */
  selectionHash(selectedItemIds) {
    return crypto.createHash('sha1').update([...selectedItemIds].map(String).sort().join(',')).digest('hex').slice(0, 12);
  }

  // ── public ─────────────────────────────────────────────────────────────────

  _serializePublic(pkg, minPrice) {
    const obj = pkg.toObject ? pkg.toObject() : pkg;
    return {
      id: String(obj._id),
      slug: obj.slug,
      name: obj.name,
      description: obj.description,
      imageUrl: obj.imageUrl,
      productId: String(obj.productId),
      marketplaceTab: obj.marketplaceTab,
      fullPrice: obj.fullPrice,
      minPrice,
      items: [...(obj.items || [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((it) => ({
          id: String(it._id),
          name: it.name,
          description: it.description,
          imageUrl: it.imageUrl,
          price: it.price,
          isMandatory: it.isMandatory,
        })),
    };
  }

  async listPublic({ marketplaceTab = null } = {}) {
    const filter = { isActive: true, deletedAt: null, ...(marketplaceTab ? { marketplaceTab } : {}) };
    const rows = await CustomPackage.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return Promise.all(rows.map(async (p) => this._serializePublic(p, await this.minimumPrice(p))));
  }

  async _findActive(idOrSlug) {
    const key = String(idOrSlug || '');
    const filter = mongoose.Types.ObjectId.isValid(key) && key.length === 24
      ? { _id: key }
      : { slug: key.toLowerCase() };
    const pkg = await CustomPackage.findOne({ ...filter, deletedAt: null, isActive: true });
    if (!pkg) throw AppError.notFound('Package not found');
    return pkg;
  }

  async getPublic(idOrSlug) {
    const pkg = await this._findActive(idOrSlug);
    return this._serializePublic(pkg, await this.minimumPrice(pkg));
  }

  async quotePublic(idOrSlug, selectedItemIds) {
    const pkg = await this._findActive(idOrSlug);
    return this.quote(pkg, selectedItemIds);
  }

  /** Used by the cart: loads the package and validates the selection, throwing on a rule violation. */
  async resolveForCart(packageId, selectedItemIds) {
    const pkg = await this._findActive(packageId);
    const quote = await this.quote(pkg, selectedItemIds);
    if (!quote.valid) throw AppError.validation(quote.message, [{ code: 'PACKAGE_RULE_VIOLATION' }]);
    return { pkg, quote };
  }

  // ── admin ──────────────────────────────────────────────────────────────────

  async listAdmin() {
    const rows = await CustomPackage.find({ deletedAt: null }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return Promise.all(rows.map(async (p) => ({
      ...this._serializePublic(p, await this.minimumPrice(p)),
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      minPriceAmount: p.minPriceAmount,
      minPricePercent: p.minPricePercent,
    })));
  }

  _clean(data) {
    const out = { ...data };
    if (out.items) {
      out.items = out.items.map((it, i) => ({
        ...(it.id ? { _id: it.id } : {}),
        name: it.name,
        description: it.description || '',
        imageUrl: it.imageUrl || '',
        price: Number(it.price) || 0,
        isMandatory: Boolean(it.isMandatory),
        sortOrder: Number.isFinite(Number(it.sortOrder)) ? Number(it.sortOrder) : i,
      }));
    }
    return out;
  }

  async _assertProduct(productId) {
    if (!this.productRepository) return;
    const product = await this.productRepository.findOne({ _id: productId, deletedAt: null });
    if (!product) throw AppError.validation('The selected product does not exist', [{ field: 'productId' }]);
  }

  async create(data) {
    await this._assertProduct(data.productId);
    const slug = slugify(data.slug || data.name);
    if (!slug) throw AppError.validation('A name or slug is required');
    if (await CustomPackage.findOne({ slug, deletedAt: null })) throw AppError.conflict('A package with this slug already exists');
    const created = await CustomPackage.create({ ...this._clean(data), slug });
    return this._serializePublic(created, await this.minimumPrice(created));
  }

  async update(id, data) {
    const pkg = await CustomPackage.findOne({ _id: id, deletedAt: null });
    if (!pkg) throw AppError.notFound('Package not found');
    if (data.productId) await this._assertProduct(data.productId);
    const next = this._clean(data);
    if (next.slug !== undefined) {
      next.slug = slugify(next.slug);
      if (next.slug && next.slug !== pkg.slug && await CustomPackage.findOne({ slug: next.slug, deletedAt: null, _id: { $ne: id } })) {
        throw AppError.conflict('A package with this slug already exists');
      }
    }
    Object.assign(pkg, next);
    await pkg.save();
    return this._serializePublic(pkg, await this.minimumPrice(pkg));
  }

  async remove(id) {
    const pkg = await CustomPackage.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date(), isActive: false });
    if (!pkg) throw AppError.notFound('Package not found');
    return { id: String(pkg._id) };
  }
}

module.exports = { PackageService };

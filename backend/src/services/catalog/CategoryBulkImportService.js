const { AppError } = require('../../utils/AppError');
const {
  normalizeMarketplaceTab,
  categoryTabs,
  legacyFlowsForTabs,
} = require('../../utils/marketplaceTab');
const {
  cleanString,
  isBlank,
  parseBool,
  parseNumber,
  isValidMediaUrl,
  slugify,
  lowerKey,
} = require('../../utils/bulkImport');

const MAX_ROWS = 2000;
const FIELD_KEYS = ['description', 'imageUrl', 'iconUrl', 'sortOrder', 'isActive'];

/**
 * Admin bulk import of a category tree into one marketplace tab.
 *
 * One sheet row = one category, optionally with subcategory and child category:
 *   category | subcategory | childCategory | description | imageUrl | iconUrl | sortOrder | isActive
 * Image/description/sort/active apply to the deepest name on the row.
 *
 * Matching is by name (case-insensitive): an existing category at the same
 * hierarchy level is reused and enabled for the tab instead of duplicated.
 * Always run with dryRun=true first — it returns the per-row plan without writing anything.
 */
class CategoryBulkImportService {
  constructor({ categoryRepository, categoryService }) {
    this.categoryRepository = categoryRepository;
    this.categoryService = categoryService;
  }

  async import({ marketplaceTab, rows, dryRun = true }) {
    const tab = normalizeMarketplaceTab(marketplaceTab);
    if (!tab) throw AppError.validation('A valid target marketplace tab is required');
    if (!Array.isArray(rows) || rows.length === 0) throw AppError.validation('The sheet has no rows');
    if (rows.length > MAX_ROWS) throw AppError.validation(`A sheet can contain at most ${MAX_ROWS} rows`);

    const existing = await this.categoryRepository.findActive({}, { sort: { sortOrder: 1, name: 1 } });
    const state = this._indexExisting(existing);
    const planned = rows.map((raw, index) => this._planRow(raw, index, tab, state));
    const summary = this._summarize(planned, state, tab);

    if (!dryRun) {
      await this._commit(state, tab);
      planned.forEach((row) => {
        const failed = row.nodes.map((node) => node.commitError).filter(Boolean);
        if (failed.length && row.status === 'ok') {
          row.status = 'error';
          row.errors.push(...failed);
        }
      });
      await this.categoryService._invalidateCache();
    }

    if (!dryRun) {
      summary.validRows = planned.filter((r) => r.status === 'ok').length;
      summary.errorRows = planned.filter((r) => r.status === 'error').length;
    }

    return {
      dryRun: Boolean(dryRun),
      marketplaceTab: tab,
      summary,
      rows: planned.map(({ nodes: _nodes, ...row }) => row),
    };
  }

  _indexExisting(categories) {
    const state = {
      nodes: new Map(),
      order: [],
      slugs: new Set(categories.map((c) => c.slug)),
      siblingCount: new Map(),
      seenRows: new Map(),
    };
    const byId = new Map(categories.map((c) => [String(c._id), c]));

    categories.forEach((doc) => {
      const parentAlive = !doc.parentId || byId.has(String(doc.parentId));
      if (!parentAlive) return;
      const parentKey = doc.parentId ? String(doc.parentId) : 'root';
      const key = `${parentKey}|${lowerKey(doc.name)}`;
      if (state.nodes.has(key)) return; // keep the first (lowest sortOrder) duplicate
      state.nodes.set(key, {
        key,
        nodeId: String(doc._id),
        doc,
        isNew: false,
        name: doc.name,
        slug: doc.slug,
        parentNodeId: doc.parentId ? String(doc.parentId) : null,
        fields: {},
      });
      state.siblingCount.set(parentKey, (state.siblingCount.get(parentKey) || 0) + 1);
    });

    return state;
  }

  _planRow(raw = {}, index, tab, state) {
    const row = {
      rowNumber: index + 2, // header is sheet row 1
      category: cleanString(raw.category),
      subcategory: cleanString(raw.subcategory),
      childCategory: cleanString(raw.childCategory || raw.childcategory || raw['child category'] || raw.child_category),
      imageUrl: cleanString(raw.imageUrl) || null,
      categoryAction: null,
      subcategoryAction: null,
      childCategoryAction: null,
      status: 'ok',
      errors: [],
      warnings: [],
      nodes: [],
    };

    const allBlank = ['category', 'subcategory', 'childCategory', ...FIELD_KEYS].every((k) => isBlank(raw[k]));
    if (allBlank) {
      row.status = 'skipped';
      row.warnings.push('Empty row');
      return row;
    }

    const fields = this._validateRow(raw, row);
    if (row.errors.length) {
      row.status = 'error';
      return row;
    }

    const dupKey = `${lowerKey(row.category)}|${lowerKey(row.subcategory)}|${lowerKey(row.childCategory)}`;
    if (state.seenRows.has(dupKey)) {
      row.warnings.push(`Same category hierarchy as row ${state.seenRows.get(dupKey)} — values merged`);
    } else {
      state.seenRows.set(dupKey, row.rowNumber);
    }

    const parent = this._resolveNode(state, 'root', null, row.category);
    row.nodes.push(parent);
    let target = parent;

    if (row.subcategory) {
      const child = this._resolveNode(state, parent.nodeId, parent, row.subcategory);
      row.nodes.push(child);
      target = child;

      if (row.childCategory) {
        const grandchild = this._resolveNode(state, child.nodeId, child, row.childCategory);
        row.nodes.push(grandchild);
        target = grandchild;
      }
    }
    row.nodes.forEach((node) => { node.touched = true; });

    this._applyFields(target, fields);
    row.categoryAction = this._actionFor(parent, tab);
    if (row.subcategory) row.subcategoryAction = this._actionFor(row.nodes[1], tab);
    if (row.childCategory) row.childCategoryAction = this._actionFor(row.nodes[2], tab);
    return row;
  }

  _validateRow(raw, row) {
    const fields = {};

    if (!row.category) {
      row.errors.push('Category name is required');
    } else if (row.category.length < 2 || row.category.length > 100) {
      row.errors.push('Category name must be 2–100 characters');
    }
    if (row.subcategory && (row.subcategory.length < 2 || row.subcategory.length > 100)) {
      row.errors.push('Subcategory name must be 2–100 characters');
    }
    if (row.childCategory && (row.childCategory.length < 2 || row.childCategory.length > 100)) {
      row.errors.push('Child category name must be 2–100 characters');
    }
    if (row.childCategory && !row.subcategory) {
      row.errors.push('Child category requires a subcategory');
    }

    if (!isBlank(raw.description)) fields.description = cleanString(raw.description).slice(0, 1000);

    ['imageUrl', 'iconUrl'].forEach((key) => {
      if (isBlank(raw[key])) return;
      if (!isValidMediaUrl(raw[key])) {
        row.errors.push(`${key === 'imageUrl' ? 'Image URL' : 'Icon URL'} must start with http://, https:// or /`);
      } else {
        fields[key] = cleanString(raw[key]);
      }
    });

    const sortOrder = parseNumber(raw.sortOrder);
    if (sortOrder !== null) {
      if (!Number.isInteger(sortOrder) || sortOrder < 0) {
        row.errors.push('Sort order must be a whole number ≥ 0');
      } else {
        fields.sortOrder = sortOrder;
      }
    }

    const isActive = parseBool(raw.isActive);
    if (isActive === undefined) {
      row.errors.push('Active must be yes/no or true/false');
    } else if (isActive !== null) {
      fields.isActive = isActive;
    }

    return fields;
  }

  _resolveNode(state, parentKey, parentNode, name) {
    const key = `${parentKey}|${lowerKey(name)}`;
    let node = state.nodes.get(key);
    if (node) return node;

    const position = state.siblingCount.get(parentKey) || 0;
    state.siblingCount.set(parentKey, position + 1);

    node = {
      key,
      nodeId: `new:${key}`,
      doc: null,
      isNew: true,
      name,
      slug: this._uniqueSlug(state, name, parentNode),
      parentNode,
      defaultSortOrder: position,
      fields: {},
    };
    state.nodes.set(key, node);
    state.order.push(node);
    return node;
  }

  _uniqueSlug(state, name, parentNode) {
    const base = slugify(name) || 'category';
    const candidates = [base];
    if (parentNode) candidates.push(`${parentNode.slug}-${base}`);
    let slug = candidates.find((c) => !state.slugs.has(c));
    const stem = candidates[candidates.length - 1];
    for (let n = 2; !slug; n += 1) {
      if (!state.slugs.has(`${stem}-${n}`)) slug = `${stem}-${n}`;
    }
    state.slugs.add(slug);
    return slug;
  }

  _applyFields(node, fields) {
    Object.assign(node.fields, fields);
  }

  /** What committing will do to this node, from the target tab's point of view. */
  _actionFor(node, tab) {
    if (node.isNew) return 'create';
    const hasTab = categoryTabs(node.doc).includes(tab);
    const changed = this._changedFields(node);
    if (!hasTab) return 'add-to-tab';
    return Object.keys(changed).length ? 'update' : 'unchanged';
  }

  _changedFields(node) {
    if (node.isNew) return { ...node.fields };
    const changed = {};
    Object.entries(node.fields).forEach(([key, value]) => {
      if (node.doc[key] !== value) changed[key] = value;
    });
    return changed;
  }

  async _commit(state, tab) {
    const tabFields = (doc) => {
      const tabs = [...new Set([...categoryTabs(doc), tab])];
      return { visibleTabs: tabs, commerceFlows: legacyFlowsForTabs(tabs) };
    };

    // Existing nodes first (so parents are enabled for the tab), then new
    // nodes in sheet order — a new parent is always created before its child.
    for (const node of state.nodes.values()) {
      if (node.isNew || !this._isTouched(node)) continue;
      try {
        await this.categoryRepository.updateById(node.nodeId, {
          ...this._changedFields(node),
          ...tabFields(node.doc),
        });
      } catch (err) {
        node.commitError = `Could not update "${node.name}": ${err.message}`;
      }
    }

    for (const node of state.order) {
      const parent = node.parentNode;
      if (parent && (parent.commitError || parent.nodeId.startsWith('new:'))) {
        node.commitError = `Skipped "${node.name}" because its parent "${parent.name}" failed`;
        continue;
      }
      try {
        const created = await this.categoryRepository.create({
          name: node.name,
          slug: node.slug,
          description: node.fields.description || '',
          imageUrl: node.fields.imageUrl || null,
          iconUrl: node.fields.iconUrl || null,
          sortOrder: node.fields.sortOrder ?? node.defaultSortOrder,
          isActive: node.fields.isActive ?? true,
          parentId: parent ? parent.nodeId : null,
          visibleTabs: [tab],
          commerceFlows: legacyFlowsForTabs([tab]),
        });
        node.nodeId = String(created._id);
      } catch (err) {
        node.commitError = `Could not create "${node.name}": ${err.message}`;
      }
    }
  }

  _isTouched(node) {
    return Boolean(node.touched);
  }

  _summarize(rows, state, tab) {
    const count = (status) => rows.filter((r) => r.status === status).length;
    const existingTouched = [...state.nodes.values()].filter((n) => !n.isNew && n.touched);
    return {
      totalRows: rows.length,
      validRows: count('ok'),
      errorRows: count('error'),
      skippedRows: count('skipped'),
      categoriesToCreate: state.order.filter((n) => !n.parentNode).length,
      subcategoriesToCreate: state.order.filter((n) => n.parentNode && !n.parentNode.parentNode).length,
      childCategoriesToCreate: state.order.filter((n) => n.parentNode && n.parentNode.parentNode).length,
      existingAddedToTab: existingTouched.filter((n) => this._actionFor(n, tab) === 'add-to-tab').length,
      existingUpdated: existingTouched.filter((n) => this._actionFor(n, tab) === 'update').length,
    };
  }
}

module.exports = { CategoryBulkImportService, MAX_CATEGORY_IMPORT_ROWS: MAX_ROWS };

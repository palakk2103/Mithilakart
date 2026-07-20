# CR-001 — Updated Category Architecture

**Change Request:** CR-001  
**Date:** 2026-07-20  

---

## 1. Problem Statement

Categories are **no longer globally visible**. A category visible on Mithilakart may be hidden on Quick Shop. Subcategories inherit constraints from parents but may further restrict visibility.

---

## 2. Schema Change

### Before
```javascript
categories.commerceFlows: ['standard', 'mithilak', 'quick_shop', 'fresh_grocery']
```

### After
```javascript
categories.visibleTabs: ['mithilakart', 'mithilak', 'quick_shop', 'groceries_fresh']
```

---

## 3. Visibility Rules

| Rule | Description |
|------|-------------|
| CAT-V01 | Every category must have ≥ 1 `visibleTabs` entry |
| CAT-V02 | Subcategory tabs ⊆ parent tabs |
| CAT-V03 | Product's master category must be visible on listing tab |
| CAT-V04 | Inactive category hidden on all tabs |
| CAT-V05 | Soft-deleted category excluded everywhere |

---

## 4. Category Tree per Tab

Each marketplace tab builds its **own filtered tree**:

```
mithilakart tree:
  Grocery
    Atta & Flour     [visibleTabs: mithilakart, quick_shop, groceries_fresh]
    Snacks           [visibleTabs: mithilakart only]

quick_shop tree:
  Grocery
    Atta & Flour     (Snacks excluded — not visible on quick_shop)
```

API: `GET /categories?marketplaceTab=quick_shop&tree=true`

---

## 5. Database Impact

| Collection | Field | Change |
|------------|-------|--------|
| `categories` | `visibleTabs[]` | Replaces `commerceFlows[]` |
| `category_chips` | `visibleTabs[]` | Replaces `commerceFlows[]` |
| `products` | `categoryId` | Unchanged — master category |
| `marketplace_listings` | — | Listing tab must align with category visibility |

**Index:** `{ visibleTabs: 1, parentId: 1, isActive: 1, sortOrder: 1 }`

---

## 6. API Impact

| Endpoint | Change |
|----------|--------|
| `GET /categories` | Required `marketplaceTab`; filter `visibleTabs` |
| `GET /categories/:id` | Include `visibleTabs` in response |
| `GET /categories/:id/products` | Return listings for tab |
| `POST/PUT /admin/catalog/categories` | Accept `visibleTabs[]` |
| `GET /storefront/:tab/home` | Category chips filtered by tab |

---

## 7. Admin Impact

### Category Form
- Replace "Commerce Flows" multi-select with "Visible Marketplace Tabs"
- Show warning if removing tab that has active listings
- Subcategory form shows parent tabs as available options

### Bulk Operations
- Bulk update visible tabs (admin only)
- Export categories with tab matrix CSV

---

## 8. Seller Impact

- Category picker filtered by seller's eligible tabs
- Warning if master category not visible on selected listing tab
- Cannot publish listing if category ⊄ listing tab

---

## 9. Customer Impact

- Category navigation scoped to current tab
- No cross-tab category leakage
- Empty category state if tab has no visible categories

---

## 10. Caching

| Key | TTL |
|-----|-----|
| `cache:categories:tree:{marketplaceTab}` | 1 hour |

Invalidate on category CRUD.

---

## 11. Migration Mapping

| Legacy `commerceFlows` | New `visibleTabs` |
|------------------------|-------------------|
| `standard` | `mithilakart` |
| `mithilak` | `mithilak` |
| `quick_shop` | `quick_shop` |
| `fresh_grocery` | `groceries_fresh` |

---

## 12. Example

**Category: Atta & Flour**
```json
{
  "name": "Atta & Flour",
  "parentId": "grocery-id",
  "visibleTabs": ["mithilakart", "quick_shop", "groceries_fresh"]
}
```

**Subcategory: Organic Atta**
```json
{
  "name": "Organic Atta",
  "parentId": "atta-flour-id",
  "visibleTabs": ["mithilakart", "groceries_fresh"]
}
```
→ Visible on Mithilakart and Groceries, **not** Quick Shop.

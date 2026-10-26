# CR-002 — 07: Admin Configuration

**Rule applied:** before adding any setting, the existing admin surface was inspected. Where equivalent functionality exists, CR-002 **extends** it. No duplicate settings system, no duplicate keys.

---

## 1. Existing Configuration Surfaces (inventory)

| Surface | File | Used by CR-002 |
|---|---|---|
| `PlatformSetting` — generic `{key, value}` | `models/PlatformSetting.js` | **Primary extension point** |
| `DEFAULT_PLATFORM_SETTINGS` | `constants/platformSettings.js` | New defaults added here |
| `PlatformConfigService` | `services/platform/` | Reused as-is (merge + 60 s cache + invalidate) |
| `AdminPlatformSettingsService` | `services/admin/` | Reused as-is (write + cache invalidate) |
| `MarketplaceConfig` | `models/MarketplaceConfig.js` | Extended for per-tab overrides |
| `DeliveryChargeRule` | `models/DeliveryChargeRule.js` | **Reused — no new delivery-charge system** |
| `CommissionRule` | `models/CommissionRule.js` | **Reused** |
| `TaxConfig` | `models/TaxConfig.js` | **Reused** |
| `GET`/`PUT /admin/settings` | `routes/v1/admin.platform.routes.js` | Reused — generic handler carries new keys with no route change |

---

## 2. Audit — CR-002 Requested Settings vs. What Already Exists

| CR-002 requirement | Already exists? | Decision |
|---|---|---|
| Quick fulfillment search timeout | No | **NEW** `quickFulfillmentSearchTimeoutSeconds` |
| Seller acceptance timeout | No | **NEW** `sellerAcceptanceTimeoutSeconds` |
| Seller search radius | Partial — `maxDeliveryRadiusKm` exists but means *customer delivery* radius | **NEW** `sellerSearchRadiusKm`, defaulting to `maxDeliveryRadiusKm`. Kept separate because conflating them would change existing delivery-charge and serviceability behaviour. |
| Quick delivery radius | Partial — `maxDeliveryRadiusKm` | **REUSE** `maxDeliveryRadiusKm` |
| Warehouse fallback enable/disable | No | **NEW** `warehouseFallbackEnabled` |
| Courier fallback enable/disable | No | **NEW** `courierFallbackEnabled` |
| Seller ranking | No | **NEW** `sellerRankingWeights` |
| Preparation time | No | **NEW** `defaultPreparationTimeMinutes` (+ per-seller override) |
| Delivery buffer | No | **NEW** `deliveryBufferMinutes` |
| Quick delivery charges | Partial — `DeliveryChargeRule` + `defaultDeliveryCharge` | **EXTEND** `DeliveryChargeRule` with an optional `marketplaceTab` scope. **No new charge model.** |
| Standard delivery charges | **Yes** — `DeliveryChargeRule`, `defaultDeliveryCharge` | **REUSE — no change** |
| Platform fee | **Yes** — `platformFee` | **REUSE** (now snapshotted onto the order) |
| Packaging fee | **Yes** — `packagingFee` | **REUSE** (now snapshotted) |
| Commission | **Yes** — `CommissionRule` + `PUT /admin/settings/commission` | **REUSE — no change** |
| Tax | **Yes** — `TaxConfig`, `gst` | **REUSE — no change** |
| Minimum order value | **Yes** — `minOrderAmount`, `MarketplaceConfig.minCartValue` | **REUSE — no change** |
| Free delivery threshold | **Yes** — `freeShippingThreshold`, `DeliveryChargeRule.freeAbove` | **REUSE — no change** |
| Delivery partner assignment timeout | No | **NEW** `deliveryPartnerAssignmentTimeoutSeconds` |
| Quick commerce enable/disable | **Yes** — `quickCommerceEnabled` | **REUSE — no change** |

**Result: 9 genuinely new keys. 10 requirements satisfied by existing configuration.**

---

## 3. New Keys

Added to `PLATFORM_SETTING_KEYS` and `DEFAULT_PLATFORM_SETTINGS` in `src/constants/platformSettings.js`.

| Key | Type | Default | Range | Purpose |
|---|---|---|---|---|
| `quickFulfillmentSearchTimeoutSeconds` | number | `30` | 5–300 | Max wall-clock for fulfillment discovery. **The CR's 30 s — configurable, never hardcoded.** |
| `sellerAcceptanceTimeoutSeconds` | number | `120` | 15–900 | Seller accept/reject window |
| `deliveryPartnerAssignmentTimeoutSeconds` | number | `60` | 15–600 | Per-partner offer window (`ranked` mode only) |
| `sellerSearchRadiusKm` | number | `10` | 1–100 | Candidate-seller search radius |
| `defaultPreparationTimeMinutes` | number | `5` | 0–120 | Fallback when `seller.preparationTimeMinutes` is null |
| `deliveryBufferMinutes` | number | `3` | 0–60 | Operational buffer added to every quick ETA |
| `warehouseFallbackEnabled` | boolean | `true` | — | Enables fallback level 2 |
| `courierFallbackEnabled` | boolean | `true` | — | Enables fallback level 3 |
| `sellerRankingWeights` | object | see §4 | weights 0–1 | Ranking strategy |

Supporting operational keys (same store, same mechanism):

| Key | Type | Default | Purpose |
|---|---|---|---|
| `maxSellerAttemptsPerOrder` | number | `3` | Candidates tried before escalating |
| `fulfillmentSweeperIntervalSeconds` | number | `15` | Deadline sweeper cadence |
| `deliveryAssignmentMode` | string | `'broadcast'` | `broadcast` (today's behaviour) \| `ranked` |
| `routingProviderEnabled` | boolean | `false` | Enables route-ETA API calls; off by default (R5) |
| `routingFallbackSpeedKmph` | number | `18` | Haversine-to-ETA speed when routing is off/unavailable |
| `crossSellerSubstitutionEnabled` | boolean | `false` | Master switch for `catalogKey` substitution; **off by default** (R1) |

Two defaults are deliberately conservative:
- `deliveryAssignmentMode: 'broadcast'` — the delivery flow behaves **exactly as it does today** until an operator opts in.
- `crossSellerSubstitutionEnabled: false` — CR-002 ships without changing which seller fulfils any order until the catalog is curated and Admin explicitly enables it.

---

## 4. `sellerRankingWeights`

```jsonc
{
  "distance":     0.30,
  "routeEta":     0.25,
  "preparation":  0.15,
  "workload":     0.15,
  "availability": 0.10,
  "adminBoost":   0.05
}
```

- Validated to be non-negative; normalised to sum to 1 at load time, so a partial admin edit cannot silently rescale the formula.
- A weight of `0` disables that factor.
- If a factor's data is unavailable (e.g. workload tracking off), its weight is redistributed proportionally rather than the factor defaulting to zero — otherwise disabling a data source would silently penalise every seller equally.

---

## 5. Resolution Order

```
MarketplaceConfig.fulfillmentOverrides[key]   // per-tab, nullable
        -> PlatformSetting[key]               // platform-wide, admin-editable
             -> DEFAULT_PLATFORM_SETTINGS[key] // code constant, last resort
```

Implemented as `FulfillmentConfigService.resolve(tab)`, which calls the **existing** `PlatformConfigService.getConfig()` (and therefore its existing 60 s Redis cache and `invalidateCache()` on write). No second cache, no second loader.

---

## 6. Snapshot Semantics

> Historical orders must NOT change if Admin later changes configuration.

At fulfillment finalisation the resolved values actually used are frozen into `Order.fulfillment.configSnapshot`:

```jsonc
{
  "quickFulfillmentSearchTimeoutSeconds": 30,
  "sellerAcceptanceTimeoutSeconds": 120,
  "sellerSearchRadiusKm": 10,
  "defaultPreparationTimeMinutes": 5,
  "deliveryBufferMinutes": 3,
  "sellerRankingWeights": { },
  "deliveryChargeRuleId": "...",
  "commissionRate": 0.12,
  "taxConfigId": "...",
  "platformFee": 0,
  "packagingFee": 0,
  "resolvedAt": "2026-08-18T12:00:00.000Z"
}
```

Order reads use the snapshot; only live fulfillment decisions read current config. Changing `deliveryBufferMinutes` tomorrow cannot alter yesterday's order total, ETA, or commission. Verified by `T-28`.

---

## 7. Admin UI

Extends the existing Settings page — a new "Fulfillment" section, not a new settings area.

| Group | Fields |
|---|---|
| Timeouts | search, seller acceptance, delivery partner assignment |
| Radius | seller search, quick delivery |
| ETA | default preparation time, delivery buffer, routing provider toggle, fallback speed |
| Fallback | warehouse enable, courier enable, max seller attempts |
| Ranking | six weights with live normalised preview |
| Advanced | delivery assignment mode, cross-seller substitution, sweeper interval |

Per-seller overrides (`preparationTimeMinutes`, `fulfillmentRadiusKm`, `isAcceptingOrders`, `isWarehouse`) go on the existing Admin -> Vendors detail page.

**Permissions:** existing `settings.view` / `settings.edit`. Warehouse designation requires `sellers.edit`. All writes flow through the existing `AuditService`.

---

## 8. No-Hardcode Compliance

Values that CR-002 must not hardcode, and where each now lives:

| Value | Location |
|---|---|
| 30-second search timeout | `quickFulfillmentSearchTimeoutSeconds` |
| Seller acceptance timeout | `sellerAcceptanceTimeoutSeconds` |
| Search / delivery radius | `sellerSearchRadiusKm`, `maxDeliveryRadiusKm` |
| Quick delivery ETA | computed (route + prep + buffer), never a literal |
| Preparation time | `seller.preparationTimeMinutes` -> `defaultPreparationTimeMinutes` |
| Delivery charges | `DeliveryChargeRule` (existing) |
| Platform / packaging fee | `platformFee`, `packagingFee` (existing) |
| Commission | `CommissionRule` (existing) |
| Tax | `TaxConfig` (existing) |
| Ranking strategy | `sellerRankingWeights` |
| Warehouse identity | `seller.isWarehouse` — **no hardcoded warehouse ID** |
| Seller / product IDs | never referenced literally anywhere in CR-002 code |

### 8.1 Pre-existing hardcoded values found during inspection

These are **outside CR-002's scope** but were found and are recorded so they are not mistaken for CR-002 regressions:

| Value | Location |
|---|---|
| `maxDistanceMeters: 10000`, `limit: 20` | `DeliveryOrderService.notifyNearbyPartnersForOrder` |
| `DEFAULT_DELIVERY_EARNING_AMOUNT = 50` | `constants/delivery.js` |
| `LOW_STOCK_THRESHOLD = 10` | `InventoryService` |
| `CART.SHIPPING_FEE = 39`, `FREE_SHIPPING_THRESHOLD = 500` | `constants/commerce.js` |
| `DELIVERY_PROMISE_MINUTES = [15,20,25,30]` | `constants/marketplace.js` |

CR-002 makes the **first** of these configurable, because the ranked-offer path necessarily replaces that call site. The others are left untouched — changing them is not required by CR-002 and would widen the regression surface for no benefit.

# Route Deep-Dive: `/product-detail` · `/vendor/product-detail`

**Page:** `ProductDetail.jsx` | **Layout:** Standalone | **Data:** `location.state.product` (no URL product ID)

## Purpose
Product detail page: images, pricing, size selection, wishlist, share, delivery info, specs, similar products, add to cart / buy now.

## Components
Image gallery, wishlist/share buttons, size selector (XS–XL), services panel, delivery card (hardcoded), highlights/specs accordions, similar/bought-together carousels, bottom sheets (return/COD/support), sticky mobile bar, `useAccountStore` wishlist.

## Business Flow
1. Product from router state or hardcoded fallback.
2. Add to Cart → `localStorage.userCart` + toast.
3. Buy Now → auth check → `/login` or `/checkout` with product state.
4. Wishlist toggle via Zustand store.
5. Share via Web Share API or clipboard.

## Expected APIs
| Endpoint | Current State |
|----------|---------------|
| `GET /products/:id` | Not wired — router state |
| `GET /products/:id/similar` | Mock carousel |
| `GET /products/:id/delivery-estimate` | Mock static text |
| `POST /cart/items`, wishlist endpoints | localStorage / Zustand only |

## Permissions
- View/add to cart/wishlist: **Public**
- Buy Now checkout: **Authenticated**

## Errors
| Scenario | Handling |
|----------|----------|
| Direct URL (no state) | Default product fallback |
| Share failure | Clipboard fallback or toast error |
| Share aborted | Silently ignored |

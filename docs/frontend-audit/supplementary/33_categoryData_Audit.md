# 33 — Category Data Audit

## File
`frontend/src/data/categoryData.js`

## Export
`allCategoryProducts` — object keyed by category name

## Categories Defined

| Category Key | Product Count | Sample Products |
|--------------|---------------|-----------------|
| You Buy | 6 | Gifting Box, Samsung S24, Lipstick, Earbuds, Diamond Pendant, Denim Jacket |
| Beauty | 8 | Lipstick, Serum, Mascara, Lip Gloss, Lip Liner, Shampoos |
| Gifting | 6+ | Gifting Box, Photo Frame, Candles, Coffee Mugs, Wallet Set |
| Electronics | 6+ | Samsung S24, Asus Laptop, Earbuds, etc. |
| Fashion | 6+ | Denim Jacket, T-shirt, Flip Flops, etc. |
| Jewellery | products with art jewellery |
| Toys | toy products |
| Stationery | stationery items |
| Electrical | AC, Fans, Cooler, Cookware |

## Product Object Schema (Frontend)

```javascript
{
  id: string,           // e.g. 'b1', 'fy2'
  name: string,
  category: string,
  price: number,        // INR
  oldPrice: number,
  discount: string,     // e.g. '50% OFF'
  rating: number,       // 1-5
  image: importedAsset,
  shortDescription: string
}
```

## Used By
- CategoryProducts.jsx
- Search.jsx (partial)
- QuickShop.jsx / QuickShopSubcategory.jsx
- Mithilak.jsx

## Backend Mapping

```sql
products: id, name, category_id, price, mrp, discount_percent, rating, description, images[]
categories: id, name, slug, parent_id
```

## Required APIs
- GET /api/v1/categories — list all categories
- GET /api/v1/categories/:slug/products — products by category
- GET /api/v1/products/for-you — personalized "You Buy" recommendations

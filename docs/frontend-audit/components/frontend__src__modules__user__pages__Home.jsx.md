# File Audit: frontend/src/modules/user/pages/Home.jsx

| Property | Value |
|----------|-------|
| Lines | 370 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (41)

- `react-router-dom`
- `lucide-react`
- `../components/vendor/home/LazySection`
- `../components/vendor/home/StillLookingSection`
- `../components/vendor/home/TopSelection`
- `../components/vendor/home/BrandsSpotlight`
- `../components/vendor/home/BestQuality`
- `../components/vendor/home/KeepShopping`
- `../components/vendor/home/RatingSection`
- `../components/vendor/home/CategoryTabs`
- `../components/vendor/home/SubCategoryGrid`
- `../components/vendor/home/TrendingThisWeek`
- `../components/vendor/CategoryProductsSection`
- `../components/vendor/SaleBanner`
- `../components/vendor/BannerCarousel`
- `../../../assets/products/product01.jpg`
- `../../../assets/products/product02.jpg`
- `../../../assets/products/product03.jpg`
- `../../../assets/products/product04.jpg`
- `../../../assets/products/product05.jpg`
- `../../../assets/products/product06.jpg`
- `../../../assets/products/product07.jpg`
- `../../../assets/products/product08.jpg`
- `../../../assets/products/product09.jpg`
- `../../../assets/products/product10.jpg`
- `../../../assets/products/product11.webp`
- `../../../assets/products/product12.jpg`
- `../../../assets/products/product13.jpg`
- `../../../assets/products/product14.jpg`
- `../../../assets/products/product15.webp`
- `../../../assets/products/product01.jpg`
- `../../../assets/products/product02.jpg`
- `../../../assets/products/product03.jpg`
- `../../../assets/products/product04.jpg`
- `../../../assets/TopBanner/fashion_sale_banner.png`
- `../../../assets/TopBanner/ImageBanner1.jpg`
- `../../../assets/TopBanner/ImageBanner2.jpg`
- `../../../assets/TopBanner/ImageBanner3.webp`
- `../../../assets/TopBanner/ImageBanner4.jpg`
- `../../../store/useVendorStore`
- `react-hot-toast`

## Hooks / State

- useState('You Buy')
- useVendorStore
- useNavigate

## Routes Defined

| Path | Component |
|------|----------|
| `/home` | object-route |
| `/category-products?category=Fashion` | object-route |
| `/category-products?category=Beauty` | object-route |
| `/category-products?category=Electronics` | object-route |
| `/category-products?category=Jewellery` | object-route |
| `/toys` | object-route |
| `/category-products?category=Stationery` | object-route |
| `/category-products?category=Gifting` | object-route |
| `/category-products?category=Electrical` | object-route |

## Buttons (1)

### Button 1
- **Label:** {
                        e.stopPropagation();
                        e.preve
- **Type:** button
- **onClick:** `(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
                        cart.push({ name: deal.name, price: deal.price, image: deal.img, cartId: Date.now(), qty: 1 `

## localStorage Keys

- `userCart`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg
- URL: https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80
- URL: https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80
- URL: https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&auto=format&fit=crop&q=80

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.

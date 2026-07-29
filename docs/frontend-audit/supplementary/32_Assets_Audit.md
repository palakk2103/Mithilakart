# 32 — Assets Audit

## Asset Directory Structure

```
frontend/src/assets/
├── Banner.jpeg, hero.png, banner_illustration.png
├── Beauty/          (6 jewelry images)
├── Cards/           (20 product card images)
├── Carousel/        (5 category carousel PNGs)
├── categories/      (7 category icons)
├── Icons/           (8 nav tab icons)
├── mithila/         (10 Mithila art product images)
├── products/        (15 product photos)
├── StillSection/    (5 "still looking" images)
├── TopBanner/       (5 hero banner images)
├── TopSection/      (5 top selection images)
├── trending/        (4 trending category images)
├── sale-animation.json  (Lottie animation)
└── vite.svg
```

## Total Asset Files
~100+ image files + 1 Lottie JSON

## Asset Usage Patterns

| Pattern | Example | Used In |
|---------|---------|---------|
| Static import | `import img from '../../../assets/products/product01.jpg'` | Home.jsx, useVendorStore.js |
| Public URL | `url('/Screenshot 2026-07-17 130906.png')` | VendorLayout background texture |
| Unsplash CDN | `https://images.unsplash.com/...` | useAccountStore order seed |
| Lottie JSON | sale-animation.json | SaleBanner component |

## CMS-Managed Assets (Admin)

These should move to CDN/S3 when backend is ready:
- Banner images (BannerManager)
- Category images (CategoryManager)
- Product images (AddProduct, ImageUploader)
- Home section images (HomeSectionsManager)

## Backend File Storage Requirements

| Type | Format | Max Size | Storage |
|------|--------|----------|---------|
| Product images | JPEG, PNG, WebP | 5MB | S3 + CDN |
| Banner images | JPEG, PNG | 2MB | S3 + CDN |
| KYC documents | PDF, JPEG | 10MB | S3 (private) |
| Review images | JPEG, PNG | 2MB | S3 + CDN |
| Seller logos | PNG, SVG | 1MB | S3 + CDN |
| Lottie animations | JSON | 500KB | CDN |

## Image Optimization Gaps
- No responsive srcset
- No WebP conversion pipeline
- No lazy loading attribute on img tags
- Large PNG carousel assets not compressed

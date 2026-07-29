# 31 — Internationalization (i18n) Audit

## Configuration
- **File:** `frontend/src/i18n/index.js`
- **Library:** i18next + react-i18next
- **Initialized in:** `main.jsx`

## Supported Locales

| Code | Language | File |
|------|----------|------|
| en | English | locales/en/common.json |
| hi | Hindi | locales/hi/common.json |
| bn | Bengali | locales/bn/common.json |
| mai | Maithili | locales/mai/common.json |

## Translation Key Namespaces (en/common.json)

### nav
home, categories, cart, you, deliverTo, viewCart, searchPlaceholder, searchInGrocery, quickShop, mithilak, xtraSaver, grocery, groceriesAndFresh

### sidebar
title, home, shopByCategory, myCart, myWishlist, myProfile, myWallet, myOrders, logout, login, hello (with {{name}} interpolation), trending, bestsellers, newReleases, moversAndShakers, digitalContent, echoAlexa, fireTv, kindleBooks, audibleAudiobooks, primeVideo, primeMusic, mobilesComputers, tvAppliancesElectronics, mensFashion, womensFashion, seeAll, programsAndFeatures, giftCards, launchpad, business, handloomHandicrafts, helpAndSettings, yourAccount, customerService, signOut

### home
title, subtitle, summerSale, newArrivals, electronicsDeal, groceryOffers, bestQuality, keepShopping, topSelection, brandsSpotlight, stillLooking, ratingsTitle

### auth
loginTitle, loginSubtitle, signupTitle, signupSubtitle, emailLabel, passwordLabel, placeholders, mobileLabel, otpLabel, sendOtp, verifyOtp, resendOtp, switchToEmail, switchToPhone, forgotPassword

### checkout
orderSummary, paymentMethod, placeOrder, deliveryEstimate, subtotal, deliveryFee, total

### address
title, addNew, edit, delete, setDefault, home, work, other

### cart
title, empty, proceedToCheckout, remove, quantity

### profile
title, editProfile, myOrders, wishlist, coupons, addresses, cards, notifications, reviews, helpCenter

### common
loading, error, retry, save, cancel, confirm, delete, edit, add, search, filter, sort, apply

## Components Using i18n

| Component | Hook |
|-----------|------|
| VendorLayout.jsx | useTranslation() |
| Login.jsx | useTranslation() |
| Cart.jsx | useTranslation() |
| Checkout.jsx | useTranslation() |
| MainSidebar.jsx | useTranslation() |
| LanguageSelector.jsx | i18n.changeLanguage() |

## LanguageSelector Behavior
- Dropdown with 4 language options
- Persists selection (check i18n config for localStorage key)
- Updates all t() calls reactively

## Backend Requirements
- CMS should support multi-language product descriptions
- API responses may include `locale` query param
- Legal pages (terms, privacy) need per-locale content from CMS
- Notification templates per locale

## Gaps
- Admin panel not internationalized
- Seller portal not internationalized
- Delivery app not internationalized
- Many hardcoded English strings remain in components despite i18n setup

# Client 65-point audit (23 Nov 2026)

Source of truth: the client's note "Latest issues mithilakart" (22 Nov). Base commit `e7bbb56`; changes are in the working tree, not committed.

Every "VERIFIED" below was run, not read: a separate backend (port 5055), Vite (3055) and a local MongoDB replica set, with mock payment/SMS/shipping. The Atlas database was never written to.

**Evidence runs (final):** browser suite A 72/72, browser suite B 33/33, backend API suite 25/25, painted-pixel check 3/3, backend unit tests 519 pass / 2 fail (the same two `search-tab-scoping` tests fail on the untouched base), production build OK, merge with `origin/main` (`d8da4f5`) conflict-free.

Status key: VERIFIED · LOCKED · PARTIAL · BLOCKED · NOT COMPLETED · NOT RECEIVED

| ID | Client point | Root cause / what was done | Evidence | Status |
|---|---|---|---|---|
| P01 | 4-tab design locked | Untouched | Header+tabs pixel diff vs baseline 0.00–0.01 % on all 4 tabs | LOCKED |
| P02 | Tab header locked | Untouched | Same | LOCKED |
| P03 | Tab footer locked | Untouched | Bottom nav diff 0.00 % on 3 tabs; Quick Shop 2.23 % = the P06 colour | LOCKED |
| P04 | Privacy policy good, update it | New wording must come from the client (legal text); admin → Legal Policies edits it | – | BLOCKED (text) |
| P05 | Bottom footer good | Untouched | See P03 | LOCKED |
| P06 | Home / You colour not per theme | Hard-coded `#FF5C00`; no Quick Shop case for Cart/You. One theme class now | Computed colour = admin theme, Home + You × 4 tabs | VERIFIED |
| P07 | Cart popup not per theme | Colour came from localStorage, Fresh hard-coded brown | Gradient = theme × 4 tabs | VERIFIED |
| P08 | Cart / You locked for guests | Untouched | Guest sees login card on both, and on the new pages | LOCKED |
| P09 | Login UI like old | Old design restored with today's OTP logic | Screenshot + test | VERIFIED |
| P10 | Existing-customer check, register message; email OTP not received | Backend answered "OTP on its way" for unknown users. Now `404 NOT_REGISTERED` + "Register now" (prefilled). Email OTP needs SMTP_HOST / SMTP_USER / SMTP_PASSWORD / EMAIL_FROM | Unknown phone + email, real phone login | PARTIAL (email delivery BLOCKED: no SMTP) |
| P11 | Category chips too spacious | Chips fully redesigned on `origin/main` (21 Nov); screenshot not supplied | – | NOT COMPLETED |
| P12 | Filter on home is touched | Screenshot not supplied, same area as P11 | – | NOT COMPLETED |
| P13 | 11 subcategories / show 1200 products | Screenshot not supplied; meaning unclear | – | BLOCKED |
| P14 | More filters for child category | Text cut off in the image | – | BLOCKED |
| P15–P21 | – | Not in the images (image 3 repeats image 2) | – | NOT RECEIVED |
| P22 | Category → landing → sub → child | New landing for Quick Shop and Fresh; default sections until admin adds some | Full click-through on both tabs, child list in sidebar | VERIFIED |
| P23 | Surge logic | Was price + time only. New admin trigger "only when demand is high": N orders in M minutes per tab. ₹30 / ₹499 / banner all admin | 0 orders off, 3 on, only that tab; 30 under 499, 0 from 499; admin save | VERIFIED (default stays "always" until admin switches) |
| P24 | Wishlist on Quick/Fresh products | Hearts added to every landing card | 9 and 6 hearts, saved in DB | VERIFIED |
| P25 | Quick & Fresh is done | – | Covered by P22–P24 runs; text cut off | PARTIAL |
| P26–P34 | – | Not in the images (image 5 repeats image 4) | – | NOT RECEIVED |
| P35 | "Not available" message higher | Bare centred text; good component was unused. Now at the top; toasts lifted above the bottom bar | y = 24 px; toaster bottom 160 px | VERIFIED |
| P36 | Customisable package | **Could never be added to the cart**: controller dropped `packageId`. Also shown inside its category | 24 items, −₹250 live price, below ₹1400 blocked, order stored at ₹3375 | VERIFIED |
| P37 | Wishlist page not good | Rebuilt. Removed an "f Assured" badge, invented 4-star rating, invented MRP/discount | Test + screenshot | VERIFIED |
| P38 | Purchase restrictions at cart / checkout / payment | Cart had limits; **Buy Now skipped them**, and limits were not re-checked at order time | 6 API cases | VERIFIED (shared document itself not supplied) |
| P39 | Coupon & gift-card encryption / phishing control | Per-user limit never recorded; codes public; seller coupons valid anywhere; unlimited guessing; expired coupon emptied checkout. All fixed | 10 API + 6 unit tests | PARTIAL (coupons done; gift cards do not exist yet) |
| P40 | Cart missing banner / sections – why | Banner shows only if admin has a "cart" banner for that tab; a rail with no products is hidden | Banner appears once one exists | VERIFIED |
| P41 | Wishlist header theme, missing sections | Hard-coded purple; snow haze on top | Header = theme (3 tabs + painted pixel); Bestsellers + Recommended shown | VERIFIED |
| P42 | Bigger cart, + / − / count | Sizes raised; rails have − qty + | 132 px cards, 1 → 2 | VERIFIED |
| P43 | Sections admin-controlled, spacing | New section added to admin design; gap 14 px | Gaps all 14; admin screen lists it | VERIFIED (a spacing already saved in live admin wins over the new default) |
| P44 | View All to its own page | Went to tab home. New `/picks/<rail>` page + API | Browser | VERIFIED |
| P45 | Safe Payments on cart, summary, payment | New strip (also wishlist) | All three | VERIFIED |
| P46 | Only "Add More Items" clickable | Text made plain | Browser | VERIFIED |
| P47 | Price Details heading | Heading + icon, phone and desktop | Browser | VERIFIED |
| P48 | Bestsellers View All / View More | Keeps the selected sub-tab | Brands in Trend → same page | VERIFIED |
| P49 | "Also in" text | "Your other carts:" | Browser | VERIFIED |
| P50 | Cart wishlist rail ≠ wishlist | De-duplicated and limited to one tab | 5/5 API, 3/3 browser | VERIFIED |
| P51 | Wishlist per account or tab | One per account, tab filter chips, "Sold in …" note | 4/4 items | VERIFIED (decision to confirm) |
| P52 | Checkout button faded | Two causes: disabled style below the minimum, **and the theme's snow haze painted over the bar** | Pixel `89,157,224` → `22,114,208` with all conditions met | VERIFIED |
| P53 | "Estimated Delivery in" | Text under the address | Browser | VERIFIED |
| P54 | Explain coupons / reward / voucher | See below | – | VERIFIED (explanation) |
| P55 | Best offer + trust block | Added; trust no longer needs a rating | Browser | VERIFIED |
| P56 | Coupons & offers on payment | Code box, Apply / Locked list, payment offers | Browser | VERIFIED (design file not supplied) |
| P57 | Payment method design | Selectable cards. Official UPI/PhonePe logos need brand assets | Browser | PARTIAL (reference design not supplied) |
| P58 | ₹100 cashback + Know More | Exists, off in admin because no cashback is paid anywhere in code | Works when switched on | VERIFIED (kept off) |
| P59 | "35 Crore" text | Replaced in en / hi / mai | Browser | VERIFIED |
| P60 | Pay button | Right aligned, width by text | 206 px wide, right edge 378/390 | VERIFIED |
| P61 | forceShopClosed | Browser flag removed; admin Shop Hours, enforced on orders | Flag has no effect both ways; order refused | VERIFIED |
| P62–P64 | /500, /404, /maintenance | Already there | Open correctly | VERIFIED |
| P65 | How to test scenarios | See below | 11 scenarios run | PARTIAL |

## P54 – coupons, reward, voucher on Order Summary
- **Apply Coupon**: customer types a code; the server prices the real cart with it.
- **Vouchers & Offers**: the same coupons as a list, each Apply or Locked with the reason ("Shop for ₹X more").
- **Reward Your Delivery Hero**: a tip of ₹0–500 added to the bill. It is not a discount.

## P65 – how to test
| Scenario | Steps | Run? |
|---|---|---|
| 404 / 500 / maintenance | Open `/any-wrong-url`, `/500`, `/maintenance` | Yes |
| Default image | Product without an image | Seen in the runs |
| Product unavailable / deleted | Open `/product-detail/ffffffffffffffffffffffff` | Yes |
| Out of stock | Set stock 0 in admin, open the wishlist or cart | No |
| Empty cart / wishlist | Remove all items | Yes |
| No search results | Search `zzzzqqqq` | Yes |
| API failure | DevTools → block `category-landing`, open a category | Yes |
| Session expired | Change `customer_access_token` and `customer_refresh_token`, reload `/cart` | Yes |
| Coupon valid / invalid / expired | Order Summary → Apply Coupon | Yes |
| Order confirmation | Place a COD order | Yes |
| Guest vs logged in | Cart / You in a private window | Yes |
| Payment failure / cancel | Razorpay test mode → close the sheet | No (mock provider used) |
| BOGO | No such feature in the code reviewed | No |
| Shipping unavailable | `Checkout.jsx` treats every courier-check failure as serviceable, so this never shows | Known gap |
| Variants, localisation, site-wide maintenance switch | – | No |

## Known gaps
1. Gift cards: no model, API or screen.
2. `Mithilak.jsx` still shows a default 4.7 rating; left alone because `origin/main` rewrites that file.
3. The second of two simultaneous orders with a one-use coupon is refused with a generic 500 instead of a clear message.
4. Login now tells whether a number is registered (client's request). The 10 requests / 15 min per IP limit is what stops harvesting; it was switched off in the test backend.
5. Orders on Quick Shop and Fresh are now refused 00:00–06:00 IST by default (previously only a banner). Change it in Admin → Settings → Checkout Fees & Limits → Shop hours.

## Update 25 Nov 2026 (client follow-up)
| Item | Done | Evidence | Status |
|---|---|---|---|
| Guest order message | Every way to order while logged out (Checkout, Buy Now, Add to Bag, expired session, order API) says "Please login to continue checkout" / a matching message, and returns to the same checkout after login | Browser + API `401 LOGIN_REQUIRED` | VERIFIED |
| P58 dynamic cashback | Admin → Settings → Checkout Fees & Limits → Cashback: on/off, instant or wallet-after-delivery, % or ₹, max, minimum order, methods, tabs, uses per customer, dates. Banner and "Know More" are written from these rules and the cashback is really given | Off the bill (₹25 cap), once per customer even with two parallel orders, back after cancel, wallet credit after delivery | VERIFIED |
| P04 privacy policy | Admin → Legal Policies → Privacy is what customers see | Admin save → `/privacy` shows it | VERIFIED |
| P39 gift cards | Admin → Promotions → Gift Cards. Code shown once, stored only as a hash; optional lock to one mobile number; freeze; guessing locked after 6 tries; balance returned on cancel | API + browser | VERIFIED |
| Wallet at checkout | Admin switch; never goes negative with parallel orders; returned once on cancel | API + browser | VERIFIED |
| Pincode blocking | Admin switch; off by default (courier outage never stops orders) | Not tested against real Shiprocket | PARTIAL |

Test runs (each suite alone): browser 72 + 33 + 17 + 6, API 25 + 29, unit 524 pass / 2 known old fails.

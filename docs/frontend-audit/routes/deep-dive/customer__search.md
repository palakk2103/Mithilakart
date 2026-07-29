# Route Deep-Dive: `/search` · `/vendor/search`

**Page:** `Search.jsx` | **Layout:** `VendorLayout` | **Query:** `?q=`

## Purpose
Product search results with grid/list toggle, sort/filter UI placeholders, voice search.

## Components
`SearchInput`, filter button (decorative), view mode toggle, sort tags (UI only), `ProductCard`, Web Speech API (`en-IN`), empty state.

## Business Flow
1. Read `q` from URL; filter 8 hardcoded `allProducts` client-side.
2. Enter in search bar → navigate `/search?q=`.
3. Microphone → speech recognition → navigate with transcript.
4. Zero results → empty state + link `/home`.
5. **Gap:** ProductCard tap does not navigate to product-detail.

## Expected APIs
| Endpoint | Current State |
|----------|---------------|
| `GET /products/search` | Not wired — client filter |
| `GET /products/search/suggestions` | Not wired |
| `GET /products/filters` | Not wired |

## Permissions
- **Public**; voice requires browser SpeechRecognition support

## Errors
| Scenario | Handling |
|----------|----------|
| SpeechRecognition unsupported | alert() |
| Speech error | console.error; reset listening |
| Empty query | Shows all 8 products |

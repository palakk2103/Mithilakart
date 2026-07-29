# File Audit: frontend/src/modules/user/pages/Mithilak.jsx

| Property | Value |
|----------|-------|
| Lines | 304 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (15)

- `react-router-dom`
- `lucide-react`
- `../../../assets/mithila/product01.png`
- `../../../assets/mithila/product02.png`
- `../../../assets/mithila/product03.png`
- `../../../assets/mithila/product04.png`
- `../../../assets/mithila/product05.png`
- `../../../assets/mithila/product06.png`
- `../../../assets/mithila/product07.png`
- `../../../assets/mithila/product08.png`
- `../../../assets/mithila/product09.png`
- `../../../assets/products/product10.jpg`
- `../../../assets/mithila/product11.png`
- `../../../assets/products/product12.jpg`
- `../../../assets/banner_illustration.png`

## Hooks / State

- useState(false)
- useState('')
- useEffect x1
- useNavigate

## Buttons (1)

### Button 1
- **Label:** {
                      e.stopPropagation();
                      e.preventDe
- **Type:** button
- **onClick:** `(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
                      cart.push({ name: prod.name, price: prod.price, image: prod.img, cartId: Date.now(), qty: 1 `

## localStorage Keys

- `isMithilakFlow`
- `isQuickShopFlow`
- `isFreshGroceryFlow`
- `userCart`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.

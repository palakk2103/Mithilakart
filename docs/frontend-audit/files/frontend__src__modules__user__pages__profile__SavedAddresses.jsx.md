# File Audit: frontend/src/modules/user/pages/profile/SavedAddresses.jsx

| Property | Value |
|----------|-------|
| Lines | 315 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (5)

- `lucide-react`
- `react-router-dom`
- `framer-motion`
- `../../../../store/useAccountStore`
- `react-hot-toast`

## Hooks / State

- useState(false)
- useState(null)
- useState({ name: '', phone: '', address: '', type)
- useAccountStore
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | false | Enter full name |
| unnamed | tel | false | Enter 10-digit number |
| unnamed | textarea | false | House No, Building, Street, Area... |

## Buttons (9)

### Button 1
- **Label:** navigate(-1)}
            className="p-1.5 rounded-full hover:bg-gray-100 trans
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** handleOpenModal()}
          className="p-1.5 rounded-full hover:bg-primary-lig
- **Type:** button
- **onClick:** `() => handleOpenModal()`

### Button 3
- **Label:** handleOpenModal()}
          className="w-full bg-[#3E5A44] text-white py-3.5 r
- **Type:** button
- **onClick:** `() => handleOpenModal()`

### Button 4
- **Label:** (icon-only)
- **Type:** button
- **onClick:** ``

### Button 5
- **Label:** { e.stopPropagation(); handleOpenModal(addr); }}
                    className=
- **Type:** button
- **onClick:** `(e) => { e.stopPropagation(); handleOpenModal(addr); `

### Button 6
- **Label:** handleDelete(addr.id, e)}
                    className="flex items-center gap-
- **Type:** button
- **onClick:** `(e) => handleDelete(addr.id, e)`

### Button 7
- **Label:** setIsModalOpen(false)}
                  className="p-2 bg-gray-100 rounded-ful
- **Type:** button
- **onClick:** `() => setIsModalOpen(false)`

### Button 8
- **Label:** setFormData({ ...formData, type })}
                        className={`flex-1 
- **Type:** button
- **onClick:** `() => setFormData({ ...formData, type `

### Button 9
- **Label:** {editingAddress ? 'Update Address' : 'Save Address'}
- **Type:** button
- **onClick:** `handleSave`

## localStorage Keys

- `isQuickShopFlow`
- `isMithilakFlow`
- `isFreshGroceryFlow`

## Backend Dependency Inference

Primarily presentational or uses local/mock state. Verify at integration time.

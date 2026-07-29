# File Audit: frontend/src/modules/admin/pages/Users.jsx

| Property | Value |
|----------|-------|
| Lines | 397 |
| Extension | .jsx |
| Has Form | false |
| Has Modal/Dialog | true |
| Has Table | true |
| Has Chart | false |
| Has Toast | false |

## Exports

- `default`

## Imports (4)

- `../../../shared/components/SearchInput`
- `react-router-dom`
- `lucide-react`
- `framer-motion`

## Hooks / State

- useState('')
- useState(false)
- useState(MOCK_USERS)
- useState('All')
- useState(false)
- useState({
    name: '',
    email: '',
    ph)
- useState(null)
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| name | text | false | e.g. Rahul Sharma |
| email | email | false | rahul@example.com |
| phone | tel | false | +91 00000 00000 |
| status | select | false |  |

## Buttons (12)

### Button 1
- **Label:** Export List
- **Type:** button
- **onClick:** `handleExport`

### Button 2
- **Label:** setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-
- **Type:** button
- **onClick:** `() => setIsAddModalOpen(true)`

### Button 3
- **Label:** setIsFilterOpen(!isFilterOpen)}
                className={`w-full sm:w-auto px
- **Type:** button
- **onClick:** `() => setIsFilterOpen(!isFilterOpen)`

### Button 4
- **Label:** {
                              setFilterStatus(status);
                     
- **Type:** button
- **onClick:** `() => {
                              setFilterStatus(status);
                              setIsFilterOpen(false);
                            `

### Button 5
- **Label:** toggleMenu(e, user.id)}
                      className={`p-2 rounded-lg transi
- **Type:** button
- **onClick:** `(e) => toggleMenu(e, user.id)`

### Button 6
- **Label:** handleAction(e, 'view', user)} className="w-full px-4 py-2.5 flex items-center g
- **Type:** button
- **onClick:** `(e) => handleAction(e, 'view', user)`

### Button 7
- **Label:** handleAction(e, 'edit', user)} className="w-full px-4 py-2.5 flex items-center g
- **Type:** button
- **onClick:** `(e) => handleAction(e, 'edit', user)`

### Button 8
- **Label:** handleAction(e, 'email', user)} className="w-full px-4 py-2.5 flex items-center 
- **Type:** button
- **onClick:** `(e) => handleAction(e, 'email', user)`

### Button 9
- **Label:** handleAction(e, 'suspend', user)} className="w-full px-4 py-2.5 flex items-cente
- **Type:** button
- **onClick:** `(e) => handleAction(e, 'suspend', user)`

### Button 10
- **Label:** setIsAddModalOpen(false)} 
                  className="w-12 h-12 bg-slate-50 r
- **Type:** button
- **onClick:** `() => setIsAddModalOpen(false)`

### Button 11
- **Label:** setIsAddModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 roun
- **Type:** button
- **onClick:** `() => setIsAddModalOpen(false)`

### Button 12
- **Label:** Save Customer
- **Type:** button
- **onClick:** `handleSaveCustomer`

## Hardcoded / Mock Indicators

- contains mock/dummy references

## Backend Dependency Inference

Contains data tables — requires paginated list API with filters/sort.

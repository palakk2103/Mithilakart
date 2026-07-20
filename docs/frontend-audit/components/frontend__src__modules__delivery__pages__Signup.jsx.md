# File Audit: frontend/src/modules/delivery/pages/Signup.jsx

| Property | Value |
|----------|-------|
| Lines | 310 |
| Extension | .jsx |
| Has Form | true |
| Has Modal/Dialog | false |
| Has Table | false |
| Has Chart | false |
| Has Toast | true |

## Exports

- `default`

## Imports (5)

- `react-router-dom`
- `lucide-react`
- `framer-motion`
- `react-hot-toast`
- `../../../store/useDeliveryStore`

## Hooks / State

- useState(false)
- useState({
    fullName: '',
    mobile: '',
 )
- useDeliveryStore
- useNavigate

## Form Fields

| Name | Type | Required | Placeholder |
|------|------|----------|-------------|
| unnamed | text | true |  |
| unnamed | file | false |  |
| fullName | text | true | Full name |
| mobile | tel | true | Mobile |
| altMobile | tel | false | Optional |
| email | email | true | Email |
| dob | date | true |  |
| age | number | false | Age |
| fathersName | text | false | Father |
| currAddress | text | true | Full address |
| permAddress | text | false | Permanent address |
| city | text | true | City |
| state | text | false | State |
| pinCode | text | true | PIN |
| emergencyContact | tel | false | Emergency # |
| aadhaar | text | true | 12 digits |
| pan | text | true | 10 digits |
| policeVerification | radio | false |  |
| vehicleType | select | false |  |
| vehicleNumber | text | false | DL 01 ... |
| licenseNumber | text | false | DL Number |
| rcNumber | text | false | RC Number |
| insuranceNumber | text | false | Insurance # |
| insuranceExpiry | date | false |  |
| bankName | text | true | Bank |
| accHolder | text | true | Name |
| accNumber | text | true | Number |
| ifsc | text | true | IFSC |
| branch | text | false | Branch |
| upiId | text | false | upi@bank |

## Buttons (3)

### Button 1
- **Label:** navigate(-1)}
          className="bg-white/20 hover:bg-white/30 text-white p-2
- **Type:** button
- **onClick:** `() => navigate(-1)`

### Button 2
- **Label:** {loading ? (
              
            ) : (
              'Submit Applicati
- **Type:** submit
- **onClick:** ``

### Button 3
- **Label:** navigate('/delivery/auth')} className="text-[#0a4a17] hover:underline">
       
- **Type:** button
- **onClick:** `() => navigate('/delivery/auth')`

## Hardcoded / Mock Indicators

- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg
- URL: http://www.w3.org/2000/svg

## Backend Dependency Inference

Contains forms — requires corresponding POST/PUT API endpoints with validation.

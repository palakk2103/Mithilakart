/**
 * Seller Module Constants
 * Central configuration for colors, menu items, status mappings, and more.
 */

// ─── Color Palette ───────────────────────────────────────────────
export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  secondary: '#1D4ED8',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

// ─── Chart Colors ────────────────────────────────────────────────
export const CHART_COLORS = [
  '#2563EB', '#8B5CF6', '#EC4899', '#F59E0B',
  '#16A34A', '#06B6D4', '#F97316', '#6366F1',
];

// ─── Order Statuses ──────────────────────────────────────────────
export const ORDER_STATUSES = {
  PENDING: { label: 'Pending', color: 'warning', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  CONFIRMED: { label: 'Confirmed', color: 'info', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  PACKED: { label: 'Packed', color: 'info', bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  SHIPPED: { label: 'Shipped', color: 'info', bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-500' },
  DELIVERED: { label: 'Delivered', color: 'success', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', color: 'danger', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  RETURNED: { label: 'Returned', color: 'danger', bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
};

// ─── Product Statuses ────────────────────────────────────────────
export const PRODUCT_STATUSES = {
  ACTIVE: { label: 'Active', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
  INACTIVE: { label: 'Inactive', bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-500' },
  OUT_OF_STOCK: { label: 'Out of Stock', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  DRAFT: { label: 'Draft', bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-500' },
};

// ─── Return Statuses ─────────────────────────────────────────────
export const RETURN_STATUSES = {
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600' },
  APPROVED: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-600' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-600' },
};

// ─── Payment Statuses ────────────────────────────────────────────
export const PAYMENT_STATUSES = {
  PAID: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-600' },
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600' },
  FAILED: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-600' },
  REFUNDED: { label: 'Refunded', bg: 'bg-purple-50', text: 'text-purple-600' },
};

// ─── Notification Types ──────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  ORDER: { label: 'Order', icon: 'ShoppingCart', bg: 'bg-blue-50', text: 'text-blue-600' },
  RETURN: { label: 'Return', icon: 'RotateCcw', bg: 'bg-orange-50', text: 'text-orange-600' },
  REVIEW: { label: 'Review', icon: 'Star', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  INVENTORY: { label: 'Inventory', icon: 'Package', bg: 'bg-red-50', text: 'text-red-600' },
  PAYMENT: { label: 'Payment', icon: 'DollarSign', bg: 'bg-green-50', text: 'text-green-600' },
};

// ─── Sidebar Menu ────────────────────────────────────────────────
export const SIDEBAR_MENU = [
  {
    group: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/seller/dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    group: 'CATALOG',
    items: [
      { name: 'Products', path: '/seller/products', icon: 'Package' },
      { name: 'Add Product', path: '/seller/products/add', icon: 'PlusCircle' },
      { name: 'Bulk Upload', path: '/seller/products/bulk-upload', icon: 'Upload' },
      { name: 'Inventory', path: '/seller/inventory', icon: 'Warehouse' },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      { name: 'Orders', path: '/seller/orders', icon: 'ShoppingCart' },
      { name: 'Returns', path: '/seller/returns', icon: 'RotateCcw' },
      { name: 'Customers', path: '/seller/customers', icon: 'Users' },
    ],
  },
  {
    group: 'ENGAGEMENT',
    items: [
      { name: 'Reviews', path: '/seller/reviews', icon: 'Star' },
      { name: 'Coupons', path: '/seller/coupons', icon: 'Ticket' },
      { name: 'Notifications', path: '/seller/notifications', icon: 'Bell' },
    ],
  },
  {
    group: 'FINANCE',
    items: [
      { name: 'Analytics', path: '/seller/analytics', icon: 'BarChart3' },
      { name: 'Earnings', path: '/seller/earnings', icon: 'Wallet' },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { name: 'Settings', path: '/seller/settings', icon: 'Settings' },
      { name: 'Logout', path: '#logout', icon: 'LogOut' },
    ],
  },
];

// ─── Categories ──────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', subcategories: ['Mobiles', 'Laptops', 'Tablets', 'Accessories'] },
  { id: 'clothing', name: 'Clothing', subcategories: ['Men', 'Women', 'Kids', 'Ethnic'] },
  { id: 'home', name: 'Home & Living', subcategories: ['Furniture', 'Decor', 'Kitchen', 'Garden'] },
  { id: 'beauty', name: 'Beauty', subcategories: ['Skincare', 'Makeup', 'Hair Care', 'Fragrance'] },
  { id: 'food', name: 'Food & Grocery', subcategories: ['Snacks', 'Beverages', 'Organic', 'Spices'] },
  { id: 'handicraft', name: 'Handicraft', subcategories: ['Madhubani', 'Sujani', 'Tikuli', 'Woodcraft'] },
];

// ─── Pagination ──────────────────────────────────────────────────
export const PAGE_SIZES = [10, 25, 50, 100];

// ─── Date Range Presets ──────────────────────────────────────────
export const DATE_RANGES = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This Year', value: '1y' },
  { label: 'All Time', value: 'all' },
];

// ─── Discount Types ──────────────────────────────────────────────
export const DISCOUNT_TYPES = [
  { label: 'Percentage (%)', value: 'percentage' },
  { label: 'Flat Amount (₹)', value: 'flat' },
];

// ─── Settings Tabs ───────────────────────────────────────────────
export const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: 'User' },
  { id: 'store', label: 'Store', icon: 'Store' },
  { id: 'business', label: 'Business', icon: 'Briefcase' },
  { id: 'bank', label: 'Bank Details', icon: 'CreditCard' },
  { id: 'security', label: 'Security', icon: 'Shield' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell' },
  { id: 'preferences', label: 'Preferences', icon: 'Palette' },
];

/** Map backend API responses to admin UI shapes with safe defaults. */

export const extractList = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  return [];
};

export const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const formatDate = (date) => {
  if (!date) return '—';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return String(date);
  }
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(date);
  }
};

export const titleCaseStatus = (status) => {
  if (!status) return 'Pending';
  return String(status)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const mapUserStatus = (status) => {
  const s = String(status || 'active').toLowerCase();
  if (s === 'blocked' || s === 'suspended') return 'Inactive';
  if (s === 'vip') return 'VIP';
  return 'Active';
};

export const mapUser = (u = {}) => ({
  id: u._id || u.id || '',
  name: u.name || 'Unknown',
  email: u.email || '—',
  phone: u.phone ? (u.countryCode ? `${u.countryCode} ${u.phone}` : u.phone) : '—',
  joined: formatDate(u.createdAt),
  totalSpent: formatCurrency(u.totalSpent ?? u.walletBalance ?? 0),
  orders: u.orderCount ?? u.orders ?? 0,
  status: mapUserStatus(u.status),
});

export const mapVendorStatus = (seller = {}) => {
  const status = String(seller.status || '').toLowerCase();
  const kyc = String(seller.kycStatus || '').toLowerCase();
  if (kyc === 'pending') return 'Pending';
  if (status === 'suspended') return 'Suspended';
  if (status === 'inactive' || kyc === 'rejected') return 'Blocked';
  if (status === 'active' && kyc === 'approved') return 'Approved';
  return 'Pending';
};

export const mapVendor = (v = {}) => ({
  id: v._id || v.id || '',
  name: v.storeName || v.name || 'Unknown',
  owner: v.name || v.owner || '—',
  email: v.email || '—',
  status: mapVendorStatus(v),
  joined: formatDate(v.createdAt),
  revenue: v.revenue ?? v.balance ?? v.totalEarnings ?? 0,
});

export const mapPendingVendor = (v = {}) => ({
  id: v._id || v.id || '',
  name: v.storeName || v.name || 'Unknown',
  owner: v.name || '—',
  email: v.email || '—',
  status: 'Pending',
  joined: formatDate(v.createdAt),
});

export const mapOrder = (o = {}, customer = {}) => ({
  id: o.orderNumber || o.id || o._id || '',
  customer: customer.name || o.customerName || o.user?.name || 'Customer',
  email: customer.email || o.customerEmail || o.user?.email || '—',
  total: o.total ?? 0,
  status: titleCaseStatus(o.status),
  date: formatDateTime(o.createdAt),
  items: o.itemCount ?? o.items?.length ?? 0,
  payment: titleCaseStatus(o.paymentStatus || o.paymentMethod || 'pending'),
});

export const mapOrderDetail = (data = {}) => {
  const order = data.order || data;
  const items = (data.items || []).map((item, i) => ({
    id: item.id || item._id || i + 1,
    name: item.name || item.productName || 'Product',
    price: formatCurrency(item.unitPrice ?? item.price ?? 0),
    qty: item.quantity ?? 1,
    img: item.image || item.img || 'https://via.placeholder.com/100',
  }));

  const tracking = data.tracking || [];
  const timeline = tracking.length
    ? tracking.map((t) => ({
        status: titleCaseStatus(t.status),
        date: formatDateTime(t.createdAt),
        desc: t.note || titleCaseStatus(t.status),
        completed: true,
      }))
    : [
        {
          status: titleCaseStatus(order.status),
          date: formatDateTime(order.createdAt),
          desc: 'Order status',
          completed: true,
        },
      ];

  return {
    status: titleCaseStatus(order.status),
    placedAt: formatDateTime(order.createdAt),
    items,
    itemCount: items.length,
    subtotal: formatCurrency(order.subtotal ?? order.total ?? 0),
    deliveryCharge: order.deliveryCharge > 0 ? formatCurrency(order.deliveryCharge) : 'FREE',
    tax: formatCurrency(order.tax ?? 0),
    total: formatCurrency(order.total ?? 0),
    paymentMethod: titleCaseStatus(order.paymentMethod || 'Payment'),
    paymentStatus: titleCaseStatus(order.paymentStatus || 'pending'),
    timeline,
    customer: {
      name: order.customer?.name || 'Customer',
      email: order.customer?.email || '—',
      phone: order.customer?.phone || '—',
      address: order.shippingAddress?.formatted || order.shippingAddress?.line1 || '—',
    },
  };
};

export const mapReturn = (r = {}) => ({
  id: r.returnNumber || r._id || r.id || '',
  rawStatus: r.status || '',
  orderId: r.orderNumber || r.orderId || '—',
  user: r.userName || r.user?.name || 'Customer',
  item: r.productName || r.itemName || 'Item',
  amount: formatCurrency(r.refundAmount ?? r.amount ?? 0),
  reason: r.reason || '—',
  status: titleCaseStatus(r.status),
  date: formatDate(r.createdAt),
});

export const mapRefund = (r = {}) => ({
  id: r.refundNumber || r._id || r.id || '',
  orderId: r.orderNumber || r.orderId || '—',
  user: r.userName || r.user?.name || 'Customer',
  amount: formatCurrency(r.amount ?? 0),
  method: r.method === 'wallet' || r.refundMethod === 'wallet' ? 'Wallet' : 'Source',
  reason: r.reason || '—',
  status: titleCaseStatus(r.status),
  date: formatDate(r.createdAt),
  returnId: r.returnId || '—',
});

export const mapSellerDetail = (s = {}, extras = {}) => ({
  id: s._id || s.id || '',
  storeName: s.storeName || s.name || 'Store',
  owner: s.name || '—',
  email: s.email || '—',
  phone: s.phone || '—',
  address: s.address || '—',
  status: mapVendorStatus(s),
  kycStatus: titleCaseStatus(s.kycStatus || 'pending'),
  pan: s.documents?.pan || '—',
  gst: s.documents?.gstin || '—',
  bankAccount: s.bankDetails?.bankName
    ? `${s.bankDetails.bankName} — ${s.bankDetails.accountNumber || 'XXXX'}`
    : '—',
  totalSales: formatCurrency(extras.earnings ?? s.balance ?? 0),
  totalOrders: extras.orderCount ?? 0,
  totalProducts: extras.productCount ?? 0,
  avgRating: extras.avgRating ?? 0,
  documents: (s.documents?.files || []).map((d, i) => ({
    name: d.name || `Document ${i + 1}`,
    status: titleCaseStatus(d.status || 'pending'),
    uploadedAt: formatDate(d.uploadedAt),
  })),
  topProducts: (extras.products || []).slice(0, 5).map((p) => ({
    name: p.name || 'Product',
    sales: p.sales ?? p.orderCount ?? 0,
    revenue: formatCurrency(p.revenue ?? p.price ?? 0),
  })),
  recentOrders: (extras.orders || []).slice(0, 5).map((o) => ({
    id: o.orderNumber || o.id || '—',
    amount: formatCurrency(o.total ?? 0),
    status: titleCaseStatus(o.status),
    date: formatDate(o.createdAt),
  })),
});

export const mapAuditLog = (log = {}) => ({
  id: log._id || log.id || '',
  admin: log.adminName || log.admin?.name || log.actor || 'System',
  action: log.action || log.event || '—',
  target: log.target || log.resource || log.entityId || '—',
  ip: log.ip || log.ipAddress || '—',
  timestamp: formatDateTime(log.createdAt || log.timestamp),
  type: log.type || log.category || 'default',
});

export const mapLoginHistory = (log = {}) => ({
  id: log._id || log.id || '',
  admin: log.adminName || log.admin?.name || log.email || '—',
  ip: log.ip || log.ipAddress || '—',
  device: log.device || log.userAgent || '—',
  location: log.location || '—',
  timestamp: formatDateTime(log.createdAt || log.timestamp),
  status: titleCaseStatus(log.status || 'success'),
});

export const mapRole = (r = {}) => ({
  id: r._id || r.id || '',
  name: r.name || 'Role',
  description: r.description || '',
  permissions: r.permissions || [],
  members: r.memberCount ?? r.members ?? 0,
  color: r.color || 'blue',
  createdAt: formatDate(r.createdAt),
});

export const mapTicket = (t = {}) => ({
  id: t.ticketNumber || t._id || t.id || '',
  user: t.userName || t.user?.name || 'Customer',
  subject: t.subject || t.title || 'Support Request',
  category: t.category || 'General',
  status: titleCaseStatus(t.status || 'open'),
  priority: titleCaseStatus(t.priority || 'medium'),
  date: formatDate(t.createdAt),
});

export const mapTaxSlab = (t = {}) => ({
  id: t._id || t.id || '',
  category: t.name || t.category || 'General',
  gst: t.rate != null ? `${Math.round(Number(t.rate) * 100)}%` : (t.gst || '18%'),
  hsn: t.hsnCode || t.hsn || '—',
  region: t.region || 'IN',
  status: t.isActive !== false ? 'Active' : 'Inactive',
});

export const mapDeliveryZone = (z = {}) => ({
  id: z._id || z.id || '',
  name: z.name || 'Zone',
  area: z.pincodePrefix ? `Pin: ${z.pincodePrefix}` : (z.area || 'All locations'),
  pincodePrefix: z.pincodePrefix || '',
  baseFee: formatCurrency(z.baseCharge ?? z.baseFee ?? 0),
  freeAbove: formatCurrency(z.freeAbove ?? 0),
  status: z.isActive !== false ? 'Active' : 'Inactive',
});

export const mapDeliveryPartner = (p = {}) => ({
  id: p._id || p.id || '',
  name: p.name || 'Agent',
  zone: p.zone || p.serviceArea || '—',
  phone: p.phone ? `${p.countryCode || '+91'} ${p.phone}` : '—',
  status: p.isOnline ? 'Busy' : titleCaseStatus(p.status || 'pending'),
  rating: p.rating ?? 0,
  orders: p.orderCount ?? p.completedOrders ?? 0,
  vehicle: titleCaseStatus(p.vehicleType || 'bike'),
});

export const mapDeliveryApplication = (p = {}) => ({
  id: p._id || p.id || '',
  name: p.name || 'Agent',
  zone: p.zone || '—',
  date: formatDate(p.createdAt),
  vehicle: titleCaseStatus(p.vehicleType || 'bike'),
  license: p.documents?.drivingLicenseNumber || '—',
  status: titleCaseStatus(p.status || 'pending'),
});

export const mapCategory = (c = {}) => ({
  id: c._id || c.id || '',
  name: c.name || 'Category',
  slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, '-') || '',
  description: c.description || '',
  parentId: c.parentId?._id || c.parentId || '',
  parentName: c.parentId?.name || c.parentName || '',
  count: c.productCount ?? c.count ?? 0,
  status: c.isActive === false ? 'Inactive' : (c.status === 'draft' ? 'Draft' : 'Active'),
  isActive: c.isActive !== false,
  image: c.image || c.imageUrl || 'https://via.placeholder.com/400',
  imageUrl: c.imageUrl || c.image || '',
  iconUrl: c.iconUrl || '',
  sortOrder: c.sortOrder ?? 0,
  commerceFlows: c.commerceFlows || ['standard'],
});

export const mapChip = (c = {}, index = 0) => ({
  id: c._id || c.id || c.slug || `chip-${index}`,
  label: c.label || c.name || 'Chip',
  emoji: c.emoji || c.icon || '🏷️',
  imageUrl: c.imageUrl || '',
  categoryId: c.categoryId?._id || c.categoryId || '',
  commerceFlow: c.commerceFlow || 'standard',
  active: c.isActive !== false,
  order: c.order ?? c.sortOrder ?? index + 1,
});

export const mapProduct = (p = {}) => ({
  id: p._id || p.id || '',
  name: p.name || p.title || 'Product',
  category: p.categoryName || p.category || 'General',
  vendorId: p.sellerId || p.vendorId || '—',
  price: p.price ?? p.sellingPrice ?? 0,
  stock: p.stock ?? p.quantity ?? 0,
  status: titleCaseStatus(p.status || p.approvalStatus || 'pending'),
});

export const mapNotification = (n = {}, index = 0) => ({
  id: n._id || n.id || index + 1,
  title: n.title || n.name || n.subject || 'Notification',
  body: n.body || n.message || n.content || '',
  target: n.target || n.audience || 'All Users',
  sent: formatDateTime(n.sentAt || n.updatedAt || n.createdAt),
  read: n.readRate != null ? `${n.readRate}%` : '—',
  status: titleCaseStatus(n.status || 'delivered'),
});

export const mapDashboardStats = (stats = {}) => ({
  totalRevenue: stats.totalRevenue ?? 0,
  totalOrders: stats.totalOrders ?? 0,
  activeVendors: stats.sellers ?? stats.activeVendors ?? 0,
  platformCommission: stats.platformCommission ?? 0,
});

export const mapRevenueChart = (rows = []) =>
  extractList(rows).map((row) => ({
    name: row._id || row.name || row.date || '—',
    sales: row.revenue ?? row.sales ?? 0,
  }));

export const mapSalesReportData = (raw) => {
  const rows = extractList(raw);
  if (rows.length && rows[0].month) return rows;
  const agg = rows[0] || {};
  if (agg.totalSales != null || agg.orderCount != null) {
    return [{
      month: 'Period',
      revenue: agg.totalSales ?? 0,
      orders: agg.orderCount ?? 0,
      avgOrderValue: Math.round(agg.avgOrderValue ?? 0),
    }];
  }
  return [];
};

export const mapUserReportData = (raw) => {
  const rows = extractList(raw);
  if (rows.length && rows[0].month) return rows;
  const active = rows.find((r) => r._id === 'active')?.count ?? 0;
  const total = rows.reduce((s, r) => s + (r.count ?? 0), 0);
  return [{ month: 'Current', newUsers: 0, activeUsers: active, returningUsers: Math.max(0, total - active) }];
};

export const mapOrderReportData = (raw) => {
  const rows = extractList(raw);
  if (rows.length && rows[0].month) return rows;
  const completed = rows.find((r) => r._id === 'delivered')?.count ?? 0;
  const cancelled = rows.find((r) => r._id === 'cancelled')?.count ?? 0;
  const total = rows.reduce((s, r) => s + (r.count ?? 0), 0);
  return [{ month: 'Period', total, completed, cancelled, returned: 0 }];
};

export const mapInventoryReportData = (raw) => {
  const rows = extractList(raw);
  if (rows.length && rows[0].category) return rows;
  const agg = rows[0] || {};
  if (agg.totalProducts != null) {
    return [{
      category: 'All Products',
      totalProducts: agg.totalProducts ?? 0,
      inStock: Math.max(0, (agg.totalProducts ?? 0) - (agg.lowStock ?? 0)),
      lowStock: agg.lowStock ?? 0,
      outOfStock: 0,
    }];
  }
  return [];
};

export const mapRefundReportData = (raw) => {
  const rows = extractList(raw);
  if (rows.length && rows[0].month) return rows;
  const total = rows.reduce((s, r) => s + (r.count ?? 0), 0);
  return [{ month: 'Period', total, wallet: 0, source: total, amount: 0 }];
};

export const mapSellerReportData = (raw) => {
  const rows = extractList(raw);
  if (rows.length && rows[0].name) return rows;
  return rows.map((r, i) => ({
    id: r._id || `V${i + 1}`,
    name: titleCaseStatus(r._id || 'Seller'),
    totalSales: formatCurrency(r.revenue ?? 0),
    orders: r.count ?? 0,
    returns: 0,
    rating: 0,
    status: titleCaseStatus(r._id || 'active'),
    commission: formatCurrency(0),
  }));
};

export const mapCommissionRule = (r = {}) => ({
  id: r._id || r.id || '',
  name: r.name || 'General',
  category: r.name || 'General',
  rate: r.rate != null ? `${Math.round(Number(r.rate) * 100)}%` : '0%',
  type: 'Percentage',
  status: r.isActive !== false ? 'Active' : 'Draft',
  isDefault: r.isDefault === true,
  minSale: '₹0',
});

export const mapPlatformEarnings = (data = {}) => ({
  netCommission: Number(data.commission ?? 0),
  grossMerchandise: Number(data.gross ?? 0),
  pendingPayouts: Number(data.net ?? 0),
  payoutCount: Number(data.payoutCount ?? 0),
});

export const mapEarningsTrend = (data = {}) => [
  {
    day: 'Total',
    platform: Number(data.commission ?? 0),
    vendors: Number(data.net ?? 0),
  },
];

export const mapFlashSale = (deal = {}) => {
  const sale = deal.sale || deal;
  const now = Date.now();
  const startMs = sale.startsAt ? new Date(sale.startsAt).getTime() : 0;
  const endMs = sale.endsAt ? new Date(sale.endsAt).getTime() : 0;
  let status = 'Scheduled';
  if (endMs && now > endMs) status = 'Completed';
  else if (startMs && endMs && now >= startMs && now <= endMs) status = 'Live';

  return {
    id: sale._id || sale.id || '',
    name: sale.title || 'Flash Sale',
    start: formatDateTime(sale.startsAt),
    end: formatDateTime(sale.endsAt),
    products: (deal.products || []).length,
    discount: sale.description || 'Flash Deal',
    status,
  };
};

export const mapFeaturedProduct = (p = {}) => ({
  id: p._id || p.id || '',
  name: p.name || p.title || 'Product',
  category: p.categoryName || p.category || 'General',
  price: formatCurrency(p.price ?? p.sellingPrice ?? 0),
  img: p.image || p.imageUrl || (Array.isArray(p.images) ? p.images[0]?.url || p.images[0] : '') || 'https://via.placeholder.com/80',
});

export const mapProductReviewPlaceholder = (p = {}, index = 0) => ({
  id: p._id || p.id || index,
  user: p.sellerName || 'Customer',
  product: p.name || p.title || 'Product',
  rating: Math.min(5, Math.max(1, Math.round(p.rating ?? 4))),
  comment: p.description || 'Awaiting customer review moderation.',
  date: formatDate(p.updatedAt || p.createdAt),
  status: 'Pending',
});

export const mapProductQnaPlaceholder = (p = {}, index = 0) => ({
  id: p._id || p.id || index,
  user: 'Customer',
  product: p.name || p.title || 'Product',
  question: `Questions about ${p.name || p.title || 'this product'}?`,
  answer: null,
  status: 'Pending',
  date: formatDate(p.updatedAt || p.createdAt),
});

export const mapAdminReview = (r = {}) => ({
  id: r._id || r.id || '',
  rawStatus: r.status || 'pending',
  user: r.userName || 'Customer',
  product: r.productName || r.product?.title || 'Product',
  rating: r.rating ?? 0,
  comment: r.body || r.comment || '',
  date: formatDate(r.createdAt),
  status: titleCaseStatus(r.status),
});

export const mapAdminQna = (q = {}) => ({
  id: q._id || q.id || '',
  rawStatus: q.status || 'pending',
  user: q.userName || 'Customer',
  product: q.productName || 'Product',
  question: q.question || '',
  answer: q.answer || null,
  date: formatDate(q.createdAt),
  status: q.answer ? 'Answered' : titleCaseStatus(q.status),
});

export const mapRoleAsSubAdmin = (r = {}, index = 0) => ({
  id: r._id || r.id || index,
  name: r.name || 'Role',
  email: r.description || '—',
  role: r.name || 'Role',
  lastLogin: formatDate(r.updatedAt || r.createdAt),
  status: r.isActive !== false ? 'Active' : 'Paused',
});

export const mapStockAlert = (p = {}) => {
  const stock = Number(p.stock ?? p.quantity ?? 0);
  const threshold = Number(p.lowStockThreshold ?? p.reorderLevel ?? 10);
  let status = 'Low';
  if (stock === 0) status = 'Out of Stock';
  else if (stock <= Math.max(1, Math.floor(threshold / 2))) status = 'Critical';

  return {
    id: p._id || p.id || '',
    name: p.name || p.title || 'Product',
    category: p.categoryName || p.category || 'General',
    stock,
    threshold,
    status,
    vendor: p.sellerName || p.vendorName || p.sellerId || '—',
  };
};

export const mapAnalyticsRevenue = (raw) => {
  const rows = extractList(raw);
  if (rows.length && (rows[0].month || rows[0].name || rows[0]._id)) {
    return rows.map((row) => ({
      month: row.month || row.name || row._id || '—',
      rev: row.revenue ?? row.sales ?? row.total ?? 0,
      orders: row.orders ?? row.orderCount ?? row.count ?? 0,
    }));
  }
  const agg = raw && !Array.isArray(raw) ? raw : rows[0] || {};
  if (agg.totalSales != null || agg.orderCount != null) {
    return [{
      month: 'Period',
      rev: agg.totalSales ?? agg.revenue ?? 0,
      orders: agg.orderCount ?? agg.orders ?? 0,
    }];
  }
  return [];
};

export const mapAnalyticsCategoryShare = (raw) => {
  const rows = extractList(raw);
  if (!rows.length) return [];
  if (rows[0].category) {
    return rows.map((row) => ({
      name: row.category,
      value: row.totalProducts ?? row.inStock ?? row.count ?? 0,
    }));
  }
  return rows.slice(0, 5).map((row) => ({
    name: titleCaseStatus(row._id || row.name || 'Category'),
    value: row.count ?? row.totalProducts ?? 0,
  }));
};

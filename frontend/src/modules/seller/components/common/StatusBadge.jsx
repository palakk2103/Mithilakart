/**
 * StatusBadge Component
 * Maps order/product/return statuses to colored badges.
 */
import React from 'react';
import { Badge } from '../ui';

const statusColors = {
  // Order statuses
  pending: 'warning',
  confirmed: 'info',
  packed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'danger',
  delayed: 'danger',
  dispatch_delayed: 'danger',
  // Product statuses
  active: 'success',
  inactive: 'neutral',
  out_of_stock: 'danger',
  draft: 'warning',
  // Return statuses
  approved: 'success',
  rejected: 'danger',
  // Payment
  paid: 'success',
  refunded: 'purple',
  failed: 'danger',
  // Coupon
  expired: 'neutral',
  // Settlement
  completed: 'success',
  processing: 'info',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  delayed: 'Dispatch Delayed',
  dispatch_delayed: 'Dispatch Delayed',
  active: 'Active',
  inactive: 'Inactive',
  out_of_stock: 'Out of Stock',
  draft: 'Draft',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  refunded: 'Refunded',
  failed: 'Failed',
  expired: 'Expired',
  completed: 'Completed',
  processing: 'Processing',
};

const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const normalizedStatus = status?.toLowerCase()?.replace(/\s+/g, '_');
  const variant = statusColors[normalizedStatus] || 'neutral';
  const label = statusLabels[normalizedStatus] || status;

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;

# 20 — Database Requirements

## Core Entities

### users
```
id, name, email, phone, countryCode, gender, dob, avatarUrl,
authProvider, isVerified, status, createdAt, updatedAt
```

### user_addresses
```
id, userId, type(HOME/WORK/OTHER), name, phone, line1, line2,
city, state, pincode, landmark, isDefault, lat, lng
```

### user_payment_methods
```
id, userId, type(VISA/MC/UPI), tokenizedNumber, expiry, holder,
gatewayToken, isDefault
```

### sellers
```
id, storeName, ownerName, email, phone, address, status,
kycStatus, gst, pan, bankAccountId, commissionRate, joinedAt
```

### seller_documents
```
id, sellerId, type(GST/PAN/BANK), url, status, verifiedAt
```

### categories
```
id, name, slug, parentId, imageUrl, sortOrder, isActive
```

### products
```
id, sellerId, title, description, sku, price, mrp, stock,
categoryId, status(pending/approved/rejected), images[], tags[],
rating, reviewCount, createdAt
```

### product_variants
```
id, productId, name, price, stock, attributes(JSON)
```

### orders
```
id, userId, status, subtotal, discount, tax, deliveryCharge,
total, paymentMethod, paymentStatus, addressSnapshot(JSON),
createdAt, deliveredAt
```

### order_items
```
id, orderId, productId, sellerId, quantity, price, status
```

### order_tracking
```
id, orderId, status, timestamp, location, note
```

### returns
```
id, orderId, orderItemId, reason, images[], status, createdAt
```

### refunds
```
id, returnId, orderId, userId, amount, method(wallet/source),
status, processedAt
```

### coupons
```
id, code, type(percent/fixed), value, minOrder, maxDiscount,
usageLimit, usedCount, expiry, sellerId(null=platform), isActive
```

### wallets
```
id, userId, balance, currency
```

### wallet_transactions
```
id, walletId, type(credit/debit), amount, reference, description
```

### reviews
```
id, productId, userId, orderId, rating, title, body, images[],
status, createdAt
```

### product_qna
```
id, productId, userId, question, answer, answeredBy, status
```

### delivery_partners
```
id, name, phone, vehicleType, status, isOnline, currentLat, currentLng
```

### delivery_assignments
```
id, orderId, partnerId, status, pickupOtp, deliveryOtp, earning
```

### banners
```
id, title, imageUrl, link, position, sortOrder, isActive, startDate, endDate
```

### home_sections
```
id, sectionKey, title, productIds[], isActive, sortOrder
```

### admin_users
```
id, email, passwordHash, roleId, name, status, lastLogin
```

### roles
```
id, name, description, permissions[]
```

### audit_logs
```
id, adminId, action, target, ip, metadata, timestamp
```

### notifications
```
id, userId, type, title, body, isRead, createdAt
```

### support_tickets
```
id, userId, subject, status, priority, messages[], createdAt
```

## Indexes (Recommended)
- products: categoryId, sellerId, status, (title text)
- orders: userId, status, createdAt
- order_items: orderId, sellerId
- delivery_assignments: partnerId, status

## Relationships
- users 1:N orders, addresses, reviews, wishlist
- sellers 1:N products, orders (via order_items)
- orders 1:N order_items, 1:1 delivery_assignment
- products N:1 categories, N:1 sellers

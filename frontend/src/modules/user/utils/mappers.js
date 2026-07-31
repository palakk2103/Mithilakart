import { parsePrice } from '../../../shared/utils/priceFormatter';
import { DEFAULT_PRODUCT_IMAGE, getImageUrl } from '../../../shared/utils/imageUtils';

export { DEFAULT_PRODUCT_IMAGE };

export const extractList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.coupons)) return data.coupons;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const getEntityId = (entity) => entity?.id || entity?._id || '';

export const getProductImage = (product, fallback = DEFAULT_PRODUCT_IMAGE) => {
  let rawUrl = null;
  if (product?.image) rawUrl = product.image;
  else if (product?.img) rawUrl = product.img;
  else if (product?.imageUrl) rawUrl = product.imageUrl;
  else if (Array.isArray(product?.images) && product.images.length > 0) {
    const first = product.images[0];
    rawUrl = typeof first === 'string' ? first : first?.url;
  }
  return rawUrl ? getImageUrl(rawUrl) : fallback;
};

export const formatDisplayPrice = (value) => {
  const parsed = parsePrice(value);
  return parsed.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export const calcDiscountLabel = (price, mrp) => {
  const p = parsePrice(price);
  const m = parsePrice(mrp);
  if (!m || m <= p) return '';
  return `${Math.round(((m - p) / m) * 100)}% off`;
};

export const mapProductForCard = (product, fallbackImage = '') => {
  const rawId = getEntityId(product);
  const listingId = product.listingId || (product.marketplaceTab ? rawId : undefined);
  const productId = product.productId || (!product.marketplaceTab ? rawId : undefined);
  const price = product.price ?? product.salePrice ?? 0;
  const mrp = product.mrp ?? product.oldPrice ?? product.mrp;

  return {
    id: productId || rawId,
    listingId,
    productId,
    marketplaceTab: product.marketplaceTab,
    deliveryPromiseMinutes: product.deliveryPromiseMinutes,
    deliveryLabel: product.deliveryLabel,
    title: product.title || product.name || 'Product',
    name: product.title || product.name || 'Product',
    brand: product.brand || '',
    price: formatDisplayPrice(price),
    oldPrice: mrp ? formatDisplayPrice(mrp) : undefined,
    mrp: mrp ? formatDisplayPrice(mrp) : undefined,
    rating: String(product.rating ?? '4.2'),
    reviews: String(product.reviewCount ?? product.reviews ?? '120'),
    reviewCount: product.reviewCount ?? product.reviews ?? 0,
    image: getProductImage(product, fallbackImage),
    img: getProductImage(product, fallbackImage),
    discount: product.discount || calcDiscountLabel(price, mrp),
    off: product.off || product.discount || calcDiscountLabel(price, mrp),
    delivery: product.deliveryLabel || product.delivery || 'Tomorrow',
    stock: product.stock ?? product.availableStock,
    categoryId: product.categoryId,
  };
};

export const mapProductForDetail = (product, fallbackImage = '') => {
  const card = mapProductForCard(product, fallbackImage);
  const price = parsePrice(product.price ?? product.salePrice);
  const mrp = parsePrice(product.mrp ?? product.oldPrice);

  return {
    ...card,
    name: card.title,
    description: product.description || '',
    images: Array.isArray(product.images)
      ? product.images.map((img) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
      : [card.image].filter(Boolean),
    variants: product.variants || [],
    tags: product.tags || [],
    attributes: product.attributes || {},
    ratingCount: product.reviewCount ?? product.ratingCount ?? 0,
    discount: card.discount || calcDiscountLabel(price, mrp),
  };
};

export const mapCartItem = (item) => ({
  cartId: item.itemKey || item.id || getEntityId(item),
  id: item.productId || getEntityId(item),
  productId: item.productId || getEntityId(item),
  variantId: item.variantId,
  name: item.name || item.title || 'Product',
  title: item.title || item.name || 'Product',
  price: item.unitPrice ?? item.price ?? 0,
  oldPrice: item.mrp ?? item.oldPrice,
  qty: item.quantity ?? item.qty ?? 1,
  quantity: item.quantity ?? item.qty ?? 1,
  image: getProductImage(item),
  img: getProductImage(item),
  marketplaceTab: item.marketplaceTab || item.tab || null,
  commerceFlow: item.commerceFlow || null,
});

export const mapOrderForList = (order) => ({
  id: order.orderNumber || getEntityId(order),
  orderNumber: order.orderNumber || getEntityId(order),
  status: order.status || 'Pending',
  date: order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : order.date || '',
  total: order.total,
  items: (order.sellerSubOrders || [])
    .flatMap((sub) => sub.items || [])
    .map((item) => ({
      name: item.name || item.title || 'Product',
      price: formatDisplayPrice(item.unitPrice ?? item.lineTotal ?? item.price),
      image: getProductImage(item),
    })),
});

export const mapOrderDetail = (data) => {
  const order = data?.order || data;
  const addr = order?.address || order?.addressSnapshot || {};
  const items = (data?.items || order?.items || []).map((item) => ({
    id: getEntityId(item),
    orderItemId: getEntityId(item),
    productId: item.productId || getEntityId(item),
    name: item.name || item.title || 'Product',
    price: formatDisplayPrice(item.unitPrice ?? item.lineTotal ?? item.price),
    oldPrice: item.mrp ? formatDisplayPrice(item.mrp) : undefined,
    image: getProductImage(item),
    quantity: item.quantity ?? 1,
  }));

  const formatStatus = (status) => (status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: order.orderNumber || getEntityId(order),
    mongoId: getEntityId(order),
    orderNumber: order.orderNumber || getEntityId(order),
    status: formatStatus(order.status),
    rawStatus: order.status || 'pending',
    date: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '',
    total: order.total,
    deliveryCharge: order.deliveryCharge ?? 0,
    subtotal: order.subtotal,
    discount: order.discount ?? order.couponDiscount ?? 0,
    tax: order.tax ?? 0,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    fulfilmentType: order.fulfilmentType,
    address: {
      name: addr.name || '',
      phone: addr.phone || '',
      line1: addr.line1 || addr.addressLine || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      lat: addr.lat ?? addr.latitude ?? null,
      lng: addr.lng ?? addr.longitude ?? null,
    },
    items: items.length
      ? items
      : (order.sellerSubOrders || [])
          .flatMap((sub) => sub.items || [])
          .map((item) => ({
            name: item.name || 'Product',
            price: formatDisplayPrice(item.unitPrice ?? item.lineTotal),
            image: getProductImage(item),
            quantity: item.quantity ?? 1,
          })),
    tracking: data?.tracking || [],
    shipment: order.shipment || data?.shipment || null,
    assignment: data?.assignment || null,
    partnerLocation: data?.partnerLocation || null,
    destination: data?.destination || null,
  };
};

export const mapCategorySections = (categories, fallbackSections = []) => {
  const list = extractList(categories);
  if (!list.length) return fallbackSections;

  return list.map((cat) => ({
    title: cat.name,
    items: (cat.children || []).map((child) => ({
      name: child.name,
      img: child.imageUrl || child.iconUrl || cat.imageUrl || '',
      path: `/vendor/category-products?category=${encodeURIComponent(child.name)}`,
      id: getEntityId(child),
    })),
  }));
};

export const findCategoryByName = (categories, name) => {
  const normalized = (name || '').toLowerCase().trim();
  if (!normalized) return null;
  const walk = (nodes) => {
    for (const node of nodes) {
      const nodeName = (node.name || '').toLowerCase().trim();
      if (nodeName === normalized || nodeName.includes(normalized) || normalized.includes(nodeName)) return node;
      if (node.children?.length) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(extractList(categories));
};

export const mapWishlistItem = (product, fallbackImage = '') => mapProductForCard(product, fallbackImage);

export const mapCoupon = (coupon) => ({
  code: coupon.code,
  discount:
    coupon.type === 'percentage'
      ? `${coupon.value}% OFF`
      : coupon.type === 'flat'
        ? `₹${coupon.value} OFF`
        : coupon.discount || `${coupon.value} OFF`,
  desc: coupon.description || coupon.desc || '',
  minOrder: coupon.minOrderAmount ? `₹${formatDisplayPrice(coupon.minOrderAmount)}` : coupon.minOrder || '',
  expiry: coupon.expiresAt
    ? `Valid till ${new Date(coupon.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : coupon.expiry || '',
});

export const mapReview = (review) => ({
  id: getEntityId(review),
  product: review.productTitle || review.product?.title || review.productName || 'Product',
  rating: review.rating ?? 0,
  comment: review.body || review.comment || review.text || '',
  title: review.title || '',
  date: review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : review.date || '',
  likes: review.likes ?? review.helpfulCount ?? 0,
  userName: review.userName || review.user?.name || 'Customer',
});

export const mapQuestion = (q) => ({
  id: getEntityId(q),
  product: q.productTitle || q.product?.title || q.productName || 'Product',
  question: q.question || q.text || '',
  answer: q.answer || q.answers?.[0]?.text || null,
  status: q.answer || q.answers?.length ? 'Answered' : 'Pending',
  date: q.createdAt
    ? new Date(q.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : q.date || '',
});

export const mapWalletTransaction = (tx) => ({
  id: getEntityId(tx),
  title: tx.description || tx.referenceType || 'Transaction',
  name: tx.description,
  date: tx.createdAt
    ? new Date(tx.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '',
  amount: `${tx.type === 'credit' || tx.amount > 0 ? '+' : '-'} ₹${formatDisplayPrice(Math.abs(tx.amount))}`,
  type: tx.type || (tx.amount >= 0 ? 'credit' : 'debit'),
});

export const mapDealsProducts = (dealsData) => {
  const deals = extractList(dealsData);
  const products = [];

  deals.forEach((deal) => {
    const saleProducts = deal.products || [];
    saleProducts.forEach((sp) => {
      const product = sp.product || sp;
      products.push(
        mapProductForCard({
          ...product,
          price: sp.salePrice ?? product.price,
          label: deal.sale?.title || 'Limited time deal',
        })
      );
    });
  });

  return products;
};

export const mapOffers = (offersData) => {
  const featured = extractList(offersData?.featuredProducts || offersData?.products);
  return featured.map((p) => mapProductForCard(p));
};

export const mapStorefrontSections = (homeData, fallbackSections = {}) => {
  const sections = homeData?.sections || [];
  const result = { ...fallbackSections };

  const sectionMap = {
    'trending-this-week': 'trendingThisWeek',
    'todays-special-deals': 'todaysSpecialDeals',
    'top-selection': 'topSelection',
    'brands-in-spotlight': 'brandsSpotlight',
    spotlight: 'brandsSpotlight',
    'best-quality-guaranteed': 'bestQualityGuaranteed',
    'best-quality': 'bestQualityGuaranteed',
    'still-looking': 'stillLooking',
    'keep-shopping': 'keepShopping',
  };

  sections.forEach((section) => {
    const key = sectionMap[section.key];
    if (!key || !section.products?.length) return;

    const mappedProducts = section.products.map((product, index) => {
      const img = getProductImage(product);
      const id = getEntityId(product);
      const link = `/vendor/product-detail`;

      if (key === 'stillLooking' || key === 'keepShopping' || key === 'trendingThisWeek' || key === 'todaysSpecialDeals') {
        return {
          id,
          label: product.title || product.name || section.title,
          name: product.title || product.name || section.title,
          title: product.title || product.name || section.title,
          img,
          price: product.price,
          mrp: product.mrp,
          brand: product.brand,
          link,
          product,
        };
      }

      if (key === 'brandsSpotlight') {
        const discountLabel = product.mrp && product.price && product.mrp > product.price
          ? `${Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF`
          : 'SPECIAL';
        return {
          id,
          title: discountLabel,
          sub: product.title || product.name || product.brand || 'Featured',
          brand: product.brand || 'Spotlight',
          img,
          price: product.price,
          mrp: product.mrp,
          link,
          product,
        };
      }

      return {
        id,
        name: product.title || product.name,
        title: product.title || product.name,
        tag: section.title || ['Grab Or Gone', 'Best Picks', 'Popular', 'Widest Range'][index % 4],
        img,
        price: product.price,
        mrp: product.mrp,
        brand: product.brand,
        link,
        product,
      };
    });

    result[key] = result[key]?.length ? result[key] : mappedProducts;
  });

  return result;
};

export const mapHomeBanners = () => {
  return [
    { id: 'g1', image: '/Gemini_Generated_Image_pxcb6vpxcb6vpxcb.png', title: 'Shop More Save More' },
    { id: 'g2', image: '/Gemini_Generated_Image_rhy76srhy76srhy7.png', title: 'Authentic Mithila Artistry' },
    { id: 'g3', image: '/Gemini_Generated_Image_unwuxnunwuxnunwu.png', title: 'Cultural Heritage Collection' },
    { id: 'g4', image: '/Gemini_Generated_Image_xaqtwqxaqtwqxaqt.png', title: 'Special Festival Handicrafts' }
  ];
};

const SHOP_DISPLAY_NAMES = {
  Beauty: 'Beauty & Care',
  Gifting: 'Gifts & Hampers',
  Electronics: 'Smart Gadgets',
  Jewellery: 'Art Jewellery',
  Toys: 'Toys & Games',
  Stationery: 'Office & Books',
  Fashion: 'Trendy Fashion',
  Electrical: 'Electricals',
};

const NAV_CHIP_ICON_KEYS = {
  'You Buy': 'for-you',
  Beauty: 'beauty',
  Gifting: 'gifting',
  Electronics: 'electronics',
  Jewellery: 'jewellery',
  Toys: 'toys',
  Stationery: 'stationery',
  Fashion: 'fashion',
  Electrical: 'electrical',
};

export const mapNavChips = (chips, fallback = []) => {
  const list = extractList(chips);
  if (!list.length) return fallback;

  return list.map((chip) => ({
    id: NAV_CHIP_ICON_KEYS[chip.label] || slugifyLabel(chip.label),
    label: chip.label,
    categoryId: chip.categoryId,
    imageUrl: chip.imageUrl,
  }));
};

const slugifyLabel = (label) =>
  String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const mapShopCategoryCards = (categories) => {
  const list = extractList(categories);
  if (!list.length) return [];

  return list
    .filter((cat) => cat.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((cat, index) => {
      const rawImg = cat.imageUrl || cat.iconUrl || cat.image;
      const img = rawImg ? getImageUrl(rawImg) : '';
      return {
        id: getEntityId(cat),
        name: SHOP_DISPLAY_NAMES[cat.name] || cat.name,
        img,
        path:
          cat.name === 'Toys'
            ? '/vendor/toys'
            : `/vendor/category-products?category=${encodeURIComponent(cat.name)}`,
        hasImage: Boolean(img) || index < 4,
      };
    });
};

export const mapMithilaCategoryCards = (categories) => {
  const list = extractList(categories);
  const parent = list.find((cat) => cat.slug === 'mithila-specialities') || list[0];
  const children = parent?.children || [];

  return children.map((cat) => ({
    id: getEntityId(cat),
    name: cat.name,
    img: cat.imageUrl || cat.iconUrl || '',
    path: `/vendor/mithilak/category?category=${encodeURIComponent(cat.name)}`,
  }));
};

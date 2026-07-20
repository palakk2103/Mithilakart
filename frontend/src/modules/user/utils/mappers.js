import { parsePrice } from '../../../shared/utils/priceFormatter';

export const extractList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.coupons)) return data.coupons;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const getEntityId = (entity) => entity?.id || entity?._id || '';

export const getProductImage = (product, fallback = '') => {
  if (product?.image) return product.image;
  if (product?.img) return product.img;
  if (product?.imageUrl) return product.imageUrl;
  if (Array.isArray(product?.images) && product.images.length > 0) {
    const first = product.images[0];
    return typeof first === 'string' ? first : first?.url || fallback;
  }
  return fallback;
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
  const id = getEntityId(product);
  const price = product.price ?? product.salePrice ?? 0;
  const mrp = product.mrp ?? product.oldPrice ?? product.mrp;

  return {
    id,
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
    delivery: product.delivery || 'Tomorrow',
    stock: product.stock,
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
  const items = (data?.items || order?.items || []).map((item) => ({
    id: getEntityId(item),
    name: item.name || item.title || 'Product',
    price: formatDisplayPrice(item.unitPrice ?? item.lineTotal ?? item.price),
    oldPrice: item.mrp ? formatDisplayPrice(item.mrp) : undefined,
    image: getProductImage(item),
    quantity: item.quantity ?? 1,
  }));

  return {
    id: order.orderNumber || getEntityId(order),
    orderNumber: order.orderNumber || getEntityId(order),
    status: order.status || 'Pending',
    date: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '',
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
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
  const normalized = (name || '').toLowerCase();
  const walk = (nodes) => {
    for (const node of nodes) {
      if ((node.name || '').toLowerCase() === normalized) return node;
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
  comment: review.comment || review.text || '',
  date: review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : review.date || '',
  likes: review.likes ?? review.helpfulCount ?? 0,
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
    'still-looking': 'stillLooking',
    'top-selection': 'topSelection',
    spotlight: 'brandsSpotlight',
    'best-quality': 'bestQuality',
    'keep-shopping': 'keepShopping',
  };

  sections.forEach((section) => {
    const key = sectionMap[section.key];
    if (!key || !section.products?.length) return;

    result[key] = section.products.map((product, index) => {
      const img = getProductImage(product);
      const id = getEntityId(product);
      const link = `/vendor/product-detail`;

      if (key === 'stillLooking' || key === 'keepShopping') {
        return {
          id,
          label: product.title || product.name || section.title,
          img,
          link,
          product,
        };
      }

      if (key === 'brandsSpotlight') {
        return {
          id,
          title: product.title || product.name,
          sub: product.brand || section.title || 'Shop now',
          img,
          link,
          product,
        };
      }

      return {
        id,
        name: product.title || product.name,
        tag: section.title || ['Grab Or Gone', 'Best Picks', 'Popular', 'Widest Range'][index % 4],
        img,
        link,
        product,
      };
    });
  });

  return result;
};

export const mapHomeBanners = (banners, fallbackBanners = []) => {
  const list = extractList(banners);
  if (!list.length) return fallbackBanners;

  return list.map((banner, index) => ({
    id: getEntityId(banner) || index,
    image: banner.imageUrl || banner.image,
    title: banner.title || '',
    link: banner.linkUrl,
  }));
};

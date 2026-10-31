import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Share2, ChevronDown, Heart, Check, X, Sparkles, Clock, Star, Zap } from 'lucide-react';
import { formatPrice, parsePrice } from '../../../shared/utils/priceFormatter';
import closedShutter from '../../../assets/closed_shutter.png';
import { getCategories, getCategoryProducts, getNearbyProducts } from '../services/catalogApi';
import { useLocation as useLiveLocation } from '../../../shared/context/LocationContext';
import { formatLocationLabel } from '../../../shared/services/locationService';
import { extractList, mapProductForCard } from '../utils/mappers';
import { getImageUrl } from '../../../shared/utils/imageUtils';
import { addProductToCart } from '../utils/cartUtils';
import useTabTheme from '../../../shared/hooks/useTabTheme';
import useAccountStore from '../../../store/useAccountStore';

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="%23fdfbf7" rx="12"/><text x="75" y="80" font-size="12" font-family="sans-serif" font-weight="bold" fill="%23d3a075" text-anchor="middle">Mithilakart</text></svg>`;

const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = FALLBACK_IMAGE;
};


const EMPTY_CATEGORY = {
  id: 'empty',
  name: '',
  subCategories: [{ id: 'all', name: 'All', icon: FALLBACK_IMAGE }]
};

const getCategoryData = () => EMPTY_CATEGORY;

/**
 * Find the clicked category in the tab's tree: by id first, then by exact
 * (case-insensitive) name, then by a loose name match for old links.
 */
const locateCategory = (tree, id, name) => {
  const all = [];
  const walk = (nodes, parent) => nodes.forEach((node) => {
    all.push({ node, parent });
    walk(node.children || [], node);
  });
  walk(tree, null);

  const wanted = (name || '').toLowerCase().trim();
  return (id && all.find(({ node }) => String(node.id) === String(id)))
    || (wanted && all.find(({ node }) => node.name.toLowerCase().trim() === wanted))
    || (wanted && all.find(({ node }) => {
      const n = node.name.toLowerCase();
      return n.includes(wanted) || wanted.includes(n);
    }))
    || { node: null, parent: null };
};

/**
 * Sidebar = the root's direct children (level 2), always. Level 3 children are
 * never promoted into the sidebar: they render as tabs on the right once their
 * level-2 parent is selected. Do NOT unwrap/flatten the tree here - that is what
 * used to replace level 2 with level 3 whenever a category had one child or all
 * of its children had children.
 */
const resolveSidebarSubcategories = (root) => (root?.children || []);

/** Path of nodes from a top-level root down to the node with `id`. */
const findPath = (nodes, id, trail = []) => {
  for (const n of nodes || []) {
    const next = [...trail, n];
    if (String(n.id) === String(id)) return next;
    const found = findPath(n.children, id, next);
    if (found) return found;
  }
  return null;
};

/** categoryId ΓåÆ id of the sidebar subcategory it belongs to (any depth). */
const mapToSidebarIds = (root, sidebarSubcategories = []) => {
  const owner = new Map();
  const walk = (node, sidebarId) => {
    owner.set(String(node.id), sidebarId);
    (node.children || []).forEach((child) => walk(child, sidebarId));
  };
  (sidebarSubcategories || []).forEach((child) => walk(child, String(child.id)));
  return owner;
};

const mapCategoryTree = (child, cards = []) => {
  let icon = child.imageUrl && !child.imageUrl.includes('placeholder')
    ? getImageUrl(child.imageUrl)
    : (child.iconUrl ? getImageUrl(child.iconUrl) : null);
  if (!icon) {
    const match = cards.find((c) => String(c.categoryId) === String(child.id) || String(c.category) === String(child.id));
    icon = match?.img || FALLBACK_IMAGE;
  }
  return {
    id: String(child.id || child._id),
    name: child.name,
    icon,
    parentId: child.parentId ? String(child.parentId) : null,
    children: (child.children || []).map((grandChild) => mapCategoryTree(grandChild, cards)),
  };
};

const findNodeById = (nodes, id) => {
  if (!nodes || !id) return null;
  for (const n of nodes) {
    if (String(n.id) === String(id)) return n;
    if (n.children && n.children.length > 0) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
};

const getDescendantIdSet = (node) => {
  if (!node) return new Set();
  const ids = new Set([String(node.id)]);
  const walk = (n) => {
    (n.children || []).forEach((c) => {
      ids.add(String(c.id));
      walk(c);
    });
  };
  walk(node);
  return ids;
};

const QuickShopSubcategory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTabTheme();
  const isMithilakFlow = theme.activeFlow === 'mithilak' || location.pathname.includes('/mithilak');
  const isFreshGroceryFlow = theme.activeFlow === 'freshgrocery' || location.pathname.includes('/fresh-grocery');
  const isQuickShopFlow = !isMithilakFlow && !isFreshGroceryFlow;

  const requestedName = location.state?.category || (
    isMithilakFlow 
      ? 'Mithila Special Cuisines' 
      : isFreshGroceryFlow 
        ? 'Fruits & Vegetables' 
        : 'Chips & Namkeens'
  );
  const requestedId = location.state?.categoryId || null;
  const [categoryName, setCategoryName] = useState(requestedName);

  const isClosed = React.useMemo(() => {
    const force = localStorage.getItem('forceShopClosed');
    if (force === 'true') return true;
    if (force === 'false') return false;
    
    const now = new Date();
    const hours = now.getHours();
    return hours >= 0 && hours < 6;
  }, []);
  
  const primaryText = theme.primaryText;
  const primaryBg = isFreshGroceryFlow ? 'bg-[#D9A21B]' : isMithilakFlow ? 'bg-[#207C8A]' : 'bg-[#F26522]';
  const primaryBgHover = isFreshGroceryFlow ? 'hover:bg-[#FFF8EE] bg-white' : isMithilakFlow ? 'hover:bg-[#F5F9FA] bg-white' : 'hover:bg-orange-50 bg-white';
  const primaryBorder = isFreshGroceryFlow ? 'border-[#D9A21B]' : isMithilakFlow ? 'border-[#207C8A]' : 'border-[#F26522]';
  const primaryBorderLight = isFreshGroceryFlow ? 'border-[#D9A21B]/30' : isMithilakFlow ? 'border-[#207C8A]/30' : 'border-[#F26522]/30';
  const primaryLightBg = isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isMithilakFlow ? 'bg-[#F5F9FA]' : 'bg-orange-50';
  const primarySidebarAccent = isFreshGroceryFlow ? 'bg-[#D9A21B]' : isMithilakFlow ? 'bg-[#207C8A]' : 'bg-[#F26522]';
  
  const rightGridBg = isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isMithilakFlow ? 'bg-[#F5F9FA]/30' : 'bg-orange-50/15';
  const promoBg = isFreshGroceryFlow ? 'bg-[#FFF8EE] border border-[#D9A21B]/25' : isMithilakFlow ? 'bg-[#F5F9FA] border border-[#207C8A]/25' : 'bg-[#FFF5EE] border border-[#FFD9C7]/40';

  const [subCategories, setSubCategories] = useState([{ id: 'all', name: 'All', icon: FALLBACK_IMAGE, children: [] }]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notDeliverable, setNotDeliverable] = useState(false);

  const { location: liveLocation, setPromptOpen } = useLiveLocation();
  const { savedAddresses, selectedAddressId } = useAccountStore();
  const selectedAddr = savedAddresses?.find((a) => a.id === selectedAddressId) || savedAddresses?.[0];
  const effectiveLat = liveLocation?.latitude ?? selectedAddr?.latitude ?? 28.5385859;
  const effectiveLng = liveLocation?.longitude ?? selectedAddr?.longitude ?? 77.1182734;

  const deliverLabel = formatLocationLabel(liveLocation || { address: selectedAddr?.address || 'Rangpuri-Mahipalpur, New Delhi' });

  const marketplaceTab = isFreshGroceryFlow ? 'groceries_fresh' : isMithilakFlow ? 'mithilak' : 'quick_shop';
  const commerceFlow = isFreshGroceryFlow ? 'fresh_grocery' : isMithilakFlow ? 'mithilak' : 'quick_shop';
  const [activeSub, setActiveSub] = useState('all');
  const [visibleCount, setVisibleCount] = useState(12);
  const rightGridRef = useRef(null);
  const sentinelRef = useRef(null);

  // Filter, Sort, and Type States
  const [openModal, setOpenModal] = useState(null); // 'filter' | 'sort' | 'type' | null
  const [sortBy, setSortBy] = useState('relevance');
  const [filterType, setFilterType] = useState('all');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterDiscountOnly, setFilterDiscountOnly] = useState(false);

  // Temporary state for filter modal
  const [tempPriceMin, setTempPriceMin] = useState('');
  const [tempPriceMax, setTempPriceMax] = useState('');
  const [tempFastDelivery, setTempFastDelivery] = useState(false);
  const [tempInStock, setTempInStock] = useState(false);
  const [tempDiscountOnly, setTempDiscountOnly] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPriceMin !== '' || filterPriceMax !== '') count++;
    if (filterFastDelivery) count++;
    if (filterInStock) count++;
    if (filterDiscountOnly) count++;
    return count;
  }, [filterPriceMin, filterPriceMax, filterFastDelivery, filterInStock, filterDiscountOnly]);

  const hasActiveFilters = activeFilterCount > 0;

  const isAnyFilterOrSortActive = Boolean(
    sortBy !== 'relevance' ||
    filterType !== 'all' ||
    hasActiveFilters
  );

  const sortLabel = useMemo(() => {
    switch (sortBy) {
      case 'price_asc': return 'Low to High';
      case 'price_desc': return 'High to Low';
      case 'delivery': return 'Fast Delivery';
      case 'rating': return 'Top Rated';
      default: return 'Relevance';
    }
  }, [sortBy]);

  const typeLabel = useMemo(() => {
    if (filterType === 'all') return 'All';
    if (filterType === 'veg') return 'Pure Veg';
    if (filterType === 'fresh') return 'Fresh';
    if (filterType === 'organic') return 'Organic';
    if (filterType === 'deals') return 'Offers';
    const match = subCategories.find(s => s.id === filterType);
    return match ? match.name : filterType;
  }, [filterType, subCategories]);

  const resetAllFilters = () => {
    setSortBy('relevance');
    setFilterType('all');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterFastDelivery(false);
    setFilterInStock(false);
    setFilterDiscountOnly(false);
    setOpenModal(null);
  };

  useEffect(() => {
    setVisibleCount(12);
    if (rightGridRef.current) {
      rightGridRef.current.scrollTop = 0;
    }
  }, [activeSub, categoryName, sortBy, filterType, filterPriceMin, filterPriceMax, filterFastDelivery, filterInStock, filterDiscountOnly]);

  // The tab's category tree doesn't depend on location ΓÇö fetch it once per tab.
  const treeCacheRef = useRef({ tab: null, tree: null });
  // Category whose products are on screen; when only the live location
  // changes we refresh products in place instead of blanking the page.
  const loadedKeyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const loadKey = `${marketplaceTab}|${requestedId || requestedName}`;
    const isRefresh = loadedKeyRef.current === loadKey;

    const toCard = (p, sidebarIdOf, fromNearby) => {
      const card = mapProductForCard(p);
      const categoryId = String(p.categoryId ?? p.product?.categoryId ?? '');
      return {
        id: card.id,
        name: card.name,
        img: card.image,
        brand: card.brand || (fromNearby ? 'Nearby Seller' : 'Mithila Brand'),
        weight: p.distanceKm != null ? `${p.distanceKm.toFixed(1)} km away` : '1 Unit',
        price: card.rawPrice != null ? card.rawPrice : parsePrice(card.price),
        oldPrice: card.rawMrp != null ? card.rawMrp : (card.oldPrice || card.mrp ? parsePrice(card.oldPrice || card.mrp) : undefined),
        eta: p.deliveryPromiseMinutes
          ? `${p.deliveryPromiseMinutes} mins`
          : (p.distanceKm != null ? `${Math.max(10, Math.round(p.distanceKm * 4))} mins` : 'Same day'),
        tags: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags : [fromNearby ? 'Nearby' : 'Fresh'],
        // Sidebar id this product falls under; 'all' when it sits on the parent itself.
        category: sidebarIdOf.get(categoryId) || 'all',
        categoryId,
        rating: Number(card.rating) || Number(p.rating) || 0,
        reviewCount: card.reviewCount || p.reviewCount || 0,
        stock: p.stock ?? card.stock,
        deliveryPromiseMinutes: p.deliveryPromiseMinutes || (p.distanceKm != null ? Math.max(10, Math.round(p.distanceKm * 4)) : 20),
        isOrganic: Boolean(p.isOrganic || (p.tags && p.tags.includes('organic')) || (card.name && /organic/i.test(card.name))),
        isVeg: Boolean(p.isVeg || p.veg || (p.tags && p.tags.some(t => /veg/i.test(t))) || (card.name && /veg/i.test(card.name))),
      };
    };

    const load = async () => {
      if (!isRefresh) {
        setLoading(true);
        setNotDeliverable(false);
      }
      try {
        let tree = treeCacheRef.current.tab === marketplaceTab ? treeCacheRef.current.tree : null;
        if (!tree) {
          tree = extractList(await getCategories({ marketplaceTab }));
          treeCacheRef.current = { tab: marketplaceTab, tree };
        }
        let { node, parent } = locateCategory(tree, requestedId, requestedName);
        if (!node && tree && tree.length > 0) {
          node = tree[0];
          parent = null;
        }
        if (!node) {
          if (!cancelled) {
            setSubCategories([{ id: 'all', name: 'All', icon: FALLBACK_IMAGE, children: [] }]);
            setProductsList([]);
          }
          return;
        }

        // The user clicked this specific category (e.g. Fresh Vegetables).
        // That category is the root of this screen. Its children are its subcategories in the sidebar.
        // Hierarchy is fixed: root (level 1) -> sidebar (level 2) -> tabs (level 3).
        // Resolve the level-1 ancestor of whatever was clicked so a level-2/3 link
        // can never turn a deeper level into the sidebar.
        const pathToNode = findPath(tree, node.id) || [node];
        const root = (location.state?.isSubcategory && pathToNode.length > 1) ? pathToNode[0] : node;
        const sidebarSubcategories = resolveSidebarSubcategories(root);
        const sidebarIdOf = mapToSidebarIds(root, sidebarSubcategories);

        let initialActive = 'all';
        if (location.state?.subCategoryId && findNodeById(sidebarSubcategories, location.state.subCategoryId)) {
          initialActive = String(location.state.subCategoryId);
        } else if (location.state?.isSubcategory && root !== node && findNodeById(sidebarSubcategories, node.id)) {
          initialActive = String(node.id);
        }

        if (!cancelled && !isRefresh) {
          setCategoryName(root.name);
          setSubCategories([
            { id: 'all', name: 'All', icon: getImageUrl(root.imageUrl || root.iconUrl || FALLBACK_IMAGE), children: [] },
            ...sidebarSubcategories.map((child) => mapCategoryTree(child)),
          ]);
          setActiveSub(initialActive);
        }

        // 2. Products of the whole category subtree: nearby sellers first for
        //    quick commerce, then the tab's catalog so the screen is never empty.
        let items = [];
        let fromNearby = false;
        let undeliverable = false;
        if (!isMithilakFlow) {
          try {
            const nearby = await getNearbyProducts({
              lat: effectiveLat,
              lng: effectiveLng,
              commerceFlow,
              categoryId: String(root.id),
              limit: 100,
            });
            const payload = nearby?.data ?? nearby;
            items = extractList(payload);
            fromNearby = items.length > 0;
            undeliverable = payload?.deliverable === false && items.length === 0;
          } catch {
            items = [];
          }
        }
        if (!items.length) {
          items = extractList(await getCategoryProducts(String(root.id), { marketplaceTab, limit: 100 }));
        }

        if (!cancelled) {
          const cards = items.map((p) => toCard(p, sidebarIdOf, fromNearby));
          setProductsList(cards);
          setNotDeliverable(undeliverable && items.length === 0);
          loadedKeyRef.current = loadKey;

          // Update any subcategory placeholder icons with matching product images
          if (!isRefresh && sidebarSubcategories.length > 0) {
            setSubCategories([
              { id: 'all', name: 'All', icon: getImageUrl(root.imageUrl || root.iconUrl || FALLBACK_IMAGE), children: [] },
              ...sidebarSubcategories.map((child) => mapCategoryTree(child, cards)),
            ]);
          }
        }
      } catch {
        // A failed background refresh keeps what is already on screen.
        if (!cancelled && !isRefresh) {
          setSubCategories([{ id: 'all', name: 'All', icon: FALLBACK_IMAGE, children: [] }]);
          setProductsList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedId, requestedName, marketplaceTab, liveLocation?.latitude, liveLocation?.longitude]);

  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleProductClick = (product) => {
    const discountPct = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) + '% OFF';
    navigate('/vendor/product-detail', {
      state: {
        product: {
          ...product,
          image: product.img,
          discount: discountPct,
          rating: 4.5,
          ratingCount: 42,
          category: categoryName
        }
      }
    });
  };

  const activeNode = React.useMemo(() => {
    if (activeSub === 'all') return null;
    return findNodeById(subCategories, activeSub);
  }, [activeSub, subCategories]);

  const parentNode = React.useMemo(() => {
    if (!activeNode || activeSub === 'all') return null;
    for (const sub of subCategories) {
      if (sub.id === 'all') continue;
      if (sub.children && sub.children.some((c) => String(c.id) === String(activeNode.id))) {
        return sub;
      }
      const found = findNodeById(sub.children || [], activeNode.id);
      if (found) return sub;
    }
    return null;
  }, [activeNode, subCategories]);

  const siblingPills = React.useMemo(() => {
    if (parentNode && parentNode.children && parentNode.children.length > 0) {
      return { parent: parentNode, items: parentNode.children };
    }
    if (activeNode && activeNode.children && activeNode.children.length > 0) {
      return { parent: activeNode, items: activeNode.children };
    }
    return null;
  }, [parentNode, activeNode]);

  const isSidebarActive = (sub) => {
    if (sub.id === 'all') return activeSub === 'all';
    if (activeSub === sub.id) return true;
    const descendantIds = getDescendantIdSet(sub);
    return descendantIds.has(String(activeSub));
  };

  const isAllItems = Boolean(
    activeSub === 'all' ||
    (siblingPills && String(activeSub) === String(siblingPills.parent.id))
  );

  const currentSubcategoriesToShow = React.useMemo(() => {
    if (isAnyFilterOrSortActive) {
      return [];
    }
    if (activeSub === 'all') {
      return subCategories.filter((s) => s.id !== 'all');
    }
    return [];
  }, [activeSub, subCategories, isAnyFilterOrSortActive]);

  const filteredProducts = React.useMemo(() => {
    let list = [...productsList];

    // 1. Subcategory filter
    if (activeSub !== 'all') {
      const node = activeNode || findNodeById(subCategories, activeSub);
      const subName = (node?.name || subCategories.find((s) => String(s.id) === String(activeSub))?.name || '').toLowerCase();
      const keywords = subName
        ? subName.split(/[,&\s]+/).map((w) => w.trim().toLowerCase()).filter((w) => w.length > 2)
        : [];

      if (!node) {
        list = list.filter((p) => {
          if (String(p.category) === String(activeSub) || String(p.categoryId) === String(activeSub)) return true;
          if (keywords.length > 0) {
            const title = (p.name || '').toLowerCase();
            return keywords.some((k) => title.includes(k));
          }
          return false;
        });
      } else {
        const descendantIds = getDescendantIdSet(node);
        const parentId = parentNode ? String(parentNode.id) : null;
        list = list.filter((p) => {
          if (descendantIds.has(String(p.categoryId)) || descendantIds.has(String(p.category))) return true;
          if (keywords.length > 0 && (p.category === 'all' || (parentId && String(p.category) === parentId) || !descendantIds.size)) {
            const title = (p.name || '').toLowerCase();
            return keywords.some((k) => title.includes(k));
          }
          return false;
        });
      }
    }

    // 2. Type filter
    if (filterType !== 'all') {
      if (filterType === 'veg') {
        list = list.filter((p) => p.isVeg);
      } else if (filterType === 'organic') {
        list = list.filter((p) => p.isOrganic || /organic/i.test(p.name || ''));
      } else if (filterType === 'fresh') {
        list = list.filter((p) => (p.tags && p.tags.includes('Fresh')) || /fresh/i.test(p.name || ''));
      } else if (filterType === 'deals') {
        list = list.filter((p) => p.oldPrice && p.oldPrice > p.price);
      } else {
        // match specific subcategory selected in Type dropdown
        const matchSub = subCategories.find((s) => s.id === filterType || s.name.toLowerCase() === filterType.toLowerCase());
        if (matchSub) {
          const subId = matchSub.id;
          const subKeywords = matchSub.name.toLowerCase().split(/[,&\s]+/).filter(w => w.length > 2);
          list = list.filter((p) => {
            if (String(p.category) === String(subId) || String(p.categoryId) === String(subId)) return true;
            return subKeywords.some((k) => (p.name || '').toLowerCase().includes(k));
          });
        }
      }
    }

    // 3. Price Filter
    if (filterPriceMin !== '' && !isNaN(Number(filterPriceMin))) {
      list = list.filter((p) => p.price >= Number(filterPriceMin));
    }
    if (filterPriceMax !== '' && !isNaN(Number(filterPriceMax))) {
      list = list.filter((p) => p.price <= Number(filterPriceMax));
    }

    // 4. Fast Delivery filter
    if (filterFastDelivery) {
      list = list.filter((p) => (p.deliveryPromiseMinutes || 999) <= 30);
    }

    // 5. In Stock filter
    if (filterInStock) {
      list = list.filter((p) => p.stock === undefined || p.stock > 0);
    }

    // 6. Discount only filter
    if (filterDiscountOnly) {
      list = list.filter((p) => p.oldPrice && p.oldPrice > p.price);
    }

    // 7. Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'delivery') {
      list.sort((a, b) => (a.deliveryPromiseMinutes || 99) - (b.deliveryPromiseMinutes || 99));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [
    activeSub, activeNode, subCategories, productsList,
    sortBy, filterType, filterPriceMin, filterPriceMax,
    filterFastDelivery, filterInStock, filterDiscountOnly
  ]);

  const visibleProducts = React.useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleGridScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      setVisibleCount((prev) => {
        if (prev < filteredProducts.length) {
          return Math.min(prev + 12, filteredProducts.length);
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => {
            if (prev < filteredProducts.length) {
              return Math.min(prev + 12, filteredProducts.length);
            }
            return prev;
          });
        }
      },
      {
        root: rightGridRef.current,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredProducts.length, visibleCount]);

  const getCategoryProductCount = (node) => {
    if (!node) return 0;
    const descendantIds = getDescendantIdSet(node);
    const subName = (node.name || '').toLowerCase();
    const keywords = subName
      ? subName.split(/[,&\s]+/).map((w) => w.trim().toLowerCase()).filter((w) => w.length > 2)
      : [];
    return productsList.filter((p) => {
      if (descendantIds.has(String(p.categoryId)) || descendantIds.has(String(p.category))) return true;
      if (keywords.length > 0 && (p.category === 'all' || !descendantIds.size)) {
        const title = (p.name || '').toLowerCase();
        return keywords.some((k) => title.includes(k));
      }
      return false;
    }).length;
  };

  const isQuickShopHeader = !isFreshGroceryFlow && !isMithilakFlow;

  return (
    <div className={`h-full flex-1 flex flex-col font-sans select-none transition-colors duration-300 relative overflow-hidden ${
      isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isMithilakFlow ? 'bg-[#F5F9FA]' : 'bg-white'
    }`}>
      
      {/* Repeating Mithila Art Page Background Texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-repeat opacity-[0.03] select-none"
        style={{
          backgroundImage: "url('/Screenshot 2026-07-17 130906.png')",
          backgroundSize: '360px',
        }}
      />

      {/* Header Bar */}
      <div className={`flex-shrink-0 z-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between shadow-3xs transition-colors duration-300 ${
        isFreshGroceryFlow ? 'bg-[#D9A21B] text-white' : isMithilakFlow ? 'bg-[#207C8A] text-white' : 'bg-[#F26522] text-white'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 active:scale-95 transition-transform text-white"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold leading-tight text-white">
              {categoryName}
            </h1>
            <button
              type="button"
              onClick={() => setPromptOpen(true)}
              className="text-[10px] font-bold flex items-center gap-0.5 text-white/95"
            >
              Delivering to : <span className="font-medium truncate max-w-[150px] text-white/80">{deliverLabel}</span>
              <ChevronDown size={10} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full text-white hover:bg-white/10">
            <Search size={20} strokeWidth={2.2} />
          </button>
          <button className="p-2 rounded-full text-white hover:bg-white/10">
            <Share2 size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Closed Banner */}
      {isClosed && (
        <div className="relative mx-4 my-3 rounded-[20px] overflow-hidden bg-gradient-to-b from-[#0b0c1e] via-[#151833] to-[#251b45] p-5 text-center shadow-lg border border-white/5 flex flex-col items-center min-h-[440px]">
          {/* Night Sky Background Components */}
          {/* Glowing Radial Moon Backdrop */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
          
          {/* Clouds Layer - Behind Moon */}
          <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden select-none">
            <svg className="absolute -top-5 -left-10 w-48 h-24 text-purple-300/40 animate-cloud-slow" fill="currentColor" viewBox="0 0 100 100">
              <path d="M10 50 C20 40, 40 40, 50 50 C60 40, 80 40, 90 50 C95 55, 95 65, 90 70 C80 80, 20 80, 10 70 C5 65, 5 55, 10 50 Z" />
            </svg>
            <svg className="absolute bottom-5 -right-10 w-56 h-28 text-blue-300/30 animate-cloud-slower" fill="currentColor" viewBox="0 0 100 100">
              <path d="M10 50 C20 40, 40 40, 50 50 C60 40, 80 40, 90 50 C95 55, 95 65, 90 70 C80 80, 20 80, 10 70 C5 65, 5 55, 10 50 Z" />
            </svg>
          </div>

          {/* Twinkling Stars */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Small Stars */}
            <div className="absolute top-6 left-[12%] w-1 bg-white rounded-full animate-twinkle-s1" style={{ height: '4px', width: '4px' }} />
            <div className="absolute top-16 left-[75%] w-1.5 h-1.5 bg-white rounded-full animate-twinkle-s2" />
            <div className="absolute top-32 left-[10%] w-1 h-1 bg-white rounded-full animate-twinkle-s3" />
            <div className="absolute top-12 left-[60%] w-1 h-1 bg-white rounded-full animate-twinkle-s4" />
            <div className="absolute top-26 left-[68%] w-1.5 h-1.5 bg-white rounded-full animate-twinkle-s5" />
            <div className="absolute bottom-28 left-[18%] w-1 h-1 bg-white rounded-full animate-twinkle-s2" />
            <div className="absolute bottom-32 right-[12%] w-1.5 h-1.5 bg-white rounded-full animate-twinkle-s4" />
            
            {/* Larger 4-Point Stars */}
            <svg className="absolute top-10 right-[22%] w-3 h-3 text-amber-100/80 animate-twinkle-s3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
            </svg>
            <svg className="absolute top-28 left-[22%] w-3.5 h-3.5 text-amber-200/90 animate-twinkle-s1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
            </svg>
          </div>

          {/* Floating Clouds Layer - Foreground / Midground */}
          <div className="absolute top-[40%] inset-x-0 h-32 pointer-events-none overflow-hidden select-none z-10 opacity-80">
            <svg className="absolute top-0 -left-8 w-44 h-16 text-purple-900/40 blur-[1px]" fill="currentColor" viewBox="0 0 100 100">
              <path d="M10 60 C20 45, 45 45, 55 60 C65 45, 85 45, 95 60 C100 65, 100 75, 95 85 C85 95, 15 95, 5 85 C0 75, 0 65, 5 60 Z" />
            </svg>
            <svg className="absolute top-2 -right-6 w-52 h-20 text-indigo-900/50 blur-[2px]" fill="currentColor" viewBox="0 0 100 100">
              <path d="M10 60 C20 45, 45 45, 55 60 C65 45, 85 45, 95 60 C100 65, 100 75, 95 85 C85 95, 15 95, 5 85 C0 75, 0 65, 5 60 Z" />
            </svg>
          </div>

          {/* Crescent Moon Container */}
          <div className="relative z-20 flex items-center justify-center pt-2 mb-4">
            <div className="relative">
              {/* Moon Glow effect */}
              <div className="absolute inset-0 bg-yellow-250/20 rounded-full blur-xl scale-150 animate-glow-pulse" />
              {/* Golden Symmetrical Crescent Arc Moon SVG */}
              <svg className="w-20 h-20 relative" viewBox="0 0 100 100" fill="currentColor">
                <defs>
                  <linearGradient id="moonArcGradSub" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="35%" stopColor="#fef08a" />
                    <stop offset="70%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  {/* Intense inner shadow/depth filter */}
                  <filter id="moonGlowShadowSub">
                    <feDropShadow dx="-1" dy="1" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
                  </filter>
                </defs>
                {/* A beautifully thick, clean, tilted crescent arc path */}
                <path 
                  d="M 68 18 
                     A 34 34 0 1 0 74 76 
                     A 30 30 0 1 1 68 18 Z" 
                  fill="url(#moonArcGradSub)" 
                  filter="url(#moonGlowShadowSub)"
                  className="drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                />
              </svg>
            </div>
          </div>

          {/* Header text exactly like reference */}
          <div className="relative z-20 space-y-1.5 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white font-montserrat">
              Closed for the day!
            </h2>
            <p className="text-[12px] font-medium text-slate-200/90 px-3">
              Our quick shop is currently closed.
            </p>
            <p className="text-[12px] font-medium text-slate-200/90">
              We'll be back at <span className="text-yellow-400 font-extrabold text-xs">6:00 AM</span>
            </p>
          </div>

          {/* Separate Premium Dark Alarm Countdown Card at the bottom */}
          <div className="relative z-20 w-full max-w-[300px] bg-[#0c0d21]/80 backdrop-blur-md rounded-2xl border border-white/5 p-4 shadow-xl flex flex-col items-center gap-3 mt-auto">
            <div className="w-full flex items-center justify-center gap-3 py-1.5 px-0.5">
              {/* Sleeping/Alarm Clock Icon on the left */}
              <div className="flex-shrink-0 text-indigo-400">
                <svg className="w-12 h-12 drop-shadow-[0_0_6px_rgba(129,140,248,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l1.414-1.414M5.636 18.364l-1.414 1.414M20.5 12h1M2.5 12h1M12 2.5v1M12 20.5v1" />
                </svg>
              </div>

              {/* Digital countdown timer on the right */}
              <div className="flex flex-col items-start gap-0.5">
                <div className="text-[10px] font-bold text-slate-400 tracking-wide">We open in</div>
                {(() => {
                  const [timeLeft, setTimeLeft] = React.useState({ h: '00', m: '00', s: '00' });
                  React.useEffect(() => {
                    const calculateTimeLeft = () => {
                      const now = new Date();
                      let target = new Date();
                      target.setHours(6, 0, 0, 0);
                      if (now.getHours() >= 6) {
                        target.setDate(target.getDate() + 1);
                      }
                      const diff = target.getTime() - now.getTime();
                      if (diff <= 0) {
                        return { h: '00', m: '00', s: '00' };
                      }
                      const hrs = Math.floor(diff / (1000 * 60 * 60));
                      const mins = Math.floor((diff / (1000 * 60)) % 60);
                      const secs = Math.floor((diff / 1000) % 60);
                      return {
                        h: String(hrs).padStart(2, '0'),
                        m: String(mins).padStart(2, '0'),
                        s: String(secs).padStart(2, '0')
                      };
                    };
                    setTimeLeft(calculateTimeLeft());
                    const timer = setInterval(() => {
                      setTimeLeft(calculateTimeLeft());
                    }, 1000);
                    return () => clearInterval(timer);
                  }, []);
                  return (
                    <div className="flex flex-col items-start">
                      <div className="font-mono text-xl font-black text-white tracking-wide">
                        {timeLeft.h} : {timeLeft.m} : {timeLeft.s}
                      </div>
                      <div className="flex items-center gap-2 text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        <span>Hours</span>
                        <span>Minutes</span>
                        <span>Seconds</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Thanks for your patience tagline */}
            <div className="w-full border-t border-white/5 pt-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400/90">
              <span className="text-yellow-400">Γ£ª</span>
              <span>Thanks for your patience!</span>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden ${isClosed ? "filter grayscale opacity-75 select-none" : ""}`}>

      {/* Filters & Sort Header */}
      <div className={`flex-shrink-0 border-b border-gray-100/80 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-3xs transition-colors duration-300 relative ${
        isFreshGroceryFlow ? 'bg-[#FFFDF3]' : 'bg-white'
      }`}>
        <button 
          onClick={() => {
            setTempPriceMin(filterPriceMin);
            setTempPriceMax(filterPriceMax);
            setTempFastDelivery(filterFastDelivery);
            setTempInStock(filterInStock);
            setTempDiscountOnly(filterDiscountOnly);
            setOpenModal(openModal === 'filter' ? null : 'filter');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            hasActiveFilters 
              ? `${primaryBg} text-white ${primaryBorder} shadow-2xs` 
              : 'border-gray-200/80 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontalIcon /> Filters {hasActiveFilters && `(${activeFilterCount})`} <ChevronDown size={10} />
        </button>

        <button 
          onClick={() => setOpenModal(openModal === 'sort' ? null : 'sort')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            sortBy !== 'relevance'
              ? `${primaryBg} text-white ${primaryBorder} shadow-2xs`
              : 'border-gray-200/80 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {sortBy !== 'relevance' ? (
            <>Sort: <span className="font-extrabold">{sortLabel}</span></>
          ) : (
            'Sort'
          )} <ChevronDown size={10} />
        </button>

        <button 
          onClick={() => setOpenModal(openModal === 'type' ? null : 'type')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            filterType !== 'all'
              ? `${primaryBg} text-white ${primaryBorder} shadow-2xs`
              : 'border-gray-200/80 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {filterType !== 'all' ? (
            <>Type: <span className="font-extrabold">{typeLabel}</span></>
          ) : (
            'Type'
          )} <ChevronDown size={10} />
        </button>

        {isAnyFilterOrSortActive && (
          <button
            onClick={resetAllFilters}
            className="text-[10.5px] font-bold text-red-500 hover:underline px-2 py-1 flex items-center gap-1 flex-shrink-0 cursor-pointer whitespace-nowrap"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Main Dual-Column Content with Independent Scrolling */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        
        {/* Left Subcategories Sidebar - Scrolls Separately */}
        <div className={`w-[24%] min-w-[85px] max-w-[110px] md:w-[160px] md:max-w-[190px] flex-shrink-0 border-r border-gray-100 overflow-y-auto overscroll-contain no-scrollbar h-full transition-colors duration-300 pb-24 ${
          isFreshGroceryFlow ? 'bg-[#FFFDF3]' : 'bg-gray-50/60'
        }`}>
          {subCategories.map((sub) => {
            const isActive = isSidebarActive(sub);
            return (
              <div
                key={sub.id}
                onClick={() => setActiveSub(sub.id)}
                className={`py-3.5 px-1 flex flex-col items-center gap-1.5 cursor-pointer relative transition-all ${
                  isActive ? (isFreshGroceryFlow ? 'bg-[#FFF0A0]/20' : 'bg-white') : 'bg-transparent'
                }`}
              >
                {isActive && (
                  <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${primarySidebarAccent} rounded-r-full`} />
                )}
                <div className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center border transition-all ${
                  isActive ? `${primaryBorderLight} ${primaryLightBg}` : 'border-gray-200/50 bg-white'
                }`}>                  <img src={sub.icon} alt={sub.name} className="w-8 h-8 object-contain mix-blend-multiply" onError={handleImageError} />
                </div>
                <span className={`text-[9.5px] text-center leading-tight font-semibold tracking-tight ${
                  isActive ? `${primaryText} font-bold` : 'text-gray-500'
                }`}>
                  {sub.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Product Grid Area - Scrolls Separately */}
        <div ref={rightGridRef} onScroll={handleGridScroll} className={`flex-1 min-w-0 ${rightGridBg} overflow-y-auto overscroll-contain h-full p-3 pb-24`}>
          
          {/* Promo banner */}
          <div className={`${promoBg} rounded-xl p-3 flex justify-between items-center mb-4 relative overflow-hidden`}>
            <div className="z-10 flex flex-col">
              <span className="text-[12px] font-bold text-gray-900 leading-tight">
                Fresh & Premium Products
              </span>
              <span className="text-[9px] text-gray-500 font-medium mt-0.5">
                Nutritional goodness in every bite
              </span>
            </div>
            <img 
              src={productsList[0]?.img || "https://images.unsplash.com/photo-1610832958506-ee5633619144?w=150&auto=format&fit=crop&q=60"} 
              alt="Promo Basket" 
              className="w-16 h-12 object-contain mix-blend-multiply absolute right-2 bottom-1"
              onError={handleImageError}
            />
          </div>

          {/* Undeliverable / location banner */}
          {notDeliverable && (
            <div className="mx-3 mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm font-bold text-amber-900">
                {liveLocation?.latitude == null
                  ? 'Turn on location to see Quick Commerce products near you.'
                  : 'Quick Commerce is not available at this delivery address yet.'}
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Try a different address or check back when a nearby seller is online.
              </p>
              {liveLocation?.latitude == null && (
                <button
                  type="button"
                  onClick={() => setPromptOpen(true)}
                  className="mt-3 px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-bold"
                >
                  Enable Location
                </button>
              )}
            </div>
          )}

          {!notDeliverable && (
            <>
              {/* Sibling subcategory pills for quick switching */}
              {siblingPills && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-2.5 px-0.5">
                  <button
                    onClick={() => setActiveSub(siblingPills.parent.id)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                      activeSub === siblingPills.parent.id
                        ? `${primaryBg} text-white ${primaryBorder} shadow-2xs`
                        : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
                    }`}
                  >
                    All Items
                  </button>
                  {siblingPills.items.map((sibling) => {
                    const isSiblingActive = activeSub === sibling.id;
                    return (
                      <button
                        key={sibling.id}
                        onClick={() => setActiveSub(sibling.id)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                          isSiblingActive
                            ? `${primaryBg} text-white ${primaryBorder} shadow-2xs`
                            : 'bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50'
                        }`}
                      >
                        {sibling.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Header Bar: Clean layout without text crowding or overlap */}
              <div className="mb-3 px-0.5">
                <div className="flex items-center justify-between gap-2">
                  {activeSub !== 'all' ? (
                    <button
                      onClick={() => setActiveSub(parentNode ? parentNode.id : 'all')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200/80 rounded-full px-2.5 py-1 shadow-3xs active:scale-95 transition-all flex-shrink-0"
                    >
                      <ArrowLeft size={13} strokeWidth={2.5} /> {parentNode ? parentNode.name : 'All Categories'}
                    </button>
                  ) : (
                    <span className="text-[13px] md:text-[15px] font-black text-gray-900 tracking-tight">
                      Browse Categories
                    </span>
                  )}

                  <span className="text-[10px] md:text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200/80 text-gray-500 shadow-3xs flex-shrink-0">
                    {!isAllItems && currentSubcategoriesToShow.length > 0
                      ? `${currentSubcategoriesToShow.length} categories`
                      : `${filteredProducts.length} items`}
                  </span>
                </div>

                {activeSub !== 'all' && (
                  <div className="mt-2">
                    <h2 className="text-[14px] md:text-[15px] font-black text-gray-900 tracking-tight leading-tight">
                      {parentNode ? `${parentNode.name} > ${activeNode ? activeNode.name : ''}` : (activeNode ? activeNode.name : categoryName)}
                    </h2>
                    {!isAllItems && currentSubcategoriesToShow.length > 0 && (
                      <p className="text-[9.5px] text-gray-500 font-medium mt-0.5">
                        Select a subcategory to browse products
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Case 1: Subcategories exist to show (e.g. Milk -> Cow Milk, Toned Milk, Full Cream Milk cards) */}
              {(!isAllItems && currentSubcategoriesToShow.length > 0) ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {currentSubcategoriesToShow.map((sub) => {
                    const count = getCategoryProductCount(sub);
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setActiveSub(sub.id)}
                        className="bg-white border border-gray-100 hover:border-amber-300 rounded-2xl p-2.5 md:p-3 flex flex-col items-center justify-between text-center cursor-pointer active:scale-95 transition-all shadow-3xs hover:shadow-2xs group"
                      >
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[#FFFDF8] border border-gray-100/70 flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform overflow-hidden">
                          <img
                            src={sub.icon}
                            alt={sub.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                            onError={handleImageError}
                          />
                        </div>
                        <span className={`text-[10.5px] md:text-[12px] font-bold text-gray-900 leading-tight line-clamp-2 min-h-[26px] flex items-center justify-center group-hover:${primaryText} transition-colors`}>
                          {sub.name}
                        </span>
                        <span className="mt-1 text-[9px] md:text-[10px] font-semibold text-gray-400 group-hover:text-amber-600 transition-colors">
                          {count > 0 ? `${count} ${count === 1 ? 'item' : 'items'}` : 'Explore'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Case 2: Specific Leaf Subcategory selected (No children) -> Show Products Grid */
                <div>

                  {filteredProducts.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {visibleProducts.map((product) => {
                          const isFav = favorites.includes(product.id);
                          return (
                            <div 
                              key={product.id}
                              onClick={() => handleProductClick(product)}
                              className="bg-white border border-gray-100/60 rounded-xl md:rounded-2xl p-1.5 md:p-2.5 flex flex-col relative shadow-3xs hover:shadow-2xs cursor-pointer active:scale-[0.99] transition-transform"
                            >
                              {/* Badge label like 'Season's Best' */}
                              {product.badge && (
                                <div className="absolute top-0 left-0 bg-[#FF6F3C] text-white text-[7px] md:text-[7.5px] font-bold px-1.5 py-0.2 md:px-2 md:py-0.5 rounded-tl-xl rounded-br z-10 shadow-3xs uppercase tracking-wider leading-none">
                                  {product.badge}
                                </div>
                              )}

                              {/* Heart Favorite Button */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(product.id);
                                }}
                                className="absolute top-1.5 right-1.5 w-5 h-5 md:w-6 md:h-6 bg-white/95 backdrop-blur-xs rounded-full flex items-center justify-center shadow-xs border border-gray-100/30 z-10 active:scale-90 transition-transform"
                              >
                                <Heart 
                                  size={9.5} 
                                  className={`transition-colors ${isFav ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} 
                                />
                              </button>

                              {/* Product Image Panel */}
                              <div className="h-16 md:h-24 w-full flex items-center justify-center p-0.5 relative mb-1 md:mb-2">
                                <img 
                                  src={product.img} 
                                  alt={product.name} 
                                  loading="lazy"
                                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                                  onError={handleImageError}
                                />
                                
                                {/* Carousel Dots */}
                                <div className="absolute bottom-0 left-0 flex gap-0.5">
                                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                                  <div className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                                  <div className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                                </div>
                              </div>

                              {/* Weight Details */}
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-[8.5px] md:text-[10px] text-gray-500 font-bold border border-gray-200/60 px-1 py-0.2 md:px-1.5 md:py-0.5 rounded bg-gray-50/30">
                                  {product.weight}
                                </span>
                                {product.subText && (
                                  <span className="text-[8px] md:text-[9px] text-gray-400 font-semibold">{product.subText}</span>
                                )}
                              </div>

                              {/* Product Title */}
                              <h3 className="text-[10px] md:text-[11.5px] font-bold text-gray-900 leading-[1.25] line-clamp-2 h-[26px] md:h-7.5 mb-1">
                                {product.name}
                              </h3>

                              {/* Custom Tags (Hidden on Mobile for compaction) */}
                              <div className="hidden md:flex flex-wrap gap-1 mb-2">
                                {product.tags.map((tag, tIdx) => (
                                  <span 
                                    key={tIdx} 
                                    className="bg-[#FAF6EC] text-[#8C6239] text-[8px] font-bold px-1.5 py-0.5 rounded-md leading-none"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              {/* Price and Add CTA bar */}
                              <div className="mt-auto pt-1.5 flex items-center justify-between border-t border-gray-50">
                                <div className="flex flex-col">
                                  <span className="text-[12.5px] md:text-[14px] font-bold text-gray-955 leading-none">
                                    {formatPrice(product.price)}
                                  </span>
                                  {product.oldPrice && (
                                    <span className="text-[9px] md:text-[10px] text-gray-405 line-through mt-0.5">
                                      {formatPrice(product.oldPrice)}
                                    </span>
                                  )}
                                </div>

                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addProductToCart({ id: product.id, name: product.name, price: product.price, image: product.img }).catch(() => {});
                                  }}
                                  className={`px-3 py-1 rounded-lg text-[10.5px] md:text-[11.5px] font-black text-white ${primaryBg} hover:opacity-95 active:scale-95 transition-all shadow-xs uppercase`}
                                >
                                  Add
                                </button>
                              </div>
             
                              {/* ETA & Stock status strip */}
                              <div className="flex items-center gap-1.5 mt-1.5 pt-0.5 border-t border-dashed border-gray-100 text-[8px] md:text-[8.5px] text-gray-400 font-semibold">
                                <span className={`flex items-center gap-0.5 ${primaryText}`}>
                                  ⏱ {product.eta}
                                </span>
                                {product.stock && (
                                  <span className="text-rose-500 font-bold bg-rose-50/50 px-1 rounded-sm">
                                    {product.stock}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Lazy Loaded Scroll Sentinel & Loading Indicator */}
                      {visibleCount < filteredProducts.length && (
                        <div ref={sentinelRef} className="py-4 flex items-center justify-center gap-2 text-gray-400">
                          <div className={`w-4 h-4 border-2 ${primaryBorder} border-t-transparent rounded-full animate-spin`} />
                          <span className="text-[11px] font-semibold text-gray-500">Loading more products...</span>
                        </div>
                      )}
                      {visibleCount >= filteredProducts.length && filteredProducts.length > 12 && (
                        <div className="py-4 text-center text-[10.5px] font-semibold text-gray-400">
                          Showing all {filteredProducts.length} items
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10 px-4 bg-white/60 rounded-2xl border border-dashed border-gray-200 my-2">
                      <p className="text-[13px] font-bold text-gray-700">No products here yet</p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Try browsing other subcategories.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveSub(parentNode ? parentNode.id : 'all')}
                        className={`mt-3 px-4 py-1.5 rounded-xl text-xs font-bold text-white ${primaryBg} active:scale-95 transition-all shadow-xs`}
                      >
                        Back to {parentNode ? parentNode.name : 'Subcategories'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!notDeliverable && loading && (
            <p className="text-center text-[12px] font-bold text-gray-400 py-10">Loading productsΓÇª</p>
          )}
        </div>

      </div>
      </div>

      {/* Sort Modal */}
      {openModal === 'sort' && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setOpenModal(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-slate-800">Sort Products By</h3>
              <button onClick={() => setOpenModal(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="py-2 space-y-1">
              {[
                { id: 'relevance', label: 'Relevance (Default)', desc: 'Best matching products' },
                { id: 'price_asc', label: 'Price: Low to High', desc: 'Cheapest items first' },
                { id: 'price_desc', label: 'Price: High to Low', desc: 'Premium items first' },
                { id: 'delivery', label: 'Fastest Delivery', desc: 'Express 15-20 min arrival' },
                { id: 'rating', label: 'Customer Rating', desc: 'Highest rated first' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id);
                    setOpenModal(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer ${
                    sortBy === opt.id ? `${primaryLightBg} ${primaryText} font-bold` : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                  {sortBy === opt.id && <Check size={16} className={primaryText} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Type Modal */}
      {openModal === 'type' && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setOpenModal(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-sm font-black text-slate-800">Select Product Type</h3>
              <button onClick={() => setOpenModal(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="py-2 space-y-1 overflow-y-auto flex-1">
              {[
                { id: 'all', label: 'All Types', desc: 'Show all items in this section' },
                { id: 'veg', label: '🌱 100% Pure Vegetarian', desc: 'Pure vegetarian products only' },
                { id: 'fresh', label: '🥬 Fresh & Daily', desc: 'Freshly sourced daily' },
                { id: 'organic', label: '✨ Organic & Natural', desc: 'Chemical & pesticide-free' },
                { id: 'deals', label: '🏷️ Special Offers', desc: 'Items with discounts & deals' },
                ...subCategories.filter(s => s.id !== 'all').map(s => ({
                  id: s.id,
                  label: s.name,
                  desc: `Switch to ${s.name}`,
                  isSubcategory: true,
                }))
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    if (opt.isSubcategory) {
                      setActiveSub(opt.id);
                      setFilterType('all');
                    } else {
                      setFilterType(opt.id);
                    }
                    setOpenModal(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer ${
                    (filterType === opt.id || (opt.isSubcategory && activeSub === opt.id)) ? `${primaryLightBg} ${primaryText} font-bold` : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                  {(filterType === opt.id || (opt.isSubcategory && activeSub === opt.id)) && <Check size={16} className={primaryText} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      {openModal === 'filter' && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setOpenModal(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-sm font-black text-slate-800">Filter Products</h3>
              <button onClick={() => setOpenModal(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="py-3 space-y-4 overflow-y-auto flex-1">
              {/* Price Range */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Price Range (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={tempPriceMin}
                    onChange={(e) => setTempPriceMin(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={tempPriceMax}
                    onChange={(e) => setTempPriceMax(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                  />
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: 'All', min: '', max: '' },
                    { label: 'Under ₹100', min: '', max: '100' },
                    { label: '₹100 - ₹300', min: '100', max: '300' },
                    { label: '₹300 - ₹1,000', min: '300', max: '1000' },
                    { label: '₹1,000+', min: '1000', max: '' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setTempPriceMin(p.min);
                        setTempPriceMax(p.max);
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        tempPriceMin === p.min && tempPriceMax === p.max
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div 
                onClick={() => setTempFastDelivery(prev => !prev)}
                className="flex items-center justify-between p-3 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">⚡ Fast Delivery Only</div>
                  <div className="text-[10px] text-slate-400">Under 25-30 minutes arrival</div>
                </div>
                <div className={`w-9 h-5 rounded-full relative transition-colors ${tempFastDelivery ? 'bg-green-500' : 'bg-slate-300'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${tempFastDelivery ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              {/* In Stock */}
              <div 
                onClick={() => setTempInStock(prev => !prev)}
                className="flex items-center justify-between p-3 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">In Stock Items Only</div>
                  <div className="text-[10px] text-slate-400">Hide out-of-stock items</div>
                </div>
                <div className={`w-9 h-5 rounded-full relative transition-colors ${tempInStock ? 'bg-green-500' : 'bg-slate-300'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${tempInStock ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              {/* Discounts */}
              <div 
                onClick={() => setTempDiscountOnly(prev => !prev)}
                className="flex items-center justify-between p-3 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">Discounted / Offers Only</div>
                  <div className="text-[10px] text-slate-400">Show items with price discounts</div>
                </div>
                <div className={`w-9 h-5 rounded-full relative transition-colors ${tempDiscountOnly ? 'bg-green-500' : 'bg-slate-300'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${tempDiscountOnly ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTempPriceMin('');
                  setTempPriceMax('');
                  setTempFastDelivery(false);
                  setTempInStock(false);
                  setTempDiscountOnly(false);
                  setFilterPriceMin('');
                  setFilterPriceMax('');
                  setFilterFastDelivery(false);
                  setFilterInStock(false);
                  setFilterDiscountOnly(false);
                  setOpenModal(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterPriceMin(tempPriceMin);
                  setFilterPriceMax(tempPriceMax);
                  setFilterFastDelivery(tempFastDelivery);
                  setFilterInStock(tempInStock);
                  setFilterDiscountOnly(tempDiscountOnly);
                  setOpenModal(null);
                }}
                className={`flex-[2] py-2.5 ${primaryBg} text-white text-xs font-bold rounded-xl shadow-sm transition-opacity hover:opacity-95 cursor-pointer`}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

// Simple inline icon
const SlidersHorizontalIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

export default QuickShopSubcategory;

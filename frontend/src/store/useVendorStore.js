import { create } from 'zustand';

// Import local assets for proper image display
import FashionImg from '../assets/products/product01.jpg';
import JewelleryImg from '../assets/products/product02.jpg';
import TshirtImg from '../assets/TopSection/TopSection2.jpg';
import BeautyImg from '../assets/products/product04.jpg';
import MakeupImg from '../assets/TopSection/TopSection1.jpg';
import EarbudsImg from '../assets/products/product06.jpg';
import SamsungImg from '../assets/products/product07.jpg';
import ElectronicsImg from '../assets/products/product08.jpg';
import SuitcaseImg from '../assets/products/product09.jpg';
import FlipFlopsImg from '../assets/products/product10.jpg';
import LipstickImg from '../assets/products/product11.webp';
import ShampooImg from '../assets/products/product12.jpg';
import ToysImg from '../assets/products/product13.jpg';
import StationeryImg from '../assets/products/product14.jpg';
import GiftingImg from '../assets/products/product15.webp';

// Still Looking Section Assets
import StillImg1 from '../assets/StillSection/StillImages1.png';
import StillImg2 from '../assets/StillSection/StillImages2.jpg';
import StillImg3 from '../assets/StillSection/StillImages3.jpg';
import StillImg4 from '../assets/StillSection/StillImages4.png';
import StillImg5 from '../assets/StillSection/StillImages5.jpg';

// Top Selection Section Assets
import TopImg1 from '../assets/TopSection/TopSection1.jpg';
import TopImg2 from '../assets/TopSection/TopSection2.jpg';
import TopImg3 from '../assets/TopSection/TopSection3.jpg';
import TopImg4 from '../assets/TopSection/TopSection21.jpg';

// Using local assets for products
const PRODUCT_IMAGES = {
  fashion: FashionImg,
  jewellery: JewelleryImg,
  tshirt: TshirtImg,
  lipstick: LipstickImg,
  shampoo: ShampooImg,
  makeup: MakeupImg,
  earbuds: EarbudsImg,
  phone: SamsungImg,
  electronics: ElectronicsImg,
  suitcase: SuitcaseImg,
  shoes: FlipFlopsImg,
  beauty: BeautyImg,
  toys: ToysImg,
  stationery: StationeryImg,
  gifting: GiftingImg,
};

const getInitialFlow = () => {
  if (typeof window === 'undefined') return 'mithilakart';
  const path = window.location.pathname;
  if (path.includes('/mithilak')) return 'mithilak';
  if (path.includes('/fresh-grocery')) return 'freshgrocery';
  if (path.includes('/quick-shop')) {
    return localStorage.getItem('isMithilakFlow') === 'true' ? 'mithilak' : 'quickshop';
  }
  if (localStorage.getItem('isMithilakFlow') === 'true') return 'mithilak';
  if (localStorage.getItem('isFreshGroceryFlow') === 'true') return 'freshgrocery';
  if (localStorage.getItem('isQuickShopFlow') === 'true') return 'quickshop';
  return 'mithilakart';
};

const useVendorStore = create((set) => ({
  activeFlow: getInitialFlow(),
  setActiveFlow: (flow) => {
    localStorage.setItem('isMithilakFlow', flow === 'mithilak' ? 'true' : 'false');
    localStorage.setItem('isQuickShopFlow', flow === 'quickshop' ? 'true' : 'false');
    localStorage.setItem('isFreshGroceryFlow', flow === 'freshgrocery' ? 'true' : 'false');
    set({ activeFlow: flow });
  },
  selectedCategory: 'You Buy',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  // Header visibility state
  isSaleBannerVisible: true,
  setSaleBannerVisible: (visible) => set({ isSaleBannerVisible: visible }),

  // Home Page Sections Data
  homeSections: {
    stillLooking: [
      { label: 'Co-ords', img: StillImg1, link: '/products' },
      { label: 'Necklaces', img: StillImg2, link: '/products' },
      { label: "Women's Tops", img: StillImg3, link: '/products' },
      { label: 'Lipsticks', img: StillImg4, link: '/products' }
    ],
    topSelection: [
      { name: 'Biotique Face Wash', tag: 'Grab Or Gone', img: TopImg1, link: '/product-detail' },
      { name: 'Lakmé Moisturizer', tag: 'Best Picks', img: TopImg2, link: '/product-detail' },
      { name: 'Vaseline Lip Balm', tag: 'Popular', img: TopImg3, link: '/product-detail' },
      { name: 'MARS Lipstick', tag: 'Widest Range', img: TopImg4, link: '/product-detail' }
    ],
    brandsSpotlight: [
      { title: 'Flat 73% off', sub: 'Limited time deal', img: PRODUCT_IMAGES.earbuds, link: '/product-detail' },
      { title: 'Shop now', sub: 'Blend easily', img: PRODUCT_IMAGES.makeup, link: '/product-detail' },
      { title: 'Coming to India', sub: 'CMF Watch 3 Pro', img: PRODUCT_IMAGES.phone, link: '/product-detail' },
      { title: 'Just ₹599', sub: 'Lowest price ever', img: PRODUCT_IMAGES.shampoo, link: '/product-detail' }
    ],
    bestQuality: [
      { name: "GUTI Women's Jeans", tag: 'Grab Or Gone', img: PRODUCT_IMAGES.fashion, link: '/product-detail' },
      { name: "Mandarin Women's Shirts", tag: 'Popular', img: TopImg2, link: '/product-detail' },
      { name: 'Royatto Necklaces', tag: 'Popular', img: PRODUCT_IMAGES.jewellery, link: '/product-detail' },
      { name: "Sqew Women's Trousers", tag: 'In Focus Now', img: PRODUCT_IMAGES.shoes, link: '/product-detail' }
    ],
    keepShopping: [
      { label: 'Suitcases', img: TopImg3, link: '/products' },
      { label: 'Smartphones', img: TopImg1, link: '/products' },
      { label: 'Electronics', img: PRODUCT_IMAGES.electronics, link: '/products' },
      { label: 'Beauty', img: TopImg4, link: '/products' }
    ]
  },
  
  setHomeSections: (newSections) => set((state) => ({
    homeSections: { ...state.homeSections, ...newSections }
  }))
}));

export default useVendorStore;

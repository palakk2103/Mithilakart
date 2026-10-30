import {
  FaShirt,
  FaLaptop,
  FaBasketShopping,
  FaHouse,
  FaSpa,
  FaFootball,
  FaGamepad,
  FaGem,
  FaPen,
  FaGift,
  FaBolt,
  FaMobileScreenButton,
  FaCamera,
  FaBook,
  FaPaw,
  FaCouch,
  FaBaby,
  FaHeartPulse,
  FaMusic,
  FaUtensils,
  FaShoePrints,
  FaBagShopping,
  FaClock,
  FaBlender,
  FaScrewdriverWrench,
  FaSeedling,
  FaCar,
  FaPalette,
  FaDumbbell,
  FaChildren,
  FaStore,
} from 'react-icons/fa6';

// Safe, curated set of react-icons an Admin can assign to a header category
// chip. Keys here must exactly match backend/src/constants/catalog.js's
// HEADER_CHIP_ICON_KEYS — never render an icon component by an arbitrary
// string received from the API; always look it up through this map.
export const HEADER_CHIP_ICON_OPTIONS = [
  { key: 'shop', label: 'Shop (default)', Icon: FaStore, keywords: ['default', 'store', 'all', 'general'] },
  { key: 'fashion', label: 'Fashion', Icon: FaShirt, keywords: ['clothing', 'apparel', 'wear', 'shirt'] },
  { key: 'electronics', label: 'Electronics', Icon: FaLaptop, keywords: ['gadgets', 'computer', 'tech'] },
  { key: 'grocery', label: 'Grocery', Icon: FaBasketShopping, keywords: ['food', 'supermarket', 'basket'] },
  { key: 'home', label: 'Home', Icon: FaHouse, keywords: ['house', 'living', 'decor'] },
  { key: 'beauty', label: 'Beauty', Icon: FaSpa, keywords: ['spa', 'cosmetics', 'skincare', 'makeup'] },
  { key: 'sports', label: 'Sports', Icon: FaFootball, keywords: ['football', 'fitness', 'outdoor'] },
  { key: 'toys', label: 'Toys & Games', Icon: FaGamepad, keywords: ['games', 'kids', 'play', 'gamepad'] },
  { key: 'jewellery', label: 'Jewellery', Icon: FaGem, keywords: ['jewelry', 'gem', 'accessories'] },
  { key: 'stationery', label: 'Stationery', Icon: FaPen, keywords: ['pen', 'office', 'school', 'supplies'] },
  { key: 'gifting', label: 'Gifting', Icon: FaGift, keywords: ['gift', 'present', 'hamper'] },
  { key: 'electrical', label: 'Electrical', Icon: FaBolt, keywords: ['power', 'energy', 'bolt'] },
  { key: 'mobile', label: 'Mobiles', Icon: FaMobileScreenButton, keywords: ['phone', 'smartphone'] },
  { key: 'laptop', label: 'Laptops', Icon: FaLaptop, keywords: ['computer', 'notebook'] },
  { key: 'camera', label: 'Cameras', Icon: FaCamera, keywords: ['photo', 'photography'] },
  { key: 'books', label: 'Books', Icon: FaBook, keywords: ['reading', 'library', 'stationery'] },
  { key: 'pets', label: 'Pets', Icon: FaPaw, keywords: ['animal', 'paw', 'dog', 'cat'] },
  { key: 'furniture', label: 'Furniture', Icon: FaCouch, keywords: ['sofa', 'couch', 'home decor'] },
  { key: 'baby', label: 'Baby Care', Icon: FaBaby, keywords: ['infant', 'kids', 'child'] },
  { key: 'health', label: 'Health', Icon: FaHeartPulse, keywords: ['wellness', 'medical', 'pharma'] },
  { key: 'music', label: 'Music', Icon: FaMusic, keywords: ['audio', 'instruments'] },
  { key: 'food', label: 'Food', Icon: FaUtensils, keywords: ['restaurant', 'dining', 'cuisine'] },
  { key: 'shoes', label: 'Shoes', Icon: FaShoePrints, keywords: ['footwear', 'sneakers', 'sandals'] },
  { key: 'bags', label: 'Bags', Icon: FaBagShopping, keywords: ['handbag', 'wallet', 'luggage'] },
  { key: 'watches', label: 'Watches', Icon: FaClock, keywords: ['time', 'clock', 'wristwatch'] },
  { key: 'appliances', label: 'Appliances', Icon: FaBlender, keywords: ['kitchen', 'blender', 'home'] },
  { key: 'tools', label: 'Tools', Icon: FaScrewdriverWrench, keywords: ['hardware', 'repair', 'diy'] },
  { key: 'garden', label: 'Garden', Icon: FaSeedling, keywords: ['plants', 'outdoor', 'nursery'] },
  { key: 'automotive', label: 'Automotive', Icon: FaCar, keywords: ['car', 'vehicle', 'auto'] },
  { key: 'gaming', label: 'Gaming', Icon: FaGamepad, keywords: ['console', 'videogames'] },
  { key: 'art', label: 'Art & Craft', Icon: FaPalette, keywords: ['painting', 'craft', 'hobby'] },
  { key: 'fitness', label: 'Fitness', Icon: FaDumbbell, keywords: ['gym', 'workout', 'exercise'] },
  { key: 'kids', label: 'Kids', Icon: FaChildren, keywords: ['children', 'child'] },
];

export const HEADER_CHIP_ICON_MAP = HEADER_CHIP_ICON_OPTIONS.reduce((acc, opt) => {
  acc[opt.key] = opt.Icon;
  return acc;
}, {});

export const DEFAULT_HEADER_CHIP_ICON = FaStore;

export const getHeaderChipIcon = (iconKey) => HEADER_CHIP_ICON_MAP[iconKey] || null;

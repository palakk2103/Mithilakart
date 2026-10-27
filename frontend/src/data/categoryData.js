import Mascara from '../assets/products/product01.jpg';
import LipstickDeal from '../assets/products/product02.jpg';
import LipGloss from '../assets/products/product03.jpg';
import LipLiner from '../assets/products/product04.jpg';
import PlumShampoo from '../assets/products/product05.jpg';
import LorealShampoo from '../assets/products/product06.jpg';
import MatrixShampoo from '../assets/products/product07.jpg';
import MakeupHero from '../assets/products/product08.jpg';

import StationeryImg from '../assets/products/product09.jpg';
import GiftingImg from '../assets/products/product10.jpg';
import PrintingImg from '../assets/products/product11.webp';
import JewelleryImg from '../assets/products/product12.jpg';
import ElectricalImg from '../assets/products/product13.jpg';
import ToysImg from '../assets/products/product14.jpg';
import TopImg3 from '../assets/TopSection/TopSection3.jpg';
import TopImg4 from '../assets/TopSection/TopSection21.jpg';

import SamsungS24 from '../assets/products/product01.jpg';
import AsusLaptop from '../assets/products/product02.jpg';
import EarbudsDeal from '../assets/products/product03.jpg';
import ElectronicsHero from '../assets/products/product04.jpg';

import ClothesImg from '../assets/products/product15.webp';
import Tshirt from '../assets/products/product05.jpg';
import FashionHero from '../assets/products/product06.jpg';
import FlipFlops from '../assets/products/product07.jpg';

import SplitAC from '../assets/products/product08.jpg';
import TowerFan from '../assets/products/product09.jpg';
import FanPedestal from '../assets/products/product10.jpg';
import FanBlack from '../assets/products/product11.webp';
import CoolerWhite from '../assets/products/product12.jpg';
import CookwareHero from '../assets/products/product13.jpg';

const rawCategoryProducts = {
  'You Buy': [
    { id: 'fy1', name: 'Premium Gifting Box', category: 'Gifting', price: 699, oldPrice: 999, discount: '30% OFF', rating: 4.8, image: GiftingImg, shortDescription: 'Assorted luxury collection' },
    { id: 'fy2', name: 'Samsung Galaxy S24', category: 'Electronics', price: 79999, oldPrice: 89999, discount: '11% OFF', rating: 4.9, image: SamsungS24, shortDescription: 'Flagship AI smartphone' },
    { id: 'fy3', name: 'Luxury Matte Lipstick', category: 'Beauty', price: 499, oldPrice: 999, discount: '50% OFF', rating: 4.8, image: LipstickDeal, shortDescription: 'Long-lasting matte finish' },
    { id: 'fy4', name: 'Wireless Earbuds', category: 'Electronics', price: 2499, oldPrice: 5999, discount: '58% OFF', rating: 4.7, image: TopImg3, shortDescription: '40H playtime & ANC' },
    { id: 'fy5', name: 'Diamond Pendant', category: 'Jewellery', price: 12999, oldPrice: 15999, discount: '18% OFF', rating: 4.9, image: TopImg4, shortDescription: '18K gold elegant design' },
    { id: 'fy6', name: 'Men\'s Denim Jacket', category: 'Fashion', price: 1499, oldPrice: 2999, discount: '50% OFF', rating: 4.8, image: FashionHero, shortDescription: 'Classic blue wash' }
  ],
  Beauty: [
    { id: 'b1', name: 'Luxury Matte Lipstick', category: 'Beauty', price: 499, oldPrice: 999, discount: '50% OFF', rating: 4.8, image: LipstickDeal, shortDescription: 'Long-lasting matte finish' },
    { id: 'b2', name: 'Vitamin C Face Serum', category: 'Beauty', price: 799, oldPrice: 1299, discount: '38% OFF', rating: 4.6, image: MakeupHero, shortDescription: 'Brightens and evens skin tone' },
    { id: 'b3', name: 'Volumizing Mascara', category: 'Beauty', price: 399, oldPrice: 599, discount: '33% OFF', rating: 4.5, image: Mascara, shortDescription: 'Waterproof extreme volume' },
    { id: 'b4', name: 'Shimmer Lip Gloss', category: 'Beauty', price: 299, oldPrice: 499, discount: '40% OFF', rating: 4.4, image: LipGloss, shortDescription: 'High shine gloss' },
    { id: 'b5', name: 'Precision Lip Liner', category: 'Beauty', price: 199, oldPrice: 299, discount: '33% OFF', rating: 4.2, image: LipLiner, shortDescription: 'Smooth glide pencil' },
    { id: 'b6', name: 'Plum Nourishing Shampoo', category: 'Beauty', price: 599, oldPrice: 899, discount: '33% OFF', rating: 4.7, image: PlumShampoo, shortDescription: 'Sulfate-free cleansing' },
    { id: 'b7', name: 'Loreal Hair Serum', category: 'Beauty', price: 499, oldPrice: 799, discount: '37% OFF', rating: 4.5, image: LorealShampoo, shortDescription: 'Frizz control formula' },
    { id: 'b8', name: 'Matrix Smoothing Mask', category: 'Beauty', price: 699, oldPrice: 999, discount: '30% OFF', rating: 4.6, image: MatrixShampoo, shortDescription: 'Deep hydration mask' }
  ],
  Gifting: [
    { id: 'g1', name: 'Premium Gifting Box', category: 'Gifting', price: 699, oldPrice: 999, discount: '30% OFF', rating: 4.8, image: GiftingImg, shortDescription: 'Assorted luxury collection' },
    { id: 'g2', name: 'Customized Photo Frame', category: 'Gifting', price: 499, oldPrice: 799, discount: '37% OFF', rating: 4.5, image: GiftingImg, shortDescription: 'Wooden engraved frame' },
    { id: 'g3', name: 'Aromatic Scented Candles', category: 'Gifting', price: 899, oldPrice: 1299, discount: '30% OFF', rating: 4.7, image: GiftingImg, shortDescription: 'Lavender & Vanilla set' },
    { id: 'g4', name: 'Couple Coffee Mugs', category: 'Gifting', price: 399, oldPrice: 599, discount: '33% OFF', rating: 4.6, image: GiftingImg, shortDescription: 'Mr. & Mrs. ceramic mugs' },
    { id: 'g5', name: 'Leather Wallet Set', category: 'Gifting', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.9, image: GiftingImg, shortDescription: 'Genuine leather combo' },
    { id: 'g6', name: 'Faux Plant Decor', category: 'Gifting', price: 299, oldPrice: 599, discount: '50% OFF', rating: 4.4, image: GiftingImg, shortDescription: 'Elegant desk planter' },
    { id: 'g7', name: 'Luxury Pen Set', category: 'Gifting', price: 1499, oldPrice: 2999, discount: '50% OFF', rating: 4.8, image: GiftingImg, shortDescription: 'Gold plated fountain pen' },
    { id: 'g8', name: 'Spa Care Basket', category: 'Gifting', price: 1999, oldPrice: 3499, discount: '42% OFF', rating: 4.7, image: GiftingImg, shortDescription: 'Ultimate relaxation kit' }
  ],
  Electronics: [
    { id: 'e1', name: 'Wireless Noise Cancelling Earbuds', category: 'Electronics', price: 2499, oldPrice: 5999, discount: '58% OFF', rating: 4.7, image: EarbudsDeal, shortDescription: '40H playtime & ANC' },
    { id: 'e2', name: 'Samsung Galaxy S24', category: 'Electronics', price: 79999, oldPrice: 89999, discount: '11% OFF', rating: 4.9, image: SamsungS24, shortDescription: 'Flagship AI smartphone' },
    { id: 'e3', name: 'Asus Gaming Laptop', category: 'Electronics', price: 65999, oldPrice: 85999, discount: '23% OFF', rating: 4.8, image: AsusLaptop, shortDescription: 'RTX 4050, 144Hz Display' },
    { id: 'e4', name: 'Electronics Gadget Pack', category: 'Electronics', price: 1499, oldPrice: 2999, discount: '50% OFF', rating: 4.8, image: ElectronicsHero, shortDescription: 'Essential tech accessories' },
    { id: 'e5', name: 'Mechanical Keyboard', category: 'Electronics', price: 2999, oldPrice: 4999, discount: '40% OFF', rating: 4.9, image: AsusLaptop, shortDescription: 'RGB backlit switches' },
    { id: 'e6', name: 'Wireless Mouse', category: 'Electronics', price: 599, oldPrice: 1299, discount: '53% OFF', rating: 4.4, image: AsusLaptop, shortDescription: 'Ergonomic & silent' },
    { id: 'e7', name: '4K Action Camera', category: 'Electronics', price: 4999, oldPrice: 9999, discount: '50% OFF', rating: 4.7, image: ElectronicsHero, shortDescription: 'Ultra HD waterproof' },
    { id: 'e8', name: '65W GaN Charger', category: 'Electronics', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.8, image: ElectronicsHero, shortDescription: 'Type-C fast adapter' }
  ],
  Jewellery: [
    { id: 'j1', name: 'Diamond Pendant', category: 'Jewellery', price: 12999, oldPrice: 15999, discount: '18% OFF', rating: 4.9, image: JewelleryImg, shortDescription: '18K gold elegant design' },
    { id: 'j2', name: 'Silver Hoop Earrings', category: 'Jewellery', price: 899, oldPrice: 1499, discount: '40% OFF', rating: 4.7, image: JewelleryImg, shortDescription: 'Pure 925 sterling silver' },
    { id: 'j3', name: 'Pearl Choker Set', category: 'Jewellery', price: 2499, oldPrice: 4999, discount: '50% OFF', rating: 4.8, image: JewelleryImg, shortDescription: 'Freshwater pearls' },
    { id: 'j4', name: 'Couple Rings Set', category: 'Jewellery', price: 1999, oldPrice: 3999, discount: '50% OFF', rating: 4.6, image: JewelleryImg, shortDescription: 'Platinum plated bands' },
    { id: 'j5', name: 'Temple Jewellery Necklace', category: 'Jewellery', price: 3499, oldPrice: 6999, discount: '50% OFF', rating: 4.8, image: JewelleryImg, shortDescription: 'Traditional bridal set' },
    { id: 'j6', name: 'Rose Gold Bracelet', category: 'Jewellery', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.7, image: JewelleryImg, shortDescription: 'Minimalist charm chain' },
    { id: 'j7', name: 'Stud Earrings Pack', category: 'Jewellery', price: 499, oldPrice: 999, discount: '50% OFF', rating: 4.5, image: JewelleryImg, shortDescription: 'Set of 6 daily wear' },
    { id: 'j8', name: 'Men\'s Chain', category: 'Jewellery', price: 1599, oldPrice: 2999, discount: '46% OFF', rating: 4.6, image: JewelleryImg, shortDescription: 'Stainless steel link' }
  ],
  Toys: [
    { id: 't1', name: 'Building Blocks Set', category: 'Toys', price: 899, oldPrice: 1499, discount: '40% OFF', rating: 4.8, image: ToysImg, shortDescription: '100 pcs colorful bricks' },
    { id: 't2', name: 'Remote Control Car', category: 'Toys', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.6, image: ToysImg, shortDescription: 'High speed off-road' },
    { id: 't3', name: 'Soft Teddy Bear', category: 'Toys', price: 699, oldPrice: 1299, discount: '46% OFF', rating: 4.9, image: ToysImg, shortDescription: 'Giant plush toy' },
    { id: 't4', name: 'Educational Puzzle', category: 'Toys', price: 399, oldPrice: 799, discount: '50% OFF', rating: 4.5, image: ToysImg, shortDescription: 'Wooden alphabet learning' },
    { id: 't5', name: 'Action Figure Set', category: 'Toys', price: 1499, oldPrice: 2999, discount: '50% OFF', rating: 4.7, image: ToysImg, shortDescription: 'Superhero collection' },
    { id: 't6', name: 'Kids Tent House', category: 'Toys', price: 1999, oldPrice: 3999, discount: '50% OFF', rating: 4.8, image: ToysImg, shortDescription: 'Indoor pop-up play tent' },
    { id: 't7', name: 'Musical Keyboard', category: 'Toys', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.6, image: ToysImg, shortDescription: '37 keys piano for kids' },
    { id: 't8', name: 'Board Game Combo', category: 'Toys', price: 899, oldPrice: 1599, discount: '43% OFF', rating: 4.7, image: ToysImg, shortDescription: 'Chess, Ludo & Snakes' }
  ],
  Stationery: [
    { id: 's1', name: 'Premium Notebook Set', category: 'Stationery', price: 499, oldPrice: 899, discount: '44% OFF', rating: 4.8, image: StationeryImg, shortDescription: 'Pack of 3 hardcover' },
    { id: 's2', name: 'Highlighter Pack', category: 'Stationery', price: 299, oldPrice: 499, discount: '40% OFF', rating: 4.6, image: StationeryImg, shortDescription: '6 pastel colors' },
    { id: 's3', name: 'Fine Point Pens', category: 'Stationery', price: 399, oldPrice: 699, discount: '43% OFF', rating: 4.7, image: StationeryImg, shortDescription: '12 assorted gel pens' },
    { id: 's4', name: 'Art Sketchbook', category: 'Stationery', price: 599, oldPrice: 999, discount: '40% OFF', rating: 4.9, image: StationeryImg, shortDescription: 'Thick acid-free paper' },
    { id: 's5', name: 'Desk Organizer', category: 'Stationery', price: 799, oldPrice: 1499, discount: '46% OFF', rating: 4.7, image: StationeryImg, shortDescription: 'Wooden multi-compartment' },
    { id: 's6', name: 'Sticky Notes Cube', category: 'Stationery', price: 199, oldPrice: 399, discount: '50% OFF', rating: 4.5, image: StationeryImg, shortDescription: 'Neon multi-color pad' },
    { id: 's7', name: 'Watercolor Paint Set', category: 'Stationery', price: 899, oldPrice: 1599, discount: '43% OFF', rating: 4.8, image: StationeryImg, shortDescription: '24 vivid tubes & brushes' },
    { id: 's8', name: 'Scientific Calculator', category: 'Stationery', price: 1299, oldPrice: 1999, discount: '35% OFF', rating: 4.8, image: StationeryImg, shortDescription: 'Advanced functions' }
  ],
  Fashion: [
    { id: 'f1', name: 'Men\'s Denim Jacket', category: 'Fashion', price: 1499, oldPrice: 2999, discount: '50% OFF', rating: 4.8, image: FashionHero, shortDescription: 'Classic blue wash' },
    { id: 'f2', name: 'Women\'s Maxi Dress', category: 'Fashion', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.7, image: FashionHero, shortDescription: 'Floral summer wear' },
    { id: 'f3', name: 'Graphic Printed T-Shirt', category: 'Fashion', price: 499, oldPrice: 999, discount: '50% OFF', rating: 4.6, image: Tshirt, shortDescription: 'Breathable cotton tee' },
    { id: 'f4', name: 'Casual Flip Flops', category: 'Fashion', price: 299, oldPrice: 599, discount: '50% OFF', rating: 4.8, image: FlipFlops, shortDescription: 'Floral comfy design' },
    { id: 'f5', name: 'Men\'s Chino Pants', category: 'Fashion', price: 999, oldPrice: 1999, discount: '50% OFF', rating: 4.5, image: ClothesImg, shortDescription: 'Slim fit stretch fabric' },
    { id: 'f6', name: 'Polarized Sunglasses', category: 'Fashion', price: 599, oldPrice: 1499, discount: '60% OFF', rating: 4.6, image: FashionHero, shortDescription: 'UV400 protection aviators' },
    { id: 'f7', name: 'Women\'s Formal Blazer', category: 'Fashion', price: 1899, oldPrice: 3499, discount: '45% OFF', rating: 4.7, image: ClothesImg, shortDescription: 'Tailored office wear' },
    { id: 'f8', name: 'Analog Wrist Watch', category: 'Fashion', price: 1499, oldPrice: 3999, discount: '62% OFF', rating: 4.8, image: FashionHero, shortDescription: 'Minimalist leather strap' },
    { id: 'f9', name: 'Woolen Knit Winter Sweater', category: 'Fashion', price: 1199, oldPrice: 2499, discount: '52% OFF', rating: 4.7, image: FashionHero, shortDescription: 'Warm ribbed crewneck sweater' },
    { id: 'f10', name: 'Men\'s Classic Leather Boots', category: 'Fashion', price: 2199, oldPrice: 4499, discount: '51% OFF', rating: 4.8, image: FlipFlops, shortDescription: 'Ankle length rugged boots' }
  ],
  Electrical: [
    { id: 'el1', name: 'Smart Split AC', category: 'Electrical', price: 35999, oldPrice: 51199, discount: '30% OFF', rating: 4.7, image: SplitAC, shortDescription: '1.5 Ton 5 Star Inverter' },
    { id: 'el2', name: 'Tower Fan', category: 'Electrical', price: 2499, oldPrice: 3899, discount: '36% OFF', rating: 4.6, image: TowerFan, shortDescription: 'High speed oscillation' },
    { id: 'el3', name: 'Pedestal Fan', category: 'Electrical', price: 1999, oldPrice: 3499, discount: '42% OFF', rating: 4.5, image: FanPedestal, shortDescription: 'High speed decorative' },
    { id: 'el4', name: 'Heavy Duty Black Fan', category: 'Electrical', price: 1899, oldPrice: 2499, discount: '24% OFF', rating: 4.8, image: FanBlack, shortDescription: 'Industrial cooling fan' },
    { id: 'el5', name: 'Air Cooler White', category: 'Electrical', price: 5799, oldPrice: 8299, discount: '30% OFF', rating: 4.7, image: CoolerWhite, shortDescription: 'Desert cooler 40L' },
    { id: 'el6', name: 'Copper Wire Bundle', category: 'Electrical', price: 1299, oldPrice: 1999, discount: '35% OFF', rating: 4.6, image: ElectricalImg, shortDescription: '90m fire retardant' },
    { id: 'el7', name: 'Modular Switches Pack', category: 'Electrical', price: 399, oldPrice: 699, discount: '42% OFF', rating: 4.5, image: ElectricalImg, shortDescription: 'Set of 10, 6A switches' },
    { id: 'el8', name: 'Rechargeable Torch', category: 'Electrical', price: 299, oldPrice: 599, discount: '50% OFF', rating: 4.4, image: ElectricalImg, shortDescription: 'Long beam LED' }
  ],
  Cosmetics: [
    { id: 'c1', name: 'Luxury Matte Lipstick', category: 'Cosmetics', price: 499, oldPrice: 999, discount: '50% OFF', rating: 4.8, image: LipstickDeal, shortDescription: 'Long-lasting matte finish' },
    { id: 'c2', name: 'Shimmer Lip Gloss', category: 'Cosmetics', price: 299, oldPrice: 499, discount: '40% OFF', rating: 4.4, image: LipGloss, shortDescription: 'High shine gloss' },
    { id: 'c3', name: 'Precision Lip Liner', category: 'Cosmetics', price: 199, oldPrice: 299, discount: '33% OFF', rating: 4.2, image: LipLiner, shortDescription: 'Smooth glide pencil' },
    { id: 'c4', name: 'Volumizing Mascara', category: 'Cosmetics', price: 399, oldPrice: 599, discount: '33% OFF', rating: 4.5, image: Mascara, shortDescription: 'Waterproof extreme volume' },
    { id: 'c5', name: 'Vitamin C Face Serum', category: 'Cosmetics', price: 799, oldPrice: 1299, discount: '38% OFF', rating: 4.6, image: MakeupHero, shortDescription: 'Brightens and evens skin tone' },
    { id: 'c6', name: 'Plum Nourishing Shampoo', category: 'Cosmetics', price: 599, oldPrice: 899, discount: '33% OFF', rating: 4.7, image: PlumShampoo, shortDescription: 'Sulfate-free cleansing' },
    { id: 'c7', name: 'Loreal Hair Serum', category: 'Cosmetics', price: 499, oldPrice: 799, discount: '37% OFF', rating: 4.5, image: LorealShampoo, shortDescription: 'Frizz control formula' },
    { id: 'c8', name: 'Matrix Smoothing Mask', category: 'Cosmetics', price: 699, oldPrice: 999, discount: '30% OFF', rating: 4.6, image: MatrixShampoo, shortDescription: 'Deep hydration mask' }
  ],
  'Art. Jewellery': [
    { id: 'aj1', name: 'Diamond Pendant', category: 'Art. Jewellery', price: 12999, oldPrice: 15999, discount: '18% OFF', rating: 4.9, image: JewelleryImg, shortDescription: '18K gold elegant design' },
    { id: 'aj2', name: 'Silver Hoop Earrings', category: 'Art. Jewellery', price: 899, oldPrice: 1499, discount: '40% OFF', rating: 4.7, image: JewelleryImg, shortDescription: 'Pure 925 sterling silver' },
    { id: 'aj3', name: 'Pearl Choker Set', category: 'Art. Jewellery', price: 2499, oldPrice: 4999, discount: '50% OFF', rating: 4.8, image: JewelleryImg, shortDescription: 'Freshwater pearls' },
    { id: 'aj4', name: 'Couple Rings Set', category: 'Art. Jewellery', price: 1999, oldPrice: 3999, discount: '50% OFF', rating: 4.6, image: JewelleryImg, shortDescription: 'Platinum plated bands' },
    { id: 'aj5', name: 'Temple Jewellery Necklace', category: 'Art. Jewellery', price: 3499, oldPrice: 6999, discount: '50% OFF', rating: 4.8, image: JewelleryImg, shortDescription: 'Traditional bridal set' },
    { id: 'aj6', name: 'Rose Gold Bracelet', category: 'Art. Jewellery', price: 1299, oldPrice: 2499, discount: '48% OFF', rating: 4.7, image: JewelleryImg, shortDescription: 'Minimalist charm chain' },
    { id: 'aj7', name: 'Stud Earrings Pack', category: 'Art. Jewellery', price: 499, oldPrice: 999, discount: '50% OFF', rating: 4.5, image: JewelleryImg, shortDescription: 'Set of 6 daily wear' },
    { id: 'aj8', name: "Men's Chain", category: 'Art. Jewellery', price: 1599, oldPrice: 2999, discount: '46% OFF', rating: 4.6, image: JewelleryImg, shortDescription: 'Stainless steel link' }
  ],
  '1g Gold': [
    { id: 'gg1', name: '1g Gold Coin', category: '1g Gold', price: 6499, oldPrice: 7200, discount: '10% OFF', rating: 4.9, image: JewelleryImg, shortDescription: '24K BIS hallmarked' },
    { id: 'gg2', name: 'Gold Chain 1g', category: '1g Gold', price: 5999, oldPrice: 6800, discount: '12% OFF', rating: 4.8, image: JewelleryImg, shortDescription: 'Lightweight daily wear' },
    { id: 'gg3', name: 'Gold Pendant 1g', category: '1g Gold', price: 6200, oldPrice: 7000, discount: '11% OFF', rating: 4.7, image: JewelleryImg, shortDescription: 'Elegant floral design' },
    { id: 'gg4', name: 'Gold Ring 1g', category: '1g Gold', price: 5800, oldPrice: 6500, discount: '10% OFF', rating: 4.8, image: JewelleryImg, shortDescription: 'Classic band style' },
    { id: 'gg5', name: 'Gold Earrings 1g', category: '1g Gold', price: 5500, oldPrice: 6200, discount: '11% OFF', rating: 4.9, image: JewelleryImg, shortDescription: 'Stud design, pair' },
    { id: 'gg6', name: 'Gold Bangle 1g', category: '1g Gold', price: 6800, oldPrice: 7500, discount: '9% OFF', rating: 4.7, image: JewelleryImg, shortDescription: 'Traditional kangan' },
    { id: 'gg7', name: 'Gold Nose Pin 1g', category: '1g Gold', price: 4999, oldPrice: 5800, discount: '13% OFF', rating: 4.6, image: JewelleryImg, shortDescription: 'Delicate floral pin' },
    { id: 'gg8', name: 'Gold Mangalsutra 1g', category: '1g Gold', price: 7200, oldPrice: 8000, discount: '10% OFF', rating: 4.9, image: JewelleryImg, shortDescription: 'Black bead design' }
  ]
};

export const allCategoryProducts = Object.keys(rawCategoryProducts).reduce((acc, category) => {
  acc[category] = rawCategoryProducts[category].map(product => {
    const listings = [];
    const id = product.id;
    
    if (id?.startsWith('fy')) {
      listings.push({ tab: 'mithilakart', deliveryType: 'standard', deliveryTime: '3 Days' });
    }
    
    if (
      ['Beauty', 'Gifting', 'Electronics', 'Jewellery', 'Toys', 'Stationery', 'Fashion', 'Electrical', 'Cosmetics', 'Art. Jewellery', '1g Gold'].includes(product.category) || 
      id?.startsWith('b') || id?.startsWith('g') || id?.startsWith('e') || id?.startsWith('j') || id?.startsWith('t') || id?.startsWith('s') || id?.startsWith('f') || id?.startsWith('c') || id?.startsWith('aj') || id?.startsWith('gg')
    ) {
      listings.push({ tab: 'quick_shop', deliveryType: 'quick', quickDeliveryTime: 20 });
      listings.push({ tab: 'mithilakart', deliveryType: 'standard', deliveryTime: '3 Days' });
    } else if (
      ['Fruits & Vegetables', 'Atta, Rice & Dal', 'Oil, Ghee & Masala', 'Dairy, Bread & Eggs', 'Chips & Namkeens', 'Ice Creams', 'Drinks & Juices', 'Sweets & Chocolates', 'Tea, Coffee & Milk Drinks', 'Bakery & Biscuits', 'Sauces & Spreads'].includes(product.category) ||
      id?.startsWith('fv') || id?.startsWith('ard') || id?.startsWith('ogm') || id?.startsWith('dbe') || id?.startsWith('cn') || id?.startsWith('ic') || id?.startsWith('dj') || id?.startsWith('sc') || id?.startsWith('tcm') || id?.startsWith('bb') || id?.startsWith('ss')
    ) {
      listings.push({ tab: 'groceries_fresh', deliveryType: 'quick', quickDeliveryTime: 25 });
    } else if (
      ['Mithila Festival & Cultural', 'Mithila Paridhan', 'Mithila Special Cuisines', 'Mithila Lac Bangles', 'Mithila Handcrafted Items', 'Mithila Pooja Needs', 'Mithila Books & Panchang', 'Mithila Achaar'].includes(product.category) ||
      id?.startsWith('mfc') || id?.startsWith('mp') || id?.startsWith('msc') || id?.startsWith('mlb') || id?.startsWith('mhi') || id?.startsWith('mpn') || id?.startsWith('mbp') || id?.startsWith('ma')
    ) {
      listings.push({ tab: 'mithilak', deliveryType: 'standard', deliveryTime: '3 Days' });
    }
    
    if (listings.length === 0) {
      listings.push({ tab: 'mithilakart', deliveryType: 'standard', deliveryTime: '5 Days' });
    }

    return {
      ...product,
      listings
    };
  });
  return acc;
}, {});


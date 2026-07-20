import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Share2, ChevronDown, Heart } from 'lucide-react';
import { formatPrice } from '../../../shared/utils/priceFormatter';
import closedShutter from '../../../assets/closed_shutter.png';
import { getCategories, getCategoryProducts } from '../services/catalogApi';
import { findCategoryByName, extractList, mapProductForCard } from '../utils/mappers';
import { addProductToCart } from '../utils/cartUtils';

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="%23fdfbf7" rx="12"/><text x="75" y="80" font-size="12" font-family="sans-serif" font-weight="bold" fill="%23d3a075" text-anchor="middle">Mithilakart</text></svg>`;

const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = FALLBACK_IMAGE;
};


const DYNAMIC_DATA = {
  'Fruits & Vegetables': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=100&auto=format&fit=crop&q=60' },
      { id: 'veg', name: 'Fresh Vegetables', icon: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=100&auto=format&fit=crop&q=60' },
      { id: 'fruits', name: 'Fresh Fruits', icon: 'https://images.unsplash.com/photo-1610832958506-ee5633619144?w=100&auto=format&fit=crop&q=60' },
      { id: 'exotics', name: 'Exotics', icon: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=100&auto=format&fit=crop&q=60' },
    ],
    products: [
      { id: 'fv1', name: 'Jumbo Indian Cherry', img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&auto=format&fit=crop&q=60', brand: 'Fresho', weight: '200 g', price: 227, oldPrice: 290, eta: '14 mins', stock: '2 left', tags: ['Carbide Free', 'Pulp-Rich Sweet'], category: 'fruits' },
      { id: 'fv2', name: 'Safeda / Banganapalli Mango', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&auto=format&fit=crop&q=60', brand: 'Fresho', weight: '750 - 850 g', subText: '2 pcs', price: 96, oldPrice: 120, eta: '14 mins', tags: ['Carbide Free', 'Pulp-Rich Sweet'], category: 'fruits' },
      { id: 'fv3', name: 'Litchi', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=60', brand: 'Fresho', weight: '500 g', price: 209, oldPrice: 257, eta: '14 mins', stock: '1 left', badge: "Season's Best", tags: ['Fresh & Juicy'], category: 'fruits' },
      { id: 'fv4', name: 'Jamun', img: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=300&auto=format&fit=crop&q=60', brand: 'Fresho', weight: '250 g', price: 132, oldPrice: 153, eta: '14 mins', stock: '2 left', tags: ['Rich in iron'], category: 'fruits' },
      { id: 'fv5', name: 'Fresh Tomato Hybrid', img: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&auto=format&fit=crop&q=60', brand: 'Organic Farms', weight: '500 g', price: 24, oldPrice: 32, eta: '14 mins', tags: ['Freshly Picked'], category: 'veg' },
      { id: 'fv6', name: 'New Potato (Aloo)', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=60', brand: 'Organic Farms', weight: '1 kg', price: 38, oldPrice: 48, eta: '14 mins', tags: ['Daily Essentials'], category: 'veg' },
      { id: 'fv7', name: 'Hybrid Broccoli', img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=300&auto=format&fit=crop&q=60', brand: 'Exotic Farms', weight: '1 pc', subText: 'approx 300g', price: 89, oldPrice: 110, eta: '14 mins', badge: 'Exotic', tags: ['High Fiber'], category: 'exotics' }
    ]
  },
  'Atta, Rice & Dal': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&auto=format&fit=crop&q=60' },
      { id: 'atta', name: 'Atta & Flours', icon: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=100&auto=format&fit=crop&q=60' },
      { id: 'rice', name: 'Rice & Rice Products', icon: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&auto=format&fit=crop&q=60' },
      { id: 'dal', name: 'Dals & Pulses', icon: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'ard1', name: 'Aashirvaad Shudh Chakki Atta', img: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=300&auto=format&fit=crop&q=60', brand: 'Aashirvaad', weight: '5 kg', price: 260, oldPrice: 295, eta: '14 mins', tags: ['100% Whole Wheat'], category: 'atta' },
      { id: 'ard2', name: 'Fortune Premium Basmati Rice', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=60', brand: 'Fortune', weight: '1 kg', price: 115, oldPrice: 145, eta: '14 mins', tags: ['Super Long Grain'], category: 'rice' },
      { id: 'ard3', name: 'Tata Sampann Unpolished Toor Dal', img: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=300&auto=format&fit=crop&q=60', brand: 'Tata Sampann', weight: '1 kg', price: 189, oldPrice: 220, eta: '14 mins', tags: ['Unpolished & Natural'], category: 'dal' },
      { id: 'ard4', name: 'Tata Sampann Moong Dal', img: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=300&auto=format&fit=crop&q=60', brand: 'Tata Sampann', weight: '500 g', price: 95, oldPrice: 115, eta: '14 mins', tags: ['Protein Rich'], category: 'dal' }
    ]
  },
  'Oil, Ghee & Masala': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&auto=format&fit=crop&q=60' },
      { id: 'oil', name: 'Cooking Oils', icon: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&auto=format&fit=crop&q=60' },
      { id: 'ghee', name: 'Ghee & Vanaspati', icon: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&auto=format&fit=crop&q=60' },
      { id: 'spices', name: 'Spices & Masalas', icon: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'ogm1', name: 'Fortune Mustard Oil Kachi Ghani', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=60', brand: 'Fortune', weight: '1 L', price: 175, oldPrice: 195, eta: '14 mins', tags: ['Cold Pressed'], category: 'oil' },
      { id: 'ogm2', name: 'Amul Pure Ghee Tin', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=60', brand: 'Amul', weight: '1 L', price: 690, oldPrice: 720, eta: '14 mins', tags: ['Pure Cow Ghee'], category: 'ghee' },
      { id: 'ogm3', name: 'Everest Garam Masala Powder', img: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=300&auto=format&fit=crop&q=60', brand: 'Everest', weight: '100 g', price: 92, oldPrice: 105, eta: '14 mins', tags: ['Rich Aroma'], category: 'spices' }
    ]
  },
  'Dairy, Bread & Eggs': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&auto=format&fit=crop&q=60' },
      { id: 'milk', name: 'Milk', icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&auto=format&fit=crop&q=60' },
      { id: 'bread', name: 'Bread & Buns', icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&auto=format&fit=crop&q=60' },
      { id: 'eggs', name: 'Eggs', icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'dbe1', name: 'Amul Taaza Fresh Toned Milk', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=60', brand: 'Amul', weight: '1 L', price: 66, oldPrice: 68, eta: '14 mins', tags: ['Pasteurised Toned'], category: 'milk' },
      { id: 'dbe2', name: 'Harvest Gold Brown Bread', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=60', brand: 'Harvest Gold', weight: '400 g', price: 45, oldPrice: 50, eta: '14 mins', tags: ['High Fiber'], category: 'bread' },
      { id: 'dbe3', name: 'Fresh White Eggs Pack', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=60', brand: 'Fresho', weight: '6 pcs', price: 42, oldPrice: 55, eta: '14 mins', tags: ['Rich in Protein'], category: 'eggs' }
    ]
  },
  'Chips & Namkeens': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1599490659273-e3a728591176?w=100&auto=format&fit=crop&q=60' },
      { id: 'chips', name: 'Potato Chips', icon: 'https://images.unsplash.com/photo-1599490659273-e3a728591176?w=100&auto=format&fit=crop&q=60' },
      { id: 'namkeen', name: 'Namkeens & Bhujia', icon: 'https://images.unsplash.com/photo-1599490659273-e3a728591176?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'cn1', name: 'Lays Classic Salted Potato Chips', img: 'https://images.unsplash.com/photo-1599490659273-e3a728591176?w=300&auto=format&fit=crop&q=60', brand: 'Lays', weight: '50 g', price: 20, oldPrice: 20, eta: '14 mins', tags: ['Crisp & Salty'], category: 'chips' },
      { id: 'cn2', name: 'Haldirams Aloo Bhujia Namkeen', img: 'https://images.unsplash.com/photo-1599490659273-e3a728591176?w=300&auto=format&fit=crop&q=60', brand: 'Haldirams', weight: '150 g', price: 45, oldPrice: 50, eta: '14 mins', tags: ['Spicy Potato Strings'], category: 'namkeen' }
    ]
  },
  'Ice Creams': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1501443762811-c52940c6a2c3?w=100&auto=format&fit=crop&q=60' },
      { id: 'tub', name: 'Tubs', icon: 'https://images.unsplash.com/photo-1501443762811-c52940c6a2c3?w=100&auto=format&fit=crop&q=60' },
      { id: 'cone', name: 'Cones & Cups', icon: 'https://images.unsplash.com/photo-1501443762811-c52940c6a2c3?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'ic1', name: 'Kwality Walls Butterscotch Tub', img: 'https://images.unsplash.com/photo-1501443762811-c52940c6a2c3?w=300&auto=format&fit=crop&q=60', brand: 'Kwality Walls', weight: '700 ml', price: 160, oldPrice: 190, eta: '14 mins', tags: ['Butterscotch Crunch'], category: 'tub' },
      { id: 'ic2', name: 'Amul Chocolate Cone', img: 'https://images.unsplash.com/photo-1501443762811-c52940c6a2c3?w=300&auto=format&fit=crop&q=60', brand: 'Amul', weight: '120 ml', price: 40, oldPrice: 45, eta: '14 mins', tags: ['Rich Chocolate'], category: 'cone' }
    ]
  },
  'Drinks & Juices': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop&q=60' },
      { id: 'soft', name: 'Soft Drinks', icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop&q=60' },
      { id: 'juice', name: 'Fruit Juices', icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'dj1', name: 'Coca-Cola Soft Drink Can', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=60', brand: 'Coca-Cola', weight: '330 ml', price: 40, oldPrice: 40, eta: '14 mins', tags: ['Refreshing Fizz'], category: 'soft' },
      { id: 'dj2', name: 'Real Mixed Fruit Juice Pack', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=60', brand: 'Real', weight: '1 L', price: 110, oldPrice: 125, eta: '14 mins', tags: ['100% Fruit Juice'], category: 'juice' }
    ]
  },
  'Sweets & Chocolates': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=100&auto=format&fit=crop&q=60' },
      { id: 'choc', name: 'Chocolates', icon: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=100&auto=format&fit=crop&q=60' },
      { id: 'sweets', name: 'Indian Sweets', icon: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'sc1', name: 'Cadbury Dairy Milk Silk Chocolate', img: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=300&auto=format&fit=crop&q=60', brand: 'Cadbury', weight: '150 g', price: 175, oldPrice: 190, eta: '14 mins', tags: ['Smooth & Creamy'], category: 'choc' },
      { id: 'sc2', name: 'Amul Fruit & Nut Dark Chocolate', img: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=300&auto=format&fit=crop&q=60', brand: 'Amul', weight: '150 g', price: 100, oldPrice: 120, eta: '14 mins', tags: ['Rich Cocoa'], category: 'choc' },
      { id: 'sc3', name: 'Haldiram Gulab Jamun Tin', img: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=300&auto=format&fit=crop&q=60', brand: 'Haldirams', weight: '1 kg', price: 220, oldPrice: 250, eta: '14 mins', tags: ['Festive Sweet'], category: 'sweets' }
    ]
  },
  'Tea, Coffee & Milk Drinks': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=100&auto=format&fit=crop&q=60' },
      { id: 'tea', name: 'Tea', icon: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=100&auto=format&fit=crop&q=60' },
      { id: 'coffee', name: 'Coffee', icon: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'tcm1', name: 'Brooke Bond Red Label Tea', img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&auto=format&fit=crop&q=60', brand: 'Brooke Bond', weight: '500 g', price: 190, oldPrice: 220, eta: '14 mins', tags: ['Healthy Flavonoids'], category: 'tea' },
      { id: 'tcm2', name: 'Nescafe Classic Instant Coffee', img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&auto=format&fit=crop&q=60', brand: 'Nescafe', weight: '100 g', price: 280, oldPrice: 310, eta: '14 mins', tags: ['100% Pure Coffee'], category: 'coffee' }
    ]
  },
  'Bakery & Biscuits': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&auto=format&fit=crop&q=60' },
      { id: 'biscuits', name: 'Biscuits & Cookies', icon: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&auto=format&fit=crop&q=60' },
      { id: 'bread', name: 'Fresh Breads', icon: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'bb1', name: 'Britannia Good Day Cashew Cookies', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=60', brand: 'Britannia', weight: '100 g', price: 20, oldPrice: 25, eta: '14 mins', tags: ['Cashew Rich'], category: 'biscuits' },
      { id: 'bb2', name: 'Britannia Bourbon Biscuit Pack', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=60', brand: 'Britannia', weight: '150 g', price: 30, oldPrice: 35, eta: '14 mins', tags: ['Chocolate Creamy'], category: 'biscuits' }
    ]
  },
  'Sauces & Spreads': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=100&auto=format&fit=crop&q=60' },
      { id: 'ketchup', name: 'Tomato Ketchup', icon: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=100&auto=format&fit=crop&q=60' },
      { id: 'jam', name: 'Fruit Jams', icon: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'ss1', name: 'Kissan Fresh Tomato Ketchup', img: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=300&auto=format&fit=crop&q=60', brand: 'Kissan', weight: '950 g', price: 120, oldPrice: 145, eta: '14 mins', tags: ['100% Real Tomatoes'], category: 'ketchup' },
      { id: 'ss2', name: 'Kissan Mixed Fruit Jam Jar', img: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=300&auto=format&fit=crop&q=60', brand: 'Kissan', weight: '500 g', price: 160, oldPrice: 185, eta: '14 mins', tags: ['Real Fruit Pulps'], category: 'jam' }
    ]
  },
  'Mithila Festival & Cultural': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=100&auto=format&fit=crop&q=60' },
      { id: 'festival', name: 'Mithila Festival Packages', icon: 'https://images.unsplash.com/photo-1609137144813-7d722edbd48e?w=100&auto=format&fit=crop&q=60' },
      { id: 'marriage', name: 'Mithila Marriage Packages', icon: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=100&auto=format&fit=crop&q=60' },
      { id: 'cultural', name: 'Mithila Cultural Packages', icon: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=100&auto=format&fit=crop&q=60' },
      { id: 'arts', name: 'Mithila Arts', icon: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100&auto=format&fit=crop&q=60' },
      { id: 'm5', name: 'M5', icon: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&auto=format&fit=crop&q=60' },
      { id: 'm6', name: 'M6', icon: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&auto=format&fit=crop&q=60' },
      { id: 'm7', name: 'M7', icon: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=100&auto=format&fit=crop&q=60' },
      { id: 'm8', name: 'M8', icon: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'mfc1', name: 'Framed Madhubani Painting (Radha Krishna)', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Kala', weight: '1 Unit', price: 1200, oldPrice: 1500, eta: '14 mins', badge: 'Authentic', tags: ['Handpainted', 'Traditional'], category: 'arts' },
      { id: 'mfc2', name: 'Handcrafted Madhubani Bookmark Set', img: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Kala', weight: '5 pcs', price: 150, oldPrice: 200, eta: '14 mins', tags: ['Handmade', 'Paper Art'], category: 'arts' },
      { id: 'mfc3', name: 'Cultural Wall Hanging Ganesha', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Decor', weight: '1 pc', price: 349, oldPrice: 450, eta: '14 mins', tags: ['Sikki Grass', 'Eco Friendly'], category: 'cultural' },
      { id: 'mfc4', name: 'Mithila Kojagari Pooja Festival Package', img: 'https://images.unsplash.com/photo-1609137144813-7d722edbd48e?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Rasoi', weight: '1 Kit', price: 899, oldPrice: 1199, eta: '14 mins', badge: 'Festive', tags: ['Pooja Needs', 'Festival Special'], category: 'festival' },
      { id: 'mfc5', name: 'Madhubani Wedding Rituals Marriage Set', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Shringar', weight: '1 Kit', price: 2499, oldPrice: 2999, eta: '14 mins', badge: 'Wedding', tags: ['Shringar', 'Marriage Kit'], category: 'marriage' }
    ]
  },
  'Mithila Paridhan': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&auto=format&fit=crop&q=60' },
      { id: 'sarees', name: 'Sarees', icon: 'https://images.unsplash.com/photo-1610030470343-a55099abf3ac?w=100&auto=format&fit=crop&q=60' },
      { id: 'kurtas', name: 'Kurtas & Dupattas', icon: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'mp1', name: 'Tussar Silk Madhubani Saree', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Weaves', weight: '1 Unit', price: 4500, oldPrice: 5500, eta: '14 mins', badge: 'Premium', tags: ['100% Pure Silk', 'Handpainted'], category: 'sarees' },
      { id: 'mp2', name: 'Hand-painted Cotton Kurta', img: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Weaves', weight: '1 Unit', price: 850, oldPrice: 1200, eta: '14 mins', tags: ['Pure Cotton', 'Unisex'], category: 'kurtas' },
      { id: 'mp3', name: 'Premium Madhubani Painted Dupatta', img: 'https://images.unsplash.com/photo-1610030470343-a55099abf3ac?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Weaves', weight: '1 Unit', price: 650, oldPrice: 850, eta: '14 mins', tags: ['Cotton-Silk', 'Ethnic Wear'], category: 'kurtas' }
    ]
  },
  'Mithila Special Cuisines': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&auto=format&fit=crop&q=60' },
      { id: 'makhana', name: 'Phool Makhana', icon: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&auto=format&fit=crop&q=60' },
      { id: 'snacks', name: 'Traditional Snacks', icon: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'msc1', name: 'Organic Premium Phool Makhana', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Farms', weight: '250 g', price: 199, oldPrice: 250, eta: '14 mins', badge: 'Fresh', tags: ['Gluten Free', 'High Protein'], category: 'makhana' },
      { id: 'msc2', name: 'Spicy Roasted Makhana Snacks', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Farms', weight: '100 g', price: 120, oldPrice: 150, eta: '14 mins', tags: ['Crispy', 'Healthy'], category: 'makhana' },
      { id: 'msc3', name: 'Mithila Homemade Anarsa Sweets', img: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Rasoi', weight: '500 g', price: 250, oldPrice: 300, eta: '14 mins', tags: ['Homemade', 'Sugar Glazed'], category: 'snacks' }
    ]
  },
  'Mithila Lac Bangles': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=100&auto=format&fit=crop&q=60' },
      { id: 'bridal', name: 'Bridal Lahathi', icon: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=100&auto=format&fit=crop&q=60' },
      { id: 'daily', name: 'Daily Wear', icon: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'mlb1', name: 'Traditional Mithila Bridal Lahathi Set', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Shringar', weight: '1 Set', price: 599, oldPrice: 799, eta: '14 mins', badge: 'Bridal Special', tags: ['Pure Lac', 'Stone Work'], category: 'bridal' },
      { id: 'mlb2', name: 'Multicolored Daily Wear Lac Bangles', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Shringar', weight: '12 pcs', price: 299, oldPrice: 399, eta: '14 mins', tags: ['Lightweight', 'Durable'], category: 'daily' },
      { id: 'mlb3', name: 'Premium Designer Lac Kada Pair', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Shringar', weight: '2 pcs', price: 399, oldPrice: 499, eta: '14 mins', tags: ['Designer Kada', 'Gold Accents'], category: 'daily' }
    ]
  },
  'Mithila Handcrafted Items': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=100&auto=format&fit=crop&q=60' },
      { id: 'sikki', name: 'Sikki Crafts', icon: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=100&auto=format&fit=crop&q=60' },
      { id: 'terracotta', name: 'Terracotta & Clay', icon: 'https://images.unsplash.com/photo-1609137144813-7d722edbd48e?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'mhi1', name: 'Handwoven Sikki Grass Basket (Mauni)', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=60', brand: 'Sikki Art', weight: '1 Unit', price: 349, oldPrice: 450, eta: '14 mins', badge: 'Handmade', tags: ['Eco-friendly', 'Traditional'], category: 'sikki' },
      { id: 'mhi2', name: 'Sikki Grass Sun God Wall Hanging', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=60', brand: 'Sikki Art', weight: '1 Unit', price: 299, oldPrice: 399, eta: '14 mins', tags: ['Vibrant Colors', 'Decorative'], category: 'sikki' },
      { id: 'mhi3', name: 'Terracotta Mithila Painted Diya Pot', img: 'https://images.unsplash.com/photo-1609137144813-7d722edbd48e?w=300&auto=format&fit=crop&q=60', brand: 'Clay & Colors', weight: '1 pc', price: 199, oldPrice: 299, eta: '14 mins', tags: ['Handpainted', 'Festive'], category: 'terracotta' }
    ]
  },
  'Mithila Pooja Needs': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1609137144813-7d722edbd48e?w=100&auto=format&fit=crop&q=60' },
      { id: 'samagri', name: 'Pooja Samagri', icon: 'https://images.unsplash.com/photo-1609137144813-7d722edbd48e?w=100&auto=format&fit=crop&q=60' },
      { id: 'dhoop', name: 'Dhoop & Incense', icon: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'mpn1', name: 'Mithila Traditional Pooja Samagri Kit', img: 'https://images.unsplash.com/photo-1609137144813-7d722edbd48e?w=300&auto=format&fit=crop&q=60', brand: 'Punya Pooja', weight: '1 Kit', price: 499, oldPrice: 599, eta: '14 mins', badge: 'Devotional', tags: ['Complete Kit', 'Pure Materials'], category: 'samagri' },
      { id: 'mpn2', name: 'Handmade Cow Dung Dhoop Batti', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=60', brand: 'Punya Pooja', weight: '50 sticks', price: 99, oldPrice: 120, eta: '14 mins', tags: ['Natural Aroma', 'Chemical Free'], category: 'dhoop' },
      { id: 'mpn3', name: 'Pure Brass Aarti Diya with Handle', img: 'https://images.unsplash.com/photo-1609137144813-7d722edbd48e?w=300&auto=format&fit=crop&q=60', brand: 'Brass Crafts', weight: '1 Unit', price: 180, oldPrice: 250, eta: '14 mins', tags: ['High Quality', 'Heavy Base'], category: 'samagri' }
    ]
  },
  'Mithila Books & Panchang': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&auto=format&fit=crop&q=60' },
      { id: 'panchang', name: 'Panchangs', icon: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&auto=format&fit=crop&q=60' },
      { id: 'books', name: 'Literature & Poetry', icon: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'mbp1', name: 'Vidyapati Mithila Panchang (Latest)', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=60', brand: 'Vidyapati Press', weight: '1 Book', price: 80, oldPrice: 100, eta: '14 mins', badge: 'Must Have', tags: ['Latest Edition', 'Accurate'], category: 'panchang' },
      { id: 'mbp2', name: 'Maithili Folk Tales Book', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Academy', weight: '1 Book', price: 150, oldPrice: 180, eta: '14 mins', tags: ['Illustrated', 'Children Friendly'], category: 'books' },
      { id: 'mbp3', name: 'Mahakavi Vidyapati Geetanjali', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Academy', weight: '1 Book', price: 200, oldPrice: 250, eta: '14 mins', tags: ['Poetry', 'Maithili Classics'], category: 'books' }
    ]
  },
  'Mithila Achaar': {
    subcategories: [
      { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=100&auto=format&fit=crop&q=60' },
      { id: 'mango', name: 'Mango Pickle', icon: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=100&auto=format&fit=crop&q=60' },
      { id: 'chilli', name: 'Chilli & Garlic', icon: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=100&auto=format&fit=crop&q=60' }
    ],
    products: [
      { id: 'ma1', name: 'Mithila Special Sun-dried Mango Pickle', img: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Rasoi', weight: '400 g', price: 249, oldPrice: 299, eta: '14 mins', badge: 'Homemade', tags: ['Spicy & Tangy', 'Traditional Method'], category: 'mango' },
      { id: 'ma2', name: 'Spicy Mithila Lal Mirch (Stuffed Red Chilli) Achaar', img: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Rasoi', weight: '350 g', price: 199, oldPrice: 249, eta: '14 mins', tags: ['Stuffed', 'Very Spicy'], category: 'chilli' },
      { id: 'ma3', name: 'Traditional Garlic-Ginger Homemade Pickle', img: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Rasoi', weight: '400 g', price: 180, oldPrice: 220, eta: '14 mins', tags: ['Rich Taste', 'Digestive'], category: 'chilli' }
    ]
  }
};

const getCategoryData = (categoryName) => {
  if (DYNAMIC_DATA[categoryName]) {
    return DYNAMIC_DATA[categoryName];
  }

  // Generates generic fallback elements matching the styling system perfectly
  const defaultSubcategories = [
    { id: 'all', name: 'All', icon: 'https://images.unsplash.com/photo-1610832958506-ee5633619144?w=100&auto=format&fit=crop&q=60' },
    { id: 'premium', name: 'Premium Range', icon: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=60' },
    { id: 'standard', name: 'Standard Range', icon: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=100&auto=format&fit=crop&q=60' }
  ];

  const generatedProducts = [
    { id: `gen-${categoryName}-1`, name: `Premium ${categoryName} Pack`, img: 'https://images.unsplash.com/photo-1610832958506-ee5633619144?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Brand', weight: '1 Unit', price: 199, oldPrice: 249, eta: '14 mins', tags: ['Bestseller'], category: 'premium' },
    { id: `gen-${categoryName}-2`, name: `Standard ${categoryName} Pack`, img: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=300&auto=format&fit=crop&q=60', brand: 'Mithila Brand', weight: '1 Unit', price: 99, oldPrice: 129, eta: '14 mins', tags: ['Value Buy'], category: 'standard' }
  ];

  return {
    subcategories: defaultSubcategories,
    products: generatedProducts
  };
};

const QuickShopSubcategory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const categoryName = location.state?.category || 'Fruits & Vegetables';

  const isClosed = React.useMemo(() => {
    const force = localStorage.getItem('forceShopClosed');
    if (force === 'true') return true;
    if (force === 'false') return false;
    
    const now = new Date();
    const hours = now.getHours();
    return hours >= 0 && hours < 6;
  }, []);


  const isMithilakFlow = localStorage.getItem('isMithilakFlow') === 'true';
  const isFreshGroceryFlow = localStorage.getItem('isFreshGroceryFlow') === 'true';
  
  const primaryText = isFreshGroceryFlow ? 'text-[#D9A21B]' : isMithilakFlow ? 'text-[#207C8A]' : 'text-[#F26522]';
  const primaryBg = isFreshGroceryFlow ? 'bg-[#D9A21B]' : isMithilakFlow ? 'bg-[#207C8A]' : 'bg-[#F26522]';
  const primaryBgHover = isFreshGroceryFlow ? 'hover:bg-[#FFF8EE] bg-white' : isMithilakFlow ? 'hover:bg-[#F5F9FA] bg-white' : 'hover:bg-orange-50 bg-white';
  const primaryBorder = isFreshGroceryFlow ? 'border-[#D9A21B]' : isMithilakFlow ? 'border-[#207C8A]' : 'border-[#F26522]';
  const primaryBorderLight = isFreshGroceryFlow ? 'border-[#D9A21B]/25' : isMithilakFlow ? 'border-[#207C8A]/25' : 'border-[#F26522]/25';
  const primaryLightBg = isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isMithilakFlow ? 'bg-[#F5F9FA]' : 'bg-[#FFF5EE]';
  const primarySidebarAccent = isFreshGroceryFlow ? 'bg-[#D9A21B]' : isMithilakFlow ? 'bg-[#207C8A]' : 'bg-[#F26522]';
  
  const rightGridBg = isFreshGroceryFlow ? 'bg-[#FFF8EE]' : isMithilakFlow ? 'bg-[#F5F9FA]/20' : 'bg-orange-50/15';
  const promoBg = isFreshGroceryFlow ? 'bg-[#FFF8EE] border border-[#D9A21B]/15' : isMithilakFlow ? 'bg-[#F5F9FA]/65 border border-[#207C8A]/15' : 'bg-[#FFF5EE] border border-[#FFD9C7]/40';

  // Get dynamic category structure (API with local fallback)
  const fallbackData = getCategoryData(categoryName);
  const [subCategories, setSubCategories] = useState(fallbackData.subcategories);
  const [productsList, setProductsList] = useState(fallbackData.products);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const categories = await getCategories({ commerceFlow: 'quick_shop' });
        const match = findCategoryByName(categories, categoryName);
        if (!match) {
          if (!cancelled) {
            setSubCategories(fallbackData.subcategories);
            setProductsList(fallbackData.products);
          }
          return;
        }

        const data = await getCategoryProducts(match.id, { limit: 40 });
        const mapped = extractList(data).map((p) => {
          const card = mapProductForCard(p);
          return {
            id: card.id,
            name: card.name,
            img: card.image,
            brand: card.brand || 'Mithila Brand',
            weight: '1 Unit',
            price: parseInt(String(card.price).replace(/,/g, ''), 10) || 0,
            oldPrice: parseInt(String(card.oldPrice || card.mrp || '0').replace(/,/g, ''), 10) || undefined,
            eta: '14 mins',
            tags: ['Fresh'],
            category: 'all',
          };
        });

        if (!cancelled) {
          setSubCategories(
            (match.children || []).length
              ? [{ id: 'all', name: 'All', icon: match.imageUrl || FALLBACK_IMAGE }, ...match.children.map((child) => ({
                  id: child.id,
                  name: child.name,
                  icon: child.imageUrl || child.iconUrl || FALLBACK_IMAGE,
                }))]
              : fallbackData.subcategories
          );
          setProductsList(mapped.length ? mapped : fallbackData.products);
        }
      } catch {
        if (!cancelled) {
          setSubCategories(fallbackData.subcategories);
          setProductsList(fallbackData.products);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [categoryName]);

  const [activeSub, setActiveSub] = useState('all');
  const [favorites, setFavorites] = useState([]);

  // Reset active subcategory when categoryName changes
  useEffect(() => {
    setActiveSub('all');
  }, [categoryName]);

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

  const filteredProducts = activeSub === 'all' 
    ? productsList 
    : productsList.filter(p => p.category === activeSub);

  const isQuickShopHeader = !isFreshGroceryFlow && !isMithilakFlow;

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none transition-colors duration-300 relative ${
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
      <div className={`sticky top-0 z-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between shadow-3xs transition-colors duration-300 ${
        isFreshGroceryFlow ? 'bg-[#D9A21B] text-white' : isMithilakFlow ? 'bg-white' : 'bg-[#F26522] text-white'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className={`p-1 active:scale-95 transition-transform ${isQuickShopHeader || isFreshGroceryFlow ? 'text-white' : 'text-gray-800'}`}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col">
            <h1 className={`text-[16px] font-bold leading-tight ${isQuickShopHeader || isFreshGroceryFlow ? 'text-white' : 'text-gray-900'}`}>
              {categoryName}
            </h1>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isQuickShopHeader || isFreshGroceryFlow ? 'text-white/95' : primaryText}`}>
              Delivering to : <span className={`font-medium truncate max-w-[150px] ${isQuickShopHeader || isFreshGroceryFlow ? 'text-white/80' : 'text-gray-500'}`}>Indrapuri Colony, Indore</span>
              <ChevronDown size={10} />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className={`p-2 rounded-full ${isQuickShopHeader || isFreshGroceryFlow ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Search size={20} strokeWidth={2.2} />
          </button>
          <button className={`p-2 rounded-full ${isQuickShopHeader || isFreshGroceryFlow ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}>
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
              <span className="text-yellow-400">✦</span>
              <span>Thanks for your patience!</span>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden ${isClosed ? "filter grayscale opacity-65 pointer-events-none select-none" : ""}`}>


      {/* Filters & Sort Header */}
      <div className={`border-b border-gray-100/80 px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar shadow-3xs transition-colors duration-300 ${
        isFreshGroceryFlow ? 'bg-[#FFFDF3]' : 'bg-white'
      }`}>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200/80 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          <SlidersHorizontalIcon /> Filters <ChevronDown size={10} />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200/80 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          Sort <ChevronDown size={10} />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200/80 rounded-full text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          Type <ChevronDown size={10} />
        </button>
      </div>

      {/* Main Dual-Column Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Subcategories Sidebar */}
        <div className={`w-[24%] border-r border-gray-100 overflow-y-auto no-scrollbar h-[calc(100vh-105px)] transition-colors duration-300 ${
          isFreshGroceryFlow ? 'bg-[#FFFDF3]' : 'bg-gray-50/60'
        }`}>
          {subCategories.map((sub) => {
            const isActive = activeSub === sub.id;
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

        {/* Right Product Grid Area */}
        <div className={`flex-1 ${rightGridBg} overflow-y-auto h-[calc(100vh-105px)] p-3 pb-24`}>
          
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

          {/* Grid list */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isFav = favorites.includes(product.id);
              return (                <div 
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

        </div>

      </div>
      </div>
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

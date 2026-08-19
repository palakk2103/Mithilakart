require('dotenv').config();
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const { connectRedis, disconnectRedis } = require('../src/config/redis');
const config = require('../src/config');
const { registerProvider } = require('../src/core/providers.registry');
const { LocalStorageProvider } = require('../src/core/providers/LocalStorageProvider');
const { PasswordService } = require('../src/services/PasswordService');
const Category  = require('../src/models/Category');
const Seller    = require('../src/models/Seller');
const Product   = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const { LEGACY_FLOW_TO_TAB } = require('../src/constants/marketplace');
const { PRODUCT_STATUS, COMMERCE_FLOWS } = require('../src/constants/catalog');

const IMG = {
  art:       [{ url:'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=600',alt:'Madhubani Art'},{url:'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600',alt:'Traditional Painting'},{url:'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600',alt:'Handmade Art'}],
  handicraft:[{url:'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600',alt:'Handicraft'},{url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',alt:'Craft Work'},{url:'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600',alt:'Handloom'}],
  grocery:   [{url:'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600',alt:'Fresh Grocery'},{url:'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',alt:'Vegetables'},{url:'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=600',alt:'Fruits'}],
  beauty:    [{url:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',alt:'Beauty Product'},{url:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',alt:'Skincare'},{url:'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',alt:'Cosmetics'}],
  toys:      [{url:'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600',alt:'Games'},{url:'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600',alt:'Learning Toys'},{url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',alt:'Toys'}],
  quickshop: [{url:'https://images.unsplash.com/photo-1601598851547-4302969d0614?w=600',alt:'Quick Shop'},{url:'https://images.unsplash.com/photo-1604719312566-8912e9667d9f?w=600',alt:'Daily Essentials'},{url:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',alt:'Snacks'}],
  jewellery: [{url:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600',alt:'Jewellery'},{url:'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',alt:'Necklace'},{url:'https://images.unsplash.com/photo-1573408301185-9519f94f7a61?w=600',alt:'Bangles'}],
  clothing:  [{url:'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=600',alt:'Ethnic Clothing'},{url:'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600',alt:'Saree'},{url:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',alt:'Kurti'}],
};

const SELLERS = [
  { name:'Ravi Shankar Jha', email:'ravi.seller@mithilakart.com', password:'Seller@123', storeName:'Mithila Art House', phone:'9811111111', addressLine:'Station Road, Darbhanga', city:'Darbhanga', state:'Bihar', pincode:'846001', lat:26.1542, lng:85.8918, mithilakEligible:true, quickCommerceEligible:false, groceryEligible:false, isWarehouse:false, tag:'art' },
  { name:'Priya Kumari', email:'priya.seller@mithilakart.com', password:'Seller@123', storeName:'Priya Beauty & Jewels', phone:'9822222222', addressLine:'Gandhi Chowk, Muzaffarpur', city:'Muzaffarpur', state:'Bihar', pincode:'842001', lat:26.1209, lng:85.3647, mithilakEligible:true, quickCommerceEligible:false, groceryEligible:false, isWarehouse:false, tag:'beauty' },
  { name:'Amit Kumar Singh', email:'amit.seller@mithilakart.com', password:'Seller@123', storeName:'QuickMart Express', phone:'9833333333', addressLine:'Boring Road, Patna', city:'Patna', state:'Bihar', pincode:'800001', lat:25.5941, lng:85.1376, mithilakEligible:false, quickCommerceEligible:true, groceryEligible:true, isWarehouse:false, tag:'quickshop' },
  { name:'Sunita Devi', email:'sunita.seller@mithilakart.com', password:'Seller@123', storeName:'Mithila Handloom & Toys', phone:'9844444444', addressLine:'Laxmi Nagar, Sitamarhi', city:'Sitamarhi', state:'Bihar', pincode:'843301', lat:26.5912, lng:85.4832, mithilakEligible:true, quickCommerceEligible:false, groceryEligible:false, isWarehouse:false, tag:'handicraft' },
  { name:'MK Central Warehouse', email:'warehouse@mithilakart.com', password:'Warehouse@123', storeName:'Mithilakart Central Warehouse', phone:'9800000001', addressLine:'Industrial Area, Patna Sahib', city:'Patna', state:'Bihar', pincode:'800008', lat:25.6200, lng:85.1800, mithilakEligible:true, quickCommerceEligible:true, groceryEligible:true, isWarehouse:true, preparationTimeMinutes:10, fulfillmentRadiusKm:50, tag:'warehouse' },
];

function getProducts(tag, sid, catMap){
  const M=catMap; const C=COMMERCE_FLOWS; const S=PRODUCT_STATUS.APPROVED;
  const mk=M.get('madhubani-art')._id, gr=M.get('groceries')._id, qs=M.get('quick-shop')._id, bt=M.get('beauty')._id, ty=M.get('toys')._id, hc=M.get('handicrafts')._id;
  const maps={
    art:[
      {sku:'RVS-ART-001',title:'Large Madhubani Painting - Fish Motif',description:'Authentic Madhubani fish motif painting on handmade paper by master artisan from Darbhanga.',price:2499,mrp:3499,stock:15,rating:4.8,reviewCount:22,categoryId:mk,flows:[C.MITHILAK,C.STANDARD],brand:'Mithila Art House',tags:['madhubani','painting','fish-motif'],images:IMG.art,catalogKey:'MADHUBANI-FISH-L'},
      {sku:'RVS-ART-002',title:'Madhubani Peacock Painting - A3',description:'Vibrant peacock Madhubani painting with natural colors.',price:1299,mrp:1999,stock:20,rating:4.7,reviewCount:18,categoryId:mk,flows:[C.MITHILAK,C.STANDARD],brand:'Mithila Art House',tags:['madhubani','peacock'],images:[IMG.art[1],IMG.art[2]],catalogKey:'MADHUBANI-PEACOCK-A3'},
      {sku:'RVS-ART-003',title:'Mithila Wedding Ceremony Painting',description:'Traditional Mithila wedding scene depicting Sita Swayamvar.',price:3999,mrp:5999,stock:8,rating:4.9,reviewCount:31,categoryId:mk,flows:[C.MITHILAK],brand:'Mithila Art House',tags:['madhubani','wedding'],images:[IMG.art[0],IMG.art[2]],catalogKey:'MADHUBANI-WEDDING'},
      {sku:'RVS-JWL-001',title:'Mithila Dokra Brass Jewellery Set',description:'Handcrafted Dokra brass necklace + earrings set.',price:899,mrp:1299,stock:25,rating:4.5,reviewCount:14,categoryId:hc,flows:[C.MITHILAK,C.STANDARD],brand:'Mithila Art House',tags:['jewellery','brass','dokra'],images:IMG.jewellery},
      {sku:'RVS-CLT-001',title:'Handloom Mithila Print Dupatta',description:'Hand-woven cotton dupatta with traditional Mithila prints.',price:549,mrp:799,stock:40,rating:4.4,reviewCount:11,categoryId:hc,flows:[C.MITHILAK,C.STANDARD],brand:'Mithila Art House',tags:['handloom','dupatta'],images:IMG.clothing},
    ],
    beauty:[
      {sku:'PRY-BT-001',title:'Kumkumadi Tailam Face Oil - 30ml',description:'Ayurvedic saffron face oil with 24 herbs for radiant glow.',price:699,mrp:999,stock:50,rating:4.7,reviewCount:38,categoryId:bt,flows:[C.STANDARD],brand:'Priya Naturals',tags:['beauty','ayurvedic','face-oil'],images:IMG.beauty,catalogKey:'KUMKUMADI-OIL-30'},
      {sku:'PRY-BT-002',title:'Rose Gold Face Serum - 50ml',description:'Vitamin C brightening serum. Reduces dark spots in 4 weeks.',price:549,mrp:799,stock:65,rating:4.6,reviewCount:52,categoryId:bt,flows:[C.STANDARD],brand:'Priya Naturals',tags:['serum','vitamin-c'],images:[IMG.beauty[1],IMG.beauty[2]]},
      {sku:'PRY-BT-003',title:'Herbal Bhringraj Hair Oil',description:'Traditional Bhringraj oil. Prevents hair fall and promotes growth.',price:299,mrp:450,stock:80,rating:4.5,reviewCount:29,categoryId:bt,flows:[C.STANDARD],brand:'Priya Naturals',tags:['hair-oil','bhringraj'],images:[IMG.beauty[0],IMG.beauty[2]]},
      {sku:'PRY-JWL-001',title:'Lac Bangle Set - 6 Pcs Multicolor',description:'Hand-crafted lac bangles with traditional Bihari patterns.',price:349,mrp:499,stock:45,rating:4.3,reviewCount:17,categoryId:hc,flows:[C.MITHILAK,C.STANDARD],brand:'Priya Jewels',tags:['bangles','lac'],images:IMG.jewellery},
      {sku:'PRY-JWL-002',title:'Oxidised Silver Payal Anklet',description:'Handcrafted oxidised silver payal with ghungroo bells.',price:799,mrp:1199,stock:30,rating:4.6,reviewCount:23,categoryId:hc,flows:[C.MITHILAK,C.STANDARD],brand:'Priya Jewels',tags:['payal','anklet','silver'],images:[IMG.jewellery[1],IMG.jewellery[0]]},
    ],
    quickshop:[
      {sku:'AMT-QS-001',title:'Daily Essentials Starter Kit',description:'Toothpaste, shampoo, soap, hand wash — 30-min delivery.',price:399,mrp:580,stock:100,rating:4.5,reviewCount:44,categoryId:qs,flows:[C.QUICK_SHOP,C.STANDARD],brand:'QuickMart',tags:['essentials','combo'],images:IMG.quickshop,catalogKey:'QS-DAILY-STARTER'},
      {sku:'AMT-QS-002',title:'Instant Snacks Mega Bundle 10 items',description:'Chips, biscuits and namkeen — 10 packs. Party starter.',price:249,mrp:350,stock:150,rating:4.2,reviewCount:61,categoryId:qs,flows:[C.QUICK_SHOP],brand:'QuickMart',tags:['snacks','chips'],images:[IMG.quickshop[2],IMG.quickshop[0]]},
      {sku:'AMT-QS-003',title:'Cold Drink Combo 6 cans',description:'2 Coke + 2 Sprite + 2 Fanta. Chilled and ready.',price:199,mrp:270,stock:90,rating:4.3,reviewCount:28,categoryId:qs,flows:[C.QUICK_SHOP],brand:'QuickMart',tags:['cold-drink','combo'],images:[IMG.quickshop[1],IMG.quickshop[0]]},
      {sku:'AMT-GR-001',title:'Fresh Tomatoes 1kg',description:'Farm-fresh red tomatoes picked daily.',price:49,mrp:70,stock:200,rating:4.4,reviewCount:88,categoryId:gr,flows:[C.FRESH_GROCERY,C.QUICK_SHOP],brand:'Fresh Farm',tags:['vegetables','tomato'],images:IMG.grocery,catalogKey:'FRESH-TOMATO-1KG'},
      {sku:'AMT-GR-002',title:'Organic Toor Dal 1kg',description:'Premium organic toor dal from Bihar farmers.',price:149,mrp:199,stock:120,rating:4.6,reviewCount:35,categoryId:gr,flows:[C.FRESH_GROCERY,C.STANDARD],brand:'Fresh Farm',tags:['dal','organic'],images:[IMG.grocery[1],IMG.grocery[2]],catalogKey:'ORGANIC-TOOR-1KG'},
      {sku:'AMT-GR-003',title:'Basmati Rice Premium 5kg',description:'5-year aged long grain Basmati. Perfect for biryani.',price:649,mrp:850,stock:80,rating:4.7,reviewCount:42,categoryId:gr,flows:[C.FRESH_GROCERY,C.STANDARD],brand:'Fresh Farm',tags:['rice','basmati'],images:[IMG.grocery[0],IMG.grocery[1]],catalogKey:'BASMATI-5KG'},
      {sku:'AMT-GR-MILK-1L',title:'Fresh Cow Milk 1L',description:'Fresh pure cow milk delivered in 25 mins.',price:48,mrp:60,stock:100,rating:4.8,reviewCount:92,categoryId:gr,flows:[C.FRESH_GROCERY,C.QUICK_SHOP],brand:'Mithila Dairy',tags:['milk','dairy','fresh'],images:[{url:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600',alt:'Fresh Milk'}],catalogKey:'FRESH-MILK-1L'},
      {sku:'AMT-GR-POTATO-1KG',title:'Fresh Potato 1kg',description:'Fresh farm potatoes.',price:25,mrp:30,stock:200,rating:4.5,reviewCount:64,categoryId:gr,flows:[C.FRESH_GROCERY,C.QUICK_SHOP],brand:'Fresh Farm',tags:['potato','vegetables'],images:[{url:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',alt:'Fresh Potato'}],catalogKey:'FRESH-POTATO-1KG'},
      {sku:'AMT-QS-LOREAL',title:"L'Oreal Paris Hyaluron Moisture Shampoo 200ml",description:'Hydrating shampoo with hyaluronic acid.',price:225,mrp:230,stock:60,rating:4.3,reviewCount:48,categoryId:bt,flows:[C.QUICK_SHOP,C.STANDARD],brand:"L'Oreal",tags:['shampoo','haircare'],images:[{url:'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600',alt:"L'Oreal Shampoo"}],catalogKey:'LOREAL-SHAMPOO-200'},
      {sku:'AMT-QS-WELLCORE',title:'Wellcore Creatine 122g',description:'Pure micronized creatine monohydrate.',price:530,mrp:699,stock:50,rating:4.5,reviewCount:38,categoryId:qs,flows:[C.QUICK_SHOP,C.STANDARD],brand:'Wellcore',tags:['creatine','supplements'],images:[{url:'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',alt:'Wellcore Creatine'}],catalogKey:'WELLCORE-CREATINE-122'},
      {sku:'AMT-QS-PILGRIM',title:'Pilgrim 10% Niacinamide Serum 30ml',description:'Skin clarifying serum with alpha arbutin.',price:202,mrp:249,stock:75,rating:4.4,reviewCount:56,categoryId:bt,flows:[C.QUICK_SHOP,C.STANDARD],brand:'Pilgrim',tags:['serum','skincare'],images:[{url:'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600',alt:'Pilgrim Serum'}],catalogKey:'PILGRIM-SERUM-30'},
    ],
    handicraft:[
      {sku:'SND-HC-001',title:'Handloom Silk Saree - Mithila Design',description:'Pure silk saree with authentic Mithila motif border.',price:4999,mrp:6999,stock:10,rating:4.8,reviewCount:27,categoryId:hc,flows:[C.MITHILAK,C.STANDARD],brand:'Mithila Handloom',tags:['saree','silk','handloom'],images:IMG.clothing,catalogKey:'SILK-SAREE-MITHILA'},
      {sku:'SND-TY-001',title:'Wooden Hand-Carved Elephant Pair',description:'Handcrafted decorative elephants with Madhubani patterns.',price:799,mrp:1199,stock:30,rating:4.6,reviewCount:19,categoryId:ty,flows:[C.STANDARD],brand:'Mithila Handloom',tags:['wooden','elephant','decor'],images:IMG.toys,catalogKey:'WOODEN-ELEPHANT-PAIR'},
      {sku:'SND-TY-002',title:'Educational Wooden Puzzle 36 Pieces',description:'Eco-friendly puzzle for kids 4-8 years.',price:499,mrp:699,stock:45,rating:4.5,reviewCount:33,categoryId:ty,flows:[C.STANDARD],brand:'PlayCraft Mithila',tags:['puzzle','wooden','kids'],images:[IMG.toys[2],IMG.toys[0]]},
      {sku:'SND-HC-002',title:'Terracotta Diyas Set 12 Pieces',description:'Hand-painted terracotta diyas with Mithila patterns.',price:299,mrp:449,stock:60,rating:4.4,reviewCount:15,categoryId:hc,flows:[C.STANDARD,C.MITHILAK],brand:'Mithila Handloom',tags:['diya','terracotta','diwali'],images:IMG.handicraft},
      {sku:'SND-CLT-001',title:"Men's Khadi Kurta White",description:'Handspun khadi cotton kurta. Breathable and eco-friendly.',price:799,mrp:1199,stock:35,rating:4.3,reviewCount:22,categoryId:hc,flows:[C.STANDARD],brand:'Mithila Handloom',tags:['kurta','khadi','men'],images:[IMG.clothing[2],IMG.clothing[1]]},
    ],
    warehouse:[
      {sku:'WH-ART-001',title:'Large Madhubani Painting - Fish Motif',description:'Warehouse stock — authentic Madhubani fish painting.',price:2499,mrp:3499,stock:200,rating:4.8,reviewCount:5,categoryId:mk,flows:[C.MITHILAK,C.STANDARD],brand:'MK Warehouse',tags:['madhubani','painting'],images:IMG.art,catalogKey:'MADHUBANI-FISH-L'},
      {sku:'WH-ART-002',title:'Madhubani Peacock Painting - A3',description:'Warehouse stock — Madhubani peacock painting.',price:1299,mrp:1999,stock:150,rating:4.7,reviewCount:3,categoryId:mk,flows:[C.MITHILAK,C.STANDARD],brand:'MK Warehouse',tags:['madhubani','peacock'],images:[IMG.art[1],IMG.art[0]],catalogKey:'MADHUBANI-PEACOCK-A3'},
      {sku:'WH-GR-001',title:'Fresh Tomatoes 1kg',description:'Warehouse — fresh tomatoes always in stock.',price:45,mrp:70,stock:500,rating:4.5,reviewCount:10,categoryId:gr,flows:[C.FRESH_GROCERY,C.QUICK_SHOP],brand:'MK Warehouse',tags:['vegetables','tomato'],images:IMG.grocery,catalogKey:'FRESH-TOMATO-1KG'},
      {sku:'WH-GR-002',title:'Organic Toor Dal 1kg',description:'Warehouse organic toor dal. Bulk availability.',price:145,mrp:199,stock:400,rating:4.6,reviewCount:8,categoryId:gr,flows:[C.FRESH_GROCERY,C.STANDARD],brand:'MK Warehouse',tags:['dal','organic'],images:[IMG.grocery[1],IMG.grocery[2]],catalogKey:'ORGANIC-TOOR-1KG'},
      {sku:'WH-GR-003',title:'Basmati Rice Premium 5kg',description:'Warehouse Basmati rice. Bulk stock.',price:640,mrp:850,stock:300,rating:4.7,reviewCount:7,categoryId:gr,flows:[C.FRESH_GROCERY,C.STANDARD],brand:'MK Warehouse',tags:['rice','basmati'],images:[IMG.grocery[0]],catalogKey:'BASMATI-5KG'},
      {sku:'WH-GR-004',title:'Mixed Vegetables Pack 2kg',description:'Potato, onion, carrot, peas seasonal pack.',price:89,mrp:130,stock:250,rating:4.3,reviewCount:12,categoryId:gr,flows:[C.FRESH_GROCERY,C.QUICK_SHOP],brand:'MK Warehouse',tags:['vegetables','mixed'],images:[IMG.grocery[1],IMG.grocery[2]]},
      {sku:'WH-GR-MILK-1L',title:'Fresh Cow Milk 1L',description:'Warehouse fresh milk stock.',price:48,mrp:60,stock:300,rating:4.8,reviewCount:15,categoryId:gr,flows:[C.FRESH_GROCERY,C.QUICK_SHOP],brand:'Mithila Dairy',tags:['milk','dairy','fresh'],images:[{url:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600',alt:'Fresh Milk'}],catalogKey:'FRESH-MILK-1L'},
      {sku:'WH-GR-POTATO-1KG',title:'Fresh Potato 1kg',description:'Warehouse fresh potato stock.',price:25,mrp:30,stock:400,rating:4.5,reviewCount:12,categoryId:gr,flows:[C.FRESH_GROCERY,C.QUICK_SHOP],brand:'Fresh Farm',tags:['potato','vegetables'],images:[{url:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',alt:'Fresh Potato'}],catalogKey:'FRESH-POTATO-1KG'},
      {sku:'WH-QS-LOREAL',title:"L'Oreal Paris Hyaluron Moisture Shampoo 200ml",description:'Warehouse L\'Oreal shampoo stock.',price:225,mrp:230,stock:100,rating:4.3,reviewCount:10,categoryId:bt,flows:[C.QUICK_SHOP,C.STANDARD],brand:"L'Oreal",tags:['shampoo','haircare'],images:[{url:'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600',alt:"L'Oreal Shampoo"}],catalogKey:'LOREAL-SHAMPOO-200'},
      {sku:'WH-QS-WELLCORE',title:'Wellcore Creatine 122g',description:'Warehouse creatine stock.',price:530,mrp:699,stock:80,rating:4.5,reviewCount:8,categoryId:qs,flows:[C.QUICK_SHOP,C.STANDARD],brand:'Wellcore',tags:['creatine','supplements'],images:[{url:'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',alt:'Wellcore Creatine'}],catalogKey:'WELLCORE-CREATINE-122'},
      {sku:'WH-QS-PILGRIM',title:'Pilgrim 10% Niacinamide Serum 30ml',description:'Warehouse Pilgrim serum stock.',price:202,mrp:249,stock:90,rating:4.4,reviewCount:9,categoryId:bt,flows:[C.QUICK_SHOP,C.STANDARD],brand:'Pilgrim',tags:['serum','skincare'],images:[{url:'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600',alt:'Pilgrim Serum'}],catalogKey:'PILGRIM-SERUM-30'},
      {sku:'WH-BT-001',title:'Kumkumadi Tailam Face Oil - 30ml',description:'Warehouse Kumkumadi oil — always stocked.',price:699,mrp:999,stock:200,rating:4.7,reviewCount:6,categoryId:bt,flows:[C.STANDARD],brand:'MK Warehouse',tags:['beauty','face-oil'],images:IMG.beauty,catalogKey:'KUMKUMADI-OIL-30'},
      {sku:'WH-QS-001',title:'Daily Essentials Starter Kit',description:'Warehouse daily essentials bundle.',price:395,mrp:580,stock:300,rating:4.5,reviewCount:9,categoryId:qs,flows:[C.QUICK_SHOP,C.STANDARD],brand:'MK Warehouse',tags:['essentials','combo'],images:IMG.quickshop,catalogKey:'QS-DAILY-STARTER'},
      {sku:'WH-QS-002',title:'Instant Maggi Noodles 12 Pack',description:'12-pack Maggi noodles. Quick comfort food.',price:179,mrp:240,stock:400,rating:4.6,reviewCount:55,categoryId:qs,flows:[C.QUICK_SHOP],brand:'MK Warehouse',tags:['noodles','maggi','instant'],images:[IMG.quickshop[2],IMG.quickshop[1]]},
      {sku:'WH-TY-001',title:'Wooden Hand-Carved Elephant Pair',description:'Warehouse wooden elephant pair.',price:795,mrp:1199,stock:80,rating:4.6,reviewCount:4,categoryId:ty,flows:[C.STANDARD],brand:'MK Warehouse',tags:['wooden','elephant'],images:IMG.toys,catalogKey:'WOODEN-ELEPHANT-PAIR'},
      {sku:'WH-HC-001',title:'Handloom Silk Saree - Mithila Design',description:'Warehouse silk saree stock.',price:4999,mrp:6999,stock:30,rating:4.8,reviewCount:5,categoryId:hc,flows:[C.MITHILAK,C.STANDARD],brand:'MK Warehouse',tags:['saree','silk'],images:IMG.clothing,catalogKey:'SILK-SAREE-MITHILA'},
    ],
  };
  return maps[tag]||[];
}

async function main(){
  await connectDatabase();
  await connectRedis(config);
  registerProvider('storage', new LocalStorageProvider());
  const ps = new PasswordService();
  const catSlugs=['handicrafts','madhubani-art','groceries','quick-shop','beauty','toys'];
  const catMap=new Map();
  for(const slug of catSlugs){
    const c=await Category.findOne({slug});
    if(!c) throw new Error('Category "'+slug+'" not found. Run npm run seed:catalog first.');
    catMap.set(slug,c);
  }
  const summary=[];
  for(const def of SELLERS){
    const ph=await ps.hash(def.password);
    const seller=await Seller.findOneAndUpdate(
      {email:def.email},
      { name:def.name, email:def.email, passwordHash:ph, storeName:def.storeName, phone:def.phone, addressLine:def.addressLine, city:def.city, state:def.state, pincode:def.pincode, latitude:def.lat, longitude:def.lng, location:{type:'Point',coordinates:[def.lng,def.lat]}, status:'active', kycStatus:'approved', mithilakEligible:def.mithilakEligible, quickCommerceEligible:def.quickCommerceEligible, groceryEligible:def.groceryEligible, isWarehouse:def.isWarehouse||false, isAcceptingOrders:true, preparationTimeMinutes:def.preparationTimeMinutes||null, fulfillmentRadiusKm:def.fulfillmentRadiusKm||null, failedLoginAttempts:0, lockUntil:null, deletedAt:null },
      {upsert:true,new:true}
    );
    process.stdout.write('✓ Seller: '+def.name+(def.isWarehouse?' [WAREHOUSE]':'')+'\n');
    const prods=getProducts(def.tag,seller._id,catMap);
    let cnt=0;
    for(const p of prods){
      const savedProd = await Product.findOneAndUpdate(
        {sellerId:seller._id,sku:p.sku},
        { sellerId:seller._id, title:p.title, description:p.description, sku:p.sku, price:p.price, mrp:p.mrp, stock:p.stock, reservedStock:0, categoryId:p.categoryId, status:PRODUCT_STATUS.APPROVED, masterStatus:PRODUCT_STATUS.APPROVED, images:p.images.map((img,i)=>({url:img.url,alt:img.alt,sortOrder:i})), tags:p.tags, commerceFlows:p.flows, rating:p.rating, reviewCount:p.reviewCount, brand:p.brand, catalogKey:p.catalogKey||null, attributes:{}, deletedAt:null },
        {upsert:true,new:true}
      );
      for(const flow of p.flows){
        const tab = LEGACY_FLOW_TO_TAB[flow] || flow;
        await MarketplaceListing.findOneAndUpdate(
          {productId:savedProd._id,marketplaceTab:tab},
          {
            productId:savedProd._id,
            sellerId:seller._id,
            marketplaceTab:tab,
            price:p.price,
            mrp:p.mrp,
            listingStatus:'approved',
            isVisible:true,
            deliveryType:(tab==='quick_shop'||tab==='groceries_fresh')?'fixed_promise':'standard',
            deliveryPromiseMinutes:(tab==='quick_shop'||tab==='groceries_fresh')?25:null,
            publishedAt:new Date(),
            approvedAt:new Date(),
            deletedAt:null,
          },
          {upsert:true,new:true}
        );
      }
      cnt++;
    }
    process.stdout.write('  -> '+cnt+' products seeded for '+def.storeName+'\n');
    summary.push({name:def.name,cnt,isWarehouse:def.isWarehouse||false});
  }
  // Variants for art product
  const artSeller=await Seller.findOne({email:'ravi.seller@mithilakart.com'});
  const artProd=await Product.findOne({sellerId:artSeller._id,sku:'RVS-ART-001'});
  if(artProd){
    await ProductVariant.findOneAndUpdate({sku:'RVS-ART-001-A4'},{productId:artProd._id,name:'A4 Size',sku:'RVS-ART-001-A4',price:2499,mrp:3499,stock:8,attributes:{size:'A4'},isActive:true,deletedAt:null},{upsert:true,new:true});
    await ProductVariant.findOneAndUpdate({sku:'RVS-ART-001-A3'},{productId:artProd._id,name:'A3 Size',sku:'RVS-ART-001-A3',price:1899,mrp:2799,stock:10,attributes:{size:'A3'},isActive:true,deletedAt:null},{upsert:true,new:true});
    process.stdout.write('  -> 2 variants added for Madhubani Fish Painting\n');
  }
  process.stdout.write('\n===============================================\n');
  process.stdout.write('SEED COMPLETE:\n');
  for(const r of summary) process.stdout.write('  '+(r.isWarehouse?'[WH]':'    ')+' '+r.name+' -> '+r.cnt+' products\n');
  process.stdout.write('\nLogin Credentials:\n');
  process.stdout.write('  Art Seller:       ravi.seller@mithilakart.com    / Seller@123\n');
  process.stdout.write('  Beauty Seller:    priya.seller@mithilakart.com   / Seller@123\n');
  process.stdout.write('  QuickShop Seller: amit.seller@mithilakart.com    / Seller@123\n');
  process.stdout.write('  Handicraft Seller:sunita.seller@mithilakart.com  / Seller@123\n');
  process.stdout.write('  Warehouse:        warehouse@mithilakart.com       / Warehouse@123\n');
  process.stdout.write('===============================================\n');
  await disconnectDatabase();
  await disconnectRedis();
}
main().catch(e=>{process.stderr.write('ERROR: '+e.message+'\n'+e.stack+'\n');process.exit(1);});

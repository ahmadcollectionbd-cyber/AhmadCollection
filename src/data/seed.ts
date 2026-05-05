import type { Banner, Category, Coupon, Product } from '../types';

export const categories: Category[] = [
  {
    id: 'cat-honey',
    slug: 'honey',
    name: 'Honey',
    nameBn: 'খাঁটি মধু',
    image: 'https://images.unsplash.com/photo-1668510468038-3607aae3f03c?w=600&q=80',
  },
  {
    id: 'cat-honeycomb',
    slug: 'honeycomb',
    name: 'Raw Honeycomb',
    nameBn: 'মৌচাক',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Apis_mellifera_carnica_worker_honeycomb_2.jpg/960px-Apis_mellifera_carnica_worker_honeycomb_2.jpg',
  },
  {
    id: 'cat-khejur-gur',
    slug: 'khejur-gur',
    name: 'Khejur Gur',
    nameBn: 'খেজুর গুড়',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Jaggery_in_Bangladesh.jpg/960px-Jaggery_in_Bangladesh.jpg',
  },
  {
    id: 'cat-mustard',
    slug: 'mustard-oil',
    name: 'Mustard Oil',
    nameBn: 'সরিষার তেল',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Mustard_Oil_%26_Seeds_-_Kolkata_2003-10-31_00537.JPG/960px-Mustard_Oil_%26_Seeds_-_Kolkata_2003-10-31_00537.JPG',
  },
  {
    id: 'cat-ghee',
    slug: 'ghee',
    name: 'Ghee',
    nameBn: 'খাঁটি ঘি',
    image: 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=600&q=80',
  },
  {
    id: 'cat-mango',
    slug: 'mango',
    name: 'Satkhira Mango',
    nameBn: 'সাতক্ষীরার আম',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Mango_Bangladesh_14.jpg/960px-Mango_Bangladesh_14.jpg',
  },
  {
    id: 'cat-attar',
    slug: 'attar',
    name: 'Premium Attar',
    nameBn: 'আতর',
    image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=80',
  },
  {
    id: 'cat-dates',
    slug: 'dates',
    name: 'Dates & Dry Fruits',
    nameBn: 'খেজুর ও ড্রাই ফ্রুটস',
    image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80',
  },
];

const now = Date.now();

export const products: Product[] = [
  // ─── Honey ───────────────────────────────────────────────
  {
    id: 'p-1',
    slug: 'sundarban-natural-honey-1kg',
    name: 'Sundarbans Natural Honey — 1kg',
    nameBn: 'সুন্দরবনের প্রাকৃতিক মধু — ১ কেজি',
    description:
      'Pure raw honey collected from the mangroves of the Sundarbans. Naturally sweet, rich in antioxidants, and untouched by heat or processing — exactly the way nature made it.',
    descriptionBn:
      'সুন্দরবনের গভীর জঙ্গল থেকে সংগৃহীত খাঁটি কাঁচা মধু। প্রাকৃতিকভাবে মিষ্টি, অ্যান্টিঅক্সিডেন্টে ভরপুর — কোনো তাপ বা প্রক্রিয়াজাতকরণ ছাড়াই বোতলজাত।',
    price: 1200,
    comparePrice: 1500,
    images: [
      'https://images.unsplash.com/photo-1668510468038-3607aae3f03c?w=900&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=900&q=80',
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=900&q=80',
    ],
    categoryIds: ['cat-honey'],
    stock: 60,
    sku: 'AC-HN-SB1',
    rating: 4.9,
    reviewsCount: 256,
    featured: true,
    bestseller: true,
    specifications: [
      { key: 'Weight', value: '1 kg' },
      { key: 'Source', value: 'Sundarbans, Bangladesh' },
      { key: 'Type', value: 'Raw, unprocessed' },
      { key: 'Shelf life', value: '24 months' },
    ],
    tags: ['honey', 'sundarbans', 'natural', 'raw'],
    createdAt: now - 86400000 * 8,
    updatedAt: now,
  },
  {
    id: 'p-2',
    slug: 'mustard-flower-honey-500g',
    name: 'Mustard Flower Honey — 500g',
    nameBn: 'সরিষা ফুলের মধু — ৫০০ গ্রাম',
    description:
      'Light golden honey from mustard blossoms. Mildly sweet with a smooth, buttery finish. Perfect for tea, breakfasts, and daily wellness.',
    price: 550,
    comparePrice: 700,
    images: [
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=900&q=80',
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=900&q=80',
    ],
    categoryIds: ['cat-honey'],
    stock: 100,
    sku: 'AC-HN-MF5',
    rating: 4.8,
    reviewsCount: 142,
    featured: true,
    specifications: [
      { key: 'Weight', value: '500g' },
      { key: 'Source', value: 'Mustard fields, Satkhira' },
      { key: 'Process', value: 'Cold-extracted' },
    ],
    tags: ['honey', 'mustard'],
    createdAt: now - 86400000 * 15,
    updatedAt: now - 86400000 * 1,
  },

  // ─── Honeycomb ───────────────────────────────────────────
  {
    id: 'p-3',
    slug: 'wild-honeycomb-500g',
    name: 'Wild Honeycomb (Mou-chak) — 500g',
    nameBn: 'বনফুলের মৌচাক — ৫০০ গ্রাম',
    description:
      'Real wild honeycomb straight from the hive — chew the comb, feel the nectar burst. The ultimate raw honey experience, hand-collected from mango orchards.',
    descriptionBn:
      'একদম মৌচাক সহ আসল বনফুলের মধু। চাক ভেঙে চিবিয়ে খেলেই মুখে নেমে আসে প্রকৃতির স্বাদ। সরাসরি আম বাগান থেকে সংগৃহীত।',
    price: 800,
    comparePrice: 1000,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Apis_mellifera_carnica_worker_honeycomb_2.jpg/1280px-Apis_mellifera_carnica_worker_honeycomb_2.jpg',
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=900&q=80',
    ],
    categoryIds: ['cat-honeycomb'],
    stock: 25,
    sku: 'AC-HC-500',
    rating: 5.0,
    reviewsCount: 88,
    featured: true,
    bestseller: true,
    specifications: [
      { key: 'Weight', value: '500g (with wax comb)' },
      { key: 'Type', value: '100% raw, hive-direct' },
      { key: 'Origin', value: 'Mango orchards, Satkhira' },
    ],
    tags: ['honey', 'honeycomb', 'raw'],
    createdAt: now - 86400000 * 4,
    updatedAt: now,
  },

  // ─── Khejur Gur ──────────────────────────────────────────
  {
    id: 'p-4',
    slug: 'patali-khejur-gur-1kg',
    name: 'Patali Khejur Gur — 1kg',
    nameBn: 'পাটালি খেজুর গুড় — ১ কেজি',
    description:
      'Authentic winter date palm jaggery from the villages of Jashore and Satkhira. Slow-boiled in earthen pans for that deep caramel aroma — the soul of Bengali winter sweets.',
    descriptionBn:
      'যশোর-সাতক্ষীরা অঞ্চলের খাঁটি শীতের পাটালি খেজুর গুড়। মাটির পাত্রে ধীরে ধীরে জ্বাল দিয়ে তৈরি — পিঠা, পায়েস বা চায়ে খেলে অসাধারণ স্বাদ।',
    price: 480,
    comparePrice: 600,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Jaggery_in_Bangladesh.jpg/1280px-Jaggery_in_Bangladesh.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Jaggery_in_Bangladesh.jpg/960px-Jaggery_in_Bangladesh.jpg',
    ],
    categoryIds: ['cat-khejur-gur'],
    stock: 80,
    sku: 'AC-GR-PT1',
    rating: 4.9,
    reviewsCount: 194,
    featured: true,
    bestseller: true,
    specifications: [
      { key: 'Weight', value: '1 kg' },
      { key: 'Origin', value: 'Jashore-Satkhira' },
      { key: 'Type', value: 'Patali (solid block)' },
      { key: 'Season', value: 'Winter harvest' },
    ],
    tags: ['gur', 'jaggery', 'winter'],
    createdAt: now - 86400000 * 30,
    updatedAt: now - 86400000 * 2,
  },
  {
    id: 'p-5',
    slug: 'jhola-khejur-gur-1kg',
    name: 'Jhola Khejur Gur (Liquid) — 1kg',
    nameBn: 'ঝোলা খেজুর গুড় — ১ কেজি',
    description:
      'Pourable liquid date palm jaggery — fragrant, dark, and versatile. Drizzle on rice cakes, mix with milk, or bake into desserts.',
    price: 450,
    comparePrice: 550,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Sweet_sap_from_date_palm.JPG/960px-Sweet_sap_from_date_palm.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Jaggery_in_Bangladesh.jpg/960px-Jaggery_in_Bangladesh.jpg',
    ],
    categoryIds: ['cat-khejur-gur'],
    stock: 50,
    sku: 'AC-GR-JH1',
    rating: 4.8,
    reviewsCount: 76,
    specifications: [
      { key: 'Weight', value: '1 kg' },
      { key: 'Type', value: 'Liquid jaggery' },
    ],
    tags: ['gur', 'jaggery', 'liquid'],
    createdAt: now - 86400000 * 20,
    updatedAt: now - 86400000 * 5,
  },

  // ─── Mustard Oil ─────────────────────────────────────────
  {
    id: 'p-6',
    slug: 'pure-mustard-oil-1l',
    name: 'Pure Mustard Oil — 1L',
    nameBn: 'খাঁটি সরিষার তেল — ১ লিটার',
    description:
      'Cold-pressed pure mustard oil from premium Bangladeshi mustard seeds. Sharp aroma, golden colour, and 100% natural — no preservatives, no chemicals.',
    descriptionBn:
      'প্রিমিয়াম বাংলাদেশি সরিষা থেকে কাঠের ঘানিতে ভাঙানো খাঁটি সরিষার তেল। ঝাঁঝালো ঘ্রাণ, সোনালি রঙ — কোনো প্রিজারভেটিভ নেই।',
    price: 320,
    comparePrice: 380,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Mustard_Oil_%26_Seeds_-_Kolkata_2003-10-31_00537.JPG/1280px-Mustard_Oil_%26_Seeds_-_Kolkata_2003-10-31_00537.JPG',
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900&q=80',
    ],
    categoryIds: ['cat-mustard'],
    stock: 200,
    sku: 'AC-MO-1L',
    rating: 4.8,
    reviewsCount: 312,
    featured: true,
    bestseller: true,
    specifications: [
      { key: 'Volume', value: '1 Litre' },
      { key: 'Type', value: 'Cold-pressed (kacchi ghani)' },
      { key: 'Origin', value: 'Bangladesh' },
    ],
    tags: ['mustard', 'oil', 'organic'],
    createdAt: now - 86400000 * 12,
    updatedAt: now - 86400000 * 1,
  },

  // ─── Ghee ────────────────────────────────────────────────
  {
    id: 'p-7',
    slug: 'pure-cow-ghee-500g',
    name: 'Pure Cow Ghee — 500g',
    nameBn: 'খাঁটি গরুর ঘি — ৫০০ গ্রাম',
    description:
      'Hand-churned ghee made from grass-fed cow milk using the traditional bilona method. Rich, golden and deeply aromatic.',
    price: 850,
    comparePrice: 950,
    images: [
      'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=900&q=80',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Cream_to_get_clarified_butter_home_made.Ghee.jpg/960px-Cream_to_get_clarified_butter_home_made.Ghee.jpg',
    ],
    categoryIds: ['cat-ghee'],
    stock: 40,
    sku: 'AC-GH-500',
    rating: 4.7,
    reviewsCount: 96,
    featured: true,
    specifications: [
      { key: 'Weight', value: '500g' },
      { key: 'Source', value: 'Grass-fed cow milk' },
      { key: 'Process', value: 'Bilona / hand-churned' },
    ],
    tags: ['ghee', 'dairy'],
    createdAt: now - 86400000 * 20,
    updatedAt: now - 86400000 * 2,
  },

  // ─── Mango (Seasonal) ────────────────────────────────────
  {
    id: 'p-8',
    slug: 'satkhira-himsagar-mango-5kg',
    name: 'Satkhira Himsagar Mango — 5kg',
    nameBn: 'সাতক্ষীরার হিমসাগর আম — ৫ কেজি',
    description:
      'King of mangoes from Satkhira — Himsagar. Naturally ripened, fibre-free, sweet and aromatic. Picked from our family orchards and shipped fresh.',
    descriptionBn:
      'সাতক্ষীরার আমের রাজা হিমসাগর। প্রাকৃতিকভাবে পাকা, আঁশহীন, রসালো ও সুমিষ্ট। আমাদের নিজস্ব বাগান থেকে সরাসরি।',
    price: 950,
    comparePrice: 1200,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Mango_Bangladesh_14.jpg/1280px-Mango_Bangladesh_14.jpg',
      'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=900&q=80',
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=900&q=80',
    ],
    categoryIds: ['cat-mango'],
    stock: 0,
    sku: 'AC-MG-HS5',
    rating: 4.9,
    reviewsCount: 480,
    featured: true,
    bestseller: true,
    specifications: [
      { key: 'Variety', value: 'Himsagar' },
      { key: 'Weight', value: '5 kg' },
      { key: 'Origin', value: 'Satkhira' },
      { key: 'Availability', value: 'Pre-order for May–June' },
    ],
    tags: ['mango', 'seasonal', 'satkhira'],
    createdAt: now - 86400000 * 60,
    updatedAt: now - 86400000 * 3,
  },
  {
    id: 'p-9',
    slug: 'satkhira-langra-mango-5kg',
    name: 'Satkhira Langra Mango — 5kg',
    nameBn: 'সাতক্ষীরার ল্যাংড়া আম — ৫ কেজি',
    description:
      'Langra mango — distinctive flavour, juicy, and fibre-free. Naturally ripened on the tree, no carbide.',
    price: 850,
    comparePrice: 1050,
    images: [
      'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=900&q=80',
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=900&q=80',
    ],
    categoryIds: ['cat-mango'],
    stock: 0,
    sku: 'AC-MG-LG5',
    rating: 4.8,
    reviewsCount: 220,
    specifications: [
      { key: 'Variety', value: 'Langra' },
      { key: 'Weight', value: '5 kg' },
      { key: 'Origin', value: 'Satkhira' },
    ],
    tags: ['mango', 'seasonal'],
    createdAt: now - 86400000 * 60,
    updatedAt: now - 86400000 * 3,
  },

  // ─── Attar ───────────────────────────────────────────────
  {
    id: 'p-10',
    slug: 'premium-attar-set-4',
    name: 'Premium Attar Gift Set (4 pcs)',
    nameBn: 'প্রিমিয়াম আতর গিফট সেট (৪ পিস)',
    description:
      'A curated collection of four premium attars — Madinatul Munawwarah, Oud Royal, White Musk and Jannatul Firdous. Long-lasting, alcohol-free fragrance.',
    descriptionBn:
      'চারটি প্রিমিয়াম আতরের বিশেষ সংগ্রহ — মদিনাতুল মুনাওয়ারা, ঊদ রয়েল, হোয়াইট মাস্ক ও জান্নাতুল ফেরদাউস। দীর্ঘস্থায়ী, অ্যালকোহল-মুক্ত।',
    price: 1500,
    comparePrice: 2000,
    images: [
      'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=900&q=80',
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=900&q=80',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=900&q=80',
    ],
    categoryIds: ['cat-attar'],
    stock: 35,
    sku: 'AC-AT-SET4',
    rating: 4.9,
    reviewsCount: 168,
    featured: true,
    bestseller: true,
    specifications: [
      { key: 'Pieces', value: '4 × 6ml' },
      { key: 'Type', value: 'Alcohol-free oil-based attar' },
      { key: 'Origin', value: 'Imported / Bangladesh' },
    ],
    tags: ['attar', 'perfume', 'gift', 'islamic'],
    createdAt: now - 86400000 * 7,
    updatedAt: now - 86400000 * 1,
  },
  {
    id: 'p-11',
    slug: 'madinatul-munawwarah-attar-12ml',
    name: 'Madinatul Munawwarah Attar — 12ml',
    nameBn: 'মদিনাতুল মুনাওয়ারা আতর — ১২ মিলি',
    description:
      'Sacred fragrance reminiscent of Madinah — soft floral with notes of oud and rose. A timeless attar for prayer and special occasions.',
    price: 600,
    comparePrice: 800,
    images: [
      'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=900&q=80',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=900&q=80',
    ],
    categoryIds: ['cat-attar'],
    stock: 75,
    sku: 'AC-AT-MM12',
    rating: 4.8,
    reviewsCount: 92,
    specifications: [
      { key: 'Volume', value: '12 ml' },
      { key: 'Type', value: 'Oil-based, alcohol-free' },
    ],
    tags: ['attar', 'islamic'],
    createdAt: now - 86400000 * 14,
    updatedAt: now - 86400000 * 4,
  },

  // ─── Dates & Dry Fruits ──────────────────────────────────
  {
    id: 'p-12',
    slug: 'mariami-dates-1kg',
    name: 'Premium Mariami Dates — 1kg',
    nameBn: 'প্রিমিয়াম মরিয়ম খেজুর — ১ কেজি',
    description:
      'Soft, juicy Mariami dates from Iran. Naturally sweet, packed with fibre and energy — perfect for iftar or daily snacking.',
    price: 950,
    comparePrice: 1200,
    images: [
      'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=900&q=80',
      'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=900&q=80',
    ],
    categoryIds: ['cat-dates'],
    stock: 60,
    sku: 'AC-DT-MM1',
    rating: 4.9,
    reviewsCount: 188,
    featured: true,
    bestseller: true,
    specifications: [
      { key: 'Weight', value: '1 kg' },
      { key: 'Origin', value: 'Iran' },
      { key: 'Variety', value: 'Mariami' },
    ],
    tags: ['dates', 'iftar', 'ramadan'],
    createdAt: now - 86400000 * 6,
    updatedAt: now,
  },
  {
    id: 'p-13',
    slug: 'mixed-dry-fruits-500g',
    name: 'Premium Mixed Dry Fruits — 500g',
    nameBn: 'প্রিমিয়াম মিক্সড ড্রাই ফ্রুটস — ৫০০ গ্রাম',
    description:
      'A premium mix of almonds, cashews, walnuts, pistachios and raisins. Lightly roasted — perfect for snacking and gifting.',
    price: 850,
    comparePrice: 1100,
    images: [
      'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=900&q=80',
      'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=900&q=80',
    ],
    categoryIds: ['cat-dates'],
    stock: 90,
    sku: 'AC-DF-MIX',
    rating: 4.8,
    reviewsCount: 142,
    bestseller: true,
    specifications: [
      { key: 'Weight', value: '500g' },
      { key: 'Mix', value: 'Almond, cashew, walnut, pistachio, raisin' },
    ],
    tags: ['nuts', 'snacks', 'gift'],
    createdAt: now - 86400000 * 10,
    updatedAt: now,
  },
];

export const banners: Banner[] = [
  {
    id: 'b-1',
    title: 'খাঁটি ও বিশুদ্ধ পণ্য',
    subtitle: 'Premium quality products from Ahmad Collection',
    image: '/banners/founder-mustard.jpg',
    fitMode: 'cover',
    imagePosition: 'top',
    ctaLabel: 'এখনই কিনুন',
    ctaHref: '/shop',
    active: true,
    order: 1,
  },
  {
    id: 'b-3',
    title: 'খাঁটি খেজুর গুড়',
    subtitle: 'Hand-collected winter date palm jaggery in traditional clay pots',
    image: '/banners/founder-gur-pots.jpg',
    fitMode: 'cover',
    imagePosition: 'top',
    ctaLabel: 'Shop Khejur Gur',
    ctaHref: '/shop?cat=khejur-gur',
    active: true,
    order: 2,
  },
  {
    id: 'b-4',
    title: 'সাতক্ষীরার আম',
    subtitle: 'Pre-order naturally-ripened Himsagar, Langra & Amrupali — no carbide',
    image: '/banners/founder-mangoes.jpg',
    fitMode: 'cover',
    imagePosition: 'top',
    ctaLabel: 'Pre-order Mangoes',
    ctaHref: '/shop?cat=mango',
    active: true,
    order: 3,
  },
  {
    id: 'b-5',
    title: 'প্রিমিয়াম খেজুর ও আতর',
    subtitle: 'Imported Mariami dates and long-lasting alcohol-free attar collection',
    image: '/banners/founder-dates.jpg',
    fitMode: 'cover',
    imagePosition: 'top',
    ctaLabel: 'Shop Dates & Attar',
    ctaHref: '/shop?cat=dates',
    active: true,
    order: 4,
  },
];

export const coupons: Coupon[] = [
  { id: 'c-1', code: 'WELCOME10', type: 'percent', value: 10, active: true, minOrder: 500 },
  { id: 'c-2', code: 'FREESHIP', type: 'flat', value: 70, active: true, minOrder: 800 },
  { id: 'c-3', code: 'AHMAD50', type: 'flat', value: 50, active: true, minOrder: 300 },
];

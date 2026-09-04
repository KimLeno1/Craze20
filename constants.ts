
import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Midnight Cyber Cloak',
    price: 850,
    originalPrice: 1200,
    // Added shippingFee to satisfy Product interface
    shippingFee: 45,
    category: 'Apparel',
    gender: 'UNISEX',
    image: '/img1.webp',
    images: ['/img1.webp'],
    description: 'Limited edition technical outerwear with integrated fiber-optic lining.',
    details: ['Water-resistant tech shell', 'Oversized silhouette', 'Serial numbered #001-100'],
    inStock: true,
    isNew: true,
    viewers: 124,
    stockCount: 3,
    synergyPath: 'CYBER',
    appeal: 'STREETS',
    brand: 'NEO-TECH',
    tags: ['CYBER', 'TECHWEAR', 'POWER'],
    sizes: ['S', 'M', 'L', 'XL'],
    colorVariants: [
      { main: '#000000', secondary: '#00D1FF' },
      { main: '#000000', secondary: '#FF00FF' },
      { main: '#FFFFFF', secondary: '#00D1FF' }
    ]
  },
  {
    id: '2',
    name: 'Neon Glitch Sneakers',
    price: 350,
    originalPrice: 450,
    // Added shippingFee to satisfy Product interface
    shippingFee: 25,
    category: 'Accessories',
    gender: 'UNISEX',
    image: '/img2.webp',
    images: ['/img2.webp'],
    description: 'Deconstructed footwear featuring reactive "Glitch" sole technology.',
    details: ['Recycled mesh upper', 'Impact-ready sole', 'UV-responsive laces'],
    inStock: true,
    viewers: 89,
    stockCount: 12,
    synergyPath: 'CYBER',
    appeal: 'STREETS',
    brand: 'GLITCH',
    tags: ['CYBER', 'STREETWEAR'],
    sizes: ['38', '40', '42', '44'],
    colorVariants: [
      { main: '#BDFF00', secondary: '#000000' },
      { main: '#FF00FF', secondary: '#000000' }
    ]
  },
  {
    id: '3',
    name: 'Holographic Utility Vest',
    price: 220,
    originalPrice: 300,
    // Added shippingFee to satisfy Product interface
    shippingFee: 20,
    category: 'Apparel',
    gender: 'MALE',
    image: '/img3.webp',
    images: ['/img3.webp'],
    description: 'Modular storage solution with iridescent structural panels.',
    details: ['8 tactical compartments', 'Adjustable harness', 'Reflective finish'],
    inStock: true,
    isNew: true,
    viewers: 56,
    stockCount: 5,
    synergyPath: 'LUXE',
    appeal: 'CASUAL',
    brand: 'NEO-TECH',
    tags: ['CYBER', 'POWER', 'UTILITY'],
    sizes: ['S', 'M', 'L']
  },
  {
    id: '4',
    name: 'Liquid Chrome Mini Bag',
    price: 195,
    originalPrice: 250,
    // Added shippingFee to satisfy Product interface
    shippingFee: 15,
    category: 'Accessories',
    gender: 'FEMALE',
    image: '/img1.webp',
    images: ['/img1.webp'],
    description: 'Sculptural accessory finished in vacuum-plated high-shine silver.',
    details: ['Full grain leather interior', 'Magnetic closure', 'Detachable chain'],
    inStock: true,
    viewers: 212,
    stockCount: 2,
    synergyPath: 'VOID',
    appeal: 'OLD MONEY',
    brand: 'CHROME-LUXE',
    tags: ['CLASSIC', 'LUXE', 'POWER'],
    sizes: ['OS']
  },
  {
    id: '5',
    name: 'Titanium Link Choker',
    price: 145,
    originalPrice: 190,
    // Added shippingFee to satisfy Product interface
    shippingFee: 10,
    category: 'Accessories',
    gender: 'UNISEX',
    image: '/img2.webp',
    images: ['/img2.webp'],
    description: 'Heavyweight industrial chain designed for the modern metropolitan.',
    details: ['Aircraft grade titanium', 'Laser engraved logo', 'Quick-release clasp'],
    inStock: false,
    viewers: 15,
    stockCount: 0,
    synergyPath: 'VOID',
    appeal: 'STREETS',
    brand: 'TITAN-IND',
    tags: ['VOID', 'INDUSTRIAL'],
    sizes: ['OS']
  },
  {
    id: '6',
    name: 'Void Fragrance No. 01',
    price: 120,
    originalPrice: 150,
    // Added shippingFee to satisfy Product interface
    shippingFee: 15,
    category: 'Beauty',
    gender: 'UNISEX',
    image: '/img3.webp',
    images: ['/img3.webp'],
    description: 'Notes of cold metal, ozone, and dark cedar.',
    details: ['100ml Parfum', 'Limited glass vessel', 'Sustainably sourced'],
    inStock: true,
    viewers: 34,
    stockCount: 45,
    synergyPath: 'VOID',
    appeal: 'OLD MONEY',
    brand: 'VOID-ESSENCE',
    tags: ['OLD MONEY', 'CLASSIC', 'VOID'],
    sizes: ['100ML']
  },
  {
    id: '101',
    name: 'Smartwatch H1',
    price: 500,
    originalPrice: 600,
    shippingFee: 30,
    category: 'Electronics',
    gender: 'UNISEX',
    image: '/img1.webp',
    images: ['/img1.webp'],
    description: 'Advanced wearable technology.',
    details: ['Heart rate monitor', 'GPS', 'Long battery life'],
    inStock: true,
    viewers: 50,
    stockCount: 10,
    synergyPath: 'CYBER',
    appeal: 'STREETS',
    brand: 'TECH-X',
    tags: ['ELECTRONICS', 'CYBER'],
    sizes: ['OS']
  },
  {
    id: '102',
    name: 'Organic Cotton Tee',
    price: 150,
    originalPrice: 200,
    shippingFee: 15,
    category: 'Apparel',
    gender: 'UNISEX',
    image: '/img2.webp',
    images: ['/img2.webp'],
    description: 'Premium organic cotton tee.',
    details: ['100% Cotton', 'Breathable', 'Relaxed fit'],
    inStock: true,
    viewers: 30,
    stockCount: 20,
    synergyPath: 'VOID',
    appeal: 'CASUAL',
    brand: 'COTTON-CO',
    tags: ['APPAREL', 'MINIMALIST'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: '103',
    name: 'Noise Cancelling Headphones',
    price: 800,
    originalPrice: 1000,
    shippingFee: 50,
    category: 'Electronics',
    gender: 'UNISEX',
    image: '/img3.webp',
    images: ['/img3.webp'],
    description: 'Immersive sound experience.',
    details: ['Active noise cancelling', 'Bluetooth 5.0', '40-hour playtime'],
    inStock: true,
    viewers: 100,
    stockCount: 5,
    synergyPath: 'LUXE',
    appeal: 'OLD MONEY',
    brand: 'AUDIO-TECH',
    tags: ['ELECTRONICS', 'LUXE'],
    sizes: ['OS']
  }
];


export const CATEGORY_GROUPS: Record<string, string[]> = {
  'Apparel': ["Men's Clothing", "Women's Clothing", "Women's Lingerie & Lounge", "Women's Curve Clothing", "Apparel", "Shorts", "Trousers"],
  'Footwear': ["Men's Shoes", "Women's Shoes", "Footwear"],
  'Accessories': ["Accessories", "Fragments"],
  'Beauty': ["Beauty"],
  'Kits': ["Kits", "Bundles"]
};

export const APP_CATEGORIES = [
  { id: 'Apparel', label: 'Apparel', img: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=600', inspiration: "ARCHIVE_CLOTHING_CORE" },
  { id: 'Footwear', label: 'Footwear', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600', inspiration: "ARCHIVE_FOOTWEAR_CORE" },
  { id: 'Accessories', label: 'Accessories', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600', inspiration: "ARCHIVE_ACCESSORY_CORE" },
  { id: 'Beauty', label: 'Beauty', img: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=80&w=600', inspiration: "ARCHIVE_BEAUTY_CORE" },
  { id: 'Kits', label: 'Kits & Bundles', img: 'https://images.unsplash.com/photo-1549463591-147604343e39?auto=format&fit=crop&q=80&w=600', inspiration: "ARCHIVE_KIT_CORE" },
];

export const PATHS = [
  {
    id: 'CYBER',
    name: 'The Style Vanguard',
    icon: '⚡',
    color: 'from-pink-500 to-purple-600',
    description: 'Master of technical silhouettes and neon aesthetics.',
    perks: ['+15% XP on Cyber drops', 'Exclusive "Vanguard" Badge', 'Priority access to tech-wear']
  },
  {
    id: 'LUXE',
    name: 'The Ethereal Heir',
    icon: '💎',
    color: 'from-blue-400 to-indigo-600',
    description: 'Signals status through sculpted silk and quiet luxury.',
    perks: ['-10% Gem cost in Vault', 'VIP Lounge Access', 'Status multiplier']
  },
  {
    id: 'VOID',
    name: 'The Void Minimalist',
    icon: '🌑',
    color: 'from-zinc-700 to-black',
    description: 'Power through form and the absence of noise.',
    perks: ['Unique "Void" shader', 'Rare material discovery', 'Form-over-function bonus']
  }
];

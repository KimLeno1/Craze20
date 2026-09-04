
import { Product, Bundle, PriceAnomaly, Order, OrderStatus } from './types';
import { MOCK_PRODUCTS } from './constants';

export const EXTENDED_PRODUCTS: Product[] = MOCK_PRODUCTS.map(p => ({
  ...p,
  velocityScore: Math.floor(Math.random() * 100)
}));

export const MOCK_BUNDLES: Bundle[] = [
  {
    id: 'b1',
    name: 'Neon Night-Runner Kit',
    description: 'A synergy of three stealth pieces designed for high-speed aesthetics.',
    products: [EXTENDED_PRODUCTS[0], EXTENDED_PRODUCTS[1], EXTENDED_PRODUCTS[4]],
    bundlePrice: 999,
    expiresIn: 3600
  },
  {
    id: 'b2',
    name: 'Void Minimalist Pack',
    description: 'The essence of nothingness. Curated by the Void Architect.',
    products: [EXTENDED_PRODUCTS[3], EXTENDED_PRODUCTS[5]],
    bundlePrice: 280,
    expiresIn: 7200
  }
];

export const MOCK_PRICE_ANOMALIES: PriceAnomaly[] = [
  {
    ...EXTENDED_PRODUCTS[2],
    productId: EXTENDED_PRODUCTS[2].id,
    anomalyEndTime: Date.now() + 900000, // 15 mins
    discountPercent: 40
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-7721-XT',
    userId: 'u1',
    userName: 'Viper_X',
    items: [{ ...EXTENDED_PRODUCTS[0], quantity: 1 }],
    total: 850,
    status: OrderStatus.PROCESSING,
    timestamp: '2025-05-10T14:22:00Z',
    deliveryAddress: 'Sector 7, Neo Tokyo Central'
  },
  {
    id: 'ORD-7719-XP',
    userId: 'u2',
    userName: 'Ghost_Shell',
    items: [{ ...EXTENDED_PRODUCTS[1], quantity: 2 }, { ...EXTENDED_PRODUCTS[3], quantity: 1 }],
    total: 895,
    status: OrderStatus.SHIPPED,
    timestamp: '2025-05-09T09:45:00Z',
    trackingNumber: 'TRACK-CC-99281-Z',
    deliveryAddress: 'Void District, Neo Berlin'
  },
  {
    id: 'ORD-7715-LV',
    userId: 'u3',
    userName: 'Luxe_Lord',
    items: [{ ...EXTENDED_PRODUCTS[2], quantity: 1 }],
    total: 220,
    status: OrderStatus.DELIVERED,
    timestamp: '2025-05-08T18:30:00Z',
    trackingNumber: 'TRACK-CC-88122-A',
    deliveryAddress: 'Emerald Heights, Neo Seoul'
  }
];

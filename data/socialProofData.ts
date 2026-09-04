
import { SocialEvent, RegionalScarcity } from '../types';

export const LIVE_SOCIAL_FEED: SocialEvent[] = [
  { id: 'ev1', type: 'PURCHASE', user: 'Viper_X', productName: 'Midnight Cyber Cloak', location: 'Accra Sector', timestamp: '2m ago' },
  { id: 'ev2', type: 'RESERVE', user: 'Ghost_Shell', productName: 'Neon Glitch Sneakers', location: 'Neo Berlin', timestamp: '5m ago' },
  { id: 'ev3', type: 'LEVEL_UP', user: 'Chrome_Heart', location: 'District 9', timestamp: '12m ago' },
  { id: 'ev4', type: 'ARENA_WIN', user: 'Neon_Rebel', location: 'The Virtual Void', timestamp: '15m ago' },
  { id: 'ev5', type: 'PURCHASE', user: 'Satoshi_N', productName: 'Liquid Chrome Mini Bag', location: 'Neo Seoul', timestamp: '18m ago' },
  { id: 'ev6', type: 'RESERVE', user: 'Mod_Goddess', productName: 'Holographic Utility Vest', location: 'London Sector 4', timestamp: '22m ago' },
  { id: 'ev7', type: 'LEVEL_UP', user: 'Rogue_Stylist', location: 'Kyoto Labs', timestamp: '30m ago' },
];

export const REGIONAL_STOCK_MAP: RegionalScarcity[] = [
  { productId: '1', region: 'Accra', stockLevel: 'CRITICAL', unitsLeft: 2 },
  { productId: '1', region: 'Neo Berlin', stockLevel: 'LOW', unitsLeft: 5 },
  { productId: '2', region: 'Neo Seoul', stockLevel: 'STABLE', unitsLeft: 12 },
  { productId: '4', region: 'District 9', stockLevel: 'CRITICAL', unitsLeft: 1 },
  { productId: '3', region: 'Paris Mesh', stockLevel: 'LOW', unitsLeft: 3 },
];

export const PSYCHOLOGICAL_TRIGGERS = {
  SCARCITY: [
    "Only 2 units remain in your sector.",
    "Reserved by 14 other archivers right now.",
    "This silhouette will not be re-archived.",
    "94% of available stock in the region is gone."
  ],
  URGENCY: [
    "Flash Drop price expires in 4 minutes.",
    "Your cart reservation is about to evaporate.",
    "The circuit closes at midnight. Act now.",
    "Demand is spiking: Price re-calibration imminent."
  ],
  AUTHORITY: [
    "Verified by the Senior Style Architect.",
    "Archetype synergy detected: 15% efficiency boost.",
    "Rank Requirement: Silver Vanguard or higher.",
    "Kraze Protocol: Authenticity Guaranteed."
  ],
  SOCIAL_PROOF: [
    "Top 1% of Vanguards are wearing this.",
    "Winning looks in the Arena utilize this piece.",
    "Trending in local high-fashion circuits.",
    "Seen on Archiver_04 (Top Ranked)."
  ]
};

export const TREND_FORECASTS = [
  { id: 'tf1', category: 'Cyber-wear', growth: '+240%', status: 'EXPLODING', color: 'text-pink-500' },
  { id: 'tf2', category: 'Void Minimalism', growth: '+85%', status: 'STEADY', color: 'text-zinc-400' },
  { id: 'tf3', category: 'Ethereal Luxe', growth: '-12%', status: 'COOLING', color: 'text-blue-400' },
  { id: 'tf4', category: 'Tactical Beauty', growth: '+156%', status: 'SURGING', color: 'text-purple-500' },
];

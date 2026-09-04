
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  costXP: number;
  locked: boolean;
  type: 'PASSIVE' | 'ACTIVE';
}

export const ARCHETYPE_EVOLUTION_TREE: Record<string, SkillNode[]> = {
  'CYBER': [
    { id: 'c1', name: 'Neon Resonance', description: '+5% Hype Score on neon products', costXP: 1000, locked: false, type: 'PASSIVE' },
    { id: 'c2', name: 'Glitched Reservation', description: 'Extend cart timer by 5 minutes', costXP: 2500, locked: true, type: 'ACTIVE' },
    { id: 'c3', name: 'Matrix Scan', description: 'See real-time global inventory depth', costXP: 5000, locked: true, type: 'ACTIVE' },
  ],
  'LUXE': [
    { id: 'l1', name: 'Quiet Luxury', description: 'Hide purchase history from live feed', costXP: 1000, locked: false, type: 'PASSIVE' },
    { id: 'l2', name: 'Heirloom Privilege', description: '-10% price on limited archives', costXP: 3000, locked: true, type: 'PASSIVE' },
    { id: 'l3', name: 'Gilded Invitation', description: 'Access to the Diamond Tier shop', costXP: 7500, locked: true, type: 'ACTIVE' },
  ],
  'VOID': [
    { id: 'v1', name: 'Echo Minimization', description: '+10% Coins on minimalist items', costXP: 1000, locked: false, type: 'PASSIVE' },
    { id: 'v2', name: 'Void Walk', description: 'Instant checkout bypass', costXP: 4000, locked: true, type: 'ACTIVE' },
    { id: 'v3', name: 'Zero Point Style', description: 'Maximum XP multiplier on all drops', costXP: 10000, locked: true, type: 'PASSIVE' },
  ]
};

export const MARKET_HYPE_LOG = [
  { timestamp: '2025-05-01T12:00:00Z', event: 'DROP_01_REVEAL', globalHeat: 98 },
  { timestamp: '2025-05-01T12:15:00Z', event: 'CYBER_CLOAK_SOLD_OUT', globalHeat: 100 },
  { timestamp: '2025-05-02T10:00:00Z', event: 'RE_CALIBRATION_PHASE', globalHeat: 45 },
];

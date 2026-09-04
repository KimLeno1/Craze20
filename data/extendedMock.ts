import { Achievement } from '../types';

export const USER_ACHIEVEMENTS: Achievement[] = [
  { 
    id: 'a1', 
    title: 'Drop_Origin', 
    description: 'Archive a silhouette within the first 60 seconds of a Thermal Drop.', 
    icon: '⚡', 
    unlocked: true, 
    progress: 1, 
    goal: 1,
    rewardREP: 500
  },
  { 
    id: 'a2', 
    title: 'Velocity_Snatcher', 
    description: 'Secure 3 silhouettes with a Velocity Heat index exceeding 95%.', 
    icon: '🔥', 
    unlocked: false, 
    progress: 1, 
    goal: 3,
    rewardREP: 1500
  },
  { 
    id: 'a3', 
    title: 'Synergy_Architect', 
    description: 'Initialize and complete 2 full Synergy Kits (Bundles).', 
    icon: '📦', 
    unlocked: false, 
    progress: 0, 
    goal: 2,
    rewardREP: 2500
  },
  { 
    id: 'a4', 
    title: 'Circuit_Elite', 
    description: 'Reach a total archive valuation of GH₵5,000.', 
    icon: '💎', 
    unlocked: false, 
    progress: 1250, 
    goal: 5000,
    rewardREP: 5000
  },
  { 
    id: 'a5', 
    title: 'Void_Stalker', 
    description: 'Wishlist 10 items from the "Void Minimalist" sector.', 
    icon: '🌑', 
    unlocked: false, 
    progress: 4, 
    goal: 10,
    rewardREP: 1000
  },
  { 
    id: 'a6', 
    title: 'Arena_Dominant', 
    description: 'Cast 100 decisive votes in the Style Arena.', 
    icon: '🏛️', 
    unlocked: false, 
    progress: 42, 
    goal: 100,
    rewardREP: 2000
  }
];
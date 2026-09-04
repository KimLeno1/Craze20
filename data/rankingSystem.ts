import { RankBenefits } from '../types';

export const RANK_THRESHOLDS = {
  'Newcomer': 0,
  'Stylist': 1500,
  'Trendsetter': 4000,
  'Fashion Icon': 10000,
  'Closet Royalty': 25000,
  'Kraze Legend': 60000
};

export const RANK_BENEFITS: Record<string, RankBenefits> = {
  'Newcomer': {
    tier: 'Newcomer',
    vaultLimit: 5,
    ticketsPerPurchase: { tickets: 1, perItems: 3 },
    payForMeSlots: 1,
    wishlistRetentionDays: 7,
    canSeeSponsors: false,
    canSeeOtherWishlists: false,
    stylistAiLimit: 1
  },
  'Stylist': {
    tier: 'Stylist',
    vaultLimit: 12,
    ticketsPerPurchase: { tickets: 2, perItems: 5 },
    payForMeSlots: 2,
    wishlistRetentionDays: 14,
    canSeeSponsors: false,
    canSeeOtherWishlists: false,
    stylistAiLimit: 3
  },
  'Trendsetter': {
    tier: 'Trendsetter',
    vaultLimit: 20,
    ticketsPerPurchase: { tickets: 3, perItems: 5 },
    payForMeSlots: 2,
    wishlistRetentionDays: 30,
    canSeeSponsors: false,
    canSeeOtherWishlists: false,
    stylistAiLimit: 5
  },
  'Fashion Icon': {
    tier: 'Fashion Icon',
    vaultLimit: 30,
    ticketsPerPurchase: { tickets: 3, perItems: 1 },
    payForMeSlots: 3,
    wishlistRetentionDays: 90,
    canSeeSponsors: true,
    canSeeOtherWishlists: true,
    stylistAiLimit: 10
  },
  'Closet Royalty': {
    tier: 'Closet Royalty',
    vaultLimit: 35,
    ticketsPerPurchase: { tickets: 4, perItems: 3 },
    payForMeSlots: 4,
    wishlistRetentionDays: 'PERMANENT',
    canSeeSponsors: true,
    canSeeOtherWishlists: true,
    stylistAiLimit: 25
  },
  'Kraze Legend': {
    tier: 'Kraze Legend',
    vaultLimit: 50,
    ticketsPerPurchase: { tickets: 6, perItems: 3 },
    payForMeSlots: 5,
    wishlistRetentionDays: 'PERMANENT',
    canSeeSponsors: true,
    canSeeOtherWishlists: true,
    stylistAiLimit: 100
  }
};

export const getCurrentRank = (rep: number): RankBenefits => {
  if (rep >= RANK_THRESHOLDS['Kraze Legend']) return RANK_BENEFITS['Kraze Legend'];
  if (rep >= RANK_THRESHOLDS['Closet Royalty']) return RANK_BENEFITS['Closet Royalty'];
  if (rep >= RANK_THRESHOLDS['Fashion Icon']) return RANK_BENEFITS['Fashion Icon'];
  if (rep >= RANK_THRESHOLDS['Trendsetter']) return RANK_BENEFITS['Trendsetter'];
  if (rep >= RANK_THRESHOLDS['Stylist']) return RANK_BENEFITS['Stylist'];
  return RANK_BENEFITS['Newcomer'];
};

export const getNextRankThreshold = (rep: number): { next: string; threshold: number } | null => {
  if (rep >= RANK_THRESHOLDS['Kraze Legend']) return null;
  if (rep >= RANK_THRESHOLDS['Closet Royalty']) return { next: 'Kraze Legend', threshold: RANK_THRESHOLDS['Kraze Legend'] };
  if (rep >= RANK_THRESHOLDS['Fashion Icon']) return { next: 'Closet Royalty', threshold: RANK_THRESHOLDS['Closet Royalty'] };
  if (rep >= RANK_THRESHOLDS['Trendsetter']) return { next: 'Fashion Icon', threshold: RANK_THRESHOLDS['Fashion Icon'] };
  if (rep >= RANK_THRESHOLDS['Stylist']) return { next: 'Trendsetter', threshold: RANK_THRESHOLDS['Trendsetter'] };
  return { next: 'Stylist', threshold: RANK_THRESHOLDS['Stylist'] };
};
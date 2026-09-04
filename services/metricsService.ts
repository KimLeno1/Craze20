
import { Product } from '../types';

export const calculateVelocityScore = (productId: string): number => {
  return 50; // Default flat score
};

export const getHypeRankedProducts = (products: Product[]): Product[] => {
  return products; // No-op
};

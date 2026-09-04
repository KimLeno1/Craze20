
import { Product, UserPreferences } from '../types';

export function scoreProduct(product: Product, prefs: UserPreferences | null): number {
  if (!prefs) return 0;

  let score = 0;

  // 1. Gender Match (Highest Priority)
  // product.gender can be 'MEN', 'WOMEN', 'UNISEX'
  // prefs.preferredGenders is an array of Gender
  if (prefs.preferredGenders && prefs.preferredGenders.length > 0) {
    if (prefs.preferredGenders.includes(product.gender as any) || product.gender === 'UNISEX') {
      score += 1000;
    }
  }

  // 2. Category Match
  if (prefs.preferredCategories && prefs.preferredCategories.length > 0) {
    if (prefs.preferredCategories.includes(product.category) || prefs.preferredCategories.includes('All')) {
      score += 100;
    }
  }

  // 3. Tags Match (Archetype)
  if (prefs.styleArchetype && product.tags && product.tags.length > 0) {
    const userTags = prefs.styleArchetype.split(',').map(t => t.trim().toLowerCase());
    const productTags = product.tags.map(t => t.toLowerCase());
    
    const matchingTags = productTags.filter(t => userTags.includes(t));
    score += matchingTags.length * 10;
  }

  return score;
}

export function sortProductsByProtocol(products: Product[], prefs: UserPreferences | null): Product[] {
  if (!prefs) return products;
  
  return [...products].sort((a, b) => {
    const scoreA = scoreProduct(a, prefs);
    const scoreB = scoreProduct(b, prefs);
    
    // Primary: Protocol Score
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    // Secondary: Newness (if applicable)
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    
    return 0;
  });
}

import { Product, CategoryInfo } from '../types';
import { CATEGORY_GROUPS } from '../constants';

/**
 * Checks if a product matches a given category identifier (ID, slug, or name).
 */
export const matchesCategory = (
  product: Product,
  categoryIdentifier?: string | null,
  categoriesList?: CategoryInfo[]
): boolean => {
  if (!categoryIdentifier || categoryIdentifier === 'All' || categoryIdentifier === 'ALL') {
    return true;
  }

  const target = categoryIdentifier.trim();
  const lowerTarget = target.toLowerCase();

  // 1. Direct categoryId UUID match
  if (product.categoryId && product.categoryId === target) {
    return true;
  }

  // 2. Find matching category in categoriesList
  if (categoriesList && categoriesList.length > 0) {
    const catObj = categoriesList.find(
      c => c.id === target ||
           (c.slug && c.slug.toLowerCase() === lowerTarget) ||
           c.name.toLowerCase() === lowerTarget
    );

    if (catObj) {
      if (product.categoryId && product.categoryId === catObj.id) return true;
      if (product.category && product.category.toLowerCase() === catObj.name.toLowerCase()) return true;
      if (product.category && catObj.slug && product.category.toLowerCase() === catObj.slug.toLowerCase()) return true;
    }
  }

  // 3. Match against CATEGORY_GROUPS mapping
  if (CATEGORY_GROUPS[target]?.some(cat => cat.toLowerCase() === product.category?.toLowerCase())) {
    return true;
  }

  // 4. Exact or case-insensitive string match on product.category
  if (product.category && product.category.toLowerCase() === lowerTarget) {
    return true;
  }

  return false;
};

import { Product, CategoryInfo } from '../types';
import { CATEGORY_GROUPS } from '../constants';

/**
 * Enhanced Semantic Category & Subcategory taxonomy
 */
export const SUB_CATEGORY_MAP: Record<string, string[]> = {
  hoodies: ['hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'pullover', 'jumper', 'hooded'],
  tees: ['tee', 'tees', 't-shirt', 't-shirts', 'tshirt', 'tshirts', 'shirt', 'shirts', 'polo', 'polos', 'tank', 'tanks', 'top', 'tops', 'jersey', 'jerseys', 'crop top'],
  outerwear: ['jacket', 'jackets', 'coat', 'coats', 'outerwear', 'puffer', 'puffers', 'bomber', 'bombers', 'parka', 'parkas', 'windbreaker', 'windbreakers', 'cloak', 'cloaks', 'vest', 'vests', 'trench', 'blazer', 'blazers', 'anorak', 'overcoat'],
  sweaters: ['sweater', 'sweaters', 'cardigan', 'cardigans', 'knitwear', 'knitted', 'turtleneck', 'knit'],
  pants: ['pant', 'pants', 'trousers', 'trouser', 'jeans', 'denim', 'cargo', 'cargos', 'jogger', 'joggers', 'sweatpant', 'sweatpants', 'bottoms', 'slacks', 'chinos'],
  shorts: ['short', 'shorts', 'trunks', 'bermuda', 'biker shorts'],
  skirts_dresses: ['dress', 'dresses', 'skirt', 'skirts', 'gown', 'gowns', 'jumpsuit', 'romper', 'bodysuit', 'kimono'],
  lingerie_lounge: ['lingerie', 'lounge', 'loungewear', 'sleepwear', 'robe', 'bra', 'underwear', 'boxer', 'boxers', 'socks'],
  footwear: ['shoe', 'shoes', 'sneaker', 'sneakers', 'kicks', 'boot', 'boots', 'runner', 'runners', 'slide', 'slides', 'sandal', 'sandals', 'loafer', 'loafers', 'footwear', 'heel', 'heels', 'mule', 'mules', 'slippers'],
  bags: ['bag', 'bags', 'backpack', 'backpacks', 'tote', 'totes', 'crossbody', 'duffel', 'duffle', 'pouch', 'shoulder bag', 'clutch', 'satchel', 'mini bag', 'messenger', 'waist bag', 'fanny pack'],
  headwear: ['hat', 'hats', 'cap', 'caps', 'beanie', 'beanies', 'bucket hat', 'beret', 'headwear', 'balaclava', 'visor', 'bandana', 'durag'],
  jewelry: ['jewelry', 'jewellery', 'ring', 'rings', 'necklace', 'necklaces', 'chain', 'chains', 'bracelet', 'bracelets', 'pendant', 'pendants', 'earring', 'earrings', 'cuff', 'choker', 'brooch'],
  eyewear: ['sunglasses', 'glasses', 'eyewear', 'shades', 'goggles', 'frames', 'specs'],
  accessories: ['belt', 'belts', 'wallet', 'wallets', 'cardholder', 'scarf', 'scarves', 'gloves', 'watch', 'watches', 'timepiece', 'fragments', 'fragment', 'lanyard', 'keychain'],
  beauty: ['beauty', 'cosmetics', 'fragrance', 'perfume', 'cologne', 'skincare', 'makeup', 'lip', 'scent', 'body mist'],
  kits: ['kit', 'kits', 'bundle', 'bundles', 'set', 'sets', 'pack', 'collection', 'vault']
};

export const MACRO_CATEGORY_MAP: Record<string, string[]> = {
  'Apparel': ['hoodies', 'tees', 'outerwear', 'sweaters', 'pants', 'shorts', 'skirts_dresses', 'lingerie_lounge', 'apparel', "men's clothing", "women's clothing", "women's curve clothing", "streetwear", "clothing"],
  'Footwear': ['footwear', 'sneakers', 'shoes', 'boots', 'sandals', "men's shoes", "women's shoes"],
  'Accessories': ['bags', 'headwear', 'jewelry', 'eyewear', 'accessories', 'fragments', 'belts', 'wallets', 'watches'],
  'Beauty': ['beauty', 'cosmetics', 'fragrance', 'skincare'],
  'Kits': ['kits', 'bundles', 'sets']
};

/**
 * Normalizes text to singular/lowercase keywords for reliable matching
 */
const normalizeWord = (w: string): string => {
  let cleaned = w.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (cleaned.endsWith('ies')) cleaned = cleaned.slice(0, -3) + 'y';
  else if (cleaned.endsWith('es') && cleaned.length > 3) cleaned = cleaned.slice(0, -2);
  else if (cleaned.endsWith('s') && !cleaned.endsWith('ss') && cleaned.length > 3) cleaned = cleaned.slice(0, -1);
  return cleaned;
};

/**
 * Intelligently extracts the finest subcategory key for a product
 */
export const extractSubCategory = (product: Product): string => {
  if (!product) return 'apparel';
  const text = `${product.category || ''} ${product.name || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
  
  for (const [subCat, keywords] of Object.entries(SUB_CATEGORY_MAP)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(text)) {
        return subCat;
      }
    }
  }

  // Fallback to broad category name
  const cat = (product.category || '').toLowerCase();
  for (const [subCat, keywords] of Object.entries(SUB_CATEGORY_MAP)) {
    if (keywords.some(k => cat.includes(k))) return subCat;
  }

  return cat || 'apparel';
};

/**
 * Extracts the broad macro category (Apparel, Footwear, Accessories, Beauty, Kits)
 */
export const extractMacroCategory = (product: Product): string => {
  if (!product) return 'Apparel';
  const sub = extractSubCategory(product);
  const cat = (product.category || '').toLowerCase();

  for (const [macro, subList] of Object.entries(MACRO_CATEGORY_MAP)) {
    if (subList.includes(sub) || subList.some(s => cat.includes(s))) {
      return macro;
    }
  }
  return 'Apparel';
};

/**
 * Checks if a product matches a given category identifier (ID, slug, or name).
 */
export const matchesCategory = (
  product: Product,
  categoryIdentifier?: string | null,
  categoriesList?: CategoryInfo[]
): boolean => {
  if (!product) return false;
  if (!categoryIdentifier || categoryIdentifier === 'All' || categoryIdentifier === 'ALL') {
    return true;
  }

  const target = String(categoryIdentifier).trim();
  const lowerTarget = target.toLowerCase();
  const normTarget = normalizeWord(lowerTarget);

  // 1. Direct categoryId UUID match
  if (product.categoryId && String(product.categoryId).trim() === target) {
    return true;
  }

  // 2. Find matching category in categoriesList
  if (categoriesList && Array.isArray(categoriesList) && categoriesList.length > 0) {
    const catObj = categoriesList.find(
      c => c && (
           c.id === target ||
           (c.slug && String(c.slug).toLowerCase() === lowerTarget) ||
           (c.name && String(c.name).toLowerCase() === lowerTarget)
      )
    );

    if (catObj) {
      if (product.categoryId && product.categoryId === catObj.id) return true;
      if (product.category && typeof product.category === 'string' && product.category.toLowerCase() === catObj.name?.toLowerCase()) return true;
      if (product.category && typeof product.category === 'string' && catObj.slug && product.category.toLowerCase() === catObj.slug.toLowerCase()) return true;
      
      const macroCatObj = MACRO_CATEGORY_MAP[catObj.name] || [];
      if (macroCatObj.some(m => product.category && product.category.toLowerCase().includes(m))) return true;
    }
  }

  // 3. Match against CATEGORY_GROUPS mapping
  if (CATEGORY_GROUPS && CATEGORY_GROUPS[target] && Array.isArray(CATEGORY_GROUPS[target])) {
    if (CATEGORY_GROUPS[target].some(cat => typeof cat === 'string' && typeof product.category === 'string' && cat.toLowerCase() === product.category.toLowerCase())) {
      return true;
    }
  }

  // 4. Exact or case-insensitive string match on product.category
  if (product.category && typeof product.category === 'string') {
    const prodCatLower = product.category.toLowerCase();
    if (prodCatLower === lowerTarget) return true;
    if (normalizeWord(prodCatLower) === normTarget) return true;
    if (prodCatLower.includes(lowerTarget) || lowerTarget.includes(prodCatLower)) return true;
  }

  // 5. Semantic Subcategory & Macro Category matching
  const prodSub = extractSubCategory(product);
  const prodMacro = extractMacroCategory(product);

  if (SUB_CATEGORY_MAP[lowerTarget] && SUB_CATEGORY_MAP[lowerTarget].includes(prodSub)) return true;
  if (prodSub === lowerTarget || prodSub === normTarget) return true;
  if (prodMacro.toLowerCase() === lowerTarget) return true;

  // 6. Name and tags keyword match
  const text = `${product.name} ${(product.tags || []).join(' ')}`.toLowerCase();
  if (text.includes(lowerTarget) || text.includes(normTarget)) {
    return true;
  }

  return false;
};

/**
 * Determines if two products share the same category, subcategory, or category group.
 */
export const isSameCategory = (
  productA: Product,
  productB: Product,
  categoriesList?: CategoryInfo[]
): boolean => {
  if (!productA || !productB || productA.id === productB.id) return false;

  // 1. Direct categoryId match
  if (productA.categoryId && productB.categoryId && productA.categoryId === productB.categoryId) {
    return true;
  }

  // 2. Direct string category match
  if (productA.category && productB.category) {
    const catA = productA.category.trim().toLowerCase();
    const catB = productB.category.trim().toLowerCase();
    if (catA === catB || normalizeWord(catA) === normalizeWord(catB)) {
      return true;
    }
  }

  // 3. Subcategory match (e.g. both are hoodies, both are sneakers, both are bags)
  const subA = extractSubCategory(productA);
  const subB = extractSubCategory(productB);
  if (subA && subB && subA === subB) {
    return true;
  }

  // 4. Macro category group match
  const macroA = extractMacroCategory(productA);
  const macroB = extractMacroCategory(productB);
  if (macroA && macroB && macroA === macroB) {
    return true;
  }

  // 5. Check using matchesCategory with categoriesList
  if (productA.categoryId && matchesCategory(productB, productA.categoryId, categoriesList)) {
    return true;
  }
  if (productB.categoryId && matchesCategory(productA, productB.categoryId, categoriesList)) {
    return true;
  }
  if (productA.category && matchesCategory(productB, productA.category, categoriesList)) {
    return true;
  }
  if (productB.category && matchesCategory(productA, productB.category, categoriesList)) {
    return true;
  }

  return false;
};

/**
 * Converts a hex string (#fff or #ffffff) to [r, g, b].
 */
export const hexToRgb = (hex: string): [number, number, number] | null => {
  if (!hex || typeof hex !== 'string') return null;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

/**
 * Calculates Euclidean distance between two RGB colors (0 to 441).
 */
export const getColorDistance = (c1: [number, number, number], c2: [number, number, number]): number => {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
};

export const NAMED_COLOR_MAP: Record<string, { hex: string; family: string; rgb: [number, number, number] }> = {
  black: { hex: '#000000', family: 'black', rgb: [0, 0, 0] },
  obsidian: { hex: '#0B0D12', family: 'black', rgb: [11, 13, 18] },
  midnight: { hex: '#0F172A', family: 'black', rgb: [15, 23, 42] },
  white: { hex: '#FFFFFF', family: 'white', rgb: [255, 255, 255] },
  ivory: { hex: '#FFFFF0', family: 'white', rgb: [255, 255, 240] },
  cream: { hex: '#FFFDD0', family: 'white', rgb: [255, 253, 208] },
  grey: { hex: '#808080', family: 'grey', rgb: [128, 128, 128] },
  gray: { hex: '#808080', family: 'grey', rgb: [128, 128, 128] },
  charcoal: { hex: '#36454F', family: 'grey', rgb: [54, 69, 79] },
  silver: { hex: '#C0C0C0', family: 'grey', rgb: [192, 192, 192] },
  chrome: { hex: '#D8D8D8', family: 'grey', rgb: [216, 216, 216] },
  blue: { hex: '#0000FF', family: 'blue', rgb: [0, 0, 255] },
  sapphire: { hex: '#0F52BA', family: 'blue', rgb: [15, 82, 186] },
  navy: { hex: '#000080', family: 'blue', rgb: [0, 0, 128] },
  cyan: { hex: '#00D1FF', family: 'cyan', rgb: [0, 209, 255] },
  teal: { hex: '#008080', family: 'cyan', rgb: [0, 128, 128] },
  gold: { hex: '#FFD700', family: 'gold', rgb: [255, 215, 0] },
  yellow: { hex: '#FFFF00', family: 'yellow', rgb: [255, 255, 0] },
  amber: { hex: '#FFBF00', family: 'gold', rgb: [255, 191, 0] },
  red: { hex: '#FF0000', family: 'red', rgb: [255, 0, 0] },
  crimson: { hex: '#DC143C', family: 'red', rgb: [220, 20, 60] },
  rose: { hex: '#FF007F', family: 'pink', rgb: [255, 0, 127] },
  burgundy: { hex: '#800020', family: 'red', rgb: [128, 0, 32] },
  maroon: { hex: '#800000', family: 'red', rgb: [128, 0, 0] },
  green: { hex: '#008000', family: 'green', rgb: [0, 128, 0] },
  emerald: { hex: '#50C878', family: 'green', rgb: [80, 200, 120] },
  olive: { hex: '#808000', family: 'green', rgb: [128, 128, 0] },
  lime: { hex: '#BDFF00', family: 'green', rgb: [189, 255, 0] },
  purple: { hex: '#800080', family: 'purple', rgb: [128, 0, 128] },
  violet: { hex: '#8A2BE2', family: 'purple', rgb: [138, 43, 226] },
  indigo: { hex: '#4B0082', family: 'purple', rgb: [75, 0, 130] },
  lavender: { hex: '#E6E6FA', family: 'purple', rgb: [230, 230, 250] },
  pink: { hex: '#FFC0CB', family: 'pink', rgb: [255, 192, 203] },
  magenta: { hex: '#FF00FF', family: 'pink', rgb: [255, 0, 255] },
  brown: { hex: '#964B00', family: 'brown', rgb: [150, 75, 0] },
  beige: { hex: '#F5F5DC', family: 'beige', rgb: [245, 245, 220] },
  tan: { hex: '#D2B48C', family: 'beige', rgb: [210, 180, 140] },
  khaki: { hex: '#C3B091', family: 'beige', rgb: [195, 176, 145] },
  sand: { hex: '#C2B280', family: 'beige', rgb: [194, 178, 128] },
  mocha: { hex: '#967969', family: 'brown', rgb: [150, 121, 105] },
  chocolate: { hex: '#7B3F00', family: 'brown', rgb: [123, 63, 0] },
  orange: { hex: '#FFA500', family: 'orange', rgb: [255, 165, 0] },
  coral: { hex: '#FF7F50', family: 'orange', rgb: [255, 127, 80] },
  neon: { hex: '#39FF14', family: 'green', rgb: [57, 255, 20] }
};

/**
 * Classifies an RGB color into a broad family name.
 */
export const getRgbFamily = (rgb: [number, number, number]): string => {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / (2 * 255);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  if (l < 0.16) return 'black';
  if (l > 0.88 && s < 0.18) return 'white';
  if (s < 0.12) return 'grey';

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  if (h >= 345 || h < 15) return 'red';
  if (h >= 15 && h < 45) return l < 0.45 ? 'brown' : 'orange';
  if (h >= 45 && h < 68) return 'gold';
  if (h >= 68 && h < 165) return 'green';
  if (h >= 165 && h < 195) return 'cyan';
  if (h >= 195 && h < 255) return 'blue';
  if (h >= 255 && h < 315) return 'purple';
  return 'pink';
};

export interface ExtractedPalette {
  hexes: string[];
  names: string[];
  families: string[];
}

/**
 * Extracts normalized colors, hexes, and color families for a product.
 */
export const getProductColorPalette = (product: Product): ExtractedPalette => {
  const hexes = new Set<string>();
  const names = new Set<string>();
  const families = new Set<string>();

  if (!product) {
    return { hexes: [], names: [], families: [] };
  }

  // 1. Color variants with hexes
  if (product.colorVariants && Array.isArray(product.colorVariants)) {
    for (const v of product.colorVariants) {
      if (v.main) {
        const rgb = hexToRgb(v.main);
        if (rgb) {
          hexes.add(v.main.toUpperCase());
          families.add(getRgbFamily(rgb));
        } else {
          names.add(v.main.toLowerCase().trim());
        }
      }
      if (v.secondary) {
        const rgb = hexToRgb(v.secondary);
        if (rgb) {
          hexes.add(v.secondary.toUpperCase());
          families.add(getRgbFamily(rgb));
        } else {
          names.add(v.secondary.toLowerCase().trim());
        }
      }
    }
  }

  // 2. Colors array or string
  if (product.colors) {
    const rawList: string[] = Array.isArray(product.colors)
      ? product.colors
      : typeof product.colors === 'string'
      ? product.colors.split(/[,/|]/)
      : [];

    for (const c of rawList) {
      const trimmed = c.trim().toLowerCase();
      if (!trimmed) continue;
      const rgb = hexToRgb(trimmed);
      if (rgb) {
        hexes.add(trimmed.toUpperCase());
        families.add(getRgbFamily(rgb));
      } else if (NAMED_COLOR_MAP[trimmed]) {
        hexes.add(NAMED_COLOR_MAP[trimmed].hex);
        families.add(NAMED_COLOR_MAP[trimmed].family);
        names.add(trimmed);
      } else {
        names.add(trimmed);
      }
    }
  }

  // 3. Extract keywords from product name, tags, and description
  const textCorpus = `${product.name || ''} ${(product.tags || []).join(' ')} ${product.description || ''}`.toLowerCase();
  for (const [colorName, info] of Object.entries(NAMED_COLOR_MAP)) {
    const regex = new RegExp(`\\b${colorName}\\b`, 'i');
    if (regex.test(textCorpus)) {
      names.add(colorName);
      families.add(info.family);
      if (hexes.size < 4) {
        hexes.add(info.hex);
      }
    }
  }

  // 4. Fallback if no colors identified: assume versatile dark/neutral fashion palette
  if (hexes.size === 0 && families.size === 0) {
    hexes.add('#0B132B');
    families.add('black');
    names.add('classic');
  }

  return {
    hexes: Array.from(hexes),
    names: Array.from(names),
    families: Array.from(families),
  };
};

export interface ColorSimilarityResult {
  score: number;
  isMatch: boolean;
  sharedHexes: string[];
  sharedFamilies: string[];
}

/**
 * Calculates color palette similarity between two products.
 */
export const calculateColorSimilarity = (
  productA: Product,
  productB: Product
): ColorSimilarityResult => {
  const palA = getProductColorPalette(productA);
  const palB = getProductColorPalette(productB);

  let score = 0;
  const sharedHexes: string[] = [];
  const sharedFamilies: string[] = [];

  // Direct hex match
  for (const hA of palA.hexes) {
    if (palB.hexes.includes(hA)) {
      score += 45;
      if (!sharedHexes.includes(hA)) sharedHexes.push(hA);
    } else {
      // Perceptual color distance
      const rgbA = hexToRgb(hA);
      if (rgbA) {
        for (const hB of palB.hexes) {
          const rgbB = hexToRgb(hB);
          if (rgbB) {
            const dist = getColorDistance(rgbA, rgbB);
            if (dist < 45) {
              score += 35;
              if (!sharedHexes.includes(hB)) sharedHexes.push(hB);
            } else if (dist < 85) {
              score += 20;
              if (!sharedHexes.includes(hB)) sharedHexes.push(hB);
            }
          }
        }
      }
    }
  }

  // Shared family
  for (const famA of palA.families) {
    if (palB.families.includes(famA)) {
      score += 30;
      if (!sharedFamilies.includes(famA)) sharedFamilies.push(famA);
    }
  }

  // Shared color names
  for (const nameA of palA.names) {
    if (palB.names.includes(nameA) && !sharedFamilies.includes(nameA)) {
      score += 20;
      sharedFamilies.push(nameA);
    }
  }

  const isMatch = score >= 20 || sharedHexes.length > 0 || sharedFamilies.length > 0;

  return {
    score,
    isMatch,
    sharedHexes,
    sharedFamilies,
  };
};

export interface SimilarProductResult {
  product: Product;
  score: number;
  isCategoryMatch: boolean;
  isColorMatch: boolean;
  sharedHexes: string[];
  sharedFamilies: string[];
  matchBadge: string;
  matchReason: string;
}

const STOP_WORDS = new Set(['the', 'and', 'with', 'for', 'size', 'men', 'mens', 'women', 'womens', 'unisex', 'classic', 'new', 'edition', 'limited', 'original']);

/**
 * Algorithmically scores and suggests similar products based on:
 * - Subcategory & Category utility matching
 * - Color palette harmony and matching
 * - Brand, Appeal, Synergy Path, and Keyword resonance
 */
export const getSimilarProducts = (
  targetProduct: Product,
  allProducts: Product[],
  options?: {
    categoriesList?: CategoryInfo[];
    filterType?: 'all' | 'category' | 'color';
    limit?: number;
  }
): SimilarProductResult[] => {
  if (!targetProduct || !allProducts || allProducts.length === 0) {
    return [];
  }

  const { categoriesList, filterType = 'all', limit = 12 } = options || {};

  const tokenize = (str: string) => {
    if (!str) return [];
    return str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  };

  const targetWords = tokenize(targetProduct.name);
  const targetTags = (targetProduct.tags || []).map(t => t.toLowerCase());
  const targetSubCategory = extractSubCategory(targetProduct);
  const targetMacroCategory = extractMacroCategory(targetProduct);

  const candidates = allProducts.filter(p => p.id !== targetProduct.id);
  const scoredList: SimilarProductResult[] = [];

  for (const candidate of candidates) {
    const candidateSubCategory = extractSubCategory(candidate);
    const candidateMacroCategory = extractMacroCategory(candidate);

    const isExactSubCategory = targetSubCategory === candidateSubCategory;
    const isCategory = isSameCategory(targetProduct, candidate, categoriesList);
    const isMacroCategory = targetMacroCategory === candidateMacroCategory;
    const colorSim = calculateColorSimilarity(targetProduct, candidate);

    // Hard filters based on selected tab
    if (filterType === 'category') {
      // Must match subcategory or category hierarchy
      if (!isExactSubCategory && !isCategory && !isMacroCategory) {
        continue;
      }
    } else if (filterType === 'color') {
      // Must have genuine color harmony or shared family
      if (!colorSim.isMatch || colorSim.score < 20) {
        continue;
      }
    }

    // Semantic tokens & tags
    const candidateWords = tokenize(candidate.name);
    const nameMatches = targetWords.filter(w => candidateWords.includes(w)).length;
    const candidateTags = (candidate.tags || []).map(t => t.toLowerCase());
    const tagMatches = targetTags.filter(t => candidateTags.includes(t)).length;

    let totalScore = 0;

    // Category weighting
    if (isExactSubCategory) {
      totalScore += 90;
    } else if (isCategory) {
      totalScore += 70;
    } else if (isMacroCategory) {
      totalScore += 45;
    }

    // Color weighting
    if (colorSim.isMatch) {
      totalScore += Math.min(colorSim.score, 60);
    }

    // Semantic text & tag resonance
    totalScore += nameMatches * 18;
    totalScore += tagMatches * 14;

    // Brand affinity
    if (targetProduct.brand && candidate.brand && targetProduct.brand.toLowerCase() === candidate.brand.toLowerCase()) {
      totalScore += 25;
    }

    // Appeal harmony (e.g. 'STREETS', 'CASUAL', 'OLD MONEY', 'AVANT-GARDE')
    if (targetProduct.appeal && candidate.appeal && targetProduct.appeal.toLowerCase() === candidate.appeal.toLowerCase()) {
      totalScore += 22;
    }

    // Synergy Path affinity (e.g. 'CYBER', 'LUXE', 'VOID')
    if (targetProduct.synergyPath && candidate.synergyPath && targetProduct.synergyPath.toLowerCase() === candidate.synergyPath.toLowerCase()) {
      totalScore += 18;
    }

    // Price Proximity
    if (targetProduct.price > 0 && candidate.price > 0) {
      const priceRatio = Math.min(targetProduct.price, candidate.price) / Math.max(targetProduct.price, candidate.price);
      if (priceRatio > 0.6) totalScore += 10;
    }

    // Determine badge and reason
    let matchBadge = 'Curated Match';
    let matchReason = 'Similar style & aesthetic';

    const subCategoryDisplayName = candidate.category || targetProduct.category || targetSubCategory.toUpperCase();

    if (isExactSubCategory && colorSim.isMatch) {
      matchBadge = 'Category & Color';
      matchReason = `Same ${targetSubCategory} silhouette with matching tones`;
    } else if (isExactSubCategory) {
      matchBadge = `Same Category`;
      matchReason = `Matching ${subCategoryDisplayName} silhouette`;
    } else if (isCategory && colorSim.isMatch) {
      matchBadge = 'Category & Color';
      matchReason = `Matching ${subCategoryDisplayName} in harmonizing colors`;
    } else if (isCategory) {
      matchBadge = `Same Category`;
      matchReason = `Similar piece from ${subCategoryDisplayName}`;
    } else if (colorSim.isMatch) {
      const colorDesc = colorSim.sharedFamilies.slice(0, 2).join(' & ');
      matchBadge = colorDesc ? `Matching ${colorDesc.toUpperCase()}` : 'Matching Colors';
      matchReason = colorDesc ? `Shares ${colorDesc} color palette` : `Harmonizing color palette`;
    } else if (targetProduct.appeal && candidate.appeal && targetProduct.appeal.toLowerCase() === candidate.appeal.toLowerCase()) {
      matchBadge = `${candidate.appeal} Vibe`;
      matchReason = `Matching ${candidate.appeal.toLowerCase()} aesthetic`;
    }

    scoredList.push({
      product: candidate,
      score: totalScore,
      isCategoryMatch: isExactSubCategory || isCategory || isMacroCategory,
      isColorMatch: colorSim.isMatch,
      sharedHexes: colorSim.sharedHexes,
      sharedFamilies: colorSim.sharedFamilies,
      matchBadge,
      matchReason,
    });
  }

  scoredList.sort((a, b) => b.score - a.score);

  // Fallback for empty results when category filter is selected but catalog is small
  if (scoredList.length === 0 && filterType === 'category') {
    const macroFallback = candidates
      .filter(p => extractMacroCategory(p) === targetMacroCategory)
      .slice(0, limit);

    return macroFallback.map(p => ({
      product: p,
      score: 50,
      isCategoryMatch: true,
      isColorMatch: false,
      sharedHexes: [],
      sharedFamilies: [],
      matchBadge: `Related ${p.category || targetMacroCategory}`,
      matchReason: `From the ${targetMacroCategory} collection`
    }));
  }

  return scoredList.slice(0, limit);
};

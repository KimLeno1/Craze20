-- ============================================================================
-- MIGRATION: 003_category_slug_and_product_fk.sql
-- Description: Adds categoryId FK to products, slug to categories, seeds 9
--              standard categories, and backfills products.categoryId.
-- Engine: SQLite (Project Default)
-- ============================================================================

-- 1. Ensure categories table has slug column
ALTER TABLE categories ADD COLUMN slug VARCHAR(255);

-- 2. Ensure products table has categoryId column
ALTER TABLE products ADD COLUMN categoryId VARCHAR(255);

-- 3. Upsert / Seed the 9 Standard Categories with UUIDs, Names, Slugs, Hero Images, and Inspiration
INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('4f507bf0-3967-4e2d-960a-af898a4c2413', 'Apparel', 'apparel', 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_CLOTHING_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('c36db0b9-101e-412c-b16d-f5d6166a909c', 'Footwear', 'footwear', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_FOOTWEAR_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('3ded13c8-a7bc-4506-abcc-62262eacb0c3', 'Accessories', 'accessories', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_ACCESSORY_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('d2437a26-d747-4c48-85b8-bfa250d44032', 'Kits', 'kits', 'https://images.unsplash.com/photo-1549463591-147604343e39?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_KIT_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('e10a21bc-1234-4b5d-9b95-1d0206e5b111', 'Fragments', 'fragments', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_FRAGMENTS_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('f21b32cd-2345-4c6e-ac06-2e1317f6c222', 'Home', 'home', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_HOME_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('bd0a32eb-0764-4b5d-9b95-1d0206e5b479', 'Beauty', 'beauty', 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_BEAUTY_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('a32c43de-3456-4d7f-bd17-3f2428a7d333', 'Shorts', 'shorts', 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_SHORTS_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

INSERT INTO categories (id, name, slug, heroImage, inspiration) 
VALUES 
  ('b43d54ef-4567-4e80-ce28-403539b8e444', 'Trousers', 'trousers', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1200', 'ARCHIVE_TROUSERS_CORE')
ON CONFLICT(name) DO UPDATE SET 
  slug = excluded.slug,
  heroImage = COALESCE(categories.heroImage, excluded.heroImage),
  inspiration = COALESCE(categories.inspiration, excluded.inspiration);

-- 4. Create Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products(categoryId);

-- 5. Backfill products.categoryId by joining with categories (case-insensitive, trimmed, alias-aware)
UPDATE products
SET categoryId = (
  SELECT c.id 
  FROM categories c 
  WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(products.category))
     OR LOWER(TRIM(c.slug)) = LOWER(TRIM(products.category))
     OR (LOWER(TRIM(products.category)) LIKE '%apparel%' AND c.slug = 'apparel')
     OR (LOWER(TRIM(products.category)) LIKE '%clothing%' AND c.slug = 'apparel')
     OR (LOWER(TRIM(products.category)) LIKE '%hoodie%' AND c.slug = 'apparel')
     OR (LOWER(TRIM(products.category)) LIKE '%jacket%' AND c.slug = 'apparel')
     OR (LOWER(TRIM(products.category)) LIKE '%tee%' AND c.slug = 'apparel')
     OR (LOWER(TRIM(products.category)) LIKE '%sweater%' AND c.slug = 'apparel')
     OR (LOWER(TRIM(products.category)) LIKE '%lingerie%' AND c.slug = 'apparel')
     OR (LOWER(TRIM(products.category)) LIKE '%shoe%' AND c.slug = 'footwear')
     OR (LOWER(TRIM(products.category)) LIKE '%sneaker%' AND c.slug = 'footwear')
     OR (LOWER(TRIM(products.category)) LIKE '%boot%' AND c.slug = 'footwear')
     OR (LOWER(TRIM(products.category)) LIKE '%sandal%' AND c.slug = 'footwear')
     OR (LOWER(TRIM(products.category)) LIKE '%footwear%' AND c.slug = 'footwear')
     OR (LOWER(TRIM(products.category)) LIKE '%accessory%' AND c.slug = 'accessories')
     OR (LOWER(TRIM(products.category)) LIKE '%choker%' AND c.slug = 'accessories')
     OR (LOWER(TRIM(products.category)) LIKE '%beauty%' AND c.slug = 'beauty')
     OR (LOWER(TRIM(products.category)) LIKE '%fragrance%' AND c.slug = 'beauty')
     OR (LOWER(TRIM(products.category)) LIKE '%kit%' AND c.slug = 'kits')
     OR (LOWER(TRIM(products.category)) LIKE '%bundle%' AND c.slug = 'kits')
     OR (LOWER(TRIM(products.category)) LIKE '%fragment%' AND c.slug = 'fragments')
     OR (LOWER(TRIM(products.category)) LIKE '%home%' AND c.slug = 'home')
     OR (LOWER(TRIM(products.category)) LIKE '%short%' AND c.slug = 'shorts')
     OR (LOWER(TRIM(products.category)) LIKE '%trouser%' AND c.slug = 'trousers')
     OR (LOWER(TRIM(products.category)) LIKE '%pant%' AND c.slug = 'trousers')
  LIMIT 1
)
WHERE category IS NOT NULL AND TRIM(category) != '';

-- 6. Ensure default category name string is set if categoryId is present but category string is empty
UPDATE products
SET category = (
  SELECT c.name FROM categories c WHERE c.id = products.categoryId LIMIT 1
)
WHERE (category IS NULL OR TRIM(category) = '') AND categoryId IS NOT NULL;

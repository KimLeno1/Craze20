-- ============================================================================
-- ROLLBACK MIGRATION: 003_category_slug_and_product_fk_rollback.sql
-- Description: Reverts the categoryId foreign key and slug changes.
-- Engine: SQLite / PostgreSQL / MySQL Compatible
-- ============================================================================

-- Step 1: Clear the categoryId backfill on products table
UPDATE products SET categoryId = NULL;

-- Step 2: Drop the indexes
DROP INDEX IF EXISTS idx_products_categoryId;
DROP INDEX IF EXISTS idx_categories_slug;

-- Step 3: (Optional in SQLite as DROP COLUMN requires SQLite >= 3.35.0)
-- Remove additional seeded categories if rollback to only original 5 is desired
-- DELETE FROM categories WHERE slug IN ('fragments', 'home', 'shorts', 'trousers');
-- UPDATE categories SET slug = NULL;

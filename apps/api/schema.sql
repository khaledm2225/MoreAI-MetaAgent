-- Table names follow the real MoreAI database plan. Money is whole piasters.
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, parentId TEXT, slug TEXT NOT NULL UNIQUE, nameEn TEXT NOT NULL, nameAr TEXT NOT NULL, sortOrder INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS colors (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, nameEn TEXT NOT NULL, nameAr TEXT NOT NULL, hex TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sizes (id TEXT PRIMARY KEY, label TEXT NOT NULL UNIQUE, sortOrder INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS merchants (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, bioEn TEXT NOT NULL, bioAr TEXT NOT NULL, logoPath TEXT, status TEXT NOT NULL, deliveryFeePiasters INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, merchantId TEXT NOT NULL REFERENCES merchants(id), categoryId TEXT NOT NULL REFERENCES categories(id), nameEn TEXT NOT NULL, nameAr TEXT NOT NULL, descriptionEn TEXT NOT NULL, descriptionAr TEXT NOT NULL, visualDescription TEXT NOT NULL, gender TEXT NOT NULL, status TEXT NOT NULL, pricePiasters INTEGER NOT NULL, imagePath TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS product_variants (id TEXT PRIMARY KEY, productId TEXT NOT NULL REFERENCES products(id), colorId TEXT NOT NULL REFERENCES colors(id), sizeId TEXT NOT NULL REFERENCES sizes(id), pricePiasters INTEGER, stockQuantity INTEGER NOT NULL, isAvailable INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS product_variants_product ON product_variants(productId);
CREATE TABLE IF NOT EXISTS taste_profiles (visitorId TEXT PRIMARY KEY, preferences TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS daily_usage (key TEXT PRIMARY KEY, count INTEGER NOT NULL);

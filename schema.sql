CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT,
  handle TEXT NOT NULL,
  FOREIGN KEY (id) REFERENCES users(id)
);

-- Note: Migration of existing admins from users table to admins table
-- should be handled by a separate script or manually if necessary.
-- For now, we are creating the table structure.

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  handle TEXT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT,
  archetype TEXT,
  rep INT DEFAULT 0,
  level INT DEFAULT 1,
  coins INT DEFAULT 0,
  gems INT DEFAULT 0,
  status TEXT,
  lastLogin TEXT,
  totalSpent DOUBLE DEFAULT 0,
  loyaltyPoints INT DEFAULT 0,
  credit DOUBLE DEFAULT 0,
  profile_picture TEXT,
  logistics TEXT, -- JSON object for saved checkout details
  role TEXT DEFAULT 'user',
  gender TEXT
);

CREATE TABLE IF NOT EXISTS banned_users (
  userId VARCHAR(255) PRIMARY KEY,
  reason TEXT,
  timestamp TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  contactEmail TEXT,
  password TEXT,
  plain_password TEXT,
  region TEXT,
  status TEXT,
  performanceScore INT DEFAULT 100,
  totalRevenueYield DOUBLE DEFAULT 0,
  joinedDate TEXT,
  commissionRate DOUBLE DEFAULT 10
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  price DOUBLE NOT NULL,
  originalPrice DOUBLE NOT NULL,
  shippingFee DOUBLE DEFAULT 0,
  image TEXT,
  category TEXT,
  categoryId VARCHAR(255),
  gender TEXT,
  description TEXT,
  details TEXT, -- JSON array
  inStock INT DEFAULT 1,
  isNew INT DEFAULT 0,
  viewers INT DEFAULT 0,
  stockCount INT DEFAULT 0,
  hypeScore INT DEFAULT 0,
  velocityScore INT DEFAULT 0,
  isHallOfFame INT DEFAULT 0,
  synergyPath TEXT,
  appeal TEXT,
  brand TEXT,
  tags TEXT, -- JSON array
  supplierId VARCHAR(255),
  deliveryTime TEXT,
  sizes TEXT, -- JSON array
  isCustom INT DEFAULT 0,
  priceRange TEXT, -- JSON object
  customizationFields TEXT, -- JSON array
  images TEXT, -- JSON array
  colors TEXT, -- JSON array
  colorVariants TEXT, -- JSON array of {main, secondary}
  createdAt TEXT,
  offeredDiscount DOUBLE DEFAULT 0,
  video TEXT,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id),
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  userName TEXT,
  items TEXT, -- JSON array
  total DOUBLE NOT NULL,
  status TEXT,
  timestamp TEXT,
  trackingNumber TEXT,
  deliveryAddress TEXT,
  phone TEXT,
  creditUsed DOUBLE DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS supply_orders (
  id VARCHAR(255) PRIMARY KEY,
  supplierId VARCHAR(255),
  status TEXT,
  timestamp TEXT,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS price_anomalies (
  id VARCHAR(255) PRIMARY KEY,
  productId VARCHAR(255),
  anomalyEndTime INT,
  discountPercent INT,
  FOREIGN KEY (productId) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS bundles (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  products TEXT, -- JSON array
  bundlePrice DOUBLE NOT NULL,
  description TEXT,
  expiresIn INT
);

CREATE TABLE IF NOT EXISTS pay_for_me_requests (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  userName TEXT,
  items TEXT, -- JSON array
  total DOUBLE NOT NULL,
  amountPaid DOUBLE DEFAULT 0,
  status TEXT,
  timestamp TEXT,
  payerName TEXT,
  payerContact TEXT,
  message TEXT,
  shippingProtocol TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS social_posts (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  userHandle TEXT,
  image TEXT,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  reports INT DEFAULT 0,
  timestamp TEXT,
  weekId TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS social_comments (
  id VARCHAR(255) PRIMARY KEY,
  postId VARCHAR(255),
  userId VARCHAR(255),
  userHandle TEXT,
  text TEXT,
  timestamp TEXT,
  FOREIGN KEY (postId) REFERENCES social_posts(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS social_interactions (
  userId VARCHAR(255),
  postId VARCHAR(255),
  type TEXT,
  PRIMARY KEY (userId, postId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (postId) REFERENCES social_posts(id)
);

CREATE TABLE IF NOT EXISTS user_stats (
  userId VARCHAR(255) PRIMARY KEY,
  level INT DEFAULT 1,
  experience INT DEFAULT 0,
  nextLevelExp INT DEFAULT 100,
  rank TEXT,
  totalSpent DOUBLE DEFAULT 0,
  storeCredit DOUBLE DEFAULT 0,
  itemsOwned INT DEFAULT 0,
  achievements TEXT, -- JSON array
  dailyQuests TEXT, -- JSON array
  aiTryOnsUsedToday INT DEFAULT 0,
  neuralStylistUsedToday INT DEFAULT 0,
  quests TEXT, -- JSON array
  selectedPath TEXT,
  brandSubscriptions TEXT, -- JSON array
  tagSubscriptions TEXT, -- JSON array
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  userId VARCHAR(255) PRIMARY KEY,
  preferredCategories TEXT, -- JSON array
  preferredGenders TEXT, -- JSON array
  styleArchetype TEXT,
  colorPreferences TEXT, -- JSON array
  priceRange TEXT, -- JSON object
  styleProtocolCompleted INT DEFAULT 0,
  checkoutProtocolCompleted INT DEFAULT 0,
  tutorialFinished INT DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_history (
  userId VARCHAR(255) PRIMARY KEY,
  viewedProductIds TEXT, -- JSON array
  wishlistedProductIds TEXT, -- JSON array
  purchasedProductIds TEXT, -- JSON array
  cartedProductIds TEXT, -- JSON array
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  timestamp TEXT,
  `read` INT DEFAULT 0,
  recipientId TEXT
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  type TEXT,
  value DOUBLE NOT NULL,
  description TEXT,
  discount DOUBLE,
  usageLimit INT DEFAULT 0,
  usedCount INT DEFAULT 0,
  expiryDate TEXT
);

CREATE TABLE IF NOT EXISTS wallets (
  id VARCHAR(255) PRIMARY KEY,
  balance DOUBLE DEFAULT 0,
  transactions TEXT -- JSON array
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  amount DOUBLE NOT NULL,
  bankName TEXT,
  bankCode TEXT,
  accountNumber TEXT,
  accountName TEXT,
  recipientCode TEXT,
  transferCode TEXT,
  reference TEXT,
  status TEXT,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  type TEXT,
  amount INT,
  reason TEXT,
  timestamp INT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS quiz_results (
  userId VARCHAR(255) PRIMARY KEY,
  styles TEXT, -- JSON array
  colors TEXT, -- JSON array
  occasions TEXT, -- JSON array
  budget TEXT,
  timestamp INT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId VARCHAR(255),
  item TEXT, -- JSON object
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS mystery_box_history (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  boxId TEXT,
  reward TEXT, -- JSON object
  timestamp INT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_scores (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  gameId TEXT,
  score INT,
  timestamp INT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stylist_sessions (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  mood TEXT,
  occasion TEXT,
  advice TEXT,
  timestamp INT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS try_ons (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  productId VARCHAR(255),
  image TEXT,
  timestamp INT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Settings table for global config
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(255) PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id VARCHAR(255) PRIMARY KEY,
  productId VARCHAR(255),
  userId VARCHAR(255),
  userHandle TEXT,
  rating INT,
  comment TEXT,
  timestamp TEXT,
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(255) PRIMARY KEY,
  productId VARCHAR(255) NOT NULL,
  userId VARCHAR(255),
  userHandle TEXT,
  userName TEXT,
  userAvatar TEXT,
  rating INT NOT NULL,
  title TEXT,
  body TEXT,
  comment TEXT,
  images TEXT, -- JSON array of image URLs
  verifiedPurchase INT DEFAULT 1,
  createdAt TEXT NOT NULL,
  timestamp TEXT,
  helpfulCount INT DEFAULT 0,
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS review_helpful_votes (
  reviewId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  createdAt TEXT NOT NULL,
  PRIMARY KEY (reviewId, userId),
  FOREIGN KEY (reviewId) REFERENCES reviews(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS review_images (
  id VARCHAR(255) PRIMARY KEY,
  reviewId VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  thumbnailUrl TEXT,
  FOREIGN KEY (reviewId) REFERENCES reviews(id)
);

CREATE TABLE IF NOT EXISTS product_styling (
  id VARCHAR(255) PRIMARY KEY,
  productId VARCHAR(255) NOT NULL,
  username TEXT NOT NULL,
  photoUrl TEXT NOT NULL,
  instagramUrl TEXT,
  caption TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt INT NOT NULL,
  used INT DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tags (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) UNIQUE,
  heroImage TEXT,
  inspiration TEXT
);

CREATE TABLE IF NOT EXISTS feedback_messages (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  userHandle VARCHAR(255),
  email VARCHAR(255),
  topic VARCHAR(255),
  message TEXT,
  timestamp BIGINT,
  status VARCHAR(50) DEFAULT 'UNREAD'
);

CREATE TABLE IF NOT EXISTS panel_content (
  id VARCHAR(50) PRIMARY KEY,
  content TEXT
);

CREATE TABLE IF NOT EXISTS custom_requests (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255),
  userHandle VARCHAR(255),
  email VARCHAR(255),
  itemName VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  budget DOUBLE,
  description TEXT,
  referenceImage TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  timestamp TEXT,
  adminNotes TEXT
);



export type Category = string;
export type Gender = 'Male' | 'Female' | 'Prefer not to say' | 'MALE' | 'FEMALE' | 'UNISEX' | 'MEN' | 'WOMEN';

export type UserRankTier = 'Newcomer' | 'Stylist' | 'Trendsetter' | 'Fashion Icon' | 'Closet Royalty' | 'Kraze Legend';

export interface RankBenefits {
  aiTryOnLimit?: number;
  tier: UserRankTier;
  vaultLimit: number;
  ticketsPerPurchase: { tickets: number; perItems: number };
  payForMeSlots: number;
  wishlistRetentionDays: number | 'PERMANENT';
  canSeeSponsors: boolean;
  canSeeOtherWishlists: boolean;
  stylistAiLimit: number;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENT' | 'AMOUNT';
  value: number;
  description: string;
  discount: number; // Added to match AdminPromoManager usage
  usageLimit: number; // Added to match AdminPromoManager usage
  usedCount: number; // Added to match AdminPromoManager usage
  expiryDate: string; // Added to match AdminPromoManager usage
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'URGENT' | 'REWARD' | 'WELCOME';
  timestamp: string;
  read: boolean;
  recipientId?: string; // For targeted notifications (e.g., supplierId)
}

export interface CustomizationField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'color';
  options?: string[]; // For select type
  required: boolean;
}

export interface ReviewImage {
  id: string;
  reviewId: string;
  url: string;
  thumbnailUrl?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userHandle: string;
  userName?: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  body?: string;
  comment?: string; // for backward compatibility
  images?: string[];
  reviewImages?: ReviewImage[];
  verifiedPurchase: boolean;
  createdAt: string;
  timestamp?: string; // for backward compatibility
  helpfulCount: number;
  userVoted?: boolean;
}

export interface RatingSummaryData {
  averageRating: number;
  totalCount: number;
  distribution: {
    5: { count: number; percentage: number };
    4: { count: number; percentage: number };
    3: { count: number; percentage: number };
    2: { count: number; percentage: number };
    1: { count: number; percentage: number };
  };
}

export interface ProductReviewsResponse {
  reviews: ProductReview[];
  ratingSummary: RatingSummaryData;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalReviews: number;
  };
  userHasReviewed: boolean;
  canReview: boolean;
}

export interface ProductUGCPost {
  id: string;
  productId: string;
  username: string;
  photoUrl: string;
  instagramUrl?: string;
  caption?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  shippingFee: number;
  image: string;
  images: string[];
  colors?: string[] | string;
  colorVariants?: { main: string; secondary: string }[];
  category: string;
  categoryId?: string;
  gender: Gender;
  description: string;
  details: string[];
  inStock: boolean;
  isNew?: boolean;
  viewers: number;
  stockCount: number;
  likes?: number;
  isHallOfFame?: boolean;
  synergyPath?: string;
  appeal?: string;
  brand?: string;
  tags?: string[];
  supplierId?: string;
  deliveryTime?: string;
  sizes: string[];
  isCustom?: boolean;
  priceRange?: { min: number; max: number };
  customizationFields?: CustomizationField[];
  createdAt?: string;
  offeredDiscount?: number;
  video?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  password?: string;
  plain_password?: string;
  region: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED' | 'PENDING';
  performanceScore: number;
  joinedDate: string;
  commissionRate?: number;
}

export interface User {
  id: string;
  handle: string;
  email: string;
  archetype: string;
  rep: number;
  level: number;
  coins: number;
  gems: number;
  status: 'ACTIVE' | 'BANNED' | 'RESTRICTED';
  lastLogin: string;
  totalSpent: number;
  loyaltyPoints: number;
  credit: number;
  profile_picture?: string;
  gender?: string;
  role?: string;
}

export interface QuizResults {
  userId: string;
  styles: string[];
  colors: string[];
  occasions: string[];
  budget: 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE';
  timestamp: number;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'EARN' | 'REDEEM';
  amount: number;
  reason: string;
  timestamp: number;
}

export interface Bundle {
  id: string;
  name: string;
  products: Product[];
  bundlePrice: number;
  originalPrice?: number;
  savings?: number;
  description: string;
  expiresIn: number;
}

export interface PriceAnomaly extends Product {
  productId: string;
  anomalyEndTime: number;
  discountPercent: number;
}

export interface CartItem extends Partial<Product> {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  shippingFee: number;
  image: string;
  images?: string[];
  quantity: number;
  selectedSize?: string;
  selectedColorVariant?: { main: string; secondary: string };
  isBundle?: boolean;
  bundleProducts?: Product[];
  customizationData?: Record<string, string>;
}

export enum ViewState {
  LOBBY = 'LOBBY',
  FAMOUS = 'FAMOUS',
  TRY_ON = 'TRY_ON',
  CATEGORIES = 'CATEGORIES',
  BUNDLES = 'BUNDLES',
  PRICE_ANOMALY = 'PRICE_ANOMALY',
  PROFILE = 'PROFILE',
  WISHLIST = 'WISHLIST',
  STYLIST = 'STYLIST',
  ADMIN = 'ADMIN',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  SUPPLIER_LOGIN = 'SUPPLIER_LOGIN',
  ROLE_SELECTION = 'ROLE_SELECTION',
  SUPPLIER_DASHBOARD = 'SUPPLIER_DASHBOARD',
  CHECKOUT = 'CHECKOUT',
  CONTACT = 'CONTACT',
  LEGAL = 'LEGAL',
  PAY_FOR_ME = 'PAY_FOR_ME',
  PAY_FOR_ME_SHARED = 'PAY_FOR_ME_SHARED',
  SOCIAL = 'SOCIAL',
  HALL_OF_FAME = 'HALL_OF_FAME',
  ADMIN_NOTIFICATIONS = 'ADMIN_NOTIFICATIONS',
  STYLE_PROTOCOL = 'STYLE_PROTOCOL',
  SCROLL_MODE = 'SCROLL_MODE',
  SEARCH = 'SEARCH',
  CUSTOM_REQUESTS = 'CUSTOM_REQUESTS',
  KFAM = 'KFAM',
  ABOUT = 'ABOUT',
  PRIVACY = 'PRIVACY'
}

export interface ReferralRecord {
  id: string;
  refereeId: string;
  refereeName: string;
  refereeAvatar?: string | null;
  status: 'pending' | 'completed' | 'expired';
  rewardAmount: number;
  createdAt: string;
  completedAt?: string | null;
}

export interface ReferralStats {
  totalInvited: number;
  completedCount: number;
  pendingCount: number;
  totalEarned: number;
}

export enum Page {
  HOME = 'HOME',
  SHOP = 'SHOP'
}

export interface Quest {
  id: string;
  title: string;
  rewardREP: number;
  icon: string;
  completed: boolean;
}

export interface UserStats {
  brandSubscriptions?: string[];
  tagSubscriptions?: string[];
  aiTryOnsUsedToday?: number;
  userId: string;
  level: number;
  experience: number;
  nextLevelExp: number;
  rank: string;
  totalSpent: number;
  storeCredit?: number;
  itemsOwned: number;
  achievements: Achievement[];
  dailyQuests: any[];
  quests: Quest[];
  selectedPath: string | null;
  stylistAiUses?: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: string;
  trackingNumber?: string;
  deliveryAddress: string;
  phone?: string;
  creditUsed?: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface TrendReport {
  text: string;
  sources: { title: string; uri: string }[];
}

// Added missing interfaces to resolve compilation errors in extendedMock.ts, socialProofData.ts, and SocialProofPopup.tsx

/** 
 * Represents the statistical performance data of a product for velocity calculations.
 */
// Removed ProductPerformance as it is no longer used


/** 
 * Represents a gamification achievement for the user profile.
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  goal: number;
  rewardREP: number;
}

/** 
 * Represents a real-time social activity event for the social proof notification system.
 */
export interface SocialEvent {
  id: string;
  type: 'PURCHASE' | 'RESERVE' | 'LEVEL_UP' | 'ARENA_WIN';
  user: string;
  productName?: string;
  location: string;
  timestamp: string;
}

/** 
 * Represents inventory scarcity data restricted by geographic region.
 */
export interface RegionalScarcity {
  productId: string;
  region: string;
  stockLevel: 'CRITICAL' | 'LOW' | 'STABLE';
  unitsLeft: number;
}

export enum PayForMeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED'
}

export interface PayForMeRequest {
  id: string;
  userId: string;
  userName: string;
  items: CartItem[];
  total: number;
  amountPaid: number;
  status: PayForMeStatus;
  timestamp: string;
  payerName?: string;
  payerContact?: string;
  message?: string;
  shippingProtocol?: CheckoutProtocol;
}

export interface UserPost {
  id: string;
  userId: string;
  userHandle: string;
  image: string;
  likes: number;
  dislikes: number;
  reports: number;
  timestamp: string;
  weekId: string;
}

export interface SocialComment {
  id: string;
  postId: string;
  userId: string;
  userHandle: string;
  text: string;
  timestamp: string;
}

export interface SocialInteraction {
  userId: string;
  postId: string;
  type: 'LIKE' | 'DISLIKE';
}

export interface CheckoutProtocol {
  id: string;
  name: string;
  phone: string;
  address: string;
  region: string;
  city: string;
  isDefault?: boolean;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug?: string;
  heroImage?: string;
  inspiration?: string;
}

export interface UserPreferences {
  userId: string;
  preferredCategories: Category[];
  preferredGenders: Gender[];
  styleArchetype?: string;
  colorPreferences?: string[];
  priceRange?: { min: number; max: number };
  styleProtocolCompleted?: boolean;
  checkoutProtocolCompleted?: boolean;
  tutorialFinished?: boolean;
}

export interface UserHistory {
  userId: string;
  viewedProductIds: string[];
  wishlistedProductIds: string[];
  purchasedProductIds: string[];
  cartedProductIds?: string[];
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  type: 'bank' | 'mobile_money';
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  recipientCode: string;
  transferCode: string;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export interface FeedbackMessage {
  id: string;
  userId: string;
  userHandle: string;
  email: string;
  topic: string;
  message: string;
  timestamp: number;
  status: 'UNREAD' | 'READ' | 'REPLIED';
}

export interface PanelContent {
  id: string;
  content: string; // Stored as JSON string if object
}

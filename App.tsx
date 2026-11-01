
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import CookieConsent from './components/CookieConsent';
import LegalPanel from './components/LegalPanel';
import GlobalLoadingBar from './components/GlobalLoadingBar';
import { triggerHaptic } from './lib/haptics';
import { triggerGlobalLoading } from './lib/loading';

const lazyImport = (factory: () => Promise<any>) => React.lazy(async () => {
  try {
    const component = await factory();
    sessionStorage.removeItem('retry_import');
    return component;
  } catch (error: any) {
    const isImportError = error?.message?.includes('dynamically imported module') || 
                          error?.message?.includes('fetch') || 
                          error?.message?.includes('Failed to fetch') ||
                          error?.name === 'TypeError' ||
                          error?.toString().includes('dynamically imported module');
                          
    if (isImportError) {
      if (!sessionStorage.getItem('retry_import')) {
        sessionStorage.setItem('retry_import', 'true');
        window.location.reload();
        return { default: () => null };
      }
    }
    throw error;
  }
});

const ProductDetail = lazyImport(() => import('./components/ProductDetail'));
const CartDrawer = lazyImport(() => import('./components/CartDrawer'));
const NotificationCenter = lazyImport(() => import('./components/NotificationCenter'));
const Lobby = lazyImport(() => import('./components/HomeLobby'));
const FamousProducts = lazyImport(() => import('./components/FamousProducts'));

const Bundles = lazyImport(() => import('./components/Bundles'));
const Categories = lazyImport(() => import('./components/Categories'));
const Profile = lazyImport(() => import('./components/Profile'));
const WishlistView = lazyImport(() => import('./components/WishlistView'));
const CategoryPanel = lazyImport(() => import('./components/CategoryPanel'));
const SearchPanel = lazyImport(() => import('./components/SearchPanel'));
const SearchPageView = lazyImport(() => import('./components/SearchPageView'));
const CategoryProductsPanel = lazyImport(() => import('./components/CategoryProductsPanel'));
const AdminPanel = lazyImport(() => import('./components/AdminPanel'));
const SupplierDashboard = lazyImport(() => import('./components/SupplierDashboard'));
const CheckoutView = lazyImport(() => import('./components/CheckoutView'));
const AdminLogin = lazyImport(() => import('./components/AdminLogin'));
const SupplierLogin = lazyImport(() => import('./components/SupplierLogin'));
const RoleSelection = lazyImport(() => import('./components/RoleSelection'));
const ContactPanel = lazyImport(() => import('./components/ContactPanel'));
const PayForMe = lazyImport(() => import('./components/PayForMe'));
const PayForMeSharedView = lazyImport(() => import('./components/PayForMeSharedView'));
const Tutorial = lazyImport(() => import('./components/Tutorial'));
const LandingScreen = lazyImport(() => import('./components/LandingScreen'));
const VaultEntrance = lazyImport(() => import('./components/VaultEntrance'));
const BannedPage = lazyImport(() => import('./components/BannedPage'));
const SocialGallery = lazyImport(() => import('./components/SocialGallery'));
const StylistAI = lazyImport(() => import('./components/StylistAI'));
const CustomRequestsView = lazyImport(() => import('./components/CustomRequestsView'));
const StyleProtocol = lazyImport(() => import('./components/StyleProtocol'));
const ScrollMode = lazyImport(() => import('./components/ScrollMode'));
const CheckoutProtocolSetup = lazyImport(() => import('./components/CheckoutProtocolSetup').then(m => ({ default: m.CheckoutProtocolSetup })));
const ResetPassword = lazyImport(() => import('./components/ResetPassword'));
const ComparisonView = lazyImport(() => import('./components/ComparisonView'));
const KFamView = lazyImport(() => import('./components/KFamView'));
const AboutPage = lazyImport(() => import('./components/AboutPage'));
const PrivacyPage = lazyImport(() => import('./components/PrivacyPage'));
const PWAPromptModal = lazyImport(() => import('./components/PWAPromptModal'));
const FittingRoom = lazyImport(() => import('./components/FittingRoom'));
import { Scale } from 'lucide-react';
import { motion } from 'motion/react';
import { databaseService } from './services/databaseService';
import { getCurrentRank } from './data/rankingSystem';
import { Toaster, toast } from 'sonner';
import { trackPlausibleEvent } from './lib/analytics';
import { Product, CartItem, Page, ViewState, UserStats, Notification, PromoCode, Bundle, UserPreferences, CheckoutProtocol, CategoryInfo, Category } from './types';
import { sortProductsByProtocol } from './lib/styleProtocol';
import { CATEGORY_GROUPS } from './constants';
import { matchesCategory } from './lib/categoryUtils';

import MaintenanceMode from './components/MaintenanceMode';
import SectionErrorBoundary from './components/SectionErrorBoundary';
import { ProductGridSkeleton, CategorySkeleton, NotificationSkeleton } from './components/Skeleton';

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route path="/payformeshared/:userName/:productId/:requestId" element={<PayForMeSharedView />} />
          <Route path="*" element={<MainApp />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

const MainApp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || urlParams.get('trxref');
    
    if (reference) {
      toast.info("Verifying secure checkout handshake...");
      databaseService.verifyPaystackTransaction(reference)
        .then(res => {
           if (res.status && res.data.status === 'success') {
              const metadata = res.data.metadata || {};
              if (metadata.type === 'STANDARD_CHECKOUT') {
                 toast.success("Payment successful! Your order has been placed.");
                 setCart([]); // Clear local cart
                 localStorage.setItem('closet-kraze-cart', '[]');
                 navigate('/profile');
                 setCurrentView(ViewState.PROFILE);
              } else if (metadata.type === 'PAY_FOR_ME') {
                 toast.success("Sponsorship transaction completed!");
                 navigate('/pay-for-me');
                 setCurrentView(ViewState.PAY_FOR_ME);
              }
           } else {
              toast.error("Transaction validation failed.");
           }
        })
        .catch(err => {
           console.error(err);
           toast.error("Failed to verify transaction status.");
        });
      // Remove query param from URL without reloading
      navigate(window.location.pathname, { replace: true });
    }
  }, [navigate]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialFinished, setTutorialFinished] = useState<boolean>(() => localStorage.getItem('cc-tutorial-finished') === 'true');
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const path = window.location.pathname;
    if (path === '/kits') return ViewState.BUNDLES;
    if (path === '/famous') return ViewState.FAMOUS;
    if (path === '/categories') return ViewState.CATEGORIES;
    if (path === '/social') return ViewState.SOCIAL;
    if (path === '/wishlist') return ViewState.WISHLIST;
    if (path === '/profile') return ViewState.PROFILE;
    if (path === '/checkout') return ViewState.CHECKOUT;
    if (path === '/stylist') return ViewState.STYLIST;
    if (path === '/scroll') return ViewState.SCROLL_MODE;
    if (path === '/contact') return ViewState.CONTACT;
    if (path === '/admin') return ViewState.ADMIN;
    if (path === '/supplier') return ViewState.SUPPLIER_DASHBOARD;
    if (path === '/role-selection') return ViewState.ROLE_SELECTION;
    if (path === '/admin-login') return ViewState.ADMIN_LOGIN;
    if (path === '/supplier-login') return ViewState.SUPPLIER_LOGIN;
    if (path === '/pay-for-me') return ViewState.PAY_FOR_ME;
    if (path === '/search') return ViewState.SEARCH;
    if (path === '/legal') return ViewState.LEGAL;
    return ViewState.LOBBY;
  });
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('cc-theme') as 'dark' | 'light') || 'light');
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('closet-kraze-cart') || '[]');
    } catch (e) {
      console.error('Error parsing cart:', e);
      return [];
    }
  });
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('closet-kraze-wishlist') || '[]');
    } catch (e) {
      console.error('Error parsing wishlist:', e);
      return [];
    }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isCategoryProductsOpen, setIsCategoryProductsOpen] = useState(false);

  // Dynamic mounting handlers to completely prevent preloading/rendering chunks on initial page loads
  const [cartMounted, setCartMounted] = useState(false);
  useEffect(() => {
    if (isCartOpen) {
      setCartMounted(true);
    } else {
      const timer = setTimeout(() => {
        setCartMounted(false);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isCartOpen]);

  const [notificationsMounted, setNotificationsMounted] = useState(false);
  useEffect(() => {
    if (isNotificationOpen) {
      setNotificationsMounted(true);
    } else {
      const timer = setTimeout(() => {
        setNotificationsMounted(false);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isNotificationOpen]);

  const [categoryPanelMounted, setCategoryPanelMounted] = useState(false);
  useEffect(() => {
    if (isCategoryPanelOpen) {
      setCategoryPanelMounted(true);
    } else {
      const timer = setTimeout(() => {
        setCategoryPanelMounted(false);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isCategoryPanelOpen]);

  const [searchMounted, setSearchMounted] = useState(false);
  useEffect(() => {
    if (isSearchOpen) {
      setSearchMounted(true);
    } else {
      const timer = setTimeout(() => {
        setSearchMounted(false);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  const [categoryProductsMounted, setCategoryProductsMounted] = useState(false);
  useEffect(() => {
    if (isCategoryProductsOpen) {
      setCategoryProductsMounted(true);
    } else {
      const timer = setTimeout(() => {
        setCategoryProductsMounted(false);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isCategoryProductsOpen]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSupplierAuthenticated, setIsSupplierAuthenticated] = useState<boolean>(false);
  
  const refreshAuth = async () => {
    setIsAuthChecking(true);
    try {
      const [authData, maintenance] = await Promise.all([
        databaseService.checkAuth(),
        databaseService.getMaintenanceMode()
      ]);
      
      const isUserAuth = !!authData.isUserSession;
      const isAdminAuth = !!authData.isAdminSession;
      const isSupplierAuth = !!authData.isSupplierSession;
      
      setIsAuthenticated(isUserAuth || isAdminAuth);
      setIsAdmin(isAdminAuth);
      setIsSupplierAuthenticated(isSupplierAuth);
      
      // Update local storage to match server state
      if (isUserAuth) {
        localStorage.setItem('cc-auth-token', 'true');
      } else {
        localStorage.removeItem('cc-auth-token');
      }
      
      if (isAdminAuth) {
        localStorage.setItem('cc-admin-auth', 'true');
      } else {
        localStorage.removeItem('cc-admin-auth');
      }

      if (isSupplierAuth) {
        localStorage.setItem('cc-supplier-auth', 'true');
      } else {
        localStorage.removeItem('cc-supplier-auth');
      }
      
      // Separate User Session
      if (isUserAuth) {
        const userId = authData.user?.id;
        const userHandle = authData.user?.handle;
        
        if (userId) {
          localStorage.setItem('cc-user-id', userId);
          setStats(prev => ({ ...prev, userId }));
        }
        if (userHandle) {
          localStorage.setItem('cc-user-handle', userHandle);
          setHandle(userHandle);
        }
      } else {
        // Clear standard user details only from local state if no user session is active
        localStorage.removeItem('cc-user-id');
        setStats(prev => ({ ...prev, userId: 'guest' }));
        setUserPrefs(null);
        setCheckoutProtocols([]);
      }

      // Separate Admin Session
      if (isAdminAuth) {
        localStorage.setItem('cc-admin-id', authData.user?.id || localStorage.getItem('cc-admin-id') || 'admin');
        localStorage.setItem('cc-admin-auth', 'true');
      } else {
        localStorage.removeItem('cc-admin-id');
        localStorage.removeItem('cc-admin-auth');
      }

      // Separate Supplier Session
      if (isSupplierAuth) {
        const supplierId = authData.user?.id || localStorage.getItem('cc-supplier-id') || 'sup1';
        setActiveSupplierId(supplierId);
        localStorage.setItem('cc-supplier-id', supplierId);
        localStorage.setItem('cc-supplier-auth', 'true');
      } else {
        setActiveSupplierId(null);
        localStorage.removeItem('cc-supplier-id');
        localStorage.removeItem('cc-supplier-auth');
      }
      
      setMaintenanceMode(maintenance?.enabled || false);
      
      if (maintenance?.enabled && !isAdminAuth && currentView !== ViewState.CHECKOUT) {
        // Force logout if not admin or in checkout
         if (isUserAuth) {
           databaseService.logout();
           setIsAuthenticated(false);
         }
      }

      if (isUserAuth) {
        const userId = authData.user?.id || localStorage.getItem('cc-user-id');
        if (userId) {
          setStats(prev => ({ ...prev, userId }));
          try {
            const [prefs, protocols] = await Promise.all([
              databaseService.getUserPreferences(userId),
              databaseService.getUserLogistics(userId)
            ]);
            setUserPrefs(prefs);
            setCheckoutProtocols(Array.isArray(protocols) ? protocols : protocols ? [protocols] : []);
          } catch (e) {
            console.error('Error fetching user meta details:', e);
          }
        }
      }
    } catch (e) {
      console.error('refreshAuth error:', e);
      setIsAuthenticated(localStorage.getItem('cc-auth-token') === 'true');
      setIsAdmin(localStorage.getItem('cc-admin-auth') === 'true');
      setIsSupplierAuthenticated(localStorage.getItem('cc-supplier-auth') === 'true');
      setActiveSupplierId(localStorage.getItem('cc-supplier-id'));
    } finally {
      setIsAuthChecking(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    setIsInitializing(true);
    setProductError(null);
    try {
      const fetchedProducts = await databaseService.getProducts();
      if (Array.isArray(fetchedProducts)) {
        setProducts(fetchedProducts);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProductError(error?.message || "Could not load products. Please check connection.");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
    fetchProducts();
    
    // Fetch categories and bundles in parallel background tasks without blocking
    databaseService.getCategories()
      .then(fetchedCategories => setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []))
      .catch(err => console.error('Error loading categories:', err));

    databaseService.getBundles()
      .then(fetchedBundles => setBundles(Array.isArray(fetchedBundles) ? fetchedBundles : []))
      .catch(err => console.error('Error loading bundles:', err));

    // Check for password reset token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      // Remove token from URL to prevent accidental sharing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchProducts]);

  // Handle deep linking to products with metadata (size, message, ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('productId') || params.get('product');
    const msg = params.get('msg');

    if (!pId) return;

    const resolveProduct = async () => {
      let product = products.find(p => p.id === pId);
      if (!product) {
        product = await databaseService.getProductById(pId) || undefined;
      }
      if (product) {
        setSelectedProduct(product);
        if (msg) {
          toast.info(`Shared Note: "${msg}"`, { duration: 5000 });
        }
        // Clean URL while keeping session clean
        const baseUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, baseUrl);
      }
    };

    resolveProduct();
  }, [products]);

  // Periodically check maintenance mode
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const maintenance = await databaseService.getMaintenanceMode();
        if (maintenance?.enabled !== maintenanceMode) {
          setMaintenanceMode(maintenance?.enabled || false);
          
          if (maintenance?.enabled && !isAdmin && currentView !== ViewState.CHECKOUT) {
             databaseService.logout();
             setIsAuthenticated(false);
             toast.info("System entering maintenance mode. Active session terminated.");
          }
        }
      } catch (e) {
        console.error("Maintenance check failed", e);
      }
    };
    
    const interval = setInterval(checkMaintenance, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [maintenanceMode, isAdmin, currentView]);

  const [rep, setRep] = useState<number>(8500);
  const [credit, setCredit] = useState<number>(0);
  const [handle, setHandle] = useState<string>(() => localStorage.getItem('cc-user-handle') || 'Guest User');
  const [genderState, setGenderState] = useState<string>('');
  const [isBanned, setIsBanned] = useState(false);
  const [activePromo, setActivePromo] = useState<PromoCode | null>(null);
  const [limitedOfferEnd, setLimitedOfferEnd] = useState<number | null>(null);
  const [surgeTimerEnd, setSurgeTimerEnd] = useState<number | null>(() => {
    const saved = localStorage.getItem('cc-surge-timer');
    return saved ? parseInt(saved, 10) : null;
  });
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [checkoutProtocols, setCheckoutProtocols] = useState<CheckoutProtocol[]>([]);
  const [showStyleQuiz, setShowStyleQuiz] = useState<boolean>(false);
  const [isManualStyleQuiz, setIsManualStyleQuiz] = useState<boolean>(false);
  const [styleQuizInitialStep, setStyleQuizInitialStep] = useState<number>(0);
  const [showCheckoutProtocolSetup, setShowCheckoutProtocolSetup] = useState<boolean>(false);
  const [isManualCheckoutSetup, setIsManualCheckoutSetup] = useState<boolean>(false);

  // Back Button Interceptor for Modals & Overlays
  const isAnyOverlayOpen = useMemo(() => {
    return !!(
      selectedProduct ||
      isCartOpen ||
      isNotificationOpen ||
      isCategoryPanelOpen ||
      isSearchOpen ||
      isCategoryProductsOpen ||
      isComparisonOpen ||
      showAuthModal ||
      showStyleQuiz ||
      showCheckoutProtocolSetup
    );
  }, [
    selectedProduct,
    isCartOpen,
    isNotificationOpen,
    isCategoryPanelOpen,
    isSearchOpen,
    isCategoryProductsOpen,
    isComparisonOpen,
    showAuthModal,
    showStyleQuiz,
    showCheckoutProtocolSetup
  ]);

  const overlayPushedRef = React.useRef(false);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (overlayPushedRef.current) {
        overlayPushedRef.current = false;
        setSelectedProduct(null);
        setIsCartOpen(false);
        setIsNotificationOpen(false);
        setIsCategoryPanelOpen(false);
        setIsSearchOpen(false);
        setIsCategoryProductsOpen(false);
        setIsComparisonOpen(false);
        setShowAuthModal(false);
        setShowStyleQuiz(false);
        setShowCheckoutProtocolSetup(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isAnyOverlayOpen) {
      if (!overlayPushedRef.current) {
        window.history.pushState({ overlayActive: true }, "");
        overlayPushedRef.current = true;
      }
    } else {
      if (overlayPushedRef.current) {
        overlayPushedRef.current = false;
        window.history.back();
      }
    }
  }, [isAnyOverlayOpen]);

  const resetLimitedOffer = async () => {
    const userId = localStorage.getItem('cc-user-id');
    if (userId) {
      try {
        const session = await databaseService.startUserAnomalySession(userId);
        if (session && session.endTime) {
          setLimitedOfferEnd(session.endTime);
        }
      } catch (e) {
        console.error('Error resetting limited offer:', e);
      }
    } else {
      const newEnd = Date.now() + (3600 * 1000); // 1 hour from now
      setLimitedOfferEnd(newEnd);
      localStorage.setItem('cc-limited-offer-timer', newEnd.toString());
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('cc-user-id');
    if (!limitedOfferEnd && !isAuthenticated && userId && userId !== 'u1') {
      const interval = setInterval(() => {
        resetLimitedOffer();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [limitedOfferEnd, isAuthenticated]);

  const [stats, setStats] = useState<UserStats>(() => {
    // Initial mock stats, will be updated in useEffect
    return {
      userId: 'guest',
      level: 1,
      experience: 0,
      nextLevelExp: 1000,
      rank: 'Newcomer',
      totalSpent: 0,
      itemsOwned: 0,
      achievements: [],
      dailyQuests: [],
          aiTryOnsUsedToday: 0,
      quests: [],
      selectedPath: null,
      brandSubscriptions: [],
      tagSubscriptions: [],
      complianceScore: 0,
      complianceStreak: 0,
      lastComplianceDate: null,
      neuralAlignment: 50
    };
  });

  const handleUpdateStats = async (newStats: UserStats) => {
    setStats(newStats);
    const userId = localStorage.getItem('cc-user-id');
    if (userId) {
      try {
        await databaseService.updateUserStats(userId, newStats);
      } catch (error) {
        console.error('Error updating stats on backend:', error);
      }
    }
  };

  const fetchStats = async () => {
    const userId = localStorage.getItem('cc-user-id');
    if (userId) {
      try {
        const profile = await databaseService.getUserProfile(userId);
        if (profile.stats) setStats(profile.stats);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    }
  };

  const initUser = async (uId?: string) => {
    const userId = uId || localStorage.getItem('cc-user-id');
    if (userId && (isAuthenticated || uId)) {
      setIsUserLoading(true);
      // Sync for compatibility
      if (!localStorage.getItem('userId')) {
        localStorage.setItem('userId', userId);
      }
      try {
        const profile = await databaseService.getUserProfile(userId);
        if (profile && profile.status === 'BANNED') {
          setIsBanned(true);
          return;
        }
        if (profile) {
          setRep(profile.rep ?? 8500);
          setCredit(profile.credit ?? 0);
          setHandle(profile.handle || 'Anonymous');
          setGenderState(profile.gender || '');
          if (profile.stats) {
            setStats(profile.stats);
          } else {
            setStats(prev => ({ ...prev, userId }));
          }
          if (profile.preferences) {
            setUserPrefs(profile.preferences);
            if (profile.preferences.tutorialFinished) {
              setTutorialFinished(true);
              localStorage.setItem('cc-tutorial-finished', 'true');
            }
          }
        }
        
        // Fetch wishlist and cart from backend safely
        const backendWishlist = await databaseService.getWishlist(userId);
        if (Array.isArray(backendWishlist)) {
          setWishlist(backendWishlist.map((p: any) => typeof p === 'object' && p !== null ? p.id : p).filter(Boolean));
        }
        
        const backendCartRaw = await databaseService.getCart(userId);
        const backendCart = Array.isArray(backendCartRaw) ? backendCartRaw.map((item: any) => ({
          ...item,
          id: item.id || item.productId
        })) : [];
        
        setCart((prevLocal: any[]) => {
          const merged = [...backendCart];
          if (Array.isArray(prevLocal)) {
            prevLocal.forEach(localItem => {
              if (!localItem) return;
              const existsOnBackend = merged.find(bItem => 
                bItem.id === localItem.id && 
                (bItem.selectedSize || undefined) === (localItem.selectedSize || undefined) &&
                JSON.stringify(bItem.selectedColorVariant || null) === JSON.stringify(localItem.selectedColorVariant || null) &&
                JSON.stringify(bItem.customizationData || null) === JSON.stringify(localItem.customizationData || null)
              );
              if (!existsOnBackend) {
                merged.push(localItem);
                databaseService.addToCart(userId, {
                  productId: localItem.id,
                  name: localItem.name,
                  price: localItem.price,
                  originalPrice: localItem.originalPrice,
                  image: localItem.image,
                  category: localItem.category,
                  quantity: localItem.quantity,
                  selectedSize: localItem.selectedSize,
                  selectedColorVariant: localItem.selectedColorVariant,
                  customizationData: localItem.customizationData
                }).catch(err => console.error('Failed to sync guest item to backend:', err));
              }
            });
          }
          return merged;
        });

        // Check and initialize anomaly session
        try {
          const config = await databaseService.getAnomalyConfig();
          if (config) {
            let session = await databaseService.getUserAnomalySession(userId);
            if (!session || session.eventId !== config.eventId) {
              session = await databaseService.startUserAnomalySession(userId);
            }
            if (session && session.endTime) {
              setLimitedOfferEnd(session.endTime);
              localStorage.setItem('cc-limited-offer-timer', session.endTime.toString());
            }
          }
        } catch (e) {
          console.error('Error initializing anomaly session:', e);
        }
      } catch (error: any) {
        console.error('Error initializing user from backend:', error);
        if (error.message?.includes('401') || error.message?.includes('403')) {
           localStorage.removeItem('cc-user-id');
           localStorage.removeItem('cc-auth-token');
           localStorage.removeItem('cc-user-handle');
           setHandle('Guest User');
           setIsAuthenticated(false);
        }
        if (error.message?.includes('404')) {
          localStorage.removeItem('cc-user-id');
          localStorage.removeItem('cc-auth-token');
        }
      } finally {
        setIsUserLoading(false);
      }
    } else {
      // Guest mode - don't fetch u1 prefs/stats from backend as it requires auth
      setStats(prev => ({ ...prev, userId: 'guest' }));
      setRep(Number(localStorage.getItem('cc-user-rep') || '8500'));
    }
  };

  useEffect(() => {
    initUser();
  }, [isAuthenticated]);

  // removed Protocol sequences (Style -> Checkout) effect

  const sortedProducts = React.useMemo(() => {
    return sortProductsByProtocol(products, userPrefs);
  }, [products, userPrefs]);

  const [socialPosts, setSocialPosts] = useState<any[]>([]);

  // Live Activity
  const [activeUsers, setActiveUsers] = useState(1024);

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'USER_COUNT') {
          setActiveUsers(data.count);
        } else if (data.type === 'SOCIAL_PROOF') {
          toast(data.message, {
            description: 'Real-time activity',
            icon: '🔥',
          });
        } else if (data.type === 'ACTIVITY') {
          // Optional: show subtle activity feed or just log
          console.log('Live Activity:', data.message);
        }
      } catch (e) {
        console.error('WS Message Error:', e);
      }
    };

    return () => socket.close();
  }, []);

  const currentRank = useMemo(() => getCurrentRank(rep), [rep]);
  const balances = { coins: 4250, gems: 120, rep: rep };

  useEffect(() => {
    localStorage.setItem('closet-kraze-cart', JSON.stringify(cart));
    
    // Update guest activity timestamp on every cart state change
    if (!isAuthChecking && !isAuthenticated) {
      if (cart.length > 0) {
        localStorage.setItem('closet-kraze-cart-last-active', Date.now().toString());
      } else {
        localStorage.removeItem('closet-kraze-cart-last-active');
      }
    }

    if (cart.length === 0) {
      setSurgeTimerEnd(null);
      localStorage.removeItem('cc-surge-timer');
    }
  }, [cart, isAuthenticated, isAuthChecking]);

  // Check and auto-clear inactive guest carts on load
  useEffect(() => {
    if (isAuthChecking) return;

    if (!isAuthenticated) {
      const guestCart = localStorage.getItem('closet-kraze-cart');
      if (guestCart && guestCart !== '[]') {
        const lastActiveStr = localStorage.getItem('closet-kraze-cart-last-active');
        if (lastActiveStr) {
          const lastActive = Number(lastActiveStr);
          const oneDayInMs = 24 * 60 * 60 * 1000;
          if (Date.now() - lastActive > oneDayInMs) {
            setCart([]);
            localStorage.removeItem('closet-kraze-cart');
            localStorage.removeItem('closet-kraze-cart-last-active');
            toast.info('Guest cart auto-cleared after 24 hours of inactivity.');
          }
        } else {
          localStorage.setItem('closet-kraze-cart-last-active', Date.now().toString());
        }
      }
    }
  }, [isAuthChecking, isAuthenticated]);

  useEffect(() => {
    if (rep !== null && rep !== undefined) {
      localStorage.setItem('cc-user-rep', rep.toString());
    }
    localStorage.setItem('cc-user-handle', handle);
  }, [rep, handle]);

  useEffect(() => {
    localStorage.setItem('closet-kraze-stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('cc-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (tutorialFinished !== null && tutorialFinished !== undefined) {
      localStorage.setItem('cc-tutorial-finished', tutorialFinished.toString());
    }
  }, [tutorialFinished]);

  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        const userId = localStorage.getItem('cc-user-id');
        const notifs = await databaseService.getGlobalNotifications(userId || undefined);
        setNotifications(Array.isArray(notifs) ? notifs : []);
        const posts = await databaseService.getSocialPosts();
        setSocialPosts(Array.isArray(posts) ? posts : []);
      } catch (error) {
        console.error('Error fetching additional data:', error);
      }
    };
    fetchAdditionalData();

    // Custom events for global cart/search opening
    const handleOpenCart = () => setIsCartOpen(true);
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    window.addEventListener('open-search', handleOpenSearch);
    return () => {
      window.removeEventListener('open-cart', handleOpenCart);
      window.removeEventListener('open-search', handleOpenSearch);
    };
  }, []);

  const addToCart = async (product: Product, selectedSize?: string, selectedColorVariant?: { main: string; secondary: string }, customizationData?: Record<string, string>) => {
    triggerGlobalLoading(600);
    // Stock Check
    if (!product.inStock || product.stockCount <= 0) {
      toast.error('This item is currently out of stock.');
      return;
    }

    // Checkout Safeguard (Scroll Mode Only)
    // ONLY check if the user HAS a target set.
    if (currentView === ViewState.SCROLL_MODE) {
      const savedTarget = localStorage.getItem('cc-haul-target');
      const haulTarget = (savedTarget && savedTarget !== '0') ? Number(savedTarget) : 0;
      
      if (haulTarget > 0) {
        const currentTotal = cart.reduce((acc, item) => acc + item.quantity, 0);
        if (currentTotal >= haulTarget) {
          if (!confirm(`Checkout Safeguard: Your tactical quota of ${haulTarget} items is fulfilled. Extend cart anyway?`)) {
            return;
          }
        }
      }
    }

    // Physical haptic confirmation
    triggerHaptic('success');

    // Optimistic local update for offline persistence
    const newItem: CartItem = {
      ...product,
      selectedSize,
      selectedColorVariant,
      customizationData,
      quantity: 1
    };

    setCart(prev => {
      const existing = prev.find(i => 
        i.id === product.id && 
        i.selectedSize === selectedSize && 
        JSON.stringify(i.selectedColorVariant) === JSON.stringify(selectedColorVariant) &&
        JSON.stringify(i.customizationData) === JSON.stringify(customizationData)
      );
      if (existing) {
        if (existing.quantity + 1 > (product.stockCount || 0)) {
          toast.error("That's all in stock");
          return prev;
        }
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, newItem];
    });

    if (isAuthenticated) {
      const userId = localStorage.getItem('cc-user-id');
      if (userId) {
        try {
          await databaseService.addToCart(userId, {
            productId: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            category: product.category,
            quantity: 1,
            selectedSize: selectedSize,
            selectedColorVariant: selectedColorVariant,
            customizationData: customizationData
          });
          databaseService.trackAction(userId, product.id, 'cart');
        } catch (error) {
          console.error('Offline sync failed, keeping local state:', error);
          toast.info('Connection unstable. Saved locally.');
        }
      }
    } else {
      // Guest users can also add to cart for persistence
      toast.info('Item added to guest bag. Login to sync across devices.');
    }

    toast.success('Added to cart');
    setIsCartOpen(true);
  };

  const handleQuickBuy = (product: Product) => {
    if (!product.inStock || product.stockCount <= 0) {
      toast.error('This item is currently out of stock.');
      return;
    }

    const cartItem: CartItem = {
      ...product,
      quantity: 1,
      selectedSize: product.sizes?.[0] || '',
      selectedColorVariant: product.colorVariants?.[0]
    };

    setDirectCheckoutItem(cartItem);
    handleNavigateView(ViewState.CHECKOUT);
  };

  const handleReorder = async (items: CartItem[]) => {
    let addedCount = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        if (!product.inStock || product.stockCount <= 0) {
          toast.warning(`"${item.name}" is out of stock and was skipped.`);
          continue;
        }
        await addToCart(product, item.selectedSize, item.selectedColorVariant, item.customizationData);
        addedCount++;
      } else {
        const fallbackProduct: Product = {
          id: item.id,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice || item.price,
          shippingFee: 0,
          image: item.image,
          images: [item.image],
          category: item.category || 'Reorder',
          inStock: true,
          stockCount: 99,
          description: '',
          details: [],
          sizes: item.selectedSize ? [item.selectedSize] : ['M'],
          viewers: 0,
          isCustom: false,
          gender: 'UNISEX'
        };
        await addToCart(fallbackProduct, item.selectedSize, item.selectedColorVariant, item.customizationData);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      toast.success(`Restored ${addedCount} past item(s) to active cart.`);
      setIsCartOpen(true);
    } else {
      toast.error("Could not restore past items. No stock available.");
    }
  };

  const gainRep = async (amount: number) => {
    const userId = localStorage.getItem('cc-user-id') || 'u1'; 
    const updatedUser = await databaseService.addRep(userId, amount);
    if (updatedUser) {
      setRep(updatedUser.rep);
      setStats(await databaseService.getUserStats(userId));
    }
  };

  const trackAchievement = async (achievementId: string, progress: number) => {
    const userId = localStorage.getItem('cc-user-id') || 'u1';
    await databaseService.updateAchievementProgress(userId, achievementId, progress);
    setStats(await databaseService.getUserStats(userId));
    const profile = await databaseService.getUserProfile(userId);
    if (profile) setRep(profile.rep);
  };

  const toggleWishlist = async (product: Product) => {
    triggerHaptic('like');
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const userId = localStorage.getItem('cc-user-id');
    if (userId) {
      const isAdding = !wishlist.includes(product.id);
      try {
        if (isAdding) {
          await databaseService.addToWishlist(userId, product.id);
          gainRep(5);
          trackAchievement('a5', 1); // Void Stalker progress
          databaseService.trackAction(userId, product.id, 'wishlist');
        } else {
          await databaseService.removeFromWishlist(userId, product.id);
        }
        // Refresh wishlist from backend
        const backendWishlist = await databaseService.getWishlist(userId);
        if (Array.isArray(backendWishlist)) {
          setWishlist(backendWishlist.map((p: any) => typeof p === 'object' && p !== null ? p.id : p).filter(Boolean));
        }
      } catch (error) {
        console.error('Error toggling wishlist on backend:', error);
      }
    }
  };

  const toggleComparison = (product: Product) => {
    setComparisonList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 4) {
        toast.error('You can compare up to 4 products at a time.');
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromComparison = (product: Product) => {
    setComparisonList(prev => prev.filter(p => p.id !== product.id));
  };

  const removeFromCart = async (productId: string, size?: string, colorVariant?: { main: string; secondary: string }) => {
    // Optimistic local update for offline excellence
    setCart(prev => prev.filter(i => !(i.id === productId && i.selectedSize === size && JSON.stringify(i.selectedColorVariant) === JSON.stringify(colorVariant))));

    const userId = localStorage.getItem('cc-user-id');
    if (userId) {
      try {
        await databaseService.removeFromCart(userId, productId, size, colorVariant?.main, colorVariant?.secondary);
      } catch (error) {
        console.error('Offline sync failed for removal:', error);
      }
    }
  };

  const updateCartQuantity = async (productId: string, delta: number, size?: string, colorVariant?: { main: string; secondary: string }) => {
    const item = cart.find(i => i.id === productId && i.selectedSize === size && JSON.stringify(i.selectedColorVariant) === JSON.stringify(colorVariant));
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      removeFromCart(productId, size, colorVariant);
      return;
    }

    // Optimistic local update
    setCart(prev => prev.map(i => {
      if ((i.id === productId && i.selectedSize === size && JSON.stringify(i.selectedColorVariant) === JSON.stringify(colorVariant))) {
        const newQty = i.quantity + delta;
        if (delta > 0 && newQty > (i.stockCount || 0)) {
          toast.error("That's all in stock");
          return i;
        }
        return { ...i, quantity: newQty };
      }
      return i;
    }));

    const userId = localStorage.getItem('cc-user-id');
    if (userId) {
      try {
        await databaseService.updateCartItem(userId, {
          productId,
          quantity: newQuantity,
          selectedSize: size,
          selectedColorVariant: colorVariant
        });
      } catch (error) {
        console.error('Offline sync failed for quantity update:', error);
      }
    }
  };

  const clearCart = async () => {
    const userId = localStorage.getItem('cc-user-id');
    if (userId) {
      try {
        const backendCart = await databaseService.getCart(userId);
        for (const item of backendCart) {
          const targetId = item.id || item.productId;
          await databaseService.removeFromCart(userId, targetId, item.selectedSize, item.selectedColorVariant?.main, item.selectedColorVariant?.secondary);
        }
        setCart([]);
      } catch (error) {
        console.error('Error clearing cart on backend:', error);
      }
    } else {
      setCart([]);
    }
  };
  // Synchronize state with URL
  useEffect(() => {
    const path = location.pathname;
    let newView = ViewState.LOBBY;
    
    if (path === '/kits') newView = ViewState.BUNDLES;
    else if (path === '/famous') newView = ViewState.FAMOUS;
    else if (path === '/categories') newView = ViewState.CATEGORIES;
    else if (path === '/social') newView = ViewState.SOCIAL;
    else if (path === '/wishlist') newView = ViewState.WISHLIST;
    else if (path === '/profile') newView = ViewState.PROFILE;
    else if (path === '/checkout') newView = ViewState.CHECKOUT;
    else if (path === '/stylist') newView = ViewState.STYLIST;
    else if (path === '/scroll') newView = ViewState.SCROLL_MODE;
    else if (path === '/contact') newView = ViewState.CONTACT;
    else if (path === '/admin') newView = ViewState.ADMIN;
    else if (path === '/supplier') newView = ViewState.SUPPLIER_DASHBOARD;
    else if (path === '/role-selection') newView = ViewState.ROLE_SELECTION;
    else if (path === '/admin-login') newView = ViewState.ADMIN_LOGIN;
    else if (path === '/supplier-login') newView = ViewState.SUPPLIER_LOGIN;
    else if (path === '/pay-for-me') newView = ViewState.PAY_FOR_ME;
    else if (path === '/kfam') newView = ViewState.KFAM;
    else if (path === '/search') newView = ViewState.SEARCH;
    else if (path === '/legal') newView = ViewState.LEGAL;
    else if (path === '/about') newView = ViewState.ABOUT;
    else if (path === '/privacy') newView = ViewState.PRIVACY;
    
    // Protection Layer
    const protectedViews = [
      ViewState.PROFILE, 
      ViewState.WISHLIST, 
      ViewState.PAY_FOR_ME, 
      ViewState.CHECKOUT,
      ViewState.SOCIAL,
      ViewState.STYLIST,
      ViewState.ADMIN,
      ViewState.SUPPLIER_DASHBOARD,
      ViewState.TRY_ON,
      ViewState.STYLE_PROTOCOL
    ];

    if (isAuthChecking) return;

    if (protectedViews.includes(newView)) {
      if (newView === ViewState.ADMIN) {
        const localAdmin = localStorage.getItem('cc-admin-auth') === 'true';
        if (!isAdmin && !localAdmin) {
          handleNavigateView(ViewState.ROLE_SELECTION);
          return;
        }
      } else if (newView === ViewState.SUPPLIER_DASHBOARD) {
        const localSupplier = localStorage.getItem('cc-supplier-auth') === 'true';
        const localSupplierId = localStorage.getItem('cc-supplier-id');
        if (!isSupplierAuthenticated && !activeSupplierId && !localSupplier && !localSupplierId) {
          handleNavigateView(ViewState.ROLE_SELECTION);
          return;
        }
      } else if (!isAuthenticated && localStorage.getItem('cc-auth-token') !== 'true') {
        handleNavigateView(ViewState.LOBBY);
        return;
      }
    }

    if (newView !== currentView) {
      setCurrentView(newView);
    }
  }, [location.pathname, isAuthenticated, isAdmin, isSupplierAuthenticated, activeSupplierId, isAuthChecking]);

  const refreshProducts = async () => {
    try {
      const fetchedProducts = await databaseService.getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  const handleNavigateView = (view: ViewState, skipAuthCheck: boolean = false) => {
    triggerGlobalLoading(600);
    const protectedViews = [
      ViewState.PROFILE, 
      ViewState.WISHLIST, 
      ViewState.PAY_FOR_ME, 
      ViewState.CHECKOUT,
      ViewState.SOCIAL,
      ViewState.STYLIST,
      ViewState.ADMIN,
      ViewState.SUPPLIER_DASHBOARD,
      ViewState.TRY_ON,
      ViewState.STYLE_PROTOCOL
    ];
    if (!skipAuthCheck && protectedViews.includes(view)) {
      if (view === ViewState.ADMIN) {
        const localAdmin = localStorage.getItem('cc-admin-auth') === 'true';
        if (!isAdmin && !localAdmin) {
          setCurrentView(ViewState.ROLE_SELECTION);
          navigate('/role-selection');
          return;
        }
      } else if (view === ViewState.SUPPLIER_DASHBOARD) {
        const localSupplier = localStorage.getItem('cc-supplier-auth') === 'true';
        const localSupplierId = localStorage.getItem('cc-supplier-id');
        if (!isSupplierAuthenticated && !activeSupplierId && !localSupplier && !localSupplierId) {
          setCurrentView(ViewState.ROLE_SELECTION);
          navigate('/role-selection');
          return;
        }
      } else if (!isAuthenticated && localStorage.getItem('cc-auth-token') !== 'true') {
        setShowAuthModal(true);
        return;
      }
    }

    setCurrentView(view);
    
    // Update URL
    let path = '/';
    if (view === ViewState.BUNDLES) path = '/kits';
    else if (view === ViewState.FAMOUS) path = '/famous';
    else if (view === ViewState.CATEGORIES) path = '/categories';
    else if (view === ViewState.SOCIAL) path = '/social';
    else if (view === ViewState.WISHLIST) path = '/wishlist';
    else if (view === ViewState.PROFILE) path = '/profile';
    else if (view === ViewState.CHECKOUT) path = '/checkout';
    else if (view === ViewState.STYLIST) path = '/stylist';
    else if (view === ViewState.SCROLL_MODE) path = '/scroll';
    else if (view === ViewState.CONTACT) path = '/contact';
    else if (view === ViewState.ADMIN) path = '/admin';
    else if (view === ViewState.SUPPLIER_DASHBOARD) path = '/supplier';
    else if (view === ViewState.ROLE_SELECTION) path = '/role-selection';
    else if (view === ViewState.ADMIN_LOGIN) path = '/admin-login';
    else if (view === ViewState.SUPPLIER_LOGIN) path = '/supplier-login';
    else if (view === ViewState.PAY_FOR_ME) path = '/pay-for-me';
    else if (view === ViewState.KFAM) path = '/kfam';
    else if (view === ViewState.SEARCH) path = '/search';
    else if (view === ViewState.LEGAL) path = '/legal';
    else if (view === ViewState.ABOUT) path = '/about';
    else if (view === ViewState.PRIVACY) path = '/privacy';
    
    if (location.pathname !== path) {
      navigate(path);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addBundleToCart = async (bundle: Bundle) => {
    // Checkout Safeguard (Scroll Mode Only)
    if (currentView === ViewState.SCROLL_MODE) {
      const haulTarget = Number(localStorage.getItem('cc-haul-target') || '0');
      if (haulTarget > 0) {
        const currentTotal = cart.reduce((acc, item) => acc + item.quantity, 0);
        const bundleQuantity = bundle.products.length;
        if (currentTotal + bundleQuantity > haulTarget) {
          if (!confirm(`Nexus Expansion Warning: This synergy kit contains ${bundleQuantity} units, which will exceed your Checkout Safeguard of ${haulTarget}. Synchronize anyway?`)) {
            return;
          }
        }
      }
    }

    // Optimistic local update for offline support
    for (const item of bundle.products) {
      setCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
          return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { ...item, quantity: 1, id: item.id }];
      });

      if (isAuthenticated) {
        const userId = localStorage.getItem('cc-user-id');
        if (userId) {
          try {
            await databaseService.addToCart(userId, {
              productId: item.id,
              name: item.name,
              price: item.price,
              originalPrice: item.originalPrice,
              image: item.image,
              category: item.category,
              quantity: 1
            });
          } catch (e) {
            console.error('Failed to sync bundle item:', e);
          }
        }
      }
    }
    
    if (isAuthenticated) {
      const userId = localStorage.getItem('cc-user-id');
      if (userId) {
        bundle.products.forEach(p => {
          databaseService.trackAction(userId, p.id, 'cart');
        });
      }
    } else {
      toast.info('Nexus Bundle cached locally. Sync available after entry.');
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === bundle.id && item.isBundle);
      if (existing) return prev.map(i => (i.id === bundle.id && i.isBundle) ? { ...i, quantity: i.quantity + 1 } : i);
      
      const bundleItem: CartItem = {
        id: bundle.id,
        name: bundle.name,
        price: bundle.bundlePrice,
        originalPrice: bundle.products.reduce((acc, p) => acc + p.originalPrice, 0),
        shippingFee: bundle.products.reduce((acc, p) => acc + (p.shippingFee || 0), 0),
        image: bundle.products[0].image,
        quantity: 1,
        isBundle: true,
        bundleProducts: bundle.products,
        category: 'All',
      };
      return [...prev, bundleItem];
    });
    toast.success('Bundle added to cart');
    setIsCartOpen(true);
  };

  const [haulProductIds, setHaulProductIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchHaul = async () => {
      if (!isAuthenticated) return;
      try {
        const orders = await databaseService.getOrders();
        const userOrders = Array.isArray(orders) ? orders.filter(o => o && (o.userId === stats.userId || o.userName === handle)) : [];
        const ids = userOrders.flatMap(o => Array.isArray(o?.items) ? o.items.map((i: any) => i?.id).filter(Boolean) : []);
        setHaulProductIds([...new Set(ids)]);
      } catch (error) {
        console.error('Error fetching haul data:', error);
      }
    };
    fetchHaul();
  }, [stats.userId, handle]);

  const renderView = () => {
    if (isAuthChecking) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-40">
           <div className="w-12 h-12 border-2 border-[#0F52BA]/20 border-t-[#0F52BA] rounded-full animate-spin mb-6"></div>
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] animate-pulse">Verifying Session Security...</p>
        </div>
      );
    }
    if (isBanned) return <BannedPage />;
    
    // Immediate render-level protection to avoid component crashes for guest users
    const protectedViews = [
      ViewState.PROFILE, 
      ViewState.WISHLIST, 
      ViewState.PAY_FOR_ME, 
      ViewState.CHECKOUT,
      ViewState.SOCIAL,
      ViewState.STYLIST,
      ViewState.ADMIN,
      ViewState.SUPPLIER_DASHBOARD,
      ViewState.TRY_ON,
      ViewState.STYLE_PROTOCOL
    ];
    
    // If not authorized for the requested protected view, fallback to LOBBY
    const isViewAllowed = () => {
      if (currentView === ViewState.ADMIN) {
        return isAdmin || localStorage.getItem('cc-admin-auth') === 'true';
      }
      if (currentView === ViewState.SUPPLIER_DASHBOARD) {
        return isSupplierAuthenticated || !!activeSupplierId || localStorage.getItem('cc-supplier-auth') === 'true';
      }
      return isAuthenticated || localStorage.getItem('cc-auth-token') === 'true';
    };

    const viewToRender = (protectedViews.includes(currentView) && !isViewAllowed()) ? ViewState.LOBBY : currentView;

    switch (viewToRender) {
      case ViewState.LOBBY:
        return (
          <SectionErrorBoundary sectionName="Home Feed" onReset={fetchProducts}>
            <Lobby 
              userId={stats.userId} 
              products={sortedProducts} 
              categories={categories}
              userHandle={handle || 'Member'} 
              socialPosts={socialPosts} 
              wishlist={wishlist} 
              onNavigate={handleNavigateView} 
              onAddToCart={addToCart} 
              onToggleWishlist={toggleWishlist} 
              onProductClick={(p) => { databaseService.trackAction(stats.userId, p.id, 'view'); setSelectedProduct(p); }} 
              onCompleteQuest={() => {}} 
              onGainRep={gainRep}
              limitedOfferEnd={limitedOfferEnd}
              onResetLimitedOffer={resetLimitedOffer}
              onToggleCompare={toggleComparison}
              comparisonList={comparisonList}
              isInitializing={isInitializing}
              userPrefs={userPrefs}
              productError={productError}
              onRetryProducts={fetchProducts}
            />
          </SectionErrorBoundary>
        );
      case ViewState.SCROLL_MODE:
        return (
          <ScrollMode
            products={sortedProducts}
            onAddToCart={(p) => addToCart(p)}
            onToggleWishlist={toggleWishlist}
            onViewProduct={setSelectedProduct}
            wishlist={wishlist}
            userPrefs={userPrefs}
            cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
          />
        );
      case ViewState.FAMOUS:
        return (
          <SectionErrorBoundary sectionName="Famous Products">
            <FamousProducts 
              products={sortedProducts} 
              wishlist={wishlist} 
              onProductClick={setSelectedProduct} 
              onAddToCart={(p) => {
                if ((p.sizes && p.sizes.length > 0) || p.isCustom) {
                  setSelectedProduct(p);
                  databaseService.trackAction(stats.userId, p.id, 'view');
                } else {
                  addToCart(p);
                }
              }} 
              onToggleWishlist={toggleWishlist} 
              limitedOfferEnd={limitedOfferEnd}
              onToggleCompare={toggleComparison}
              comparisonList={comparisonList}
              loading={isInitializing}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onNavigate={handleNavigateView}
            />
          </SectionErrorBoundary>
        );
      case ViewState.STYLIST:
        return <StylistAI 
           stats={stats} 
           rank={getCurrentRank(rep)} 
           onUpdateStats={handleUpdateStats} 
           products={products}
           onProductClick={setSelectedProduct}
           onNavigate={handleNavigateView}
           wishlistProducts={products.filter(p => wishlist.includes(p.id))}
           haulProducts={products.filter(p => haulProductIds.includes(p.id))}
        />;
      case ViewState.BUNDLES: 
        return (
          <SectionErrorBoundary sectionName="Bundles">
            <Bundles 
              bundles={bundles} 
              onAddBundle={addBundleToCart} 
              loading={isInitializing}
              onProductClick={(p) => {
                databaseService.trackAction(stats.userId, p.id, 'view');
                setSelectedProduct(p);
              }}
              onNavigate={handleNavigateView}
            />
          </SectionErrorBoundary>
        );
      case ViewState.CATEGORIES: 
        return (
          <SectionErrorBoundary sectionName="Categories">
            <Categories categories={categories} onSelectCategory={setSelectedCategory} onNavigate={handleNavigateView} />
          </SectionErrorBoundary>
        );
      case ViewState.TRY_ON:
        return (
          <FittingRoom 
            products={products}
            stats={stats}
            rank={getCurrentRank(rep)}
            onNavigate={handleNavigateView}
            onLockLook={async (items) => {
              const userId = stats.userId || localStorage.getItem('cc-user-id');
              if (!userId || userId === 'guest') {
                toast.error("Please sign in to lock and save your look!");
                return;
              }
              try {
                const outfitName = `Look #${Math.floor(100 + Math.random() * 900)}`;
                await databaseService.saveOutfit(userId, { name: outfitName, items });
                toast.success(`Look "${outfitName}" locked and saved to your profile!`);
                await gainRep(50);
              } catch (error) {
                console.error("Error saving outfit:", error);
                toast.error("Failed to save outfit look.");
              }
            }}
            wishlistProducts={products.filter(p => wishlist.includes(p.id))}
            haulProducts={products.filter(p => haulProductIds.includes(p.id))}
            onTryOnUsed={async () => {
              const userId = stats.userId || localStorage.getItem('cc-user-id');
              if (userId && userId !== 'guest') {
                const token = localStorage.getItem('ck_user_token') || localStorage.getItem('cc-auth-token') || localStorage.getItem('cc_auth_token');
                if (token) {
                  try {
                    await fetch('/api/user/ai-usage', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ type: 'tryon' })
                    });
                  } catch (e) {}
                }
              }
              handleUpdateStats({
                ...stats,
                aiTryOnsUsedToday: (stats.aiTryOnsUsedToday || 0) + 1
              });
            }}
          />
        );
      case ViewState.PROFILE: 
        return (
          <Profile 
            stats={stats} 
            rep={rep} 
            handle={handle} 
            gender={genderState}
            onUpdateHandle={async (newHandle) => {
              const userId = localStorage.getItem('cc-user-id');
              if (userId) {
                try {
                  await databaseService.updateUserProfile(userId, { handle: newHandle });
                  setHandle(newHandle);
                } catch (error) {
                  console.error('Error updating handle on backend:', error);
                }
              } else {
                setHandle(newHandle);
              }
            }} 
            onNavigate={handleNavigateView} 
            onLogout={async () => { 
              await databaseService.logout();
              setIsAuthenticated(false); 
              setStats(prev => ({ ...prev, userId: 'guest' }));
              setCurrentView(ViewState.LOBBY);
              setShowAuthModal(true); 
            }} 
            onApplyPromo={setActivePromo} 
            activePromo={activePromo} 
            onUpdateStats={handleUpdateStats} 
            theme={theme} 
            onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} 
            onOpenStyleProtocol={(step = 0) => {
              setStyleQuizInitialStep(step);
              setIsManualStyleQuiz(true);
              setShowStyleQuiz(true);
            }} 
            protocols={checkoutProtocols}
            onUpdateProtocols={setCheckoutProtocols}
            userPrefs={userPrefs}
            notificationCount={notifications.filter(n => !n.read).length}
            onNotificationOpen={() => setIsNotificationOpen(true)}
            onReorder={handleReorder}
          />
        );
      case ViewState.WISHLIST: 
        return (
          <WishlistView 
            products={products} 
            wishlistIds={wishlist} 
            onAddToCart={addToCart} 
            onToggleWishlist={toggleWishlist} 
            onProductClick={setSelectedProduct} 
            onNavigate={handleNavigateView} 
            rank={currentRank} 
            limitedOfferEnd={limitedOfferEnd}
            onToggleCompare={toggleComparison}
            comparisonList={comparisonList}
            onQuickBuy={handleQuickBuy}
          />
        );
      case ViewState.CONTACT: return <ContactPanel />;
      case ViewState.LEGAL: return <LegalPanel />;
      case ViewState.ABOUT: return <AboutPage onNavigate={handleNavigateView} />;
      case ViewState.PRIVACY: return <PrivacyPage onNavigate={handleNavigateView} />;
      case ViewState.SEARCH:
        return (
          <SearchPageView
            products={products}
            wishlist={wishlist}
            onProductClick={(p) => { databaseService.trackAction(stats.userId, p.id, 'view'); setSelectedProduct(p); }}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            limitedOfferEnd={limitedOfferEnd}
            onToggleCompare={toggleComparison}
            comparisonList={comparisonList}
            initialQuery={globalSearchQuery}
            onClearInitialQuery={() => setGlobalSearchQuery('')}
            onQuickBuy={handleQuickBuy}
          />
        );
      case ViewState.CUSTOM_REQUESTS:
        return (
          <CustomRequestsView 
            products={products}
            onProductClick={(p) => { databaseService.trackAction(stats.userId, p.id, 'view'); setSelectedProduct(p); }}
            onNavigate={handleNavigateView}
            userId={stats.userId}
          />
        );
      case ViewState.SOCIAL: return <SocialGallery stats={stats} onUpdateStats={handleUpdateStats} onGainRep={gainRep} onTrackAchievement={trackAchievement} />;
      case ViewState.PAY_FOR_ME: return <PayForMe rank={currentRank} wishlistProducts={products.filter(p => wishlist.includes(p.id))} onCompleteAcquisition={async (p) => { 
        await gainRep(500);
        // Refresh haul
        if (isAuthenticated) {
          const orders = await databaseService.getOrders();
          const userOrders = Array.isArray(orders) ? orders.filter(o => o && (o.userId === stats.userId || o.userName === handle)) : [];
          const ids = userOrders.flatMap(o => Array.isArray(o?.items) ? o.items.map((i: any) => i?.id).filter(Boolean) : []);
          setHaulProductIds([...new Set(ids)]);
        }
      }} userHandle={handle} userId={stats.userId} />;
      case ViewState.PAY_FOR_ME_SHARED: return <PayForMeSharedView />;
      case ViewState.KFAM: return <KFamView userId={stats.userId} onNavigate={handleNavigateView} />;
      case ViewState.ADMIN_LOGIN: return <AdminLogin onSuccess={async () => { await refreshAuth(); handleNavigateView(ViewState.ADMIN, true); }} onCancel={() => handleNavigateView(ViewState.LOBBY)} />;
      case ViewState.SUPPLIER_LOGIN: return <SupplierLogin onSuccess={async (id) => { await refreshAuth(); setActiveSupplierId(id); handleNavigateView(ViewState.SUPPLIER_DASHBOARD, true); }} onCancel={() => handleNavigateView(ViewState.LOBBY)} />;
      case ViewState.ROLE_SELECTION: return <RoleSelection onSelect={(role) => handleNavigateView(role === 'ADMIN' ? ViewState.ADMIN_LOGIN : ViewState.SUPPLIER_LOGIN)} onCancel={() => handleNavigateView(ViewState.LOBBY)} />;
      case ViewState.ADMIN: return <AdminPanel onExit={async () => { await refreshAuth(); handleNavigateView(ViewState.LOBBY); }} onNavigate={handleNavigateView} onProductsChange={refreshProducts} />;
      case ViewState.SUPPLIER_DASHBOARD: return <SupplierDashboard supplierId={activeSupplierId || 'sup1'} onLogout={async () => { await refreshAuth(); handleNavigateView(ViewState.LOBBY); }} onProductsChange={refreshProducts} />;
      case ViewState.CHECKOUT: return (
        <CheckoutView 
          items={directCheckoutItem ? [directCheckoutItem] : cart} 
          protocols={checkoutProtocols}
          onClearCart={async () => {
            if (directCheckoutItem) {
              setDirectCheckoutItem(null);
            } else {
              await clearCart();
            }
          }}
          onSaveProtocol={async (protocol) => {
            const userId = localStorage.getItem('cc-user-id');
            if (userId && userId !== 'guest') {
              const newProtocols = [...checkoutProtocols, protocol].slice(0, 3);
              await databaseService.saveUserLogistics(userId, newProtocols);
              setCheckoutProtocols(newProtocols);
            }
          }}
          onComplete={async (orderDetails) => { 
            // Notify suppliers
            const itemsToProcess = orderDetails?.items || (directCheckoutItem ? [directCheckoutItem] : cart);
            for (const item of itemsToProcess) {
              if (item.isBundle && item.bundleProducts) {
                for (const p of item.bundleProducts) {
                  databaseService.trackAction(stats.userId, p.id, 'purchase');
                  if (p.supplierId) {
                    await databaseService.sendSupplierNotification(
                      p.supplierId,
                      'Bundle Item Purchased',
                      `Your item "${p.name}" was purchased as part of the Synergy Kit "${item.name}".`
                    );
                  }
                }
              } else {
                databaseService.trackAction(stats.userId, item.id, 'purchase');
                if (item.supplierId) {
                  await databaseService.sendSupplierNotification(
                    item.supplierId,
                    'Item Purchased',
                    `Your item "${item.name}" has been purchased.`
                  );
                }
              }
            }

            if (directCheckoutItem) {
              setDirectCheckoutItem(null);
            } else {
              await clearCart();
            }
            setSurgeTimerEnd(null); 
            resetLimitedOffer();
            const totalValue = orderDetails?.total || (directCheckoutItem ? [directCheckoutItem] : cart).reduce((acc, item) => acc + item.price * item.quantity, 0);
            await gainRep(Math.floor(totalValue / 10));
            trackAchievement('a4', Math.floor(totalValue));
            // Refresh haul
            if (isAuthenticated) {
              const orders = await databaseService.getOrders();
              const userOrders = Array.isArray(orders) ? orders.filter(o => o && (o.userId === stats.userId || o.userName === handle)) : [];
              const ids = userOrders.flatMap(o => Array.isArray(o?.items) ? o.items.map((i: any) => i?.id).filter(Boolean) : []);
              setHaulProductIds([...new Set(ids)]);
            }
            setCurrentView(ViewState.LOBBY); 
          }} 
          onCancel={() => {
            setDirectCheckoutItem(null);
            setCurrentView(ViewState.LOBBY);
          }} 
          balances={{...balances, credit}} 
          activePromo={activePromo} 
          rank={currentRank} 
        />
      );
      default: return <Lobby userId={stats.userId} products={products} categories={categories} userHandle={handle || 'Member'} socialPosts={socialPosts} wishlist={wishlist} onNavigate={handleNavigateView} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} onProductClick={(p) => { databaseService.trackAction(stats.userId, p.id, 'view'); setSelectedProduct(p); }} onCompleteQuest={() => {}} onGainRep={gainRep} isAuthenticated={isAuthenticated} tutorialFinished={tutorialFinished} limitedOfferEnd={limitedOfferEnd} userPrefs={userPrefs} onQuickBuy={handleQuickBuy} />;
    }
  };

  const isStandaloneView = currentView === ViewState.SUPPLIER_DASHBOARD || currentView === ViewState.ADMIN;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#0F52BA] selection:text-white transition-colors duration-500 text-zinc-950 bg-white">
      <GlobalLoadingBar />
      <Toaster position="top-right" richColors closeButton />
      
      {!isStandaloneView && (
        <>
          <Header
            onNotificationOpen={() => setIsNotificationOpen(true)} 
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
            wishlistCount={wishlist.length}
            stats={stats}
            onCartOpen={() => setIsCartOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNavigatePage={(p) => handleNavigateView(p === Page.HOME ? ViewState.LOBBY : ViewState.FAMOUS)}
            onNavigateView={handleNavigateView}
            currentPage={currentView === ViewState.LOBBY ? Page.HOME : Page.SHOP}
            currentView={currentView}
            dropTime={300}
            onOpenCategories={() => handleNavigateView(ViewState.CATEGORIES)}
            theme={theme}
            rep={rep}
            handle={handle}
          />

          {/* Floating Comparison Bar */}
          {comparisonList.length > 0 && !isComparisonOpen && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
              <div className="bg-white border border-zinc-200 px-6 py-4 rounded-full shadow-2xl flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#0F52BA]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{comparisonList.length} Items Selected</span>
                </div>
                <div className="flex -space-x-3">
                  {comparisonList.map(p => (
                    <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-zinc-100">
                      <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setIsComparisonOpen(true)}
                  className="px-6 py-2 bg-[#0F52BA] text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-blue-600 transition-all active:scale-95 shadow-md"
                >
                  Compare Now
                </button>
                <button 
                  onClick={() => setComparisonList([])}
                  className="text-[9px] font-black text-zinc-400 hover:text-zinc-900 uppercase tracking-widest transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isComparisonOpen && (
        <ComparisonView 
          products={comparisonList}
          onClose={() => setIsComparisonOpen(false)}
          onRemove={removeFromComparison}
          onAddToCart={addToCart}
          onProductClick={(p) => { setIsComparisonOpen(false); setSelectedProduct(p); }}
        />
      )}

      <main className={`${isStandaloneView ? '' : 'pt-[106px] pb-[88px] sm:pb-[96px] md:pb-[112px] sm:pt-[108px] md:pt-[112px]'} flex-1 overflow-x-hidden w-full flex flex-col justify-between`}>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#0F52BA] border-t-transparent rounded-full animate-spin"></div></div>}>
          {renderView()}
        </Suspense>

        {!isStandaloneView && currentView !== ViewState.CHECKOUT && (
          <SectionErrorBoundary sectionName="Footer" compact>
            <Footer onNavigate={handleNavigateView} />
          </SectionErrorBoundary>
        )}
      </main>
      
      {/* Sticky Floating WhatsApp Button */}
      <WhatsAppFloatingButton 
        currentView={currentView} 
        selectedProduct={selectedProduct} 
      />
      
      {!isStandaloneView && (
        <>
          <BottomNav
            onNotificationOpen={() => setIsNotificationOpen(true)} 
            currentView={currentView} 
            onNavigate={handleNavigateView} 
            onOpenCategories={() => handleNavigateView(ViewState.CATEGORIES)} 
            isAuthenticated={isAuthenticated}
            onLogin={() => setShowAuthModal(true)}
            onLogout={async () => {
              await databaseService.logout();
              setIsAuthenticated(false);
              setStats(prev => ({ ...prev, userId: 'guest' }));
              setCurrentView(ViewState.LOBBY);
              setIsCartOpen(false);
            }}
            handle={handle}
          />
          
          <Suspense fallback={null}>
            {cartMounted && (
              <CartDrawer 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                items={cart} 
                onRemove={removeFromCart} 
                onUpdateQuantity={updateCartQuantity} 
                onClear={clearCart} 
                onNavigate={handleNavigateView} 
                activePromo={activePromo} 
                rank={currentRank} 
                currentView={currentView}
              />
            )}
            {notificationsMounted && (
              <SectionErrorBoundary sectionName="Notifications" compact>
                <NotificationCenter 
                  isOpen={isNotificationOpen} 
                  onClose={() => setIsNotificationOpen(false)} 
                  notifications={notifications} 
                  onMarkRead={async (id) => {
                    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
                    try {
                      await databaseService.markNotificationRead(id);
                    } catch (error) {
                      console.error('Failed to mark notification as read:', error);
                    }
                  }} 
                  onMarkAllRead={async () => {
                    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
                    setNotifications(prev => prev.map(n => ({...n, read: true})));
                    try {
                      await Promise.all(unreadIds.map(id => databaseService.markNotificationRead(id)));
                    } catch (error) {
                      console.error('Failed to mark all notifications as read:', error);
                    }
                  }} 
                />
              </SectionErrorBoundary>
            )}
            {categoryPanelMounted && (
              <CategoryPanel 
                isOpen={isCategoryPanelOpen} 
                onClose={() => setIsCategoryPanelOpen(false)} 
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setIsCategoryProductsOpen(true);
                }} 
                onNavigate={handleNavigateView} 
                activeCategory={selectedCategory} 
                products={products} 
                categories={categories}
                onProductSelect={setSelectedProduct} 
              />
            )}
            {searchMounted && (
              <SearchPanel 
                isOpen={isSearchOpen} 
                onClose={() => setIsSearchOpen(false)} 
                products={products} 
                onProductSelect={setSelectedProduct} 
                onNavigateToFullSearch={(query) => {
                  setGlobalSearchQuery(query);
                  setIsSearchOpen(false);
                  handleNavigateView(ViewState.SEARCH);
                }}
              />
            )}
            {categoryProductsMounted && (
              <CategoryProductsPanel 
                isOpen={isCategoryProductsOpen} 
                onClose={() => setIsCategoryProductsOpen(false)} 
                category={selectedCategory} 
                products={products} 
                categories={categories}
                onProductSelect={setSelectedProduct} 
                limitedOfferEnd={limitedOfferEnd}
              />
            )}
          </Suspense>
          
          <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#0F52BA] border-t-transparent rounded-full animate-spin"></div></div>}>
            {selectedProduct && (
              <ProductDetail 
                product={selectedProduct} 
                stats={stats} 
                allProducts={products} 
                categories={categories}
                wishlistIds={wishlist}
                onClose={() => setSelectedProduct(null)} 
                onAddToCart={addToCart} 
                onUpdateSynergy={() => {}} 
                onToggleWishlist={toggleWishlist} 
                onProductClick={setSelectedProduct} 
                isInWishlist={wishlist.includes(selectedProduct.id)} 
                rank={currentRank} 
                limitedOfferEnd={limitedOfferEnd}
                onToggleCompare={toggleComparison}
                isComparing={comparisonList.some(p => p.id === selectedProduct.id)}
                onQuickBuy={handleQuickBuy}
                onUpdateStats={setStats}
              />
            )}

            {isComparisonOpen && (
              <ComparisonView 
                products={comparisonList}
                onClose={() => setIsComparisonOpen(false)}
                onRemove={(product) => setComparisonList(prev => prev.filter(p => p.id !== product.id))}
                onAddToCart={(p) => {
                  addToCart(p);
                  setIsComparisonOpen(false);
                }}
                onProductClick={(p) => {
                  setSelectedProduct(p);
                  setIsComparisonOpen(false);
                }}
              />
            )}
            
            {showAuthModal && (
              <LandingScreen 
                onComplete={(arch, isNew) => { 
                  const userId = localStorage.getItem('cc-user-id') || 'guest';
                  setStats(prev => ({ ...prev, userId }));
                  setIsAuthenticated(true); 
                  setShowAuthModal(false); 
                  refreshAuth();
                  if (userId !== 'guest') initUser(userId);
                  if (isNew) setShowTutorial(true); 
                }} 
                onAdminAccess={() => { 
                  setShowAuthModal(false); 
                  handleNavigateView(ViewState.ROLE_SELECTION); 
                }} 
                onClose={() => setShowAuthModal(false)} 
              />
            )}

            {showTutorial && (
              <Tutorial 
                onComplete={async () => { 
                  setShowTutorial(false); 
                  setTutorialFinished(true); 
                  localStorage.setItem('cc-tutorial-finished', 'true');
                  
                  // Persist tutorial finish to DB if possible
                  if (stats.userId && stats.userId !== 'guest') {
                    try {
                      const prefs = userPrefs || { userId: stats.userId, preferredCategories: [], preferredGenders: [] };
                      const updatedPrefs = { ...prefs, tutorialFinished: true };
                      await databaseService.saveUserPreferences(stats.userId, updatedPrefs);
                      setUserPrefs(updatedPrefs);
                    } catch (e) {
                      console.error('Failed to persist tutorial status:', e);
                    }
                  }

                  const alreadySeen = localStorage.getItem('cc-style-protocol-seen') === 'true';
                  if (!userPrefs?.styleProtocolCompleted && !alreadySeen) {
                    setShowStyleQuiz(true); 
                    localStorage.setItem('cc-style-protocol-seen', 'true');
                  }
                }} 
                onNavigate={handleNavigateView} 
              />
            )}
            
            {showStyleQuiz && (
              <StyleProtocol 
                userId={stats.userId} 
                onComplete={(prefs) => {
                  setUserPrefs(prefs);
                  setShowStyleQuiz(false);
                  localStorage.setItem('cc-style-protocol-seen', 'true');
                  if (!isManualStyleQuiz && !prefs?.checkoutProtocolCompleted) {
                    setShowCheckoutProtocolSetup(true);
                  }
                  setIsManualStyleQuiz(false);
                }} 
                onClose={() => {
                  setShowStyleQuiz(false);
                  setIsManualStyleQuiz(false);
                }} 
                initialStep={styleQuizInitialStep}
              />
            )}

            {showCheckoutProtocolSetup && (
               <CheckoutProtocolSetup
                 userId={stats.userId}
                 onComplete={(updatedPrefs) => {
                   setUserPrefs(updatedPrefs);
                   setShowCheckoutProtocolSetup(false);
                   setIsManualCheckoutSetup(false);
                   databaseService.getUserLogistics(stats.userId).then((logs) => {
                       setCheckoutProtocols(Array.isArray(logs) ? logs : (logs ? [logs] : []));
                   });
                 }}
                 onSkip={(updatedPrefs) => {
                   setUserPrefs(updatedPrefs);
                   setShowCheckoutProtocolSetup(false);
                   setIsManualCheckoutSetup(false);
                 }}
               />
            )}
            
            {resetToken && (
              <ResetPassword 
                token={resetToken} 
                onComplete={() => {
                  setResetToken(null);
                  setShowAuthModal(true);
                }} 
              />
            )}

            <VaultEntrance />
            <CookieConsent />
            <PWAPromptModal />
          </Suspense>
          
          {/* Maintenance Screen */}
          {maintenanceMode && !isAdmin && 
           currentView !== ViewState.CHECKOUT && 
           currentView !== ViewState.ROLE_SELECTION && 
           currentView !== ViewState.ADMIN_LOGIN && 
           currentView !== ViewState.SUPPLIER_LOGIN && (
            <MaintenanceMode onAdminAccess={() => handleNavigateView(ViewState.ROLE_SELECTION)} />
          )}
        </>
      )}
    </div>
  );
};

export default App;

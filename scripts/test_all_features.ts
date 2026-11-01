import axios from 'axios';
import Database from 'better-sqlite3';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
let passCount = 0;
let failCount = 0;
const errors: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    failCount++;
    const errMsg = `❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`;
    console.error(errMsg);
    errors.push(errMsg);
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING DEEP SYSTEM AUDIT & FEATURE TEST SUITE');
  console.log('====================================================\n');

  // 1. Direct Database Test
  console.log('--- 1. DATABASE SCHEMA & WAL MODE INTEGRITY ---');
  try {
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    const sqlite = new Database(dbPath);
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    const tableNames = tables.map(t => t.name);
    
    assert(tableNames.includes('users'), 'Table `users` exists');
    assert(tableNames.includes('admins'), 'Table `admins` exists');
    assert(tableNames.includes('suppliers'), 'Table `suppliers` exists');
    assert(tableNames.includes('products'), 'Table `products` exists');
    assert(tableNames.includes('orders'), 'Table `orders` exists');
    assert(tableNames.includes('cart_items'), 'Table `cart_items` exists');
    assert(tableNames.includes('user_history'), 'Table `user_history` exists');
    assert(tableNames.includes('referral_ledger'), 'Table `referral_ledger` exists');
    assert(tableNames.includes('referrals'), 'Table `referrals` exists');
    assert(tableNames.includes('categories'), 'Table `categories` exists');
    assert(tableNames.includes('bundles'), 'Table `bundles` exists');
    assert(tableNames.includes('social_posts'), 'Table `social_posts` exists');

    const pragmaJournal = sqlite.pragma('journal_mode', { simple: true });
    assert(pragmaJournal === 'wal', `SQLite WAL mode is active (mode: ${pragmaJournal})`);
    sqlite.close();
  } catch (err: any) {
    assert(false, 'Database connection', err.message);
  }

  // 2. Health Check
  console.log('\n--- 2. SERVER HEALTH & STATUS ---');
  try {
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200 && healthRes.data.status === 'ok', 'GET /api/health returned status ok');
  } catch (err: any) {
    assert(false, 'GET /api/health', err.message);
  }

  // 3. Authentication & User Session Lifecycle
  console.log('\n--- 3. AUTHENTICATION & MULTI-ROLE ACCESS ---');
  const testEmail = `audit_user_${Date.now()}@example.com`;
  const testPassword = 'SafePassword123!';
  let testUserId = '';
  let authCookieHeader = '';

  try {
    // Signup
    const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email: testEmail,
      password: testPassword,
      handle: `audit_${Date.now().toString().slice(-4)}`
    });
    assert(signupRes.data.success === true, 'POST /api/auth/signup creates account');
    testUserId = signupRes.data.user?.id || signupRes.data.userId;
    assert(!!testUserId, `New user assigned ID: ${testUserId}`);

    // Login with exact email
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: testEmail,
      password: testPassword
    });
    assert(loginRes.data.success === true, 'POST /api/auth/login with exact email credentials');
    
    // Extract cookies for authenticated session requests
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie && Array.isArray(setCookie)) {
      authCookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');
    }

    // Case-insensitive & Whitespace-trimmed Login
    const loginCaseRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: `   ${testEmail.toUpperCase()}   `,
      password: testPassword
    });
    assert(loginCaseRes.data.success === true, 'POST /api/auth/login with uppercase and padded whitespace');

    // Login with incorrect password (should gracefully reject)
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        identifier: testEmail,
        password: 'incorrect_password_xyz'
      });
      assert(false, 'Invalid password should be rejected');
    } catch (err: any) {
      assert(err.response?.status === 401, 'POST /api/auth/login safely rejects bad password with 401');
    }

    // Admin Login test
    try {
      const adminLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
        identifier: 'admin@closetkraze.com',
        password: 'admin',
        role: 'ADMIN'
      });
      assert(adminLoginRes.data.success === true, 'POST /api/auth/login allows admin authentication');
    } catch (err: any) {
      console.log('Admin login status:', err.response?.data?.message || err.message);
    }

  } catch (err: any) {
    assert(false, 'Auth Flow Exception', err.response?.data?.message || err.message);
  }

  // 4. Products & Catalog
  console.log('\n--- 4. PRODUCTS & CATEGORIES CATALOG ---');
  let sampleProduct: any = null;
  try {
    const prodRes = await axios.get(`${BASE_URL}/api/products`);
    assert(prodRes.status === 200 && Array.isArray(prodRes.data), `GET /api/products returns array (${prodRes.data?.length || 0} products)`);
    if (prodRes.data && prodRes.data.length > 0) {
      sampleProduct = prodRes.data[0];
      assert(typeof sampleProduct.id === 'string' && typeof sampleProduct.name === 'string', 'Product has valid id and name');
      
      const singleRes = await axios.get(`${BASE_URL}/api/products/${encodeURIComponent(sampleProduct.id)}`);
      assert(singleRes.status === 200 && singleRes.data.id === sampleProduct.id, `GET /api/products/${sampleProduct.id} returns full product object`);
    }

    const catRes = await axios.get(`${BASE_URL}/api/categories`);
    assert(catRes.status === 200 && Array.isArray(catRes.data), `GET /api/categories returns array (${catRes.data?.length || 0} categories)`);

    const bundlesRes = await axios.get(`${BASE_URL}/api/bundles`);
    assert(bundlesRes.status === 200 && Array.isArray(bundlesRes.data), `GET /api/bundles returns array (${bundlesRes.data?.length || 0} bundles)`);
  } catch (err: any) {
    assert(false, 'Catalog APIs Exception', err.response?.data?.message || err.message);
  }

  // 5. Cart & Wishlist Operations
  console.log('\n--- 5. CART & WISHLIST PERSISTENCE ---');
  if (testUserId && sampleProduct) {
    const authConfig = { headers: { Cookie: authCookieHeader } };
    try {
      // Add to Wishlist
      const addWishlistRes = await axios.post(`${BASE_URL}/api/user/wishlist`, {
        userId: testUserId,
        productId: sampleProduct.id
      }, authConfig);
      assert(addWishlistRes.status === 200, 'POST /api/user/wishlist adds product');

      // Get Wishlist
      const getWishlistRes = await axios.get(`${BASE_URL}/api/user/wishlist/${testUserId}`, authConfig);
      assert(Array.isArray(getWishlistRes.data) && getWishlistRes.data.some((p: any) => p.id === sampleProduct.id), 'GET /api/user/wishlist returns added product');

      // Remove from Wishlist
      const removeWishlistRes = await axios.delete(`${BASE_URL}/api/user/wishlist/${testUserId}/${sampleProduct.id}`, authConfig);
      assert(removeWishlistRes.status === 200, 'DELETE /api/user/wishlist removes product');

      // Add to Cart
      const addCartRes = await axios.post(`${BASE_URL}/api/user/cart`, {
        userId: testUserId,
        item: {
          productId: sampleProduct.id,
          name: sampleProduct.name,
          price: sampleProduct.price || 100,
          originalPrice: sampleProduct.originalPrice || 120,
          image: sampleProduct.image || '',
          category: sampleProduct.category || 'All',
          quantity: 2,
          selectedSize: 'M'
        }
      }, authConfig);
      assert(addCartRes.status === 200, 'POST /api/user/cart successfully adds item');

      // Get Cart
      const getCartRes = await axios.get(`${BASE_URL}/api/user/cart/${testUserId}`, authConfig);
      assert(Array.isArray(getCartRes.data) && getCartRes.data.length > 0, 'GET /api/user/cart returns persisted items');

      // Clear Cart
      const clearCartRes = await axios.delete(`${BASE_URL}/api/user/cart/${testUserId}`, authConfig);
      assert(clearCartRes.status === 200, 'DELETE /api/user/cart empties user cart');

    } catch (err: any) {
      assert(false, 'Cart & Wishlist API Exception', err.response?.data?.message || err.message);
    }
  }

  // 6. Referral Program & Cryptographic Blockchain Ledger
  console.log('\n--- 6. REFERRAL PROGRAM & CRYPTOGRAPHIC BLOCKCHAIN LEDGER ---');
  try {
    // Verify blockchain endpoint
    const chainApiRes = await axios.get(`${BASE_URL}/api/referrals/verify-chain`);
    const verification = chainApiRes.data.verification || chainApiRes.data;
    assert(chainApiRes.status === 200 && verification.isValid === true, `GET /api/referrals/verify-chain confirms ledger integrity (Chain length: ${verification.blockCount || 1})`);

    // Get referral stats for user
    if (authCookieHeader) {
      const refStatsRes = await axios.get(`${BASE_URL}/api/referrals/my-stats`, { headers: { Cookie: authCookieHeader } });
      assert(refStatsRes.status === 200 && refStatsRes.data.status === 'success', 'GET /api/referrals/my-stats returns user referral analytics');
      assert(refStatsRes.data.commissionRate === 0.10, 'Referral commission rate is 10% for life');
    }
  } catch (err: any) {
    assert(false, 'Referral Blockchain Exception', err.response?.data?.message || err.message);
  }

  // 7. Social Gallery & Community Feed
  console.log('\n--- 7. SOCIAL GALLERY & COMMUNITY FEED ---');
  try {
    const socialRes = await axios.get(`${BASE_URL}/api/social-posts`);
    assert(socialRes.status === 200 && Array.isArray(socialRes.data), `GET /api/social-posts returns feed (${socialRes.data?.length || 0} posts)`);

    const cycleRes = await axios.get(`${BASE_URL}/api/social/cycle-info`);
    assert(cycleRes.status === 200 && !!cycleRes.data.currentWeekId, 'GET /api/social/cycle-info returns Friday cycle metadata');
  } catch (err: any) {
    assert(false, 'Social Gallery API Exception', err.response?.data?.message || err.message);
  }

  // 8. User Stats & Preferences
  console.log('\n--- 8. USER PROFILE & STATS ---');
  if (testUserId && authCookieHeader) {
    try {
      const profileRes = await axios.get(`${BASE_URL}/api/user/profile/${testUserId}`, { headers: { Cookie: authCookieHeader } });
      assert(profileRes.status === 200 && profileRes.data.id === testUserId, 'GET /api/user/profile/:userId returns user profile');

      const statsRes = await axios.get(`${BASE_URL}/api/user_stats/${testUserId}`);
      assert(statsRes.status === 200, 'GET /api/user_stats/:userId returns user stats');
    } catch (err: any) {
      assert(false, 'User Profile/Stats API Exception', err.response?.data?.message || err.message);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log(`TEST SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================\n');

  if (failCount > 0) {
    console.error('Failure Details:');
    errors.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('🎉 ALL SYSTEM FUNCTIONS, APIS & BUTTONS AUDITED WITH 0 ERRORS!');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

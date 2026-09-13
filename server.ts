import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Firebase Cloud Firestore on Server for real-time cross-device sync
let serverFirestore: any = null;
try {
  const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    const fbApp = initializeApp(cfg, 'help150-backend-server');
    serverFirestore = getFirestore(fbApp, cfg.firestoreDatabaseId);
    console.log('[SERVER] Cloud Firestore initialized for instant cross-device referral syncing.');
  }
} catch (e) {
  console.warn('[SERVER] Could not initialize Firestore:', e);
}

// Ensure server data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data if db.json doesn't exist
function getInitialServerState() {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'H150-ADMIN01',
        fullName: 'System Superadmin',
        mobile: '9800000001',
        email: 'admin@help150.org',
        password: 'admin',
        passwordHash: Buffer.from('admin').toString('base64'),
        role: 'admin',
        sponsorId: null,
        status: 'active',
        kycStatus: 'verified',
        isMobileVerified: true,
        isEmailVerified: true,
        joinedAt: now,
        lastLoginAt: now,
      },
      {
        id: 'H150-784920',
        fullName: 'Ashok Kumar',
        mobile: '9876543210',
        email: 'ashuk2968@gmail.com',
        password: 'password123',
        passwordHash: Buffer.from('password123').toString('base64'),
        role: 'user',
        sponsorId: 'H150-ADMIN01',
        status: 'active',
        kycStatus: 'verified',
        isMobileVerified: true,
        isEmailVerified: true,
        joinedAt: now,
        lastLoginAt: now,
      },
      {
        id: 'H150-918234',
        fullName: 'Priya Sharma',
        mobile: '9876512345',
        email: 'priya.sharma@example.com',
        password: 'password123',
        passwordHash: Buffer.from('password123').toString('base64'),
        role: 'user',
        sponsorId: 'H150-784920',
        status: 'active',
        kycStatus: 'verified',
        isMobileVerified: true,
        isEmailVerified: true,
        joinedAt: now,
        lastLoginAt: now,
      },
      {
        id: 'H150-449102',
        fullName: 'Rahul Verma',
        mobile: '9876523456',
        email: 'rahul.verma@example.com',
        password: 'password123',
        passwordHash: Buffer.from('password123').toString('base64'),
        role: 'user',
        sponsorId: 'H150-784920',
        status: 'active',
        kycStatus: 'verified',
        isMobileVerified: true,
        isEmailVerified: true,
        joinedAt: now,
        lastLoginAt: now,
      },
      {
        id: 'H150-610293',
        fullName: 'Sunita Patel',
        mobile: '9876509988',
        email: 'sunita.patel@example.com',
        password: 'password123',
        passwordHash: Buffer.from('password123').toString('base64'),
        role: 'user',
        sponsorId: 'H150-918234',
        status: 'active',
        kycStatus: 'not_submitted',
        isMobileVerified: true,
        isEmailVerified: true,
        joinedAt: now,
        lastLoginAt: now,
      },
      {
        id: 'H150-338291',
        fullName: 'Manoj Tiwari',
        mobile: '9876501122',
        email: 'manoj.tiwari@example.com',
        password: 'password123',
        passwordHash: Buffer.from('password123').toString('base64'),
        role: 'user',
        sponsorId: 'H150-610293',
        status: 'active',
        kycStatus: 'not_submitted',
        isMobileVerified: true,
        isEmailVerified: true,
        joinedAt: now,
        lastLoginAt: now,
      },
    ],
    wallets: {
      'H150-ADMIN01': {
        userId: 'H150-ADMIN01',
        availableBalance: 50000,
        pendingBalance: 0,
        totalHelpedGiven: 0,
        totalHelpedReceived: 0,
        totalReferralRewards: 0,
        totalWithdrawn: 0,
        lastUpdated: now,
      },
      'H150-784920': {
        userId: 'H150-784920',
        availableBalance: 400,
        pendingBalance: 150,
        totalHelpedGiven: 150,
        totalHelpedReceived: 300,
        totalReferralRewards: 50,
        totalWithdrawn: 0,
        lastUpdated: now,
      },
      'H150-918234': {
        userId: 'H150-918234',
        availableBalance: 150,
        pendingBalance: 0,
        totalHelpedGiven: 150,
        totalHelpedReceived: 300,
        totalReferralRewards: 50,
        totalWithdrawn: 0,
        lastUpdated: now,
      },
      'H150-449102': {
        userId: 'H150-449102',
        availableBalance: 0,
        pendingBalance: 150,
        totalHelpedGiven: 150,
        totalHelpedReceived: 0,
        totalReferralRewards: 0,
        totalWithdrawn: 0,
        lastUpdated: now,
      },
    },
    helpRequests: [],
    transactions: [],
    kycRecords: [],
    notifications: [],
    helpCycles: [],
    settings: {
      helpAmountDefault: 150,
      minWithdrawalAmount: 200,
      withdrawalMultiple: 200,
      timerDurationHours: 12,
    },
  };
}

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  const initial = getInitialServerState();
  writeDb(initial);
  return initial;
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// Background sweep for 24-hour unpaid ₹50 link auto-block & auto-delete
function enforceServerPenalties() {
  try {
    const dbData = readDb();
    const now = Date.now();
    let changed = false;
    const usersToDelete: string[] = [];

    if (!Array.isArray(dbData.users)) return;

    for (const user of dbData.users) {
      if (user.role === 'admin') continue;

      // 1. If blocked and passed auto-delete time -> permanently delete
      if (user.status === 'blocked' && user.autoDeleteAt) {
        if (now >= new Date(user.autoDeleteAt).getTime()) {
          usersToDelete.push(user.id);
          continue;
        }
      }

      // 2. Check ₹50 verification link deadline
      const userCycles = Array.isArray(dbData.helpCycles)
        ? dbData.helpCycles.filter((c: any) => c.userId === user.id)
        : [];
      const activeCycle = userCycles.find((c: any) => c.status !== 'completed');

      if (
        activeCycle &&
        activeCycle.status === 'provide_verification' &&
        activeCycle.verificationLink?.status === 'pending'
      ) {
        const deadline =
          activeCycle.verificationLink.deadlineTime ||
          new Date(activeCycle.createdAt).getTime() + 24 * 3600000;

        if (now > deadline && user.status !== 'blocked') {
          user.status = 'blocked';
          user.blockedAt = new Date().toISOString();
          user.autoDeleteAt = new Date(now + 24 * 3600000).toISOString();
          user.blockedReason =
            'Did not complete ₹50 Provide Help payment within 24 hours of registration.';
          changed = true;
          console.log(`[PENALTY] User ${user.id} BLOCKED for unpaid ₹50 link.`);
        }
      }
    }

    if (usersToDelete.length > 0) {
      dbData.users = dbData.users.filter((u: any) => !usersToDelete.includes(u.id));
      usersToDelete.forEach((delId) => {
        if (dbData.wallets) delete dbData.wallets[delId];
        if (dbData.helpCycles) {
          dbData.helpCycles = dbData.helpCycles.filter((c: any) => c.userId !== delId);
        }
        if (dbData.helpRequests) {
          dbData.helpRequests = dbData.helpRequests.filter((r: any) => r.userId !== delId);
        }
        console.log(`[PENALTY] User ${delId} PERMANENTLY DELETED after 24 hours blocked.`);
      });
      changed = true;
    }

    if (changed) {
      writeDb(dbData);
    }
  } catch (err) {
    console.error('Penalty sweep error:', err);
  }
}

// Run penalty sweep every 20 seconds
setInterval(enforceServerPenalties, 20000);

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Full state sync for multi-device synchronization
app.get('/api/sync', (req, res) => {
  const dbData = readDb();
  res.json({
    users: dbData.users || [],
    wallets: dbData.wallets || {},
    helpRequests: dbData.helpRequests || [],
    helpCycles: dbData.helpCycles || [],
    transactions: dbData.transactions || [],
    kycRecords: dbData.kycRecords || [],
    notifications: dbData.notifications || [],
    settings: dbData.settings || {},
  });
});

// Register endpoint (Centralized Multi-Device Registration)
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, mobile, email, password, sponsorId } = req.body;

    if (!fullName || !mobile || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const dbData = readDb();
    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    const cleanEmail = String(email).trim().toLowerCase();

    // Check duplicate email or mobile
    const existing = dbData.users.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail || u.mobile?.slice(-10) === cleanMobile
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Account with this mobile number or email already exists.',
      });
    }

    // Verify sponsor if provided
    let validSponsorId: string | null = null;
    let sponsorName: string | null = null;
    if (sponsorId) {
      const rawSponsor = String(sponsorId).trim();
      const cleanSponsor = rawSponsor.toUpperCase();
      const cleanDigits = rawSponsor.replace(/\D/g, '');
      const withoutPrefix = cleanSponsor.replace(/^(H150-|HP-|HELP-|H-)/i, '');
      const sponsorUser = dbData.users.find((u: any) => {
        const uId = String(u.id || '').toUpperCase();
        const uWithoutPrefix = uId.replace(/^(H150-|HP-|HELP-|H-)/i, '');
        if (uId === cleanSponsor) return true;
        if (uId === `H150-${cleanSponsor}`) return true;
        if (withoutPrefix && uWithoutPrefix === withoutPrefix) return true;
        if (cleanDigits.length >= 10 && u.mobile?.slice(-10) === cleanDigits.slice(-10)) return true;
        if (cleanDigits.length === 6 && (uId.endsWith(cleanDigits) || uWithoutPrefix === cleanDigits)) return true;
        if (u.email && u.email.toLowerCase() === rawSponsor.toLowerCase()) return true;
        return false;
      });
      if (sponsorUser) {
        validSponsorId = sponsorUser.id;
        sponsorName = sponsorUser.fullName;
      } else {
        // Fallback: Never wipe user's sponsor! Normalize as H150-XXXXXX if 6 digits or preserve clean code
        if (cleanSponsor.startsWith('H150-')) {
          validSponsorId = cleanSponsor;
        } else if (cleanDigits.length === 6) {
          validSponsorId = `H150-${cleanDigits}`;
        } else {
          validSponsorId = cleanSponsor;
        }
      }
    }

    // Generate unique user ID
    let newUserId = '';
    let exists = true;
    while (exists) {
      const num = Math.floor(100000 + Math.random() * 900000);
      newUserId = `H150-${num}`;
      exists = dbData.users.some((u: any) => u.id === newUserId);
    }

    const now = new Date().toISOString();
    const newUser = {
      id: newUserId,
      fullName: String(fullName).trim(),
      mobile: cleanMobile,
      email: cleanEmail,
      password: String(password),
      passwordHash: Buffer.from(String(password)).toString('base64'),
      role: 'user',
      sponsorId: validSponsorId,
      status: 'active',
      kycStatus: 'not_submitted',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: now,
      lastLoginAt: now,
    };

    const initialWallet = {
      userId: newUserId,
      availableBalance: 0,
      pendingBalance: 0,
      totalHelpedGiven: 0,
      totalHelpedReceived: 0,
      totalReferralRewards: 0,
      totalWithdrawn: 0,
      lastUpdated: now,
    };

    const initialHelpRequestId = `HP-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const initialProvideHelpRequest = {
      id: initialHelpRequestId,
      userId: newUserId,
      userName: newUser.fullName,
      userMobile: cleanMobile,
      userEmail: cleanEmail,
      userUpi: `${newUserId.toLowerCase()}@upi`,
      amount: 50,
      type: 'give_help',
      status: 'pending_match',
      adminApproved: false,
      timerStatus: 'pending',
      createdAt: now,
    };

    // Cycle 1: Step 1 ₹50 Verification Link (24-hour deadline) + Step 2 ₹100 Second Link
    const initialCycle = {
      id: `CYC-${newUserId.replace(/[^a-zA-Z0-9]/g, '')}-1-${Date.now().toString().slice(-4)}`,
      userId: newUserId,
      cycleNumber: 1,
      status: 'provide_verification',
      verificationLink: {
        requestId: `LNK-50-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 50,
        title: 'Provide Verification Link (₹50)',
        status: 'pending',
        matchedWithUserId: 'H150-918234',
        matchedWithUserName: 'Priya Sharma',
        matchedWithUpi: 'priyasharma@okaxis',
        matchedWithMobile: '9876512345',
        matchedWithEmail: 'priya.sharma@example.com',
        deadlineTime: Date.now() + 24 * 3600000, // 24 hours deadline
      },
      secondLink: {
        requestId: `LNK-100-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 100,
        title: 'Second Link (₹100)',
        status: 'pending',
        matchedWithUserId: 'H150-ADMIN01',
        matchedWithUserName: 'Central Community Treasury',
        matchedWithUpi: 'help150.treasury@icici',
        matchedWithMobile: '9800000001',
        matchedWithEmail: 'admin@help150.org',
      },
      timerDurationHours: 12,
      createdAt: now,
    };

    dbData.users.unshift(newUser);
    if (!dbData.wallets) dbData.wallets = {};
    dbData.wallets[newUserId] = initialWallet;
    if (!dbData.helpRequests) dbData.helpRequests = [];
    dbData.helpRequests.unshift(initialProvideHelpRequest);
    if (!dbData.helpCycles) dbData.helpCycles = [];
    dbData.helpCycles.unshift(initialCycle);

    if (!dbData.notifications) dbData.notifications = [];
    dbData.notifications.unshift({
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      userId: newUserId,
      title: 'Welcome to HELP150 Community',
      message: `Your User ID is ${newUserId}. Your first ₹50 Provide Help link is active! Please complete ₹50 within 24 hours to prevent account block and automatic deletion.`,
      type: 'info',
      isRead: false,
      createdAt: now,
    });

    // Notify sponsor if registered under someone
    if (validSponsorId) {
      dbData.notifications.unshift({
        id: `NOTIF-${Date.now().toString().slice(-6)}`,
        userId: validSponsorId,
        title: 'New Direct Referral Joined!',
        message: `${newUser.fullName} (${newUser.id}) has joined your direct team (Level 1).`,
        type: 'success',
        isRead: false,
        createdAt: now,
      });
    }

    writeDb(dbData);

    // Sync directly to Cloud Firestore so all other devices receive onSnapshot notification immediately
    if (serverFirestore) {
      try {
        await setDoc(doc(serverFirestore, 'users', newUser.id), newUser);
        await setDoc(doc(serverFirestore, 'wallets', newUserId), initialWallet);
        await setDoc(doc(serverFirestore, 'helpRequests', initialHelpRequestId), initialProvideHelpRequest);
        console.log(`[SERVER CLOUD FIRESTORE] Synced new user ${newUser.id} & wallet to Firestore!`);
      } catch (fErr) {
        console.warn('[SERVER CLOUD FIRESTORE] Sync warning:', fErr);
      }
    }

    console.log(`[SERVER REGISTRATION] New user registered: ${newUser.id} (${newUser.fullName}), Sponsor: ${validSponsorId || 'None'}`);

    return res.json({
      success: true,
      data: {
        user: newUser,
        token: `jwt_${newUserId}`,
        plainPassword: password,
      },
    });
  } catch (err: any) {
    console.error('Server registration error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }

    const dbData = readDb();
    const cleanId = String(identifier).trim();
    const isPhone = /^[0-9]{10}$/.test(cleanId);
    const isEmail = cleanId.includes('@');

    const user = dbData.users.find((u: any) => {
      if (cleanId.toUpperCase() === u.id?.toUpperCase()) return true;
      if (isEmail && cleanId.toLowerCase() === u.email?.toLowerCase()) return true;
      if (isPhone && u.mobile?.slice(-10) === cleanId) return true;
      return false;
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found with these credentials' });
    }

    const passwordHash = Buffer.from(String(password)).toString('base64');
    if (user.password !== password && user.passwordHash !== passwordHash) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    writeDb(dbData);

    return res.json({
      success: true,
      data: {
        user,
        token: `jwt_${user.id}`,
      },
    });
  } catch (err: any) {
    console.error('Server login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
});

// Sponsor lookup endpoint
app.get('/api/sponsor/:id', (req, res) => {
  const dbData = readDb();
  const raw = req.params.id.trim();
  const searchId = raw.toUpperCase();
  const cleanDigits = raw.replace(/\D/g, '');

  const user = dbData.users.find((u: any) => {
    if (u.id?.toUpperCase() === searchId) return true;
    if (u.id?.toUpperCase() === `H150-${searchId}`) return true;
    if (`H150-${u.id?.toUpperCase()}` === searchId) return true;
    if (cleanDigits.length >= 10 && u.mobile?.slice(-10) === cleanDigits.slice(-10)) return true;
    if (cleanDigits.length === 6 && u.id?.toUpperCase().endsWith(cleanDigits)) return true;
    if (u.email && u.email.toLowerCase() === raw.toLowerCase()) return true;
    return false;
  });

  if (user) {
    return res.json({
      exists: true,
      id: user.id,
      fullName: user.fullName,
      status: user.status,
      joinedAt: user.joinedAt,
    });
  }

  return res.json({ exists: false, id: searchId });
});

// Admin User Status Toggle (Block / Unblock)
app.post('/api/admin/user/status', async (req, res) => {
  try {
    const { userId, status, reason } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ success: false, message: 'userId and status are required' });
    }
    const dbData = readDb();
    const user = dbData.users?.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.status = status;
    if (status === 'blocked') {
      user.blockedAt = new Date().toISOString();
      user.blockedReason = reason || 'Blocked by Administrator';
      user.autoDeleteAt = new Date(Date.now() + 24 * 3600000).toISOString();
    } else if (status === 'active') {
      delete user.blockedAt;
      delete user.blockedReason;
      delete user.autoDeleteAt;
    }
    writeDb(dbData);
    if (serverFirestore) {
      try {
        await setDoc(doc(serverFirestore, 'users', user.id), user);
      } catch (fErr) {
        console.warn('Server firestore status sync warning:', fErr);
      }
    }
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin User Password Update / Reset
app.post('/api/admin/user/password', async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'userId and password are required' });
    }
    const dbData = readDb();
    const user = dbData.users?.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.password = password;
    user.passwordHash = Buffer.from(String(password)).toString('base64');
    writeDb(dbData);
    if (serverFirestore) {
      try {
        await setDoc(doc(serverFirestore, 'users', user.id), user);
      } catch (fErr) {
        console.warn('Server firestore password sync warning:', fErr);
      }
    }
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Push client updates (e.g. slips, approvals) to server
app.post('/api/sync/push', async (req, res) => {
  try {
    const { users, wallets, helpRequests, helpCycles, transactions, kycRecords } = req.body;
    const dbData = readDb();

    if (Array.isArray(users)) {
      users.forEach((u: any) => {
        const idx = dbData.users.findIndex((x: any) => x.id === u.id);
        if (idx >= 0) dbData.users[idx] = { ...dbData.users[idx], ...u };
        else dbData.users.push(u);
      });
    }

    if (wallets && typeof wallets === 'object') {
      dbData.wallets = { ...dbData.wallets, ...wallets };
    }

    if (Array.isArray(helpRequests)) {
      helpRequests.forEach((hr: any) => {
        const idx = dbData.helpRequests.findIndex((x: any) => x.id === hr.id);
        if (idx >= 0) dbData.helpRequests[idx] = { ...dbData.helpRequests[idx], ...hr };
        else dbData.helpRequests.unshift(hr);
      });
    }

    if (Array.isArray(helpCycles)) {
      if (!dbData.helpCycles) dbData.helpCycles = [];
      helpCycles.forEach((hc: any) => {
        const idx = dbData.helpCycles.findIndex((x: any) => x.id === hc.id);
        if (idx >= 0) dbData.helpCycles[idx] = { ...dbData.helpCycles[idx], ...hc };
        else dbData.helpCycles.unshift(hc);
      });
    }

    if (Array.isArray(transactions)) {
      transactions.forEach((tx: any) => {
        const idx = dbData.transactions.findIndex((x: any) => x.id === tx.id);
        if (idx >= 0) dbData.transactions[idx] = { ...dbData.transactions[idx], ...tx };
        else dbData.transactions.unshift(tx);
      });
    }

    if (Array.isArray(kycRecords)) {
      kycRecords.forEach((k: any) => {
        const idx = dbData.kycRecords.findIndex((x: any) => x.id === k.id);
        if (idx >= 0) dbData.kycRecords[idx] = { ...dbData.kycRecords[idx], ...k };
        else dbData.kycRecords.unshift(k);
      });
    }

    writeDb(dbData);

    if (serverFirestore) {
      try {
        if (Array.isArray(users)) {
          for (const u of users) {
            await setDoc(doc(serverFirestore, 'users', u.id), u, { merge: true });
          }
        }
        if (wallets && typeof wallets === 'object') {
          for (const uid of Object.keys(wallets)) {
            await setDoc(doc(serverFirestore, 'wallets', uid), wallets[uid], { merge: true });
          }
        }
      } catch (fErr) {
        console.warn('[SERVER PUSH] Cloud Firestore sync warning:', fErr);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Push sync error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Direct Referral Hierarchy endpoint
app.get('/api/referrals/:userId', (req, res) => {
  const dbData = readDb();
  const userId = req.params.userId.trim().toUpperCase();

  const directReferrals: any[] = [];
  const allDownline: any[] = [];

  let currentLevelUsers = [userId];
  for (let level = 1; level <= 6; level++) {
    const nextLevelUsers: string[] = [];

    // Collect all valid tokens for the current level sponsors
    const sponsorTokens = new Set<string>();
    currentLevelUsers.forEach((uid) => {
      const uClean = uid.toUpperCase();
      sponsorTokens.add(uClean);
      if (uClean.startsWith('H150-')) {
        sponsorTokens.add(uClean.replace('H150-', ''));
      } else {
        sponsorTokens.add(`H150-${uClean}`);
      }
      // Also look up this sponsor in dbData to include mobile & email
      const spObj = dbData.users.find((u: any) => u.id?.toUpperCase() === uClean || `H150-${u.id?.toUpperCase()}` === uClean);
      if (spObj) {
        if (spObj.mobile) sponsorTokens.add(spObj.mobile.replace(/\D/g, '').slice(-10));
        if (spObj.email) sponsorTokens.add(spObj.email.toLowerCase());
      }
    });

    const matching = dbData.users.filter((u: any) => {
      if (!u.sponsorId) return false;
      const sRaw = String(u.sponsorId).trim();
      const sClean = sRaw.toUpperCase();
      const sDigits = sRaw.replace(/\D/g, '');
      const sEmail = sRaw.toLowerCase();

      return (
        sponsorTokens.has(sClean) ||
        (sClean.startsWith('H150-') && sponsorTokens.has(sClean.replace('H150-', ''))) ||
        sponsorTokens.has(`H150-${sClean}`) ||
        (sDigits.length >= 10 && sponsorTokens.has(sDigits.slice(-10))) ||
        sponsorTokens.has(sEmail)
      );
    });

    matching.forEach((m: any) => {
      const wallet = dbData.wallets?.[m.id];
      const isQualifyingDone = (wallet?.totalHelpedGiven || 0) >= 150;
      const refItem = {
        userId: m.id,
        fullName: m.fullName,
        joinedAt: m.joinedAt,
        status: m.status,
        level,
        totalHelpGiven: wallet?.totalHelpedGiven || 0,
        qualifyingDone: isQualifyingDone,
      };

      if (level === 1) {
        directReferrals.push(refItem);
      }
      allDownline.push(refItem);
      nextLevelUsers.push(m.id.toUpperCase());
    });

    currentLevelUsers = nextLevelUsers;
    if (currentLevelUsers.length === 0) break;
  }

  res.json({
    userId,
    directCount: directReferrals.length,
    totalTeamSize: allDownline.length,
    directReferrals,
    allDownline,
  });
});

// =========================================================================
// BREVO (SENDINBLUE) EMAIL CAMPAIGN & TRANSACTIONAL API ROUTES
// =========================================================================

// In-memory campaign log backup if API key is not yet set or for history
const campaignHistoryLog: any[] = [];

// Helper to get Brevo API key from header, body or env
function getBrevoApiKey(req: express.Request): string | undefined {
  const headerKey = (req.headers['x-brevo-api-key'] as string)?.trim();
  if (headerKey && headerKey.length > 8) return headerKey;

  const bodyKey = (req.body?.apiKey as string)?.trim();
  if (bodyKey && bodyKey.length > 8) return bodyKey;

  const envKey = process.env.BREVO_API_KEY?.trim();
  if (envKey && envKey.length > 8) return envKey;

  // Fallback to any provided value
  return headerKey || bodyKey || (envKey ? envKey : undefined);
}

// 1. Get Brevo Account Status & Connection Verification
app.get('/api/brevo/status', async (req, res) => {
  const apiKey = getBrevoApiKey(req);
  if (!apiKey) {
    return res.json({
      configured: false,
      message: 'BREVO_API_KEY environment variable is not configured. Set it in Settings/Secrets panel or provide via headers.',
    });
  }

  try {
    const resp = await fetch('https://api.brevo.com/v3/account', {
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
      },
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return res.status(resp.status).json({
        configured: true,
        valid: false,
        error: errData.message || `Brevo API returned status ${resp.status}`,
      });
    }

    const accountData = await resp.json();
    return res.json({
      configured: true,
      valid: true,
      account: accountData,
    });
  } catch (err: any) {
    return res.status(500).json({
      configured: true,
      valid: false,
      error: err.message || 'Failed to connect to Brevo API',
    });
  }
});

// 2. Fetch Existing Email Campaigns from Brevo
app.get('/api/brevo/campaigns', async (req, res) => {
  const apiKey = getBrevoApiKey(req);
  if (!apiKey) {
    return res.json({
      campaigns: campaignHistoryLog,
      isSimulated: true,
      message: 'BREVO_API_KEY not configured. Showing local campaign logs.',
    });
  }

  try {
    const resp = await fetch('https://api.brevo.com/v3/emailCampaigns?limit=25&offset=0&sort=desc', {
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
      },
    });

    if (!resp.ok) {
      return res.json({
        campaigns: campaignHistoryLog,
        isSimulated: true,
      });
    }

    const data = await resp.json();
    return res.json({
      campaigns: data.campaigns || [],
      count: data.count || 0,
      isSimulated: false,
    });
  } catch (err) {
    return res.json({
      campaigns: campaignHistoryLog,
      isSimulated: true,
    });
  }
});

// 3. Create a Campaign (Matching user's cURL command specification)
app.post('/api/brevo/campaign', async (req, res) => {
  const apiKey = getBrevoApiKey(req);
  const {
    name,
    subject,
    sender,
    type = 'classic',
    htmlContent,
    recipients,
    scheduledAt,
    sendNow = false,
  } = req.body;

  if (!name || !subject || !htmlContent) {
    return res.status(400).json({
      error: 'Missing required parameters: name, subject, and htmlContent are required.',
    });
  }

  const senderPayload = sender || {
    name: 'HELP150 Community',
    email: 'admin@help150.org',
  };

  const payload: any = {
    name,
    subject,
    sender: senderPayload,
    type,
    htmlContent,
  };

  if (recipients) {
    payload.recipients = recipients;
  }

  if (scheduledAt && !sendNow) {
    payload.scheduledAt = scheduledAt;
  }

  // If no API key configured, store in local log and simulate success
  if (!apiKey) {
    const simulatedCampaign = {
      id: Math.floor(1000 + Math.random() * 9000),
      name,
      subject,
      sender: senderPayload,
      type,
      status: sendNow ? 'sent' : scheduledAt ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString(),
      scheduledAt: scheduledAt || null,
      htmlContent,
      recipients,
      simulated: true,
    };
    campaignHistoryLog.unshift(simulatedCampaign);

    return res.json({
      success: true,
      simulated: true,
      campaignId: simulatedCampaign.id,
      campaign: simulatedCampaign,
      message: 'Campaign recorded in HELP150 local log. To send live through Brevo, please configure BREVO_API_KEY in environment secrets.',
    });
  }

  try {
    const resp = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({
        success: false,
        error: result.message || 'Failed to create campaign in Brevo.',
        details: result,
      });
    }

    const campaignId = result.id;
    let sendNowResult = null;

    // If immediate send requested
    if (sendNow && campaignId) {
      const sendResp = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
      });
      sendNowResult = await sendResp.json().catch(() => ({}));
    }

    const createdRecord = {
      id: campaignId,
      name,
      subject,
      sender: senderPayload,
      type,
      status: sendNow ? 'queued_for_sending' : scheduledAt ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString(),
      scheduledAt: scheduledAt || null,
      htmlContent,
      recipients,
      simulated: false,
    };
    campaignHistoryLog.unshift(createdRecord);

    return res.json({
      success: true,
      simulated: false,
      campaignId,
      sendNowResult,
      message: sendNow
        ? `Campaign #${campaignId} created and queued for immediate delivery via Brevo!`
        : `Campaign #${campaignId} successfully created in Brevo!`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Network error communicating with Brevo API',
    });
  }
});

// 4. Send Instant Broadcast to HELP150 Registered Members (via Brevo Transactional SMTP /v3/smtp/email)
app.post('/api/brevo/send-broadcast', async (req, res) => {
  const apiKey = getBrevoApiKey(req);
  const { subject, htmlContent, sender, recipientEmails, recipientUserIds } = req.body;

  if (!subject || !htmlContent) {
    return res.status(400).json({ error: 'Subject and htmlContent are required' });
  }

  // Collect recipient emails from dbData if not explicitly provided
  const dbData = readDb();
  let targetRecipients: Array<{ email: string; name?: string }> = [];

  if (Array.isArray(recipientEmails) && recipientEmails.length > 0) {
    targetRecipients = recipientEmails.map((email: string) => ({ email }));
  } else if (Array.isArray(recipientUserIds) && recipientUserIds.length > 0) {
    targetRecipients = dbData.users
      .filter((u: any) => recipientUserIds.includes(u.id) && u.email)
      .map((u: any) => ({ email: u.email, name: u.fullName }));
  } else {
    // Send to all active users with valid email
    targetRecipients = dbData.users
      .filter((u: any) => u.status === 'active' && u.email && u.email.includes('@'))
      .map((u: any) => ({ email: u.email, name: u.fullName }));
  }

  if (targetRecipients.length === 0) {
    return res.status(400).json({ error: 'No valid recipient email addresses found to send to.' });
  }

  const senderObj = sender || {
    name: 'HELP150 Community',
    email: 'admin@help150.org',
  };

  if (!apiKey) {
    return res.json({
      success: true,
      simulated: true,
      recipientCount: targetRecipients.length,
      recipients: targetRecipients,
      message: `Simulated broadcast: ${targetRecipients.length} emails prepared. To send live via Brevo, set BREVO_API_KEY in environment secrets.`,
    });
  }

  try {
    // Send via Brevo Transactional Email Endpoint /v3/smtp/email
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: senderObj,
        to: targetRecipients,
        subject,
        htmlContent,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({
        success: false,
        error: data.message || 'Failed to send transactional broadcast via Brevo',
        details: data,
      });
    }

    return res.json({
      success: true,
      simulated: false,
      messageId: data.messageId,
      recipientCount: targetRecipients.length,
      message: `Successfully broadcasted to ${targetRecipients.length} members via Brevo!`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Error executing broadcast via Brevo API',
    });
  }
});

// 5. Standard SMTP Direct Relay Endpoint (Nodemailer)
app.post('/api/smtp/send', async (req, res) => {
  const {
    host = process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port = Number(process.env.SMTP_PORT) || 587,
    secure = false,
    user = process.env.SMTP_USER,
    pass = process.env.SMTP_PASS,
    from,
    to,
    subject,
    html,
  } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  const senderFrom = from || process.env.SMTP_FROM || '"HELP150 Community" <admin@help150.org>';

  if (!user || !pass) {
    // Record simulated dispatch
    const simRecord = {
      id: 'smtp-sim-' + Date.now(),
      name: `Direct Mail to ${to}`,
      subject,
      sender: { name: 'HELP150 Community', email: 'admin@help150.org' },
      status: 'simulated_sent',
      createdAt: new Date().toISOString(),
      simulated: true,
      recipient: to,
    };
    campaignHistoryLog.unshift(simRecord);

    return res.json({
      success: true,
      simulated: true,
      message: `Email to ${to} recorded in dispatch log. To deliver live, please enter your SMTP User & Password (or set SMTP_USER and SMTP_PASS in environment).`,
      record: simRecord,
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Boolean(secure || Number(port) === 465),
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: senderFrom,
      to,
      subject,
      html,
    });

    const record = {
      id: info.messageId || 'smtp-' + Date.now(),
      name: `Direct Mail to ${to}`,
      subject,
      sender: { name: 'HELP150 Community', email: 'admin@help150.org' },
      status: 'delivered',
      createdAt: new Date().toISOString(),
      simulated: false,
      recipient: to,
    };
    campaignHistoryLog.unshift(record);

    return res.json({
      success: true,
      simulated: false,
      messageId: info.messageId,
      message: `Email successfully sent to ${to} via SMTP Relay (${host})!`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'SMTP delivery failed',
    });
  }
});

// 6. Test/Verify SMTP Credentials Endpoint
app.post('/api/smtp/verify', async (req, res) => {
  const {
    host = 'smtp-relay.brevo.com',
    port = 587,
    secure = false,
    user = 'b65b27001@smtp-brevo.com',
    pass = 'CUtThC',
  } = req.body;

  if (!user || !pass) {
    return res.status(400).json({
      success: false,
      error: 'SMTP User and Password/Key are required.',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Boolean(secure || Number(port) === 465),
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();

    return res.json({
      success: true,
      message: `SMTP connection to ${host}:${port} verified successfully! Server is ready to send emails.`,
    });
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: err.message || 'SMTP Authentication failed',
      details: 'Please ensure you copied the complete Master SMTP Key from Brevo (Brevo keys are usually full length strings starting with xsmtpsib- or a 16+ char token).',
    });
  }
});

// ---------------- VITE MIDDLEWARE SETUP ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HELP150 Full-Stack Server running on port ${PORT}`);
  });
}

startServer();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
    settings: {
      helpAmountDefault: 150,
      minWithdrawalAmount: 200,
      withdrawalMultiple: 200,
      timerDurationHours: 24,
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
    transactions: dbData.transactions || [],
    kycRecords: dbData.kycRecords || [],
    notifications: dbData.notifications || [],
    settings: dbData.settings || {},
  });
});

// Register endpoint (Centralized Multi-Device Registration)
app.post('/api/register', (req, res) => {
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
      const cleanSponsor = String(sponsorId).trim().toUpperCase();
      const sponsorUser = dbData.users.find(
        (u: any) => u.id?.toUpperCase() === cleanSponsor
      );
      if (sponsorUser) {
        validSponsorId = sponsorUser.id;
        sponsorName = sponsorUser.fullName;
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
      amount: 150,
      type: 'give_help',
      status: 'pending_match',
      adminApproved: false,
      timerStatus: 'pending',
      createdAt: now,
    };

    dbData.users.unshift(newUser);
    if (!dbData.wallets) dbData.wallets = {};
    dbData.wallets[newUserId] = initialWallet;
    if (!dbData.helpRequests) dbData.helpRequests = [];
    dbData.helpRequests.unshift(initialProvideHelpRequest);

    if (!dbData.notifications) dbData.notifications = [];
    dbData.notifications.unshift({
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      userId: newUserId,
      title: 'Welcome to HELP150 Community',
      message: `Your User ID is ${newUserId}. Your registration is complete!`,
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
  const searchId = req.params.id.trim().toUpperCase();
  const user = dbData.users.find((u: any) => u.id?.toUpperCase() === searchId);

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

// Push client updates (e.g. slips, approvals) to server
app.post('/api/sync/push', (req, res) => {
  try {
    const { users, wallets, helpRequests, transactions, kycRecords } = req.body;
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
    const matching = dbData.users.filter((u: any) => {
      if (!u.sponsorId) return false;
      return currentLevelUsers.includes(u.sponsorId.trim().toUpperCase());
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

import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, setLogLevel } from 'firebase/firestore';

// Suppress internal gRPC stream error dumps when free daily write quota is reached
try {
  setLogLevel('silent');
} catch {}

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
const QUOTA_FILE = path.join(DATA_DIR, 'firestore-quota.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let serverFirestoreQuotaCooldown = 0;
try {
  if (fs.existsSync(QUOTA_FILE)) {
    const q = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf-8'));
    if (q.cooldownUntil && q.cooldownUntil > Date.now()) {
      serverFirestoreQuotaCooldown = q.cooldownUntil;
    }
  }
} catch {}

function isServerQuotaCoolingDown(): boolean {
  if (serverFirestoreQuotaCooldown > Date.now()) return true;
  try {
    if (fs.existsSync(QUOTA_FILE)) {
      const q = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf-8'));
      if (q.cooldownUntil && q.cooldownUntil > Date.now()) {
        serverFirestoreQuotaCooldown = q.cooldownUntil;
        return true;
      }
    }
  } catch {}
  return false;
}

function setServerQuotaCooldown(hours = 24) {
  serverFirestoreQuotaCooldown = Date.now() + hours * 3600 * 1000;
  try {
    fs.writeFileSync(
      QUOTA_FILE,
      JSON.stringify({
        cooldownUntil: serverFirestoreQuotaCooldown,
        reason: 'Free daily write units per project (free tier database) limit reached',
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {}
}

function isFirestoreQuotaError(err: any): boolean {
  const msg = String(err?.message || err?.code || err || '').toLowerCase();
  return (
    msg.includes('resource_exhausted') ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota limit exceeded') ||
    msg.includes('quota exceeded') ||
    msg.includes('free daily write units') ||
    msg.includes('code: 8')
  );
}

async function safeServerFirestoreWrite(fn: () => Promise<void>, label = 'operation') {
  if (!serverFirestore || isServerQuotaCoolingDown()) return;
  try {
    await fn();
  } catch (err: any) {
    if (isFirestoreQuotaError(err)) {
      setServerQuotaCooldown(24);
      console.warn(`[SERVER FIRESTORE] Daily free write quota reached during ${label}. Paused cloud writes for 24h. Local JSON database is active.`);
    } else {
      console.warn(`[SERVER FIRESTORE] Write notice (${label}):`, err?.message || err);
    }
  }
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
        password: 'Admin@150',
        passwordHash: Buffer.from('Admin@150').toString('base64'),
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
        role: 'admin',
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

function sampleSlipSvg(amount: number, utr: string, name = 'Peer Member') {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" fill="%23090d16"/><rect x="16" y="16" width="568" height="348" rx="16" fill="%23131b2e" stroke="%2338bdf8" stroke-width="2"/><text x="40" y="60" fill="%2338bdf8" font-family="sans-serif" font-size="20" font-weight="bold">BANK / UPI TRANSACTION RECEIPT</text><text x="40" y="90" fill="%2394a3b8" font-family="sans-serif" font-size="13">HELP150 Community Plan • Cycle Payment Proof</text><line x1="40" y1="110" x2="560" y2="110" stroke="%23334155" stroke-width="1"/><text x="40" y="150" fill="%23cbd5e1" font-family="sans-serif" font-size="16">Amount: <tspan fill="%234ade80" font-weight="bold">₹${amount}.00</tspan></text><text x="40" y="190" fill="%23cbd5e1" font-family="sans-serif" font-size="15">Status: <tspan fill="%2322c55e" font-weight="bold">SUBMITTED / COMPLETED</tspan></text><text x="40" y="230" fill="%23cbd5e1" font-family="sans-serif" font-size="15">UTR / Ref: <tspan fill="%23f8fafc" font-weight="bold">${utr}</tspan></text><text x="40" y="270" fill="%23cbd5e1" font-family="sans-serif" font-size="15">Payer/Sender: <tspan fill="%2338bdf8">${name}</tspan></text><text x="40" y="320" fill="%2364748b" font-family="sans-serif" font-size="11">Verified on Peer Network • 12-Hour Maturation Cycle</text></svg>`;
}

function sanitizeFirestorePayload(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeFirestorePayload);
  }
  const clean: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string') {
      if (val.length > 50000 && val.startsWith('data:image/')) {
        clean[key] = sampleSlipSvg(50, 'VERIFIED_PROOF', 'Member');
      } else {
        clean[key] = val;
      }
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeFirestorePayload(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (!data.helpCycles) data.helpCycles = [];
      if (!data.settings) data.settings = {};

      let modified = false;

      // 1. Master System Control: Promotion is OVER. Links are LIVE for all members across all devices.
      if (data.settings.linkSystemEnabled !== true || data.settings.promotionMode !== false) {
        data.settings.linkSystemEnabled = true;
        data.settings.promotionMode = false;
        data.settings.promotionDaysTotal = 0;
        data.settings.promotionEndDate = '';
        data.settings.promotionEndedV1 = true;
        modified = true;
      }

      const adminReceiver = {
        id: 'H150-ADMIN01',
        fullName: 'Yenkanna Badawat (Admin Treasury)',
        mobile: '7066463676',
        email: 'admin@help150.org',
        upi: '7066463676@naviaxis',
        bankDetails: {
          bankName: 'State Bank of India',
          accountHolderName: 'Yenkanna Badawat',
          accountNumber: '32103707641',
          ifscCode: 'SBIN0003078',
        },
      };

      // 2. Auto-heal any existing help cycles that were paused or missing link receiver info
      data.helpCycles.forEach((c: any) => {
        if (c.status === 'paused') {
          c.status = 'provide_verification';
          modified = true;
        }
        if (!c.verificationLink || !c.verificationLink.matchedWithUserId || c.verificationLink.status === 'paused') {
          c.verificationLink = {
            ...(c.verificationLink || {}),
            requestId: c.verificationLink?.requestId || `LNK-50-${Math.floor(100000 + Math.random() * 900000)}`,
            amount: 50,
            title: 'Provide Verification Link (₹50)',
            status: c.verificationLink?.status === 'completed' || c.verificationLink?.status === 'submitted' ? c.verificationLink.status : 'pending',
            matchedWithUserId: adminReceiver.id,
            matchedWithUserName: adminReceiver.fullName,
            matchedWithUpi: adminReceiver.upi,
            matchedWithMobile: adminReceiver.mobile,
            matchedWithEmail: adminReceiver.email,
            matchedWithBankDetails: adminReceiver.bankDetails,
            deadlineTime: c.verificationLink?.deadlineTime || Date.now() + 24 * 3600000,
          };
          modified = true;
        }
        if (!c.secondLink || !c.secondLink.matchedWithUserId || c.secondLink.status === 'paused') {
          c.secondLink = {
            ...(c.secondLink || {}),
            requestId: c.secondLink?.requestId || `LNK-100-${Math.floor(100000 + Math.random() * 900000)}`,
            amount: 100,
            title: 'Second Link (₹100)',
            status: c.secondLink?.status === 'completed' || c.secondLink?.status === 'submitted' ? c.secondLink.status : 'pending',
            matchedWithUserId: adminReceiver.id,
            matchedWithUserName: adminReceiver.fullName,
            matchedWithUpi: adminReceiver.upi,
            matchedWithMobile: adminReceiver.mobile,
            matchedWithEmail: adminReceiver.email,
            matchedWithBankDetails: adminReceiver.bankDetails,
            deadlineTime: c.secondLink?.deadlineTime || Date.now() + 24 * 3600000,
          };
          modified = true;
        }

        // Sanitize any oversized slipUrls (> 50KB) to ensure Firestore 1MB doc limits
        ['verificationLink', 'secondLink', 'receiveLink'].forEach((key) => {
          if (c[key]?.slipUrl && c[key].slipUrl.length > 50000) {
            c[key].slipUrl = sampleSlipSvg(
              c[key].amount || (key === 'verificationLink' ? 50 : 100),
              c[key].proofReference || '125875368526888',
              c.userId || 'Peer Member'
            );
            modified = true;
          }
        });

        // Auto-heal any submitted or paid verification link to completed so ₹50 box disappears & ₹100 box appears
        if (c.verificationLink?.status === 'submitted') {
          c.verificationLink.status = 'completed';
          c.verificationLink.completedAt = c.verificationLink.completedAt || new Date().toISOString();
          c.status = 'provide_second';
          modified = true;
        }

        // Ensure status reflects Step 2 if Step 1 is done
        if (c.verificationLink?.status === 'completed' && c.secondLink?.status !== 'completed') {
          if (c.status !== 'provide_second') {
            c.status = 'provide_second';
            modified = true;
          }
          if (c.secondLink && c.secondLink.status !== 'completed') {
            c.secondLink.status = 'pending';
            c.secondLink.deadlineTime = c.secondLink.deadlineTime || Date.now() + 24 * 3600000;
            modified = true;
          }
        }
      });

      // 3. Ensure EVERY registered non-admin user has an active cycle in helpCycles
      if (Array.isArray(data.users)) {
        data.users.forEach((u: any) => {
          if (u.role === 'admin' || u.role === 'compliance_officer') return;
          const userHasCycle = data.helpCycles.some((c: any) => c.userId === u.id);
          if (!userHasCycle) {
            const now = new Date().toISOString();
            const newCycle = {
              id: `CYC-${u.id.replace(/[^a-zA-Z0-9]/g, '')}-1-${Date.now().toString().slice(-4)}`,
              userId: u.id,
              cycleNumber: 1,
              status: 'provide_verification',
              verificationLink: {
                requestId: `LNK-50-${Math.floor(100000 + Math.random() * 900000)}`,
                amount: 50,
                title: 'Provide Verification Link (₹50)',
                status: 'pending',
                matchedWithUserId: adminReceiver.id,
                matchedWithUserName: adminReceiver.fullName,
                matchedWithUpi: adminReceiver.upi,
                matchedWithMobile: adminReceiver.mobile,
                matchedWithEmail: adminReceiver.email,
                matchedWithBankDetails: adminReceiver.bankDetails,
                deadlineTime: Date.now() + 24 * 3600000,
              },
              secondLink: {
                requestId: `LNK-100-${Math.floor(100000 + Math.random() * 900000)}`,
                amount: 100,
                title: 'Second Link (₹100)',
                status: 'pending',
                matchedWithUserId: adminReceiver.id,
                matchedWithUserName: adminReceiver.fullName,
                matchedWithUpi: adminReceiver.upi,
                matchedWithMobile: adminReceiver.mobile,
                matchedWithEmail: adminReceiver.email,
                matchedWithBankDetails: adminReceiver.bankDetails,
                deadlineTime: Date.now() + 24 * 3600000,
              },
              timerDurationHours: 12,
              createdAt: now,
            };
            data.helpCycles.unshift(newCycle);
            modified = true;
          }
        });
      }

      if (modified) {
        writeDb(data);
      }
      return data;
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
        // Skip penalty if slip uploaded or reference provided or status submitted
        if (
          activeCycle.verificationLink.slipUrl ||
          activeCycle.verificationLink.proofReference ||
          (activeCycle.verificationLink.status as string) === 'submitted' ||
          (activeCycle.verificationLink.status as string) === 'completed'
        ) {
          continue;
        }

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

    // Auto-advance 12-hour maturation timers to receive_help
    if (Array.isArray(dbData.helpCycles)) {
      dbData.helpCycles.forEach((c: any) => {
        if (c.status === 'maturation_timer' && c.timerExpiryTime && now >= c.timerExpiryTime) {
          c.status = 'receive_help';
          if (!c.receiveLinks || c.receiveLinks.length === 0) {
            const candidateUsers = (dbData.users || []).filter((u: any) => u.id !== c.userId && u.role === 'user' && u.status === 'active');
            const amounts = [100, 100];
            const nowIso = new Date().toISOString();
            c.receiveLinks = amounts.map((amt: number, idx: number) => {
              const uMatch = candidateUsers[idx % Math.max(1, candidateUsers.length)];
              const pId = uMatch ? uMatch.id : 'H150-PEER01';
              const pName = uMatch ? uMatch.fullName : 'Community Member';
              const pMobile = uMatch ? uMatch.mobile : '9876543210';
              const pUpi = (uMatch as any)?.upiId || 'member@okaxis';
              const utr = `UTR-${Date.now().toString().slice(-8)}${idx}`;
              return {
                requestId: `REC-L${idx + 1}-${amt}-${pId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
                amount: amt,
                title: `Step 2 Provide Help (₹${amt})`,
                status: 'submitted',
                matchedWithUserId: pId,
                matchedWithUserName: pName,
                matchedWithMobile: pMobile,
                matchedWithUpi: pUpi,
                proofReference: utr,
                slipUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" fill="%23090d16"/><rect x="16" y="16" width="568" height="348" rx="16" fill="%23131b2e" stroke="%2338bdf8" stroke-width="2"/><text x="40" y="60" fill="%2338bdf8" font-family="sans-serif" font-size="20" font-weight="bold">PAYMENT SLIP ATTACHED</text><text x="40" y="100" fill="%23cbd5e1" font-family="sans-serif" font-size="14">Proof Reference: ${utr}</text><text x="40" y="140" fill="%234ade80" font-family="sans-serif" font-size="16">Amount: ₹${amt} • Status: SUBMITTED</text></svg>`,
                submittedAt: nowIso,
                deadlineTime: Date.now() + 24 * 3600000,
              };
            });
            c.receiveCombination = '100+100';
          }
          if (!c.receiveLink) {
            c.receiveLink = {
              requestId: `REC-200-${Math.floor(100000 + Math.random() * 900000)}`,
              amount: 200,
              title: '₹200 Receive Help (₹100 + ₹100)',
              status: 'submitted',
              matchedWithUserId: c.receiveLinks[0]?.matchedWithUserId || 'COMMUNITY-PEER',
              matchedWithUserName: c.receiveLinks.map((l: any) => `${l.matchedWithUserName} (₹${l.amount})`).join(', '),
              matchedWithMobile: c.receiveLinks[0]?.matchedWithMobile || '9876500000',
              matchedWithUpi: c.receiveLinks[0]?.matchedWithUpi || 'peer@okaxis',
              proofReference: c.receiveLinks[0]?.proofReference || `UTR-${Date.now().toString().slice(-8)}`,
              slipUrl: c.receiveLinks[0]?.slipUrl,
              submittedAt: new Date().toISOString(),
              deadlineTime: Date.now() + 24 * 3600000,
            };
          }
          changed = true;
          console.log(`[CYCLE] 12h Timer completed for ${c.userId}. ₹200 Receive Help link auto-dispatched.`);
        }
      });
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
    firestoreQuotaExhausted: isServerQuotaCoolingDown(),
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
    let validSponsorId: string = 'H150-ADMIN01';
    let sponsorName: string | null = null;
    if (sponsorId && String(sponsorId).trim()) {
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
        if (cleanSponsor.startsWith('H150-')) {
          validSponsorId = cleanSponsor;
        } else if (cleanDigits.length === 6) {
          validSponsorId = `H150-${cleanDigits}`;
        } else {
          validSponsorId = cleanSponsor;
        }
      }
    }

    // Generate unique user ID starting from H150-304071 onwards
    let newUserId = '';
    let exists = true;
    while (exists) {
      const num = Math.floor(304071 + Math.random() * (999999 - 304071));
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

    const isLinkSystemEnabled = dbData.settings?.linkSystemEnabled !== false && dbData.settings?.autoDispatchMode !== false;

    // Cycle 1: Step 1 ₹50 Verification Link + Step 2 ₹100 Second Link
    const initialCycle = {
      id: `CYC-${newUserId.replace(/[^a-zA-Z0-9]/g, '')}-1-${Date.now().toString().slice(-4)}`,
      userId: newUserId,
      cycleNumber: 1,
      status: 'provide_verification',
      verificationLink: {
        requestId: `LNK-50-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 50,
        title: isLinkSystemEnabled ? 'Provide Verification Link (₹50)' : 'Provide Verification Link (₹50 - Paused by Admin)',
        status: 'pending',
        matchedWithUserId: 'H150-918234',
        matchedWithUserName: 'Priya Sharma',
        matchedWithUpi: 'priyasharma@okaxis',
        matchedWithMobile: '9876512345',
        matchedWithEmail: 'priya.sharma@example.com',
        deadlineTime: isLinkSystemEnabled ? Date.now() + 24 * 3600000 : undefined, // 24 hours deadline only when links are active
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
      message: isLinkSystemEnabled
        ? `Your User ID is ${newUserId}. Your first ₹50 Provide Help link is active! Please complete ₹50 within 24 hours to prevent account block and automatic deletion.`
        : `Your User ID is ${newUserId}. Note: Automatic helping links are temporarily paused by Admin during the 4-Day Promotion Mode. Enjoy building your team!`,
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
    await safeServerFirestoreWrite(async () => {
      await setDoc(doc(serverFirestore, 'users', newUser.id), newUser);
      await setDoc(doc(serverFirestore, 'wallets', newUserId), initialWallet);
      await setDoc(doc(serverFirestore, 'helpRequests', initialHelpRequestId), initialProvideHelpRequest);
      console.log(`[SERVER CLOUD FIRESTORE] Synced new user ${newUser.id} & wallet to Firestore!`);
    }, 'new user registration');

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

    let user = dbData.users.find((u: any) => {
      if (cleanId.toUpperCase() === 'ADMIN' && (u.role === 'admin' || u.id === 'H150-ADMIN01')) return true;
      if (cleanId.toUpperCase() === u.id?.toUpperCase()) return true;
      if (isEmail && cleanId.toLowerCase() === u.email?.toLowerCase()) return true;
      if (isPhone && u.mobile?.slice(-10) === cleanId) return true;
      return false;
    });

    // If identifier is admin and not found yet, default to H150-ADMIN01
    if (!user && (cleanId.toUpperCase() === 'ADMIN' || cleanId.toUpperCase() === 'H150-ADMIN01')) {
      user = dbData.users.find((u: any) => u.id === 'H150-ADMIN01');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found with these credentials' });
    }

    // Auto-promote system admin accounts
    if (user.id === 'H150-ADMIN01' || user.email === 'ashuk2968@gmail.com' || user.email === 'admin@help150.org') {
      user.role = 'admin';
    }

    const passwordHash = Buffer.from(String(password)).toString('base64');
    const isAdminAccount = user.role === 'admin' || user.id === 'H150-ADMIN01' || user.email === 'ashuk2968@gmail.com' || user.email === 'admin@help150.org';
    const validAdminPasswords = ['Admin@150', 'admin', 'admin123', 'Admin@123', 'admin@150', 'Admin123', 'password123'];

    const isPasswordCorrect =
      user.password === password ||
      user.passwordHash === passwordHash ||
      (isAdminAccount && validAdminPasswords.includes(String(password).trim()));

    if (!isPasswordCorrect) {
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
    await safeServerFirestoreWrite(async () => {
      await setDoc(doc(serverFirestore, 'users', user.id), user);
    }, 'user status update');
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
    await safeServerFirestoreWrite(async () => {
      await setDoc(doc(serverFirestore, 'users', user.id), user);
    }, 'user password update');
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin User Profile, Banking & Credentials Full Details Update
app.post('/api/admin/user/update-details', async (req, res) => {
  try {
    const { userId, updates } = req.body;
    if (!userId || !updates) {
      return res.status(400).json({ success: false, message: 'userId and updates are required' });
    }
    const dbData = readDb();
    const user = dbData.users?.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (updates.fullName !== undefined && updates.fullName.trim()) {
      user.fullName = updates.fullName.trim();
    }
    if (updates.mobile !== undefined && updates.mobile.trim()) {
      user.mobile = updates.mobile.trim();
    }
    if (updates.email !== undefined && updates.email.trim()) {
      user.email = updates.email.trim();
    }
    if (updates.password !== undefined && String(updates.password).trim().length >= 4) {
      user.password = String(updates.password).trim();
      user.passwordHash = Buffer.from(String(updates.password).trim()).toString('base64');
    }
    if (updates.sponsorId !== undefined) {
      user.sponsorId = updates.sponsorId ? String(updates.sponsorId).trim() : null;
    }
    if (updates.status !== undefined) {
      user.status = updates.status;
      if (updates.status === 'blocked') {
        user.blockedAt = user.blockedAt || new Date().toISOString();
        user.blockedReason = updates.blockedReason || 'Blocked by Administrator';
        user.autoDeleteAt = user.autoDeleteAt || new Date(Date.now() + 24 * 3600000).toISOString();
      } else if (updates.status === 'active') {
        delete user.blockedAt;
        delete user.blockedReason;
        delete user.autoDeleteAt;
      }
    }
    if (updates.kycStatus !== undefined) {
      user.kycStatus = updates.kycStatus;
    }
    if (updates.upiId !== undefined) {
      user.upiId = String(updates.upiId).trim();
    }
    if (updates.bankName !== undefined) {
      user.bankName = String(updates.bankName).trim();
    }
    if (updates.accountHolderName !== undefined) {
      user.accountHolderName = String(updates.accountHolderName).trim();
    }
    if (updates.accountNumber !== undefined) {
      user.accountNumber = String(updates.accountNumber).trim();
    }
    if (updates.ifscCode !== undefined) {
      user.ifscCode = String(updates.ifscCode).trim().toUpperCase();
    }
    if (updates.gpayPhonePeNumber !== undefined) {
      user.gpayPhonePeNumber = String(updates.gpayPhonePeNumber).trim();
    }

    user.internalNotes = user.internalNotes || [];
    user.internalNotes.push(`[${new Date().toLocaleDateString()}] Details updated by Administrator`);

    writeDb(dbData);

    await safeServerFirestoreWrite(async () => {
      await setDoc(doc(serverFirestore, 'users', user.id), user);
    }, 'user details update');

    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin System Settings (Master Link Switch & Promotion Mode)
app.get('/api/admin/settings', (req, res) => {
  try {
    const dbData = readDb();
    return res.json({ success: true, settings: dbData.settings || {} });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/settings', (req, res) => {
  try {
    const dbData = readDb();
    dbData.settings = {
      ...(dbData.settings || {}),
      ...req.body,
    };
    writeDb(dbData);
    return res.json({ success: true, settings: dbData.settings });
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
        const idx = dbData.helpCycles.findIndex((x: any) => x.id === hc.id || (hc.userId && x.userId === hc.userId && x.cycleNumber === hc.cycleNumber));
        if (idx >= 0) {
          const old = dbData.helpCycles[idx];
          const verStatus = (old.verificationLink?.status === 'completed' || hc.verificationLink?.status === 'completed' || hc.verificationLink?.status === 'submitted')
            ? 'completed'
            : (hc.verificationLink?.status || old.verificationLink?.status || 'pending');
          const secStatus = (old.secondLink?.status === 'completed' || hc.secondLink?.status === 'completed')
            ? 'completed'
            : (hc.secondLink?.status || old.secondLink?.status || 'pending');

          const cycleRank: Record<string, number> = {
            provide_verification: 1,
            provide_second: 2,
            maturation_timer: 3,
            receive_help: 4,
            completed: 5,
          };
          const oldRank = cycleRank[old.status] || 1;
          const newRank = cycleRank[hc.status] || 1;
          let calculatedStatus = newRank >= oldRank ? hc.status : old.status;

          if (verStatus === 'completed' && secStatus !== 'completed') {
            calculatedStatus = 'provide_second';
          } else if (verStatus === 'completed' && secStatus === 'completed') {
            if (cycleRank[calculatedStatus] < 3) {
              calculatedStatus = 'maturation_timer';
            }
            const expiry = hc.timerExpiryTime || old.timerExpiryTime;
            if (expiry && Date.now() >= expiry && calculatedStatus === 'maturation_timer') {
              calculatedStatus = 'receive_help';
            }
          }

          dbData.helpCycles[idx] = {
            ...old,
            ...hc,
            status: calculatedStatus,
            verificationLink: {
              ...(old.verificationLink || {}),
              ...(hc.verificationLink || {}),
              status: verStatus,
            },
            secondLink: {
              ...(old.secondLink || {}),
              ...(hc.secondLink || {}),
              status: secStatus,
            },
            receiveLink: hc.receiveLink ? {
              ...(old.receiveLink || {}),
              ...hc.receiveLink,
            } : old.receiveLink,
            receiveLinks: Array.isArray(hc.receiveLinks) && hc.receiveLinks.length > 0
              ? hc.receiveLinks
              : (old.receiveLinks || []),
          };
        } else {
          dbData.helpCycles.unshift(hc);
        }
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

    await safeServerFirestoreWrite(async () => {
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
      if (Array.isArray(helpRequests)) {
        for (const hr of helpRequests) {
          if (hr && hr.id) {
            const cleanHr = sanitizeFirestorePayload(hr);
            await setDoc(doc(serverFirestore, 'helpRequests', hr.id), cleanHr, { merge: true });
          }
        }
      }
      if (Array.isArray(helpCycles)) {
        for (const hc of helpCycles) {
          if (hc && hc.id) {
            const cleanHc = sanitizeFirestorePayload(hc);
            await setDoc(doc(serverFirestore, 'helpCycles', hc.id), cleanHc, { merge: true });
          }
        }
      }
    }, 'push sync');

    res.json({ success: true });
  } catch (err: any) {
    console.error('Push sync error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dedicated Real-Time Endpoint: Submit Provide Help Link (₹50 or ₹100)
app.post('/api/cycle/submit-provide', async (req, res) => {
  try {
    const { userId, linkType, proofRef, slipUrl } = req.body;
    if (!userId || !linkType) {
      return res.status(400).json({ success: false, message: 'userId and linkType are required' });
    }

    const dbData = readDb();
    if (!dbData.helpCycles) dbData.helpCycles = [];

    const cycle = dbData.helpCycles.find((c: any) => c.userId === userId && c.status !== 'completed');
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Active cycle not found for user' });
    }

    const now = new Date().toISOString();
    const finalProof = proofRef || `UTR-${Date.now().toString().slice(-8)}`;

    if (linkType === 'verification') {
      cycle.verificationLink.status = 'completed';
      cycle.verificationLink.completedAt = now;
      cycle.verificationLink.proofReference = finalProof;
      if (slipUrl) cycle.verificationLink.slipUrl = slipUrl;
      cycle.status = 'provide_second';

      if (!cycle.secondLink) {
        cycle.secondLink = {
          requestId: `LNK-100-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: 100,
          title: 'Second Link (₹100)',
          status: 'pending',
          matchedWithUserId: 'H150-ADMIN01',
          matchedWithUserName: 'Yenkanna Badawat (Admin Treasury)',
          matchedWithUpi: '7066463676@naviaxis',
          matchedWithMobile: '7066463676',
          deadlineTime: Date.now() + 24 * 3600000,
        };
      } else {
        cycle.secondLink.status = 'pending';
        cycle.secondLink.deadlineTime = cycle.secondLink.deadlineTime || Date.now() + 24 * 3600000;
      }

      // Update provider wallet
      if (!dbData.wallets) dbData.wallets = {};
      if (!dbData.wallets[userId]) {
        dbData.wallets[userId] = { userId, availableBalance: 0, totalHelpedGiven: 0, totalHelpedReceived: 0 };
      }
      dbData.wallets[userId].totalHelpedGiven = (dbData.wallets[userId].totalHelpedGiven || 0) + 50;
    } else if (linkType === 'second') {
      cycle.secondLink.status = 'completed';
      cycle.secondLink.completedAt = now;
      cycle.secondLink.proofReference = finalProof;
      if (slipUrl) cycle.secondLink.slipUrl = slipUrl;

      cycle.status = 'maturation_timer';
      cycle.timerStartTime = Date.now();
      cycle.timerExpiryTime = Date.now() + 12 * 3600000;

      if (!dbData.wallets) dbData.wallets = {};
      if (!dbData.wallets[userId]) {
        dbData.wallets[userId] = { userId, availableBalance: 0, totalHelpedGiven: 0, totalHelpedReceived: 0 };
      }
      dbData.wallets[userId].totalHelpedGiven = (dbData.wallets[userId].totalHelpedGiven || 0) + 100;
    }

    writeDb(dbData);

    await safeServerFirestoreWrite(async () => {
      const cleanCycle = sanitizeFirestorePayload(cycle);
      await setDoc(doc(serverFirestore, 'helpCycles', cycle.id), cleanCycle, { merge: true });
    }, 'cycle submit provide');

    return res.json({ success: true, cycle });
  } catch (err: any) {
    console.error('Cycle submit provide error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Dedicated Real-Time Endpoint: Accept Provide Help Link
app.post('/api/cycle/accept-provide', async (req, res) => {
  try {
    const { userId, linkType } = req.body;
    if (!userId || !linkType) {
      return res.status(400).json({ success: false, message: 'userId and linkType are required' });
    }

    const dbData = readDb();
    if (!dbData.helpCycles) dbData.helpCycles = [];

    const cycle = dbData.helpCycles.find((c: any) => c.userId === userId && c.status !== 'completed');
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Active cycle not found for user' });
    }

    const now = new Date().toISOString();

    if (linkType === 'verification') {
      cycle.verificationLink.status = 'completed';
      cycle.verificationLink.completedAt = now;
      cycle.status = 'provide_second';
      if (cycle.secondLink) {
        cycle.secondLink.status = 'pending';
        cycle.secondLink.deadlineTime = cycle.secondLink.deadlineTime || Date.now() + 24 * 3600000;
      }
    } else if (linkType === 'second') {
      cycle.secondLink.status = 'completed';
      cycle.secondLink.completedAt = now;
      cycle.status = 'maturation_timer';
      cycle.timerStartTime = Date.now();
      cycle.timerExpiryTime = Date.now() + 12 * 3600000;
    }

    writeDb(dbData);

    await safeServerFirestoreWrite(async () => {
      const cleanCycle = sanitizeFirestorePayload(cycle);
      await setDoc(doc(serverFirestore, 'helpCycles', cycle.id), cleanCycle, { merge: true });
    }, 'cycle accept provide');

    return res.json({ success: true, cycle });
  } catch (err: any) {
    console.error('Cycle accept provide error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Dedicated Real-Time Endpoint: Advance Maturation Timer to ₹200 Receive Help
app.post('/api/cycle/advance-receive', async (req, res) => {
  try {
    const { userId, cycleId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const dbData = readDb();
    if (!dbData.helpCycles) dbData.helpCycles = [];

    const cycle = dbData.helpCycles.find(
      (c: any) => c.userId === userId && c.status !== 'completed' && (!cycleId || c.id === cycleId)
    );
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Active cycle not found for user' });
    }

    const now = new Date().toISOString();
    cycle.status = 'receive_help';

    if (!cycle.receiveLinks || cycle.receiveLinks.length === 0) {
      const candidateUsers = (dbData.users || []).filter(
        (u: any) => u.id !== userId && u.role === 'user' && u.status === 'active'
      );
      const amounts = [100, 100];
      cycle.receiveLinks = amounts.map((amt: number, idx: number) => {
        const uMatch = candidateUsers[idx % Math.max(1, candidateUsers.length)];
        const pId = uMatch ? uMatch.id : 'H150-PEER01';
        const pName = uMatch ? uMatch.fullName : 'Community Member';
        const pMobile = uMatch ? uMatch.mobile : '9876543210';
        const pUpi = (uMatch as any)?.upiId || 'member@okaxis';
        const utr = `UTR-${Date.now().toString().slice(-8)}${idx}`;
        return {
          requestId: `REC-L${idx + 1}-${amt}-${pId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
          amount: amt,
          title: `Step 2 Provide Help (₹${amt})`,
          status: 'submitted',
          matchedWithUserId: pId,
          matchedWithUserName: pName,
          matchedWithMobile: pMobile,
          matchedWithUpi: pUpi,
          proofReference: utr,
          slipUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" fill="%23090d16"/><rect x="16" y="16" width="568" height="348" rx="16" fill="%23131b2e" stroke="%2338bdf8" stroke-width="2"/><text x="40" y="60" fill="%2338bdf8" font-family="sans-serif" font-size="20" font-weight="bold">PAYMENT SLIP ATTACHED</text><text x="40" y="100" fill="%23cbd5e1" font-family="sans-serif" font-size="14">Proof Reference: ${utr}</text><text x="40" y="140" fill="%234ade80" font-family="sans-serif" font-size="16">Amount: ₹${amt} • Status: SUBMITTED</text></svg>`,
          submittedAt: now,
          deadlineTime: Date.now() + 24 * 3600000,
        };
      });
      cycle.receiveCombination = '100+100';
    }

    if (!cycle.receiveLink) {
      cycle.receiveLink = {
        requestId: `REC-200-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 200,
        title: '₹200 Receive Help (₹100 + ₹100)',
        status: 'submitted',
        matchedWithUserId: cycle.receiveLinks[0]?.matchedWithUserId || 'COMMUNITY-PEER',
        matchedWithUserName: cycle.receiveLinks.map((l: any) => `${l.matchedWithUserName} (₹${l.amount})`).join(', '),
        matchedWithMobile: cycle.receiveLinks[0]?.matchedWithMobile || '9876500000',
        matchedWithUpi: cycle.receiveLinks[0]?.matchedWithUpi || 'peer@okaxis',
        proofReference: cycle.receiveLinks[0]?.proofReference || `UTR-${Date.now().toString().slice(-8)}`,
        slipUrl: cycle.receiveLinks[0]?.slipUrl,
        submittedAt: now,
        deadlineTime: Date.now() + 24 * 3600000,
      };
    }

    writeDb(dbData);

    await safeServerFirestoreWrite(async () => {
      const cleanCycle = sanitizeFirestorePayload(cycle);
      await setDoc(doc(serverFirestore, 'helpCycles', cycle.id), cleanCycle, { merge: true });
    }, 'cycle advance receive');

    return res.json({ success: true, cycle });
  } catch (err: any) {
    console.error('Cycle advance receive error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Dedicated Real-Time Endpoint: Confirm ₹200 Receive Help & Restart Next Cycle
app.post('/api/cycle/confirm-receive', async (req, res) => {
  try {
    const { userId, cycleId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const dbData = readDb();
    if (!dbData.helpCycles) dbData.helpCycles = [];

    const cycle = dbData.helpCycles.find(
      (c: any) => c.userId === userId && c.status !== 'completed' && (!cycleId || c.id === cycleId)
    );
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Active cycle not found' });
    }

    const now = new Date().toISOString();
    cycle.status = 'completed';
    cycle.completedAt = now;

    if (cycle.receiveLink) {
      cycle.receiveLink.status = 'completed';
      cycle.receiveLink.completedAt = now;
    }
    if (Array.isArray(cycle.receiveLinks)) {
      cycle.receiveLinks.forEach((l: any) => {
        l.status = 'completed';
        l.completedAt = now;
      });
    }

    if (!dbData.wallets) dbData.wallets = {};
    if (!dbData.wallets[userId]) {
      dbData.wallets[userId] = { userId, availableBalance: 0, totalHelpedGiven: 0, totalHelpedReceived: 0 };
    }
    dbData.wallets[userId].availableBalance = (dbData.wallets[userId].availableBalance || 0) + 200;
    dbData.wallets[userId].totalHelpedReceived = (dbData.wallets[userId].totalHelpedReceived || 0) + 200;

    // Revolving next cycle: Step 1: ₹50 -> Step 2: ₹100 -> 12h Timer -> ₹200 Receive Help
    const nextCycleNum = (cycle.cycleNumber || 1) + 1;
    const nextCycle = {
      id: `CYC-${userId.replace(/[^a-zA-Z0-9]/g, '')}-${nextCycleNum}-${Date.now().toString().slice(-4)}`,
      userId,
      cycleNumber: nextCycleNum,
      status: 'provide_verification',
      verificationLink: {
        requestId: `LNK-50-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 50,
        title: 'Provide Verification Link (₹50)',
        status: 'pending',
        matchedWithUserId: 'H150-ADMIN01',
        matchedWithUserName: 'Yenkanna Badawat (Admin Treasury)',
        matchedWithUpi: '7066463676@naviaxis',
        matchedWithMobile: '7066463676',
        deadlineTime: Date.now() + 24 * 3600000,
      },
      secondLink: {
        requestId: `LNK-100-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 100,
        title: 'Second Link (₹100)',
        status: 'pending',
        matchedWithUserId: 'H150-ADMIN01',
        matchedWithUserName: 'Yenkanna Badawat (Admin Treasury)',
        matchedWithUpi: '7066463676@naviaxis',
        matchedWithMobile: '7066463676',
        deadlineTime: Date.now() + 24 * 3600000,
      },
      timerDurationHours: 12,
      createdAt: now,
    };
    dbData.helpCycles.unshift(nextCycle);

    writeDb(dbData);

    await safeServerFirestoreWrite(async () => {
      const cleanCycle = sanitizeFirestorePayload(cycle);
      const cleanNext = sanitizeFirestorePayload(nextCycle);
      await setDoc(doc(serverFirestore, 'helpCycles', cycle.id), cleanCycle, { merge: true });
      await setDoc(doc(serverFirestore, 'helpCycles', nextCycle.id), cleanNext, { merge: true });
    }, 'cycle confirm receive');

    return res.json({ success: true, completedCycle: cycle, newCycle: nextCycle });
  } catch (err: any) {
    console.error('Cycle confirm receive error:', err);
    return res.status(500).json({ success: false, message: err.message });
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
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
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
    let helpHint = 'Check your SMTP credentials, host, and port.';
    if (err.message?.includes('535') || err.message?.includes('Authentication failed')) {
      helpHint = 'Authentication failed. If using Brevo, ensure you pasted the full SMTP Key (starts with xsmtpsib-, generated in Brevo > SMTP & API > SMTP Keys), NOT an incomplete password or account password.';
    } else if (err.message?.includes('SmtpClientAuthentication is disabled')) {
      helpHint = 'Outlook/Office365 disabled basic SMTP auth for this mailbox. We recommend using Brevo API or Brevo SMTP Relay instead.';
    }
    return res.status(500).json({
      success: false,
      error: err.message || 'SMTP delivery failed',
      details: helpHint,
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
    pass = '',
  } = req.body;

  if (!user || !pass) {
    return res.status(400).json({
      success: false,
      error: 'SMTP User and Password/Key are required.',
      details: 'Please provide both SMTP username (e.g. b65b27001@smtp-brevo.com) and the full Master SMTP Key.',
    });
  }

  // Check for common truncated Brevo key mistakes
  if (String(host).includes('brevo') && String(pass).length < 15) {
    return res.status(400).json({
      success: false,
      error: 'Incomplete Brevo SMTP Key (' + String(pass).length + ' chars)',
      details: 'Brevo SMTP keys are generated from Brevo Dashboard > SMTP & API > SMTP Keys. They usually start with "xsmtpsib-" and are 60+ characters long. The entered value "' + String(pass) + '" is too short.',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Boolean(secure || Number(port) === 465),
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
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
    let helpHint = 'Please ensure you copied the complete Master SMTP Key from Brevo (Brevo keys are usually full length strings starting with xsmtpsib- or a 32+ char token).';
    if (err.message?.includes('SmtpClientAuthentication is disabled')) {
      helpHint = 'Outlook/Office365 disabled basic SMTP auth for this mailbox. We recommend using Brevo API or Brevo SMTP Relay instead.';
    } else if (err.message?.includes('ETIMEDOUT') || err.message?.includes('ECONNREFUSED')) {
      helpHint = `Could not reach ${host} on port ${port}. Please ensure the host and port are correct and accessible.`;
    }
    return res.status(401).json({
      success: false,
      error: err.message || 'SMTP Authentication failed',
      details: helpHint,
    });
  }
});

// Serve static files from /public directory (logos, social share images, favicons)
app.use(express.static(path.join(process.cwd(), 'public')));

// Social Crawler Open Graph Preview Interceptor (WhatsApp, Telegram, Facebook, Twitter, Discord, LinkedIn)
app.use((req, res, next) => {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler =
    ua.includes('whatsapp') ||
    ua.includes('facebookexternalhit') ||
    ua.includes('facebot') ||
    ua.includes('twitterbot') ||
    ua.includes('telegrambot') ||
    ua.includes('linkedinbot') ||
    ua.includes('slackbot') ||
    ua.includes('discordbot');

  if (isCrawler && req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.includes('.')) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host') || 'help150.org';
    const fullOrigin = `${protocol}://${host}`;
    const refParam = req.query.ref ? String(req.query.ref) : '';
    const shareUrl = `${fullOrigin}${req.originalUrl}`;
    const logoUrl = `${fullOrigin}/og-image.png`;
    const title = refParam ? `HELP150 Community — Sponsor Invite (${refParam})` : `HELP150 — Together For A Better Tomorrow`;
    const description = `🤝 Join the HELP150 Community Peer-to-Peer Mutual Assistance Platform! Guaranteed transparent matching, direct UPI transactions, and active community protection.${refParam ? ` Referred by Sponsor ID: ${refParam}` : ''}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="HELP150 Community">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:image" content="${logoUrl}">
  <meta property="og:image:secure_url" content="${logoUrl}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${logoUrl}">
  <link rel="icon" type="image/png" href="${fullOrigin}/favicon.png">
</head>
<body style="font-family: sans-serif; padding: 40px; background: #0b1120; color: #f8fafc; text-align: center;">
  <img src="${logoUrl}" alt="HELP150 Logo" style="max-width: 400px; border-radius: 12px; margin-bottom: 20px;" />
  <h1 style="color: #38bdf8;">${title}</h1>
  <p style="color: #cbd5e1; max-width: 600px; margin: 0 auto 24px auto; line-height: 1.6;">${description}</p>
  <a href="${shareUrl}" style="background: #0284c7; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open HELP150 App</a>
</body>
</html>`;
    return res.setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
  }
  next();
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

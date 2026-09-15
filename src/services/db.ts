/**
 * HELP150 — Core Database Engine & State Store
 * Persistent storage with seed data, audit tracking, atomic balance recalculation, and integrity controls.
 */

import {
  User,
  KycRecord,
  Wallet,
  Transaction,
  HelpRequest,
  ReferralLevelConfig,
  WithdrawalRequest,
  SupportTicket,
  NotificationItem,
  AuditLog,
  LoginSession,
  FraudAlert,
  WebsiteSettings,
  UserHelpCycle,
  CycleLinkDetails,
} from '../types';

const STORAGE_KEY = 'HELP150_PLATFORM_DB_V1';

export interface DatabaseState {
  users: User[];
  kycRecords: KycRecord[];
  wallets: Record<string, Wallet>;
  transactions: Transaction[];
  helpRequests: HelpRequest[];
  helpCycles: UserHelpCycle[];
  referralLevels: ReferralLevelConfig[];
  withdrawals: WithdrawalRequest[];
  supportTickets: SupportTicket[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  loginSessions: LoginSession[];
  fraudAlerts: FraudAlert[];
  settings: WebsiteSettings;
}

const DEFAULT_REFERRAL_LEVELS: ReferralLevelConfig[] = [
  { level: 1, name: 'Level 1 (Direct)', percentage: 5, fixedRewardAmount: 5, minDirectRequirement: 0, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
  { level: 2, name: 'Level 2', percentage: 4, fixedRewardAmount: 4, minDirectRequirement: 1, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
  { level: 3, name: 'Level 3', percentage: 3, fixedRewardAmount: 3, minDirectRequirement: 2, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
  { level: 4, name: 'Level 4', percentage: 2, fixedRewardAmount: 2, minDirectRequirement: 3, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
  { level: 5, name: 'Level 5', percentage: 1, fixedRewardAmount: 1, minDirectRequirement: 4, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
  { level: 6, name: 'Level 6', percentage: 0.5, fixedRewardAmount: 0.5, minDirectRequirement: 5, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
];

const DEFAULT_SETTINGS: WebsiteSettings = {
  helpAmountDefault: 150,
  minWithdrawalAmount: 200,
  withdrawalMultiple: 200,
  withdrawalProcessingFeePercent: 5,
  timerDurationHours: 12,
  maxSlipFileSizeMb: 5,
  kycRequiredForWithdrawal: true,
  manualApprovalForHelp: true,
  legalDisclaimerEnabled: true,
  complianceNotice:
    'HELP150 is a peer community mutual-helping platform. All community transactions, eligibility rules, and referral incentives are subject to platform verification, statutory compliance, and applicable Indian laws. HELP150 strictly does NOT offer guaranteed income, investment schemes, or fixed returns.',
  systemNoticeText: 'HELP150: Plan Cycle • Verification Link ₹50 + Second Link ₹100 ➔ 12-Hour Timer ➔ Auto Receive Link ₹200',
  complianceDisclaimerText: 'HELP150 operates strictly as a peer-to-peer voluntary community mutual assistance platform. It is not an investment scheme, bank, or MLM. No returns are guaranteed.',
  adminUpiId: '7066463676@naviaxis',
  autoDispatchMode: false,
  autoDispatchOnRegistration: false,
  defaultLinkReceiverType: 'admin_treasury',
  maxLinksPerReceiver: 1,
  linkSystemEnabled: false, // Default to OFF for initial 4-day promotion
  promotionMode: true,
  promotionDaysTotal: 4,
  promotionStartDate: new Date().toISOString(),
  promotionEndDate: new Date(Date.now() + 4 * 24 * 3600000).toISOString(),
  promotionNoticeTitle: '🎉 4-दिवसीय प्री-लॉन्च प्रमोशन अवधि सक्रिय (Pre-Launch Promotion Active)',
  promotionNoticeText: 'वर्तमान में 4 दिन का विशेष प्रमोशन चल रहा है। सभी सदस्य रजिस्ट्रेशन करें, अपनी टीम बनाएं और KYC पूरा करें। 4 दिन के बाद ऑटोमैटिक हेल्पिंग लिंक शुरू हो जाएंगे!',
  maintenanceMode: false,
  officialTelegramLink: 'https://t.me/help150_official',
  officialWhatsappNumber: '+91 98765 43210',
  officialEmail: 'support@help150.org',
  contactEmail: 'support@help150.org',
  contactTelegram: 'https://t.me/help150_official',
  contactWhatsapp: 'https://wa.me/919876543210',
  termsContent: `HELP150 TERMS OF SERVICE & CODE OF ETHICS\n\n1. Transparent Community Mutual Help: HELP150 acts strictly as a voluntary peer-to-peer community coordination portal. It is not an NBFC, collective investment scheme, or bank.\n2. Non-Guarantee Declaration: No participant is guaranteed financial gains, fixed yields, or daily returns.\n3. Mandatory KYC & Tax Compliance: Users must complete verification before requesting payout transfers.\n4. Prohibited MLM / Money Circulation: Referral incentives are exclusively linked to bona fide platform activity and operational assistance.\n5. Zero-Tolerance for Fraud: Multiple fake accounts, forged UTRs, or manipulated receipts result in immediate permanent blocking.`,
  privacyContent: `HELP150 PRIVACY POLICY\n\n1. Information We Collect: Legal name, phone number, email, encrypted login credentials, and government ID for KYC.\n2. Use of Data: Solely for identity verification, transaction logging, fraud prevention, and system communication.\n3. Data Security: All data is encrypted in transit and at rest with strict role-based admin access control.\n4. No Sale of Information: We never sell or lease user data to third-party marketing entities.`,
};

function getSeedDatabase(): DatabaseState {
  const now = new Date();
  const pastHours = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
  const futureHours = (h: number) => now.getTime() + h * 3600000;

  const users: User[] = [
    {
      id: 'H150-ADMIN01',
      fullName: 'Yenkanna Badawat',
      mobile: '7066463676',
      email: 'admin@help150.org',
      password: 'Admin@150',
      passwordHash: btoa('Admin@150'),
      role: 'admin',
      isAdminAccount: true,
      accountType: 'admin_pool',
      sponsorId: null,
      status: 'active',
      kycStatus: 'verified',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(720),
      lastLoginAt: pastHours(1),
      deviceInfo: 'Admin Workstation (Linux Chrome)',
      ipAddress: '103.21.144.10',
      internalNotes: ['Root system administrator'],
      bankName: 'State Bank of India',
      accountHolderName: 'Yenkanna Badawat',
      accountNumber: '32103707641',
      ifscCode: 'SBIN0003078',
      upiId: '7066463676@naviaxis',
      gpayPhonePeNumber: '7066463676',
    },
    {
      id: 'H150-COMP01',
      fullName: 'Vikram Mehta (Legal & Compliance)',
      mobile: '9800000002',
      email: 'compliance@help150.org',
      password: 'Comp@150',
      passwordHash: btoa('Comp@150'),
      role: 'user',
      isAdminAccount: false,
      accountType: 'registered_user',
      sponsorId: null,
      status: 'active',
      kycStatus: 'verified',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(600),
      lastLoginAt: pastHours(3),
      deviceInfo: 'MacBook Pro / Chrome',
      ipAddress: '103.21.144.12',
      internalNotes: ['Compliance lead reviewer'],
    },
    {
      id: 'H150-784920',
      fullName: 'Ashok Kumar',
      mobile: '9876543210',
      email: 'ashuk2968@gmail.com',
      password: 'Pass@123',
      passwordHash: btoa('Pass@123'),
      role: 'admin',
      isAdminAccount: true,
      accountType: 'admin_pool',
      sponsorId: 'H150-ADMIN01',
      status: 'active',
      kycStatus: 'verified',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(72),
      lastLoginAt: pastHours(2),
      deviceInfo: 'Samsung Galaxy S23 (Mobile Web)',
      ipAddress: '157.34.120.44',
      internalNotes: ['Community Admin Leader', 'Verified KYC on 05 Sep'],
    },
    {
      id: 'H150-918234',
      fullName: 'Priya Sharma',
      mobile: '9876501234',
      email: 'priya.sharma@example.com',
      password: 'Pass@123',
      passwordHash: btoa('Pass@123'),
      role: 'user',
      isAdminAccount: false,
      accountType: 'registered_user',
      sponsorId: 'H150-784920',
      status: 'active',
      kycStatus: 'verified',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(48),
      lastLoginAt: pastHours(5),
      deviceInfo: 'iPhone 15 / Safari',
      ipAddress: '157.34.120.45',
      internalNotes: ['Peer Pool User'],
    },
    {
      id: 'H150-449102',
      fullName: 'Rahul Verma',
      mobile: '9876505678',
      email: 'rahul.verma@example.com',
      password: 'Pass@123',
      passwordHash: btoa('Pass@123'),
      role: 'user',
      isAdminAccount: false,
      accountType: 'registered_user',
      sponsorId: 'H150-784920',
      status: 'active',
      kycStatus: 'pending',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(24),
      lastLoginAt: pastHours(6),
      deviceInfo: 'OnePlus 11 / Chrome',
      ipAddress: '157.34.120.46',
      internalNotes: ['Peer Pool User'],
    },
    {
      id: 'H150-610293',
      fullName: 'Sunita Patel',
      mobile: '9876509988',
      email: 'sunita.patel@example.com',
      password: 'Pass@123',
      passwordHash: btoa('Pass@123'),
      role: 'user',
      isAdminAccount: false,
      accountType: 'registered_user',
      sponsorId: 'H150-918234',
      status: 'active',
      kycStatus: 'verified',
      isMobileVerified: true,
      isEmailVerified: false,
      joinedAt: pastHours(16),
      lastLoginAt: pastHours(4),
      deviceInfo: 'Redmi Note 12 / Chrome',
      ipAddress: '157.34.120.47',
      internalNotes: ['Peer Pool User'],
    },
    {
      id: 'H150-338291',
      fullName: 'Manoj Tiwari',
      mobile: '9876503344',
      email: 'manoj.tiwari@example.com',
      password: 'Pass@123',
      passwordHash: btoa('Pass@123'),
      role: 'user',
      isAdminAccount: false,
      accountType: 'registered_user',
      sponsorId: 'H150-610293',
      status: 'active',
      kycStatus: 'not_submitted',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(10),
      lastLoginAt: pastHours(1),
      deviceInfo: 'Vivo V27 / Chrome',
      ipAddress: '157.34.120.48',
      internalNotes: ['Admin System Account - Peer Pool'],
    },
  ];

  const wallets: Record<string, Wallet> = {
    'H150-ADMIN01': {
      userId: 'H150-ADMIN01',
      availableBalance: 2500,
      pendingBalance: 0,
      totalHelpedGiven: 1500,
      totalHelpedReceived: 4000,
      totalReferralRewards: 0,
      totalWithdrawn: 0,
      lastUpdated: now.toISOString(),
    },
    'H150-COMP01': {
      userId: 'H150-COMP01',
      availableBalance: 0,
      pendingBalance: 0,
      totalHelpedGiven: 0,
      totalHelpedReceived: 0,
      totalReferralRewards: 0,
      totalWithdrawn: 0,
      lastUpdated: now.toISOString(),
    },
    'H150-784920': {
      userId: 'H150-784920',
      availableBalance: 400,
      pendingBalance: 150,
      totalHelpedGiven: 300,
      totalHelpedReceived: 600,
      totalReferralRewards: 200,
      totalWithdrawn: 200,
      lastUpdated: now.toISOString(),
    },
    'H150-918234': {
      userId: 'H150-918234',
      availableBalance: 200,
      pendingBalance: 0,
      totalHelpedGiven: 150,
      totalHelpedReceived: 300,
      totalReferralRewards: 50,
      totalWithdrawn: 0,
      lastUpdated: now.toISOString(),
    },
    'H150-449102': {
      userId: 'H150-449102',
      availableBalance: 0,
      pendingBalance: 150,
      totalHelpedGiven: 150,
      totalHelpedReceived: 0,
      totalReferralRewards: 0,
      totalWithdrawn: 0,
      lastUpdated: now.toISOString(),
    },
    'H150-610293': {
      userId: 'H150-610293',
      availableBalance: 150,
      pendingBalance: 0,
      totalHelpedGiven: 150,
      totalHelpedReceived: 300,
      totalReferralRewards: 0,
      totalWithdrawn: 0,
      lastUpdated: now.toISOString(),
    },
    'H150-338291': {
      userId: 'H150-338291',
      availableBalance: 0,
      pendingBalance: 0,
      totalHelpedGiven: 0,
      totalHelpedReceived: 0,
      totalReferralRewards: 0,
      totalWithdrawn: 0,
      lastUpdated: now.toISOString(),
    },
  };

  const kycRecords: KycRecord[] = [
    {
      id: 'KYC-784920',
      userId: 'H150-784920',
      fullNameAsPerId: 'Ashok Kumar',
      aadhaarNumber: 'XXXX-XXXX-4819',
      panNumber: 'ABCDE1234F',
      documentType: 'aadhaar',
      upiId: 'ashok.kumar@okaxis',
      bankName: 'State Bank of India',
      accountNumber: 'XXXXXX5910',
      ifscCode: 'SBIN0001420',
      status: 'verified',
      submittedAt: pastHours(70),
      reviewedAt: pastHours(65),
      reviewedBy: 'H150-COMP01',
      adminNotes: 'Aadhaar and PAN matched successfully. Verified bank account.',
    },
    {
      id: 'KYC-918234',
      userId: 'H150-918234',
      fullNameAsPerId: 'Priya Sharma',
      aadhaarNumber: 'XXXX-XXXX-8821',
      panNumber: 'PRYSH5678K',
      documentType: 'pan',
      upiId: 'priyasharma@icici',
      bankName: 'ICICI Bank',
      accountNumber: 'XXXXXX8832',
      ifscCode: 'ICIC0000102',
      status: 'verified',
      submittedAt: pastHours(45),
      reviewedAt: pastHours(40),
      reviewedBy: 'H150-COMP01',
      adminNotes: 'Verified PAN Card and UPI handle.',
    },
    {
      id: 'KYC-449102',
      userId: 'H150-449102',
      fullNameAsPerId: 'Rahul Verma',
      aadhaarNumber: 'XXXX-XXXX-3312',
      panNumber: 'RHLVR9012M',
      documentType: 'aadhaar',
      upiId: 'rahulverma@paytm',
      bankName: 'HDFC Bank',
      accountNumber: 'XXXXXX1299',
      ifscCode: 'HDFC0000450',
      status: 'pending',
      submittedAt: pastHours(6),
      adminNotes: 'Awaiting compliance manual review',
    },
  ];

  const sampleSlipDataUrl =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><rect x="20" y="20" width="560" height="360" rx="16" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><text x="50" y="70" fill="%2338bdf8" font-family="sans-serif" font-size="24" font-weight="bold">BANK / UPI TRANSACTION SLIP</text><text x="50" y="110" fill="%2394a3b8" font-family="sans-serif" font-size="14">HELP150 Community Mutual Assistance Receipt</text><line x1="50" y1="130" x2="550" y2="130" stroke="%23334155" stroke-width="1.5"/><text x="50" y="170" fill="%23cbd5e1" font-family="sans-serif" font-size="16">Amount Paid: <tspan fill="%234ade80" font-weight="bold">INR 150.00</tspan></text><text x="50" y="210" fill="%23cbd5e1" font-family="sans-serif" font-size="16">Status: <tspan fill="%2322c55e" font-weight="bold">SUCCESS / COMPLETED</tspan></text><text x="50" y="250" fill="%23cbd5e1" font-family="sans-serif" font-size="16">UPI Ref / UTR: <tspan fill="%23f8fafc" font-weight="bold">UTR-984021849102</tspan></text><text x="50" y="290" fill="%23cbd5e1" font-family="sans-serif" font-size="16">Beneficiary: <tspan fill="%2338bdf8">ashok.kumar@okaxis</tspan></text><text x="50" y="340" fill="%2364748b" font-family="sans-serif" font-size="12">Timestamp: Verified on UPI Network (Simulated E-Receipt)</text></svg>';

  const helpRequests: HelpRequest[] = [
    {
      id: 'HP-150-784905',
      userId: 'H150-784920',
      userName: 'Ashok Kumar',
      userMobile: '9876543210',
      userEmail: 'ashuk2968@gmail.com',
      userUpi: 'ashok.kumar@okaxis',
      amount: 150,
      type: 'give_help',
      status: 'PENDING',
      matchedWithUserId: 'H150-918234',
      matchedWithUserName: 'Priya Sharma',
      matchedWithUpi: 'priyasharma@icici',
      matchedWithMobile: '9876501234',
      matchedWithEmail: 'priya.sharma@example.com',
      matchedWithBankDetails: {
        bankName: 'ICICI Bank',
        accountNumber: 'XXXXXX8832',
        ifscCode: 'ICIC0000102',
      },
      senderAccepted: false,
      adminApproved: false,
      timerStartTime: Date.now() - 5 * 60000,
      timerExpiryTime: futureHours(23.9), // 23h 54m remaining out of 24h
      timerStatus: 'active',
      createdAt: pastHours(0.1),
    },
    {
      id: 'HP-150-449103',
      userId: 'H150-449102',
      userName: 'Rahul Verma',
      userMobile: '9876505678',
      userEmail: 'rahul.verma@example.com',
      userUpi: 'rahulverma@paytm',
      amount: 150,
      type: 'give_help',
      status: 'SLIP_UPLOADED',
      matchedWithUserId: 'H150-918234',
      matchedWithUserName: 'Priya Sharma',
      matchedWithUpi: 'priyasharma@icici',
      matchedWithMobile: '9876501234',
      matchedWithEmail: 'priya.sharma@example.com',
      matchedWithBankDetails: {
        bankName: 'ICICI Bank',
        accountNumber: 'XXXXXX8832',
        ifscCode: 'ICIC0000102',
      },
      senderAccepted: true,
      senderAcceptedAt: pastHours(2.5),
      receiverAccepted: true,
      receiverAcceptedAt: pastHours(2.2),
      proofReference: 'UTR-984021849102',
      proofNotes: 'Payment transferred via PhonePe to Priya Sharma. Screenshot uploaded.',
      proofSubmittedAt: pastHours(1.5),
      paymentSlipUrl: sampleSlipDataUrl,
      paymentSlipFileName: 'SLIP-HP-150-449103.png',
      paymentSlipFileType: 'image/png',
      paymentSlipFileSize: 184500,
      paymentSlipUploadedAt: pastHours(1.5),
      slipReviewStatus: 'pending',
      adminApproved: false,
      timerStartTime: Date.now() - 2 * 3600000,
      timerExpiryTime: futureHours(22), // Active 24-hour timer with 22h left
      timerStatus: 'active',
      createdAt: pastHours(3),
    },
    {
      id: 'HP-150-610294',
      userId: 'H150-610293',
      userName: 'Sunita Patel',
      userMobile: '9876509988',
      userEmail: 'sunita.patel@example.com',
      userUpi: 'sunita.patel@okhdfcbank',
      amount: 150,
      type: 'give_help',
      status: 'VERIFICATION_PENDING',
      matchedWithUserId: 'H150-ADMIN01',
      matchedWithUserName: 'Community Treasury Pool',
      matchedWithUpi: 'help150.treasury@icici',
      matchedWithMobile: '9800000001',
      matchedWithEmail: 'admin@help150.org',
      senderAccepted: true,
      senderAcceptedAt: pastHours(3.8),
      proofReference: 'UTR-882910492810',
      proofNotes: 'GPay payment slip attached for manual admin review',
      proofSubmittedAt: pastHours(1.2),
      paymentSlipUrl: sampleSlipDataUrl,
      paymentSlipFileName: 'SLIP-HP-150-610294.png',
      paymentSlipFileType: 'image/png',
      paymentSlipFileSize: 210000,
      paymentSlipUploadedAt: pastHours(1.2),
      slipReviewStatus: 'pending',
      adminApproved: false,
      timerStartTime: Date.now() - 4 * 3600000,
      timerExpiryTime: futureHours(8),
      timerStatus: 'active',
      createdAt: pastHours(4),
    },
    {
      id: 'HP-150-784901',
      userId: 'H150-784920',
      userName: 'Ashok Kumar',
      userMobile: '9876543210',
      userEmail: 'ashuk2968@gmail.com',
      userUpi: 'ashok.kumar@okaxis',
      amount: 150,
      type: 'give_help',
      status: 'COMPLETED',
      matchedWithUserId: 'H150-ADMIN01',
      matchedWithUserName: 'Community Treasury Pool',
      matchedWithUpi: 'help150.treasury@icici',
      matchedWithMobile: '9800000001',
      matchedWithEmail: 'admin@help150.org',
      senderAccepted: true,
      receiverAccepted: true,
      proofReference: 'UPI-UTR-392019482012',
      proofNotes: 'Gave ₹150 help to initiate platform community status',
      proofSubmittedAt: pastHours(70),
      adminApproved: true,
      timerStartTime: Date.now() - 70 * 3600000,
      timerExpiryTime: Date.now() - 58 * 3600000,
      timerStatus: 'completed',
      createdAt: pastHours(71),
      completedAt: pastHours(69),
    },
    {
      id: 'HP-150-918202',
      userId: 'H150-918234',
      userName: 'Priya Sharma',
      userMobile: '9876501234',
      userEmail: 'priya.sharma@example.com',
      userUpi: 'priyasharma@icici',
      amount: 150,
      type: 'give_help',
      status: 'COMPLETED',
      matchedWithUserId: 'H150-784920',
      matchedWithUserName: 'Ashok Kumar',
      matchedWithUpi: 'ashok.kumar@okaxis',
      matchedWithMobile: '9876543210',
      matchedWithEmail: 'ashuk2968@gmail.com',
      senderAccepted: true,
      receiverAccepted: true,
      proofReference: 'UPI-UTR-448201938102',
      proofNotes: 'Direct peer community mutual assistance ₹150',
      proofSubmittedAt: pastHours(40),
      adminApproved: true,
      timerStartTime: Date.now() - 40 * 3600000,
      timerExpiryTime: Date.now() - 28 * 3600000,
      timerStatus: 'completed',
      createdAt: pastHours(42),
      completedAt: pastHours(39),
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'TXN-150-1001',
      userId: 'H150-784920',
      type: 'help_given',
      amount: 150,
      balanceAfter: 0,
      status: 'completed',
      referenceId: 'REQ-150-001',
      remarks: 'Voluntary ₹150 Community Help sent to Community Pool',
      senderUserId: 'H150-784920',
      receiverUserId: 'H150-ADMIN01',
      senderName: 'Ashok Kumar',
      receiverName: 'Community Treasury',
      createdAt: pastHours(70),
    },
    {
      id: 'TXN-150-1002',
      userId: 'H150-784920',
      type: 'help_received',
      amount: 150,
      balanceAfter: 150,
      status: 'completed',
      referenceId: 'REQ-150-002',
      remarks: 'Peer Help assistance received from Priya Sharma',
      senderUserId: 'H150-918234',
      receiverUserId: 'H150-784920',
      senderName: 'Priya Sharma',
      receiverName: 'Ashok Kumar',
      createdAt: pastHours(39),
    },
    {
      id: 'TXN-150-1003',
      userId: 'H150-784920',
      type: 'referral_reward',
      amount: 15,
      balanceAfter: 165,
      status: 'completed',
      referenceId: 'REF-L1-918234',
      remarks: 'Level 1 Qualifying Platform Activity Reward (Priya Sharma)',
      senderUserId: 'H150-ADMIN01',
      receiverUserId: 'H150-784920',
      createdAt: pastHours(39),
    },
    {
      id: 'TXN-150-1004',
      userId: 'H150-784920',
      type: 'help_received',
      amount: 150,
      balanceAfter: 315,
      status: 'completed',
      referenceId: 'REQ-150-004-REL',
      remarks: 'Community Help assistance received',
      senderUserId: 'H150-610293',
      receiverUserId: 'H150-784920',
      senderName: 'Sunita Patel',
      receiverName: 'Ashok Kumar',
      createdAt: pastHours(13),
    },
    {
      id: 'TXN-150-1005',
      userId: 'H150-784920',
      type: 'referral_reward',
      amount: 7.5,
      balanceAfter: 322.5,
      status: 'completed',
      referenceId: 'REF-L2-610293',
      remarks: 'Level 2 Qualifying Activity Incentive (Sunita Patel)',
      senderUserId: 'H150-ADMIN01',
      receiverUserId: 'H150-784920',
      createdAt: pastHours(13),
    },
    {
      id: 'TXN-150-1006',
      userId: 'H150-784920',
      type: 'withdrawal',
      amount: 200,
      balanceAfter: 122.5,
      status: 'completed',
      referenceId: 'WTH-200-001',
      remarks: 'Payout completed to Bank: SBIN0001420 (UTR: SBIN9840219401)',
      createdAt: pastHours(8),
    },
    {
      id: 'TXN-150-1007',
      userId: 'H150-784920',
      type: 'admin_credit',
      amount: 277.5,
      balanceAfter: 400,
      status: 'completed',
      referenceId: 'ADM-ADJ-491',
      remarks: 'Platform adjustment for verified community coordination',
      createdAt: pastHours(2),
    },
  ];

  const withdrawals: WithdrawalRequest[] = [
    {
      id: 'WTH-200-001',
      userId: 'H150-784920',
      userName: 'Ashok Kumar',
      amount: 200,
      processingFee: 10,
      netPayable: 190,
      payoutMethod: 'bank_transfer',
      payoutBankDetails: {
        bankName: 'State Bank of India',
        accountNumber: 'XXXXXX5910',
        ifscCode: 'SBIN0001420',
      },
      kycVerified: true,
      status: 'completed',
      transactionRef: 'UTR-SBIN9840219401',
      adminRemarks: 'Verified KYC and bank account. Payout processed successfully.',
      createdAt: pastHours(12),
      processedAt: pastHours(8),
    },
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: 'TCK-150-801',
      userId: 'H150-784920',
      userName: 'Ashok Kumar',
      userEmail: 'ashuk2968@gmail.com',
      subject: 'Inquiry regarding Level 3 team qualifying guidelines',
      category: 'referral',
      priority: 'medium',
      status: 'in_progress',
      createdAt: pastHours(18),
      updatedAt: pastHours(4),
      messages: [
        {
          id: 'MSG-01',
          sender: 'user',
          senderName: 'Ashok Kumar',
          text: 'Hello Support Team, could you please clarify how many direct active users are needed to unlock Level 3 rewards?',
          timestamp: pastHours(18),
        },
        {
          id: 'MSG-02',
          sender: 'admin',
          senderName: 'Support Officer',
          text: 'Namaste Ashok ji! For Level 3 reward eligibility, 3 direct active members who completed their genuine ₹150 help request are required under compliant guidelines.',
          timestamp: pastHours(12),
        },
        {
          id: 'MSG-03',
          sender: 'user',
          senderName: 'Ashok Kumar',
          text: 'Thank you for the transparent clarification! System is very clean and fast.',
          timestamp: pastHours(4),
        },
      ],
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'NOTIF-01',
      userId: 'all',
      title: 'Platform Compliance & Ethics Notice',
      message: 'HELP150 strictly adheres to community peer assistance standards. Guaranteed returns or income promises are prohibited.',
      type: 'info',
      isRead: false,
      createdAt: pastHours(24),
    },
    {
      id: 'NOTIF-02',
      userId: 'H150-784920',
      title: 'Help Request Matched #REQ-150-003',
      message: 'You have been paired with Rahul Verma for ₹150 community help. 12-hour timer has started.',
      type: 'success',
      isRead: false,
      createdAt: pastHours(3),
      linkTab: 'help',
    },
    {
      id: 'NOTIF-03',
      userId: 'H150-784920',
      title: 'Withdrawal Completed ₹200',
      message: 'Your payout of ₹190 (net) has been credited to your SBI Account.',
      type: 'success',
      isRead: true,
      createdAt: pastHours(8),
      linkTab: 'withdrawal',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'AUD-001',
      actorId: 'H150-COMP01',
      actorName: 'Vikram Mehta (Compliance)',
      actorRole: 'compliance_officer',
      action: 'APPROVE_KYC',
      targetEntity: 'KYC',
      targetId: 'KYC-784920',
      details: 'Approved KYC documents for user Ashok Kumar (H150-784920)',
      ipAddress: '103.21.144.12',
      timestamp: pastHours(65),
    },
    {
      id: 'AUD-002',
      actorId: 'H150-ADMIN01',
      actorName: 'System Superadmin',
      actorRole: 'admin',
      action: 'APPROVE_WITHDRAWAL',
      targetEntity: 'Withdrawal',
      targetId: 'WTH-200-001',
      details: 'Approved ₹200 payout to SBI Account XXXXXX5910',
      ipAddress: '103.21.144.10',
      timestamp: pastHours(8),
    },
    {
      id: 'AUD-003',
      actorId: 'H150-ADMIN01',
      actorName: 'System Superadmin',
      actorRole: 'admin',
      action: 'UPDATE_SETTINGS',
      targetEntity: 'Settings',
      targetId: 'WebsiteSettings',
      details: 'Confirmed 12-Hour timer and ₹200 minimum withdrawal multiplier',
      ipAddress: '103.21.144.10',
      timestamp: pastHours(50),
    },
  ];

  const loginSessions: LoginSession[] = [
    {
      id: 'SES-01',
      userId: 'H150-784920',
      device: 'Samsung Galaxy S23',
      browser: 'Chrome Mobile 122',
      ipAddress: '157.34.120.44',
      location: 'New Delhi, India',
      loginTime: pastHours(2),
      status: 'active',
    },
    {
      id: 'SES-02',
      userId: 'H150-ADMIN01',
      device: 'Linux Workstation',
      browser: 'Google Chrome 124',
      ipAddress: '103.21.144.10',
      location: 'Mumbai, India',
      loginTime: pastHours(1),
      status: 'active',
    },
  ];

  const fraudAlerts: FraudAlert[] = [
    {
      id: 'FRD-101',
      userId: 'H150-338291',
      userName: 'Manoj Tiwari',
      type: 'duplicate_ip',
      severity: 'low',
      details: 'Shared subnet detected with H150-610293. Flagged for review.',
      status: 'investigating',
      createdAt: pastHours(10),
    },
  ];

  const helpCycles: UserHelpCycle[] = [
    {
      id: 'CYC-H150-784920-1',
      userId: 'H150-784920',
      cycleNumber: 1,
      status: 'provide_verification',
      verificationLink: {
        requestId: 'LNK-50-784901',
        amount: 50,
        title: 'Provide Verification Link (₹50)',
        status: 'pending',
        matchedWithUserId: 'H150-918234',
        matchedWithUserName: 'Priya Sharma',
        matchedWithUpi: 'priyasharma@icici',
        matchedWithMobile: '9876501234',
        matchedWithEmail: 'priya.sharma@example.com',
      },
      secondLink: {
        requestId: 'LNK-100-784902',
        amount: 100,
        title: 'Second Link (₹100)',
        status: 'pending',
        matchedWithUserId: 'H150-ADMIN01',
        matchedWithUserName: 'Community Treasury Pool',
        matchedWithUpi: 'help150.treasury@icici',
        matchedWithMobile: '9800000001',
        matchedWithEmail: 'admin@help150.org',
      },
      timerDurationHours: 12,
      createdAt: pastHours(2),
    },
    {
      id: 'CYC-H150-918234-1',
      userId: 'H150-918234',
      cycleNumber: 1,
      status: 'maturation_timer',
      verificationLink: {
        requestId: 'LNK-50-918201',
        amount: 50,
        title: 'Provide Verification Link (₹50)',
        status: 'completed',
        matchedWithUserId: 'H150-ADMIN01',
        matchedWithUserName: 'Community Treasury Pool',
        matchedWithUpi: 'help150.treasury@icici',
        matchedWithMobile: '9800000001',
        proofReference: 'UTR-50918201',
        completedAt: pastHours(6),
      },
      secondLink: {
        requestId: 'LNK-100-918202',
        amount: 100,
        title: 'Second Link (₹100)',
        status: 'completed',
        matchedWithUserId: 'H150-784920',
        matchedWithUserName: 'Ashok Kumar',
        matchedWithUpi: 'ashok.kumar@okaxis',
        matchedWithMobile: '9876543210',
        proofReference: 'UTR-100918202',
        completedAt: pastHours(5.5),
      },
      timerStartTime: Date.now() - 5.5 * 3600000,
      timerExpiryTime: futureHours(6.5), // 6.5h remaining of 12h
      timerDurationHours: 12,
      createdAt: pastHours(7),
    },
  ];

  return {
    users,
    kycRecords,
    wallets,
    transactions,
    helpRequests,
    helpCycles,
    referralLevels: DEFAULT_REFERRAL_LEVELS,
    withdrawals,
    supportTickets,
    notifications,
    auditLogs,
    loginSessions,
    fraudAlerts,
    settings: DEFAULT_SETTINGS,
  };
}

class DatabaseManager {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadFromStorage();
    // Periodically enforce 24-hour unpaid block & auto-delete penalties and promotion timer
    setInterval(() => {
      this.checkAndEnforcePenalties();
      this.checkPromotionTimer();
    }, 5000);
  }

  public checkPromotionTimer(): void {
    const now = Date.now();
    if (this.state.settings && this.state.settings.linkSystemEnabled === false && this.state.settings.promotionEndDate) {
      const endTime = new Date(this.state.settings.promotionEndDate).getTime();
      if (now >= endTime) {
        this.state.settings.linkSystemEnabled = true;
        this.state.settings.promotionMode = false;
        this.state.settings.autoDispatchMode = true;
        this.state.settings.autoDispatchOnRegistration = true;
        this.saveToStorage(this.state);
        this.notifySubscribers();
      }
    }
  }

  private loadFromStorage(): DatabaseState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        // Ensure all required collections exist
        if (parsed && parsed.users && parsed.wallets && parsed.transactions) {
          const loadedState: DatabaseState = {
            ...getSeedDatabase(),
            ...parsed,
          };
          if (!loadedState.helpCycles || !Array.isArray(loadedState.helpCycles)) {
            loadedState.helpCycles = getSeedDatabase().helpCycles;
          }
          if (loadedState.settings && loadedState.settings.linkSystemEnabled === false) {
            loadedState.helpCycles = [];
            loadedState.helpRequests = [];
          }
          // Ensure all users have valid passwords, hashes, and designate pre-existing IDs (before H150-304071) as Admin IDs
          if (Array.isArray(loadedState.users)) {
            loadedState.users.forEach((u) => {
              const seedIds = ['H150-ADMIN01', 'H150-COMP01', 'H150-784920', 'H150-918234', 'H150-449102', 'H150-610293', 'H150-338291'];
              const numMatch = u.id.match(/(\d+)/);
              const num = numMatch ? parseInt(numMatch[1], 10) : 0;
              
              if (u.id === 'H150-ADMIN01' || u.id === 'H150-784920') {
                u.isAdminAccount = true;
                u.accountType = 'admin_pool';
                u.role = 'admin';
                if (u.id === 'H150-ADMIN01') {
                  u.bankName = 'State Bank of India';
                  u.accountHolderName = 'Yenkanna Badawat';
                  u.accountNumber = '32103707641';
                  u.ifscCode = 'SBIN0003078';
                  u.upiId = '7066463676@naviaxis';
                  u.fullName = 'Yenkanna Badawat';
                  u.mobile = '7066463676';
                }
              } else {
                u.isAdminAccount = false;
                u.accountType = 'registered_user';
                u.role = 'user';
              }
              if (!u.password) {
                if (u.passwordHash) {
                  try {
                    u.password = atob(u.passwordHash);
                  } catch {
                    u.password = u.role === 'admin' ? 'Admin@150' : 'Pass@123';
                  }
                } else {
                  u.password = u.role === 'admin' ? 'Admin@150' : 'Pass@123';
                }
              }
              if (!u.passwordHash && u.password) {
                u.passwordHash = btoa(u.password);
              }
            });
          }
          // Automatically migrate referral levels if they still reflect older configuration
          if (
            !loadedState.referralLevels ||
            loadedState.referralLevels.length === 0 ||
            loadedState.referralLevels[0]?.percentage === 10
          ) {
            loadedState.referralLevels = DEFAULT_REFERRAL_LEVELS;
          }
          // Ensure settings has all latest keys including linkSystemEnabled & promotionMode
          loadedState.settings = {
            ...DEFAULT_SETTINGS,
            ...(loadedState.settings || {}),
          };
          return loadedState;
        }
      }
    } catch (e) {
      console.warn('Could not read from local storage, initializing default db state', e);
    }
    const initial = getSeedDatabase();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(state: DatabaseState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }

  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifySubscribers(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Database subscriber error:', err);
      }
    });
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public updateState(updater: (draft: DatabaseState) => void): DatabaseState {
    updater(this.state);
    this.saveToStorage(this.state);
    this.notifySubscribers();
    return this.state;
  }

  public resetDatabase(): DatabaseState {
    this.state = getSeedDatabase();
    this.saveToStorage(this.state);
    this.notifySubscribers();
    return this.state;
  }

  public resetToSeed(): DatabaseState {
    return this.resetDatabase();
  }

  public exportBackup(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public restoreBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.users && parsed.wallets && parsed.transactions) {
        this.state = parsed;
        this.saveToStorage(this.state);
        return true;
      }
    } catch (e) {
      console.error('Invalid backup JSON', e);
    }
    return false;
  }

  // ---------------- PLAN CYCLE ENGINE (₹50 Verification + ₹100 Second ➔ 12h Timer ➔ ₹200 Receive) ----------------
  public checkAndEnforcePenalties(): void {
    const now = Date.now();
    let hasChanges = false;
    const usersToDelete: string[] = [];

    for (const user of this.state.users) {
      if (user.role === 'admin') continue;

      // 1. Check if user is blocked and has passed the 24-hour auto-deletion mark
      if (user.status === 'blocked' && user.autoDeleteAt) {
        const deleteTime = new Date(user.autoDeleteAt).getTime();
        if (now >= deleteTime) {
          usersToDelete.push(user.id);
          continue;
        }
      }

      // 2. Check if user has an unpaid ₹50 link past the 24-hour deadline
      // CRITICAL: If linkSystemEnabled is turned off (Promotion Mode), NEVER penalize or block users
      if (this.state.settings.linkSystemEnabled === false) {
        continue;
      }

      const userCycles = this.state.helpCycles?.filter((c) => c.userId === user.id) || [];
      const activeCycle = userCycles.find((c) => c.status !== 'completed');
      if (activeCycle && activeCycle.status === 'provide_verification' && activeCycle.verificationLink.status === 'pending') {
        const deadline = activeCycle.verificationLink.deadlineTime || (new Date(activeCycle.createdAt).getTime() + 24 * 3600000);
        if (now > deadline) {
          if (user.status !== 'blocked') {
            user.status = 'blocked';
            user.blockedAt = new Date().toISOString();
            user.autoDeleteAt = new Date(now + 24 * 3600000).toISOString();
            user.blockedReason = 'Failed to pay ₹50 Provide Help link within 24 hours. Account will be automatically deleted in 24 hours.';
            hasChanges = true;

            this.state.notifications.unshift({
              id: `NOTIF-BLK-${Date.now().toString().slice(-6)}`,
              userId: user.id,
              title: 'Account ID Blocked (Unpaid ₹50 Link)',
              message: 'Your account has been blocked because the ₹50 Provide Help link was not paid within 24 hours. Your ID will be automatically deleted in 24 hours.',
              type: 'alert',
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Permanently auto-delete expired blocked users
    if (usersToDelete.length > 0) {
      this.state.users = this.state.users.filter((u) => !usersToDelete.includes(u.id));
      usersToDelete.forEach((delId) => {
        delete this.state.wallets[delId];
        if (this.state.helpCycles) {
          this.state.helpCycles = this.state.helpCycles.filter((c) => c.userId !== delId);
        }
        if (this.state.helpRequests) {
          this.state.helpRequests = this.state.helpRequests.filter((r) => r.userId !== delId);
        }
      });
      hasChanges = true;
    }

    if (hasChanges) {
      this.saveToStorage(this.state);
      this.notifySubscribers();
    }
  }

  public getUserHelpCycle(userId: string): UserHelpCycle {
    if (!this.state.helpCycles) {
      this.state.helpCycles = [];
    }

    // Check penalty states
    this.checkAndEnforcePenalties();

    // Find latest active cycle or most recent cycle
    let userCycles = this.state.helpCycles.filter((c) => c.userId === userId);
    let activeCycle = userCycles.find((c) => c.status !== 'completed');

    if (!activeCycle) {
      const nextCycleNum = userCycles.length > 0 ? Math.max(...userCycles.map((c) => c.cycleNumber)) + 1 : 1;
      activeCycle = this.createNewCycle(userId, nextCycleNum);
      this.state.helpCycles.unshift(activeCycle);
      this.saveToStorage(this.state);
      this.notifySubscribers();
    }

    // Auto-advance if in timer mode and 12 hours elapsed
    if (activeCycle.status === 'maturation_timer' && activeCycle.timerExpiryTime && Date.now() >= activeCycle.timerExpiryTime) {
      this.advanceTimerToReceiveHelp(activeCycle);
    }

    return activeCycle;
  }

  public getAllUserHelpCycles(userId: string): UserHelpCycle[] {
    if (!this.state.helpCycles) this.state.helpCycles = [];
    return this.state.helpCycles
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.cycleNumber - a.cycleNumber);
  }

  public createNewCycle(userId: string, cycleNumber: number): UserHelpCycle {
    const user = this.state.users.find((u) => u.id === userId);
    
    // User Directive: "अभी तक जितना id है वो सब एडमिन का है एडमिन id सिर्फ रिसीव हेल्प लेने के लिए जाएगी रिसीवर ज्यादा हो तो"
    // When a member provides help (₹50 Verification + ₹100 Second Link), the Admin ID (Central Treasury)
    // is the primary receiver designated to receive the help.
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

    const now = new Date().toISOString();
    const cycleId = `CYC-${userId.replace(/[^a-zA-Z0-9]/g, '')}-${cycleNumber}-${Date.now().toString().slice(-4)}`;

    const isLinkEnabled = this.state.settings.linkSystemEnabled !== false;

    return {
      id: cycleId,
      userId,
      cycleNumber,
      status: 'provide_verification',
      verificationLink: {
        requestId: `LNK-50-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 50,
        title: isLinkEnabled ? 'Provide Verification Link (₹50)' : 'Provide Verification Link (₹50 - Paused by Admin)',
        status: 'pending',
        matchedWithUserId: adminReceiver.id,
        matchedWithUserName: adminReceiver.fullName,
        matchedWithUpi: adminReceiver.upi,
        matchedWithMobile: adminReceiver.mobile,
        matchedWithEmail: adminReceiver.email,
        matchedWithBankDetails: adminReceiver.bankDetails,
        deadlineTime: isLinkEnabled ? Date.now() + 24 * 3600000 : undefined, // No deadline when links are paused
      },
      secondLink: {
        requestId: `LNK-100-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: 100,
        title: 'Second Link (₹100)',
        status: 'pending',
        matchedWithUserId: adminReceiver.id,
        matchedWithUserName: 'Yenkanna Badawat (Admin Treasury)',
        matchedWithUpi: adminReceiver.upi,
        matchedWithMobile: adminReceiver.mobile,
        matchedWithEmail: adminReceiver.email,
        matchedWithBankDetails: adminReceiver.bankDetails,
      },
      timerDurationHours: 12,
      createdAt: now,
    };
  }

  public submitCycleProvideLink(
    userId: string,
    linkType: 'verification' | 'second',
    proofRef: string,
    slipUrl?: string
  ): UserHelpCycle {
    const cycle = this.getUserHelpCycle(userId);
    const now = new Date().toISOString();

    if (linkType === 'verification') {
      cycle.verificationLink.status = 'submitted';
      cycle.verificationLink.proofReference = proofRef || `UTR-${Date.now().toString().slice(-8)}`;
      cycle.verificationLink.slipUrl = slipUrl || sampleSlipUrl(50, proofRef);
      cycle.verificationLink.submittedAt = now;
      delete cycle.verificationLink.rejectionReason;
      delete cycle.verificationLink.rejectedAt;
      // Note: cycle.status remains 'provide_verification' until receiver accepts or rejects!
      // This ensures the Provide Help link box does not disappear prematurely.

      this.state.notifications.unshift({
        id: `NOTIF-PROV-${Date.now().toString().slice(-6)}`,
        userId,
        title: `Step 1 (₹50) Payment Slip Submitted`,
        message: `Slip & UTR ${proofRef} submitted. Verification pending by receiver. The link box will remain until confirmed.`,
        type: 'info',
        isRead: false,
        createdAt: now,
      });
    } else if (linkType === 'second') {
      cycle.secondLink.status = 'submitted';
      cycle.secondLink.proofReference = proofRef || `UTR-${Date.now().toString().slice(-8)}`;
      cycle.secondLink.slipUrl = slipUrl || sampleSlipUrl(100, proofRef);
      cycle.secondLink.submittedAt = now;
      delete cycle.secondLink.rejectionReason;
      delete cycle.secondLink.rejectedAt;
      // Note: cycle.status remains 'provide_second' until receiver accepts or rejects!
      // This ensures the Provide Help link box does not disappear prematurely.

      this.state.notifications.unshift({
        id: `NOTIF-PROV-${Date.now().toString().slice(-6)}`,
        userId,
        title: `Step 2 (₹100) Payment Slip Submitted`,
        message: `Slip & UTR ${proofRef} submitted. Verification pending by receiver. The link box will remain until confirmed.`,
        type: 'info',
        isRead: false,
        createdAt: now,
      });
    }

    this.saveToStorage(this.state);
    this.notifySubscribers();
    return cycle;
  }

  public getOrCreateWallet(userId: string): Wallet {
    let wallet = this.state.wallets[userId];
    const now = new Date().toISOString();
    if (!wallet) {
      wallet = {
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        totalHelpedGiven: 0,
        totalHelpedReceived: 0,
        totalReferralRewards: 0,
        totalWithdrawn: 0,
        lastUpdated: now,
      };
      this.state.wallets[userId] = wallet;
    }
    return wallet;
  }

  public getUserIncomeStats(userId: string) {
    const wallet = this.getOrCreateWallet(userId);
    const completedCycles = (this.state.helpCycles || []).filter(
      (c) => c.userId === userId && c.status === 'completed'
    );
    const totalCycleReceived = completedCycles.length * 200;
    const totalCycleGiven = completedCycles.length * 150;
    
    // Ensure wallet is at least the sum of all completed cycles
    if (wallet.totalHelpedReceived < totalCycleReceived) {
      wallet.totalHelpedReceived = totalCycleReceived;
    }
    if (wallet.totalHelpedGiven < totalCycleGiven) {
      wallet.totalHelpedGiven = totalCycleGiven;
    }

    const totalHelpedReceived = wallet.totalHelpedReceived;
    const totalHelpedGiven = wallet.totalHelpedGiven;
    const netHelpingProfit = Math.max(0, totalHelpedReceived - totalHelpedGiven);
    const totalIncome = totalHelpedReceived + (wallet.totalReferralRewards || 0);

    return {
      totalHelpedReceived,
      totalHelpedGiven,
      netHelpingProfit,
      totalIncome,
      completedCyclesCount: completedCycles.length,
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      totalReferralRewards: wallet.totalReferralRewards || 0,
    };
  }

  public acceptCycleProvideLink(
    userId: string,
    linkType: 'verification' | 'second'
  ): UserHelpCycle {
    const cycle = this.getUserHelpCycle(userId);
    const now = new Date().toISOString();
    const wallet = this.getOrCreateWallet(userId);

    if (linkType === 'verification') {
      cycle.verificationLink.status = 'completed';
      cycle.verificationLink.completedAt = now;
      cycle.status = 'provide_second';

      // Update provider wallet total help given
      wallet.totalHelpedGiven += 50;
      wallet.lastUpdated = now;

      // Credit Receiver's Wallet & Total Received
      const receiverId = cycle.verificationLink.matchedWithUserId;
      if (receiverId && receiverId !== 'H150-ADMIN01') {
        const receiverWallet = this.getOrCreateWallet(receiverId);
        receiverWallet.availableBalance += 50;
        receiverWallet.totalHelpedReceived += 50;
        receiverWallet.lastUpdated = now;

        this.state.transactions.unshift({
          id: `TXN-REC-${Date.now().toString().slice(-6)}`,
          userId: receiverId,
          type: 'help_received',
          amount: 50,
          balanceAfter: receiverWallet.availableBalance,
          status: 'completed',
          referenceId: cycle.verificationLink.requestId,
          remarks: `₹50 Help Received accepted from ${this.state.users.find((u) => u.id === userId)?.fullName || userId}`,
          senderUserId: userId,
          receiverUserId: receiverId,
          senderName: this.state.users.find((u) => u.id === userId)?.fullName || 'Member',
          receiverName: this.state.users.find((u) => u.id === receiverId)?.fullName || 'Receiver',
          createdAt: now,
        });
      }

      this.state.notifications.unshift({
        id: `NOTIF-ACC-${Date.now().toString().slice(-6)}`,
        userId,
        title: `Step 1 (₹50) Accepted by Receiver!`,
        message: `Receiver has verified and accepted your ₹50 payment. Step 2 (₹100) Provide Help link is now ready.`,
        type: 'success',
        isRead: false,
        createdAt: now,
      });
    } else if (linkType === 'second') {
      cycle.secondLink.status = 'completed';
      cycle.secondLink.completedAt = now;

      // Update provider wallet total help given
      wallet.totalHelpedGiven += 100;
      wallet.lastUpdated = now;

      // Credit Receiver's Wallet & Total Received
      const receiverId = cycle.secondLink.matchedWithUserId;
      if (receiverId && receiverId !== 'H150-ADMIN01') {
        const receiverWallet = this.getOrCreateWallet(receiverId);
        receiverWallet.availableBalance += 100;
        receiverWallet.totalHelpedReceived += 100;
        receiverWallet.lastUpdated = now;

        this.state.transactions.unshift({
          id: `TXN-REC-${Date.now().toString().slice(-6)}`,
          userId: receiverId,
          type: 'help_received',
          amount: 100,
          balanceAfter: receiverWallet.availableBalance,
          status: 'completed',
          referenceId: cycle.secondLink.requestId,
          remarks: `₹100 Help Received accepted from ${this.state.users.find((u) => u.id === userId)?.fullName || userId}`,
          senderUserId: userId,
          receiverUserId: receiverId,
          senderName: this.state.users.find((u) => u.id === userId)?.fullName || 'Member',
          receiverName: this.state.users.find((u) => u.id === receiverId)?.fullName || 'Receiver',
          createdAt: now,
        });
      }

      // Check if BOTH links are completed -> Start 12-Hour Timer!
      cycle.status = 'maturation_timer';
      cycle.timerStartTime = Date.now();
      cycle.timerExpiryTime = Date.now() + 12 * 3600000; // 12 hours exactly

      this.state.notifications.unshift({
        id: `NOTIF-CYC-${Date.now().toString().slice(-6)}`,
        userId,
        title: `Cycle #${cycle.cycleNumber}: 12-Hour Maturation Timer Started!`,
        message: 'Verification Link ₹50 and Second Link ₹100 are completed. Upon timer completion, your ₹200 Receive Help link will be automatically generated.',
        type: 'success',
        isRead: false,
        createdAt: now,
      });
    }

    this.saveToStorage(this.state);
    this.notifySubscribers();
    return cycle;
  }

  public rejectCycleProvideLink(
    userId: string,
    linkType: 'verification' | 'second',
    reason: string
  ): UserHelpCycle {
    const cycle = this.getUserHelpCycle(userId);
    const now = new Date().toISOString();

    const cleanReason = reason.trim() || 'Payment not credited to receiver account';

    if (linkType === 'verification') {
      cycle.verificationLink.status = 'rejected';
      cycle.verificationLink.rejectionReason = cleanReason;
      cycle.verificationLink.rejectedAt = now;

      this.state.notifications.unshift({
        id: `NOTIF-REJ-${Date.now().toString().slice(-6)}`,
        userId,
        title: `Step 1 (₹50) Payment Rejected by Receiver`,
        message: `Reason: ${cleanReason}. Please re-check and upload valid payment slip.`,
        type: 'alert',
        isRead: false,
        createdAt: now,
      });
    } else if (linkType === 'second') {
      cycle.secondLink.status = 'rejected';
      cycle.secondLink.rejectionReason = cleanReason;
      cycle.secondLink.rejectedAt = now;

      this.state.notifications.unshift({
        id: `NOTIF-REJ-${Date.now().toString().slice(-6)}`,
        userId,
        title: `Step 2 (₹100) Payment Rejected by Receiver`,
        message: `Reason: ${cleanReason}. Please re-check and upload valid payment slip.`,
        type: 'alert',
        isRead: false,
        createdAt: now,
      });
    }

    this.saveToStorage(this.state);
    this.notifySubscribers();
    return cycle;
  }

  public fastForwardCycleTimer(userId: string): UserHelpCycle {
    const cycle = this.getUserHelpCycle(userId);
    if (cycle.status === 'maturation_timer') {
      cycle.timerExpiryTime = Date.now() - 1000; // expired
      this.advanceTimerToReceiveHelp(cycle);
      this.saveToStorage(this.state);
      this.notifySubscribers();
    }
    return cycle;
  }

  public fastForwardReceiveTimer(userId: string): UserHelpCycle {
    const cycle = this.getUserHelpCycle(userId);
    if (cycle.status === 'receive_help' && cycle.receiveLink) {
      cycle.receiveLink.deadlineTime = Date.now() - 1000; // expired
      this.saveToStorage(this.state);
      this.notifySubscribers();
    }
    return cycle;
  }

  private advanceTimerToReceiveHelp(cycle: UserHelpCycle): void {
    const now = new Date().toISOString();
    // User Directive: "अब कोई ऑटोमेटिक यूजर id जनरेट नहीं होना चाहिए"
    // No automatic mock user IDs (e.g. H150-610492) are generated or added to database.
    // User Directive: "एडमिन id सिर्फ रिसीव हेल्प लेने के लिए जाएगी"
    // Admin ID only receives help, so the ₹200 incoming assistance is provided by the Community Peer Pool.
    const utrSample = `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    cycle.status = 'receive_help';
    cycle.receiveLink = {
      requestId: `REC-200-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: 200,
      title: 'Receive Help Link (₹200)',
      status: 'submitted', // Incoming peer already attached slip for user to review and confirm
      matchedWithUserId: 'COMMUNITY-PEER',
      matchedWithUserName: 'Community Peer Member',
      matchedWithMobile: '9876500000',
      matchedWithEmail: 'peer.help@help150.org',
      matchedWithUpi: 'communitypeer@okaxis',
      proofReference: utrSample,
      slipUrl: sampleSlipUrl(200, utrSample, 'Community Peer Member'),
      submittedAt: now,
      deadlineTime: Date.now() + 24 * 3600000,
    };

    this.state.notifications.unshift({
      id: `NOTIF-REC-${Date.now().toString().slice(-6)}`,
      userId: cycle.userId,
      title: `₹200 Receive Help Link Assigned! (Cycle #${cycle.cycleNumber})`,
      message: `A Community Peer Member has sent ₹200 peer assistance. Please review payment proof and confirm receipt.`,
      type: 'success',
      isRead: false,
      createdAt: now,
    });
  }

  public confirmCycleReceiveLink(userId: string): { completedCycle: UserHelpCycle; newCycle: UserHelpCycle } {
    const cycle = this.getUserHelpCycle(userId);
    const now = new Date().toISOString();

    if (cycle.receiveLink) {
      cycle.receiveLink.status = 'completed';
      cycle.receiveLink.completedAt = now;
    }

    cycle.status = 'completed';
    cycle.completedAt = now;

    // Credit ₹200 to User Wallet & Total Received
    const wallet = this.getOrCreateWallet(userId);
    wallet.availableBalance += 200;
    wallet.totalHelpedReceived += 200;
    wallet.lastUpdated = now;

    // Log Transaction
    this.state.transactions.unshift({
      id: `TXN-CYC-${Date.now().toString().slice(-6)}`,
      userId,
      type: 'help_received',
      amount: 200,
      balanceAfter: wallet.availableBalance,
      status: 'completed',
      referenceId: cycle.receiveLink?.requestId || cycle.id,
      remarks: `₹200 Help Received for Cycle #${cycle.cycleNumber} (Net Profit ₹50)`,
      senderUserId: cycle.receiveLink?.matchedWithUserId || 'H150-COMMUNITY',
      receiverUserId: userId,
      senderName: cycle.receiveLink?.matchedWithUserName || 'Peer Member',
      receiverName: this.state.users.find((u) => u.id === userId)?.fullName || 'User',
      createdAt: now,
    });

    // Automatically create next cycle in loop: Continuous Revolving Cycles
    const nextCycleNum = cycle.cycleNumber + 1;
    const nextCycle = this.createNewCycle(userId, nextCycleNum);
    this.state.helpCycles.unshift(nextCycle);

    this.state.notifications.unshift({
      id: `NOTIF-LOOP-${Date.now().toString().slice(-6)}`,
      userId,
      title: `Congratulations! Cycle #${cycle.cycleNumber} Completed ➔ Cycle #${nextCycleNum} Started!`,
      message: `₹200 has been credited to your wallet (Net gain: +₹50). New Cycle #${nextCycleNum} is now active.`,
      type: 'success',
      isRead: false,
      createdAt: now,
    });

    this.saveToStorage(this.state);
    this.notifySubscribers();

    return { completedCycle: cycle, newCycle: nextCycle };
  }

  public rejectCycleReceiveLink(userId: string, reason: string): { cycle: UserHelpCycle } {
    const cycle = this.getUserHelpCycle(userId);
    const now = new Date().toISOString();

    if (cycle.receiveLink) {
      cycle.receiveLink.status = 'rejected';
      cycle.receiveLink.rejectionReason = reason;
      cycle.receiveLink.rejectedAt = now;
    }

    this.state.notifications.unshift({
      id: `NOTIF-REJ-${Date.now().toString().slice(-6)}`,
      userId,
      title: `Payment Proof Rejected (#${cycle.receiveLink?.requestId || cycle.id})`,
      message: `You marked the incoming ₹200 assistance payment proof as rejected. Reason: ${reason}. Support desk has been notified.`,
      type: 'warning',
      isRead: false,
      createdAt: now,
    });

    this.saveToStorage(this.state);
    this.notifySubscribers();

    return { cycle };
  }

  public toggleLinkSystem(enabled: boolean, promotionDays: number = 4): WebsiteSettings {
    const now = new Date();
    this.updateState((draft) => {
      draft.settings.linkSystemEnabled = enabled;
      draft.settings.promotionMode = !enabled;
      draft.settings.autoDispatchMode = enabled;
      draft.settings.autoDispatchOnRegistration = enabled;
      if (!enabled) {
        draft.settings.promotionDaysTotal = promotionDays;
        draft.settings.promotionStartDate = now.toISOString();
        draft.settings.promotionEndDate = new Date(now.getTime() + promotionDays * 24 * 3600000).toISOString();
        // Clear all active help cycles and requests when links are paused/stopped ("और जो लिंक गए है वो भी हटा दो")
        draft.helpCycles = [];
        draft.helpRequests = [];
      } else {
        // Set fresh 24-hour countdown when links are resumed
        if (draft.helpCycles) {
          draft.helpCycles.forEach((c) => {
            if (c.status === 'provide_verification' && c.verificationLink?.status === 'pending' && !c.verificationLink.deadlineTime) {
              c.verificationLink.deadlineTime = Date.now() + 24 * 3600000;
            }
          });
        }
      }
      draft.notifications.unshift({
        id: `NOTIF-LINK-${Date.now()}`,
        userId: 'all',
        title: enabled ? '🚀 ऑटोमैटिक हेल्पिंग लिंक्स शुरू!' : '⏸️ 4-दिन का प्री-लॉन्च प्रमोशन मोड सक्रिय',
        message: enabled
          ? 'एडमिन द्वारा हेल्पिंग लिंक सिस्टम को लाइव कर दिया गया है। अपने डैशबोर्ड में Provide Help और Receive Help लिंक्स चेक करें।'
          : `प्लेटफार्म पर ${promotionDays} दिन का विशेष प्रमोशन मोड चालू किया गया है। लिंक्स अस्थायी रूप से विराम पर हैं। सभी सदस्य अपनी टीम बनाएं!`,
        type: enabled ? 'success' : 'info',
        isRead: false,
        createdAt: now.toISOString(),
        linkTab: enabled ? 'help' : 'referral',
      });
    });

    // Sync to backend server
    fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkSystemEnabled: enabled,
        promotionMode: !enabled,
        autoDispatchMode: enabled,
        autoDispatchOnRegistration: enabled,
        promotionDaysTotal: promotionDays,
      }),
    }).catch((e) => console.warn('Server settings sync notice:', e));

    return this.getState().settings;
  }

  public updatePromotionConfig(data: Partial<WebsiteSettings>): WebsiteSettings {
    this.updateState((draft) => {
      draft.settings = {
        ...draft.settings,
        ...data,
      };
    });
    return this.getState().settings;
  }
}

function sampleSlipUrl(amount: number, utr: string, name = 'Peer Member') {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" fill="%23090d16"/><rect x="16" y="16" width="568" height="348" rx="16" fill="%23131b2e" stroke="%2338bdf8" stroke-width="2"/><text x="40" y="60" fill="%2338bdf8" font-family="sans-serif" font-size="20" font-weight="bold">BANK / UPI TRANSACTION RECEIPT</text><text x="40" y="90" fill="%2394a3b8" font-family="sans-serif" font-size="13">HELP150 Community Plan • Cycle Payment Proof</text><line x1="40" y1="110" x2="560" y2="110" stroke="%23334155" stroke-width="1"/><text x="40" y="150" fill="%23cbd5e1" font-family="sans-serif" font-size="16">Amount: <tspan fill="%234ade80" font-weight="bold">₹${amount}.00</tspan></text><text x="40" y="190" fill="%23cbd5e1" font-family="sans-serif" font-size="15">Status: <tspan fill="%2322c55e" font-weight="bold">COMPLETED / SUCCESS</tspan></text><text x="40" y="230" fill="%23cbd5e1" font-family="sans-serif" font-size="15">UTR / Ref: <tspan fill="%23f8fafc" font-weight="bold">${utr}</tspan></text><text x="40" y="270" fill="%23cbd5e1" font-family="sans-serif" font-size="15">Payer/Sender: <tspan fill="%2338bdf8">${name}</tspan></text><text x="40" y="320" fill="%2364748b" font-family="sans-serif" font-size="11">Verified on Peer Network • 12-Hour Maturation Cycle</text></svg>`;
}

export const db = new DatabaseManager();

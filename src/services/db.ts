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
} from '../types';

const STORAGE_KEY = 'HELP150_PLATFORM_DB_V1';

export interface DatabaseState {
  users: User[];
  kycRecords: KycRecord[];
  wallets: Record<string, Wallet>;
  transactions: Transaction[];
  helpRequests: HelpRequest[];
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
  timerDurationHours: 24,
  maxSlipFileSizeMb: 5,
  kycRequiredForWithdrawal: true,
  manualApprovalForHelp: true,
  legalDisclaimerEnabled: true,
  complianceNotice:
    'HELP150 is a peer community mutual-helping platform. All community transactions, eligibility rules, and referral incentives are subject to platform verification, statutory compliance, and applicable Indian laws. HELP150 strictly does NOT offer guaranteed income, investment schemes, or fixed returns.',
  systemNoticeText: 'HELP150: Community Mutual Help • Transparent System • 24-Hour Timer Verification',
  complianceDisclaimerText: 'HELP150 operates strictly as a peer-to-peer voluntary community mutual assistance platform. It is not an investment scheme, bank, or MLM. No returns are guaranteed.',
  adminUpiId: 'help150.treasury@icici',
  autoDispatchMode: false,
  autoDispatchOnRegistration: false,
  defaultLinkReceiverType: 'admin_treasury',
  maxLinksPerReceiver: 1,
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
      fullName: 'System Superadmin',
      mobile: '9800000001',
      email: 'admin@help150.org',
      role: 'admin',
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
    },
    {
      id: 'H150-COMP01',
      fullName: 'Vikram Mehta (Legal & Compliance)',
      mobile: '9800000002',
      email: 'compliance@help150.org',
      role: 'compliance_officer',
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
      role: 'user',
      sponsorId: 'H150-ADMIN01',
      status: 'active',
      kycStatus: 'verified',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(72),
      lastLoginAt: pastHours(2),
      deviceInfo: 'Samsung Galaxy S23 (Mobile Web)',
      ipAddress: '157.34.120.44',
      internalNotes: ['Active verified community leader', 'Verified KYC on 05 Sep'],
    },
    {
      id: 'H150-918234',
      fullName: 'Priya Sharma',
      mobile: '9876501234',
      email: 'priya.sharma@example.com',
      role: 'user',
      sponsorId: 'H150-784920',
      status: 'active',
      kycStatus: 'verified',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(48),
      lastLoginAt: pastHours(5),
      deviceInfo: 'iPhone 15 / Safari',
      ipAddress: '157.34.120.45',
      internalNotes: ['Referred by Ashok Kumar'],
    },
    {
      id: 'H150-449102',
      fullName: 'Rahul Verma',
      mobile: '9876505678',
      email: 'rahul.verma@example.com',
      role: 'user',
      sponsorId: 'H150-784920',
      status: 'active',
      kycStatus: 'pending',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(24),
      lastLoginAt: pastHours(6),
      deviceInfo: 'OnePlus 11 / Chrome',
      ipAddress: '157.34.120.46',
      internalNotes: ['KYC submitted, pending review'],
    },
    {
      id: 'H150-610293',
      fullName: 'Sunita Patel',
      mobile: '9876509988',
      email: 'sunita.patel@example.com',
      role: 'user',
      sponsorId: 'H150-918234',
      status: 'active',
      kycStatus: 'verified',
      isMobileVerified: true,
      isEmailVerified: false,
      joinedAt: pastHours(16),
      lastLoginAt: pastHours(4),
      deviceInfo: 'Redmi Note 12 / Chrome',
      ipAddress: '157.34.120.47',
      internalNotes: ['Level 2 referral under Ashok'],
    },
    {
      id: 'H150-338291',
      fullName: 'Manoj Tiwari',
      mobile: '9876503344',
      email: 'manoj.tiwari@example.com',
      role: 'user',
      sponsorId: 'H150-610293',
      status: 'active',
      kycStatus: 'not_submitted',
      isMobileVerified: true,
      isEmailVerified: true,
      joinedAt: pastHours(10),
      lastLoginAt: pastHours(1),
      deviceInfo: 'Vivo V27 / Chrome',
      ipAddress: '157.34.120.48',
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
      matchedWithUserId: 'H150-784920',
      matchedWithUserName: 'Ashok Kumar',
      matchedWithUpi: 'ashok.kumar@okaxis',
      matchedWithMobile: '9876543210',
      matchedWithEmail: 'ashuk2968@gmail.com',
      matchedWithBankDetails: {
        bankName: 'State Bank of India',
        accountNumber: 'XXXXXX5910',
        ifscCode: 'SBIN0001420',
      },
      senderAccepted: true,
      senderAcceptedAt: pastHours(2.5),
      receiverAccepted: true,
      receiverAcceptedAt: pastHours(2.2),
      proofReference: 'UTR-984021849102',
      proofNotes: 'Payment transferred via PhonePe to Ashok Kumar. Screenshot uploaded.',
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

  return {
    users,
    kycRecords,
    wallets,
    transactions,
    helpRequests,
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
          // Automatically migrate referral levels if they still reflect older configuration
          if (
            !loadedState.referralLevels ||
            loadedState.referralLevels.length === 0 ||
            loadedState.referralLevels[0]?.percentage === 10
          ) {
            loadedState.referralLevels = DEFAULT_REFERRAL_LEVELS;
          }
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

  public getState(): DatabaseState {
    return this.state;
  }

  public updateState(updater: (draft: DatabaseState) => void): DatabaseState {
    updater(this.state);
    this.saveToStorage(this.state);
    return this.state;
  }

  public resetDatabase(): DatabaseState {
    this.state = getSeedDatabase();
    this.saveToStorage(this.state);
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
}

export const db = new DatabaseManager();

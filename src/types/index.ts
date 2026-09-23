/**
 * HELP150 — Comprehensive TypeScript Type Definitions
 * Community Help • Transparent System • Secure Dashboard
 */

export type UserRole = 'user' | 'admin' | 'compliance_officer' | 'finance_admin';

export type AccountStatus = 'active' | 'suspended' | 'blocked';

export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: string; // e.g. "H150-849201"
  fullName: string;
  mobile: string;
  email: string;
  password?: string;
  passwordHash?: string;
  role: UserRole;
  sponsorId: string | null;
  status: AccountStatus;
  kycStatus: KycStatus;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  joinedAt: string;
  lastLoginAt: string;
  deviceInfo?: string;
  ipAddress?: string;
  internalNotes?: string[];
  avatarUrl?: string;
  
  // Account blocking & auto-deletion tracking
  blockedAt?: string;
  autoDeleteAt?: string;
  blockedReason?: string;
  
  // Admin pool identification
  isAdminAccount?: boolean;
  accountType?: 'admin_pool' | 'registered_user';
  
  // Banking & Payment Details (Direct in Profile)
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  gpayPhonePeNumber?: string;
}

export interface KycRecord {
  id: string;
  userId: string;
  fullNameAsPerId: string;
  aadhaarNumber?: string;
  panNumber?: string;
  documentType?: 'aadhaar' | 'pan' | 'voter_id' | 'bank_passbook' | 'none';
  upiId: string;
  bankName: string;
  accountHolderName?: string;
  accountNumber: string;
  ifscCode: string;
  gpayPhonePeNumber?: string;
  status: KycStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export interface Wallet {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalHelpedGiven: number;
  totalHelpedReceived: number;
  totalReferralRewards: number;
  totalWithdrawn: number;
  lastUpdated: string;
}

export type TransactionType =
  | 'help_given'
  | 'help_received'
  | 'referral_reward'
  | 'withdrawal'
  | 'admin_credit'
  | 'admin_debit'
  | 'platform_fee';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'rejected';

export interface Transaction {
  id: string; // e.g. "TXN-150-394821"
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  status: TransactionStatus;
  referenceId: string; // UTR or Match ID
  remarks: string;
  senderUserId?: string;
  receiverUserId?: string;
  senderName?: string;
  receiverName?: string;
  proofUrl?: string;
  createdAt: string;
}

export type HelpRequestType = 'give_help' | 'receive_help';

export type HelpRequestStatus =
  | 'REQUEST_CREATED'
  | 'PENDING'
  | 'ACCEPTED'
  | 'PAYMENT_PENDING'
  | 'SLIP_UPLOADED'
  | 'VERIFICATION_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'pending_match'
  | 'matched'
  | 'proof_submitted'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type TimerStatus = 'pending' | 'active' | 'running' | 'expired' | 'completed';

export interface HelpRequest {
  id: string; // e.g. "HP-78492011"
  userId: string;
  userName: string;
  userMobile: string;
  userEmail?: string;
  userUpi?: string;
  amount: number; // default 150
  type: HelpRequestType;
  status: HelpRequestStatus;
  
  // Matched counterparty details
  matchedWithUserId?: string;
  matchedWithUserName?: string;
  matchedWithUpi?: string;
  matchedWithMobile?: string;
  matchedWithEmail?: string;
  matchedWithBankDetails?: {
    bankName: string;
    accountHolderName?: string;
    accountNumber: string;
    ifscCode: string;
  };

  // Acceptance & Rejection state
  senderAccepted?: boolean;
  senderAcceptedAt?: string;
  receiverAccepted?: boolean;
  receiverAcceptedAt?: string;
  rejectedByUserId?: string;
  rejectionReason?: string;
  rejectedAt?: string;

  // Proof & Slip upload system
  proofReference?: string; // 12-digit UTR
  proofNotes?: string;
  proofSubmittedAt?: string;
  paymentSlipUrl?: string; // Base64 data or secure image URL
  paymentSlipFileName?: string;
  paymentSlipFileType?: string;
  paymentSlipFileSize?: number;
  paymentSlipUploadedAt?: string;

  // Admin & P2P verification status
  slipReviewStatus?: 'pending' | 'verified' | 'rejected' | 'reupload_requested';
  slipReviewNotes?: string;
  verificationRequestedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  adminApproved: boolean;
  adminNotes?: string;

  // Server-side 12-hour Timer
  timerStartTime?: number; // epoch ms
  timerExpiryTime?: number; // epoch ms (12 hours later)
  timerExpiresAt?: string;
  timerDurationHours?: number;
  matchedAt?: string;
  timerStatus: TimerStatus;
  createdAt: string;
  completedAt?: string;
}

export type CycleStepStatus = 'locked' | 'pending' | 'submitted' | 'completed' | 'rejected';

export interface CycleLinkDetails {
  requestId: string;
  amount: number; // 50, 100, or 200
  title: string;
  status: CycleStepStatus;
  matchedWithUserId: string;
  matchedWithUserName: string;
  matchedWithUpi: string;
  matchedWithMobile: string;
  matchedWithEmail?: string;
  providerUserId?: string;
  providerName?: string;
  providerMobile?: string;
  matchedWithBankDetails?: {
    bankName: string;
    accountHolderName?: string;
    accountNumber: string;
    ifscCode: string;
  };
  deadlineTime?: number; // 24-hour countdown deadline for ₹50 link
  proofReference?: string;
  slipUrl?: string;
  submittedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
}

export interface UserHelpCycle {
  id: string; // e.g. "CYC-H150-784920-1"
  userId: string;
  cycleNumber: number; // 1, 2, 3...
  status: 'provide_verification' | 'provide_second' | 'maturation_timer' | 'receive_help' | 'completed' | 'paused';
  verificationLink: CycleLinkDetails; // 50 Rs
  secondLink: CycleLinkDetails; // 100 Rs
  timerStartTime?: number;
  timerExpiryTime?: number; // 12 hours from completion
  timerDurationHours: number; // 12
  receiveLink?: CycleLinkDetails; // 200 Rs (Summary/Primary Link)
  receiveLinks?: CycleLinkDetails[]; // Tracked provider breakdown totaling exactly ₹200 (e.g. 100+50+50, 100+100, 50+50+50+50)
  receiveCombination?: '100+50+50' | '100+100' | '50+50+50+50' | 'custom_200';
  createdAt: string;
  completedAt?: string;
}

export interface ReferralLevelConfig {
  level: number; // 1 to 6
  name: string;
  percentage: number; // e.g. Level 1: 10%, Level 2: 5%
  fixedRewardAmount?: number;
  minDirectRequirement: number; // number of direct active members required
  qualifyingActivityRequirement: string;
  enabled: boolean;
}

export interface ReferralStat {
  level: number;
  memberCount: number;
  activeCount: number;
  earnedRewards: number;
  pendingRewards: number;
}

export interface ReferralMember {
  userId: string;
  fullName: string;
  mobile?: string;
  email?: string;
  joinedAt: string;
  status: AccountStatus;
  level: number;
  totalHelpGiven: number;
  qualifyingDone: boolean;
}

export type WithdrawalStatus =
  | 'requested'
  | 'verification'
  | 'admin_review'
  | 'approved'
  | 'payment_processing'
  | 'completed'
  | 'rejected';

export interface WithdrawalRequest {
  id: string; // e.g. "WTH-200-58291"
  userId: string;
  userName: string;
  amount: number; // multiple of 200
  processingFee: number;
  netPayable: number;
  payoutMethod: 'upi' | 'bank_transfer';
  payoutUpiId?: string;
  payoutBankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  kycVerified: boolean;
  status: WithdrawalStatus;
  adminRemarks?: string;
  transactionRef?: string;
  createdAt: string;
  processedAt?: string;
}

export interface SupportTicketMessage {
  id: string;
  sender: 'user' | 'admin' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'kyc' | 'help_request' | 'withdrawal' | 'referral' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string | 'all';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  isRead: boolean;
  createdAt: string;
  linkTab?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface LoginSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  loginTime: string;
  status: 'active' | 'revoked';
}

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  type: 'duplicate_mobile' | 'duplicate_ip' | 'rapid_withdrawal_attempts' | 'unusual_velocity' | 'suspicious_referral_loop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  status: 'unresolved' | 'investigating' | 'dismissed' | 'action_taken';
  createdAt: string;
}

export interface WebsiteSettings {
  helpAmountDefault: number;
  minWithdrawalAmount: number;
  withdrawalMultiple: number;
  withdrawalProcessingFeePercent: number;
  timerDurationHours: number;
  maxSlipFileSizeMb: number;
  kycRequiredForWithdrawal: boolean;
  manualApprovalForHelp: boolean;
  legalDisclaimerEnabled: boolean;
  complianceNotice: string;
  systemNoticeText: string;
  complianceDisclaimerText: string;
  adminUpiId: string;
  defaultDirectSponsorId?: string | null; // Default sponsor when new user registers directly without referral code
  autoDispatchMode?: boolean;
  autoDispatchOnRegistration?: boolean;
  defaultLinkReceiverType?: 'admin_treasury' | 'fifo_queue';
  maxLinksPerReceiver?: number;
  // Link System Master Control & 4-Day Promotion Mode
  linkSystemEnabled: boolean; // true = links ON & automatic, false = links OFF (promotion mode)
  promotionMode: boolean; // true = 4-day promotion running
  promotionDaysTotal: number; // default 7 (extended by 3 days)
  promotionStartDate: string; // ISO string
  promotionEndDate: string; // ISO string
  promotionExtended3DaysV2?: boolean;
  promotionEndedV1?: boolean;
  promotionNoticeTitle?: string;
  promotionNoticeText?: string;
  maintenanceMode: boolean;
  officialTelegramLink: string;
  officialWhatsappNumber: string;
  officialEmail: string;
  contactEmail: string;
  contactTelegram: string;
  contactWhatsapp: string;
  termsContent: string;
  privacyContent: string;
}

export interface DispatchedProvideHelpLink {
  id: string; // e.g. "LNK-50-784901" or "HP-150-784905"
  source: 'cycle_step1' | 'cycle_step2' | 'p2p_request';
  cycleId?: string;
  stepName: string; // 'Step 1: ₹50 Verification Link' | 'Step 2: ₹100 Second Link' | 'Direct Help (₹150)'
  stepTag: string; // '₹50' | '₹100' | '₹150'
  amount: number; // 50, 100, 150
  
  // Sender (who gives help)
  senderUserId: string;
  senderName: string;
  senderMobile: string;
  senderEmail?: string;
  senderUpi?: string;

  // Receiver (beneficiary who receives help)
  receiverUserId: string;
  receiverName: string;
  receiverMobile: string;
  receiverEmail?: string;
  receiverUpi: string;

  // Link status & proof
  status: 'pending' | 'submitted' | 'completed' | 'rejected';
  rawStatus: string;
  deadlineTime?: number;
  timerDurationHours?: number;
  proofReference?: string; // UTR
  slipUrl?: string;
  submittedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

/**
 * HELP150 — Master Admin Panel & Dashboard
 * Exact, pixel-faithful implementation of the requested Admin Dashboard UI:
 * - Top Navigation Bar with Date, Time, Notifications, Language, and Super Admin Profile
 * - Left Dark Navy 22-Menu Sidebar with active status & glowing bottom community card
 * - Welcome Back Hero Banner with globe/hands graphic & inspirational quote
 * - 7 Key Metrics Cards: Total Users, Active Users, Pending KYC, Pending Help Requests, Pending Withdrawals, Total Transactions, Support Tickets
 * - Middle Row:
 *     1. User Growth Overview (Interactive SVG Line Chart with dual series)
 *     2. Transaction Breakdown (Interactive Donut Chart with percentage breakdown)
 *     3. Quick Actions (8 vibrant colorful action buttons)
 * - Lower Section:
 *     1. Recent Users Table with status badges & avatars
 *     2. Recent Transactions Table with category icons, amounts & status
 * - Bottom Row:
 *     1. System Overview (Total Help, Withdrawals, Referral Income, Wallet Balance)
 *     2. Recent Notifications with live timestamps
 *     3. Community Promo Card with golden glow styling
 * - Interactive Modals & Sub-views for all 22 operations (User management, KYC desk, Help matching, Withdrawals, Settings, Report generator)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Crown,
  Calendar,
  Clock,
  Bell,
  Globe,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldCheck,
  HeartHandshake,
  Repeat,
  Wallet,
  ArrowDownCircle,
  Share2,
  Sliders,
  HelpCircle,
  FileSpreadsheet,
  ShieldAlert,
  FileText,
  KeyRound,
  Database,
  Building,
  Scale,
  Ban,
  LogOut,
  LogIn,
  TrendingUp,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Unlock,
  Key,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  Send,
  Lock,
  Headphones,
  Settings as SettingsIcon,
  QrCode,
  Activity,
  User as UserIcon,
  DollarSign,
  ArrowUpRight,
  Shield,
  Sparkles,
  Mail,
  MoreVertical,
  ArrowRightLeft,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { User, HelpRequest, WithdrawalRequest, KycRecord } from '../../types';
import { PaymentVerificationDesk } from './PaymentVerificationDesk';
import { MemberToMemberLinkBox } from './MemberToMemberLinkBox';
import { BrevoCampaignDesk } from './BrevoCampaignDesk';
import { FirebaseConnectionModal } from '../common/FirebaseConnectionModal';
import { MasterLinkSwitchCard } from './MasterLinkSwitchCard';
import { TransactionsDesk } from './TransactionsDesk';
import { WalletManagementDesk } from './WalletManagementDesk';
import { ReferralDesk } from './ReferralDesk';
import { NotificationsDesk } from './NotificationsDesk';
import { SupportTicketsDesk } from './SupportTicketsDesk';
import { ReportsDesk } from './ReportsDesk';
import { FraudDetectionDesk } from './FraudDetectionDesk';
import { AuditLogsDesk } from './AuditLogsDesk';
import { PlatformContentDesk } from './PlatformContentDesk';

export const AdminPanel: React.FC = () => {
  const { currentUser, refreshUserData, logout, setActiveTab, loginAs } = useAuth();
  const state = db.getState();
  const settings = state.settings;
  const [dbTick, setDbTick] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  // Ensure admin session never drops or closes unexpectedly
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      const adminUser = state.users.find((u) => u.id === 'H150-ADMIN01') || {
        id: 'H150-ADMIN01',
        fullName: 'Yenkanna Badawat',
        role: 'admin',
        status: 'active',
        mobile: '7066463676',
        email: 'admin@help150.org',
      };
      loginAs(adminUser.id);
    }
  }, [currentUser, loginAs, state.users]);

  // Active navigation state
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi'>('English');

  // Modals and interactive views
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Date and Time
  const [currentDateTime, setCurrentDateTime] = useState({
    date: '16 Aug 2025',
    time: '02:45 PM',
  });

  // User Management & Credentials State (सभी यूजर आईडी, पासवर्ड, ब्लॉक/अनब्लॉक कंट्रोल)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked' | 'direct_admin'>('all');
  const [editingUserPassword, setEditingUserPassword] = useState<{ userId: string; userName: string; currentPass: string; newPass: string } | null>(null);
  const [editingUserDetails, setEditingUserDetails] = useState<{
    userId: string;
    fullName: string;
    mobile: string;
    email: string;
    password: string;
    sponsorId: string;
    status: 'active' | 'blocked' | 'suspended';
    kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
    upiId: string;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    gpayPhonePeNumber: string;
  } | null>(null);
  const [showEditDetailsPassword, setShowEditDetailsPassword] = useState<boolean>(false);

  // Transfer User from Admin to Target User State (एडमिन से यूजर में आईडी डालने का ऑप्शन)
  const [transferTargetUser, setTransferTargetUser] = useState<User | null>(null);
  const [targetSponsorInput, setTargetSponsorInput] = useState<string>('');
  const [transferHelpLinks, setTransferHelpLinks] = useState<boolean>(true);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [selectedUserIdsForBulk, setSelectedUserIdsForBulk] = useState<string[]>([]);
  const [isBulkTransferModalOpen, setIsBulkTransferModalOpen] = useState<boolean>(false);

  // User Deletion & Transaction Clearing States
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [openClearTransactionsDirectly, setOpenClearTransactionsDirectly] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setCurrentDateTime({ date: dateStr, time: timeStr });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // System Settings state
  const [helpAmount, setHelpAmount] = useState(settings.helpAmountDefault || 150);
  const [minWithdrawal, setMinWithdrawal] = useState(settings.minWithdrawalAmount || 200);
  const [withdrawalMultiple, setWithdrawalMultiple] = useState(settings.withdrawalMultiple || 200);
  const [processingFee, setProcessingFee] = useState(settings.withdrawalProcessingFeePercent || 10);
  const [timerHours, setTimerHours] = useState(settings.timerDurationHours || 12);
  const [adminUpi, setAdminUpi] = useState(settings.adminUpiId || 'help150@okhdfcbank');
  const [defaultDirectSponsorId, setDefaultDirectSponsorId] = useState(settings.defaultDirectSponsorId || '');

  // Interactive Action Feedback
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mock / Real dynamic data calculations
  const totalUsersCount = state.users.length > 5 ? state.users.length : 1248;
  const activeUsersCount = state.users.filter((u) => u.status === 'active').length > 5 ? state.users.filter((u) => u.status === 'active').length : 1102;
  const pendingKycCount = state.kycRecords.filter((k) => k.status === 'pending').length > 0 ? state.kycRecords.filter((k) => k.status === 'pending').length : 46;
  const pendingHelpCount = state.helpRequests.filter((h) => h.status !== 'completed').length > 0 ? state.helpRequests.filter((h) => h.status !== 'completed').length : 32;
  const pendingWithdrawalCount = state.withdrawals.filter((w) => w.status === 'requested' || (w.status as string) === 'pending').length > 0 ? state.withdrawals.filter((w) => w.status === 'requested' || (w.status as string) === 'pending').length : 18;
  const totalTransactionsCount = state.transactions.length > 5 ? state.transactions.length : 4852;
  const supportTicketsCount = 24;

  // Direct to Admin users (सदस्य जो सीधे एडमिन में लगे हैं)
  const directAdminUsers = useMemo(() => {
    return state.users.filter(
      (u) =>
        u.id !== 'H150-ADMIN01' &&
        u.role !== 'admin' &&
        (!u.sponsorId || u.sponsorId === 'H150-ADMIN01' || u.sponsorId.toUpperCase() === 'DIRECT')
    );
  }, [state.users]);

  // All Dispatched Provide Help Links for Admin monitoring
  const dispatchedProvideHelpLinks = useMemo(() => {
    return db.getAllDispatchedProvideHelpLinks();
  }, [state.helpCycles, state.helpRequests, state.users]);

  // Sidebar Menu Items matching the 22 items in image
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hasArrow: false },
    {
      id: 'member_link_box',
      label: 'भेजे गए प्रोवाइड हेल्प लिंक्स',
      icon: Send,
      hasArrow: true,
      badge: dispatchedProvideHelpLinks.length > 0 ? `${dispatchedProvideHelpLinks.length} Links` : '0',
    },
    { id: 'email_campaigns', label: 'Brevo Email Campaigns', icon: Mail, hasArrow: true, badge: 'Brevo' },
    { id: 'users', label: 'Users', icon: Users, hasArrow: true },
    {
      id: 'transfer_admin_ids',
      label: 'एडमिन से यूजर में आईडी ट्रांसफर',
      icon: ArrowRightLeft,
      hasArrow: true,
      badge: directAdminUsers.length > 0 ? `${directAdminUsers.length}` : undefined,
    },
    { id: 'user_details', label: 'User Details', icon: UserCheck, hasArrow: true },
    { id: 'kyc', label: 'KYC', icon: ShieldCheck, hasArrow: true },
    { id: 'help_requests', label: 'Help Requests', icon: HeartHandshake, hasArrow: true },
    { id: 'transactions', label: 'Transactions', icon: Repeat, hasArrow: true },
    { id: 'wallet_management', label: 'Wallet Management', icon: Wallet, hasArrow: true },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownCircle, hasArrow: true },
    { id: 'referral_management', label: 'Referral Management', icon: Share2, hasArrow: true },
    { id: 'referral_settings', label: 'Referral Settings', icon: Sliders, hasArrow: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, hasArrow: true, badge: 3 },
    { id: 'support_tickets', label: 'Support Tickets', icon: Headphones, hasArrow: true },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet, hasArrow: true },
    { id: 'fraud_detection', label: 'Fraud Detection', icon: ShieldAlert, hasArrow: true },
    { id: 'audit_logs', label: 'Audit Logs', icon: FileText, hasArrow: true },
    { id: 'website_settings', label: 'Website Settings', icon: SettingsIcon, hasArrow: true },
    { id: 'terms_conditions', label: 'Terms & Conditions', icon: Scale, hasArrow: true },
    { id: 'privacy_policy', label: 'Privacy Policy', icon: Shield, hasArrow: true },
    { id: 'admin_roles', label: 'Admin Roles', icon: KeyRound, hasArrow: true },
    { id: 'security', label: 'Security', icon: Lock, hasArrow: true },
    { id: 'firebase_database', label: 'Firebase Database', icon: Database, hasArrow: true, badge: 'Live' },
    { id: 'backup', label: 'Backup', icon: Database, hasArrow: true },
    { id: 'logout', label: 'Logout', icon: LogOut, hasArrow: false },
  ];

  // Table Data: Recent Users (matching screenshot)
  const recentUsersData = [
    { id: 'HP10234', name: 'Amit Kumar', mobile: '+91 98765 43210', status: 'Active', joinedOn: '16 Aug 2025 10:24 AM', avatarBg: 'from-amber-500 to-orange-600' },
    { id: 'HP10233', name: 'Neha Sharma', mobile: '+91 87654 32109', status: 'Active', joinedOn: '16 Aug 2025 09:15 AM', avatarBg: 'from-blue-500 to-indigo-600' },
    { id: 'HP10232', name: 'Rohit Patel', mobile: '+91 96543 21098', status: 'Pending KYC', joinedOn: '15 Aug 2025 08:42 PM', avatarBg: 'from-purple-500 to-pink-600' },
    { id: 'HP10231', name: 'Pooja Singh', mobile: '+91 95432 10987', status: 'Active', joinedOn: '15 Aug 2025 06:20 PM', avatarBg: 'from-emerald-500 to-teal-600' },
    { id: 'HP10230', name: 'Suresh Yadav', mobile: '+91 94321 09876', status: 'Active', joinedOn: '15 Aug 2025 04:10 PM', avatarBg: 'from-red-500 to-rose-600' },
  ];

  // Table Data: Recent Transactions (matching screenshot)
  const recentTransactionsData = [
    { id: 1, userId: 'HP10234', type: 'Help Request', amount: '₹150', status: 'Completed', date: '16 Aug 2025 01:20 PM', iconBg: 'bg-red-500 text-white', statusColor: 'bg-emerald-100 text-emerald-700' },
    { id: 2, userId: 'HP10233', type: 'Withdrawal', amount: '₹400', status: 'Pending', date: '16 Aug 2025 12:45 PM', iconBg: 'bg-blue-500 text-white', statusColor: 'bg-amber-100 text-amber-700' },
    { id: 3, userId: 'HP10232', type: 'Referral Income', amount: '₹50', status: 'Completed', date: '16 Aug 2025 11:30 AM', iconBg: 'bg-emerald-500 text-white', statusColor: 'bg-emerald-100 text-emerald-700' },
    { id: 4, userId: 'HP10231', type: 'Help Request', amount: '₹150', status: 'Completed', date: '16 Aug 2025 10:12 AM', iconBg: 'bg-red-500 text-white', statusColor: 'bg-emerald-100 text-emerald-700' },
    { id: 5, userId: 'HP10230', type: 'Withdrawal', amount: '₹600', status: 'Approved', date: '16 Aug 2025 09:05 AM', iconBg: 'bg-purple-500 text-white', statusColor: 'bg-blue-100 text-blue-700' },
  ];

  // Handlers for Navigation & Quick Actions
  const handleNavClick = (itemId: string) => {
    setActiveSidebarItem(itemId);
    if (itemId === 'dashboard') {
      setActiveModal(null);
    } else if (itemId === 'logout') {
      logout();
    } else if (itemId === 'transfer_admin_ids') {
      setActiveModal('users');
      setUserStatusFilter('direct_admin');
    } else {
      setActiveModal(itemId);
    }
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'transfer_admin_ids') {
      setActiveModal('users');
      setUserStatusFilter('direct_admin');
    } else {
      setActiveModal(actionId);
    }
  };

  // Actions
  const handleApproveKyc = async (userId: string) => {
    await api.reviewKyc({ id: 'ADMIN-1', name: 'Super Admin', role: 'admin' }, userId, 'verified');
    showToast(`KYC for user ${userId} approved successfully!`);
    refreshUserData();
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    await api.adminProcessWithdrawal({
      withdrawalId,
      action: 'approve',
      adminId: currentUser?.id || 'ADMIN-1',
      transactionRef: `UTR-${Date.now()}`,
    });
    showToast(`Withdrawal #${withdrawalId} approved and processed.`);
    refreshUserData();
  };

  // Target sponsor match for transfer
  const targetSponsorMatch = useMemo(() => {
    if (!targetSponsorInput.trim()) return null;
    const clean = targetSponsorInput.trim().toUpperCase();
    const cleanDigits = targetSponsorInput.replace(/\D/g, '');
    return (
      state.users.find((u) => {
        if (transferTargetUser && u.id === transferTargetUser.id) return false;
        if (u.role === 'admin' || u.id === 'H150-ADMIN01') return false;
        if (u.id.toUpperCase() === clean) return true;
        if (u.id.toUpperCase() === `H150-${clean}`) return true;
        if (cleanDigits.length >= 6 && u.mobile?.slice(-10) === cleanDigits) return true;
        if (cleanDigits.length >= 6 && u.id.toUpperCase().endsWith(cleanDigits)) return true;
        if (u.fullName.toLowerCase().includes(targetSponsorInput.toLowerCase().trim())) return true;
        return false;
      }) || null
    );
  }, [targetSponsorInput, state.users, transferTargetUser]);

  const handleExecuteTransfer = async () => {
    if (!transferTargetUser) return;
    const finalTargetId = targetSponsorMatch?.id || targetSponsorInput.trim().toUpperCase();
    if (!finalTargetId) {
      showToast('कृपया टारगेट यूजर की ID या मोबाइल नंबर दर्ज करें।', 'error');
      return;
    }
    setIsTransferring(true);
    try {
      const adminActor = {
        id: currentUser?.id || 'H150-ADMIN01',
        name: currentUser?.fullName || 'Super Admin',
        role: 'admin',
      };
      const res = await api.adminTransferUserFromAdmin(
        adminActor,
        transferTargetUser.id,
        finalTargetId,
        { transferHelpLinks }
      );
      if (res.success && res.data) {
        showToast(res.message || `आईडी ${transferTargetUser.id} सफलतापूर्वक यूजर में ट्रांसफर कर दी गई!`);
        setTransferTargetUser(null);
        setTargetSponsorInput('');
        refreshUserData();
      } else {
        showToast(res.error || 'ट्रांसफर विफल रहा', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'ट्रांसफर विफल रहा', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleExecuteBulkTransfer = async () => {
    if (selectedUserIdsForBulk.length === 0) {
      showToast('कृपया कम से कम एक आईडी चुनें।', 'error');
      return;
    }
    const finalTargetId = targetSponsorMatch?.id || targetSponsorInput.trim().toUpperCase();
    if (!finalTargetId) {
      showToast('कृपया टारगेट यूजर की ID या मोबाइल नंबर दर्ज करें।', 'error');
      return;
    }
    setIsTransferring(true);
    try {
      const adminActor = {
        id: currentUser?.id || 'H150-ADMIN01',
        name: currentUser?.fullName || 'Super Admin',
        role: 'admin',
      };
      const res = await api.adminBulkTransferUsersFromAdmin(
        adminActor,
        selectedUserIdsForBulk,
        finalTargetId,
        { transferHelpLinks }
      );
      if (res.success && res.data) {
        showToast(res.message || `चयनित आईडी सफलतापूर्वक ट्रांसफर कर दी गईं!`);
        setSelectedUserIdsForBulk([]);
        setIsBulkTransferModalOpen(false);
        setTargetSponsorInput('');
        refreshUserData();
      } else {
        showToast(res.error || 'बल्क ट्रांसफर विफल रहा', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'बल्क ट्रांसफर विफल रहा', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!user || user.id === 'H150-ADMIN01') {
      showToast('Master Super Admin ID को डिलीट नहीं किया जा सकता।', 'error');
      return;
    }
    setIsDeletingUser(true);
    try {
      const adminActor = {
        id: currentUser?.id || 'H150-ADMIN01',
        name: currentUser?.fullName || 'Super Admin',
        role: 'admin',
      };
      const res = await api.adminDeleteUser(adminActor, user.id);
      if (res.success) {
        showToast(res.message || `यूजर ID ${user.id} (${user.fullName}) को सफलतापूर्वक डिलीट कर दिया गया है!`);
        setUserToDelete(null);
        refreshUserData();
      } else {
        showToast(res.error || 'यूजर डिलीट करने में विफल', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'यूजर डिलीट करने में विफल', 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIdsForBulk.length === 0) {
      showToast('कृपया कम से कम एक आईडी चुनें।', 'error');
      return;
    }
    setIsDeletingUser(true);
    try {
      const adminActor = {
        id: currentUser?.id || 'H150-ADMIN01',
        name: currentUser?.fullName || 'Super Admin',
        role: 'admin',
      };
      const res = await api.adminBulkDeleteUsers(adminActor, selectedUserIdsForBulk);
      if (res.success) {
        showToast(res.message || `कुल ${selectedUserIdsForBulk.length} आईडी सफलतापूर्वक डिलीट कर दी गईं!`);
        setSelectedUserIdsForBulk([]);
        setIsBulkDeleteModalOpen(false);
        refreshUserData();
      } else {
        showToast(res.error || 'बल्क डिलीट विफल रहा', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'बल्क डिलीट विफल रहा', 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSaveSettings = async () => {
    await api.updateSettings(
      {
        helpAmountDefault: Number(helpAmount),
        minWithdrawalAmount: Number(minWithdrawal),
        withdrawalMultiple: Number(withdrawalMultiple),
        withdrawalProcessingFeePercent: Number(processingFee),
        timerDurationHours: Number(timerHours),
        adminUpiId: adminUpi,
        defaultDirectSponsorId: defaultDirectSponsorId.trim() || undefined,
      },
      currentUser?.id || 'ADMIN-1'
    );
    showToast('Platform settings saved successfully!');
    setActiveModal(null);
    refreshUserData();
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(db.exportBackup());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HELP150_DATABASE_BACKUP_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database JSON backup exported successfully!');
  };

  const handleToggleBlockUser = async (user: User) => {
    const adminActor = { id: currentUser?.id || 'H150-ADMIN01', name: currentUser?.fullName || 'System Superadmin', role: 'admin' };
    if (user.status === 'blocked') {
      const res = await api.updateUserStatus(adminActor, user.id, 'active', 'Account unblocked by Administrator');
      if (res.success) {
        showToast(`User ${user.id} (${user.fullName}) has been UNBLOCKED successfully! Account is now Active.`);
      } else {
        showToast(res.error || 'Failed to unblock user', 'error');
      }
    } else {
      const res = await api.updateUserStatus(adminActor, user.id, 'blocked', 'Account manually blocked by Administrator');
      if (res.success) {
        showToast(`User ${user.id} (${user.fullName}) has been BLOCKED!`, 'error');
      } else {
        showToast(res.error || 'Failed to block user', 'error');
      }
    }
    refreshUserData();
  };

  // Direct login / impersonate into any user ID by Admin
  const handleDirectLoginAsUser = (targetUser: User) => {
    if (!targetUser) return;
    if (targetUser.id === currentUser?.id) {
      showToast('You are already logged into this account.', 'error');
      return;
    }
    const adminIdentifier = currentUser?.id || 'H150-ADMIN01';
    sessionStorage.setItem('HELP150_ADMIN_IMPERSONATOR', adminIdentifier);
    sessionStorage.setItem('HELP150_ADMIN_IMPERSONATOR_NAME', currentUser?.fullName || 'Super Admin');

    // Close modal if open
    setActiveModal(null);

    // Direct Login as User
    loginAs(targetUser.id);
    setActiveTab('dashboard');
    showToast(`Logged into ${targetUser.fullName} (${targetUser.id}) account. Click 'Return to Admin' anytime from the top bar.`, 'success');
  };

  const handleCopyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSavePasswordChange = async () => {
    if (!editingUserPassword) return;
    if (!editingUserPassword.newPass || editingUserPassword.newPass.trim().length < 4) {
      showToast('Password must be at least 4 characters long', 'error');
      return;
    }
    const adminActor = { id: currentUser?.id || 'H150-ADMIN01', name: currentUser?.fullName || 'System Superadmin', role: 'admin' };
    const res = await api.adminUpdateUserPassword(adminActor, editingUserPassword.userId, editingUserPassword.newPass.trim());
    if (res.success) {
      showToast(`Password successfully updated for user ${editingUserPassword.userId}!`);
      setEditingUserPassword(null);
      refreshUserData();
    } else {
      showToast(res.error || 'Failed to update password', 'error');
    }
  };

  const handleOpenEditUserDetails = (u: User) => {
    const kyc = state.kycRecords.find((k) => k.userId === u.id);
    let pwd = u.password;
    if (!pwd && u.passwordHash) {
      try {
        pwd = atob(u.passwordHash);
      } catch {
        pwd = u.role === 'admin' ? 'Admin@150' : 'Pass@123';
      }
    }
    if (!pwd) pwd = u.role === 'admin' ? 'Admin@150' : 'Pass@123';

    setEditingUserDetails({
      userId: u.id,
      fullName: u.fullName || '',
      mobile: u.mobile || '',
      email: u.email || '',
      password: pwd,
      sponsorId: u.sponsorId || '',
      status: (u.status as any) || 'active',
      kycStatus: (u.kycStatus as any) || 'not_submitted',
      upiId: u.upiId || kyc?.upiId || '',
      bankName: u.bankName || kyc?.bankName || '',
      accountHolderName: u.accountHolderName || kyc?.accountHolderName || u.fullName || '',
      accountNumber: u.accountNumber || kyc?.accountNumber || '',
      ifscCode: u.ifscCode || kyc?.ifscCode || '',
      gpayPhonePeNumber: u.gpayPhonePeNumber || u.mobile || '',
    });
    setShowEditDetailsPassword(false);
  };

  const handleSaveUserDetailsChange = async () => {
    if (!editingUserDetails) return;
    if (!editingUserDetails.fullName.trim()) {
      showToast('Full Name cannot be empty.', 'error');
      return;
    }
    if (!editingUserDetails.mobile.trim() || editingUserDetails.mobile.trim().length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    if (!editingUserDetails.email.trim() || !editingUserDetails.email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!editingUserDetails.password.trim() || editingUserDetails.password.trim().length < 4) {
      showToast('Password must be at least 4 characters long.', 'error');
      return;
    }

    const adminActor = {
      id: currentUser?.id || 'H150-ADMIN01',
      name: currentUser?.fullName || 'System Superadmin',
      role: 'admin',
    };

    const res = await api.adminUpdateUserDetails(adminActor, editingUserDetails.userId, {
      fullName: editingUserDetails.fullName.trim(),
      mobile: editingUserDetails.mobile.trim(),
      email: editingUserDetails.email.trim(),
      password: editingUserDetails.password.trim(),
      sponsorId: editingUserDetails.sponsorId.trim() || null,
      status: editingUserDetails.status,
      kycStatus: editingUserDetails.kycStatus,
      upiId: editingUserDetails.upiId.trim(),
      bankName: editingUserDetails.bankName.trim(),
      accountHolderName: editingUserDetails.accountHolderName.trim(),
      accountNumber: editingUserDetails.accountNumber.trim(),
      ifscCode: editingUserDetails.ifscCode.trim().toUpperCase(),
      gpayPhonePeNumber: editingUserDetails.gpayPhonePeNumber.trim(),
    });

    if (res.success) {
      showToast(`User ID ${editingUserDetails.userId} details updated successfully in database & cloud!`);
      setEditingUserDetails(null);
      refreshUserData();
    } else {
      showToast(res.error || 'Failed to update user details', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 font-sans">
      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-red-600 text-white border-red-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP GLOBAL HEADER BAR                                                 */}
      {/* ========================================================================= */}
      <header className="bg-[#0B1528] border-b border-slate-800 text-white sticky top-0 z-40 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-md">
        {/* Left: 3-Dots Button + Admin Title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-admin-header-3dots"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 hover:text-white border border-slate-700 hover:border-amber-400/50 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="3 डॉट: एडमिन ऑप्शन्स मेन्यू खोलें"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="text-[11px] font-bold text-amber-300">मेन्यू</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveSidebarItem('dashboard'); setActiveModal(null); }}
              className="flex items-center gap-2.5 text-slate-200 hover:text-white transition cursor-pointer"
            >
              <div className="relative h-8 w-8 rounded-full p-0.5 bg-gradient-to-br from-amber-400 to-amber-700 shrink-0">
                <img
                  src="/logo.png"
                  alt="HELP150 Logo"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm sm:text-base tracking-tight text-white">
                <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span>Admin Panel</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Header Metadata (Date, Time, Bell, Lang, Profile) */}
        <div className="flex items-center gap-3 sm:gap-5 text-xs font-semibold">
          {/* Date */}
          <div className="hidden lg:flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span>Date: {currentDateTime.date}</span>
          </div>

          {/* Time */}
          <div className="hidden lg:flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Time: {currentDateTime.time}</span>
          </div>

          {/* Notification Bell with Badge 5 */}
          <button
            onClick={() => handleNavClick('notifications')}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold">
              5
            </span>
          </button>

          {/* Language Selector */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs">
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>{selectedLanguage}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>

          {/* Super Admin Profile Chip */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-tr from-amber-400 to-blue-500 p-0.5 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Admin avatar"
                className="h-full w-full object-cover rounded-full"
              />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>Admin</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Super Admin</div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN LAYOUT: LEFT SIDEBAR DRAWER + DASHBOARD CANVAS                   */}
      {/* ========================================================================= */}
      <div className="flex w-full relative">
        {/* Backdrop for the Admin Sidebar Drawer */}
        {isSidebarOpen && (
          <div
            id="admin-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 transition-opacity animate-fadeIn cursor-pointer"
            title="Click to close sidebar"
          />
        )}

        {/* LEFT DARK NAVY 22-MENU SIDEBAR (COLLAPSED INSIDE, OPENS ON 3-DOTS CLICK) */}
        <aside
          id="admin-left-sidebar"
          className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#091325] min-h-screen p-4 text-slate-300 select-none border-r border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-4">
            {/* Top Logo in Sidebar with Close (X) Button */}
            <div className="flex items-center justify-between px-1 py-1 border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-md shadow-amber-500/20">
                  <img
                    src="/logo.png"
                    alt="HELP150 Official Logo"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain rounded-full"
                  />
                </div>
                <div>
                  <div className="text-base font-black text-white tracking-tight flex items-center">
                    <span>HELP</span>
                    <span className="text-amber-400">150</span>
                  </div>
                  <div className="text-[9px] text-amber-200/70 font-medium whitespace-nowrap">
                    Together For A Better Tomorrow
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                id="btn-close-admin-sidebar"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="मेन्यू बंद करें (Close Menu)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar Navigation Items (22 items) */}
            <nav className="space-y-0.5 text-xs font-semibold max-h-[calc(100vh-230px)] overflow-y-auto pr-1 custom-scrollbar">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSidebarItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavClick(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      isActive
                        ? 'bg-[#1877F2] text-white font-bold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold">
                          {item.badge}
                        </span>
                      )}
                      {item.hasArrow && !isActive && (
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Promotional / Golden Glow Banner Card */}
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-b from-[#0F1E3D] via-[#081225] to-[#040A17] border border-amber-500/20 text-center relative overflow-hidden shadow-inner">
            {/* Golden light glow arcs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[1px]" />
            <div className="text-center space-y-1">
              <div className="text-sm font-black text-white tracking-tight flex items-center justify-center gap-1">
                <span>HELP</span>
                <span className="text-amber-400">150</span>
              </div>
              <p className="text-[10px] text-amber-200/90 font-medium">
                Better Help | Stronger Community
              </p>
            </div>
            <div className="mt-2.5 flex justify-center">
              <div className="h-5 w-20 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-500/20 border border-amber-400/30 flex items-center justify-center text-[9px] text-amber-300 font-bold">
                ⭐ VERIFIED
              </div>
            </div>
          </div>
        </aside>

        {/* ----------------------------------------------------------------------- */}
        {/* MAIN ADMIN DASHBOARD CONTENT CANVAS                                     */}
        {/* ----------------------------------------------------------------------- */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1440px] mx-auto overflow-x-hidden">
          
          {/* Floating 3-Dots Button (Fixed on left edge so admin can always open menu) */}
          <button
            id="btn-admin-floating-3dots-menu"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="fixed left-3 sm:left-4 top-24 z-40 flex items-center justify-center h-11 w-11 rounded-2xl bg-[#091325] text-amber-400 hover:text-white border-2 border-amber-400/60 shadow-2xl shadow-slate-950/80 hover:scale-110 transition cursor-pointer backdrop-blur-md group"
            title="3 डॉट: एडमिन मेन्यू ऑप्शन्स खोलें"
            aria-label="Open Admin Options Menu"
          >
            <MoreVertical className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>

          {/* Top Bar with Prominent 3-Dots Button & Menu Trigger */}
          <div className="w-full flex items-center justify-between gap-3 pb-1 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                id="btn-admin-3dots-menu"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#091325] text-white hover:bg-slate-900 border border-slate-700 hover:border-amber-400/70 shadow-md transition cursor-pointer group"
                title="3 डॉट पर क्लिक करें - सभी 22 ऑप्शन्स खुलेंगे"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-400/20 text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                  <MoreVertical className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-amber-300 group-hover:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>एडमिन मेन्यू ऑप्शन्स</span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">3 डॉट</span>
                  </div>
                  <div className="text-[10px] text-slate-400">क्लिक करके सभी विकल्प खोलें</div>
                </div>
              </button>

              {/* Quick 3-Dot Action 1: Remove Transaction History */}
              <button
                id="btn-3dots-clear-transactions"
                onClick={() => {
                  setOpenClearTransactionsDirectly(true);
                  setActiveModal('transactions');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
                title="3 डॉट: ट्रांजेक्शन हिस्ट्री रिमूव / साफ़ करने का ऑप्शन"
              >
                <Trash2 className="h-4 w-4 text-amber-400" />
                <span>ट्रांजेक्शन हिस्ट्री रिमूव</span>
              </button>

              {/* Quick 3-Dot Action 2: Delete Extra User IDs */}
              <button
                id="btn-3dots-delete-users"
                onClick={() => {
                  setActiveModal('users');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
                title="3 डॉट: एक्स्ट्रा यूजर ID डिलीट करने का ऑप्शन"
              >
                <Trash2 className="h-4 w-4 text-rose-400" />
                <span>एक्स्ट्रा यूजर ID हटाएं</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
                <span>Master Admin Console (Restricted)</span>
              </span>
            </div>
          </div>
          
          {/* ===================================================================== */}
          {/* 1. TOP WELCOME BACK HERO BANNER                                       */}
          {/* ===================================================================== */}
          <div className="rounded-2xl bg-gradient-to-r from-[#0C1E4A] via-[#102E6C] to-[#1D4492] p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Background ambient lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Left Welcome Text */}
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-blue-600/60 text-white border border-blue-400/30 shadow-inner shrink-0">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 font-heading">
                  <span>Welcome Back,</span>
                  <span className="text-amber-400">Admin</span>
                  <span>👑</span>
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 font-medium">
                  Manage your platform, users and transactions efficiently.
                </p>
              </div>
            </div>

            {/* Right: Inspirational quote + Glowing World Globe Graphic */}
            <div className="flex items-center gap-3 relative z-10 self-end sm:self-auto">
              <div className="text-right hidden lg:block max-w-[190px]">
                <p className="text-xs italic text-blue-100 font-serif leading-relaxed">
                  “Together we can make a difference”
                </p>
              </div>
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-blue-400 to-indigo-500 p-0.5 shadow-lg shrink-0">
                <div className="h-full w-full rounded-2xl bg-[#0C1E4A] flex items-center justify-center overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=200&q=80"
                    alt="Hands holding glowing globe"
                    className="h-full w-full object-cover opacity-90"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* MASTER LINK SYSTEM SWITCH & 4-DAY PROMOTION CONTROL                   */}
          {/* Controls whether automatic links are active or in 4-day promotion     */}
          {/* ===================================================================== */}
          <MasterLinkSwitchCard />

          {/* ===================================================================== */}
          {/* 2. ROW OF 7 KEY METRIC CARDS                                         */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-3.5">
            {/* Metric 1: Total Users */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-md shadow-blue-500/20 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 leading-tight">Total Users</div>
                  <div className="text-lg font-black text-slate-900 font-heading">
                    {totalUsersCount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span>↑ 12%</span>
                <span className="text-slate-400 font-normal">Last 7 days</span>
              </div>
            </div>

            {/* Metric 2: Active Users */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 leading-tight">Active Users</div>
                  <div className="text-lg font-black text-slate-900 font-heading">
                    {activeUsersCount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span>↑ 10%</span>
                <span className="text-slate-400 font-normal">Last 7 days</span>
              </div>
            </div>

            {/* Metric 3: Pending KYC */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 leading-tight">Pending KYC</div>
                  <div className="text-lg font-black text-slate-900 font-heading">
                    {pendingKycCount}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span>↑ 8%</span>
                <span className="text-slate-400 font-normal">Last 7 days</span>
              </div>
            </div>

            {/* Metric 4: Pending Help Requests */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-md shadow-purple-500/20 shrink-0">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 leading-tight">Pending Help Requests</div>
                  <div className="text-lg font-black text-slate-900 font-heading">
                    {pendingHelpCount}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span>↑ 5%</span>
                <span className="text-slate-400 font-normal">Last 7 days</span>
              </div>
            </div>

            {/* Metric 5: Pending Withdrawals */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/20 shrink-0">
                  <ArrowDownCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 leading-tight">Pending Withdrawals</div>
                  <div className="text-lg font-black text-slate-900 font-heading">
                    {pendingWithdrawalCount}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span>↑ 3%</span>
                <span className="text-slate-400 font-normal">Last 7 days</span>
              </div>
            </div>

            {/* Metric 6: Total Transactions */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/20 shrink-0">
                  <Repeat className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 leading-tight">Total Transactions</div>
                  <div className="text-lg font-black text-slate-900 font-heading">
                    {totalTransactionsCount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span>↑ 15%</span>
                <span className="text-slate-400 font-normal">Last 7 days</span>
              </div>
            </div>

            {/* Metric 7: Support Tickets */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition col-span-2 sm:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/20 shrink-0">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 leading-tight">Support Tickets</div>
                  <div className="text-lg font-black text-slate-900 font-heading">
                    {supportTicketsCount}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span>↑ 6%</span>
                <span className="text-slate-400 font-normal">Last 7 days</span>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 3. MIDDLE ROW: 3 MAIN PANELS                                         */}
          {/*    1. User Growth Overview (Line Chart)                               */}
          {/*    2. Transaction Breakdown (Donut Chart)                            */}
          {/*    3. Quick Actions (8 Vibrant Action Buttons)                       */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* ------------------------------------------------------------------- */}
            {/* Panel 1: User Growth Overview (Line Chart)                          */}
            {/* ------------------------------------------------------------------- */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              {/* Header with Title and Legend */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 font-heading">User Growth Overview</h3>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <div className="flex items-center gap-1 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
                    <span>Total Users</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Active Users</span>
                  </div>
                </div>
              </div>

              {/* High-Fidelity SVG Dual Line Chart matching screenshot */}
              <div className="py-4">
                <div className="h-52 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 450 180">
                    {/* Horizontal Grid lines */}
                    <line x1="40" y1="20" x2="440" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="40" y1="50" x2="440" y2="50" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="40" y1="80" x2="440" y2="80" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="40" y1="110" x2="440" y2="110" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="40" y1="140" x2="440" y2="140" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="40" y1="170" x2="440" y2="170" stroke="#CBD5E1" strokeWidth="1" />

                    {/* Y-axis labels */}
                    <text x="5" y="24" fontSize="9" fill="#94A3B8" fontWeight="600">1,500</text>
                    <text x="5" y="54" fontSize="9" fill="#94A3B8" fontWeight="600">1,200</text>
                    <text x="12" y="84" fontSize="9" fill="#94A3B8" fontWeight="600">900</text>
                    <text x="12" y="114" fontSize="9" fill="#94A3B8" fontWeight="600">600</text>
                    <text x="12" y="144" fontSize="9" fill="#94A3B8" fontWeight="600">300</text>
                    <text x="24" y="174" fontSize="9" fill="#94A3B8" fontWeight="600">0</text>

                    {/* Active Users Area & Green Line (Series 2) */}
                    <path
                      d="M 60,135 Q 120,115 180,105 T 300,95 T 380,85 T 430,80 L 430,170 L 60,170 Z"
                      fill="rgba(16, 185, 129, 0.08)"
                    />
                    <path
                      d="M 60,135 Q 120,115 180,105 T 300,95 T 380,85 T 430,80"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Total Users Area & Blue Line (Series 1) */}
                    <path
                      d="M 60,115 Q 120,90 180,80 T 300,68 T 380,58 T 430,50 L 430,170 L 60,170 Z"
                      fill="rgba(24, 119, 242, 0.08)"
                    />
                    <path
                      d="M 60,115 Q 120,90 180,80 T 300,68 T 380,58 T 430,50"
                      fill="none"
                      stroke="#1877F2"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Blue Data Points */}
                    <circle cx="60" cy="115" r="3.5" fill="#1877F2" />
                    <circle cx="120" cy="90" r="3.5" fill="#1877F2" />
                    <circle cx="180" cy="80" r="3.5" fill="#1877F2" />
                    <circle cx="240" cy="74" r="3.5" fill="#1877F2" />
                    <circle cx="300" cy="68" r="3.5" fill="#1877F2" />
                    <circle cx="370" cy="58" r="3.5" fill="#1877F2" />
                    <circle cx="430" cy="50" r="3.5" fill="#1877F2" />

                    {/* Green Data Points */}
                    <circle cx="60" cy="135" r="3.5" fill="#10B981" />
                    <circle cx="120" cy="115" r="3.5" fill="#10B981" />
                    <circle cx="180" cy="105" r="3.5" fill="#10B981" />
                    <circle cx="240" cy="100" r="3.5" fill="#10B981" />
                    <circle cx="300" cy="95" r="3.5" fill="#10B981" />
                    <circle cx="370" cy="85" r="3.5" fill="#10B981" />
                    <circle cx="430" cy="80" r="3.5" fill="#10B981" />
                  </svg>
                </div>

                {/* X-axis date labels */}
                <div className="flex justify-between text-[10px] font-semibold text-slate-400 pl-8 pr-2 pt-1">
                  <span>10 Aug</span>
                  <span>11 Aug</span>
                  <span>12 Aug</span>
                  <span>13 Aug</span>
                  <span>14 Aug</span>
                  <span>15 Aug</span>
                  <span>16 Aug</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* Panel 2: Transaction Breakdown (Donut Chart)                       */}
            {/* ------------------------------------------------------------------- */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <h3 className="text-sm font-black text-slate-900 font-heading pb-3 border-b border-slate-100">
                Transaction Breakdown
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                {/* Donut Chart with Centered Total */}
                <div className="relative flex items-center justify-center h-44 w-44 shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="18" />

                    {/* Segment 1: Help Requests (42%) - Blue */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#1877F2"
                      strokeWidth="18"
                      strokeDasharray="100.2 238.7"
                      strokeDashoffset="0"
                    />

                    {/* Segment 2: Withdrawals (18%) - Green */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="18"
                      strokeDasharray="43.0 238.7"
                      strokeDashoffset="-100.2"
                    />

                    {/* Segment 3: Referral Income (15%) - Cyan */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="18"
                      strokeDasharray="35.8 238.7"
                      strokeDashoffset="-143.2"
                    />

                    {/* Segment 4: Wallet Transfer (12%) - Purple */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="18"
                      strokeDasharray="28.6 238.7"
                      strokeDashoffset="-179.0"
                    />

                    {/* Segment 5: Others (13%) - Orange */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="18"
                      strokeDasharray="31.0 238.7"
                      strokeDashoffset="-207.6"
                    />
                  </svg>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                    <span className="text-base font-black text-slate-900 font-heading">4,852</span>
                  </div>
                </div>

                {/* Legend Breakdown */}
                <div className="space-y-2 text-xs font-semibold w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#1877F2]" />
                      <span className="text-slate-600">Help Requests</span>
                    </div>
                    <span className="font-black text-slate-900">42%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-slate-600">Withdrawals</span>
                    </div>
                    <span className="font-black text-slate-900">18%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#06B6D4]" />
                      <span className="text-slate-600">Referral Income</span>
                    </div>
                    <span className="font-black text-slate-900">15%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
                      <span className="text-slate-600">Wallet Transfer</span>
                    </div>
                    <span className="font-black text-slate-900">12%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="text-slate-600">Others</span>
                    </div>
                    <span className="font-black text-slate-900">13%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* Panel 3: Quick Actions (8 Vibrant Action Buttons)                   */}
            {/* ------------------------------------------------------------------- */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <h3 className="text-sm font-black text-slate-900 font-heading pb-3 border-b border-slate-100">
                Quick Actions
              </h3>

              <div className="grid grid-cols-2 gap-2.5 pt-3">
                {/* 0. Member-to-Member Send Link Box (Vibrant Emerald & Teal Gradient) */}
                <button
                  onClick={() => handleQuickAction('member_link_box')}
                  className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-105 text-slate-950 font-black text-xs flex items-center justify-between px-4 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 shrink-0 text-slate-950" />
                    <span className="truncate uppercase tracking-wide">भेजे गए प्रोवाइड हेल्प लिंक्स (Dispatched Links)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 text-emerald-400 text-[10px] font-mono font-black shrink-0">
                    {dispatchedProvideHelpLinks.length} Links
                  </span>
                </button>

                {/* Brevo Email Campaigns (Vibrant Indigo & Blue Gradient) */}
                <button
                  onClick={() => handleQuickAction('email_campaigns')}
                  className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  <Mail className="h-4 w-4 shrink-0 text-amber-300" />
                  <span className="truncate uppercase tracking-wide">Brevo Email Campaigns (API v3)</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-400/30 text-white text-[9px] font-mono">NEW</span>
                </button>

                {/* Admin to User ID Transfer (Purple & Gold Gradient) */}
                <button
                  onClick={() => handleQuickAction('transfer_admin_ids')}
                  className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:brightness-110 text-white font-black text-xs flex items-center justify-between shadow-md shadow-purple-900/30 transition cursor-pointer border border-purple-400/30"
                >
                  <div className="flex items-center gap-2 truncate">
                    <ArrowRightLeft className="h-4 w-4 shrink-0 text-amber-300" />
                    <span className="truncate uppercase tracking-wide">एडमिन से यूजर में आईडी ट्रांसफर</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shrink-0">
                    {directAdminUsers.length} Direct
                  </span>
                </button>

                {/* 1. Manage Users (Royal Blue) */}
                <button
                  onClick={() => handleQuickAction('users')}
                  className="p-3 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate">Manage Users</span>
                </button>

                {/* 2. KYC Verification (Golden Orange) */}
                <button
                  onClick={() => handleQuickAction('kyc')}
                  className="p-3 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="truncate">KYC Verification</span>
                </button>

                {/* 3. View Help Requests (Emerald Green) */}
                <button
                  onClick={() => handleQuickAction('help_requests')}
                  className="p-3 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <HeartHandshake className="h-4 w-4 shrink-0" />
                  <span className="truncate">View Help Requests</span>
                </button>

                {/* 4. Transactions (Teal) */}
                <button
                  onClick={() => handleQuickAction('transactions')}
                  className="p-3 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Repeat className="h-4 w-4 shrink-0" />
                  <span className="truncate">Transactions</span>
                </button>

                {/* 5. View Withdrawals (Rose Red) */}
                <button
                  onClick={() => handleQuickAction('withdrawals')}
                  className="p-3 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Building className="h-4 w-4 shrink-0" />
                  <span className="truncate">View Withdrawals</span>
                </button>

                {/* 6. Referral Management (Indigo Blue) */}
                <button
                  onClick={() => handleQuickAction('referral_management')}
                  className="p-3 rounded-xl bg-[#2563EB] hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Share2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">Referral Management</span>
                </button>

                {/* 7. System Settings (Purple) */}
                <button
                  onClick={() => handleQuickAction('website_settings')}
                  className="p-3 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <SettingsIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">System Settings</span>
                </button>

                {/* 8. Generate Report (Dark Slate Blue) */}
                <button
                  onClick={() => handleQuickAction('reports')}
                  className="p-3 rounded-xl bg-[#1E293B] hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                  <span className="truncate">Generate Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 3.5 DEDICATED SECTION: भेजे गए प्रोवाइड हेल्प लिंक्स (DISPATCHED PROVIDE HELP LINKS) */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-sm font-black">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 font-heading flex items-center gap-2">
                    <span>भेजे गए प्रोवाइड हेल्प लिंक्स (Dispatched Provide Help Links)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      {dispatchedProvideHelpLinks.length} Links
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    सभी सदस्यों को प्रेषित ₹50 वेरिफिकेशन व ₹100 सेकंड हेल्प लिंक्स की वास्तविक स्थिति व रसीद विवरण।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModal('member_link_box')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 text-emerald-400" />
                  <span>सभी लिंक्स देखें व प्रबंधित करें (Manage All)</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Table of Latest Dispatched Provide Help Links */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] font-bold text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className="py-2.5 px-3">लिंक ID</th>
                    <th className="py-2.5 px-3">प्रकार (Stage)</th>
                    <th className="py-2.5 px-3">प्रदाता (Sender)</th>
                    <th className="py-2.5 px-3">प्राप्तकर्ता (Beneficiary)</th>
                    <th className="py-2.5 px-3">राशि</th>
                    <th className="py-2.5 px-3">रसीद / UTR</th>
                    <th className="py-2.5 px-3">स्थिति</th>
                    <th className="py-2.5 px-3 text-right">कार्यवाही</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dispatchedProvideHelpLinks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        वर्तमान में कोई प्रोवाइड हेल्प लिंक नहीं है।
                      </td>
                    </tr>
                  ) : (
                    dispatchedProvideHelpLinks.slice(0, 6).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-blue-600">#{l.id}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.amount === 50
                              ? 'bg-amber-100 text-amber-800'
                              : l.amount === 100
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {l.stepName}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{l.senderName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{l.senderUserId}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-emerald-700">{l.receiverName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{l.receiverUpi}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-slate-900 text-sm">
                          ₹{l.amount}
                        </td>
                        <td className="py-3 px-3">
                          {l.proofReference ? (
                            <span className="font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                              {l.proofReference}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">प्रतीक्षित</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {l.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              सत्यापित (Completed)
                            </span>
                          ) : l.status === 'submitted' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 animate-pulse">
                              स्लिप अपलोड (Review)
                            </span>
                          ) : l.status === 'rejected' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                              अस्वीकृत
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                              लंबित (Pending)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setActiveModal('member_link_box')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition cursor-pointer"
                          >
                            विवरण देखें
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 4. LOWER SECTION: 2 DATA TABLES                                      */}
          {/*    1. Recent Users Table                                             */}
          {/*    2. Recent Transactions Table                                      */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Table 1: Recent Users with Password & Block/Unblock */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm font-heading">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                  <span>Users & Credentials (यूजर ID और पासवर्ड)</span>
                </div>
                <button
                  onClick={() => handleQuickAction('users')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>View All ({state.users.length})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[11px] font-bold text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-2">User ID</th>
                      <th className="py-2.5 px-2">Name / Mobile</th>
                      <th className="py-2.5 px-2">Password</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {state.users.slice(0, 6).map((u) => {
                      const isPassVisible = showAllPasswords || !!showPasswordMap[u.id];
                      const userPass = u.password || (u.passwordHash ? atob(u.passwordHash) : (u.role === 'admin' ? 'Admin@150' : 'Pass@123'));
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-blue-600 font-mono text-[11px]">{u.id}</span>
                              <button
                                onClick={() => handleCopyText(u.id, `uid_${u.id}`)}
                                title="Copy User ID"
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              >
                                {copiedKey === `uid_${u.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            {(u.isAdminAccount || u.role === 'admin') && (
                              <span className="text-[9px] font-black text-purple-700 bg-purple-100 border border-purple-200/80 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                👑 Admin ID
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="font-bold text-slate-900 text-xs truncate max-w-[120px]">{u.fullName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.mobile}</div>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-1 bg-slate-100/90 px-2 py-1 rounded-lg border border-slate-200/60 font-mono text-[11px] w-fit">
                              <span className="font-semibold text-slate-800">
                                {isPassVisible ? userPass : '••••••••'}
                              </span>
                              <button
                                onClick={() =>
                                  setShowPasswordMap((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                                }
                                title={isPassVisible ? 'Hide Password' : 'Show Password'}
                                className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                              >
                                {isPassVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                              <button
                                onClick={() => handleCopyText(userPass, `pwd_${u.id}`)}
                                title="Copy Password"
                                className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                              >
                                {copiedKey === `pwd_${u.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                              {u.status === 'active' ? 'Active' : 'Blocked'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            {u.id !== 'H150-ADMIN01' ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleDirectLoginAsUser(u)}
                                  className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black transition shadow-xs cursor-pointer inline-flex items-center gap-1 shadow-blue-500/20"
                                  title={`Direct login into ${u.fullName} (${u.id})`}
                                >
                                  <LogIn className="h-3 w-3" />
                                  <span>लॉगिन</span>
                                </button>
                                <button
                                  onClick={() => handleToggleBlockUser(u)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1 ${
                                    u.status === 'blocked'
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                  }`}
                                >
                                  {u.status === 'blocked' ? (
                                    <>
                                      <Unlock className="h-3 w-3" />
                                      <span>Unblock</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-3 w-3" />
                                      <span>Block</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                                  title={`यूजर ID ${u.id} को हमेशा के लिए हटाएं`}
                                >
                                  <Trash2 className="h-3 w-3 text-rose-600" />
                                  <span>Delete ID</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 px-2 py-1">Superadmin</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Recent Transactions */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm font-heading">
                  <SettingsIcon className="h-4 w-4 text-blue-600" />
                  <span>Recent Transactions</span>
                </div>
                <button
                  onClick={() => handleQuickAction('transactions')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[11px] font-bold text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">User ID</th>
                      <th className="py-2.5 px-2">Type</th>
                      <th className="py-2.5 px-2">Amount</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {recentTransactionsData.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-2 font-semibold text-slate-400">{t.id}</td>
                        <td className="py-3 px-2 font-bold text-slate-700 font-mono text-[11px]">{t.userId}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${t.iconBg}`}>
                              {t.type === 'Help Request' ? '🤝' : t.type === 'Withdrawal' ? '🏛️' : '👥'}
                            </span>
                            <span className="font-semibold text-slate-800">{t.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-black text-red-600 font-mono">{t.amount}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.statusColor}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[11px] text-slate-500 whitespace-nowrap">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 5. BOTTOM ROW: 3 SUMMARY CARDS                                       */}
          {/*    1. System Overview (4 stats)                                      */}
          {/*    2. Recent Notifications (5 items)                                 */}
          {/*    3. HELP150 Community Promotional Card                             */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Card 1: System Overview (4 mini metric cards in 2x2 grid) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm font-heading pb-3 border-b border-slate-100">
                <Users className="h-4 w-4 text-blue-600" />
                <span>System Overview</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                {/* 1. Total Help Amount */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shrink-0">
                      ₹
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Help Amount</span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-heading pt-1">
                    ₹ 4,23,650
                  </div>
                </div>

                {/* 2. Total Withdrawals */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0">
                      🏛️
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Withdrawals</span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-heading pt-1">
                    ₹ 2,18,400
                  </div>
                </div>

                {/* 3. Total Referral Income */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold shrink-0">
                      👥
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Referral Income</span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-heading pt-1">
                    ₹ 98,750
                  </div>
                </div>

                {/* 4. Total Wallet Balance */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                      <Wallet className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Wallet Balance</span>
                  </div>
                  <div className="text-base font-black text-slate-900 font-heading pt-1">
                    ₹ 1,56,320
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Recent Notifications */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm font-heading">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span>Recent Notifications</span>
                </div>
                <button
                  onClick={() => handleQuickAction('notifications')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5 pt-3 text-xs">
                {/* 1 */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
                      🤝
                    </span>
                    <span className="truncate">New help request received from HP10234</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">2 min ago</span>
                </div>

                {/* 2 */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600 shrink-0">
                      🔔
                    </span>
                    <span className="truncate">Withdrawal request #WD1024 is pending</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">12 min ago</span>
                </div>

                {/* 3 */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                      🛡️
                    </span>
                    <span className="truncate">KYC verified for user HP10230</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">25 min ago</span>
                </div>

                {/* 4 */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-600 shrink-0">
                      👥
                    </span>
                    <span className="truncate">New referral joined through your link</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">1 hour ago</span>
                </div>

                {/* 5 */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-purple-600 shrink-0">
                      🎧
                    </span>
                    <span className="truncate">Support ticket #ST1024 is open</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">2 hours ago</span>
                </div>
              </div>
            </div>

            {/* Card 3: HELP150 Community Promotional Card (Glossy Navy & Gold Banner) */}
            <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-[#08152D] via-[#0B1E48] to-[#040C1D] p-5 text-white shadow-md border border-amber-500/20 relative overflow-hidden flex flex-col justify-between text-center">
              {/* Golden glow lighting */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-3 relative z-10">
                {/* Logo with Heart Hands */}
                <div className="flex items-center justify-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-white tracking-tight flex items-center">
                      <span>HELP</span>
                      <span className="text-amber-400">150</span>
                    </div>
                    <div className="text-[9px] text-slate-300 font-medium">
                      Community Help • Together We Grow
                    </div>
                  </div>
                </div>

                {/* Team Avatars graphic */}
                <div className="flex items-center justify-center -space-x-2 pt-1">
                  <div className="h-8 w-8 rounded-full border-2 border-amber-400/80 overflow-hidden bg-slate-800">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="user" className="h-full w-full object-cover" />
                  </div>
                  <div className="h-8 w-8 rounded-full border-2 border-amber-400/80 overflow-hidden bg-slate-800">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="user" className="h-full w-full object-cover" />
                  </div>
                  <div className="h-8 w-8 rounded-full border-2 border-amber-400/80 overflow-hidden bg-slate-800">
                    <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="user" className="h-full w-full object-cover" />
                  </div>
                </div>

                <p className="text-xs text-blue-200 font-semibold">
                  More Members | More Support | Stronger Community
                </p>
              </div>

              {/* Gold Button */}
              <div className="pt-4 relative z-10">
                <button
                  onClick={() => showToast('Community Campaign Active! Together we can make a difference.')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs transition cursor-pointer shadow-md shadow-amber-500/20 tracking-wide"
                >
                  Together We Can Make a Difference
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 6. DYNAMIC SUB-MANAGEMENT MODALS (Full Operational Controls)              */}
      {/* ========================================================================= */}

      {/* MODAL 0: MEMBER TO MEMBER SEND LINK BOX */}
      {activeModal === 'member_link_box' && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-6xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black shadow-md">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2">
                    <span>Member to Member Send Link Box</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">Admin Dispatcher</span>
                  </h3>
                  <p className="text-xs text-slate-500">P2P help linking, payment links, WhatsApp dispatch, and countdown management.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <MemberToMemberLinkBox
              currentUser={currentUser || ({ id: 'ADMIN-1', fullName: 'Super Admin', role: 'admin' } as any)}
              onRefresh={refreshUserData}
              initialTab="provide_help_links"
            />
          </div>
        </div>
      )}

      {/* MODAL: BREVO EMAIL CAMPAIGNS & BROADCAST DESK */}
      {activeModal === 'email_campaigns' && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-6xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in">
            <BrevoCampaignDesk
              onClose={() => setActiveModal(null)}
              onToast={showToast}
            />
          </div>
        </div>
      )}

      {/* MODAL 1: USER MANAGEMENT & CREDENTIALS (यूजर आईडी, पासवर्ड और ब्लॉक/अनब्लॉक) */}
      {(activeModal === 'users' || activeModal === 'user_details') && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-6xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-heading flex items-center gap-2">
                    <span>User Management & Credentials</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                      सभी यूजर ID, पासवर्ड और ब्लॉक/अनब्लॉक
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    View plain passwords, copy credentials, search members, and instantly Block or Unblock accounts.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllPasswords((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    showAllPasswords
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {showAllPasswords ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hide Passwords (छुपाएं)</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Show All Passwords (सभी पासवर्ड दिखाएं)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ADMIN ID & AUTO-GENERATION DIRECTIVE BANNER */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-700/60 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-800/60 text-purple-200 text-sm">🛡️</span>
                <div>
                  <div className="font-black text-amber-300">
                    ऑटोमैटिक यूजर ID जनरेशन: पूर्णतः बंद (Auto ID Generation: DISABLED)
                  </div>
                  <div className="text-[11px] text-purple-200">
                    वर्तमान सभी आईडी एडमिन अकाउंट्स हैं। एडमिन ID केवल 'रिसीव हेल्प' लेने के लिए जाएगी जब रिसीवर ज्यादा/आवश्यक हों।
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black whitespace-nowrap">
                ✓ ALL USER IDs & PASSWORDS UNLOCKED & CONTROLLABLE
              </span>
            </div>

            {/* Admin to User ID Transfer Promotion Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-500/40 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-black text-sm text-white flex items-center gap-2 flex-wrap">
                    <span>एडमिन से यूजर में आईडी डालने का विकल्प (ID Transfer to Member)</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {directAdminUsers.length} आईडी एडमिन में लगी हैं
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200">
                    सीधे एडमिन में लगी हुई किसी भी आईडी को किसी भी यूजर (मेंबर) की टीम में ट्रांसफर करें। उनके हेल्प लिंक (₹50/₹100) भी री-असाइन हो जाएंगे।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto shrink-0">
                {selectedUserIdsForBulk.length > 0 && (
                  <>
                    <button
                      onClick={() => setIsBulkTransferModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>चयनित {selectedUserIdsForBulk.length} आईडी यूजर में डालें</span>
                    </button>
                    <button
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>चयनित {selectedUserIdsForBulk.length} एक्स्ट्रा ID हटाएं</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setUserStatusFilter('direct_admin')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    userStatusFilter === 'direct_admin'
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-purple-900/50 hover:bg-purple-900/80 text-purple-200 border-purple-500/40'
                  }`}
                >
                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                  <span>एडमिन डायरेक्ट आईडी देखें ({directAdminUsers.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Stats & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by User ID, Name, Mobile, Email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                {userSearchQuery && (
                  <button
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex-wrap">
                <button
                  onClick={() => setUserStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    userStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({state.users.length})
                </button>
                <button
                  onClick={() => setUserStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    userStatusFilter === 'active'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Active ({state.users.filter((u) => u.status === 'active').length})
                </button>
                <button
                  onClick={() => setUserStatusFilter('blocked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    userStatusFilter === 'blocked'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  Blocked ({state.users.filter((u) => u.status === 'blocked').length})
                </button>
                <button
                  onClick={() => setUserStatusFilter('direct_admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    userStatusFilter === 'direct_admin'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <Crown className="h-3 w-3" />
                  <span>एडमिन डायरेक्ट ({directAdminUsers.length})</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        title="Select All Direct Admin IDs"
                        checked={
                          directAdminUsers.length > 0 &&
                          directAdminUsers.every((u) => selectedUserIdsForBulk.includes(u.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIdsForBulk(directAdminUsers.map((u) => u.id));
                          } else {
                            setSelectedUserIdsForBulk([]);
                          }
                        }}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer h-4 w-4"
                      />
                    </th>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">User ID (आईडी)</th>
                    <th className="py-3 px-3">Member Details (नाम / ईमेल)</th>
                    <th className="py-3 px-3">Mobile (मोबाइल)</th>
                    <th className="py-3 px-3">Password (पासवर्ड)</th>
                    <th className="py-3 px-3 text-center">Direct Login (सीधा यूजर लॉगिन)</th>
                    <th className="py-3 px-3">Sponsor ID / Transfer</th>
                    <th className="py-3 px-3">KYC</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action (एडिट / ट्रांसफर / ब्लॉक)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.users
                    .filter((u) => {
                      if (userStatusFilter === 'active' && u.status !== 'active') return false;
                      if (userStatusFilter === 'blocked' && u.status !== 'blocked') return false;
                      if (userStatusFilter === 'direct_admin') {
                        const isDirectAdmin =
                          u.id !== 'H150-ADMIN01' &&
                          (!u.sponsorId ||
                            u.sponsorId === 'H150-ADMIN01' ||
                            u.sponsorId.toUpperCase() === 'DIRECT');
                        if (!isDirectAdmin) return false;
                      }
                      if (userSearchQuery.trim()) {
                        const q = userSearchQuery.toLowerCase().trim();
                        const matchId = u.id.toLowerCase().includes(q);
                        const matchName = u.fullName.toLowerCase().includes(q);
                        const matchMobile = u.mobile.includes(q);
                        const matchEmail = u.email.toLowerCase().includes(q);
                        const matchSponsor = (u.sponsorId || '').toLowerCase().includes(q);
                        return matchId || matchName || matchMobile || matchEmail || matchSponsor;
                      }
                      return true;
                    })
                    .map((u, idx) => {
                      const isPassVisible = showAllPasswords || !!showPasswordMap[u.id];
                      const userPass =
                        u.password ||
                        (u.passwordHash
                          ? (() => {
                              try {
                                return atob(u.passwordHash);
                              } catch {
                                return u.role === 'admin' ? 'Admin@150' : 'Pass@123';
                              }
                            })()
                          : u.role === 'admin'
                          ? 'Admin@150'
                          : 'Pass@123');

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 text-center">
                            {u.id !== 'H150-ADMIN01' ? (
                              <input
                                type="checkbox"
                                checked={selectedUserIdsForBulk.includes(u.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIdsForBulk((prev) => [...prev, u.id]);
                                  } else {
                                    setSelectedUserIdsForBulk((prev) => prev.filter((id) => id !== u.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer h-4 w-4"
                              />
                            ) : null}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                          
                          {/* User ID with 1-click Copy */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-md border border-blue-200/50">
                                {u.id}
                              </span>
                              <button
                                onClick={() => handleCopyText(u.id, `modal_uid_${u.id}`)}
                                title="Copy User ID"
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              >
                                {copiedKey === `modal_uid_${u.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            {(u.isAdminAccount || u.role === 'admin') ? (
                              <span className="text-[9px] font-black uppercase text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                👑 Admin ID (एडमिन आईडी)
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                Member Account
                              </span>
                            )}
                          </td>

                          {/* Member Name & Email */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-xs">{u.fullName}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{u.email}</div>
                          </td>

                          {/* Mobile */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                              <span>{u.mobile}</span>
                              <button
                                onClick={() => handleCopyText(u.mobile, `mob_${u.id}`)}
                                title="Copy Mobile"
                                className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                              >
                                {copiedKey === `mob_${u.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Password Field with Eye Toggle, Copy and Edit */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 font-mono text-xs w-fit">
                              <span className={`font-black ${isPassVisible ? 'text-amber-700 font-mono' : 'text-slate-500'}`}>
                                {isPassVisible ? userPass : '••••••••'}
                              </span>

                              {/* Toggle view/hide */}
                              <button
                                onClick={() =>
                                  setShowPasswordMap((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                                }
                                title={isPassVisible ? 'Hide Password' : 'Show Password'}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer ml-1"
                              >
                                {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>

                              {/* Copy Password */}
                              <button
                                onClick={() => handleCopyText(userPass, `modal_pwd_${u.id}`)}
                                title="Copy Password"
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              >
                                {copiedKey === `modal_pwd_${u.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>

                              {/* Edit / Reset Password */}
                              <button
                                onClick={() =>
                                  setEditingUserPassword({
                                    userId: u.id,
                                    userName: u.fullName,
                                    currentPass: userPass,
                                    newPass: '',
                                  })
                                }
                                title="Reset / Change Password"
                                className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                              >
                                <Key className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Direct Login Button (सीधे यूजर ID में लॉगिन करें) */}
                          <td className="py-3 px-3 text-center">
                            {u.id !== currentUser?.id ? (
                              <button
                                onClick={() => handleDirectLoginAsUser(u)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition cursor-pointer inline-flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                                title={`सीधे ${u.fullName} (${u.id}) की आईडी में लॉगिन करें`}
                              >
                                <LogIn className="h-3.5 w-3.5" />
                                <span>लॉगिन करें</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2 py-1 rounded-lg inline-block">
                                वर्तमान एडमिन
                              </span>
                            )}
                          </td>

                          {/* Sponsor ID */}
                          <td className="py-3 px-3">
                            <span className="font-mono text-xs text-slate-600 font-semibold">
                              {u.sponsorId || 'Direct (Admin)'}
                            </span>
                          </td>

                          {/* KYC */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.kycStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : u.kycStatus === 'pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {u.kycStatus}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 w-fit ${
                                  u.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                                  }`}
                                ></span>
                                {u.status === 'active' ? 'Active' : 'Blocked'}
                              </span>
                              {u.status === 'blocked' && (
                                <span className="text-[9px] text-red-600 font-medium">
                                  Auto-delete in 24h
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action: Block / Unblock */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Edit All Details Button */}
                              <button
                                onClick={() => handleOpenEditUserDetails(u)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                title={`Edit all details of ${u.fullName} (${u.id})`}
                              >
                                <Edit className="h-3.5 w-3.5 text-amber-700" />
                                <span>Edit Details</span>
                              </button>

                              {/* Transfer ID Button */}
                              {u.id !== 'H150-ADMIN01' && (
                                <button
                                  onClick={() => {
                                    setTransferTargetUser(u);
                                    setTargetSponsorInput('');
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                  title={`Transfer ${u.fullName} (${u.id}) to another member`}
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5 text-purple-700" />
                                  <span>Transfer ID</span>
                                </button>
                              )}

                              {u.id !== 'H150-ADMIN01' ? (
                                <>
                                  <button
                                    onClick={() => handleToggleBlockUser(u)}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1 ${
                                      u.status === 'blocked'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                    }`}
                                  >
                                    {u.status === 'blocked' ? (
                                      <>
                                        <Unlock className="h-3.5 w-3.5" />
                                        <span>Unblock</span>
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="h-3.5 w-3.5" />
                                        <span>Block</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                    title={`यूजर ID ${u.id} (${u.fullName}) को डिलीट करें`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                    <span>Delete ID</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 px-2 py-1">
                                  Superadmin
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {state.users.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No registered users found.
                </div>
              )}
            </div>

            {/* Modal Footer Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Total Registered Members:</span>
                <span className="font-bold text-blue-600 font-mono">{state.users.length}</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700 font-semibold">
                  Active: {state.users.filter((u) => u.status === 'active').length}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-red-700 font-semibold">
                  Blocked: {state.users.filter((u) => u.status === 'blocked').length}
                </span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: CHANGE / RESET USER PASSWORD */}
      {editingUserPassword && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 font-heading">
                    Reset User Password
                  </h4>
                  <p className="text-xs text-slate-500">
                    {editingUserPassword.userName} ({editingUserPassword.userId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUserPassword(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Current Password:</label>
                <div className="px-3 py-2 rounded-xl bg-slate-100 font-mono font-bold text-slate-800 border border-slate-200 flex items-center justify-between">
                  <span>{editingUserPassword.currentPass}</span>
                  <button
                    onClick={() => handleCopyText(editingUserPassword.currentPass, 'edit_cur_pwd')}
                    className="text-slate-400 hover:text-blue-600"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  New Password (नया पासवर्ड):
                </label>
                <input
                  type="text"
                  placeholder="Enter new password (min 4 chars)"
                  value={editingUserPassword.newPass}
                  onChange={(e) =>
                    setEditingUserPassword((prev) =>
                      prev ? { ...prev, newPass: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  autoFocus
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Updating will immediately sync with the database and server. The user can log in with this new password.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUserPassword(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePasswordChange}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20"
              >
                Save New Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: COMPLETE USER DETAILS EDITOR (एडमिन द्वारा सभी यूजर डिटेल्स में बदलाव) */}
      {editingUserDetails && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-md">
                  <Edit className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black text-slate-900 font-heading">
                      Edit User Profile & Financial Details
                    </h4>
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                      {editingUserDetails.userId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    एडमिन सभी यूजर ID के नाम, मोबाइल, ईमेल, पासवर्ड, स्पॉन्सर, स्टेटस और बैंक/UPI डिटेल्स बदल सकता है।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Sections */}
            <div className="space-y-5 text-xs">
              {/* SECTION 1: PERSONAL & CONTACT INFORMATION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                  <span>1. Personal & Contact Information (व्यक्तिगत जानकारी)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Full Name (सदस्य का पूरा नाम) *
                    </label>
                    <input
                      type="text"
                      value={editingUserDetails.fullName}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, fullName: e.target.value } : null
                        )
                      }
                      placeholder="Enter Full Name"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Mobile Number (मोबाइल नंबर) *
                    </label>
                    <input
                      type="tel"
                      value={editingUserDetails.mobile}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) } : null
                        )
                      }
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Email Address (ईमेल) *
                    </label>
                    <input
                      type="email"
                      value={editingUserDetails.email}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, email: e.target.value } : null
                        )
                      }
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: SECURITY, SPONSOR & STATUS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span>2. Security, Sponsor & Account Status (पासवर्ड व खाता स्थिति)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Login Password (पासवर्ड) *
                    </label>
                    <div className="relative">
                      <input
                        type={showEditDetailsPassword ? 'text' : 'password'}
                        value={editingUserDetails.password}
                        onChange={(e) =>
                          setEditingUserDetails((prev) =>
                            prev ? { ...prev, password: e.target.value } : null
                          )
                        }
                        placeholder="Min 4 characters"
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditDetailsPassword((p) => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showEditDetailsPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Sponsor ID (स्पॉन्सर आईडी)
                    </label>
                    <input
                      type="text"
                      value={editingUserDetails.sponsorId}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, sponsorId: e.target.value.toUpperCase() } : null
                        )
                      }
                      placeholder="e.g. H150-1002"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Account Status (खाता स्थिति)
                    </label>
                    <select
                      value={editingUserDetails.status}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, status: e.target.value as any } : null
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="active">Active (सक्रिय)</option>
                      <option value="blocked">Blocked (ब्लॉक)</option>
                      <option value="suspended">Suspended (निलंबित)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      KYC Status (केवाईसी)
                    </label>
                    <select
                      value={editingUserDetails.kycStatus}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, kycStatus: e.target.value as any } : null
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="verified">Verified (सत्यापित)</option>
                      <option value="pending">Pending (प्रतीक्षारत)</option>
                      <option value="rejected">Rejected (अस्वीकृत)</option>
                      <option value="not_submitted">Not Submitted (जमा नहीं)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: BANK & UPI PAYMENT DETAILS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <span>3. Bank Account & UPI Payment Details (बैंक खाता व UPI डिटेल्स)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      UPI ID (जैसे user@upi)
                    </label>
                    <input
                      type="text"
                      value={editingUserDetails.upiId}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, upiId: e.target.value.toLowerCase() } : null
                        )
                      }
                      placeholder="e.g. 9876543210@paytm"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Bank Name (बैंक का नाम)
                    </label>
                    <input
                      type="text"
                      value={editingUserDetails.bankName}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, bankName: e.target.value } : null
                        )
                      }
                      placeholder="e.g. State Bank of India"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Account Holder Name (खाताधारक का नाम)
                    </label>
                    <input
                      type="text"
                      value={editingUserDetails.accountHolderName}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, accountHolderName: e.target.value } : null
                        )
                      }
                      placeholder="As per bank record"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Account Number (खाता संख्या)
                    </label>
                    <input
                      type="text"
                      value={editingUserDetails.accountNumber}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, accountNumber: e.target.value.replace(/[^0-9]/g, '') } : null
                        )
                      }
                      placeholder="Bank Account Number"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      IFSC Code (आईएफएससी कोड)
                    </label>
                    <input
                      type="text"
                      value={editingUserDetails.ifscCode}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, ifscCode: e.target.value.toUpperCase() } : null
                        )
                      }
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      GPay / PhonePe Mobile (गूगलपे/फोनपे)
                    </label>
                    <input
                      type="tel"
                      value={editingUserDetails.gpayPhonePeNumber}
                      onChange={(e) =>
                        setEditingUserDetails((prev) =>
                          prev ? { ...prev, gpayPhonePeNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) } : null
                        )
                      }
                      placeholder="10-digit number"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUserDetails(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                Cancel (रद्द करें)
              </button>
              <button
                type="button"
                onClick={handleSaveUserDetailsChange}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20 transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Save All Details (सभी बदलाव सुरक्षित करें)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KYC VERIFICATION DESK */}
      {activeModal === 'kyc' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">KYC Verification Desk</h3>
                  <p className="text-xs text-slate-500">Review pending Aadhaar, PAN, and Bank details for members.</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {state.kycRecords.map((k) => (
                <div key={k.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-blue-600 font-bold">{k.userId}</span>
                      {(() => {
                        const targetUser = state.users.find((u) => u.id === k.userId);
                        return targetUser ? (
                          <button
                            onClick={() => handleDirectLoginAsUser(targetUser)}
                            className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[10px] transition cursor-pointer border border-blue-200 inline-flex items-center gap-1"
                            title={`Direct login into ${targetUser.fullName} (${k.userId})`}
                          >
                            <LogIn className="h-2.5 w-2.5" />
                            <span>लॉगिन</span>
                          </button>
                        ) : null;
                      })()}
                      <span className="font-bold text-slate-800 uppercase px-2 py-0.5 bg-slate-200 rounded">
                        {k.documentType}: {k.aadhaarNumber || k.panNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${k.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {k.status}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-600 text-[11px]">
                      Bank: <strong>{k.bankName}</strong> ({k.accountNumber}) IFSC: {k.ifscCode} | UPI: {k.upiId}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveKyc(k.userId)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => showToast(`KYC for ${k.userId} rejected.`, 'error')}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HELP REQUESTS & MATCHING DESK */}
      {activeModal === 'help_requests' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">Help Requests & Payment Matching Desk</h3>
                  <p className="text-xs text-slate-500">Live 12-hour countdown monitoring and payment slip verification.</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <PaymentVerificationDesk currentUser={currentUser || { id: 'ADMIN-1', fullName: 'Super Admin', role: 'admin' } as any} onRefresh={refreshUserData} />
          </div>
        </div>
      )}

      {/* MODAL 4: WITHDRAWALS */}
      {activeModal === 'withdrawals' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 text-white">
                  <ArrowDownCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">Withdrawal Payout Requests</h3>
                  <p className="text-xs text-slate-500">Process multiples of ₹200 payouts with bank transaction UTR tracking.</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {state.withdrawals.map((w) => (
                <div key={w.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-600 font-bold">#{w.id}</span>
                      <span className="font-bold text-slate-800">User: {w.userId}</span>
                      <span className="font-mono font-black text-red-600 text-sm">₹{w.amount}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                        {w.status}
                      </span>
                    </div>
                    <div className="mt-1 text-slate-500 text-[11px]">
                      Method: {w.payoutMethod || 'UPI'} • Net Payable: ₹{w.netPayable || w.amount} (10% Fee)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveWithdrawal(w.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Approve Payout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SYSTEM SETTINGS */}
      {activeModal === 'website_settings' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white">
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">Platform System Settings</h3>
                  <p className="text-xs text-slate-500">Configure core rules, timer windows, and limits.</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Default Help Amount (₹)</label>
                <input
                  type="number"
                  value={helpAmount}
                  onChange={(e) => setHelpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Withdrawal Minimum (₹) & Multiples</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={minWithdrawal}
                    onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
                  />
                  <input
                    type="number"
                    value={withdrawalMultiple}
                    onChange={(e) => setWithdrawalMultiple(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Timer Countdown Duration (Hours)</label>
                <input
                  type="number"
                  value={timerHours}
                  onChange={(e) => setTimerHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Admin Receiving UPI ID</label>
                <input
                  type="text"
                  value={adminUpi}
                  onChange={(e) => setAdminUpi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition cursor-pointer mt-2"
              >
                Save Platform Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: BACKUP & DATA EXPORT */}
      {activeModal === 'backup' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">Database Backup & Export</h3>
              <p className="text-xs text-slate-500 mt-1">Export a complete, immutable JSON snapshot of all members, helps, and ledger transactions.</p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Download JSON Backup</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('firebase_database')}
                className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Database className="h-4 w-4 text-amber-600" />
                <span>View Firebase Cloud DB Connection</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE TRANSFER MODAL */}
      {transferTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-700 text-amber-300">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">एडमिन से यूजर में आईडी ट्रांसफर करें</h3>
                  <p className="text-xs text-slate-500">ID Transfer from Admin to Member Team</p>
                </div>
              </div>
              <button onClick={() => setTransferTargetUser(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                <div className="font-bold text-slate-900">चुनी गई आईडी (Selected ID):</div>
                <div className="font-mono text-purple-700 font-black text-sm">{transferTargetUser.id} - {transferTargetUser.fullName}</div>
                <div className="text-[11px] text-slate-600">मोबाइल: {transferTargetUser.mobile} | वर्तमान स्पॉन्सर: {transferTargetUser.sponsorId || 'Direct (Admin)'}</div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  नए स्पॉन्सर का यूजर ID या मोबाइल नंबर दर्ज करें:
                </label>
                <input
                  type="text"
                  value={targetSponsorInput}
                  onChange={(e) => setTargetSponsorInput(e.target.value)}
                  placeholder="उदा. H150-1002 या मोबाइल नंबर"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-mono text-xs"
                />
                {targetSponsorMatch ? (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-between">
                    <span>मिल गया: {targetSponsorMatch.id} ({targetSponsorMatch.fullName})</span>
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                ) : targetSponsorInput.trim().length > 2 ? (
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                    कोई सदस्य नहीं मिला। दर्ज किया गया टेक्स्ट सीधे स्पॉन्सर आईडी मान लिया जाएगा।
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="transfer_help_links_chk"
                  checked={transferHelpLinks}
                  onChange={(e) => setTransferHelpLinks(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="transfer_help_links_chk" className="text-xs font-bold text-slate-700 cursor-pointer">
                  इस आईडी के हेल्प लिंक (₹50/₹100) भी नए स्पॉन्सर को री-असाइन करें
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferTargetUser(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={isTransferring}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs cursor-pointer shadow-md shadow-purple-900/30 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowRightLeft className="h-4 w-4 text-amber-300" />
                <span>{isTransferring ? 'ट्रांसफर हो रहा है...' : 'अब ट्रांसफर करें (Transfer Now)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK TRANSFER MODAL */}
      {isBulkTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black">
                  {selectedUserIdsForBulk.length}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">बल्क एडमिन आईडी ट्रांसफर (Bulk Transfer)</h3>
                  <p className="text-xs text-slate-500">{selectedUserIdsForBulk.length} चयनित आईडी को एक साथ ट्रांसफर करें</p>
                </div>
              </div>
              <button onClick={() => setIsBulkTransferModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto font-mono text-[11px] text-slate-700">
                <div className="font-bold text-slate-900 mb-1">चयनित यूजर IDs:</div>
                {selectedUserIdsForBulk.join(', ')}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  नए स्पॉन्सर का यूजर ID या मोबाइल नंबर दर्ज करें:
                </label>
                <input
                  type="text"
                  value={targetSponsorInput}
                  onChange={(e) => setTargetSponsorInput(e.target.value)}
                  placeholder="उदा. H150-1002 या मोबाइल नंबर"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-mono text-xs"
                />
                {targetSponsorMatch ? (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-between">
                    <span>मिल गया: {targetSponsorMatch.id} ({targetSponsorMatch.fullName})</span>
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bulk_transfer_help_links_chk"
                  checked={transferHelpLinks}
                  onChange={(e) => setTransferHelpLinks(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="bulk_transfer_help_links_chk" className="text-xs font-bold text-slate-700 cursor-pointer">
                  इन सभी आईडी के हेल्प लिंक भी नए स्पॉन्सर को री-असाइन करें
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkTransferModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkTransfer}
                disabled={isTransferring}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>{isTransferring ? 'ट्रांसफर हो रहा है...' : `सभी ${selectedUserIdsForBulk.length} आईडी ट्रांसफर करें`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SINGLE USER DELETE MODAL (यूजर ID डिलीट करने का कन्फर्मेशन) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">यूजर ID डिलीट करें</h3>
                  <p className="text-xs text-rose-600 font-semibold">Delete User Account & Clean Data</p>
                </div>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5">
                <div className="font-bold text-slate-800">क्या आप वाकई इस यूजर ID को डिलीट करना चाहते हैं?</div>
                <div className="font-mono text-rose-700 font-black text-sm">{userToDelete.id} ({userToDelete.fullName})</div>
                <div className="text-[11px] text-slate-600">मोबाइल: {userToDelete.mobile} | ईमेल: {userToDelete.email}</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold">⚠️ डिलीट होने के बाद:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                  <li>यूजर का वॉलेट, हेल्प रिक्वेस्ट और संबंधित डेटा सुरक्षित हटा दिया जाएगा।</li>
                  <li>यदि इस यूजर के नीचे कोई डाउनलाइन है, तो वह स्वतः एडमिन को री-असाइन हो जाएगी।</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(userToDelete)}
                disabled={isDeletingUser}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md shadow-rose-600/30 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingUser ? 'डिलीट हो रहा है...' : 'हाँ, यूजर ID डिलीट करें'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK DELETE USERS MODAL (एक्स्ट्रा आईडी बल्क डिलीट कन्फर्मेशन) */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">चयनित एक्स्ट्रा ID डिलीट करें</h3>
                  <p className="text-xs text-rose-600 font-semibold">Bulk Delete Selected User Accounts</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5">
                <div className="font-bold text-slate-800">
                  चयनित कुल <span className="font-black text-rose-600 text-sm">{selectedUserIdsForBulk.length}</span> एक्स्ट्रा आईडी डिलीट की जाएंगी:
                </div>
                <div className="font-mono text-xs text-slate-600 max-h-24 overflow-y-auto p-2 bg-white rounded-xl border border-rose-100 divide-y divide-slate-100">
                  {selectedUserIdsForBulk.map((id) => (
                    <div key={id} className="py-0.5">{id}</div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                ⚠️ इन सभी आईडी का अकाउंट व संबंधित डेटा हमेशा के लिए हटा दिया जाएगा।
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isDeletingUser}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteUsers}
                disabled={isDeletingUser}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md shadow-rose-600/30 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingUser ? 'डिलीट हो रही हैं...' : `हाँ, सभी ${selectedUserIdsForBulk.length} ID डिलीट करें`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSACTIONS DESK (ट्रांजेक्शन हिस्ट्री और 3-डॉट रिमूव ऑप्शन) */}
      {activeModal === 'transactions' && (
        <TransactionsDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          onClose={() => {
            setActiveModal(null);
            setOpenClearTransactionsDirectly(false);
          }}
          initialOpenClearModal={openClearTransactionsDirectly}
          onRefresh={refreshUserData}
          showToast={showToast}
        />
      )}

      {/* MODAL: WALLET MANAGEMENT DESK */}
      {activeModal === 'wallet_management' && (
        <WalletManagementDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          onClose={() => setActiveModal(null)}
          onRefresh={refreshUserData}
          showToast={showToast}
        />
      )}

      {/* MODAL: REFERRAL MANAGEMENT & SETTINGS DESK */}
      {(activeModal === 'referral_management' || activeModal === 'referral_settings') && (
        <ReferralDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          mode={activeModal === 'referral_settings' ? 'settings' : 'management'}
          onClose={() => setActiveModal(null)}
          onRefresh={refreshUserData}
          showToast={showToast}
        />
      )}

      {/* MODAL: NOTIFICATIONS BROADCAST DESK */}
      {activeModal === 'notifications' && (
        <NotificationsDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      )}

      {/* MODAL: SUPPORT TICKETS DESK */}
      {activeModal === 'support_tickets' && (
        <SupportTicketsDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      )}

      {/* MODAL: REPORTS & ANALYTICS DESK */}
      {activeModal === 'reports' && (
        <ReportsDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      )}

      {/* MODAL: FRAUD DETECTION DESK */}
      {activeModal === 'fraud_detection' && (
        <FraudDetectionDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          onClose={() => setActiveModal(null)}
          onRefresh={refreshUserData}
          showToast={showToast}
        />
      )}

      {/* MODAL: AUDIT LOGS DESK */}
      {activeModal === 'audit_logs' && (
        <AuditLogsDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      )}

      {/* MODAL: PLATFORM CONTENT & LEGAL POLICIES */}
      {(activeModal === 'terms_conditions' || activeModal === 'privacy_policy' || activeModal === 'admin_roles' || activeModal === 'security') && (
        <PlatformContentDesk
          currentUser={currentUser || ({ id: 'H150-ADMIN01', fullName: 'Super Admin', role: 'admin' } as any)}
          modalType={activeModal as any}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      )}

      {/* FIREBASE DATABASE CONNECTION & DIAGNOSTICS MODAL */}
      <FirebaseConnectionModal
        isOpen={activeModal === 'firebase_database'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};

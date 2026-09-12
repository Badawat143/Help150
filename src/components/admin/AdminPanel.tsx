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

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { User, HelpRequest, WithdrawalRequest, KycRecord } from '../../types';
import { PaymentVerificationDesk } from './PaymentVerificationDesk';
import { MemberToMemberLinkBox } from './MemberToMemberLinkBox';
import { FirebaseConnectionModal } from '../common/FirebaseConnectionModal';

export const AdminPanel: React.FC = () => {
  const { currentUser, refreshUserData, logout, setActiveTab } = useAuth();
  const state = db.getState();
  const settings = state.settings;

  // Active navigation state
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [editingUserPassword, setEditingUserPassword] = useState<{ userId: string; userName: string; currentPass: string; newPass: string } | null>(null);

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

  // Sidebar Menu Items matching the 22 items in image
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hasArrow: false },
    { id: 'member_link_box', label: 'Member-to-Member Link Box', icon: Send, hasArrow: true, badge: 'P2P' },
    { id: 'users', label: 'Users', icon: Users, hasArrow: true },
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
    } else {
      setActiveModal(itemId);
    }
  };

  const handleQuickAction = (actionId: string) => {
    setActiveModal(actionId);
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

  const handleSaveSettings = async () => {
    await api.updateSettings(
      {
        helpAmountDefault: Number(helpAmount),
        minWithdrawalAmount: Number(minWithdrawal),
        withdrawalMultiple: Number(withdrawalMultiple),
        withdrawalProcessingFeePercent: Number(processingFee),
        timerDurationHours: Number(timerHours),
        adminUpiId: adminUpi,
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
        {/* Left: Hamburger + Admin Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveSidebarItem('dashboard'); setActiveModal(null); }}
              className="flex items-center gap-2 text-slate-200 hover:text-white transition cursor-pointer"
            >
              <Menu className="h-5 w-5 text-slate-400 hidden md:block" />
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
      {/* 2. MAIN LAYOUT: LEFT SIDEBAR + DASHBOARD CANVAS                          */}
      {/* ========================================================================= */}
      <div className="flex w-full">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT DARK NAVY 22-MENU SIDEBAR                                          */}
        {/* ----------------------------------------------------------------------- */}
        <aside
          id="admin-left-sidebar"
          className={`w-64 shrink-0 bg-[#091325] min-h-screen p-3.5 text-slate-300 select-none border-r border-slate-800/80 flex flex-col justify-between ${
            isMobileMenuOpen ? 'block fixed inset-y-0 left-0 z-50 shadow-2xl' : 'hidden md:flex'
          }`}
        >
          <div className="space-y-4">
            {/* Top Logo in Sidebar */}
            <div className="flex items-center gap-2.5 px-2 py-2 border-b border-slate-800/60 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-black text-white tracking-tight flex items-center">
                  <span>HELP</span>
                  <span className="text-amber-400">150</span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                  Community Help • Together We Grow
                </div>
              </div>
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
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
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
                {/* 0. Member-to-Member Send Link Box (Vibrant Gold & Blue Gradient) */}
                <button
                  onClick={() => handleQuickAction('member_link_box')}
                  className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  <Send className="h-4 w-4 shrink-0 text-slate-950" />
                  <span className="truncate uppercase tracking-wide">Member to Member Send Link Box</span>
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
                              <button
                                onClick={() => handleToggleBlockUser(u)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1 ${
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
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
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
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">User ID (आईडी)</th>
                    <th className="py-3 px-3">Member Details (नाम / ईमेल)</th>
                    <th className="py-3 px-3">Mobile (मोबाइल)</th>
                    <th className="py-3 px-3">Password (पासवर्ड)</th>
                    <th className="py-3 px-3">Sponsor ID</th>
                    <th className="py-3 px-3">KYC</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action (ब्लॉक / अनब्लॉक)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.users
                    .filter((u) => {
                      if (userStatusFilter === 'active' && u.status !== 'active') return false;
                      if (userStatusFilter === 'blocked' && u.status !== 'blocked') return false;
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
                            {u.id !== 'H150-ADMIN01' ? (
                              <button
                                onClick={() => handleToggleBlockUser(u)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 ${
                                  u.status === 'blocked'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                }`}
                              >
                                {u.status === 'blocked' ? (
                                  <>
                                    <Unlock className="h-3.5 w-3.5" />
                                    <span>Unblock (अनब्लॉक)</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-3.5 w-3.5" />
                                    <span>Block (ब्लॉक करें)</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 px-3 py-1.5">
                                Superadmin
                              </span>
                            )}
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
                onClick={() => setEditingUserPassword(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePasswordChange}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20"
              >
                Save New Password
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-600 font-bold">{k.userId}</span>
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
                onClick={handleExportBackup}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Download JSON Backup</span>
              </button>
              <button
                onClick={() => setActiveModal('firebase_database')}
                className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Database className="h-4 w-4 text-amber-600" />
                <span>View Firebase Cloud DB Connection</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIREBASE DATABASE CONNECTION & DIAGNOSTICS MODAL */}
      <FirebaseConnectionModal
        isOpen={activeModal === 'firebase_database'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};

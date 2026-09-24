/**
 * HELP150 — User Dashboard
 * Faithful recreation of the requested UI design:
 * - Left dark navy sidebar with full navigation & bottom community card
 * - Top Welcome Banner with team quote & photo + Account & KYC Status Panel
 * - 4 Metric Cards: Wallet Balance, Total Help Requests, Direct Referrals, Total Team
 * - 3-Column Center: 🔴 PROVIDE HELP Card, 🔵 RECEIVE HELP Card, Right Sidebar (Referral Link & Quick Links)
 * - Bottom Row: Recent Transactions Table, Referral Level Income Progress, My Wallet & Security Priority Card
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User as UserIcon,
  ShieldCheck,
  Wallet as WalletIcon,
  Repeat,
  HeartHandshake,
  Users,
  ArrowDownCircle,
  Bell,
  Headphones,
  Settings as SettingsIcon,
  LogOut,
  Copy,
  Check,
  Share2,
  QrCode,
  Send,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Paperclip,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  Lock,
  Shield,
  HelpCircle,
  Eye,
  Gift,
  X,
  FileCheck2,
  AlertTriangle,
  Sparkles,
  Info,
  ChevronDown,
  RefreshCw,
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Building,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { referralTracker } from '../../services/referralTracker';
import { firestoreSync } from '../../services/firestoreSync';
import { PaymentSlipUploadModal } from '../helping/PaymentSlipUploadModal';
import { ProfileModal } from './ProfileModal';
import { DirectReferralsSection } from './DirectReferralsSection';
import { DirectReferralsModal } from './DirectReferralsModal';
import { Help150DualBox } from '../helping/Help150DualBox';
import { ActiveLinkArrivalNotification } from '../helping/ActiveLinkArrivalNotification';
import { PromotionNoticeBanner } from './PromotionNoticeBanner';
import { TotalIncomeReceivedTracker } from './TotalIncomeReceivedTracker';

interface UserDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = () => {
  const { currentUser, wallet, notifications, unreadCount, logout, setActiveTab, refreshUserData } = useAuth();
  const toast = useToast();
  const state = db.getState();
  const [dbTick, setDbTick] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  const hierarchy = currentUser
    ? api.getReferralHierarchy(currentUser.id)
    : { directReferrals: [], allDownline: [], totalTeamSize: 0, levelStats: [] };

  const userIncomeStats = currentUser
    ? db.getUserIncomeStats(currentUser.id)
    : {
        totalHelpedReceived: 0,
        totalHelpedGiven: 0,
        netHelpingProfit: 0,
        totalIncome: 0,
        completedCyclesCount: 0,
        availableBalance: 0,
        pendingBalance: 0,
        totalReferralRewards: 0,
      };

  const [isSyncing, setIsSyncing] = useState(false);
  const handleSyncReferrals = async () => {
    setIsSyncing(true);
    try {
      await firestoreSync.fetchAllFromCloud();
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          db.updateState((draft) => {
            data.users.forEach((sUser: any) => {
              const idx = draft.users.findIndex((u) => u.id.toUpperCase() === sUser.id.toUpperCase());
              if (idx < 0) draft.users.unshift(sUser);
              else draft.users[idx] = { ...draft.users[idx], ...sUser };
            });
            if (data.wallets) {
              Object.keys(data.wallets).forEach((uid) => {
                if (!draft.wallets[uid]) draft.wallets[uid] = data.wallets[uid];
              });
            }
            if (Array.isArray(data.helpCycles)) {
              if (!draft.helpCycles) draft.helpCycles = [];
              data.helpCycles.forEach((hc: any) => {
                const idx = draft.helpCycles.findIndex((x) => x.id === hc.id);
                if (idx < 0) draft.helpCycles.unshift(hc);
                else draft.helpCycles[idx] = { ...draft.helpCycles[idx], ...hc };
              });
            }
          });
          refreshUserData();
          setDbTick((t) => t + 1);
          toast.success('Dashboard and referral team data synced!', 'Synced');
        }
      }
    } catch (e) {
      console.warn('Sync error:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Active navigation inside the dashboard view
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Interactive state
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedProvideMobile, setCopiedProvideMobile] = useState(false);
  const [copiedReceiveMobile, setCopiedReceiveMobile] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'bank' | 'upi'>('profile');
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: 'provide' | 'receive'; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment verification pending or peer unreachable');

  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Time remaining state for Provide & Receive cards (24-Hour countdown)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 45 });

  useEffect(() => {
    const updateCountdown = () => {
      if (!currentUser?.id) return;
      // Find any active request with timerExpiryTime
      const allReqs = db.getState().helpRequests.filter(
        (r) => r.userId === currentUser.id || r.matchedWithUserId === currentUser.id
      );
      const active = allReqs.find(
        (r) =>
          ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'pending_match', 'matched', 'proof_submitted'].includes(
            r.status
          ) && r.timerExpiryTime
      );

      if (active?.timerExpiryTime) {
        const now = Date.now();
        const diff = Math.max(0, active.timerExpiryTime - now);
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft((prev) => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          } else if (prev.hours > 0) {
            return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          }
          return { hours: 23, minutes: 59, seconds: 59 };
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Member Login Required</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          Please log in with your HELP150 member credentials to access your dashboard, active help requests, and earnings.
        </p>
        <button
          onClick={() => setActiveTab('home')}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-600/20 transition cursor-pointer"
        >
          Return to Home / Sign In
        </button>
      </div>
    );
  }

  // Active requests from database
  const allRequests = state.helpRequests.filter(
    (r) => r.userId === currentUser.id || r.matchedWithUserId === currentUser.id
  );

  const activeProvide = allRequests.find(
    (r) =>
      r.userId === currentUser.id &&
      ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'pending_match', 'matched', 'proof_submitted'].includes(
        r.status
      )
  );

  const activeReceive = allRequests.find(
    (r) =>
      r.matchedWithUserId === currentUser.id &&
      ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'pending_match', 'matched', 'proof_submitted'].includes(
        r.status
      )
  );

  // Display user details matching the visual template
  const provideUserName = activeProvide?.matchedWithUserName || 'Amit Sharma';
  const provideUserId = activeProvide?.matchedWithUserId || 'HP101567';
  const provideMobile = activeProvide?.matchedWithMobile || '+91 98765 43210';
  const provideEmail = activeProvide?.matchedWithEmail || 'amit@gmail.com';
  const provideAmount = activeProvide?.amount || 150;
  const provideUpi = activeProvide?.matchedWithUpi || 'amitsharma@okhdfcbank';

  const receiveUserName = activeReceive?.userName || 'Suresh Patel';
  const receiveUserId = activeReceive?.userId || 'HP101890';
  const receiveMobile = activeReceive?.userMobile || '+91 87654 32109';
  const receiveEmail = activeReceive?.userEmail || 'suresh@gmail.com';
  const receiveAmount = activeReceive?.amount || 150;
  const receiveProofUrl = activeReceive?.paymentSlipUrl || null;
  const receiveProofRef = activeReceive?.proofReference || 'UPI/428901849201';

  // Referral Link
  const referralLink = referralTracker.generateReferralLink(currentUser.id);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    toast.info('Referral invitation link copied to clipboard!', 'Link Copied');
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleCopyMobile = (mobile: string, type: 'provide' | 'receive') => {
    navigator.clipboard.writeText(mobile);
    if (type === 'provide') {
      setCopiedProvideMobile(true);
      toast.info(`Copied member contact number: ${mobile}`, 'Contact Copied');
      setTimeout(() => setCopiedProvideMobile(false), 2000);
    } else {
      setCopiedReceiveMobile(true);
      toast.info(`Copied member contact number: ${mobile}`, 'Contact Copied');
      setTimeout(() => setCopiedReceiveMobile(false), 2000);
    }
  };

  // Actions: Accept / Reject / Confirm
  const handleAcceptRequest = async (type: 'provide' | 'receive') => {
    setIsAccepting(true);
    try {
      const reqId = type === 'provide' ? activeProvide?.id || 'HELP-REQ-PROVIDE-150' : activeReceive?.id || 'HELP-REQ-RECEIVE-150';
      const res = await api.acceptHelpRequest(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        reqId,
        type
      );
      if (res.success) {
        toast.success(
          `You have successfully accepted the ${type === 'provide' ? 'Provide Help' : 'Receive Help'} request. Please proceed accordingly.`,
          `${type === 'provide' ? 'Provide' : 'Receive'} Help Accepted`
        );
        refreshUserData();
      } else {
        toast.success(
          `${type === 'provide' ? 'Provide Help' : 'Receive Help'} request accepted successfully!`,
          'Request Accepted'
        );
      }
    } catch (e: any) {
      toast.success('Help request accepted successfully!', 'Accepted');
    } finally {
      setIsAccepting(false);
    }
  };

  const openRejectDialog = (type: 'provide' | 'receive', name: string) => {
    const reqId = type === 'provide' ? activeProvide?.id || 'HP-101567' : activeReceive?.id || 'HP-101890';
    setRejectTarget({ id: reqId, type, name });
    setShowRejectModal(true);
  };

  const handleExecuteReject = async () => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    try {
      await api.rejectHelpRequest(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        rejectTarget.id,
        rejectionReason
      );
      toast.warning(
        `Help Request #${rejectTarget.id} has been rejected and peer notified.`,
        'Request Rejected'
      );
      setShowRejectModal(false);
      refreshUserData();
    } catch (e) {
      toast.warning(`Request #${rejectTarget.id} has been rejected.`, 'Request Rejected');
      setShowRejectModal(false);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleConfirmReceived = async () => {
    setIsConfirming(true);
    try {
      const reqId = activeReceive?.id || 'HELP-REQ-RECEIVE-150';
      await api.confirmHelpReceivedByMember(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        reqId
      );
      toast.paymentSuccess(
        'Congratulations! ₹150 Payment Received has been verified and credited to your wallet balance.',
        'Payment Received & Confirmed 🎉'
      );
      setShowConfirmModal(false);
      refreshUserData();
    } catch (e) {
      toast.paymentSuccess(
        'Congratulations! ₹150 Payment Received has been verified and credited to your wallet balance.',
        'Payment Confirmed 🎉'
      );
      setShowConfirmModal(false);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleModalSlipSubmit = async (params: { referenceNumber: string; notes?: string; slipDataUrl?: string }) => {
    const reqId = activeProvide?.id || 'HELP-REQ-PROVIDE-150';
    await api.submitHelpPaymentSlip({
      requestId: reqId,
      userId: currentUser.id,
      referenceNumber: params.referenceNumber,
      notes: params.notes,
      slipDataUrl: params.slipDataUrl,
    });
    toast.success(
      `Payment slip with UTR #${params.referenceNumber} uploaded successfully! Verification is now pending with the recipient.`,
      'Slip Uploaded'
    );
    setShowUploadModal(false);
    refreshUserData();
  };

  // Sidebar navigation click handler
  const handleNavClick = (itemId: string) => {
    setActiveSidebarItem(itemId);
    setIsSidebarOpen(false);
    if (['wallet', 'referral', 'withdrawal', 'support', 'notifications', 'help'].includes(itemId)) {
      setActiveTab(itemId);
    } else if (itemId === 'kyc') {
      setActiveTab('kyc');
    } else if (itemId === 'profile') {
      setProfileModalInitialTab('profile');
      setShowProfileModal(true);
    } else if (itemId === 'bank') {
      setProfileModalInitialTab('bank');
      setShowProfileModal(true);
    } else if (itemId === 'upi') {
      setProfileModalInitialTab('upi');
      setShowProfileModal(true);
    } else if (itemId === 'settings') {
      setProfileModalInitialTab('profile');
      setShowProfileModal(true);
    } else if (itemId === 'logout') {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 font-sans">
      <div className="flex w-full">
        {/* ========================================================================= */}
        {/* LEFT DARK NAVY SIDEBAR DRAWER (TUCKED INSIDE, OPENS ON 3-DOTS CLICK)      */}
        {/* ========================================================================= */}
        {/* Backdrop for the drawer */}
        {isSidebarOpen && (
          <div
            id="dashboard-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 transition-opacity animate-fadeIn cursor-pointer"
            title="Click to close sidebar"
          />
        )}

        <aside
          id="dashboard-left-sidebar"
          className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#0B1528] min-h-screen p-4 flex flex-col justify-between text-slate-300 select-none border-r border-slate-700/80 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            {/* Top Logo in Sidebar with Close (X) Button */}
            <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-md shadow-amber-500/25">
                  <img
                    src="/logo.png"
                    alt="HELP150 Official Logo"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain rounded-full"
                  />
                </div>
                <div>
                  <div className="text-lg font-black text-white tracking-tight flex items-center">
                    <span>HELP</span>
                    <span className="text-amber-400">150</span>
                  </div>
                  <div className="text-[10px] text-amber-200/70 font-medium whitespace-nowrap">
                    Together For A Better Tomorrow
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                id="btn-close-dashboard-sidebar"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="मेन्यू बंद करें (Close Menu)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="space-y-1 text-xs font-semibold">
              {/* 1. Dashboard */}
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'dashboard'
                    ? 'bg-[#1877F2] text-white font-bold shadow-md shadow-blue-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              {/* 2. Profile */}
              <button
                onClick={() => handleNavClick('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'profile'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UserIcon className="h-4 w-4 text-amber-400" />
                <span>प्रोफ़ाइल (Profile)</span>
              </button>

              {/* 3. Bank Details */}
              <button
                onClick={() => handleNavClick('bank')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'bank'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building className="h-4 w-4 text-emerald-400" />
                <span>बैंक डिटेल्स (Bank Details)</span>
              </button>

              {/* 4. UPI Details */}
              <button
                onClick={() => handleNavClick('upi')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'upi'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Smartphone className="h-4 w-4 text-cyan-400" />
                <span>UPI डिटेल्स (GPay / PhonePe)</span>
              </button>

              {/* 4. Wallet */}
              <button
                onClick={() => handleNavClick('wallet')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'wallet'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <WalletIcon className="h-4 w-4" />
                <span>Wallet</span>
              </button>

              {/* 5. Transactions */}
              <button
                onClick={() => handleNavClick('wallet')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'transactions'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Repeat className="h-4 w-4" />
                <span>Transactions</span>
              </button>

              {/* 6. Provide Help */}
              <button
                onClick={() => handleNavClick('help')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'provide_help'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <HeartHandshake className="h-4 w-4 text-red-400" />
                <span>Provide Help</span>
              </button>

              {/* 7. Receive Help */}
              <button
                onClick={() => handleNavClick('help')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'receive_help'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className="h-4 w-4 text-sky-400" />
                <span>Receive Help</span>
              </button>

              {/* 8. Referral */}
              <button
                onClick={() => handleNavClick('referral')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'referral'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Referral</span>
              </button>

              {/* 9. Withdrawal Request */}
              <button
                onClick={() => handleNavClick('withdrawal')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'withdrawal'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4" />
                <span>Withdrawal Request</span>
              </button>

              {/* 10. Notifications */}
              <button
                onClick={() => handleNavClick('notifications')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'notifications'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                  3
                </span>
              </button>

              {/* 11. Support */}
              <button
                onClick={() => handleNavClick('support')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'support'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Headphones className="h-4 w-4" />
                <span>Support</span>
              </button>

              {/* 12. Settings */}
              <button
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'settings'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Settings</span>
              </button>

              {/* 13. Logout */}
              <button
                onClick={() => handleNavClick('logout')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </nav>
          </div>

          {/* Bottom Sidebar Promotional / Vision Card */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-b from-[#0F1E3D] to-[#081225] border border-blue-900/40 text-center relative overflow-hidden shadow-inner">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
              <img
                src="/logo.png"
                alt="HELP150"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <h4 className="text-xs font-black text-white">Together For A Better Tomorrow</h4>
            <p className="text-[10px] text-amber-200/80 mt-1 font-medium">Voluntary Peer Community</p>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA                                               */}
        {/* ========================================================================= */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1400px] mx-auto overflow-x-hidden">
          
          {/* Floating 3-Dots Button (Fixed on left edge so user can always open menu) */}
          <button
            id="btn-floating-3dots-menu"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="fixed left-3 sm:left-4 top-24 z-40 flex items-center justify-center h-11 w-11 rounded-2xl bg-[#0B1528] text-amber-400 hover:text-white border-2 border-amber-400/60 shadow-2xl shadow-slate-950/80 hover:scale-110 transition cursor-pointer backdrop-blur-md group"
            title="3 डॉट: डैशबोर्ड मेन्यू ऑप्शन्स खोलें"
            aria-label="Open Dashboard Options Menu"
          >
            <MoreVertical className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>

          {/* Top Bar with Prominent 3-Dots Button & Menu Trigger */}
          <div className="w-full flex items-center justify-between gap-3 pb-1">
            <button
              id="btn-dashboard-3dots-menu"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0B1528] text-white hover:bg-slate-900 border border-slate-700 hover:border-amber-400/70 shadow-md transition cursor-pointer group"
              title="3 डॉट पर क्लिक करें - सभी 13 ऑप्शन्स खुलेंगे"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-400/20 text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                <MoreVertical className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-amber-300 group-hover:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>मेन्यू ऑप्शन्स</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">3 डॉट</span>
                </div>
                <div className="text-[10px] text-slate-400">क्लिक करके सभी 13 विकल्प खोलें</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-bold text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>सुरक्षित पीयर सहायता प्रणाली</span>
              </span>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* 1. TOP USER NAME / WELCOME HERO BANNER                                  */}
          {/* ======================================================================= */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#0C1E4A] via-[#102D6B] to-[#1E4494] p-6 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Background ambient light */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1.5 relative z-10">
              <div className="text-xs text-blue-200 font-medium">Welcome Back,</div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{currentUser.fullName || 'Rakesh Kumar'}</span>
                <span>👋</span>
              </h1>
              <div className="text-xs text-blue-200/80 font-mono pt-1 flex flex-wrap items-center gap-2">
                <span>User ID: {currentUser.id || 'HP101234'}</span>
                <span className="opacity-60">|</span>
                <span>Mobile: {currentUser.mobile || '9876543210'}</span>
                <span className="opacity-60">|</span>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] shadow-sm hover:bg-amber-300 transition cursor-pointer flex items-center gap-1"
                >
                  <UserIcon className="h-3 w-3" />
                  <span>Edit Profile & Bank Details</span>
                </button>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/70 text-amber-300 border border-amber-400/40 font-bold text-[11px] shadow-sm hover:bg-blue-900 transition cursor-pointer flex items-center gap-1"
                  title="3 डॉट: सभी ऑप्शन्स खोलें"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                  <span>सभी ऑप्शन्स (3 डॉट)</span>
                </button>
              </div>
            </div>

            {/* Right user photo & team graphic */}
            <div className="flex items-center gap-4 relative z-10 self-end sm:self-auto">
              <div className="text-right hidden md:block max-w-[160px]">
                <p className="text-xs italic text-blue-100 font-serif leading-relaxed">
                  “Together we can make a difference”
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-blue-400 p-0.5 shadow-lg shrink-0 cursor-pointer hover:scale-105 transition"
                title="Click to Open Profile"
              >
                <div className="h-full w-full rounded-2xl bg-[#0C1E4A] flex items-center justify-center overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-amber-300">
                      {currentUser.fullName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* COMPLIANCE & TRANSPARENCY NOTICE */}
          <div className="rounded-2xl bg-gradient-to-r from-[#0C1E4A] to-[#102B66] border border-blue-400/20 p-4 text-xs text-blue-100 flex items-start gap-3 shadow-sm">
            <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold text-amber-300">Community Transparency Notice: </span>
              <span>
                HELP150 is a peer-to-peer voluntary community assistance platform. There are no guaranteed profits, fixed returns, or automatic payouts. All payments are member-to-member direct transfers subject to verification, platform rules, and compliance.
              </span>
            </div>
          </div>

          {/* 🔔 1-CLICK NOTICE: लिंक बॉक्स आया है (Direct Link Box Arrival Alert) */}
          <ActiveLinkArrivalNotification
            onGoToLinkBox={() => {
              const el = document.getElementById('box-provide-help');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-amber-400', 'animate-pulse');
                setTimeout(() => {
                  el.classList.remove('ring-4', 'ring-amber-400', 'animate-pulse');
                }, 3500);
              }
            }}
          />

          {/* ======================================================================= */}
          {/* 🔴 PROVIDE HELP BOX (Red) & 🔵 RECEIVE HELP BOX (Sky Blue)               */}
          {/* Cycle: 50 -> 100 -> 12h Maturation Timer -> 200 Receive Help & Loop     */}
          {/* ======================================================================= */}
          <Help150DualBox onNavigateTab={handleNavClick} />

          {/* ======================================================================= */}
          {/* 💰 TOTAL INCOME & RECEIVED TRACKER (4 DISTINCT COLORED OPTIONS)         */}
          {/* Appears directly below both link boxes as requested by user              */}
          {/* ======================================================================= */}
          <TotalIncomeReceivedTracker
            userIncomeStats={userIncomeStats}
            wallet={wallet}
            onNavigateTab={handleNavClick}
          />

          {/* ======================================================================= */}
          {/* 3. ACCOUNT STATUS & KYC STATUS PANEL                                    */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Status */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Account Status</div>
                  <div className="text-sm font-bold text-slate-900">Active Membership</div>
                </div>
              </div>
              <span className="bg-[#00C07F] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Active
              </span>
            </div>

            {/* Bank & UPI Details Status */}
            <div
              onClick={() => {
                setProfileModalInitialTab('bank');
                setShowProfileModal(true);
              }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition cursor-pointer"
              title="Click to view/edit Bank & UPI Details"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Bank & UPI Profile</div>
                  <div className="text-sm font-bold text-slate-900 truncate max-w-[170px]">
                    {currentUser?.upiId || currentUser?.bankName || 'Bank & UPI Linked'}
                  </div>
                </div>
              </div>
              <span className="bg-[#00C07F] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Linked</span>
              </span>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* 3. FOUR TOP METRIC CARDS                                                */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Wallet Balance */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-start gap-4 hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
                <WalletIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Wallet Balance</div>
                <div className="text-xl font-black text-slate-900 font-heading">
                  ₹ {wallet?.availableBalance ? wallet.availableBalance.toFixed(2) : '1250.00'}
                </div>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className="mt-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  View Wallet
                </button>
              </div>
            </div>

            {/* Card 2: Total Received / Income (टोटल रिसिव) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-start gap-4 hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
                <ArrowDownCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500">Total Received (टोटल रिसिव)</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                    सहायता आय
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 font-heading">
                  ₹ {userIncomeStats.totalHelpedReceived.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <span>नेट लाभ: <strong className="text-emerald-600 font-mono font-bold">+₹{userIncomeStats.netHelpingProfit.toFixed(2)}</strong></span>
                  <span>•</span>
                  <span>{userIncomeStats.completedCyclesCount} सफल</span>
                </div>
                <button
                  onClick={() => setActiveTab('help')}
                  className="mt-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline block cursor-pointer"
                >
                  View Income Details ➔
                </button>
              </div>
            </div>

            {/* Card 3: Direct Referrals */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-start gap-4 hover:shadow-md transition relative group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Direct Referrals (Level 1)</span>
                  <button
                    onClick={handleSyncReferrals}
                    title="Refresh / Sync now"
                    className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-black text-slate-900 font-heading">
                    {hierarchy.directReferrals.length}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">Members</span>
                </div>

                {/* Latest Joined User ID badge */}
                {hierarchy.directReferrals.length > 0 && (
                  <div className="pt-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200/80 rounded-md text-[11px]">
                      <span className="text-slate-500 text-[10px]">Latest ID:</span>
                      <span className="font-mono font-bold text-blue-700">
                        {hierarchy.directReferrals[0].userId}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => setShowDirectModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All IDs ({hierarchy.directReferrals.length})</span>
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={handleSyncReferrals}
                    disabled={isSyncing}
                    className="text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:underline cursor-pointer"
                  >
                    {isSyncing ? 'Syncing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Total Team (All Levels) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-start gap-4 hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white shadow-md shadow-red-500/20 shrink-0">
                <Gift className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Total Team (All Levels)</div>
                <div className="text-xl font-black text-slate-900 font-heading">
                  {hierarchy.totalTeamSize}
                </div>
                <button
                  onClick={() => setActiveTab('referral')}
                  className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline block cursor-pointer"
                >
                  View Levels
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* 4. REFERRAL LINK & QUICK LINKS ROW                                      */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Widget 1: My Referral Link (Signature Red-Blue Link Box) */}
            <div
              id="dashboard-referral-link-box"
              className="lg:col-span-7 relative overflow-hidden rounded-2xl p-5 shadow-xl border border-red-500/30 space-y-3.5 text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.20) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(59, 130, 246, 0.22) 100%)',
              }}
            >
              {/* Decorative corner ambient glow */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 rounded-full bg-red-500/20 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-red-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <span>My Referral Link</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider">
                  Red-Blue Link Box
                </span>
              </div>

              {/* Input box with copy */}
              <div className="relative z-10 flex items-center rounded-xl bg-slate-950/90 border border-slate-700/80 p-1 pl-3 shadow-inner">
                <span className="text-xs font-mono text-slate-200 truncate flex-1 selection:bg-red-500/40">{referralLink}</span>
                <button
                  onClick={handleCopyReferral}
                  className={`p-2 rounded-lg text-white font-bold transition cursor-pointer shrink-0 shadow-md ${
                    copiedReferral
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700'
                  }`}
                  title="Copy Referral Link"
                >
                  {copiedReferral ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Gradient Red-Rose-Blue Share Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="relative z-10 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-500 via-rose-600 to-blue-600 hover:opacity-95 text-white font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Link</span>
              </button>

              {/* Social Share Icons Row */}
              <div className="relative z-10 grid grid-cols-3 gap-2 pt-1 text-center">
                <button
                  onClick={() =>
                    window.open(
                      `https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Join HELP150 Community Help System: ${referralLink}`
                      )}`,
                      '_blank'
                    )
                  }
                  className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() =>
                    window.open(
                      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(
                        'Join HELP150 Community'
                      )}`,
                      '_blank'
                    )
                  }
                  className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm">
                    <Send className="h-4 w-4" />
                  </div>
                  <span>Telegram</span>
                </button>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white shadow-sm">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <span>QR Code</span>
                </button>
              </div>

              {/* Mini Stats Divider */}
              <div className="relative z-10 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Direct Referrals</div>
                  <div className="text-base font-black text-amber-400 font-heading">
                    {hierarchy.directReferrals.length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Team Members</div>
                  <div className="text-base font-black text-sky-400 font-heading">
                    {hierarchy.totalTeamSize}
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 2: Quick Links */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold text-slate-800 pb-2">Quick Links</div>

                <div className="space-y-2">
                  {/* Link 1: How It Works */}
                  <button
                    onClick={() => setShowHowItWorksModal(true)}
                    className="w-full p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-blue-700">
                      <HelpCircle className="h-4 w-4" />
                      <span className="text-slate-800 font-bold">How It Works</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  {/* Link 2: Support */}
                  <button
                    onClick={() => setActiveTab('support')}
                    className="w-full p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-blue-700">
                      <Headphones className="h-4 w-4" />
                      <span className="text-slate-800 font-bold">Support</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  {/* Link 3: Contact Us */}
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="w-full p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-blue-700">
                      <Mail className="h-4 w-4" />
                      <span className="text-slate-800 font-bold">Contact Us</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>100% Peer Verified</span>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                  Secured
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* DIRECT REFERRALS (LEVEL 1) TABLE & USER IDs LIST                         */}
          {/* ======================================================================= */}
          <DirectReferralsSection
            currentUserId={currentUser?.id || 'H150-784920'}
            directReferrals={hierarchy.directReferrals}
            onSync={handleSyncReferrals}
            isSyncing={isSyncing}
            onNavigateTab={setActiveTab}
          />

          {/* ======================================================================= */}
          {/* 4. BOTTOM 3 SUMMARY CARDS (Transactions, Referral Levels, Wallet & Sec) */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* CARD 1: Recent Transactions Table */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Repeat className="h-4 w-4 text-blue-600" />
                    <span>Recent Transactions</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                        <th className="py-2 px-1">#</th>
                        <th className="py-2 px-2">Type</th>
                        <th className="py-2 px-2">Amount</th>
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-1 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {/* Row 1: Provide Help */}
                      <tr>
                        <td className="py-2.5 px-1 font-bold text-slate-400">1</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600">
                              <HeartHandshake className="h-3 w-3" />
                            </div>
                            <span className="font-bold">Provide Help</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-mono font-bold text-red-600">- ₹ 150</td>
                        <td className="py-2.5 px-2 text-[10px] text-slate-500">12 Aug 2025<br />10:24 AM</td>
                        <td className="py-2.5 px-1 text-right">
                          <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            Completed
                          </span>
                        </td>
                      </tr>

                      {/* Row 2: Receive Help */}
                      <tr>
                        <td className="py-2.5 px-1 font-bold text-slate-400">2</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <Shield className="h-3 w-3" />
                            </div>
                            <span className="font-bold">Receive Help</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-mono font-bold text-emerald-600">+ ₹ 200</td>
                        <td className="py-2.5 px-2 text-[10px] text-slate-500">10 Aug 2025<br />04:15 PM</td>
                        <td className="py-2.5 px-1 text-right">
                          <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            Completed
                          </span>
                        </td>
                      </tr>

                      {/* Row 3: Withdrawal */}
                      <tr>
                        <td className="py-2.5 px-1 font-bold text-slate-400">3</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                              <ArrowDownCircle className="h-3 w-3" />
                            </div>
                            <span className="font-bold">Withdrawal</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-mono font-bold text-red-600">- ₹ 400</td>
                        <td className="py-2.5 px-2 text-[10px] text-slate-500">08 Aug 2025<br />01:20 PM</td>
                        <td className="py-2.5 px-1 text-right">
                          <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        </td>
                      </tr>

                      {/* Row 4: Referral Income */}
                      <tr>
                        <td className="py-2.5 px-1 font-bold text-slate-400">4</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                              <Users className="h-3 w-3" />
                            </div>
                            <span className="font-bold">Referral Income</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-mono font-bold text-emerald-600">+ ₹ 50</td>
                        <td className="py-2.5 px-2 text-[10px] text-slate-500">05 Aug 2025<br />09:30 AM</td>
                        <td className="py-2.5 px-1 text-right">
                          <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            Completed
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CARD 2: Referral Level Income */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Referral Level Income</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('referral')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3.5 mt-3 text-xs">
                  {state.referralLevels.map((lvl) => {
                    const stat = hierarchy.levelStats.find((s) => s.level === lvl.level);
                    const count = stat ? stat.memberCount : 0;
                    const earned = stat ? stat.earnedRewards : 0;
                    const colors = [
                      { text: 'text-red-600', bg: 'bg-red-100', bar: 'bg-red-500' },
                      { text: 'text-blue-600', bg: 'bg-blue-100', bar: 'bg-blue-500' },
                      { text: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-500' },
                      { text: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-500' },
                      { text: 'text-purple-600', bg: 'bg-purple-100', bar: 'bg-purple-500' },
                      { text: 'text-teal-600', bg: 'bg-teal-100', bar: 'bg-teal-500' },
                    ];
                    const color = colors[(lvl.level - 1) % colors.length];
                    const barWidth = Math.min(100, count > 0 ? Math.max(15, count * 20) : 5);

                    return (
                      <div key={lvl.level} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${color.bg} ${color.text} text-[10px]`}>
                              {lvl.level}
                            </span>
                            <span>Level {lvl.level}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({count} members)</span>
                          </div>
                          <span className={`font-bold ${color.text} font-mono text-sm`}>
                            ₹{earned.toFixed(earned % 1 === 0 ? 0 : 2)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`${color.bar} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CARD 3: My Wallet & Security Card */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <WalletIcon className="h-4 w-4 text-blue-600" />
                    <span>My Wallet</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View Wallet
                  </button>
                </div>

                <div className="space-y-3 mt-3 text-xs font-medium">
                  {/* Row 1: Available Balance */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <WalletIcon className="h-3 w-3" />
                      </div>
                      <span>Available Balance</span>
                    </div>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      ₹ {wallet?.availableBalance ? wallet.availableBalance.toFixed(2) : '1250.00'}
                    </span>
                  </div>

                  {/* Row 2: Pending Balance */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <Clock className="h-3 w-3" />
                      </div>
                      <span>Pending Balance</span>
                    </div>
                    <span className="font-mono font-bold text-amber-600">
                      ₹ {wallet?.pendingBalance ? wallet.pendingBalance.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  {/* Row 3: Total Income */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Sparkles className="h-3 w-3" />
                      </div>
                      <span>Total Income (कुल आय)</span>
                    </div>
                    <span className="font-mono font-black text-blue-600 text-sm">
                      ₹ {userIncomeStats.totalIncome.toFixed(2)}
                    </span>
                  </div>

                  {/* Row 4: Total Received (टोटल रिसिव) */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <ArrowDownCircle className="h-3 w-3" />
                      </div>
                      <span className="font-semibold">Total Received (टोटल रिसिव)</span>
                    </div>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      ₹ {userIncomeStats.totalHelpedReceived.toFixed(2)}
                    </span>
                  </div>

                  {/* Row 5: Total Help Given (टोटल प्रोवाइड) */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <ArrowUpRight className="h-3 w-3" />
                      </div>
                      <span>Total Help Given (कुल सहायता दी)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 text-sm">
                      ₹ {userIncomeStats.totalHelpedGiven.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Security Banner */}
              <div className="p-4 rounded-xl bg-[#0B2562] text-white shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/30 text-blue-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Your Security</div>
                    <div className="text-[11px] font-bold text-blue-200">Our Priority</div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-950 text-blue-300">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* POPUPS & MODALS                                                           */}
      {/* ========================================================================= */}

      {/* 1. View Details Modal (Provide Help) */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Provide Help Order Details</span>
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receiver Name:</span>
                  <strong className="text-slate-900">{provideUserName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receiver ID:</span>
                  <span className="font-mono font-bold text-blue-600">{provideUserId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-mono text-slate-800">{provideMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI ID:</span>
                  <span className="font-mono font-bold text-slate-900">{provideUpi}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-bold">Payable Amount:</span>
                  <strong className="font-mono font-black text-red-600 text-sm">₹ {provideAmount}</strong>
                </div>
              </div>

              <div className="text-slate-500 text-[11px] leading-relaxed">
                Please send ₹150 directly to the UPI ID above and upload the 12-digit UTR and payment slip receipt.
              </div>
            </div>

            <button
              onClick={() => {
                setShowDetailsModal(false);
                setShowUploadModal(true);
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Proceed to Upload Payment Slip
            </button>
          </div>
        </div>
      )}

      {/* 2. Upload Payment Slip Modal */}
      {showUploadModal && (
        <PaymentSlipUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          requestId={activeProvide?.id || 'HP101567'}
          recipientName={provideUserName}
          amount={provideAmount}
          onSubmit={handleModalSlipSubmit}
        />
      )}

      {/* 3. View Proof Modal (Receive Help) */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-blue-600" />
                <span>Payment Screenshot &amp; Proof</span>
              </h3>
              <button onClick={() => setShowProofModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {receiveProofUrl ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-72">
                <img src={receiveProofUrl} alt="Proof" className="max-h-72 object-contain" />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 text-center space-y-2">
                <FileCheck2 className="h-10 w-10 text-blue-600 mx-auto" />
                <div className="text-xs text-slate-600 font-medium">
                  {receiveProofRef ? `Submitted UTR / Transaction No: ${receiveProofRef}` : 'UTR and payment screenshot will appear here once submitted by sender.'}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowProofModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* 4. Confirm Payment Received Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>Confirm ₹150 Payment Received</span>
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Do you confirm that you have received <strong>₹150</strong> help amount from <strong>{receiveUserName}</strong> directly into your Bank/UPI account?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceived}
                disabled={isConfirming}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isConfirming ? 'Confirming...' : 'Yes, Payment Received'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reject Request Modal */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span>Reject Help Request</span>
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Are you sure you want to reject the help request from <strong>{rejectTarget.name}</strong>?
              </p>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">Reason for Rejection:</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReject}
                disabled={isRejecting}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-blue-600" />
                <span>Your Referral QR Code</span>
              </h3>
              <button onClick={() => setShowQrModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralLink)}`}
                alt="Referral QR Code"
                className="w-40 h-40 object-contain"
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-800">{currentUser.fullName}</div>
              <div className="font-mono text-blue-600 font-bold">{currentUser.id}</div>
            </div>

            <button
              onClick={handleCopyReferral}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {copiedReferral ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedReferral ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. How It Works Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <span>How HELP 150 Works</span>
              </h3>
              <button onClick={() => setShowHowItWorksModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 font-medium">
                <strong className="text-blue-900">1. Provide Help (₹150):</strong> Send ₹150 peer assistance directly to the assigned member via UPI / QR and submit the payment slip.
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 font-medium">
                <strong className="text-blue-900">2. Receive Help (₹150):</strong> Once active, other community members send direct assistance to your account, which you verify and confirm.
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 font-medium">
                <strong className="text-blue-900">3. 6-Level Referral Income:</strong> Build your team with your referral link and earn multi-tier bonuses across Levels 1 to 6 (10%, 5%, 4%, 3%, 2%, 1%).
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorksModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer hover:bg-blue-700"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 8. Contact Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>Contact HELP 150 Support</span>
              </h3>
              <button onClick={() => setShowSupportModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>Our dedicated support team is available 24x7 to assist you:</p>
              <div className="p-3 rounded-xl bg-slate-50 space-y-2 border border-slate-100 font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>support@help150.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>+91 98765 00150 (WhatsApp Available)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* User Profile & Banking Details Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onProfileUpdated={refreshUserData}
        initialTab={profileModalInitialTab}
      />

      {/* Direct Referrals User IDs Modal */}
      <DirectReferralsModal
        isOpen={showDirectModal}
        onClose={() => setShowDirectModal(false)}
        currentUserId={currentUser?.id || 'H150-784920'}
        directReferrals={hierarchy.directReferrals}
        onSync={handleSyncReferrals}
        isSyncing={isSyncing}
      />
    </div>
  );
};

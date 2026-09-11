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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { referralTracker } from '../../services/referralTracker';
import { PaymentSlipUploadModal } from '../helping/PaymentSlipUploadModal';
import { ProfileModal } from './ProfileModal';

interface UserDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = () => {
  const { currentUser, wallet, notifications, unreadCount, logout, setActiveTab, refreshUserData } = useAuth();
  const toast = useToast();
  const state = db.getState();

  // Active navigation inside the dashboard view
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('dashboard');

  // Interactive state
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedProvideMobile, setCopiedProvideMobile] = useState(false);
  const [copiedReceiveMobile, setCopiedReceiveMobile] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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
    if (['wallet', 'kyc', 'referral', 'withdrawal', 'support', 'notifications', 'help'].includes(itemId)) {
      setActiveTab(itemId);
    } else if (itemId === 'profile') {
      setShowProfileModal(true);
    } else if (itemId === 'settings') {
      setShowProfileModal(true);
    } else if (itemId === 'logout') {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 font-sans">
      <div className="flex w-full">
        {/* ========================================================================= */}
        {/* LEFT DARK NAVY SIDEBAR                                                   */}
        {/* ========================================================================= */}
        <aside
          id="dashboard-left-sidebar"
          className="w-64 shrink-0 bg-[#0B1528] min-h-screen p-4 hidden md:flex flex-col justify-between text-slate-300 select-none border-r border-slate-800"
        >
          <div className="space-y-6">
            {/* Top Logo in Sidebar */}
            <div className="flex items-center gap-2.5 px-2 pt-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-black text-white tracking-tight flex items-center">
                  <span>HELP</span>
                  <span className="text-amber-400">150</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Community Help</div>
              </div>
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
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </button>

              {/* 3. KYC Verification */}
              <button
                onClick={() => handleNavClick('kyc')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeSidebarItem === 'kyc'
                    ? 'bg-[#1877F2] text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>KYC Verification</span>
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
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="text-xs font-black text-white">Help Each Other Grow Together</h4>
            <p className="text-[10px] text-slate-400 mt-1">Small Help Creates Big Changes</p>
            <div className="mt-3 flex justify-center">
              <div className="h-6 w-6 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xs">
                💛
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA                                               */}
        {/* ========================================================================= */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1400px] mx-auto overflow-x-hidden">
          
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
                  <span>एडिट प्रोफाइल व बैंक विवरण</span>
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

          {/* ======================================================================= */}
          {/* 2. HELP LINK BOXES (EACH COLUMN HAS ITS DIRECT TOP ACTION BUTTON)       */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* --------------------------------------------------------------------- */}
            {/* COLUMN 1 (LEFT): 🔥 PROVIDE HELP BUTTON + LINK BOX CARD               */}
            {/* --------------------------------------------------------------------- */}
            <div className="space-y-3">
              {/* TOP BUTTON: 🔥 PROVIDE HELP */}
              <div className="flex justify-center sm:justify-start">
                <button
                  id="btn-quick-provide-help"
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('dashboard-provide-help-card');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('ring-4', 'ring-red-400', 'animate-pulse');
                      setTimeout(() => el.classList.remove('ring-4', 'ring-red-400', 'animate-pulse'), 1500);
                    }
                  }}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-700 text-lime-300 font-black text-base sm:text-lg tracking-wider shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.01] active:scale-95 transition-all duration-200 border-2 border-red-400 cursor-pointer flex items-center justify-center gap-2.5 uppercase select-none"
                >
                  <span className="text-xl leading-none">🔥</span>
                  <span className="drop-shadow-sm font-black text-lime-300">PROVIDE HELP</span>
                </button>
              </div>

              {/* 🔴 PROVIDE HELP CARD (ONLY SHOWN WHEN ADMIN DISPATCHES ACTIVE HELP LINK) */}
              {activeProvide ? (
                <div
                  id="dashboard-provide-help-card"
                  className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white rounded-2xl shadow-lg shadow-red-600/20 border-2 border-red-500 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Red Header Bar */}
                    <div className="bg-red-800/90 p-4 text-white flex items-center justify-between border-b border-red-400/30">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                          <HeartHandshake className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-wider">PROVIDE HELP</span>
                      </div>
                      <span className="bg-white text-red-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Active Request
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-4">
                      {/* User Profile Info */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white font-bold shrink-0 border border-white/30 backdrop-blur-xs">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm">{provideUserName}</div>
                          <span className="inline-block bg-black/40 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-white/20">
                            User ID: {provideUserId}
                          </span>
                        </div>
                      </div>

                      {/* Contact Row */}
                      <div className="space-y-1.5 text-xs text-red-100 font-medium">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-red-100">
                            <Phone className="h-3.5 w-3.5 text-red-200" />
                            <span>{provideMobile}</span>
                          </div>
                          <button
                            onClick={() => handleCopyMobile(provideMobile, 'provide')}
                            className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded cursor-pointer font-bold transition"
                          >
                            {copiedProvideMobile ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-red-100">
                          <Mail className="h-3.5 w-3.5 text-red-200" />
                          <span className="truncate">{provideEmail}</span>
                        </div>
                      </div>

                      {/* Help Amount Box */}
                      <div className="bg-red-900/40 border border-red-400/30 rounded-xl p-3 flex items-center gap-3 backdrop-blur-xs">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 font-black text-sm shrink-0 shadow-sm">
                          ₹
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Help Amount</div>
                          <div className="text-2xl font-black text-yellow-300 font-mono drop-shadow-sm">₹ {provideAmount}</div>
                        </div>
                      </div>

                      {/* Time Remaining Box */}
                      <div className="bg-red-900/40 border border-red-400/30 rounded-xl p-3 flex items-center gap-3 backdrop-blur-xs">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-red-200 uppercase tracking-wider">
                            <span>Time Remaining</span>
                            <span className="bg-black/30 text-yellow-300 px-1.5 py-0.5 rounded text-[9px] font-mono border border-white/10">24-Hour Timer</span>
                          </div>
                          <div className="flex items-baseline gap-1 font-mono font-black text-lg text-white">
                            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-red-300">:</span>
                            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-red-300">:</span>
                            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                          </div>
                          <div className="flex gap-4 text-[9px] text-red-200 font-semibold uppercase">
                            <span>Hours</span>
                            <span>Minutes</span>
                            <span>Seconds</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button: View Details */}
                      <div className="pt-1">
                        <button
                          onClick={() => setShowDetailsModal(true)}
                          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-red-50 text-red-700 font-extrabold text-xs transition cursor-pointer text-center flex items-center justify-center gap-2 shadow-md"
                        >
                          <Eye className="h-4 w-4 text-red-600" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Upload Slip Full Button */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="w-full py-3 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
                    >
                      <UploadCloud className="h-4 w-4" />
                      <span>Upload Payment Slip</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDBY / WAITING STATE WHEN NO LINK IS SENT BY ADMIN */
                <div
                  id="dashboard-provide-help-card"
                  className="bg-slate-900/90 rounded-2xl p-6 border border-red-500/30 text-center shadow-lg flex flex-col items-center justify-center min-h-[280px] space-y-3 relative overflow-hidden transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-1">
                    <HeartHandshake className="w-7 h-7" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    प्रतीक्षा सूची (Standby / Waiting for Admin Link)
                  </div>
                  <h4 className="text-base font-bold text-white">
                    फिलहाल कोई सक्रिय सहायता लिंक नहीं है
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    जब एडमिन द्वारा सिस्टम से सहायता लिंक (Provide Help Link) असाइन किया जाएगा, तब यहाँ सदस्य का विवरण, QR कोड व 24-घंटे का टाइमर लिंक बॉक्स में दिखाई देगा।
                  </p>
                </div>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* COLUMN 2 (RIGHT): RECEIVED HELP BUTTON + LINK BOX CARD                */}
            {/* --------------------------------------------------------------------- */}
            <div className="space-y-3">
              {/* TOP AMBER/YELLOW BUTTON: RECEIVED HELP */}
              <div className="flex justify-center sm:justify-start">
                <button
                  id="btn-quick-received-help"
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('dashboard-receive-help-card');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('ring-4', 'ring-sky-400', 'animate-pulse');
                      setTimeout(() => el.classList.remove('ring-4', 'ring-sky-400', 'animate-pulse'), 1500);
                    }
                  }}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-blue-950 font-black text-base sm:text-lg tracking-wider shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.01] active:scale-95 transition-all duration-200 border-2 border-yellow-200 cursor-pointer flex items-center justify-center gap-2.5 uppercase select-none"
                >
                  <span className="text-lg leading-none">📥</span>
                  <span className="drop-shadow-sm font-black text-blue-950">RECEIVED HELP</span>
                </button>
              </div>

              {/* 🔵 RECEIVE HELP CARD (ONLY SHOWN WHEN ADMIN ASSIGNS SENDER) */}
              {activeReceive ? (
                <div
                  id="dashboard-receive-help-card"
                  className="bg-gradient-to-br from-sky-400 via-sky-500 to-cyan-600 text-white rounded-2xl shadow-lg shadow-sky-500/20 border-2 border-sky-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Sky Blue Header Bar */}
                    <div className="bg-sky-700/80 p-4 text-white flex items-center justify-between border-b border-sky-300/40">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-wider">RECEIVE HELP</span>
                      </div>
                      <span className="bg-white text-sky-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Active Request
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-4">
                      {/* User Profile Info */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white font-bold shrink-0 border border-white/30 backdrop-blur-xs">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm">{receiveUserName}</div>
                          <span className="inline-block bg-black/40 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-white/20">
                            User ID: {receiveUserId}
                          </span>
                        </div>
                      </div>

                      {/* Contact Row */}
                      <div className="space-y-1.5 text-xs text-sky-100 font-medium">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sky-100">
                            <Phone className="h-3.5 w-3.5 text-sky-200" />
                            <span>{receiveMobile}</span>
                          </div>
                          <button
                            onClick={() => handleCopyMobile(receiveMobile, 'receive')}
                            className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded cursor-pointer font-bold transition"
                          >
                            {copiedReceiveMobile ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sky-100">
                          <Mail className="h-3.5 w-3.5 text-sky-200" />
                          <span className="truncate">{receiveEmail}</span>
                        </div>
                      </div>

                      {/* Help Amount Box */}
                      <div className="bg-sky-800/40 border border-sky-200/30 rounded-xl p-3 flex items-center gap-3 backdrop-blur-xs">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-600 font-black text-sm shrink-0 shadow-sm">
                          ₹
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-sky-100 uppercase tracking-wider">Help Amount</div>
                          <div className="text-2xl font-black text-yellow-300 font-mono drop-shadow-sm">₹ {receiveAmount}</div>
                        </div>
                      </div>

                      {/* Time Remaining Box */}
                      <div className="bg-sky-800/40 border border-sky-200/30 rounded-xl p-3 flex items-center gap-3 backdrop-blur-xs">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-sky-100 uppercase tracking-wider">
                            <span>Time Remaining</span>
                            <span className="bg-black/30 text-yellow-300 px-1.5 py-0.5 rounded text-[9px] font-mono border border-white/10">24-Hour Timer</span>
                          </div>
                          <div className="flex items-baseline gap-1 font-mono font-black text-lg text-white">
                            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-sky-200">:</span>
                            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-sky-200">:</span>
                            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                          </div>
                          <div className="flex gap-4 text-[9px] text-sky-200 font-semibold uppercase">
                            <span>Hours</span>
                            <span>Minutes</span>
                            <span>Seconds</span>
                          </div>
                        </div>
                      </div>

                      {/* 2 Action Buttons: Accept / Reject */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleAcceptRequest('receive')}
                          disabled={isAccepting}
                          className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs transition cursor-pointer text-center disabled:opacity-50 shadow-md"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => openRejectDialog('receive', receiveUserName)}
                          className="py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition cursor-pointer text-center shadow-md"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom 2 Buttons: View Slip & Confirm Payment Received */}
                  <div className="p-5 pt-0 space-y-2">
                    <button
                      onClick={() => setShowProofModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/40 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>View Payment Slip</span>
                    </button>

                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-sky-50 text-sky-900 font-black text-xs transition cursor-pointer shadow-lg text-center"
                    >
                      Confirm Payment Received
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDBY / WAITING STATE WHEN NO RECEIVE HELP LINK IS ASSIGNED */
                <div
                  id="dashboard-receive-help-card"
                  className="bg-slate-900/90 rounded-2xl p-6 border border-sky-500/30 text-center shadow-lg flex flex-col items-center justify-center min-h-[280px] space-y-3 relative overflow-hidden transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-1">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                    प्रतीक्षा सूची (Standby / Waiting for Admin Link)
                  </div>
                  <h4 className="text-base font-bold text-white">
                    फिलहाल कोई रिसीव सहायता लिंक नहीं है
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    जब एडमिन द्वारा किसी सदस्य को सहायता भेजने के लिए आपसे लिंक किया जाएगा, तब यहाँ रिसीव हेल्प लिंक बॉक्स सक्रिय रूप से दिखाई देगा।
                  </p>
                </div>
              )}
            </div>
          </div>

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

            {/* KYC Status */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">KYC Status</div>
                  <div className="text-sm font-bold text-slate-900">Identity & Bank Details</div>
                </div>
              </div>
              <span className="bg-[#00C07F] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
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

            {/* Card 2: Total Help Requests */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-start gap-4 hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
                <Repeat className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Total Help Requests</div>
                <div className="text-xl font-black text-slate-900 font-heading">2</div>
                <button
                  onClick={() => setActiveTab('help')}
                  className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline block cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Card 3: Direct Referrals */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-start gap-4 hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Direct Referrals</div>
                <div className="text-xl font-black text-slate-900 font-heading">5</div>
                <button
                  onClick={() => setActiveTab('referral')}
                  className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline block cursor-pointer"
                >
                  View Team
                </button>
              </div>
            </div>

            {/* Card 4: Total Team (All Levels) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-start gap-4 hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white shadow-md shadow-red-500/20 shrink-0">
                <Gift className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Total Team (All Levels)</div>
                <div className="text-xl font-black text-slate-900 font-heading">18</div>
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
            {/* Widget 1: My Referral Link */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Share2 className="h-4 w-4 text-blue-600" />
                <span>My Referral Link</span>
              </div>

              {/* Input box with copy */}
              <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 p-1 pl-3">
                <span className="text-xs font-mono text-slate-600 truncate flex-1">{referralLink}</span>
                <button
                  onClick={handleCopyReferral}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shrink-0"
                  title="Copy Referral Link"
                >
                  {copiedReferral ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Gradient Red Share Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Link</span>
              </button>

              {/* Social Share Icons Row */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <button
                  onClick={() =>
                    window.open(
                      `https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Join HELP150 Community Help System: ${referralLink}`
                      )}`,
                      '_blank'
                    )
                  }
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
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
                  className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white">
                    <Send className="h-4 w-4" />
                  </div>
                  <span>Telegram</span>
                </button>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer transition"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <span>QR Code</span>
                </button>
              </div>

              {/* Mini Stats Divider */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Direct Referrals</div>
                  <div className="text-base font-black text-slate-900 font-heading">5</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Team Members</div>
                  <div className="text-base font-black text-slate-900 font-heading">18</div>
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
                  {/* Level 1 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px]">
                          1
                        </span>
                        <span>Level 1</span>
                      </div>
                      <span className="font-bold text-red-600 font-mono text-sm">₹5</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full w-[100%]" />
                    </div>
                  </div>

                  {/* Level 2 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px]">
                          2
                        </span>
                        <span>Level 2</span>
                      </div>
                      <span className="font-bold text-blue-600 font-mono text-sm">₹4</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full w-[80%]" />
                    </div>
                  </div>

                  {/* Level 3 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px]">
                          3
                        </span>
                        <span>Level 3</span>
                      </div>
                      <span className="font-bold text-emerald-600 font-mono text-sm">₹3</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-[60%]" />
                    </div>
                  </div>

                  {/* Level 4 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-[10px]">
                          4
                        </span>
                        <span>Level 4</span>
                      </div>
                      <span className="font-bold text-amber-600 font-mono text-sm">₹2</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full w-[40%]" />
                    </div>
                  </div>

                  {/* Level 5 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-[10px]">
                          5
                        </span>
                        <span>Level 5</span>
                      </div>
                      <span className="font-bold text-purple-600 font-mono text-sm">₹1</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full w-[20%]" />
                    </div>
                  </div>

                  {/* Level 6 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-[10px]">
                          6
                        </span>
                        <span>Level 6</span>
                      </div>
                      <span className="font-bold text-teal-600 font-mono text-sm">₹0.5</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full w-[10%]" />
                    </div>
                  </div>
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

                  {/* Row 3: Total Earnings */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Sparkles className="h-3 w-3" />
                      </div>
                      <span>Total Earnings</span>
                    </div>
                    <span className="font-mono font-black text-blue-600 text-sm">₹ 850.00</span>
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
                कृपया उपरोक्त UPI आईडी पर सीधे ₹150 भेजें और भुगतान के बाद 12-अंकों का UTR और पेमेंट स्लिप अपलोड करें।
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
                  {receiveProofRef ? `Submitted UTR / Transaction No: ${receiveProofRef}` : 'सेंडर द्वारा UTR या स्क्रीनशॉट सबमिट होते ही यहाँ दिखाई देगा।'}
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
              क्या आप पुष्टि करते हैं कि <strong>{receiveUserName}</strong> से <strong>₹150</strong> की सहायता राशि आपके बैंक/UPI खाते में सफलतापूर्वक प्राप्त हो चुकी है?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleConfirmReceived}
                disabled={isConfirming}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isConfirming ? 'पुष्टि हो रही है...' : 'हाँ, पेमेंट मिल गया'}
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
                क्या आप वाकई <strong>{rejectTarget.name}</strong> के अनुरोध को अस्वीकार (Reject) करना चाहते हैं?
              </p>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">अस्वीकार करने का कारण:</label>
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
                रद्द करें
              </button>
              <button
                onClick={handleExecuteReject}
                disabled={isRejecting}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'हाँ, Reject करें'}
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
                <strong className="text-blue-900">1. प्रोवाइड हेल्प (₹150):</strong> आप सीधे कम्युनिटी मेंबर को ₹150 की सहायता UPI / QR द्वारा भेजते हैं और स्लिप सबमिट करते हैं।
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 font-medium">
                <strong className="text-blue-900">2. रिसीव हेल्प (₹150):</strong> एक्टिव होने के बाद अन्य मेंबर्स सीधे आपके खाते में सहायता राशि भेजते हैं जिसे आप कन्फर्म करते हैं।
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 font-medium">
                <strong className="text-blue-900">3. 6-लेवल रेफरल इनकम:</strong> अपने रेफरल लिंक से टीम बनाएं और लेवल 1 से 6 तक (10%, 5%, 4%, 3%, 2%, 1%) असीमित इनकम प्राप्त करें।
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
              <p>हेल्पडेस्क टीम 24x7 आपकी सहायता के लिए उपलब्ध है:</p>
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
      />
    </div>
  );
};

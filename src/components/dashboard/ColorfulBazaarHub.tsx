import React, { useState } from 'react';
import {
  Crown,
  Gem,
  Trophy,
  Briefcase,
  Gift,
  CalendarCheck,
  ShoppingBag,
  Truck,
  Share2,
  Wallet,
  Landmark,
  Banknote,
  Send,
  Award,
  MessageCircle,
  GitFork,
  HeartHandshake,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Zap,
  Play,
  Flame,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { api } from '../../services/api';

interface ColorfulBazaarHubProps {
  onOpenAdJunction?: () => void;
}

export const ColorfulBazaarHub: React.FC<ColorfulBazaarHubProps> = ({ onOpenAdJunction }) => {
  const { currentUser, wallet, setActiveTab, refreshUserData } = useAuth();
  const state = db.getState();

  // Modals state
  const [activeModal, setActiveModal] = useState<
    | null
    | 'prime_pass'
    | 'crown_achiever'
    | 'freelance_bonus'
    | 'mega_bonanza'
    | 'daily_bonus'
    | 'shopping'
    | 'send_money'
    | 'royal_matrix'
    | 'top_leader'
    | 'messenger'
    | 'vip_care_fund'
    | 'ad_junction'
  >(null);

  // Send Money State
  const [sendRecipientId, setSendRecipientId] = useState('');
  const [sendAmount, setSendAmount] = useState('100');
  const [sendRemarks, setSendRemarks] = useState('P2P Community Help');
  const [isSendingMoney, setIsSendingMoney] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Daily Bonus State
  const [claimedBonus, setClaimedBonus] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);

  // Ad Junction State
  const [adWatched, setAdWatched] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);

  // Chat message state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string; isMe?: boolean }>>([
    { sender: 'Rahul Sharma (H150-UP0812)', text: 'Just received ₹150 help within 10 minutes! System is super fast 🚀', time: '10:42 AM' },
    { sender: 'Pooja Verma (H150-MH9921)', text: 'Completed level 2 qualification today. Kudos to my team!', time: '11:05 AM' },
    { sender: 'Admin Desk', text: 'Daily 260 direct joining bonanza is live for all active members.', time: '11:30 AM' },
    { sender: 'Vikram Singh (H150-RJ3301)', text: 'Uploaded payment slip for request HP-9921, please verify.', time: '12:15 PM' },
  ]);
  const [newChatText, setNewChatText] = useState('');

  if (!currentUser) return null;

  const totalIncome = (wallet?.totalHelpedReceived || 0) + (wallet?.totalReferralRewards || 0) + 805.5;
  const royaltyIncome = (wallet?.totalReferralRewards || 0);

  const handleClaimDailyBonus = async () => {
    setClaimingDaily(true);
    try {
      const now = new Date().toISOString();
      db.updateState((draft) => {
        const uWallet = draft.wallets[currentUser.id] || {
          userId: currentUser.id,
          availableBalance: 0,
          pendingBalance: 0,
          totalHelpedGiven: 0,
          totalHelpedReceived: 0,
          totalReferralRewards: 0,
          totalWithdrawn: 0,
          lastUpdated: now,
        };
        uWallet.availableBalance += 260;
        uWallet.lastUpdated = now;
        draft.wallets[currentUser.id] = uWallet;

        draft.transactions.unshift({
          id: `TXN-BONUS-${Date.now().toString().slice(-6)}`,
          userId: currentUser.id,
          type: 'admin_credit',
          amount: 260,
          balanceAfter: uWallet.availableBalance,
          status: 'completed',
          referenceId: `BONUS-${Date.now().toString().slice(-6)}`,
          remarks: 'Daily Direct Joining Gift Bonus Credited',
          createdAt: now,
        });

        draft.notifications.unshift({
          id: `NOTIF-B-${Date.now().toString().slice(-6)}`,
          userId: currentUser.id,
          title: 'Daily Rs. 260 Bonus Credited!',
          message: 'Your ₹260 engagement gift has been credited to your available balance.',
          type: 'success',
          isRead: false,
          createdAt: now,
          linkTab: 'wallet',
        });
      });
      setClaimedBonus(true);
      refreshUserData();
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleSendMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendFeedback(null);
    const amt = parseFloat(sendAmount);
    if (isNaN(amt) || amt <= 0) {
      setSendFeedback({ type: 'error', message: 'Enter a valid amount' });
      return;
    }
    if ((wallet?.availableBalance || 0) < amt) {
      setSendFeedback({ type: 'error', message: 'Insufficient wallet balance' });
      return;
    }

    setIsSendingMoney(true);
    try {
      const now = new Date().toISOString();
      const targetId = sendRecipientId.toUpperCase().trim();

      db.updateState((draft) => {
        const senderWallet = draft.wallets[currentUser.id];
        if (senderWallet) {
          senderWallet.availableBalance -= amt;
          senderWallet.lastUpdated = now;
        }

        const targetUser = draft.users.find((u) => u.id === targetId);
        if (targetUser) {
          const recWallet = draft.wallets[targetId] || {
            userId: targetId,
            availableBalance: 0,
            pendingBalance: 0,
            totalHelpedGiven: 0,
            totalHelpedReceived: 0,
            totalReferralRewards: 0,
            totalWithdrawn: 0,
            lastUpdated: now,
          };
          recWallet.availableBalance += amt;
          recWallet.lastUpdated = now;
          draft.wallets[targetId] = recWallet;

          draft.transactions.unshift({
            id: `TXN-P2P-IN-${Date.now().toString().slice(-6)}`,
            userId: targetId,
            type: 'admin_credit',
            amount: amt,
            balanceAfter: recWallet.availableBalance,
            status: 'completed',
            referenceId: `P2P-IN-${Date.now().toString().slice(-6)}`,
            remarks: `P2P Transfer from ${currentUser.fullName} (${currentUser.id}): ${sendRemarks}`,
            createdAt: now,
          });

          draft.notifications.unshift({
            id: `NOTIF-P2P-${Date.now().toString().slice(-6)}`,
            userId: targetId,
            title: `₹${amt} Received from ${currentUser.fullName}`,
            message: `P2P transfer credited to your wallet. Note: ${sendRemarks}`,
            type: 'success',
            isRead: false,
            createdAt: now,
            linkTab: 'wallet',
          });
        }

        draft.transactions.unshift({
          id: `TXN-P2P-OUT-${Date.now().toString().slice(-6)}`,
          userId: currentUser.id,
          type: 'withdrawal',
          amount: amt,
          balanceAfter: (senderWallet?.availableBalance || 0),
          status: 'completed',
          referenceId: `P2P-OUT-${Date.now().toString().slice(-6)}`,
          remarks: `P2P Transfer to ${targetId}: ${sendRemarks}`,
          createdAt: now,
        });
      });

      setSendFeedback({ type: 'success', message: `Successfully transferred ₹${amt} to ${sendRecipientId.toUpperCase()}!` });
      refreshUserData();
      setTimeout(() => {
        setSendRecipientId('');
        setSendAmount('100');
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      setSendFeedback({ type: 'error', message: err.message || 'Transfer failed' });
    } finally {
      setIsSendingMoney(false);
    }
  };

  const handleWatchAd = () => {
    setWatchingAd(true);
    setTimeout(() => {
      setWatchingAd(false);
      setAdWatched(true);
      const now = new Date().toISOString();
      db.updateState((draft) => {
        const uWallet = draft.wallets[currentUser.id] || {
          userId: currentUser.id,
          availableBalance: 0,
          pendingBalance: 0,
          totalHelpedGiven: 0,
          totalHelpedReceived: 0,
          totalReferralRewards: 0,
          totalWithdrawn: 0,
          lastUpdated: now,
        };
        uWallet.availableBalance += 25;
        uWallet.lastUpdated = now;
        draft.wallets[currentUser.id] = uWallet;

        draft.transactions.unshift({
          id: `TXN-AD-${Date.now().toString().slice(-6)}`,
          userId: currentUser.id,
          type: 'admin_credit',
          amount: 25,
          balanceAfter: uWallet.availableBalance,
          status: 'completed',
          referenceId: `AD-REV-${Date.now().toString().slice(-6)}`,
          remarks: 'Ad Junction Video Watch Task Incentive Credited',
          createdAt: now,
        });
      });
      refreshUserData();
    }, 2500);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: `${currentUser.fullName} (${currentUser.id})`,
        text: newChatText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      },
    ]);
    setNewChatText('');
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP HERO BANNER: HELP 150 PRIME PASS (Vibrant Magenta to Purple Gradient) */}
      <div
        onClick={() => setActiveModal('prime_pass')}
        className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#d91285] via-[#a21caf] to-[#6d28d9] text-white shadow-xl hover:opacity-95 transition cursor-pointer flex items-center justify-between relative overflow-hidden group"
      >
        <div className="flex items-center gap-3.5 z-10">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-white group-hover:scale-105 transition-transform">
            <Crown className="h-6 w-6 fill-white/80 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wide font-heading uppercase flex items-center gap-2">
              <span>HELP 150 PRIME PASS</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-pink-100 opacity-95">
              Rs. 500 Coupons & VIP Rs. 99 Level Income
            </p>
          </div>
        </div>

        <div className="z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-yellow-400 text-slate-950 shadow-lg shadow-amber-900/30 group-hover:rotate-12 transition-transform">
            <Gem className="h-5 w-5 fill-slate-950 text-slate-950" />
          </div>
        </div>

        {/* Ambient subtle decorative shape */}
        <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
      </div>

      {/* 2. 2x2 FEATURE BANNER GRID WITH DISTINCT SATURATED COLORS & WATERMARKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* CARD 1: CROWN ACHIEVER (Warm Amber / Bronze Gradient) */}
        <div
          onClick={() => setActiveModal('crown_achiever')}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#c2410c] to-[#9a3412] text-white shadow-lg hover:shadow-orange-950/40 transition cursor-pointer group"
        >
          <div className="relative z-10">
            <h3 className="text-sm sm:text-base font-black tracking-wide uppercase font-heading">
              CROWN ACHIEVER
            </h3>
            <p className="text-xs text-orange-200 mt-0.5 font-medium">Rank Rewards</p>
          </div>
          {/* Trophy watermark */}
          <Trophy className="absolute -right-2 -bottom-2 h-20 w-20 text-white/15 group-hover:scale-110 group-hover:text-white/20 transition-all pointer-events-none" />
        </div>

        {/* CARD 2: FREELANCE BONUS (Teal / Emerald Green Gradient) */}
        <div
          onClick={() => setActiveModal('freelance_bonus')}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#065f46] text-white shadow-lg hover:shadow-emerald-950/40 transition cursor-pointer group"
        >
          <div className="relative z-10">
            <h3 className="text-sm sm:text-base font-black tracking-wide uppercase font-heading">
              FREELANCE BONUS
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5 font-medium">Performance Pay</p>
          </div>
          {/* Briefcase watermark */}
          <Briefcase className="absolute -right-2 -bottom-2 h-20 w-20 text-white/15 group-hover:scale-110 group-hover:text-white/20 transition-all pointer-events-none" />
        </div>

        {/* CARD 3: MEGA BONANZA (Crimson / Rose Pink Gradient) */}
        <div
          onClick={() => setActiveModal('mega_bonanza')}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#e11d48] to-[#be123c] text-white shadow-lg hover:shadow-rose-950/40 transition cursor-pointer group"
        >
          <div className="relative z-10">
            <h3 className="text-sm sm:text-base font-black tracking-wide uppercase font-heading">
              MEGA BONANZA
            </h3>
            <p className="text-xs text-rose-200 mt-0.5 font-medium">Exclusive Gifts</p>
          </div>
          {/* Gift watermark */}
          <Gift className="absolute -right-2 -bottom-2 h-20 w-20 text-white/15 group-hover:scale-110 group-hover:text-white/20 transition-all pointer-events-none" />
        </div>

        {/* CARD 4: DAILY RS. 260 BONUS (Indigo / Purple Gradient) */}
        <div
          onClick={() => setActiveModal('daily_bonus')}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#4338ca] text-white shadow-lg hover:shadow-indigo-950/40 transition cursor-pointer group"
        >
          <div className="relative z-10">
            <h3 className="text-sm sm:text-base font-black tracking-wide uppercase font-heading">
              DAILY RS. 260 BONUS
            </h3>
            <p className="text-xs text-indigo-200 mt-0.5 font-medium">Direct Joining Gift</p>
          </div>
          {/* Calendar Check watermark */}
          <CalendarCheck className="absolute -right-2 -bottom-2 h-20 w-20 text-white/15 group-hover:scale-110 group-hover:text-white/20 transition-all pointer-events-none" />
        </div>
      </div>

      {/* 3. 3-COLUMN HIGH-CONTRAST SOLID WALLET & INCOME TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* TILE 1: MAIN WALLET (Vibrant Dodger Blue) */}
        <div
          onClick={() => setActiveTab('wallet')}
          className="p-4 sm:p-5 rounded-2xl bg-[#2563eb] text-white shadow-lg hover:bg-blue-700 transition cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100">
            MAIN WALLET
          </span>
          <div className="text-xl sm:text-2xl font-black font-heading mt-2">
            Rs. {Number(wallet?.availableBalance || 83).toFixed(2)}
          </div>
        </div>

        {/* TILE 2: TOTAL INCOME (Vibrant Emerald / Bright Green) */}
        <div
          onClick={() => setActiveTab('wallet')}
          className="p-4 sm:p-5 rounded-2xl bg-[#10b981] text-white shadow-lg hover:bg-emerald-600 transition cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
            TOTAL INCOME
          </span>
          <div className="text-xl sm:text-2xl font-black font-heading mt-2">
            Rs. {totalIncome.toFixed(2)}
          </div>
        </div>

        {/* TILE 3: ROYALTY INCOME (Vibrant Sunset Amber / Orange) */}
        <div
          onClick={() => setActiveTab('referral')}
          className="p-4 sm:p-5 rounded-2xl bg-[#f59e0b] text-white shadow-lg hover:bg-amber-600 transition cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100">
            ROYALTY INCOME
          </span>
          <div className="text-xl sm:text-2xl font-black font-heading mt-2">
            Rs. {royaltyIncome.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 4. 12-TILE COLORFUL ACTION ICON GRID (4 COLUMNS - MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. SHOPPING (Hot Pink) */}
        <button
          onClick={() => setActiveModal('shopping')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#e11d48] hover:bg-[#be123c] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            SHOPPING
          </span>
        </button>

        {/* 2. DISTRIBUTOR (Warm Amber / Gold) */}
        <button
          onClick={() => setActiveTab('referral')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#f59e0b] hover:bg-[#d97706] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <Truck className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            DISTRIBUTOR
          </span>
        </button>

        {/* 3. COMM. SYNERGY (Purple) */}
        <button
          onClick={() => setActiveTab('referral')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#9333ea] hover:bg-[#7e22ce] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <Share2 className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            COMM. SYNERGY
          </span>
        </button>

        {/* 4. SELF EARNING (Royal Electric Blue) */}
        <button
          onClick={() => setActiveTab('help')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <Wallet className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            SELF EARNING
          </span>
        </button>

        {/* 5. ADD FUND (Teal / Cyan) */}
        <button
          onClick={() => setActiveTab('wallet')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <Landmark className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            ADD FUND
          </span>
        </button>

        {/* 6. WITHDRAW (Berry / Rose Pink) */}
        <button
          onClick={() => setActiveTab('withdrawal')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#db2777] hover:bg-[#be185d] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <Banknote className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            WITHDRAW
          </span>
        </button>

        {/* 7. SEND MONEY (Vibrant Orange) */}
        <button
          onClick={() => setActiveModal('send_money')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <Send className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            SEND MONEY
          </span>
        </button>

        {/* 8. ROYAL MATRIX (Royal Purple) */}
        <button
          onClick={() => setActiveModal('royal_matrix')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <Gem className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            ROYAL MATRIX
          </span>
        </button>

        {/* 9. TOP LEADER (Deep Violet) */}
        <button
          onClick={() => setActiveModal('top_leader')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <Award className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            TOP LEADER
          </span>
        </button>

        {/* 10. MESSENGER with 99+ BADGE (Dodger Blue) */}
        <button
          onClick={() => setActiveModal('messenger')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square relative"
        >
          <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-slate-900 shadow-sm animate-pulse">
            99+
          </span>
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            MESSENGER
          </span>
        </button>

        {/* 11. LEVEL NETWORK (Emerald Green) */}
        <button
          onClick={() => setActiveTab('referral')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <GitFork className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            LEVEL NETWORK
          </span>
        </button>

        {/* 12. VIP CARE FUND (Dark Pine / Teal) */}
        <button
          onClick={() => setActiveModal('vip_care_fund')}
          className="p-2.5 sm:p-3.5 rounded-2xl bg-[#0f766e] hover:bg-[#115e59] text-white flex flex-col items-center justify-center text-center shadow-md transition transform active:scale-95 cursor-pointer aspect-square"
        >
          <HeartHandshake className="h-6 w-6 sm:h-7 sm:w-7 mb-1.5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight">
            VIP CARE FUND
          </span>
        </button>
      </div>

      {/* ================= MODALS & INTERACTIVE DRAWERS ================= */}

      {/* 1. PRIME PASS MODAL */}
      {activeModal === 'prime_pass' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-pink-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">HELP 150 PRIME PASS</h3>
                  <p className="text-xs text-pink-300">VIP Multi-Level Earning Booster</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-500/20 space-y-1.5">
                <div className="font-bold text-pink-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span>VIP Pass Benefits</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  • <strong>₹500 Digital Shopping Coupons</strong> usable across all verified partner bazaar stores.
                  <br />• <strong>VIP ₹99 Level Income</strong> unlocked automatically on direct member activations.
                  <br />• <strong>Priority 12-Hour Peer Matching</strong> queue in the helping engine.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Prime Pass Fee</div>
                  <div className="text-lg font-black text-white font-heading">₹99 <span className="text-xs font-normal text-slate-500 line-through">₹499</span></div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  80% OFF
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Prime Pass activated successfully! VIP Level bonuses are now unlocked.');
                setActiveModal(null);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs shadow-lg transition cursor-pointer"
            >
              Activate VIP Prime Pass (₹99)
            </button>
          </div>
        </div>
      )}

      {/* 2. CROWN ACHIEVER MODAL */}
      {activeModal === 'crown_achiever' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-orange-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">CROWN ACHIEVER</h3>
                  <p className="text-xs text-orange-300">Rank Rewards & Recognition Ladder</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { rank: 'Star Achiever', req: '5 Direct Helps', reward: '₹500 Cash Reward', color: 'text-amber-400' },
                { rank: 'Silver Leader', req: '15 Active Team', reward: '₹1,500 Cash + Medal', color: 'text-slate-300' },
                { rank: 'Gold Champion', req: '50 Active Team', reward: '₹5,000 Smartphone Fund', color: 'text-yellow-400' },
                { rank: 'Diamond Royalty', req: '200 Active Team', reward: '₹25,000 Laptop Fund', color: 'text-cyan-300' },
                { rank: 'Crown Achiever', req: '500+ Active Team', reward: '₹1,00,000 Royal Car Bonanza', color: 'text-purple-400' },
              ].map((r, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className={`font-bold ${r.color}`}>{r.rank}</div>
                    <div className="text-[10px] text-slate-400">{r.req}</div>
                  </div>
                  <span className="font-mono font-bold text-white text-xs bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                    {r.reward}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Rank Table
            </button>
          </div>
        </div>
      )}

      {/* 3. FREELANCE BONUS MODAL */}
      {activeModal === 'freelance_bonus' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-teal-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">FREELANCE BONUS</h3>
                  <p className="text-xs text-teal-300">Daily Micro Tasks & Performance Pay</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Share Referral Link on WhatsApp</div>
                  <div className="text-[10px] text-slate-400">Post on 3 community groups</div>
                </div>
                <button
                  onClick={() => alert('Task link verified! ₹15 task reward added to ledger.')}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                >
                  Earn ₹15
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Join Telegram Channel</div>
                  <div className="text-[10px] text-slate-400">Official updates & proof desk</div>
                </div>
                <button
                  onClick={() => alert('Subscribed! ₹20 bonus added.')}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                >
                  Earn ₹20
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Record 30-Sec Testimonial Video</div>
                  <div className="text-[10px] text-slate-400">Share your helping proof</div>
                </div>
                <button
                  onClick={() => alert('Video submitted for admin review! ₹100 credit on approval.')}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                >
                  Earn ₹100
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 4. MEGA BONANZA MODAL */}
      {activeModal === 'mega_bonanza' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-rose-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">MEGA BONANZA</h3>
                  <p className="text-xs text-rose-300">Exclusive Gifts & Lucky Draw Season</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 to-slate-950 border border-rose-500/30 text-center space-y-3">
              <Flame className="h-10 w-10 text-rose-400 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-white">Diwali & New Year Mega Bonanza Pool</h4>
              <p className="text-xs text-slate-300">
                Complete 10 direct ₹150 help assists this month to enter the mega lucky draw for Smart LED TV, 5G Smartphones, and Smartwatches.
              </p>
              <div className="text-xs font-mono font-bold text-amber-300 bg-slate-900 p-2 rounded-xl border border-slate-800">
                Your Current Entries: 3 Tickets
              </div>
            </div>

            <button
              onClick={() => {
                setActiveModal(null);
                setActiveTab('help');
              }}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition cursor-pointer"
            >
              Provide Help to Earn Tickets
            </button>
          </div>
        </div>
      )}

      {/* 5. DAILY RS. 260 BONUS MODAL */}
      {activeModal === 'daily_bonus' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-indigo-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">DAILY RS. 260 BONUS</h3>
                  <p className="text-xs text-indigo-300">Direct Joining Gift Crediting</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-center space-y-3">
              <div className="text-3xl font-black text-indigo-300 font-heading">₹260.00</div>
              <p className="text-xs text-slate-300">
                Daily member engagement grant. Click below to add ₹260 directly to your active available wallet ledger.
              </p>
            </div>

            {claimedBonus ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>₹260 Bonus Credited Today!</span>
              </div>
            ) : (
              <button
                onClick={handleClaimDailyBonus}
                disabled={claimingDaily}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {claimingDaily ? 'Crediting Ledger...' : 'Claim ₹260 Daily Bonus Now'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. SHOPPING MODAL */}
      {activeModal === 'shopping' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-pink-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-600 text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">DIGITAL BAZAAR SHOPPING</h3>
                  <p className="text-xs text-pink-300">Redeem Coupons on Lifestyle & Groceries</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { name: 'Mobile Recharge Coupon', disc: 'Flat ₹50 Off', pts: '100 Pts' },
                { name: 'Grocery Super Voucher', disc: 'Flat ₹200 Off', pts: '400 Pts' },
                { name: 'Fashion Brand Voucher', disc: 'Flat 30% Off', pts: '250 Pts' },
                { name: 'Electronics Gift Pass', disc: 'Flat ₹500 Off', pts: '800 Pts' },
              ].map((p, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-emerald-400 font-bold">{p.disc}</div>
                  <button
                    onClick={() => alert(`Redeemed ${p.name}! Coupon code sent to SMS.`)}
                    className="w-full py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold mt-1"
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Bazaar
            </button>
          </div>
        </div>
      )}

      {/* 7. SEND MONEY MODAL */}
      {activeModal === 'send_money' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-orange-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">SEND MONEY P2P</h3>
                  <p className="text-xs text-orange-300">Instant Wallet-to-Wallet Transfer</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sendFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold ${
                  sendFeedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {sendFeedback.message}
              </div>
            )}

            <form onSubmit={handleSendMoneySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Recipient User ID (e.g. H150-100002) *
                </label>
                <input
                  type="text"
                  required
                  value={sendRecipientId}
                  onChange={(e) => setSendRecipientId(e.target.value.toUpperCase())}
                  placeholder="Enter Recipient User ID"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Transfer Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-orange-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Available Wallet Balance: ₹{wallet?.availableBalance || 0}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Remarks / Note
                </label>
                <input
                  type="text"
                  value={sendRemarks}
                  onChange={(e) => setSendRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingMoney}
                className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {isSendingMoney ? 'Processing Transfer...' : `Transfer ₹${sendAmount} Instantly`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 8. ROYAL MATRIX MODAL */}
      {activeModal === 'royal_matrix' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-purple-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white">
                  <Gem className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">ROYAL AUTO-POOL MATRIX</h3>
                  <p className="text-xs text-purple-300">3x3 Non-Working Community Pool</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Pool Level 1 (3 Members)</div>
                  <div className="text-[10px] text-emerald-400 font-bold">Completed (3/3)</div>
                </div>
                <div className="text-purple-300 font-mono font-bold">₹450 Received</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Pool Level 2 (9 Members)</div>
                  <div className="text-[10px] text-amber-400 font-bold">In Progress (5/9)</div>
                </div>
                <div className="text-purple-300 font-mono font-bold">₹1,350 Target</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Pool Level 3 (27 Members)</div>
                  <div className="text-[10px] text-slate-500 font-bold">Standing by</div>
                </div>
                <div className="text-purple-300 font-mono font-bold">₹4,050 Target</div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Matrix
            </button>
          </div>
        </div>
      )}

      {/* 9. TOP LEADER MODAL */}
      {activeModal === 'top_leader' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-indigo-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">TOP LEADERBOARD</h3>
                  <p className="text-xs text-indigo-300">National Helping Champions</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { rank: '👑 #1', name: 'Rameshwar Lal (Jaipur)', helped: '₹84,500', team: '342 Members' },
                { rank: '🥈 #2', name: 'Sunita Chauhan (Indore)', helped: '₹62,100', team: '280 Members' },
                { rank: '🥉 #3', name: 'Amitabh Sen (Kolkata)', helped: '₹48,900', team: '194 Members' },
                { rank: '⭐ #4', name: 'Rajeev Nair (Kochi)', helped: '₹39,400', team: '145 Members' },
              ].map((l, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm">{l.rank}</span>
                    <div>
                      <div className="font-bold text-white">{l.name}</div>
                      <div className="text-[10px] text-slate-400">{l.team}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {l.helped}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Leaderboard
            </button>
          </div>
        </div>
      )}

      {/* 10. MESSENGER MODAL */}
      {activeModal === 'messenger' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-blue-500/40 p-5 space-y-3 shadow-2xl flex flex-col h-[550px] max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">COMMUNITY MESSENGER</h3>
                  <p className="text-xs text-blue-300">Live Peer Assistance & Verification Chat</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat message bubbles */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-2xl max-w-[85%] ${
                    msg.isMe
                      ? 'bg-blue-600 text-white ml-auto rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 mr-auto rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-200">{msg.sender}</span>
                    <span className="text-[9px] text-slate-400">{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Send chat input */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                placeholder="Type your message to community..."
                className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 11. VIP CARE FUND MODAL */}
      {activeModal === 'vip_care_fund' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-teal-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-700 text-white">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">VIP CARE FUND</h3>
                  <p className="text-xs text-teal-300">Mutual Emergency Assistance Reserve</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-center space-y-2 text-xs">
              <div className="text-2xl font-black text-teal-300 font-heading">₹1,50,000+</div>
              <p className="text-slate-300">
                Community emergency care pool reserved for active verified members during family medical emergencies or critical support needs.
              </p>
            </div>

            <button
              onClick={() => {
                alert('Support request logged with VIP Care Desk.');
                setActiveModal(null);
              }}
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Apply for Emergency Mutual Grant
            </button>
          </div>
        </div>
      )}

      {/* 12. CENTER FLOATING AD JUNCTION MODAL */}
      {activeModal === 'ad_junction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-amber-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-lg shadow-lg">
                  Rs
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">AD JUNCTION REWARDS</h3>
                  <p className="text-xs text-amber-300">Watch Sponsor Ads & Earn Real Wallet Cash</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mx-auto">
                <Play className="h-7 w-7 fill-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Sponsor Video Task (25 Seconds)</h4>
              <p className="text-xs text-slate-300">
                Earn flat ₹25 instantly deposited into your available wallet ledger for each verified video view.
              </p>
            </div>

            {adWatched ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>₹25 Video Reward Added to Wallet!</span>
              </div>
            ) : (
              <button
                onClick={handleWatchAd}
                disabled={watchingAd}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                <span>{watchingAd ? 'Playing Sponsor Video...' : 'Watch Video to Earn ₹25'}</span>
              </button>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Ad Junction
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

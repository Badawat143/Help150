import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  CreditCard,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Eye,
  UploadCloud,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Sparkles,
  ChevronRight,
  Info,
  X,
  Lock,
  Paperclip,
  Banknote,
  Flame,
  RotateCw,
  Zap,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { UserHelpCycle } from '../../types';
import { PaymentSlipUploadModal } from './PaymentSlipUploadModal';

interface Help150DualBoxProps {
  onNavigateTab?: (tab: string) => void;
}

export const Help150DualBox: React.FC<Help150DualBoxProps> = ({ onNavigateTab }) => {
  const { currentUser, refreshUserData } = useAuth();

  // Cycle state
  const [cycle, setCycle] = useState<UserHelpCycle | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showQrModal, setShowQrModal] = useState<{ title: string; upi: string; amount: number; name: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<'verification' | 'second' | null>(null);
  const [showProofModal, setShowProofModal] = useState<{ url: string; ref: string; amount: number; name: string } | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<{ cycleNum: number; profit: number } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Payment verification issue or duplicate reference');

  // Direct Inline UTR input states
  const [inlineUtr, setInlineUtr] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);

  // Clipboard copy indicators
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Timers
  const [step1Timer, setStep1Timer] = useState({ hours: 23, minutes: 59, seconds: 59, isExpired: false });
  const [timer12h, setTimer12h] = useState({ hours: 11, minutes: 59, seconds: 59, percent: 0, isExpired: false });
  const [deletionTimer, setDeletionTimer] = useState({ hours: 23, minutes: 59, seconds: 59 });

  // Sync cycle data
  const syncCycle = () => {
    if (!currentUser?.id) return;
    const active = db.getUserHelpCycle(currentUser.id);
    setCycle({ ...active });
  };

  useEffect(() => {
    syncCycle();
    const unsub = db.subscribe(() => {
      syncCycle();
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Step 1: 24-Hour Provide Help Deadline Timer & Deletion Timer
  useEffect(() => {
    if (!cycle || !currentUser) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // 1. Step 1 (₹50) 24h Deadline
      if (cycle.status === 'provide_verification') {
        const deadline =
          cycle.verificationLink.deadlineTime ||
          new Date(cycle.createdAt).getTime() + 24 * 3600000;
        const diff = Math.max(0, deadline - now);
        setStep1Timer({
          hours: Math.floor(diff / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
          isExpired: diff === 0,
        });
      }

      // 2. Account Blocked & Auto-Deletion 24h Countdown
      if (currentUser.status === 'blocked' && currentUser.autoDeleteAt) {
        const delTime = new Date(currentUser.autoDeleteAt).getTime();
        const diffDel = Math.max(0, delTime - now);
        setDeletionTimer({
          hours: Math.floor(diffDel / 3600000),
          minutes: Math.floor((diffDel % 3600000) / 60000),
          seconds: Math.floor((diffDel % 60000) / 1000),
        });
      }

      // 3. Step 3: 12-Hour Maturation Timer
      if (cycle.status === 'maturation_timer' && cycle.timerExpiryTime) {
        const expiry = cycle.timerExpiryTime;
        const start = cycle.timerStartTime || expiry - 12 * 3600000;
        const totalDuration = Math.max(1, expiry - start);
        const remaining = Math.max(0, expiry - now);

        if (remaining <= 0) {
          setTimer12h({ hours: 0, minutes: 0, seconds: 0, percent: 100, isExpired: true });
          // Auto-advance to receive help link of ₹200
          if (currentUser?.id) {
            db.getUserHelpCycle(currentUser.id);
            syncCycle();
            refreshUserData();
          }
        } else {
          const totalSeconds = Math.floor(remaining / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const elapsed = Math.max(0, now - start);
          const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

          setTimer12h({ hours, minutes, seconds, percent, isExpired: false });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cycle?.status, cycle?.timerExpiryTime, cycle?.verificationLink.deadlineTime, currentUser?.status, currentUser?.autoDeleteAt]);

  if (!currentUser || !cycle) return null;

  const handleCopyText = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setFeedback({ type: 'success', message: `${label} copied: ${text}` });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Submit Provide Link (₹50 or ₹100)
  const handleSubmitProvide = async (type: 'verification' | 'second', utr?: string, slipUrl?: string) => {
    setIsSubmittingUtr(true);
    setFeedback(null);
    try {
      const finalUtr = utr || inlineUtr || `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      db.submitCycleProvideLink(currentUser.id, type, finalUtr, slipUrl);

      // If user was previously blocked for late payment, unblock them on successful submission
      if (currentUser.status === 'blocked') {
        db.updateState((draft) => {
          const u = draft.users.find((x) => x.id === currentUser.id);
          if (u) {
            u.status = 'active';
            delete u.blockedAt;
            delete u.autoDeleteAt;
            delete u.blockedReason;
          }
        });
      }

      setInlineUtr('');
      setShowUploadModal(null);
      syncCycle();
      refreshUserData();

      if (type === 'verification') {
        setFeedback({
          type: 'success',
          message: 'Step 1 (₹50) submitted successfully! Second Provide Help Link (₹100) is now active.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Step 2 (₹100) submitted! The 12-Hour Maturation Timer has started in your Provide Help dashboard.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error submitting payment' });
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  // Fast forward 12-hour timer (for demo/testing)
  const handleFastForwardTimer = () => {
    db.fastForwardCycleTimer(currentUser.id);
    syncCycle();
    refreshUserData();
    setFeedback({
      type: 'success',
      message: '12-Hour timer fast-forwarded! ₹200 Receive Help link is now ready in the Sky Blue Box.',
    });
  };

  // Confirm Received ₹200 Payment -> Loops and Restarts Cycle
  const handleConfirmReceiveHelp = async () => {
    setIsConfirmingReceive(true);
    setFeedback(null);
    try {
      const result = db.confirmCycleReceiveLink(currentUser.id);
      syncCycle();
      refreshUserData();
      setShowCelebrationModal({
        cycleNum: result.completedCycle.cycleNumber,
        profit: 50,
      });
      setFeedback({
        type: 'success',
        message: `₹200 प्राप्त और कन्फर्म हो गया! साइकिल #${result.completedCycle.cycleNumber} पूर्ण। अब नई साइकिल #${result.newCycle.cycleNumber} का Provide Help (₹50) अनलॉक हो गया है!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error confirming payment' });
    } finally {
      setIsConfirmingReceive(false);
    }
  };

  // Step 1 details
  const step1 = cycle.verificationLink;
  // Step 2 details
  const step2 = cycle.secondLink;
  // Receive link details
  const receiveLink = cycle.receiveLink;

  const isStep1Active = cycle.status === 'provide_verification';
  const isStep2Active = cycle.status === 'provide_second';
  const isTimerActive = cycle.status === 'maturation_timer';
  const isReceiveActive = cycle.status === 'receive_help';

  // Active Provide Beneficiary based on current step
  const activeProvideBeneficiary = isStep1Active
    ? {
        name: step1.matchedWithUserName,
        id: step1.matchedWithUserId,
        mobile: step1.matchedWithMobile,
        email: step1.matchedWithEmail || 'peer@help150.org',
        upi: step1.matchedWithUpi,
        amount: 50,
        title: 'Step 1: ₹50 First Help Link (Verification)',
        type: 'verification' as const,
      }
    : {
        name: step2.matchedWithUserName,
        id: step2.matchedWithUserId,
        mobile: step2.matchedWithMobile,
        email: step2.matchedWithEmail || 'treasury@help150.org',
        upi: step2.matchedWithUpi,
        amount: 100,
        title: 'Step 2: ₹100 Second Help Link',
        type: 'second' as const,
      };

  const timerStep1String = `${String(step1Timer.hours).padStart(2, '0')}:${String(step1Timer.minutes).padStart(2, '0')}:${String(step1Timer.seconds).padStart(2, '0')}`;
  const timer12hString = `${String(timer12h.hours).padStart(2, '0')}:${String(timer12h.minutes).padStart(2, '0')}:${String(timer12h.seconds).padStart(2, '0')}`;
  const timerDeletionString = `${String(deletionTimer.hours).padStart(2, '0')}:${String(deletionTimer.minutes).padStart(2, '0')}:${String(deletionTimer.seconds).padStart(2, '0')}`;

  const isUserBlocked = currentUser.status === 'blocked';

  return (
    <div id="help150-dual-boxes-container" className="space-y-4">
      {/* 🚨 ACCOUNT BLOCKED PENALTY BANNER (24-Hour Non-Payment Rule) */}
      {isUserBlocked && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500 text-white shadow-2xl animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-600 text-white font-black shrink-0 mt-0.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-red-200 tracking-wide uppercase font-heading flex items-center gap-2">
                  <span>🚨 Account ID Blocked (Unpaid ₹50 Link)</span>
                </h3>
                <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed font-medium">
                  Your account has been blocked because the first ₹50 Provide Help link was not paid within 24 hours of registration.
                  Complete the ₹50 payment now to unblock your account before permanent automatic deletion.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-300 bg-red-900/80 px-3 py-1 rounded-lg border border-red-400/40 mt-1">
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>Permanent Automatic Deletion In: {timerDeletionString}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('box-provide-help');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs uppercase tracking-wider shrink-0 shadow-lg cursor-pointer transition self-start sm:self-auto"
            >
              Pay ₹50 to Unblock
            </button>
          </div>
        </div>
      )}

      {/* SECTION HEADER & CYCLE TRACKER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-slate-950 font-black shadow-md">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white font-heading tracking-wide flex items-center gap-2">
              <span>HELP DUAL HELPING BOXES</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                Cycle #{cycle.cycleNumber}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Provide Help ₹50 ➔ ₹100 ➔ 12-Hour Timer ➔ Receive Help ₹200 (Continuous Loop)
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('help')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All Cycle Records</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* QUICK STEP NAVIGATION PILLS */}
      <div className="flex flex-wrap items-center gap-2 py-1 text-xs font-bold font-mono">
        <span
          className={`px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 ${
            isStep1Active
              ? 'bg-red-600 text-white border-red-400 shadow-md animate-pulse'
              : 'bg-slate-900 text-emerald-400 border-emerald-500/40'
          }`}
        >
          {step1.status === 'completed' ? <Check className="h-3.5 w-3.5" /> : '1️⃣'}
          <span>1. ₹50 Link (Verification)</span>
        </span>

        <ArrowRight className="h-3.5 w-3.5 text-slate-600 hidden sm:inline" />

        <span
          className={`px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 ${
            isStep2Active
              ? 'bg-red-600 text-white border-red-400 shadow-md animate-pulse'
              : step2.status === 'completed'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900/60 text-slate-500 border-slate-800'
          }`}
        >
          {step2.status === 'completed' ? <Check className="h-3.5 w-3.5" /> : '2️⃣'}
          <span>2. ₹100 Link (Second)</span>
        </span>

        <ArrowRight className="h-3.5 w-3.5 text-slate-600 hidden sm:inline" />

        <span
          className={`px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 ${
            isTimerActive
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md animate-pulse'
              : isReceiveActive || cycle.status === 'completed'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900/60 text-slate-500 border-slate-800'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>3. 12-Hour Timer</span>
        </span>

        <ArrowRight className="h-3.5 w-3.5 text-slate-600 hidden sm:inline" />

        <span
          className={`px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 ${
            isReceiveActive
              ? 'bg-sky-500 text-white border-sky-300 shadow-md animate-pulse'
              : 'bg-slate-900/60 text-slate-500 border-slate-800'
          }`}
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>4. ₹200 Receive Help &amp; Loop</span>
        </span>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              : 'bg-red-950/80 text-red-300 border-red-500/40'
          } animate-fadeIn`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* THE TWO MAIN BOXES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ========================================================================= */}
        {/* 🔴 PROVIDE HELP BOX (RED THEMED CARD)                                     */}
        {/* ========================================================================= */}
        <div
          id="box-provide-help"
          className="rounded-3xl bg-gradient-to-b from-red-950 via-red-900 to-red-950 border-2 border-red-500 shadow-2xl shadow-red-950/60 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-red-400 transition-all text-white"
        >
          {/* Decorative glowing red background element */}
          <div className="absolute top-0 right-0 h-48 w-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-rose-600/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* 1. Header: 🔥 PROVIDE HELP (Red Pill Style) */}
            <div className="flex items-center justify-between border-b border-red-500/40 pb-3.5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 border border-red-400 shadow-md">
                <span className="text-base">🔥</span>
                <h3 className="text-sm sm:text-base font-black text-emerald-300 font-heading uppercase tracking-wider">
                  PROVIDE HELP
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  isReceiveActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    : 'text-red-200 border-transparent'
                }`}>
                  {isStep1Active
                    ? 'Step 1 of 2'
                    : isStep2Active
                    ? 'Step 2 of 2'
                    : isTimerActive
                    ? 'Maturation (12h)'
                    : '🔒 Provide Help Locked'}
                </span>
                <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md font-mono border ${
                  isReceiveActive
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-white text-red-700 border-red-200'
                }`}>
                  {isStep1Active
                    ? '₹50'
                    : isStep2Active
                    ? '₹100'
                    : isTimerActive
                    ? '12h Timer'
                    : '🔒 ₹50 Locked'}
                </span>
              </div>
            </div>

            {/* A. SCENARIO 1: STEP 1 (₹50) OR STEP 2 (₹100) ACTIVE */}
            {(isStep1Active || isStep2Active) && (
              <>
                {/* Step Context Title */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-red-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {activeProvideBeneficiary.title}
                  </span>
                  {isStep2Active && (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      ✓ ₹50 Link Confirmed
                    </span>
                  )}
                </div>

                {/* Beneficiary Details List */}
                <div className="bg-red-950/90 border border-red-500/50 rounded-2xl p-4 space-y-2.5 shadow-inner">
                  {/* User Name */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-red-900/60">
                    <div className="flex items-center gap-2 text-red-200 font-semibold">
                      <span className="text-base">👤</span>
                      <span>User Name</span>
                    </div>
                    <span className="font-black text-white text-sm sm:text-base tracking-wide">
                      {activeProvideBeneficiary.name}
                    </span>
                  </div>

                  {/* User ID */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-red-900/60">
                    <div className="flex items-center gap-2 text-red-200 font-semibold">
                      <span className="text-base">🆔</span>
                      <span>User ID</span>
                    </div>
                    <span className="font-mono font-bold text-white bg-red-900/80 px-2.5 py-0.5 rounded text-xs">
                      {activeProvideBeneficiary.id}
                    </span>
                  </div>

                  {/* Mobile */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-red-900/60">
                    <div className="flex items-center gap-2 text-red-200 font-semibold">
                      <span className="text-base">📱</span>
                      <span>Mobile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs sm:text-sm">
                        {activeProvideBeneficiary.mobile}
                      </span>
                      <button
                        onClick={() => handleCopyText(activeProvideBeneficiary.mobile, 'mobile', 'Mobile')}
                        className="p-1 rounded bg-red-800 hover:bg-red-700 text-white transition cursor-pointer"
                        title="Copy Mobile"
                      >
                        {copiedKey === 'mobile' ? (
                          <Check className="h-3 w-3 text-emerald-300" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-red-900/60">
                    <div className="flex items-center gap-2 text-red-200 font-semibold">
                      <span className="text-base">📧</span>
                      <span>Email</span>
                    </div>
                    <span className="font-mono text-red-100 text-xs sm:text-sm truncate max-w-[180px] sm:max-w-[240px]">
                      {activeProvideBeneficiary.email}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between text-sm pt-1">
                    <div className="flex items-center gap-2 text-red-200 font-semibold">
                      <span className="text-base">💰</span>
                      <span>Amount</span>
                    </div>
                    <span className="font-black text-white text-base sm:text-lg font-mono bg-white/10 px-3 py-0.5 rounded-lg border border-red-400/40">
                      ₹{activeProvideBeneficiary.amount}
                    </span>
                  </div>
                </div>

                {/* ⏱ Center Live Action Timer */}
                <div className="bg-red-950 border-2 border-red-500/60 rounded-2xl py-3 px-4 text-center shadow-lg">
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="text-2xl animate-pulse">⏱</span>
                    <span className="font-mono font-black text-2xl sm:text-3xl text-white tracking-widest drop-shadow">
                      {isStep1Active ? timerStep1String : '11:59:59'}
                    </span>
                  </div>
                  <p className="text-[10px] text-red-200 uppercase tracking-widest mt-1 font-semibold">
                    {isStep1Active ? '24-Hour Strict Payment Deadline' : 'Action Window Countdown'}
                  </p>
                  {isStep1Active && (
                    <div className="mt-2 text-[11px] font-medium text-amber-200 bg-red-900/90 py-1.5 px-3 rounded-lg border border-red-400/50">
                      ⚠️ <strong>Rule:</strong> Unpaid ₹50 links will result in account ID <strong>BLOCK</strong> and automatic permanent <strong>DELETION</strong> in 24 hours.
                    </div>
                  )}
                </div>

                {/* Action Buttons: [ ACCEPT ] [ REJECT ] */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      setFeedback({
                        type: 'success',
                        message: `Provide Help for ₹${activeProvideBeneficiary.amount} accepted. Please transfer via UPI and submit UTR / Slip below.`,
                      });
                    }}
                    className="py-3 px-4 rounded-xl bg-white hover:bg-red-50 text-red-700 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-950/40 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="h-4 w-4 stroke-[3] text-emerald-600" />
                    <span>[ ACCEPT ]</span>
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="py-3 px-4 rounded-xl bg-red-900 hover:bg-red-800 text-white border border-red-400/60 font-black text-xs sm:text-sm uppercase tracking-wider shadow transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="h-4 w-4 stroke-[3] text-red-300" />
                    <span>[ REJECT ]</span>
                  </button>
                </div>

                {/* Primary Upload Button: 📤 Upload Payment Slip */}
                <button
                  onClick={() => setShowUploadModal(activeProvideBeneficiary.type)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl border border-red-400/40 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="text-base">📤</span>
                  <span>Upload Payment Slip (₹{activeProvideBeneficiary.amount})</span>
                </button>

                {/* Quick UPI / Pay / QR Assistance */}
                <div className="pt-2 border-t border-red-900/60 space-y-2">
                  <div className="p-2.5 rounded-xl bg-red-900/70 border border-red-500/40 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CreditCard className="h-4 w-4 text-amber-300 shrink-0" />
                      <span className="font-mono font-bold text-white truncate">
                        {activeProvideBeneficiary.upi}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyText(activeProvideBeneficiary.upi, 'upi', 'UPI ID')}
                        className="px-2 py-1 rounded bg-white text-red-700 text-[10px] font-black cursor-pointer shadow"
                      >
                        {copiedKey === 'upi' ? 'Copied' : 'Copy UPI'}
                      </button>
                      <button
                        onClick={() =>
                          setShowQrModal({
                            name: activeProvideBeneficiary.name,
                            upi: activeProvideBeneficiary.upi,
                            amount: activeProvideBeneficiary.amount,
                            title: activeProvideBeneficiary.title,
                          })
                        }
                        className="p-1 rounded bg-red-950 text-white border border-red-500/50 cursor-pointer"
                        title="Scan QR Code"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline 12-Digit UTR Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inlineUtr}
                      onChange={(e) => setInlineUtr(e.target.value)}
                      placeholder="Enter 12-digit UPI UTR number"
                      className="flex-1 p-2.5 rounded-xl bg-red-950 border border-red-400/50 text-white text-xs font-mono placeholder:text-red-300/40 focus:outline-none focus:border-red-300"
                    />
                    <button
                      onClick={() => handleSubmitProvide(activeProvideBeneficiary.type, inlineUtr)}
                      disabled={isSubmittingUtr || !inlineUtr.trim()}
                      className="px-4 py-2 rounded-xl bg-white text-red-700 font-black text-xs cursor-pointer shadow disabled:opacity-50"
                    >
                      {isSubmittingUtr ? 'Submitting...' : 'Submit UTR'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* B. SCENARIO 2: 12-HOUR MATURATION TIMER ACTIVE */}
            {isTimerActive && (
              <div className="space-y-4 py-2">
                {/* Completed steps badge */}
                <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
                  <span>✅ Step 1: ₹50 Paid</span>
                  <span>✅ Step 2: ₹100 Paid</span>
                </div>

                {/* Center 12-Hour Maturation Clock */}
                <div className="bg-red-950 border-2 border-amber-400/80 rounded-2xl p-5 text-center shadow-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold uppercase tracking-widest">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>12-Hour Maturation Timer Running</span>
                  </div>

                  <div className="font-mono font-black text-3xl sm:text-4xl text-white tracking-widest drop-shadow">
                    {timer12hString}
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full bg-red-950/90 rounded-full h-3 border border-red-500/50 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${timer12h.percent}%` }}
                    />
                  </div>

                  <p className="text-xs text-red-100 font-medium leading-relaxed">
                    Provide Help के दोनों लिंक (₹50 + ₹100) सफलतापूर्वक पूरे हो चुके हैं! आपका 12-घंटे का परिपक्वता टाइमर चल रहा है।
                    टाइमर समाप्त होते ही दाएँ बॉक्स में केवल <strong>₹200 Receive Help का लिंक</strong> आएगा।
                  </p>

                  {/* Explicit Rule Callout: Both links never arrive together */}
                  <div className="p-3 rounded-xl bg-red-900/80 border border-red-400/50 text-[11px] text-amber-200 text-left space-y-1">
                    <span className="font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      <span>🔒 प्लेटफ़ॉर्म नियम (Strict Cycle Rule):</span>
                    </span>
                    <p className="leading-relaxed">
                      Provide Help और Receive Help दोनों लिंक कभी भी एक साथ नहीं आएंगे। 12-घंटे का टाइमर पूरा होने पर पहले केवल <strong>Receive Help का ₹200 लिंक</strong> आएगा। जब आप वह ₹200 कन्फर्म करेंगे, उसके बाद ही अगला Provide Help अनलॉक होगा।
                    </p>
                  </div>

                  {/* Admin-only Simulation Control (Hidden for regular users) */}
                  {currentUser.role === 'admin' && (
                    <div className="pt-1">
                      <button
                        onClick={handleFastForwardTimer}
                        className="py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold cursor-pointer transition inline-flex items-center gap-1.5"
                        title="Visible only to System Admin for verification"
                      >
                        <Zap className="h-3 w-3 text-amber-300" />
                        <span>[Admin Dev Tool: Advance 12h Timer]</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* C. SCENARIO 3: RECEIVE HELP IS CURRENTLY ACTIVE (PROVIDE HELP IS STRICTLY LOCKED!) */}
            {isReceiveActive && (
              <div className="p-5 sm:p-6 rounded-2xl bg-red-950/90 border-2 border-amber-400/70 text-center space-y-3.5 shadow-2xl relative overflow-hidden">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-lg">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold uppercase tracking-wider">
                    <Lock className="h-3.5 w-3.5" />
                    <span>🔒 Provide Help अभी लॉक है</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-white font-heading">
                    रिसीव हेल्प का ₹200 कन्फर्म होने पर ही प्रोवाइड हेल्प खुलेगा
                  </h4>

                  <p className="text-xs text-red-100/90 leading-relaxed font-medium">
                    12 घंटे की परिपक्वता पूरी हो चुकी है। नियमानुसार दोनों लिंक एक साथ नहीं आते हैं, इसलिए अभी दाएँ (Sky Blue) बॉक्स में केवल <strong>Receive Help (₹200) का लिंक</strong> सक्रिय है।
                    Provide Help का अगला ऑप्शन तभी अनलॉक होगा जब आप दाएँ बॉक्स में ₹200 प्राप्त करके <strong>कन्फर्म</strong> करेंगे।
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-red-900/80 border border-red-500/50 text-[11px] text-emerald-300 text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Provide Help (₹50 + ₹100) इस साइकिल का पूरा हो चुका है।</span>
                  </div>
                  <p className="text-red-200">
                    अब केवल दाएँ बॉक्स में ₹200 रिसीव करें। जैसे ही आप ₹200 कन्फर्म करेंगे, तुरंत साइकिल #{cycle.cycleNumber + 1} का Provide Help (₹50) अनलॉक हो जाएगा।
                  </p>
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById('box-receive-help');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el?.classList.add('ring-4', 'ring-sky-400', 'ring-offset-2');
                    setTimeout(() => el?.classList.remove('ring-4', 'ring-sky-400', 'ring-offset-2'), 2500);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-teal-500 to-sky-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-950/60 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>👉 दाएँ बॉक्स में ₹200 पेमेंट कन्फर्म करें ➔</span>
                </button>
              </div>
            )}
          </div>

          {/* Box 1 Footer Stats */}
          <div className="mt-4 pt-3 border-t border-red-500/30 flex items-center justify-between text-xs text-red-200 relative z-10 font-medium">
            <span>Cycle Provide Completed:</span>
            <strong className="text-white font-black font-mono text-sm">
              ₹{(step1.status === 'completed' ? 50 : 0) + (step2.status === 'completed' ? 100 : 0)} / ₹150
            </strong>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🔵 RECEIVE HELP BOX (SKY BLUE THEMED CARD)                                */}
        {/* ========================================================================= */}
        <div
          id="box-receive-help"
          className="rounded-3xl bg-gradient-to-b from-sky-950 via-sky-900 to-cyan-950 border-2 border-sky-400 shadow-2xl shadow-sky-950/60 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-sky-300 transition-all text-white"
        >
          {/* Decorative glowing sky blue background element */}
          <div className="absolute top-0 right-0 h-48 w-48 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* 1. Header: 🔁 RECEIVED HELP (Amber Pill Style) */}
            <div className="flex items-center justify-between border-b border-sky-400/40 pb-3.5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 border border-amber-300 shadow-md">
                <RotateCw className="w-4 h-4 text-blue-950 font-black stroke-[2.5]" />
                <h3 className="text-sm sm:text-base font-black text-blue-950 font-heading uppercase tracking-wider">
                  RECEIVED HELP
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  isReceiveActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : isTimerActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}>
                  {isReceiveActive ? 'Ready to Confirm' : isTimerActive ? '⏳ 12h Maturing' : '🔒 Locked (Provide Help Pending)'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md font-mono border ${
                  isReceiveActive
                    ? 'bg-white text-blue-950 border-sky-200'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700'
                }`}>
                  {isReceiveActive ? '₹200' : '🔒 ₹200'}
                </span>
              </div>
            </div>

            {/* A. SCENARIO 1: RECEIVE HELP IS ACTIVE (₹200 LINK READY TO CONFIRM) */}
            {isReceiveActive && receiveLink && (
              <>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Incoming ₹200 Assistance From Peer
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    Slip Submitted
                  </span>
                </div>

                {/* Sender Details List */}
                <div className="bg-sky-950/90 border border-sky-400/50 rounded-2xl p-4 space-y-2.5 shadow-inner">
                  {/* User Name */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-sky-900/60">
                    <div className="flex items-center gap-2 text-sky-200 font-semibold">
                      <span className="text-base">👤</span>
                      <span>Sender Member</span>
                    </div>
                    <span className="font-black text-white text-sm sm:text-base tracking-wide">
                      {receiveLink.matchedWithUserName}
                    </span>
                  </div>

                  {/* User ID */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-sky-900/60">
                    <div className="flex items-center gap-2 text-sky-200 font-semibold">
                      <span className="text-base">🆔</span>
                      <span>User ID</span>
                    </div>
                    <span className="font-mono font-bold text-white bg-sky-900/80 px-2.5 py-0.5 rounded text-xs">
                      {receiveLink.matchedWithUserId}
                    </span>
                  </div>

                  {/* Mobile */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-sky-900/60">
                    <div className="flex items-center gap-2 text-sky-200 font-semibold">
                      <span className="text-base">📱</span>
                      <span>Mobile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs sm:text-sm">
                        {receiveLink.matchedWithMobile}
                      </span>
                      <button
                        onClick={() => handleCopyText(receiveLink.matchedWithMobile, 'recMobile', 'Sender Mobile')}
                        className="p-1 rounded bg-sky-800 hover:bg-sky-700 text-white transition cursor-pointer"
                        title="Copy Mobile"
                      >
                        {copiedKey === 'recMobile' ? (
                          <Check className="h-3 w-3 text-emerald-300" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* UTR / Proof Ref */}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-sky-900/60">
                    <div className="flex items-center gap-2 text-sky-200 font-semibold">
                      <span className="text-base">🧾</span>
                      <span>UTR Number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
                        {receiveLink.proofReference || 'UTR-VERIFIED'}
                      </span>
                      {receiveLink.slipUrl && (
                        <button
                          onClick={() =>
                            setShowProofModal({
                              url: receiveLink.slipUrl!,
                              ref: receiveLink.proofReference || '',
                              amount: 200,
                              name: receiveLink.matchedWithUserName,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-sky-800 hover:bg-sky-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Proof</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between text-sm pt-1">
                    <div className="flex items-center gap-2 text-sky-200 font-semibold">
                      <span className="text-base">💰</span>
                      <span>Amount</span>
                    </div>
                    <span className="font-black text-white text-base sm:text-lg font-mono bg-white/10 px-3 py-0.5 rounded-lg border border-sky-300/40">
                      ₹{receiveLink.amount}
                    </span>
                  </div>
                </div>

                {/* Live Action Timer */}
                <div className="bg-sky-950 border-2 border-sky-400/60 rounded-2xl py-3 px-4 text-center shadow-lg">
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="text-2xl animate-pulse">⏱</span>
                    <span className="font-mono font-black text-2xl sm:text-3xl text-white tracking-widest drop-shadow">
                      23:59:59
                    </span>
                  </div>
                  <p className="text-[10px] text-sky-200 uppercase tracking-widest mt-1 font-semibold">
                    Confirmation Window
                  </p>
                </div>

                {/* Primary Confirm Button: [ Confirm ₹200 Payment Received ] */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleConfirmReceiveHelp}
                    disabled={isConfirmingReceive}
                    className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-emerald-950/60 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                    <span>[ ✅ Confirm ₹200 Payment Received (₹200 कन्फर्म करें) ]</span>
                  </button>

                  <p className="text-[11px] text-sky-200 text-center font-medium leading-relaxed">
                    ₹200 कन्फर्म करते ही राशि आपके वॉलेट में जमा हो जाएगी (+₹50 शुद्ध लाभ) और <strong>बाएँ बॉक्स में अगला Provide Help (₹50) तुरंत अनलॉक हो जाएगा</strong>!
                  </p>
                </div>
              </>
            )}

            {/* B. SCENARIO 2: AWAITING PROVIDE HELP (STEP 1 OR STEP 2) */}
            {(isStep1Active || isStep2Active) && (
              <div className="space-y-4 py-2">
                <div className="bg-sky-950/90 border-2 border-amber-400/60 rounded-2xl p-5 text-center space-y-3.5 shadow-2xl relative overflow-hidden">
                  {/* Glowing padlock icon */}
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-lg">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold uppercase tracking-wider">
                      <Lock className="h-3 w-3" />
                      <span>🔒 Locked: Provide Help Incomplete</span>
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-white font-heading leading-snug">
                      Provide Help Link Complete होने के बाद ही Receive Help Link आएगा
                    </h4>

                    <p className="text-xs text-sky-200/90 leading-relaxed font-medium">
                      Receive Help Link is currently <strong>locked</strong>. You must complete both <strong>₹50 First Help Link</strong> and <strong>₹100 Second Help Link</strong> in the Red Box first. Once verified, a 12-hour timer will run, and then your <strong>₹200 Receive Help Link</strong> will appear here automatically.
                    </p>
                  </div>

                  {/* Step status roadmap */}
                  <div className="p-3.5 rounded-xl bg-sky-900/70 border border-sky-400/30 text-left space-y-2 text-xs font-medium text-sky-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className={step1.status === 'completed' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {step1.status === 'completed' ? '✓' : '●'}
                        </span>
                        <span>Step 1: ₹50 First Help (Verification):</span>
                      </span>
                      <strong className={step1.status === 'completed' ? 'text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30' : 'text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse'}>
                        {step1.status === 'completed' ? 'Completed ✓' : 'In Progress (Active in Red Box)'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className={step2.status === 'completed' ? 'text-emerald-400 font-bold' : 'text-slate-400 font-bold'}>
                          {step2.status === 'completed' ? '✓' : '●'}
                        </span>
                        <span>Step 2: ₹100 Second Help Link:</span>
                      </span>
                      <strong className={step2.status === 'completed' ? 'text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30' : (step1.status === 'completed' ? 'text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse' : 'text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded')}>
                        {step2.status === 'completed' ? 'Completed ✓' : (step1.status === 'completed' ? 'In Progress (Active in Red Box)' : '🔒 Locked until Step 1')}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold">●</span>
                        <span>Step 3: 12-Hour Maturation Timer:</span>
                      </span>
                      <strong className="text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded">
                        🔒 Locked until Step 1 &amp; 2
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-sky-800/80">
                      <span className="flex items-center gap-1.5 font-bold text-white">
                        <span>🔒</span>
                        <span>Step 4: ₹200 Receive Help Link:</span>
                      </span>
                      <strong className="text-amber-300 font-black">
                        Arrives ONLY After Provide Help Complete
                      </strong>
                    </div>
                  </div>

                  {/* Hindi & English Mandatory Rule Callout */}
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-[11px] text-amber-200 text-left space-y-1">
                    <span className="font-bold text-red-300 uppercase tracking-wider block">
                      ⚠️ अनिवार्य नियम (Mandatory Platform Rule):
                    </span>
                    <p className="leading-relaxed">
                      कम्युनिटी नियमों के अनुसार, जब तक आप अपने दोनों Provide Help (₹50 Verification + ₹100 Second Link) पूरा करके पेमेंट प्रूफ / UTR सबमिट नहीं कर देते और 12-घंटे की परिपक्वता अवधि पूरी नहीं होती, तब तक आपको Receive Help लिंक प्राप्त नहीं होगा।
                    </p>
                  </div>

                  {/* Quick Scroll to Red Box Button */}
                  <button
                    onClick={() => {
                      const el = document.getElementById('box-provide-help');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el?.classList.add('ring-4', 'ring-red-500', 'ring-offset-2');
                      setTimeout(() => el?.classList.remove('ring-4', 'ring-red-500', 'ring-offset-2'), 2500);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🔴 Complete Provide Help in Red Box First ➔</span>
                  </button>
                </div>
              </div>
            )}

            {/* C. SCENARIO 3: DURING 12-HOUR TIMER */}
            {isTimerActive && (
              <div className="space-y-4 py-2">
                <div className="bg-sky-950/90 border-2 border-sky-400/60 rounded-2xl p-5 text-center space-y-3.5 shadow-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Provide Help Completed — 12-Hour Maturation Running</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-black font-mono text-white tracking-widest">
                      {timer12hString}
                    </div>
                    <h4 className="text-sm font-bold text-emerald-300">
                      Provide Help Links (₹50 + ₹100) पूरे हो चुके हैं!
                    </h4>
                    <p className="text-xs text-sky-200 leading-relaxed font-medium">
                      12-घंटे का टाइमर समाप्त होने के बाद ही <strong>₹200 Receive Help link</strong> यहाँ सक्रिय होगा।
                      As soon as the timer reaches <strong>00:00:00</strong>, peer member details and payment proof for your <strong>₹200 assistance</strong> will appear here automatically.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-900/60 to-cyan-900/60 border border-sky-400/30 text-xs text-sky-100 flex items-center justify-between font-medium">
                    <span>Expected Payout:</span>
                    <span className="text-base font-black font-mono text-amber-300">₹200 (Net Gain: +₹50)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Box 2 Footer Stats */}
          <div className="mt-4 pt-3 border-t border-sky-400/30 flex items-center justify-between text-xs text-sky-200 relative z-10 font-medium">
            <span>Cycle Receive Benefit:</span>
            <strong className="text-emerald-300 font-black font-mono text-sm">
              ₹200 (Net Profit: +₹50)
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QR CODE MODAL                                                             */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 text-white space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-amber-400" />
                <span>UPI QR Code Payment</span>
              </h3>
              <button onClick={() => setShowQrModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `upi://pay?pa=${showQrModal.upi}&pn=${encodeURIComponent(showQrModal.name)}&am=${showQrModal.amount}&cu=INR`
                  )}`}
                  alt="UPI QR Code"
                  className="h-44 w-44 object-contain mx-auto"
                />
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black text-amber-400 font-mono">₹{showQrModal.amount}</div>
                <div className="text-xs text-slate-300 font-semibold">{showQrModal.name}</div>
                <div className="text-xs text-slate-400 font-mono">{showQrModal.upi}</div>
              </div>

              <p className="text-[11px] text-slate-400">
                Scan using Google Pay, PhonePe, Paytm, or any UPI App to transfer ₹{showQrModal.amount}.
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs uppercase cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAYMENT SLIP UPLOAD MODAL                                                 */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <PaymentSlipUploadModal
          isOpen={!!showUploadModal}
          onClose={() => setShowUploadModal(null)}
          requestId={showUploadModal === 'verification' ? step1.requestId : step2.requestId}
          recipientName={showUploadModal === 'verification' ? step1.matchedWithUserName : step2.matchedWithUserName}
          amount={showUploadModal === 'verification' ? 50 : 100}
          initialUtr={inlineUtr}
          onSubmit={async (params) => {
            await handleSubmitProvide(showUploadModal, params.referenceNumber, params.slipDataUrl);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SCREENSHOT / PROOF VIEW MODAL                                             */}
      {/* ========================================================================= */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 text-white space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-emerald-400" />
                <span>Payment Proof / Slip</span>
              </h3>
              <button onClick={() => setShowProofModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Sender: <strong>{showProofModal.name}</strong></span>
                <span>Amount: <strong className="text-emerald-400 font-mono">₹{showProofModal.amount}</strong></span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                UTR / Reference: <span className="text-white font-bold">{showProofModal.ref}</span>
              </div>

              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 max-h-72 overflow-y-auto">
                <img
                  src={showProofModal.url}
                  alt="Payment Proof"
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={() => setShowProofModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CELEBRATION & RESTART MODAL (Cycle Completed & Restarted)                 */}
      {/* ========================================================================= */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500 p-6 sm:p-7 text-white text-center space-y-4 shadow-2xl relative">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30">
              <Sparkles className="h-8 w-8 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black font-heading text-white">
                🎉 Cycle #{showCelebrationModal.cycleNum} Completed!
              </h3>
              <p className="text-xs text-slate-300">
                ₹200 assistance received has been successfully credited to your wallet balance.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Help Provided:</span>
                <span className="font-mono font-bold text-red-400">₹150 (₹50 + ₹100)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Help Received:</span>
                <span className="font-mono font-bold text-emerald-400">₹200</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700 text-sm">
                <span className="text-white font-bold">Net Earnings:</span>
                <span className="font-mono font-black text-amber-300">+₹{showCelebrationModal.profit}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 font-medium">
              🔓 <strong>Provide Help Unlocked:</strong> ₹200 रिसीव कन्फर्म हो चुका है! अब साइकिल #{showCelebrationModal.cycleNum + 1} का Provide Help (₹50 First Help Link) अनलॉक हो गया है।
            </div>

            <button
              onClick={() => setShowCelebrationModal(null)}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/50 cursor-pointer transition"
            >
              Start Provide Help for Cycle #{showCelebrationModal.cycleNum + 1} ➔
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT MODAL                                                              */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-red-500 p-6 text-white space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span>Reject Task</span>
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please enter the reason for rejection (e.g., recipient UPI inactive, unreachable phone number):
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-400"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setFeedback({
                    type: 'error',
                    message: `Task rejection reported: ${rejectReason}. Admin will review the peer assignment.`,
                  });
                }}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase shadow"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [settings, setSettings] = useState(() => db.getState().settings);

  // Modals
  const [showQrModal, setShowQrModal] = useState<{ title: string; upi: string; amount: number; name: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<'verification' | 'second' | null>(null);
  const [showProofModal, setShowProofModal] = useState<{ url: string; ref: string; amount: number; name: string } | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<{ cycleNum: number; profit: number } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('बैंक खाते में राशि प्राप्त नहीं हुई (Amount not credited in bank)');

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
    setSettings(db.getState().settings);
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

  // Reject Received ₹200 Payment Proof by Receiver
  const handleRejectReceiveHelp = (reason: string) => {
    const finalReason = reason.trim() || 'बैंक खाते में राशि प्राप्त नहीं हुई (Amount not credited in bank)';
    try {
      db.rejectCycleReceiveLink(currentUser.id, finalReason);
      syncCycle();
      refreshUserData();
      setShowRejectModal(false);
      setFeedback({
        type: 'error',
        message: `₹200 सहायता अस्वीकृत (Rejected) कर दी गई है। कारण: "${finalReason}"। एडमिन सहायता व प्रेषक को सूचित कर दिया गया है।`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error rejecting payment' });
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

      {/* 4-Day Promotion Mode Indicator */}
      {!settings.linkSystemEnabled && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 rounded-lg bg-amber-500/20 text-amber-300 items-center justify-center shrink-0">
              ⏸️
            </span>
            <div>
              <strong className="text-white">4-दिवसीय प्री-लॉन्च प्रमोशन जारी है:</strong>{' '}
              हेल्पिंग लिंक अभी विराम पर हैं। 4 दिन पूरे होने पर या एडमिन द्वारा ऑन करने पर ऑटोमैटिक लिंक्स भेजे जाएंगे।
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('referral')}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              रेफरल टीम बनाएं ➔
            </button>
          )}
        </div>
      )}

      {/* THE TWO MAIN BOXES GRID (COMPACT HEIGHT - FITS TO AMOUNT LEVEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        {/* ========================================================================= */}
        {/* 🔴 PROVIDE HELP BOX (COMPACT CARD - HALKA HARA RANG BORDER)               */}
        {/* ========================================================================= */}
        <div
          id="box-provide-help"
          className="rounded-2xl bg-gradient-to-b from-red-950 via-red-900 to-red-950 border-2 border-emerald-400 shadow-md shadow-emerald-500/15 p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all text-white"
        >
          {/* Decorative glowing ambient */}
          <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2.5">
            {/* Header: 🔥 PROVIDE HELP + Step + Live Timer + Amount Badge */}
            <div className="flex items-center justify-between border-b border-red-500/40 pb-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 border border-emerald-400/60 shadow-sm">
                  <span className="text-xs">🔥</span>
                  <h3 className="text-xs font-black text-emerald-300 font-heading uppercase tracking-wider">
                    PROVIDE HELP
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-red-200">
                  {isStep1Active ? 'Step 1' : isStep2Active ? 'Step 2' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Live Countdown Timer Badge */}
                {(isStep1Active || isStep2Active) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/90 border border-red-400/50 text-amber-300 font-mono font-bold text-[10px] shadow-sm">
                    <Clock className="h-3 w-3 animate-pulse" />
                    <span>{isStep1Active ? timerStep1String : '11:59:59'}</span>
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase font-mono shadow-sm border ${
                  isReceiveActive
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-emerald-400 text-slate-950 border-emerald-300 font-black'
                }`}>
                  {isStep1Active
                    ? '₹50'
                    : isStep2Active
                    ? '₹100'
                    : isTimerActive
                    ? '12h'
                    : '🔒 ₹50'}
                </span>
              </div>
            </div>

            {/* A. SCENARIO 1: STEP 1 (₹50) OR STEP 2 (₹100) ACTIVE (COMPACT TO AMOUNT) */}
            {(isStep1Active || isStep2Active) && (
              <div className="bg-red-950/80 border border-emerald-400/40 rounded-xl p-2.5 space-y-2 shadow-inner">
                {/* Row 1: Beneficiary Name & ID + Amount Option */}
                <div className="flex items-center justify-between text-xs pb-1 border-b border-red-900/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-white text-xs sm:text-sm truncate">
                      {activeProvideBeneficiary.name}
                    </span>
                    <span className="font-mono text-[9px] text-red-200 bg-red-900/80 px-1 py-0.5 rounded font-bold shrink-0">
                      {activeProvideBeneficiary.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase">Amount:</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-emerald-300 bg-black/40 px-2 py-0.5 rounded border border-emerald-400/50">
                      ₹{activeProvideBeneficiary.amount}
                    </span>
                  </div>
                </div>

                {/* Row 2: Mobile & UPI with 1-click Copy and QR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {/* Mobile with Copy */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-900/40 border border-red-900/60">
                    <div className="flex items-center gap-1 text-red-200 truncate">
                      <Phone className="h-3 w-3 text-red-300 shrink-0" />
                      <span className="font-mono font-semibold text-white truncate text-[11px]">{activeProvideBeneficiary.mobile}</span>
                    </div>
                    <button
                      onClick={() => handleCopyText(activeProvideBeneficiary.mobile, 'mobile', 'Mobile')}
                      className="p-1 rounded bg-red-800 hover:bg-red-700 text-white transition cursor-pointer text-[10px]"
                      title="Copy Mobile"
                    >
                      {copiedKey === 'mobile' ? <Check className="h-2.5 w-2.5 text-emerald-300" /> : <Copy className="h-2.5 w-2.5" />}
                    </button>
                  </div>

                  {/* UPI ID with Copy & QR */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-red-900/40 border border-red-900/60">
                    <div className="flex items-center gap-1 text-red-200 truncate">
                      <CreditCard className="h-3 w-3 text-amber-300 shrink-0" />
                      <span className="font-mono font-semibold text-white truncate text-[11px]">{activeProvideBeneficiary.upi}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyText(activeProvideBeneficiary.upi, 'upi', 'UPI ID')}
                        className="px-1.5 py-0.5 rounded bg-white text-red-700 font-black text-[9px] cursor-pointer"
                        title="Copy UPI"
                      >
                        {copiedKey === 'upi' ? '✓' : 'Copy'}
                      </button>
                      <button
                        onClick={() => setShowQrModal({
                          name: activeProvideBeneficiary.name,
                          upi: activeProvideBeneficiary.upi,
                          amount: activeProvideBeneficiary.amount,
                          title: activeProvideBeneficiary.title,
                        })}
                        className="p-1 rounded bg-red-950 text-white border border-red-500/50 cursor-pointer"
                        title="Scan QR Code"
                      >
                        <QrCode className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Action Buttons right up to amount level (Upload Slip & QR + Inline UTR) */}
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setShowUploadModal(activeProvideBeneficiary.type)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>📤 Upload Slip (₹{activeProvideBeneficiary.amount})</span>
                    </button>
                    <button
                      onClick={() => setShowQrModal({
                        name: activeProvideBeneficiary.name,
                        upi: activeProvideBeneficiary.upi,
                        amount: activeProvideBeneficiary.amount,
                        title: activeProvideBeneficiary.title,
                      })}
                      className="py-1.5 px-2.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-amber-300 border border-red-500/50 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Pay QR</span>
                    </button>
                  </div>

                  {/* Inline 12-Digit UTR */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={inlineUtr}
                      onChange={(e) => setInlineUtr(e.target.value)}
                      placeholder="Enter 12-digit UPI UTR"
                      className="flex-1 px-2.5 py-1 rounded-lg bg-red-950 border border-red-400/50 text-white text-[11px] font-mono placeholder:text-red-300/40 focus:outline-none focus:border-emerald-300"
                    />
                    <button
                      onClick={() => handleSubmitProvide(activeProvideBeneficiary.type, inlineUtr)}
                      disabled={isSubmittingUtr || !inlineUtr.trim()}
                      className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[11px] cursor-pointer shadow disabled:opacity-50"
                    >
                      {isSubmittingUtr ? '...' : 'Submit UTR'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* B. SCENARIO 2: 12-HOUR MATURATION TIMER ACTIVE (COMPACT) */}
            {isTimerActive && (
              <div className="bg-red-950/80 border border-amber-400/60 rounded-xl p-3 text-center space-y-1.5 shadow-inner">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
                  <Clock className="h-3 w-3 animate-spin" />
                  <span>12-Hour Maturation Running</span>
                </div>
                <div className="font-mono font-black text-2xl text-white tracking-widest drop-shadow">
                  {timer12hString}
                </div>
                <div className="w-full bg-red-950 rounded-full h-1.5 border border-red-500/50 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${timer12h.percent}%` }}
                  />
                </div>
                <p className="text-[10px] text-red-100 font-medium">
                  Provide Help (₹50 + ₹100) पूरा हुआ। टाइमर पूरा होते ही दाएँ बॉक्स में ₹200 रिसीव लिंक सक्रिय होगा।
                </p>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={handleFastForwardTimer}
                    className="py-0.5 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold cursor-pointer transition inline-flex items-center gap-1"
                  >
                    <Zap className="h-2.5 w-2.5" />
                    <span>[Admin Fast Forward]</span>
                  </button>
                )}
              </div>
            )}

            {/* C. SCENARIO 3: RECEIVE HELP IS ACTIVE (PROVIDE HELP IS LOCKED) */}
            {isReceiveActive && (
              <div className="bg-red-950/80 border border-amber-400/60 rounded-xl p-3 text-center space-y-2 shadow-inner">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="p-0.5 rounded bg-amber-400/20 text-amber-300">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Provide Help अभी लॉक है
                  </span>
                </div>
                <p className="text-[10px] text-red-100 font-medium">
                  दाएँ बॉक्स में <strong>₹200 Receive Help</strong> कन्फर्म होने के बाद ही अगला Provide Help (साइकिल #{cycle.cycleNumber + 1}) खुलेगा।
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById('box-receive-help');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-teal-500 text-slate-950 font-bold text-xs uppercase shadow cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <span>👉 दाएँ बॉक्स में ₹200 कन्फर्म करें ➔</span>
                </button>
              </div>
            )}
          </div>

          {/* Compact Box Footer Stats */}
          <div className="mt-2 pt-1.5 border-t border-red-500/30 flex items-center justify-between text-[10px] text-red-200 relative z-10 font-medium">
            <span>Cycle Provide Completed:</span>
            <strong className="text-emerald-300 font-mono font-bold">
              ₹{(step1.status === 'completed' ? 50 : 0) + (step2.status === 'completed' ? 100 : 0)} / ₹150
            </strong>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🔵 RECEIVE HELP BOX (COMPACT CARD - MATCHING HEIGHT)                      */}
        {/* ========================================================================= */}
        <div
          id="box-receive-help"
          className="rounded-2xl bg-gradient-to-b from-sky-950 via-sky-900 to-cyan-950 border-2 border-sky-400/80 shadow-md p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group hover:border-sky-300 transition-all text-white"
        >
          {/* Decorative glowing ambient */}
          <div className="absolute top-0 right-0 h-28 w-28 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2.5">
            {/* Header: 🔁 RECEIVED HELP + Status + Live Timer + Amount Badge */}
            <div className="flex items-center justify-between border-b border-sky-400/40 pb-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 border border-amber-300 shadow-sm">
                  <RotateCw className="w-3.5 h-3.5 text-blue-950 font-black stroke-[2.5]" />
                  <h3 className="text-xs font-black text-blue-950 font-heading uppercase tracking-wider">
                    RECEIVED HELP
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-sky-200">
                  {isReceiveActive ? 'Slip Submitted' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Live Action Timer Badge */}
                {isReceiveActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-900/90 border border-sky-400/50 text-amber-300 font-mono font-bold text-[10px] shadow-sm">
                    <Clock className="h-3 w-3 animate-pulse" />
                    <span>23:59:59</span>
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase font-mono shadow-sm border ${
                  isReceiveActive
                    ? 'bg-amber-400 text-blue-950 border-amber-300 font-black'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700'
                }`}>
                  {isReceiveActive ? '₹200' : '🔒 ₹200'}
                </span>
              </div>
            </div>

            {/* A. SCENARIO 1: RECEIVE HELP IS ACTIVE (₹200 LINK READY TO CONFIRM) */}
            {isReceiveActive && receiveLink && (
              <div className="bg-sky-950/80 border border-sky-400/50 rounded-xl p-2.5 space-y-2 shadow-inner">
                {/* Row 1: Sender Member Name & ID + Amount Option */}
                <div className="flex items-center justify-between text-xs pb-1 border-b border-sky-900/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-white text-xs sm:text-sm truncate">
                      {receiveLink.matchedWithUserName}
                    </span>
                    <span className="font-mono text-[9px] text-sky-200 bg-sky-900/80 px-1 py-0.5 rounded font-bold shrink-0">
                      {receiveLink.matchedWithUserId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-amber-300 font-bold uppercase">Amount:</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-sky-300/40">
                      ₹{receiveLink.amount}
                    </span>
                  </div>
                </div>

                {/* Row 2: Mobile with Copy & UTR Number with View Proof Slip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {/* Sender Mobile */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-sky-900/40 border border-sky-900/60">
                    <div className="flex items-center gap-1 text-sky-200 truncate">
                      <Phone className="h-3 w-3 text-sky-300 shrink-0" />
                      <span className="font-mono font-semibold text-white truncate text-[11px]">{receiveLink.matchedWithMobile}</span>
                    </div>
                    <button
                      onClick={() => handleCopyText(receiveLink.matchedWithMobile, 'recMobile', 'Sender Mobile')}
                      className="p-1 rounded bg-sky-800 hover:bg-sky-700 text-white transition cursor-pointer text-[10px]"
                      title="Copy Mobile"
                    >
                      {copiedKey === 'recMobile' ? <Check className="h-2.5 w-2.5 text-emerald-300" /> : <Copy className="h-2.5 w-2.5" />}
                    </button>
                  </div>

                  {/* UTR & View Proof */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-sky-900/40 border border-sky-900/60">
                    <div className="flex items-center gap-1 text-sky-200 truncate">
                      <span className="text-[10px]">🧾</span>
                      <span className="font-mono font-bold text-amber-300 truncate text-[11px]">
                        {receiveLink.proofReference || 'UTR-VERIFIED'}
                      </span>
                    </div>
                    {receiveLink.slipUrl && (
                      <button
                        onClick={() => setShowProofModal({
                          url: receiveLink.slipUrl!,
                          ref: receiveLink.proofReference || '',
                          amount: 200,
                          name: receiveLink.matchedWithUserName,
                        })}
                        className="px-1.5 py-0.5 rounded bg-sky-800 hover:bg-sky-700 text-white text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-2.5 w-2.5" />
                        <span>View</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 3: Receiver Decision Buttons right up to amount level ([ ACCEPT ] & [ REJECT ]) */}
                {receiveLink.status === 'rejected' ? (
                  <div className="p-2 rounded-lg bg-rose-950/90 border border-rose-500/70 text-center space-y-1">
                    <div className="text-[10px] font-bold text-rose-300 flex items-center justify-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />
                      <span>आपने यह भुगतान अस्वीकृत (REJECT) किया है</span>
                    </div>
                    <p className="text-[9px] text-rose-200">
                      कारण: <strong>"{receiveLink.rejectionReason || rejectReason}"</strong>
                    </p>
                    <button
                      onClick={handleConfirmReceiveHelp}
                      disabled={isConfirmingReceive}
                      className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition cursor-pointer shadow flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>पुनः जांच कर ₹200 स्वीकार करें</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={handleConfirmReceiveHelp}
                        disabled={isConfirmingReceive}
                        className="py-2 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        title="राशि प्राप्त हो गई है, स्वीकार करें"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>[ ACCEPT ₹200 ]</span>
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={isConfirmingReceive}
                        className="py-2 px-2.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/60 font-black text-xs uppercase tracking-wider shadow transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        title="राशि प्राप्त नहीं हुई, अस्वीकार करें"
                      >
                        <X className="h-3.5 w-3.5 stroke-[3]" />
                        <span>[ REJECT ]</span>
                      </button>
                    </div>
                    <div className="text-[9px] text-sky-200 text-center font-medium">
                      बैंक खाता जांचकर निर्णय लें (स्वीकार करने पर +₹50 शुद्ध लाभ)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. SCENARIO 2: AWAITING PROVIDE HELP (LOCKED COMPACT) */}
            {(isStep1Active || isStep2Active) && (
              <div className="bg-sky-950/80 border border-amber-400/50 rounded-xl p-3 text-center space-y-2 shadow-inner">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="p-0.5 rounded bg-amber-400/20 text-amber-300">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Receive Help अभी लॉक है
                  </span>
                </div>
                <p className="text-[10px] text-sky-100 font-medium">
                  बाएँ लाल बॉक्स में Provide Help (₹50 + ₹100) पूरा होने और 12-घंटे टाइमर के बाद यहाँ <strong>₹200 लिंक</strong> आएगा।
                </p>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-sky-900/60 border border-sky-400/30 text-xs">
                  <span className="text-sky-200 text-[10px]">Expected Assistance:</span>
                  <span className="font-mono font-bold text-amber-300 text-xs">₹200 (+₹50 Gain)</span>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('box-provide-help');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs uppercase shadow cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <span>🔴 Complete Provide Help First ➔</span>
                </button>
              </div>
            )}

            {/* C. SCENARIO 3: DURING 12-HOUR TIMER (COMPACT) */}
            {isTimerActive && (
              <div className="bg-sky-950/80 border border-sky-400/60 rounded-xl p-3 text-center space-y-1.5 shadow-inner">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
                  <Clock className="h-3 w-3 animate-spin" />
                  <span>12-Hour Timer Running</span>
                </div>
                <div className="font-mono font-black text-2xl text-white tracking-widest">
                  {timer12hString}
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-sky-900/60 border border-sky-400/30 text-xs">
                  <span className="text-sky-200 text-[10px]">Expected Payout:</span>
                  <span className="font-mono font-bold text-amber-300 text-xs">₹200 (+₹50 Net Gain)</span>
                </div>
                <p className="text-[10px] text-sky-100 font-medium">
                  टाइमर 00:00:00 होते ही प्रेषक सदस्य का विवरण और पेमेंट स्लिप यहाँ सक्रिय हो जाएगी।
                </p>
              </div>
            )}
          </div>

          {/* Compact Box Footer Stats */}
          <div className="mt-2 pt-1.5 border-t border-sky-400/30 flex items-center justify-between text-[10px] text-sky-200 relative z-10 font-medium">
            <span>Cycle Receive Benefit:</span>
            <strong className="text-emerald-300 font-mono font-bold">
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
      {/* RECEIVER REJECT MODAL                                                     */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500 p-6 text-white space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <span>अस्वीकार करें (Reject Payment Proof)</span>
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              रिसीवर के रूप में, यदि आपको प्रेषक सदस्य से ₹200 का भुगतान बैंक खाते या UPI में प्राप्त नहीं हुआ है, तो अस्वीकार करने का कारण चुनें या लिखें:
            </p>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">त्वरित कारण चुनें (Quick Select):</span>
              <div className="flex flex-col gap-1.5">
                {[
                  'बैंक खाते में राशि प्राप्त नहीं हुई (Amount not credited in bank)',
                  'अमान्य / फर्जी UTR नंबर (Invalid / fake UTR reference)',
                  'कम राशि भेजी गई (Incorrect / partial amount received)',
                  'फर्जी स्लिप स्क्रीनशॉट (Fake or altered screenshot)',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectReason(reason)}
                    className={`text-[11px] px-3 py-1.5 rounded-xl border text-left transition cursor-pointer ${
                      rejectReason === reason
                        ? 'bg-rose-600/30 border-rose-400 text-rose-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">अस्वीकृति का विवरण (Details):</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="कारण दर्ज करें..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setShowRejectModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                onClick={() => handleRejectReceiveHelp(rejectReason)}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>पुष्टि करें (Confirm Reject)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Eye,
  UploadCloud,
  Send,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Info,
  X,
  Lock,
  ArrowRight,
  RotateCcw,
  Zap,
  TrendingUp,
  History,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../services/db';
import { firestoreSync } from '../../services/firestoreSync';
import { UserHelpCycle, CycleLinkDetails } from '../../types';
import { PaymentSlipUploadModal } from './PaymentSlipUploadModal';

interface PlanCycleBoxProps {
  onNavigateTab?: (tab: string) => void;
}

export const PlanCycleBox: React.FC<PlanCycleBoxProps> = ({ onNavigateTab }) => {
  const { currentUser, refreshUserData } = useAuth();
  const toast = useToast();

  const [cycle, setCycle] = useState<UserHelpCycle | null>(null);
  const [allCycles, setAllCycles] = useState<UserHelpCycle[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<{ name: string; upi: string; amount: number; title: string } | null>(null);
  const [uploadTarget, setUploadTarget] = useState<'verification' | 'second' | null>(null);
  const [viewSlipUrl, setViewSlipUrl] = useState<{ url: string; title: string; amount: number; ref: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState<{ cycleNum: number; profit: number } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Direct Inline UTR input states
  const [utrVerification, setUtrVerification] = useState('');
  const [utrSecond, setUtrSecond] = useState('');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [isSubmittingSecond, setIsSubmittingSecond] = useState(false);
  const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);

  // 12-Hour Maturation Timer countdown
  const [timerLeft, setTimerLeft] = useState({ hours: 11, minutes: 59, seconds: 59, percent: 0, isExpired: false });

  // Sync cycle from database
  const refreshCycle = () => {
    if (!currentUser?.id) return;
    const current = db.getUserHelpCycle(currentUser.id);
    const history = db.getAllUserHelpCycles(currentUser.id);
    setCycle({ ...current });
    setAllCycles([...history]);
  };

  useEffect(() => {
    refreshCycle();
    const unsub = db.subscribe(() => {
      refreshCycle();
    });
    return () => unsub();
  }, [currentUser?.id]);

  // 12-Hour Timer Tick & Auto-Transition
  useEffect(() => {
    if (!cycle || cycle.status !== 'maturation_timer' || !cycle.timerExpiryTime) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const expiry = cycle.timerExpiryTime || now + 12 * 3600000;
      const start = cycle.timerStartTime || expiry - 12 * 3600000;
      const totalDuration = Math.max(1, expiry - start);
      const remaining = Math.max(0, expiry - now);

      if (remaining <= 0) {
        setTimerLeft({ hours: 0, minutes: 0, seconds: 0, percent: 100, isExpired: true });
        // Automatically advance to receive help link ₹200!
        if (currentUser?.id) {
          db.getUserHelpCycle(currentUser.id); // triggers auto-advance
          refreshCycle();
          refreshUserData();
          toast.success('12 Hours completed! Your ₹200 Receive Help link has been automatically generated.', '₹200 Receive Link Ready');
        }
        clearInterval(interval);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const elapsed = Math.max(0, now - start);
      const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

      setTimerLeft({ hours, minutes, seconds, percent, isExpired: false });
    }, 1000);

    return () => clearInterval(interval);
  }, [cycle?.status, cycle?.timerExpiryTime, currentUser?.id]);

  if (!currentUser || !cycle) return null;

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.info(`${label} copied: ${text}`, 'Copied');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Submit Step 1: Verification Link ₹50
  const handleSubmitVerification = async (utr?: string, slipUrl?: string) => {
    setIsSubmittingVerification(true);
    try {
      const finalUtr = utr || utrVerification || `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      db.submitCycleProvideLink(currentUser.id, 'verification', finalUtr, slipUrl);
      refreshCycle();
      refreshUserData();
      setUtrVerification('');
      toast.success('Verification Link ₹50 submitted successfully! Now complete the second link (₹100).', 'Step 1 Completed');
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  // Submit Step 2: Second Link ₹100
  const handleSubmitSecond = async (utr?: string, slipUrl?: string) => {
    setIsSubmittingSecond(true);
    try {
      const finalUtr = utr || utrSecond || `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      db.submitCycleProvideLink(currentUser.id, 'second', finalUtr, slipUrl);
      refreshCycle();
      refreshUserData();
      setUtrSecond('');
      toast.success('Second Link ₹100 completed! The 12-hour maturation timer has now started.', '12h Timer Started');
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    } finally {
      setIsSubmittingSecond(false);
    }
  };

  // Fast-Forward 12h Simulation for Demo / Review
  const handleFastForward12h = () => {
    try {
      db.fastForwardCycleTimer(currentUser.id);
      refreshCycle();
      refreshUserData();
      toast.success('⚡ 12 Hours completed successfully! ₹200 Receive Help link is now ready.', '12h Completed');
    } catch (e: any) {
      toast.error(e.message || 'Error');
    }
  };

  // Step 4: Confirm ₹200 Received & Auto-Advance to Next Cycle
  const handleConfirmReceiveHelp = async () => {
    setIsConfirmingReceive(true);
    try {
      const { completedCycle, newCycle } = db.confirmCycleReceiveLink(currentUser.id);
      refreshCycle();
      refreshUserData();
      setShowCelebration({
        cycleNum: completedCycle.cycleNumber,
        profit: 50,
      });
      toast.success(`₹200 credited to your wallet! Cycle #${completedCycle.cycleNumber} completed. New Cycle #${newCycle.cycleNumber} started!`, 'Payment Confirmed');
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    } finally {
      setIsConfirmingReceive(false);
    }
  };

  const isStep1Done = cycle.verificationLink.status === 'completed';
  const isStep2Done = cycle.secondLink.status === 'completed';
  const isTimerPhase = cycle.status === 'maturation_timer';
  const isReceivePhase = cycle.status === 'receive_help';

  return (
    <div id="revolving-plan-cycle-container" className="space-y-6">
      {/* ===================================================================== */}
      {/* TOP PLAN BANNER & REVOLVING CYCLE HEADER                              */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-2 border-rose-500/40 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-950/50 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Cycle #{cycle.cycleNumber}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                🔄 Continuous Revolving Loop
              </span>
              {allCycles.filter((c) => c.status === 'completed').length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3 h-3 text-amber-400" />
                  <span>{allCycles.filter((c) => c.status === 'completed').length} Cycles Completed</span>
                </button>
              )}
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white font-heading flex items-center gap-2">
              <span>Community Helping Plan Cycle</span>
              <span className="text-amber-400 font-mono text-sm sm:text-base">(₹50 + ₹100 ➔ 12h ➔ ₹200)</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              <strong className="text-amber-300">Rule:</strong> Provide Verification Link <span className="text-rose-400 font-bold">₹50</span> + Second Link <span className="text-rose-400 font-bold">₹100</span> ➔ After both links complete, a <span className="text-amber-300 font-bold">12-Hour Timer</span> activates ➔ Automatically receive <span className="text-emerald-400 font-bold">₹200</span> link after 12 hours ➔ Continuous cycle repeats!
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Given</div>
              <div className="text-sm font-black text-rose-400 font-mono">₹150</div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Timer</div>
              <div className="text-sm font-black text-amber-300 font-mono">12 Hours</div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Received</div>
              <div className="text-sm font-black text-emerald-400 font-mono">₹200</div>
            </div>
          </div>
        </div>

        {/* 4-Step Visual Progress Stepper */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Step 1 */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              isStep1Done
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200 ring-2 ring-rose-500/30'
            }`}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs shrink-0 ${
                isStep1Done ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
              }`}>
                {isStep1Done ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase opacity-80">Step 1</div>
                <div className="text-xs font-black truncate">Verification Link ₹50</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              isStep2Done
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : isStep1Done
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 ring-2 ring-rose-500/30 animate-pulse'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs shrink-0 ${
                isStep2Done ? 'bg-emerald-500 text-slate-950' : isStep1Done ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {isStep2Done ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase opacity-80">Step 2</div>
                <div className="text-xs font-black truncate">Second Link ₹100</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              isReceivePhase
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : isTimerPhase
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 ring-2 ring-amber-400/40'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs shrink-0 ${
                isReceivePhase ? 'bg-emerald-500 text-slate-950' : isTimerPhase ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {isReceivePhase ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase opacity-80">Step 3</div>
                <div className="text-xs font-black truncate">12-Hour Timer</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              isReceivePhase
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/40'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs shrink-0 ${
                isReceivePhase ? 'bg-emerald-400 text-slate-950 animate-bounce' : 'bg-slate-800 text-slate-400'
              }`}>
                {isReceivePhase ? '₹' : '4'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase opacity-80">Step 4</div>
                <div className="text-xs font-black truncate">Receive Link ₹200</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 12-HOUR MATURATION TIMER (PROMINENT STANDOUT CARD ON DASHBOARD)       */}
      {/* ===================================================================== */}
      {isTimerPhase && (
        <div id="maturation-12h-timer-card" className="rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-amber-950/40 border-2 border-amber-400/60 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>12-Hour Maturation Timer Active</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                ₹200 Receive Help link unlocks automatically after 12 hours!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                You have successfully completed Verification Link <span className="text-amber-300 font-bold">₹50</span> and Second Link <span className="text-amber-300 font-bold">₹100</span>. The 12-hour maturation timer is actively running. Once it hits zero, an active peer member will be assigned to provide you ₹200 assistance.
              </p>
            </div>

            {/* Countdown Display */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-amber-400/40 shadow-inner shrink-0 min-w-[280px]">
              <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>Time Remaining</span>
              </div>

              {/* Big Digits */}
              <div className="flex items-baseline gap-1 font-mono font-black text-3xl sm:text-4xl text-amber-300 drop-shadow-md">
                <span>{String(timerLeft.hours).padStart(2, '0')}</span>
                <span className="text-amber-500 animate-pulse">:</span>
                <span>{String(timerLeft.minutes).padStart(2, '0')}</span>
                <span className="text-amber-500 animate-pulse">:</span>
                <span>{String(timerLeft.seconds).padStart(2, '0')}</span>
              </div>

              <div className="flex justify-between w-full text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 px-3">
                <span>Hours</span>
                <span>Mins</span>
                <span>Secs</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, timerLeft.percent)}%` }}
                />
              </div>

              {/* Fast Forward Test Button */}
              <button
                id="btn-fast-forward-timer"
                onClick={handleFastForward12h}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/50 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                title="Fast-forward 12 hours for instant testing"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Fast-Forward 12h (Demo)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2-COLUMN MAIN TRANSACTION LAYOUT: PROVIDE HELP & RECEIVE HELP CARDS    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ----------------------------------------------------------------- */}
        {/* COLUMN 1: PROVIDE HELP (LINK 1: ₹50 + LINK 2: ₹100)               */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-xs">🔥</span>
              <span>1. Provide Help Links (₹150 Total)</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              ₹50 + ₹100
            </span>
          </div>

          {/* CARD 1A: Provide Verification Link ₹50 (RED THEMED LINK BOX) */}
          <div className={`rounded-2xl border-2 transition-all p-5 space-y-4 ${
            isStep1Done
              ? 'bg-slate-900/90 border-emerald-500/50 text-slate-100 shadow-md'
              : 'bg-gradient-to-b from-red-950 via-red-900 to-red-950 border-red-500 shadow-2xl shadow-red-950/60 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isStep1Done ? 'border-emerald-500/20' : 'border-red-500/40'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
                  isStep1Done ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white shadow-md shadow-red-950'
                }`}>
                  {isStep1Done ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Provide Verification Link</span>
                    <span className="text-amber-300 font-mono text-base font-black">₹50</span>
                  </h4>
                  <div className={`text-[10px] ${isStep1Done ? 'text-slate-400' : 'text-red-200'}`}>Step 1: Verification Link (₹50)</div>
                </div>
              </div>

              {isStep1Done ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified / Completed</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-white text-red-700 font-black text-[10px] shadow-sm uppercase tracking-wider">
                  🔴 Active Link
                </span>
              )}
            </div>

            {/* Recipient Details */}
            <div className={`rounded-xl p-3.5 space-y-2.5 ${
              isStep1Done
                ? 'bg-slate-950/70 border border-slate-800'
                : 'bg-red-950/90 border border-red-500/50 shadow-inner'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className={isStep1Done ? 'text-slate-400' : 'text-red-200 font-semibold'}>Recipient:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>{cycle.verificationLink.matchedWithUserName}</span>
                  <span className="font-mono text-[10px] text-red-300">({cycle.verificationLink.matchedWithUserId})</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={isStep1Done ? 'text-slate-400' : 'text-red-200 font-semibold'}>UPI ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300 text-[11px]">{cycle.verificationLink.matchedWithUpi}</span>
                  <button
                    onClick={() => handleCopy(cycle.verificationLink.matchedWithUpi, 'ver_upi', 'UPI ID')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                    title="Copy UPI ID"
                  >
                    {copiedKey === 'ver_upi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={isStep1Done ? 'text-slate-400' : 'text-red-200 font-semibold'}>Mobile Number:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-white">{cycle.verificationLink.matchedWithMobile}</span>
                  <button
                    onClick={() => handleCopy(cycle.verificationLink.matchedWithMobile, 'ver_mob', 'Mobile Number')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                    title="Copy Mobile Number"
                  >
                    {copiedKey === 'ver_mob' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {cycle.verificationLink.proofReference && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-red-900/60">
                  <span className={isStep1Done ? 'text-slate-400' : 'text-red-200'}>UTR / Ref:</span>
                  <span className="font-mono font-bold text-emerald-400">{cycle.verificationLink.proofReference}</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {!isStep1Done ? (
              <div className="space-y-2 pt-1">
                {/* Inline UTR Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={utrVerification}
                    onChange={(e) => setUtrVerification(e.target.value)}
                    placeholder="Enter 12-digit UPI UTR number"
                    className="flex-1 bg-red-950 border border-red-400/60 rounded-xl px-3 py-2 text-xs text-white placeholder:text-red-300/40 focus:outline-none focus:border-white font-mono"
                  />
                  <button
                    onClick={() => handleSubmitVerification()}
                    disabled={isSubmittingVerification}
                    className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs transition cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isSubmittingVerification ? 'Submitting...' : 'Submit ₹50'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setQrModalData({
                      name: cycle.verificationLink.matchedWithUserName,
                      upi: cycle.verificationLink.matchedWithUpi,
                      amount: 50,
                      title: 'Verification Link (₹50) QR Code',
                    })}
                    className="py-2 px-3 rounded-xl bg-red-900/80 hover:bg-red-850 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-red-500/50"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-300" />
                    <span>View QR Code</span>
                  </button>

                  <button
                    onClick={() => setUploadTarget('verification')}
                    className="py-2 px-3 rounded-xl bg-red-900/80 hover:bg-red-850 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-red-500/50"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-sky-300" />
                    <span>Upload Slip</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>₹50 Verification Payment Completed</span>
                </span>
                {cycle.verificationLink.slipUrl && (
                  <button
                    onClick={() => setViewSlipUrl({
                      url: cycle.verificationLink.slipUrl!,
                      title: '₹50 Verification Link Receipt',
                      amount: 50,
                      ref: cycle.verificationLink.proofReference || '',
                    })}
                    className="text-[11px] font-bold underline hover:text-emerald-200 cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Receipt</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CARD 1B: Second Link ₹100 (RED THEMED LINK BOX) */}
          <div className={`rounded-2xl border-2 transition-all p-5 space-y-4 ${
            isStep2Done
              ? 'bg-slate-900/90 border-emerald-500/50 text-slate-100 shadow-md'
              : 'bg-gradient-to-b from-red-950 via-red-900 to-red-950 border-red-500 shadow-2xl shadow-red-950/60 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isStep2Done
                ? 'border-emerald-500/20'
                : 'border-red-500/40'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
                  isStep2Done ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white shadow-md shadow-red-950'
                }`}>
                  {isStep2Done ? <Check className="w-5 h-5" /> : '2'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Second Link</span>
                    <span className="text-amber-300 font-mono text-base font-black">₹100</span>
                  </h4>
                  <div className={`text-[10px] ${isStep2Done ? 'text-slate-400' : 'text-red-200'}`}>Step 2: Second Link (₹100)</div>
                </div>
              </div>

              {isStep2Done ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified / Completed</span>
                </span>
              ) : isStep1Done ? (
                <span className="px-2.5 py-1 rounded-full bg-white text-red-700 font-black text-[10px] shadow-sm uppercase tracking-wider animate-pulse">
                  🔴 Active Link
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                  🔴 Queued (₹100)
                </span>
              )}
            </div>

            {/* Recipient Details */}
            <div className={`rounded-xl p-3.5 space-y-2.5 ${
              isStep2Done
                ? 'bg-slate-950/70 border border-slate-800'
                : isStep1Done
                ? 'bg-red-950/90 border border-red-500/50 shadow-inner'
                : 'bg-slate-950/60 border border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className={isStep1Done && !isStep2Done ? 'text-red-200 font-semibold' : 'text-slate-400'}>Recipient:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>{cycle.secondLink.matchedWithUserName}</span>
                  <span className={`font-mono text-[10px] ${isStep1Done && !isStep2Done ? 'text-red-300' : 'text-slate-400'}`}>({cycle.secondLink.matchedWithUserId})</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={isStep1Done && !isStep2Done ? 'text-red-200 font-semibold' : 'text-slate-400'}>UPI ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300 text-[11px]">{cycle.secondLink.matchedWithUpi}</span>
                  <button
                    onClick={() => handleCopy(cycle.secondLink.matchedWithUpi, 'sec_upi', 'UPI ID')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                    title="Copy UPI ID"
                  >
                    {copiedKey === 'sec_upi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={isStep1Done && !isStep2Done ? 'text-red-200 font-semibold' : 'text-slate-400'}>Mobile Number:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-white">{cycle.secondLink.matchedWithMobile}</span>
                  <button
                    onClick={() => handleCopy(cycle.secondLink.matchedWithMobile, 'sec_mob', 'Mobile Number')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                    title="Copy Mobile Number"
                  >
                    {copiedKey === 'sec_mob' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {cycle.secondLink.proofReference && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-red-900/60">
                  <span className={isStep1Done && !isStep2Done ? 'text-red-200' : 'text-slate-400'}>UTR / Ref:</span>
                  <span className="font-mono font-bold text-emerald-400">{cycle.secondLink.proofReference}</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {!isStep2Done ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={utrSecond}
                    onChange={(e) => setUtrSecond(e.target.value)}
                    placeholder="Enter 12-digit UPI UTR number"
                    disabled={!isStep1Done}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono ${
                      isStep1Done
                        ? 'bg-red-950 border border-red-400/60 placeholder:text-red-300/40 focus:border-white'
                        : 'bg-slate-950 border border-slate-800 placeholder:text-slate-600 cursor-not-allowed'
                    }`}
                  />
                  <button
                    onClick={() => handleSubmitSecond()}
                    disabled={!isStep1Done || isSubmittingSecond}
                    className={`px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer shadow-md ${
                      isStep1Done
                        ? 'bg-white text-red-700 hover:bg-red-50'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmittingSecond ? 'Submitting...' : 'Submit ₹100'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => isStep1Done && setQrModalData({
                      name: cycle.secondLink.matchedWithUserName,
                      upi: cycle.secondLink.matchedWithUpi,
                      amount: 100,
                      title: 'Second Link (₹100) QR Code',
                    })}
                    disabled={!isStep1Done}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 border ${
                      isStep1Done
                        ? 'bg-red-900/80 hover:bg-red-850 text-white border-red-500/50 cursor-pointer'
                        : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-300" />
                    <span>View QR Code</span>
                  </button>

                  <button
                    onClick={() => isStep1Done && setUploadTarget('second')}
                    disabled={!isStep1Done}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 border ${
                      isStep1Done
                        ? 'bg-red-900/80 hover:bg-red-850 text-white border-red-500/50 cursor-pointer'
                        : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-sky-300" />
                    <span>Upload Slip</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>₹100 Second Link Payment Completed</span>
                </span>
                {cycle.secondLink.slipUrl && (
                  <button
                    onClick={() => setViewSlipUrl({
                      url: cycle.secondLink.slipUrl!,
                      title: '₹100 Second Link Receipt',
                      amount: 100,
                      ref: cycle.secondLink.proofReference || '',
                    })}
                    className="text-[11px] font-bold underline hover:text-emerald-200 cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Receipt</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* COLUMN 2: RECEIVE HELP (AUTOMATIC AFTER 12H - ₹200)               */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs">📥</span>
              <span>2. Receive Help Link (₹200)</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Automatic after 12h
            </span>
          </div>

          {/* RECEIVE HELP CARD (SKY BLUE THEMED LINK BOX) */}
          {isReceivePhase && cycle.receiveLink ? (
            <div className="rounded-2xl border-2 border-sky-400 bg-gradient-to-b from-sky-950 via-sky-900 to-sky-950 p-6 space-y-4 shadow-2xl shadow-sky-950/60 text-white relative overflow-hidden">
              {/* Decorative ambient sky glow */}
              <div className="absolute top-0 right-0 h-40 w-40 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-sky-400/40 pb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400 text-slate-950 font-black text-sm shadow-md">
                    ₹
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white flex items-center gap-2">
                      <span>Receive Help Link</span>
                      <span className="text-amber-300 font-mono text-xl font-black">₹200</span>
                    </h4>
                    <div className="text-[10px] text-sky-200 font-bold">
                      System automatically assigned after 12-hour maturation
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-white text-sky-800 font-black text-xs shadow-md uppercase tracking-wider">
                  🔵 Receive Help
                </span>
              </div>

              {/* Sender Details */}
              <div className="bg-sky-950/90 rounded-xl p-4 border border-sky-400/50 space-y-2.5 shadow-inner relative z-10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-200 font-semibold">Sender:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-amber-300" />
                    <span>{cycle.receiveLink.matchedWithUserName}</span>
                    <span className="font-mono text-[10px] text-sky-300">({cycle.receiveLink.matchedWithUserId})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-200 font-semibold">Mobile Number:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-white">{cycle.receiveLink.matchedWithMobile}</span>
                    <button
                      onClick={() => handleCopy(cycle.receiveLink!.matchedWithMobile, 'rec_mob', 'Mobile Number')}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                    >
                      {copiedKey === 'rec_mob' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-200 font-semibold">Assistance Amount:</span>
                  <span className="text-base font-black text-amber-300 font-mono">₹ 200.00</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-sky-900/60">
                  <span className="text-sky-200">UTR / Ref:</span>
                  <span className="font-mono font-bold text-emerald-400">{cycle.receiveLink.proofReference}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1 relative z-10">
                {cycle.receiveLink.slipUrl && (
                  <button
                    onClick={() => setViewSlipUrl({
                      url: cycle.receiveLink!.slipUrl!,
                      title: '₹200 Payment Slip Receipt',
                      amount: 200,
                      ref: cycle.receiveLink!.proofReference || '',
                    })}
                    className="w-full py-2 px-4 rounded-xl bg-sky-900/80 hover:bg-sky-850 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-sky-400/50 shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-amber-300" />
                    <span>View Uploaded Payment Slip</span>
                  </button>
                )}

                <button
                  id="btn-confirm-receive-200"
                  onClick={handleConfirmReceiveHelp}
                  disabled={isConfirmingReceive}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  <span>{isConfirmingReceive ? 'Confirming...' : 'CONFIRM ₹200 RECEIVED'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standby Card when timer is running or provide help not done (Sky Blue) */
            <div className="rounded-2xl border-2 border-sky-400 bg-gradient-to-b from-sky-950 via-sky-900 to-sky-950 p-6 sm:p-8 text-center flex flex-col items-center justify-between min-h-[360px] text-white shadow-2xl shadow-sky-950/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-32 w-32 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

              <div className="w-full flex items-center justify-between border-b border-sky-400/40 pb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400 text-slate-950 font-black text-sm shadow-md">
                    🔵
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-black text-white flex items-center gap-2">
                      <span>Receive Help Link Box</span>
                      <span className="text-amber-300 font-mono text-base font-black">₹200</span>
                    </h4>
                    <div className="text-[10px] text-sky-200 font-bold">
                      Sky Blue Themed Link Box
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-white text-sky-800 font-black text-xs shadow-md uppercase tracking-wider">
                  🔵 RECEIVE HELP
                </span>
              </div>

              <div className="my-6 space-y-3 relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border-2 border-sky-400/50 flex items-center justify-center text-sky-300 shadow-lg shadow-sky-950/50">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-sky-800 text-xs font-black uppercase tracking-wider shadow-md">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                  {isTimerPhase ? '⏱ 12-Hour Timer Running' : '🔵 Receive Help Queue (Standby)'}
                </div>

                <h4 className="text-base sm:text-lg font-black text-white">
                  {isTimerPhase
                    ? '₹200 Help link activates automatically upon 12h timer completion'
                    : '12-Hour timer begins after completing Step 1 and Step 2'}
                </h4>

                <p className="text-xs text-sky-200/90 max-w-sm leading-relaxed font-medium">
                  {isTimerPhase
                    ? `Once the 12-hour maturation timer reaches zero, the system automatically assigns your ₹200 receive help link. You can use the "⚡ Fast-Forward 12h (Demo)" button above for instant testing.`
                    : 'First complete Provide Verification Link (₹50) and Second Link (₹100). The 12-hour timer will start immediately after, followed by your ₹200 receive link.'}
                </p>
              </div>

              <div className="w-full pt-3 border-t border-sky-400/30 flex items-center justify-between text-xs text-sky-200 font-bold relative z-10">
                <span>Receive Help Status:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Sky Blue Box (₹200)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* COMPLETED CYCLES HISTORY TABLE (EXPANDABLE)                           */}
      {/* ===================================================================== */}
      {showHistory && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Completed Plan Cycles History</span>
            </h4>
            <span className="text-xs text-slate-400">
              Continuous Revolving Cycles
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">Cycle</th>
                  <th className="p-3">Verification Link (₹50)</th>
                  <th className="p-3">Second Link (₹100)</th>
                  <th className="p-3">12h Timer</th>
                  <th className="p-3">Receive Link (₹200)</th>
                  <th className="p-3">Net Gain</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allCycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-black text-white">#{c.cycleNumber}</td>
                    <td className="p-3 text-rose-300 font-mono">₹50 (Done)</td>
                    <td className="p-3 text-rose-300 font-mono">₹100 (Done)</td>
                    <td className="p-3 text-amber-300 font-mono">12h Matured</td>
                    <td className="p-3 text-emerald-400 font-mono font-bold">₹200</td>
                    <td className="p-3 text-yellow-300 font-mono font-black">+₹50</td>
                    <td className="p-3">
                      {c.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          Completed ✅
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          In Progress ⏳
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: QR CODE DISPLAY MODAL                                        */}
      {/* ===================================================================== */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white">{qrModalData.title}</h4>
              <button
                onClick={() => setQrModalData(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(
                  qrModalData.upi
                )}%26pn=${encodeURIComponent(qrModalData.name)}%26am=${qrModalData.amount}%26cu=INR`}
                alt="UPI QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-white">{qrModalData.name}</div>
              <div className="font-mono text-amber-400 font-bold text-xs">{qrModalData.upi}</div>
              <div className="text-lg font-black text-emerald-400 font-mono">₹{qrModalData.amount}.00</div>
            </div>

            <button
              onClick={() => {
                handleCopy(qrModalData.upi, 'modal_upi', 'UPI ID');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy UPI ID</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: PAYMENT SLIP UPLOAD MODAL                                    */}
      {/* ===================================================================== */}
      {uploadTarget && (
        <PaymentSlipUploadModal
          isOpen={true}
          onClose={() => setUploadTarget(null)}
          requestId={uploadTarget === 'verification' ? cycle.verificationLink.requestId : cycle.secondLink.requestId}
          recipientName={uploadTarget === 'verification' ? cycle.verificationLink.matchedWithUserName : cycle.secondLink.matchedWithUserName}
          amount={uploadTarget === 'verification' ? 50 : 100}
          initialUtr=""
          onSubmit={async ({ referenceNumber, slipDataUrl }) => {
            if (uploadTarget === 'verification') {
              await handleSubmitVerification(referenceNumber, slipDataUrl);
            } else {
              await handleSubmitSecond(referenceNumber, slipDataUrl);
            }
            setUploadTarget(null);
          }}
        />
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: VIEW SLIP / RECEIPT MODAL                                    */}
      {/* ===================================================================== */}
      {viewSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">{viewSlipUrl.title}</h4>
                <div className="text-xs text-slate-400">Amount: ₹{viewSlipUrl.amount} | UTR: {viewSlipUrl.ref}</div>
              </div>
              <button
                onClick={() => setViewSlipUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black p-2 flex items-center justify-center">
              <img src={viewSlipUrl.url} alt="Receipt Slip" className="max-h-80 w-auto rounded-lg object-contain" />
            </div>

            <button
              onClick={() => setViewSlipUrl(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CELEBRATION MODAL (NEXT CYCLE AUTOMATICALLY ADVANCED)                 */}
      {/* ===================================================================== */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30 animate-bounce">
              🎉
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                Cycle #{showCelebration.cycleNum} Successfully Completed!
              </h3>
              <p className="text-xs text-slate-300">
                ₹200 has been credited to your wallet balance.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Provided Help:</span>
                <span className="font-mono text-rose-300 font-bold">₹150 (₹50 + ₹100)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Received Help:</span>
                <span className="font-mono text-emerald-400 font-black">₹200</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-emerald-500/20">
                <span className="text-white font-bold">Net Profit:</span>
                <span className="font-mono text-yellow-300 font-black text-sm">+₹50.00</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              🔄 By system rules, new Cycle #{showCelebration.cycleNum + 1} has automatically started! The revolving cycle continues seamlessly.
            </div>

            <button
              onClick={() => setShowCelebration(null)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 transition cursor-pointer"
            >
              Continue with Cycle #{showCelebration.cycleNum + 1} ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

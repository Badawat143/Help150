import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowDownCircle,
  ArrowUpRight,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { UserHelpCycle } from '../../types';
import { PaymentSlipUploadModal } from './PaymentSlipUploadModal';
import { CoinTransferAnimation } from './CoinTransferAnimation';

interface Help150DualBoxProps {
  onNavigateTab?: (tab: string) => void;
}

export const Help150DualBox: React.FC<Help150DualBoxProps> = ({ onNavigateTab }) => {
  const { currentUser, wallet, refreshUserData } = useAuth();
  const incomeStats = currentUser ? db.getUserIncomeStats(currentUser.id) : null;

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

  // Direct inline attached slip state (user attaches slip directly to the link box)
  const [inlineAttachedSlip, setInlineAttachedSlip] = useState<{
    file: File | null;
    previewUrl: string | null;
    fileName: string | null;
  }>({ file: null, previewUrl: null, fileName: null });
  const inlineFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInlineFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setInlineAttachedSlip({
          file: selectedFile,
          previewUrl: ev.target?.result as string,
          fileName: selectedFile.name,
        });
        setFeedback({
          type: 'success',
          message: `स्लिप "${selectedFile.name}" अटैच हो गई! सिग्नल हरी लाइट (✅) में बदल गया है। अब सबमिट करें।`,
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleClearInlineSlip = () => {
    setInlineAttachedSlip({ file: null, previewUrl: null, fileName: null });
    if (inlineFileInputRef.current) {
      inlineFileInputRef.current.value = '';
    }
  };

  // Clipboard copy indicators
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Timers
  const [step1Timer, setStep1Timer] = useState({ hours: 23, minutes: 59, seconds: 59, isExpired: false });
  const [timer12h, setTimer12h] = useState({ hours: 11, minutes: 59, seconds: 59, percent: 0, isExpired: false });
  const [deletionTimer, setDeletionTimer] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [receive24hTimer, setReceive24hTimer] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
    is24HoursCompleted: false,
  });

  // Coin animation & celebration state
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [pendingCelebrationData, setPendingCelebrationData] = useState<{ cycleNum: number; profit: number } | null>(null);

  // Provide Help Reject Modal State (when receiver rejects payment proof)
  const [showProvideRejectModal, setShowProvideRejectModal] = useState<'verification' | 'second' | null>(null);
  const [provideRejectReason, setProvideRejectReason] = useState('');

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

      // 4. Step 4: 24-Hour Receive Help Deadline Timer (Reject button appears ONLY after 24h expires!)
      if (cycle.status === 'receive_help' && cycle.receiveLink) {
        const deadline =
          cycle.receiveLink.deadlineTime ||
          (cycle.receiveLink.submittedAt
            ? new Date(cycle.receiveLink.submittedAt).getTime() + 24 * 3600000
            : new Date(cycle.createdAt).getTime() + 24 * 3600000);
        const diff = Math.max(0, deadline - now);
        const isCompleted24h = diff <= 0;
        setReceive24hTimer({
          hours: Math.floor(diff / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
          is24HoursCompleted: isCompleted24h,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    cycle?.status,
    cycle?.timerExpiryTime,
    cycle?.verificationLink.deadlineTime,
    cycle?.receiveLink?.deadlineTime,
    cycle?.receiveLink?.submittedAt,
    currentUser?.status,
    currentUser?.autoDeleteAt,
  ]);

  // Incoming Provide links from other community members where currentUser is the designated Receiver
  const incomingProvidePayments = useMemo(() => {
    if (!currentUser?.id) return [];
    const list: Array<{
      cycleId: string;
      providerUserId: string;
      providerName: string;
      providerMobile?: string;
      type: 'verification' | 'second';
      amount: number;
      proofReference?: string;
      slipUrl?: string;
      submittedAt?: string;
    }> = [];

    const cycles = db.getState().helpCycles || [];
    for (const c of cycles) {
      if (
        c.verificationLink &&
        c.verificationLink.matchedWithUserId === currentUser.id &&
        c.verificationLink.status === 'submitted'
      ) {
        const u = db.getState().users.find((user) => user.id === c.userId);
        list.push({
          cycleId: c.id,
          providerUserId: c.userId,
          providerName: u?.fullName || c.userId,
          providerMobile: u?.mobile,
          type: 'verification',
          amount: 50,
          proofReference: c.verificationLink.proofReference,
          slipUrl: c.verificationLink.slipUrl,
          submittedAt: c.verificationLink.submittedAt,
        });
      }

      if (
        c.secondLink &&
        c.secondLink.matchedWithUserId === currentUser.id &&
        c.secondLink.status === 'submitted'
      ) {
        const u = db.getState().users.find((user) => user.id === c.userId);
        list.push({
          cycleId: c.id,
          providerUserId: c.userId,
          providerName: u?.fullName || c.userId,
          providerMobile: u?.mobile,
          type: 'second',
          amount: 100,
          proofReference: c.secondLink.proofReference,
          slipUrl: c.secondLink.slipUrl,
          submittedAt: c.secondLink.submittedAt,
        });
      }
    }
    return list;
  }, [currentUser?.id, cycle]);

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
      const finalSlip = slipUrl || inlineAttachedSlip.previewUrl || undefined;
      db.submitCycleProvideLink(currentUser.id, type, finalUtr, finalSlip);

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
      setInlineAttachedSlip({ file: null, previewUrl: null, fileName: null });
      if (inlineFileInputRef.current) {
        inlineFileInputRef.current.value = '';
      }
      setShowUploadModal(null);
      syncCycle();
      refreshUserData();

      if (type === 'verification') {
        setFeedback({
          type: 'success',
          message: 'Step 1 (₹50) स्लिप व यूटीआर सबमिट हो गया! सत्यापन प्रतीक्षारत है। जब तक रिसीवर एक्सेप्ट या रिजेक्ट नहीं करता, लिंक बॉक्स सुरक्षित रहेगा।',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Step 2 (₹100) स्लिप व यूटीआर सबमिट हो गया! सत्यापन प्रतीक्षारत है। जब तक रिसीवर एक्सेप्ट या रिजेक्ट नहीं करता, लिंक बॉक्स सुरक्षित रहेगा।',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error submitting payment' });
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  // Receiver accepts Provide Help payment proof (₹50 or ₹100)
  const handleAcceptProvideLink = (type: 'verification' | 'second') => {
    try {
      db.acceptCycleProvideLink(currentUser.id, type);
      syncCycle();
      refreshUserData();
      setFeedback({
        type: 'success',
        message:
          type === 'verification'
            ? 'रिसीवर द्वारा Step 1 (₹50) भुगतान स्वीकार (Accept) कर लिया गया! अब Step 2 (₹100) लिंक सक्रिय हो गया है।'
            : 'रिसीवर द्वारा Step 2 (₹100) भुगतान स्वीकार (Accept) कर लिया गया! 12 घंटे का टाइमर शुरू हो गया है।',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error accepting payment' });
    }
  };

  // Receiver accepts incoming provide help from other member
  const handleAcceptIncomingProvide = (providerUserId: string, type: 'verification' | 'second') => {
    try {
      db.acceptCycleProvideLink(providerUserId, type);
      syncCycle();
      refreshUserData();
      setFeedback({
        type: 'success',
        message: `आपने सदस्य से ₹${type === 'verification' ? 50 : 100} सहायता भुगतान सफलतापूर्वक स्वीकार कर लिया! राशि आपके टोटल रिसिव में जुड़ गई है।`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error accepting payment' });
    }
  };

  // Receiver rejects incoming provide help payment proof
  const handleRejectIncomingProvide = (providerUserId: string, type: 'verification' | 'second') => {
    if (!provideRejectReason.trim()) {
      setFeedback({ type: 'error', message: 'कृपया रिजेक्ट करने का कारण दर्ज करें।' });
      return;
    }
    try {
      db.rejectCycleProvideLink(providerUserId, type, provideRejectReason);
      syncCycle();
      refreshUserData();
      setShowProvideRejectModal(null);
      setProvideRejectReason('');
      setFeedback({
        type: 'error',
        message: 'भुगतान अस्वीकार (Reject) कर दिया गया। प्रदाता को सूचित कर दिया गया है।',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error rejecting payment' });
    }
  };

  // Receiver rejects Provide Help payment proof (₹50 or ₹100)
  const handleRejectProvideLink = (type: 'verification' | 'second') => {
    if (!provideRejectReason.trim()) {
      setFeedback({ type: 'error', message: 'कृपया रिजेक्ट करने का कारण दर्ज करें।' });
      return;
    }
    try {
      db.rejectCycleProvideLink(currentUser.id, type, provideRejectReason);
      syncCycle();
      refreshUserData();
      setShowProvideRejectModal(null);
      setProvideRejectReason('');
      setFeedback({
        type: 'error',
        message: 'रिसीवर द्वारा स्लिप अस्वीकार (Reject) कर दी गई। आप सही स्लिप अथवा यूटीआर पुनः सबमिट कर सकते हैं।',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error rejecting payment' });
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

  // Fast forward 24-hour receive link deadline timer (for test/simulation)
  const handleFastForwardReceiveTimer = () => {
    db.fastForwardReceiveTimer(currentUser.id);
    syncCycle();
    refreshUserData();
    setReceive24hTimer({ hours: 0, minutes: 0, seconds: 0, is24HoursCompleted: true });
    setFeedback({
      type: 'success',
      message: '24 घंटे का टाइमर समाप्त! रिजेक्ट बटन अब सक्रिय और दिखाई दे रहा है।',
    });
  };

  // Confirm Received ₹200 Payment -> Trigger Flying Coins Animation -> Loops and Restarts Cycle
  const handleConfirmReceiveHelp = async () => {
    setIsConfirmingReceive(true);
    setFeedback(null);
    try {
      const result = db.confirmCycleReceiveLink(currentUser.id);
      syncCycle();
      refreshUserData();
      const updatedStats = db.getUserIncomeStats(currentUser.id);
      setPendingCelebrationData({
        cycleNum: result.completedCycle.cycleNumber,
        profit: 50,
      });
      // Trigger gold coins flying into wallet history!
      setShowCoinAnimation(true);
      setFeedback({
        type: 'success',
        message: `₹200 सहायता प्राप्त और कन्फर्म! यह राशि आपके "टोटल रिसिव" (अब ₹${updatedStats.totalHelpedReceived}) और वॉलेट बैलेंस में जमा हो गई है। नई साइकिल #${result.newCycle.cycleNumber} का Provide Help लिंक अनलॉक हो गया है!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error confirming payment' });
    } finally {
      setIsConfirmingReceive(false);
    }
  };

  const handleCoinAnimationComplete = () => {
    setShowCoinAnimation(false);
    if (pendingCelebrationData) {
      setShowCelebrationModal(pendingCelebrationData);
      setPendingCelebrationData(null);
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

  // Provide Help Slip verification states
  const isStep1SlipUploaded =
    step1.status === 'completed' ||
    step1.status === 'submitted' ||
    Boolean(step1.slipUrl && step1.slipUrl.trim().length > 0) ||
    Boolean(step1.proofReference && step1.proofReference.trim().length > 0) ||
    (isStep1Active && Boolean(inlineAttachedSlip.previewUrl));

  const isStep2SlipUploaded =
    step2.status === 'completed' ||
    step2.status === 'submitted' ||
    Boolean(step2.slipUrl && step2.slipUrl.trim().length > 0) ||
    Boolean(step2.proofReference && step2.proofReference.trim().length > 0) ||
    (isStep2Active && Boolean(inlineAttachedSlip.previewUrl));

  // Current active Provide Help link details
  const currentActiveProvideLink = isStep1Active ? step1 : step2;
  const isCurrentLinkSubmitted = currentActiveProvideLink.status === 'submitted';
  const isCurrentLinkRejected = currentActiveProvideLink.status === 'rejected';

  // Current active Provide Help link amount and slip status
  const currentProvideLinkAmount = isStep1Active ? 50 : isStep2Active ? 100 : 0;
  const isCurrentLinkSlipUploaded = isStep1Active
    ? isStep1SlipUploaded
    : isStep2Active
    ? isStep2SlipUploaded
    : false;

  // Slip state for the Receive Help link: only when slip is uploaded does receiver get Accept button
  const isReceiveSlipUploaded = Boolean(
    receiveLink &&
    (receiveLink.status === 'submitted' ||
      receiveLink.status === 'completed' ||
      Boolean(receiveLink.slipUrl && receiveLink.slipUrl.trim().length > 0) ||
      Boolean(receiveLink.proofReference && receiveLink.proofReference.trim().length > 0))
  );

  // Compact Traffic Signal for ONLY the active link amount
  const renderActiveLinkSignal = () => {
    if (!isStep1Active && !isStep2Active) return null;
    return (
      <div
        id="active-provide-traffic-signal"
        className="inline-flex items-center gap-1.5 bg-slate-950/95 border border-slate-700/80 rounded-full px-2 py-0.5 shadow-inner"
        title={`₹${currentProvideLinkAmount} स्लिप: ${isCurrentLinkSlipUploaded ? 'हरी लाइट ✅' : 'संतरी लाइट 🟠'}`}
      >
        <span className="text-xs select-none">🚦</span>
        <div
          className={`h-4.5 w-4.5 rounded-full flex items-center justify-center font-black border transition-all duration-300 ${
            isCurrentLinkSlipUploaded
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-200 text-white shadow-[0_0_10px_rgba(16,185,129,0.95)]'
              : 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse'
          }`}
        >
          {isCurrentLinkSlipUploaded ? (
            <span className="text-[10px]">✅</span>
          ) : (
            <span className="text-[9px] font-black">{currentProvideLinkAmount}</span>
          )}
        </div>
        <span
          className={`font-mono font-black text-[10px] ${
            isCurrentLinkSlipUploaded ? 'text-emerald-300' : 'text-amber-300'
          }`}
        >
          ₹{currentProvideLinkAmount}
        </span>
      </div>
    );
  };

  // Completed Provide Help Signal (₹150 ✅) for 12h Timer / Receive Help stage
  const renderCompletedProvideSignal = () => (
    <div
      className="inline-flex items-center gap-1.5 bg-slate-950/95 border border-emerald-500/50 rounded-full px-2 py-0.5 shadow-inner"
      title="Provide Help (₹50 + ₹100) दोनों स्लिप सत्यापित हैं ✅"
    >
      <span className="text-xs select-none">🚦</span>
      <span className="text-[10px] text-emerald-300 font-mono font-bold flex items-center gap-1">
        <span className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shadow-[0_0_8px_rgba(16,185,129,0.9)]">
          ✅
        </span>
        <span>₹150 Verified</span>
      </span>
    </div>
  );

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-start">
        {/* ========================================================================= */}
        {/* 🔴 PROVIDE HELP BOX (COMPACT CARD - HALKA HARA RANG BORDER)               */}
        {/* ========================================================================= */}
        <div
          id="box-provide-help"
          className="rounded-2xl bg-gradient-to-b from-red-950 via-red-900 to-red-950 border-2 border-emerald-400 shadow-md shadow-emerald-500/15 p-3.5 sm:p-4 h-fit relative overflow-hidden group hover:border-emerald-300 transition-all text-white"
        >
          {/* Decorative glowing ambient */}
          <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2.5">
            {/* Header: 🔥 PROVIDE HELP + Step + 🚦 Active Link Signal + Live Timer + Amount Badge */}
            <div className="flex flex-wrap items-center justify-between border-b border-red-500/40 pb-2 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 border border-emerald-400/60 shadow-sm">
                  <span className="text-xs">🔥</span>
                  <h3 className="text-xs font-black text-emerald-300 font-heading uppercase tracking-wider">
                    PROVIDE HELP
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-red-200">
                  {isStep1Active ? 'Step 1' : isStep2Active ? 'Step 2' : ''}
                </span>

                {/* 🚦 Signal for current active link (₹50 or ₹100) */}
                {renderActiveLinkSignal()}
                {(isTimerActive || isReceiveActive) && renderCompletedProvideSignal()}
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

            {/* A. SCENARIO 1: STEP 1 (₹50) OR STEP 2 (₹100) ACTIVE (TIGHT TO SLIP UPLOAD BUTTON) */}
            {(isStep1Active || isStep2Active) && (
              <div className="bg-red-950/80 border border-emerald-400/40 rounded-xl p-2.5 space-y-2 shadow-inner">
                {/* Row 1: Beneficiary Name & ID + Amount */}
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

                {/* Inline attached slip status preview if user chose a file */}
                {inlineAttachedSlip.previewUrl && (
                  <div className="p-1.5 px-2 rounded-lg bg-emerald-950/80 border border-emerald-400/60 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-emerald-400 font-bold text-[11px]">✅ स्लिप चुनी गई:</span>
                      <span className="font-mono text-white text-[10px] truncate max-w-[170px]">
                        {inlineAttachedSlip.fileName || 'slip_preview.jpg'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setShowProofModal({
                          url: inlineAttachedSlip.previewUrl!,
                          ref: inlineUtr || 'Pending UTR',
                          amount: activeProvideBeneficiary.amount,
                          name: activeProvideBeneficiary.name,
                        })}
                        className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[9px] cursor-pointer"
                      >
                        देखें
                      </button>
                      <button
                        onClick={handleClearInlineSlip}
                        className="px-1.5 py-0.5 rounded bg-red-900/80 hover:bg-red-800 text-red-200 text-[9px] cursor-pointer"
                        title="हटाएं"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Previously uploaded slip view if already submitted */}
                {((isStep1Active && step1.slipUrl) || (isStep2Active && step2.slipUrl)) && !inlineAttachedSlip.previewUrl && (
                  <div className="p-1 px-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>₹{activeProvideBeneficiary.amount} स्लिप अपलोड है (हरी लाइट ✅)</span>
                    </span>
                    <button
                      onClick={() => setShowProofModal({
                        url: (isStep1Active ? step1.slipUrl : step2.slipUrl)!,
                        ref: (isStep1Active ? step1.proofReference : step2.proofReference) || 'Verified',
                        amount: activeProvideBeneficiary.amount,
                        name: activeProvideBeneficiary.name,
                      })}
                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] cursor-pointer"
                    >
                      स्लिप देखें
                    </button>
                  </div>
                )}

                {/* Row 3: Submitted Status for Provider (Provider does NOT see Accept/Reject buttons) */}
                {isCurrentLinkSubmitted ? (
                  <div className="space-y-2 pt-1">
                    {/* Status Notice: Box will NOT disappear until receiver accepts or rejects */}
                    <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-400/60 space-y-1.5 text-xs shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                          <span>स्लिप सबमिट हो चुकी है (सत्यापन प्रतीक्षारत)</span>
                        </span>
                        <span className="text-[9px] font-mono font-black bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full">
                          Awaiting Receiver
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-100 font-medium leading-relaxed bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/20">
                        🔒 <strong>महत्वपूर्ण निर्देश:</strong> आपकी पेमेंट स्लिप प्राप्तकर्ता <strong>{activeProvideBeneficiary.name}</strong> को भेज दी गई है। सुरक्षा नियमों के अनुसार <strong>प्रोवाइडर को एक्सेप्ट/रिजेक्ट बटन नहीं मिलता</strong>। जब तक रिसीवर द्वारा यह पेमेंट एक्सेप्ट नहीं किया जाता, तब तक यह लिंक यहाँ रहेगा।
                      </p>
                      <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono text-slate-300">
                        <span>
                          UTR:{' '}
                          <strong className="text-white">
                            {currentActiveProvideLink.proofReference || inlineUtr || 'Submitted'}
                          </strong>
                        </span>
                        {(currentActiveProvideLink.slipUrl || inlineAttachedSlip.previewUrl) && (
                          <button
                            onClick={() =>
                              setShowProofModal({
                                url: (currentActiveProvideLink.slipUrl || inlineAttachedSlip.previewUrl)!,
                                ref: currentActiveProvideLink.proofReference || inlineUtr || 'Submitted',
                                amount: activeProvideBeneficiary.amount,
                                name: activeProvideBeneficiary.name,
                              })
                            }
                            className="text-[10px] text-emerald-300 hover:text-emerald-200 font-bold underline cursor-pointer"
                          >
                            अपलोड स्लिप देखें ➔
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Receiver Verification Info (No buttons for Provider; Receiver accepts on their end) */}
                    <div className="p-2.5 rounded-xl bg-slate-900/95 border border-slate-700/80 space-y-1.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                          <span>👤</span>
                          <span>रिसीवर (सत्यापनकर्ता):</span>
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono font-bold">
                          {activeProvideBeneficiary.name} ({activeProvideBeneficiary.id})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal bg-black/30 p-1.5 rounded-lg border border-slate-800">
                        स्लिप रिसीवर <strong>{activeProvideBeneficiary.name}</strong> को भेजी गई है। रिसीवर द्वारा अपने खाते में राशि प्राप्त होने की पुष्टि कर 'एक्सेप्ट' करने के बाद आपका अगला स्टेप अनलॉक होगा।
                      </p>

                      {/* Preview / Simulation testing helper */}
                      <div className="pt-1 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400">
                          (टेस्ट मोड: रिसीवर की तरफ से एक्सेप्ट करें)
                        </span>
                        <button
                          onClick={() => handleAcceptProvideLink(activeProvideBeneficiary.type)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-[10px] shadow cursor-pointer transition flex items-center gap-1"
                          title="टेस्टिंग हेतु रिसीवर की तरफ से स्वीकार करें"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>रिसीवर रूप में एक्सेप्ट (₹{activeProvideBeneficiary.amount})</span>
                        </button>
                      </div>
                    </div>

                    {/* Change / Re-upload Option if sent wrong slip */}
                    <div className="text-center pt-0.5">
                      <button
                        onClick={() => setShowUploadModal(activeProvideBeneficiary.type)}
                        className="text-[10px] text-red-300 hover:text-white underline cursor-pointer"
                      >
                        🔄 क्या गलती से गलत स्लिप अपलोड हो गई? यहाँ क्लिक कर बदलें
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-0.5">
                    {/* Rejection Alert Banner if previously rejected */}
                    {isCurrentLinkRejected && (
                      <div className="p-2 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs space-y-1 shadow-inner">
                        <div className="flex items-center gap-1.5 font-bold text-rose-300 text-[11px]">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                          <span>रिसीवर द्वारा स्लिप अस्वीकार (Reject) की गई!</span>
                        </div>
                        {currentActiveProvideLink.rejectionReason && (
                          <p className="text-[10px] text-rose-100 font-mono bg-black/40 p-1.5 rounded border border-rose-800">
                            <strong>कारण:</strong> {currentActiveProvideLink.rejectionReason}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-300">
                          कृपया अपना UPI / बैंक स्टेटमेंट चेक करके सही 12-अंकीय UTR व नई स्लिप पुनः सबमिट करें:
                        </p>
                      </div>
                    )}

                    {/* Hidden file input for direct 1-click slip attach */}
                    <input
                      type="file"
                      ref={inlineFileInputRef}
                      onChange={handleInlineFileSelect}
                      accept="image/*,.pdf"
                      className="hidden"
                    />

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setShowUploadModal(activeProvideBeneficiary.type)}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-black text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrentLinkSlipUploaded
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400'
                            : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white'
                        }`}
                        title="स्लिप अपलोड मोडल खोलें"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Upload Slip (₹{activeProvideBeneficiary.amount})</span>
                        <span
                          className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-black border ${
                            isCurrentLinkSlipUploaded
                              ? 'bg-emerald-400 border-emerald-100 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                              : 'bg-amber-400 border-amber-200 text-slate-950 shadow-[0_0_6px_rgba(245,158,11,0.9)] animate-pulse'
                          }`}
                          title={isCurrentLinkSlipUploaded ? 'हरी लाइट ✅' : 'संतरी लाइट 🟠'}
                        >
                          {isCurrentLinkSlipUploaded ? '✅' : '🟠'}
                        </span>
                      </button>
                      <button
                        onClick={() => inlineFileInputRef.current?.click()}
                        className="py-1.5 px-2 rounded-lg bg-red-900/80 hover:bg-red-800 text-emerald-300 border border-emerald-500/50 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        title="सीधे डिवाइस से स्लिप चुनें"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Attach</span>
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
                        className="py-1.5 px-2 rounded-lg bg-red-900/80 hover:bg-red-800 text-amber-300 border border-red-500/50 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
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
                        disabled={isSubmittingUtr || (!inlineUtr.trim() && !inlineAttachedSlip.previewUrl)}
                        className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[11px] cursor-pointer shadow disabled:opacity-50 flex items-center gap-1"
                      >
                        <span>{isSubmittingUtr ? '...' : 'Submit UTR'}</span>
                        {inlineAttachedSlip.previewUrl && <span className="text-[10px]">📎</span>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. SCENARIO 2: 12-HOUR MATURATION TIMER ACTIVE (COMPACT) */}
            {isTimerActive && (
              <div className="bg-red-950/80 border border-amber-400/60 rounded-xl p-3 text-center space-y-1.5 shadow-inner">
                <div className="flex items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
                    <Clock className="h-3 w-3 animate-spin" />
                    <span>12-Hour Maturation Running</span>
                  </div>
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
                  Provide Help (₹50 + ₹100) पूरा हुआ और दोनों स्लिप सत्यापित हैं ✅। टाइमर पूरा होते ही दाएँ बॉक्स में ₹200 रिसीव लिंक सक्रिय होगा।
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

          {/* Compact Box Footer Stats (shown when not in active input to keep height fitted to slip upload button) */}
          {(isTimerActive || isReceiveActive) && (
            <div className="mt-2 pt-1.5 border-t border-red-500/30 flex items-center justify-between text-[10px] text-red-200 relative z-10 font-medium">
              <span>Cycle Provide Completed:</span>
              <strong className="text-emerald-300 font-mono font-bold">
                ₹{(step1.status === 'completed' ? 50 : 0) + (step2.status === 'completed' ? 100 : 0)} / ₹150
              </strong>
            </div>
          )}
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
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-900/90 border border-sky-400/50 text-amber-300 font-mono font-bold text-[10px] shadow-sm"
                    title={receive24hTimer.is24HoursCompleted ? '24 घंटे पूर्ण (Reject Unlocked)' : '24-Hour Receiver Action Deadline'}
                  >
                    <Clock className="h-3 w-3 animate-pulse" />
                    <span>
                      {receive24hTimer.is24HoursCompleted
                        ? '00:00:00 (EXPIRED)'
                        : `${String(receive24hTimer.hours).padStart(2, '0')}:${String(
                            receive24hTimer.minutes
                          ).padStart(2, '0')}:${String(receive24hTimer.seconds).padStart(2, '0')}`}
                    </span>
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

            {/* Incoming Provide Payments from other members awaiting receiver verification */}
            {incomingProvidePayments.length > 0 && (
              <div className="bg-emerald-950/90 border-2 border-emerald-400/80 rounded-xl p-2.5 space-y-2 shadow-lg animate-in fade-in">
                <div className="flex items-center justify-between border-b border-emerald-500/40 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">📥</span>
                    <span className="font-bold text-white text-xs">
                      आवक सहायता स्लिप सत्यापन ({incomingProvidePayments.length})
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40">
                    Action Required
                  </span>
                </div>

                {incomingProvidePayments.map((pmt) => (
                  <div key={pmt.cycleId + pmt.type} className="p-2 rounded-lg bg-black/40 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{pmt.providerName}</div>
                        <div className="text-[9px] text-slate-400 font-mono">ID: {pmt.providerUserId}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-amber-300 text-sm">₹{pmt.amount}</div>
                        <div className="text-[9px] text-emerald-300">
                          {pmt.type === 'verification' ? 'Step 1 (सत्यापन)' : 'Step 2'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                      <span>UTR: <strong className="text-amber-300">{pmt.proofReference || 'Submitted'}</strong></span>
                      {pmt.slipUrl && (
                        <button
                          onClick={() => setShowProofModal({
                            url: pmt.slipUrl!,
                            ref: pmt.proofReference || '',
                            amount: pmt.amount,
                            name: pmt.providerName,
                          })}
                          className="text-emerald-300 hover:text-white underline font-bold cursor-pointer"
                        >
                          स्लिप देखें ➔
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleAcceptIncomingProvide(pmt.providerUserId, pmt.type)}
                        className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>एक्सेप्ट (₹{pmt.amount})</span>
                      </button>
                      <button
                        onClick={() => {
                          setProvideRejectReason('');
                          setShowProvideRejectModal(pmt.type);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5 stroke-[3]" />
                        <span>रिजेक्ट</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                ) : !isReceiveSlipUploaded ? (
                  /* Waiting for provider to upload slip before receiver can accept */
                  <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-400/50 text-center space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                      <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                      <span>प्रदाता द्वारा स्लिप अपलोड की प्रतीक्षा है</span>
                    </div>
                    <p className="text-[10px] text-amber-100 leading-relaxed">
                      प्रदाता सदस्य (<strong>{receiveLink.matchedWithUserName}</strong>) द्वारा सहायता राशि ट्रांसफर कर पेमेंट स्लिप अपलोड करने के बाद ही यहाँ <strong>"एक्सेप्ट"</strong> बटन दिखाई देगा।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Live Income & Received Indicator */}
                    <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-[11px] text-emerald-200 flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-1.5 font-bold">
                        <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>एक्सेप्ट करते ही ₹200 आपके "टोटल रिसिव" में जुड़ेगा</span>
                      </div>
                      <span className="font-mono font-black text-amber-300">
                        वर्तमान कुल: ₹{incomeStats?.totalHelpedReceived ?? 0}
                      </span>
                    </div>

                    <div className={`grid ${receive24hTimer.is24HoursCompleted ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                      <button
                        onClick={handleConfirmReceiveHelp}
                        disabled={isConfirmingReceive}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                        title="राशि प्राप्त हो गई है, स्वीकार करें"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                        <span>[ ACCEPT ₹200 ]</span>
                      </button>

                      {/* रिजेक्ट बटन लिंक के टाइमर के साथ कनेक्ट: 24 घंटे पूरे होने के बाद ही दिखाई देगा */}
                      {receive24hTimer.is24HoursCompleted ? (
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={isConfirmingReceive}
                          className="py-2.5 px-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/60 font-black text-xs uppercase tracking-wider shadow transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 animate-in fade-in"
                          title="24 घंटे पूरे हो चुके हैं, अस्वीकार करें"
                        >
                          <X className="h-3.5 w-3.5 stroke-[3]" />
                          <span>[ REJECT ]</span>
                        </button>
                      ) : null}
                    </div>

                    {/* 24 घंटे पूरे होने से पहले रिजेक्ट लॉक संदेश */}
                    {!receive24hTimer.is24HoursCompleted && (
                      <div className="p-2 rounded-xl bg-sky-950/90 border border-sky-400/30 flex items-center justify-between text-[10px] text-sky-200">
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-pulse" />
                          <span className="truncate">
                            रिजेक्ट बटन 24 घंटे पूरे होने पर खुलेगा (शेष:{' '}
                            <strong className="font-mono text-amber-300 font-bold">
                              {String(receive24hTimer.hours).padStart(2, '0')}:
                              {String(receive24hTimer.minutes).padStart(2, '0')}:
                              {String(receive24hTimer.seconds).padStart(2, '0')}
                            </strong>
                            )
                          </span>
                        </div>
                        {/* Quick simulator for admin/testing verification */}
                        <button
                          type="button"
                          onClick={handleFastForwardReceiveTimer}
                          className="text-[9px] font-bold text-amber-300 hover:text-amber-100 underline cursor-pointer shrink-0 ml-2"
                          title="परीक्षण हेतु 24 घंटे का टाइमर तुरंत समाप्त करें"
                        >
                          ⚡ Test 24h
                        </button>
                      </div>
                    )}

                    <div className="text-[9px] text-sky-200 text-center font-medium">
                      बैंक खाता जांचकर निर्णय लें (स्वीकार करने पर +₹50 शुद्ध लाभ वॉलेट में कॉइन के रूप में जमा होगा)
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
      {/* 💰 USER FINANCIAL DASHBOARD: TOTAL INCOME & RECEIVED TRACKER              */}
      {/* (दिखाई दे दोनों लिंक बॉक्स के ठीक नीचे, 4 अलग-अलग आकर्षक रंगों में)       */}
      {/* ========================================================================= */}
      <div
        id="helping-income-received-tracker"
        className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 p-4 sm:p-5 shadow-2xl space-y-4"
      >
        {/* Tracker Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Total Income &amp; Received Tracker</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                  LIVE TRACKER
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                कुल कमाई एवं सहायता रिपोर्ट — हर बार Receive लिंक एक्सेप्ट करने पर ₹200 आपके "टोटल रिसिव" व वॉलेट में तुरंत जुड़ता है
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <span className="text-slate-400">वर्तमान साइकिल:</span>
            <span className="text-amber-300 font-black">#{cycle.cycleNumber}</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">सफल:</span>
            <span className="text-emerald-400 font-black">{incomeStats?.completedCyclesCount || 0}</span>
          </div>
        </div>

        {/* 4 Cards With 4 Distinct, Vibrant, High-Contrast Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* ========================================================================= */}
          {/* OPTION 1: हरा रंग (EMERALD GREEN) - TOTAL RECEIVED (टोटल रिसिव)           */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-slate-950 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 transition-all hover:border-emerald-300 group">
            <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm">
                    <ArrowDownCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                      टोटल रिसिव
                    </div>
                    <div className="text-[10px] text-emerald-200/80 font-medium">Total Received</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 font-mono font-extrabold uppercase shadow-sm">
                  आय (Income)
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight drop-shadow-md">
                  ₹{incomeStats?.totalHelpedReceived ?? 0}
                </div>
                <div className="text-[11px] text-emerald-200/90 mt-1 font-medium flex items-center justify-between">
                  <span>+{incomeStats?.completedCyclesCount || 0} बार ₹200 प्राप्त</span>
                  <span className="font-mono text-emerald-300 text-[10px] font-bold">+₹200/Accept</span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/30 text-[10px] text-emerald-300/80 flex items-center justify-between">
                <span>कुल सहायता आमदनी</span>
                <span className="font-bold text-emerald-200">₹200 प्रति साइकिल</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OPTION 2: लाल/गुलाबी रंग (ROSE RED) - TOTAL HELP GIVEN (टोटल प्रोवाइड)    */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-950 via-rose-900/60 to-slate-950 border-2 border-rose-400 shadow-lg shadow-rose-500/20 transition-all hover:border-rose-300 group">
            <div className="absolute top-0 right-0 h-20 w-20 bg-rose-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/25 text-rose-300 border border-rose-400/50 shadow-sm">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-rose-300 uppercase tracking-wide">
                      टोटल प्रोवाइड
                    </div>
                    <div className="text-[10px] text-rose-200/80 font-medium">Total Help Given</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/50 font-mono font-extrabold uppercase shadow-sm">
                  दी गई (Out)
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-rose-300 font-mono tracking-tight drop-shadow-md">
                  ₹{incomeStats?.totalHelpedGiven ?? 0}
                </div>
                <div className="text-[11px] text-rose-200/90 mt-1 font-medium flex items-center justify-between">
                  <span>दी गई कुल सहायता</span>
                  <span className="font-mono text-rose-300 text-[10px] font-bold">₹50 + ₹100</span>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-500/30 text-[10px] text-rose-300/80 flex items-center justify-between">
                <span>प्रति साइकिल लागत</span>
                <span className="font-bold text-rose-200">₹150 (₹50+₹100)</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OPTION 3: सुनहरा अंबर रंग (GOLDEN AMBER) - NET PROFIT (कुल शुद्ध लाभ)     */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-950 via-amber-900/60 to-slate-950 border-2 border-amber-400 shadow-lg shadow-amber-500/20 transition-all hover:border-amber-300 group">
            <div className="absolute top-0 right-0 h-20 w-20 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-300 uppercase tracking-wide">
                      कुल शुद्ध लाभ
                    </div>
                    <div className="text-[10px] text-amber-200/80 font-medium">Net Profit</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50 font-mono font-extrabold uppercase shadow-sm">
                  +₹50/साइकिल
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight drop-shadow-md">
                  +₹{incomeStats?.netHelpingProfit ?? 0}
                </div>
                <div className="text-[11px] text-amber-200/90 mt-1 font-medium flex items-center justify-between">
                  <span>रिसिव (₹200) - प्रोवाइड (₹150)</span>
                  <span className="font-mono text-amber-300 text-[10px] font-bold">शुद्ध कमाई</span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-500/30 text-[10px] text-amber-300/80 flex items-center justify-between">
                <span>प्रति चक्र शुद्ध बचत</span>
                <span className="font-bold text-amber-200">+₹50 गारंटीड</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OPTION 4: सियान / नीला रंग (CYAN BLUE) - WALLET BALANCE (वॉलेट बैलेंस)    */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-cyan-950 via-blue-950 to-slate-950 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20 transition-all hover:border-cyan-300 group">
            <div className="absolute top-0 right-0 h-20 w-20 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm">
                    <WalletIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-cyan-300 uppercase tracking-wide">
                      वॉलेट बैलेंस
                    </div>
                    <div className="text-[10px] text-cyan-200/80 font-medium">Available Balance</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-mono font-extrabold uppercase shadow-sm">
                  Ready
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight drop-shadow-md">
                  ₹{(incomeStats?.availableBalance ?? wallet?.availableBalance ?? 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-cyan-200/90 mt-1 font-medium flex items-center justify-between">
                  <span>तुरंत निकासी योग्य शेष</span>
                  <span className="font-mono text-cyan-300 text-[10px] font-bold">UPI / Bank</span>
                </div>
              </div>

              <div className="pt-2 border-t border-cyan-500/30 text-[10px] text-cyan-300/80 flex items-center justify-between">
                <span>निकासी स्थिति</span>
                <span className="font-bold text-cyan-200">24x7 उपलब्ध</span>
              </div>
            </div>
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
                <span className="text-slate-400">This Cycle Help Provided:</span>
                <span className="font-mono font-bold text-rose-400">₹150 (₹50 + ₹100)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">This Cycle Help Received:</span>
                <span className="font-mono font-bold text-emerald-400">₹200</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                <span className="font-bold">Total Received (टोटल रिसिव):</span>
                <span className="font-mono font-black text-emerald-300 text-sm">
                  ₹{incomeStats?.totalHelpedReceived ?? 0}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700 text-sm">
                <span className="text-white font-bold">Net Earnings (कुल शुद्ध लाभ):</span>
                <span className="font-mono font-black text-amber-300">
                  +₹{incomeStats?.netHelpingProfit ?? showCelebrationModal.profit}
                </span>
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

      {/* ========================================================================= */}
      {/* PROVIDE HELP RECEIVER REJECT MODAL                                        */}
      {/* ========================================================================= */}
      {showProvideRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500 p-6 text-white space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <span>
                  स्लिप अस्वीकार करें (Reject ₹
                  {showProvideRejectModal === 'verification' ? 50 : 100} Payment)
                </span>
              </h3>
              <button
                onClick={() => setShowProvideRejectModal(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              रिसीवर के रूप में, यदि आपको प्रेषक सदस्य से ₹
              {showProvideRejectModal === 'verification' ? 50 : 100} का भुगतान बैंक खाते या
              UPI में प्राप्त नहीं हुआ है, तो अस्वीकार करने का कारण चुनें या लिखें:
            </p>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">
                त्वरित कारण चुनें (Quick Select):
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  'बैंक खाते में राशि प्राप्त नहीं हुई (Amount not credited in bank)',
                  'अमान्य / गलत UTR नंबर (Invalid / incorrect UTR reference)',
                  'कम राशि भेजी गई (Partial amount received)',
                  'फर्जी स्लिप स्क्रीनशॉट (Fake or altered screenshot)',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setProvideRejectReason(reason)}
                    className={`text-[11px] px-3 py-1.5 rounded-xl border text-left transition cursor-pointer ${
                      provideRejectReason === reason
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
              <label className="text-xs font-semibold text-slate-300">
                अस्वीकृति का विवरण (Details):
              </label>
              <textarea
                value={provideRejectReason}
                onChange={(e) => setProvideRejectReason(e.target.value)}
                rows={2}
                placeholder="कारण दर्ज करें..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setShowProvideRejectModal(null)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                onClick={() => handleRejectProvideLink(showProvideRejectModal)}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>पुष्टि करें (Confirm Reject)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🪙 User Directive: Flying Gold Coins Animation when Accept button is clicked */}
      {showCoinAnimation && (
        <CoinTransferAnimation
          amount={200}
          onComplete={handleCoinAnimationComplete}
        />
      )}
    </div>
  );
};

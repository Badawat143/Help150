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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { HelpRequest } from '../../types';
import { PaymentSlipUploadModal } from './PaymentSlipUploadModal';

interface Help150DualBoxProps {
  onNavigateTab?: (tab: string) => void;
}

export const Help150DualBox: React.FC<Help150DualBoxProps> = ({ onNavigateTab }) => {
  const { currentUser, refreshUserData } = useAuth();
  const state = db.getState();
  const wallet = currentUser ? state.wallets[currentUser.id] : null;

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: 'provide' | 'receive'; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment verification issue or request not acceptable');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const [inlineUtr, setInlineUtr] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!currentUser) return null;

  // Find all requests for current user
  const allRequests = state.helpRequests.filter(
    (r) => r.userId === currentUser.id || r.matchedWithUserId === currentUser.id
  );

  // Active Provide Help (Current user is the sender/giver)
  const activeProvide = allRequests.find(
    (r) =>
      r.userId === currentUser.id &&
      ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'pending_match', 'matched', 'proof_submitted'].includes(
        r.status
      )
  );

  // Active Receive Help (Current user is the receiver/beneficiary)
  const activeReceive = allRequests.find(
    (r) =>
      r.matchedWithUserId === currentUser.id &&
      ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'pending_match', 'matched', 'proof_submitted'].includes(
        r.status
      )
  );

  // Calculate remaining time for active provide (default 23:59:59 duration)
  const provideExpiry = activeProvide?.timerExpiryTime || (Date.now() + 24 * 3600000 - 1000);
  const [provideTimeLeft, setProvideTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59, isExpired: false });

  // Calculate remaining time for active receive (default 23:59:59 duration)
  const receiveExpiry = activeReceive?.timerExpiryTime || (Date.now() + 24 * 3600000 - 1000);
  const [receiveTimeLeft, setReceiveTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59, isExpired: false });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      
      // Provide timer
      const diffP = Math.max(0, provideExpiry - now);
      setProvideTimeLeft({
        hours: Math.floor(diffP / 3600000),
        minutes: Math.floor((diffP % 3600000) / 60000),
        seconds: Math.floor((diffP % 60000) / 1000),
        isExpired: diffP === 0,
      });

      // Receive timer
      const diffR = Math.max(0, receiveExpiry - now);
      setReceiveTimeLeft({
        hours: Math.floor(diffR / 3600000),
        minutes: Math.floor((diffR % 3600000) / 60000),
        seconds: Math.floor((diffR % 60000) / 1000),
        isExpired: diffR === 0,
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [provideExpiry, receiveExpiry]);

  // Handler: Copy UPI
  const handleCopyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Handler: Copy Mobile
  const handleCopyMobile = (mobile: string) => {
    navigator.clipboard.writeText(mobile);
    setCopiedMobile(true);
    setTimeout(() => setCopiedMobile(false), 2000);
  };

  // Handler: Accept Help Request
  const handleAccept = async (requestId: string, type: 'provide' | 'receive') => {
    setIsAccepting(true);
    setFeedback(null);
    try {
      const res = await api.acceptHelpRequest(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        requestId,
        type
      );
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${type === 'provide' ? 'Provide' : 'Receive'} Help अनुरोध सफलतापूर्वक स्वीकार कर लिया गया!`,
        });
        refreshUserData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'स्वीकार करने में त्रुटि।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error accepting request' });
    } finally {
      setIsAccepting(false);
    }
  };

  // Handler: Open Reject Modal
  const openRejectDialog = (id: string, type: 'provide' | 'receive', name: string) => {
    setRejectTarget({ id, type, name });
    setShowRejectModal(true);
  };

  // Handler: Execute Reject Help Request
  const handleExecuteReject = async () => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    setFeedback(null);
    try {
      const res = await api.rejectHelpRequest(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        rejectTarget.id,
        rejectionReason || 'User requested rejection'
      );
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `अनुरोध #${rejectTarget.id} सफलतापूर्वक अस्वीकार (Reject) कर दिया गया।`,
        });
        setShowRejectModal(false);
        refreshUserData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'अस्वीकार करने में त्रुटि।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error rejecting request' });
    } finally {
      setIsRejecting(false);
    }
  };

  // Handler: Submit Inline UTR
  const handleSubmitInlineUtr = async () => {
    if (!activeProvide) return;
    if (!inlineUtr.trim()) {
      setFeedback({ type: 'error', message: 'कृपया 12-अंकों का मान्य UTR / Reference नंबर दर्ज करें।' });
      return;
    }

    setIsSubmittingUtr(true);
    setFeedback(null);
    try {
      const res = await api.submitHelpPaymentSlip({
        requestId: activeProvide.id,
        userId: currentUser.id,
        referenceNumber: inlineUtr.trim(),
        notes: 'Submitted directly via HELP 150 Dual Box',
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'पेमेंट स्लिप / UTR सफलतापूर्वक सबमिट हो गई! रिसीवर जल्द ही पुष्टि करेगा।' });
        refreshUserData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'सबमिट करने में विफल।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error submitting proof' });
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  // Handler: Confirm Received
  const handleConfirmReceived = async () => {
    if (!activeReceive) return;
    setIsConfirming(true);
    setFeedback(null);

    try {
      const res = await api.confirmHelpReceivedByMember(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        activeReceive.id
      );

      if (res.success) {
        setFeedback({ type: 'success', message: 'बधाई हो! ₹150 सहायता प्राप्त होने की पुष्टि हो गई और वॉलेट में क्रेडिट कर दिया गया।' });
        setShowConfirmModal(false);
        refreshUserData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'कन्फर्म करने में विफल।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error confirming payment' });
    } finally {
      setIsConfirming(false);
    }
  };

  // Handler: Initiate new Provide Help
  const handleInitiateProvideHelp = async () => {
    setIsInitiating(true);
    setFeedback(null);

    try {
      const res = await api.createHelpRequest({
        userId: currentUser.id,
        amount: 150,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'नई प्रोवाइड हेल्प (₹150) सफलतापूर्वक शुरू हो गई और पीयर मैच हो गया!' });
        setShowInitiateModal(false);
        refreshUserData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'अनुरोध बनाने में विफल।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating request' });
    } finally {
      setIsInitiating(false);
    }
  };

  // Handler: Modal Slip Submission
  const handleModalSlipSubmit = async (params: {
    referenceNumber: string;
    notes?: string;
    slipDataUrl?: string;
    slipFileName?: string;
    slipFileType?: string;
    slipFileSize?: number;
  }) => {
    if (!activeProvide) return;
    const res = await api.submitHelpPaymentSlip({
      requestId: activeProvide.id,
      userId: currentUser.id,
      referenceNumber: params.referenceNumber,
      notes: params.notes,
      slipDataUrl: params.slipDataUrl,
      slipFileName: params.slipFileName,
      slipFileType: params.slipFileType,
      slipFileSize: params.slipFileSize,
    });
    if (res.success) {
      setFeedback({ type: 'success', message: 'पेमेंट स्लिप सफलतापूर्वक अपलोड हो गई!' });
      setShowUploadModal(false);
      refreshUserData();
    } else {
      throw new Error(res.error || 'Failed to upload slip');
    }
  };

  // Fallback / Matched values for PROVIDE HELP
  const provideUserName = activeProvide?.matchedWithUserName || 'Rajesh Kumar';
  const provideUserId = activeProvide?.matchedWithUserId || 'HK-892144';
  const provideMobile = activeProvide?.matchedWithMobile || '9876543210';
  const provideEmail = activeProvide?.matchedWithEmail || 'rajesh.k@help150.org';
  const provideAmount = activeProvide?.amount || 150;
  const provideTimerString = `${String(provideTimeLeft.hours).padStart(2, '0')}:${String(provideTimeLeft.minutes).padStart(2, '0')}:${String(provideTimeLeft.seconds).padStart(2, '0')}`;

  // Fallback / Matched values for RECEIVE HELP
  const receiveUserName = activeReceive?.userName || 'Amit Verma';
  const receiveUserId = activeReceive?.userId || 'HK-104923';
  const receiveMobile = activeReceive?.userMobile || '9812345678';
  const receiveEmail = activeReceive?.userEmail || 'amit.v@help150.org';
  const receiveAmount = activeReceive?.amount || 150;
  const receiveTimerString = `${String(receiveTimeLeft.hours).padStart(2, '0')}:${String(receiveTimeLeft.minutes).padStart(2, '0')}:${String(receiveTimeLeft.seconds).padStart(2, '0')}`;

  return (
    <div id="help150-dual-boxes-container" className="space-y-4">
      {/* SECTION HEADER WITH HELP 150 BRANDING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-slate-950 font-black shadow-md">
            <HeartHandshake className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white font-heading tracking-wide flex items-center gap-2">
              <span>HELP 150 DUAL HELPING BOXES</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Peer-to-Peer
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              प्रोवाइड हेल्प (₹150 सहायता भेजें) &amp; रिसिव हेल्प (₹150 सहायता प्राप्त करें)
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('help')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>सभी हेल्प ऑर्डर्स देखें</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Global Feedback Banner */}
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
        {/* 🔴 PROVIDE HELP BOX (पूरा लाल रंग / FULL RED THEMED CARD)                   */}
        {/* ========================================================================= */}
        <div
          id="box-provide-help"
          className="rounded-3xl bg-gradient-to-b from-red-950 via-red-900 to-red-950 border-2 border-red-500 shadow-2xl shadow-red-950/60 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-red-400 transition-all text-white"
        >
          {/* Decorative glowing red background element */}
          <div className="absolute top-0 right-0 h-48 w-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-rose-600/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* 1. Header: 🔴 PROVIDE HELP */}
            <div className="flex items-center justify-between border-b border-red-500/40 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl sm:text-2xl animate-pulse">🔴</span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-wider">
                  PROVIDE HELP
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white text-red-700 shadow-md font-mono border border-red-200">
                ₹150
              </span>
            </div>

            {/* 2. Beneficiary / User Details List */}
            <div className="bg-red-950/90 border border-red-500/50 rounded-2xl p-4 space-y-2.5 shadow-inner">
              {/* 👤 User Name */}
              <div className="flex items-center justify-between text-sm py-1 border-b border-red-900/60">
                <div className="flex items-center gap-2 text-red-200 font-semibold">
                  <span className="text-base">👤</span>
                  <span>User Name</span>
                </div>
                <span className="font-black text-white text-sm sm:text-base tracking-wide">
                  {provideUserName}
                </span>
              </div>

              {/* 🆔 User ID */}
              <div className="flex items-center justify-between text-sm py-1 border-b border-red-900/60">
                <div className="flex items-center gap-2 text-red-200 font-semibold">
                  <span className="text-base">🆔</span>
                  <span>User ID</span>
                </div>
                <span className="font-mono font-bold text-white bg-red-900/80 px-2.5 py-0.5 rounded text-xs">
                  {provideUserId}
                </span>
              </div>

              {/* 📱 Mobile */}
              <div className="flex items-center justify-between text-sm py-1 border-b border-red-900/60">
                <div className="flex items-center gap-2 text-red-200 font-semibold">
                  <span className="text-base">📱</span>
                  <span>Mobile</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-xs sm:text-sm">
                    {provideMobile}
                  </span>
                  <button
                    onClick={() => handleCopyMobile(provideMobile)}
                    className="p-1 rounded bg-red-800 hover:bg-red-700 text-white transition cursor-pointer"
                    title="Copy Mobile"
                  >
                    {copiedMobile ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* 📧 Email */}
              <div className="flex items-center justify-between text-sm py-1 border-b border-red-900/60">
                <div className="flex items-center gap-2 text-red-200 font-semibold">
                  <span className="text-base">📧</span>
                  <span>Email</span>
                </div>
                <span className="font-mono text-red-100 text-xs sm:text-sm truncate max-w-[190px] sm:max-w-[240px]">
                  {provideEmail}
                </span>
              </div>

              {/* 💰 Amount */}
              <div className="flex items-center justify-between text-sm pt-1">
                <div className="flex items-center gap-2 text-red-200 font-semibold">
                  <span className="text-base">💰</span>
                  <span>Amount</span>
                </div>
                <span className="font-black text-white text-base sm:text-lg font-mono bg-white/10 px-3 py-0.5 rounded-lg border border-red-400/40">
                  ₹{provideAmount}
                </span>
              </div>
            </div>

            {/* 3. Center Live Action Timer ⏱ 23:59:59 */}
            <div className="bg-red-950 border-2 border-red-500/60 rounded-2xl py-3 px-4 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2.5">
                <span className="text-2xl animate-pulse">⏱</span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-white tracking-widest drop-shadow">
                  {provideTimerString}
                </span>
              </div>
              <p className="text-[10px] text-red-200 uppercase tracking-widest mt-1 font-semibold">
                Action Window Countdown
              </p>
            </div>

            {/* 4. Action Buttons: [ ACCEPT ] [ REJECT ] */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  if (activeProvide) {
                    handleAccept(activeProvide.id, 'provide');
                  } else {
                    handleInitiateProvideHelp();
                  }
                }}
                disabled={isAccepting || isInitiating}
                className="py-3 px-4 rounded-xl bg-white hover:bg-red-50 text-red-700 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-950/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="h-4 w-4 stroke-[3] text-emerald-600" />
                <span>[ ACCEPT ]</span>
              </button>

              <button
                onClick={() => {
                  if (activeProvide) {
                    openRejectDialog(activeProvide.id, 'provide', provideUserName);
                  } else {
                    setFeedback({ type: 'error', message: 'वर्तमान में कोई सक्रिय प्रोवाइड हेल्प कार्य नहीं है जिसे अस्वीकार किया जा सके।' });
                  }
                }}
                className="py-3 px-4 rounded-xl bg-red-900 hover:bg-red-800 text-white border border-red-400/60 font-black text-xs sm:text-sm uppercase tracking-wider shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="h-4 w-4 stroke-[3] text-red-300" />
                <span>[ REJECT ]</span>
              </button>
            </div>

            {/* 5. Primary Upload Button: 📤 Upload Payment Slip */}
            <button
              onClick={() => {
                if (activeProvide) {
                  setShowUploadModal(true);
                } else {
                  setShowInitiateModal(true);
                }
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl border border-red-400/40 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-base">📤</span>
              <span>Upload Payment Slip</span>
            </button>

            {/* Quick UPI / Pay / QR Assistance */}
            {activeProvide && (
              <div className="pt-2 border-t border-red-900/60 space-y-2">
                <div className="p-2.5 rounded-xl bg-red-900/70 border border-red-500/40 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <CreditCard className="h-4 w-4 text-amber-300 shrink-0" />
                    <span className="font-mono font-bold text-white truncate">
                      {activeProvide.matchedWithUpi || 'help150pay@upi'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyUpi(activeProvide.matchedWithUpi || 'help150pay@upi')}
                      className="px-2 py-1 rounded bg-white text-red-700 text-[10px] font-black cursor-pointer"
                    >
                      {copiedUpi ? 'Copied' : 'Copy UPI'}
                    </button>
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="p-1 rounded bg-red-950 text-white border border-red-500/50 cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inlineUtr}
                    onChange={(e) => setInlineUtr(e.target.value)}
                    placeholder="12-अंकों का UTR दर्ज करें"
                    className="flex-1 p-2 rounded-lg bg-red-950 border border-red-400/50 text-white text-xs font-mono placeholder:text-red-300/40"
                  />
                  <button
                    onClick={handleSubmitInlineUtr}
                    disabled={isSubmittingUtr}
                    className="px-3 py-2 rounded-lg bg-white text-red-700 font-black text-xs cursor-pointer shadow disabled:opacity-50"
                  >
                    {isSubmittingUtr ? '...' : 'सबमिट UTR'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Box 1 Footer Stats */}
          <div className="mt-4 pt-3 border-t border-red-500/30 flex items-center justify-between text-xs text-red-200 relative z-10 font-medium">
            <span>कुल दी गई सहायता (Given):</span>
            <strong className="text-white font-black font-mono text-sm">₹{wallet?.totalHelpedGiven ?? 0}</strong>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🔵 RECEIVE HELP BOX (पूरा नीला आसमानी रंग / FULL SKY BLUE THEMED CARD)       */}
        {/* ========================================================================= */}
        <div
          id="box-receive-help"
          className="rounded-3xl bg-gradient-to-b from-sky-950 via-sky-900 to-cyan-950 border-2 border-sky-400 shadow-2xl shadow-sky-950/60 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-sky-300 transition-all text-white"
        >
          {/* Decorative glowing sky blue background element */}
          <div className="absolute top-0 right-0 h-48 w-48 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-32 w-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* 1. Header: 🔵 RECEIVE HELP */}
            <div className="flex items-center justify-between border-b border-sky-400/40 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl sm:text-2xl animate-pulse">🔵</span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-wider">
                  RECEIVE HELP
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white text-sky-800 shadow-md font-mono border border-sky-200">
                ₹150
              </span>
            </div>

            {/* 2. Sender / User Details List */}
            <div className="bg-sky-950/90 border border-sky-400/50 rounded-2xl p-4 space-y-2.5 shadow-inner">
              {/* 👤 User Name */}
              <div className="flex items-center justify-between text-sm py-1 border-b border-sky-900/60">
                <div className="flex items-center gap-2 text-sky-200 font-semibold">
                  <span className="text-base">👤</span>
                  <span>User Name</span>
                </div>
                <span className="font-black text-white text-sm sm:text-base tracking-wide">
                  {receiveUserName}
                </span>
              </div>

              {/* 🆔 User ID */}
              <div className="flex items-center justify-between text-sm py-1 border-b border-sky-900/60">
                <div className="flex items-center gap-2 text-sky-200 font-semibold">
                  <span className="text-base">🆔</span>
                  <span>User ID</span>
                </div>
                <span className="font-mono font-bold text-white bg-sky-900/80 px-2.5 py-0.5 rounded text-xs">
                  {receiveUserId}
                </span>
              </div>

              {/* 📱 Mobile */}
              <div className="flex items-center justify-between text-sm py-1 border-b border-sky-900/60">
                <div className="flex items-center gap-2 text-sky-200 font-semibold">
                  <span className="text-base">📱</span>
                  <span>Mobile</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-xs sm:text-sm">
                    {receiveMobile}
                  </span>
                  <button
                    onClick={() => handleCopyMobile(receiveMobile)}
                    className="p-1 rounded bg-sky-800 hover:bg-sky-700 text-white transition cursor-pointer"
                    title="Copy Mobile"
                  >
                    {copiedMobile ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* 📧 Email */}
              <div className="flex items-center justify-between text-sm py-1 border-b border-sky-900/60">
                <div className="flex items-center gap-2 text-sky-200 font-semibold">
                  <span className="text-base">📧</span>
                  <span>Email</span>
                </div>
                <span className="font-mono text-sky-100 text-xs sm:text-sm truncate max-w-[190px] sm:max-w-[240px]">
                  {receiveEmail}
                </span>
              </div>

              {/* 💰 Amount */}
              <div className="flex items-center justify-between text-sm pt-1">
                <div className="flex items-center gap-2 text-sky-200 font-semibold">
                  <span className="text-base">💰</span>
                  <span>Amount</span>
                </div>
                <span className="font-black text-white text-base sm:text-lg font-mono bg-white/10 px-3 py-0.5 rounded-lg border border-sky-300/40">
                  ₹{receiveAmount}
                </span>
              </div>
            </div>

            {/* 3. Center Live Action Timer ⏱ 23:59:59 */}
            <div className="bg-sky-950 border-2 border-sky-400/60 rounded-2xl py-3 px-4 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2.5">
                <span className="text-2xl animate-pulse">⏱</span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-white tracking-widest drop-shadow">
                  {receiveTimerString}
                </span>
              </div>
              <p className="text-[10px] text-sky-200 uppercase tracking-widest mt-1 font-semibold">
                Sender Action Countdown
              </p>
            </div>

            {/* 4. Action Buttons: [ ACCEPT ] [ REJECT ] */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  if (activeReceive) {
                    handleAccept(activeReceive.id, 'receive');
                  } else {
                    setFeedback({ type: 'success', message: 'रिसिव हेल्प क्यू सक्रिय है! नया मैच आते ही स्वतः असाइन होगा।' });
                  }
                }}
                disabled={isAccepting}
                className="py-3 px-4 rounded-xl bg-white hover:bg-sky-50 text-sky-800 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-sky-950/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="h-4 w-4 stroke-[3] text-emerald-600" />
                <span>[ ACCEPT ]</span>
              </button>

              <button
                onClick={() => {
                  if (activeReceive) {
                    openRejectDialog(activeReceive.id, 'receive', receiveUserName);
                  } else {
                    setFeedback({ type: 'error', message: 'वर्तमान में कोई सक्रिय रिसिव हेल्प कार्य नहीं है जिसे अस्वीकार किया जा सके।' });
                  }
                }}
                className="py-3 px-4 rounded-xl bg-sky-900 hover:bg-sky-800 text-white border border-sky-300/60 font-black text-xs sm:text-sm uppercase tracking-wider shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="h-4 w-4 stroke-[3] text-sky-300" />
                <span>[ REJECT ]</span>
              </button>
            </div>

            {/* 5. View Payment Slip Button: 📎 View Payment Slip */}
            <button
              onClick={() => {
                if (activeReceive?.paymentSlipUrl) {
                  setSelectedProofUrl(activeReceive.paymentSlipUrl);
                  setShowProofModal(true);
                } else if (activeReceive?.proofReference) {
                  setSelectedProofUrl(null);
                  setShowProofModal(true);
                } else {
                  setSelectedProofUrl(null);
                  setShowProofModal(true);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-sky-900/90 hover:bg-sky-800 text-white border border-sky-300/60 font-black text-xs sm:text-sm uppercase tracking-wider shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Paperclip className="h-4 w-4 stroke-[2.5] text-sky-300" />
              <span>View Payment Slip</span>
            </button>

            {/* 6. Primary Action: [ CONFIRM PAYMENT RECEIVED ] */}
            <button
              onClick={() => {
                if (activeReceive) {
                  setShowConfirmModal(true);
                } else {
                  setFeedback({ type: 'error', message: 'भुगतान पुष्टि के लिए सक्रिय रिसीव हेल्प आर्डर होना आवश्यक है।' });
                }
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-sky-800 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 text-sky-600 stroke-[3]" />
              <span>[ CONFIRM PAYMENT RECEIVED ]</span>
            </button>
          </div>

          {/* Box 2 Footer Stats */}
          <div className="mt-4 pt-3 border-t border-sky-400/30 flex items-center justify-between text-xs text-sky-200 relative z-10 font-medium">
            <span>कुल प्राप्त सहायता (Received):</span>
            <strong className="text-white font-black font-mono text-sm">₹{wallet?.totalHelpedReceived ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* ================= MODALS & POPUPS ================= */}

      {/* 1. UPI QR Code Modal (Provide Help - Red Accent) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border-2 border-red-500/60 p-6 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-red-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="h-4 w-4 text-red-400" />
                <span>Scan &amp; Pay ₹150</span>
              </h3>
              <button onClick={() => setShowQrModal(false)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `upi://pay?pa=${activeProvide?.matchedWithUpi || 'help150pay@upi'}&pn=${encodeURIComponent(
                    provideUserName
                  )}&am=150&cu=INR&tn=HELP150%20Provide%20Help`
                )}`}
                alt="QR Code"
                className="w-40 h-40 object-contain"
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-white">{provideUserName}</div>
              <div className="font-mono text-red-400 font-bold">{activeProvide?.matchedWithUpi || 'help150pay@upi'}</div>
            </div>

            <button
              onClick={() => handleCopyUpi(activeProvide?.matchedWithUpi || 'help150pay@upi')}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/40"
            >
              {copiedUpi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedUpi ? 'Copied to Clipboard' : 'Copy UPI ID'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Upload Payment Slip Modal */}
      {showUploadModal && activeProvide && (
        <PaymentSlipUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          requestId={activeProvide.id}
          recipientName={provideUserName}
          amount={provideAmount}
          initialUtr={inlineUtr}
          onSubmit={handleModalSlipSubmit}
        />
      )}

      {/* 3. View Proof Modal (Receive Help - Sky Blue Accent) */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border-2 border-sky-400/60 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sky-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-sky-400" />
                <span>Payment Screenshot Proof</span>
              </h3>
              <button onClick={() => setShowProofModal(false)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedProofUrl ? (
              <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-72 bg-slate-950 flex items-center justify-center">
                <img src={selectedProofUrl} alt="Payment Proof" className="max-h-72 w-auto object-contain" />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-center space-y-2">
                <FileCheck2 className="h-10 w-10 text-sky-400 mx-auto" />
                <p className="text-xs text-sky-200">
                  {activeReceive?.proofReference
                    ? `सबमिट किया गया UTR / Transaction No: ${activeReceive.proofReference}`
                    : 'सेंडर द्वारा UTR या पेमेंट स्लिप सबमिट होने पर यहाँ दिखाई देगी।'}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowProofModal(false)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-lg"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* 4. Confirm Payment Received Modal (Receive Help - Sky Blue Accent) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border-2 border-sky-400/60 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sky-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
                <span>Confirm ₹150 Received</span>
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-sky-950/50 border border-sky-400/40 space-y-2 text-xs">
              <p className="text-slate-200">
                क्या आप पुष्टि करते हैं कि <strong>{receiveUserName}</strong> द्वारा भेजा गया <strong>₹150</strong> आपके खाते में प्राप्त हो चुका है?
              </p>
              <div className="font-mono text-sky-300 bg-slate-950/80 p-2.5 rounded-xl border border-sky-400/30 font-bold">
                UTR / Ref: {activeReceive?.proofReference || 'N/A'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleConfirmReceived}
                disabled={isConfirming}
                className="py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-950/40 transition disabled:opacity-50 cursor-pointer"
              >
                {isConfirming ? 'पुष्टि हो रही है...' : 'हाँ, पेमेंट मिल गया'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reject Request Modal */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border-2 border-red-500/60 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Reject Help Request ({rejectTarget.type === 'provide' ? 'Provide' : 'Receive'})</span>
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                क्या आप वाकई <strong>{rejectTarget.name}</strong> के साथ मैच किए गए अनुरोध <strong>#{rejectTarget.id}</strong> को अस्वीकार (Reject) करना चाहते हैं?
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-1.5 block">
                  अस्वीकार करने का कारण (Reason for Rejection):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
                  placeholder="कारण दर्ज करें..."
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['Payment not received', 'Incorrect UPI details', 'Fake UTR submitted', 'Other reason'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectionReason(chip)}
                    className="text-[10px] px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleExecuteReject}
                disabled={isRejecting}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-950/40 transition disabled:opacity-50 cursor-pointer"
              >
                {isRejecting ? 'अस्वीकार हो रहा है...' : 'हाँ, Reject करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Initiate Provide Help Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border-2 border-red-500/60 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-400" />
                <span>Start Provide Help (₹150)</span>
              </h3>
              <button onClick={() => setShowInitiateModal(false)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/50 border border-red-500/40 space-y-2 text-xs">
              <p className="text-slate-200">
                आप कम्युनिटी में <strong>₹150</strong> की सहायता प्रदान करने जा रहे हैं। सिस्टम तुरंत आपको एक सक्रिय रिसीवर से मैच करेगा।
              </p>
              <ul className="text-red-300 space-y-1 list-disc list-inside font-medium">
                <li>24 घंटे का एक्शन टाइमर मिलेगा।</li>
                <li>सीधे UPI / QR द्वारा भुगतान होगा।</li>
                <li>भुगतान के बाद UTR सबमिट करना आवश्यक है।</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowInitiateModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleInitiateProvideHelp}
                disabled={isInitiating}
                className="py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-red-950/40 transition disabled:opacity-50 cursor-pointer"
              >
                {isInitiating ? 'मैच हो रहा है...' : 'पुष्टि करें और मैच पाएं'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

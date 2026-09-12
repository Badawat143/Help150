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
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Send,
  ExternalLink,
  Hourglass,
  Lock,
  FileCheck2,
} from 'lucide-react';
import { HelpRequest, User } from '../../types';
import { StatusBadge } from './StatusBadge';
import { PaymentSlipUploadModal } from './PaymentSlipUploadModal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ProvideHelpCardProps {
  request: HelpRequest;
  currentUser: User;
  onRefresh: () => void;
  onViewDetails?: (req: HelpRequest) => void;
}

export const ProvideHelpCard: React.FC<ProvideHelpCardProps> = ({
  request,
  currentUser,
  onRefresh,
  onViewDetails,
}) => {
  const toast = useToast();
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Direct Inline UTR State
  const [inlineUtr, setInlineUtr] = useState(request.proofReference || '');
  const [isSubmittingInline, setIsSubmittingInline] = useState(false);

  // Server-synchronized 24-Hour Countdown Timer calculation
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 23,
    minutes: 59,
    seconds: 59,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const expiry = request.timerExpiryTime || now + 24 * 3600000;
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        // Automatically sync expiry with server if not yet marked
        if (!['COMPLETED', 'REJECTED', 'EXPIRED', 'completed', 'cancelled', 'expired'].includes(request.status)) {
          api.checkAndUpdateExpiredHelpTimers().then(() => {
            onRefresh();
          });
        }
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [request.timerExpiryTime, request.status]);

  const recipientName = request.matchedWithUserName || 'Assigned Peer Member';
  const recipientId = request.matchedWithUserId || 'H150-PEER';
  const recipientMobile = request.matchedWithMobile || '9876543210';
  const recipientEmail = request.matchedWithEmail || `${recipientId.toLowerCase()}@help150.org`;
  const recipientUpi = request.matchedWithUpi || 'help150.treasury@icici';
  const amount = request.amount || 150;

  // Status flags
  const isAccepted = Boolean(
    request.senderAccepted ||
      ['ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'PAYMENT_VERIFIED', 'COMPLETED', 'matched', 'proof_submitted', 'completed'].includes(
        request.status
      )
  );

  const isSlipUploaded = Boolean(
    request.paymentSlipUrl ||
      request.proofReference ||
      ['SLIP_UPLOADED', 'VERIFICATION_PENDING', 'PAYMENT_VERIFIED', 'COMPLETED', 'proof_submitted', 'completed'].includes(request.status)
  );

  const isVerificationPending = Boolean(
    request.status === 'VERIFICATION_PENDING' ||
      request.status === 'SLIP_UPLOADED' ||
      request.status === 'proof_submitted'
  );

  const isCompleted = request.status === 'COMPLETED' || request.status === 'completed';
  const isRejected = request.status === 'REJECTED' || request.status === 'cancelled';
  const isExpired = request.status === 'EXPIRED' || request.status === 'expired' || timeLeft.isExpired;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    toast.info(`Copied UPI ID: ${text}`, 'Copied');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleConfirmAccept = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await api.acceptHelpRequest(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        request.id,
        'provide'
      );
      if (res.success) {
        toast.success(
          'Provide Help request accepted successfully! Please proceed to transfer payment.',
          'Request Accepted'
        );
        setShowAcceptModal(false);
        onRefresh();
      } else {
        toast.error(res.error || 'Failed to accept request', 'Error');
        setErrorMsg(res.error || 'Failed to accept request');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred', 'Error');
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Please enter a rejection reason', 'Reason Required');
      setErrorMsg('Please enter a rejection reason');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await api.rejectHelpRequest(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        request.id,
        rejectReason.trim()
      );
      if (res.success) {
        toast.warning('Provide Help request rejected and closed.', 'Request Rejected');
        setShowRejectModal(false);
        onRefresh();
      } else {
        toast.error(res.error || 'Failed to reject request', 'Error');
        setErrorMsg(res.error || 'Failed to reject request');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred', 'Error');
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSlipModalSubmit = async (params: {
    referenceNumber: string;
    notes?: string;
    slipDataUrl?: string;
    slipFileName?: string;
    slipFileType?: string;
    slipFileSize?: number;
  }) => {
    const res = await api.submitHelpPaymentSlip({
      requestId: request.id,
      userId: currentUser.id,
      referenceNumber: params.referenceNumber,
      notes: params.notes,
      slipDataUrl: params.slipDataUrl,
      slipFileName: params.slipFileName,
      slipFileType: params.slipFileType,
      slipFileSize: params.slipFileSize,
    });

    if (res.success) {
      toast.success('Payment slip uploaded successfully! Verification is now pending.', 'Slip Uploaded');
      onRefresh();
    } else {
      toast.error(res.error || 'Failed to submit payment slip', 'Error');
      throw new Error(res.error || 'Failed to submit payment slip');
    }
  };

  const handleDirectUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineUtr.trim()) {
      toast.warning('Please enter transaction UTR reference number', 'UTR Required');
      setErrorMsg('Please enter transaction UTR reference number');
      return;
    }
    setIsSubmittingInline(true);
    setErrorMsg(null);
    try {
      const res = await api.submitHelpPaymentSlip({
        requestId: request.id,
        userId: currentUser.id,
        referenceNumber: inlineUtr.trim(),
        notes: 'Submitted via Quick UTR Reference Form',
      });
      if (res.success) {
        toast.success(`Payment reference #${inlineUtr} submitted successfully!`, 'UTR Submitted');
        onRefresh();
      } else {
        toast.error(res.error || 'Submission failed', 'Error');
        setErrorMsg(res.error || 'Submission failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit UTR', 'Error');
      setErrorMsg(err.message || 'Failed to submit UTR');
    } finally {
      setIsSubmittingInline(false);
    }
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Timer Color Classes
  const timerBadgeColor = timeLeft.isExpired
    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
    : timeLeft.hours < 2
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-red-950 via-slate-900 to-red-950 border-2 border-red-500 shadow-2xl shadow-red-950/50 overflow-hidden transition-all duration-300 hover:border-red-400">
      {/* 🔴 PROVIDE HELP Header with Deep Red Theme */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b border-red-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-600/40 font-black text-lg">
              🔴
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide font-heading">
                  PROVIDE HELP
                </h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white text-red-700 font-black border border-red-200">
                  {request.id}
                </span>
              </div>
              <p className="text-xs text-red-200 mt-0.5 font-medium">
                PROVIDE HELP REQUEST • Peer Mutual Assistance (Send Help)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <StatusBadge status={request.status} size="md" />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Recipient Details Grid */}
        <div className="p-4 sm:p-5 rounded-2xl bg-red-950/80 border border-red-500/40 space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between border-b border-red-900/60 pb-2.5">
            <span className="text-xs font-bold text-red-200 uppercase tracking-wider">
              Recipient Details
            </span>
            <span className="text-xs font-mono font-bold text-red-100 bg-red-800/80 px-2 py-0.5 rounded-full border border-red-400/40">
              Matched Member
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-red-100">
              <span className="text-base">👤</span>
              <div className="min-w-0">
                <p className="text-[10px] text-red-300 font-medium">Recipient Name</p>
                <p className="font-bold text-white truncate">{recipientName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-red-100">
              <span className="text-base">🆔</span>
              <div className="min-w-0">
                <p className="text-[10px] text-red-300 font-medium">User ID</p>
                <p className="font-mono font-bold text-amber-300">{recipientId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-red-100">
              <span className="text-base">📱</span>
              <div className="min-w-0">
                <p className="text-[10px] text-red-300 font-medium">Mobile</p>
                <a
                  href={`tel:${recipientMobile}`}
                  className="font-bold text-white hover:text-amber-300 transition"
                >
                  {recipientMobile}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-red-100">
              <span className="text-base">📧</span>
              <div className="min-w-0">
                <p className="text-[10px] text-red-300 font-medium">Email</p>
                <p className="font-medium text-red-200 truncate">{recipientEmail}</p>
              </div>
            </div>
          </div>

          {/* Amount & 24-Hour Server-Synchronized Timer Highlight */}
          <div className="pt-3 border-t border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-950/90 p-3 rounded-xl border border-red-500/30">
            <div>
              <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">
                💰 Help Amount
              </p>
              <p className="text-2xl font-black text-amber-300 font-heading">
                ₹{amount}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-base">🕐</span>
              <div>
                <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">
                  Remaining 24-Hour Timer
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg border tracking-wider ${timerBadgeColor}`}
                  >
                    {timeLeft.isExpired
                      ? 'EXPIRED'
                      : `${pad(timeLeft.hours)} : ${pad(timeLeft.minutes)} : ${pad(timeLeft.seconds)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Top-Level Action: VIEW DETAILS */}
        {!isCompleted && !isRejected && !isExpired && (
          <div className="pt-1">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="w-full py-3 px-4 rounded-2xl bg-red-900/60 hover:bg-red-900/80 border border-red-500/50 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Eye className="h-4 w-4 text-amber-300" />
              <span>🔴 VIEW DETAILS</span>
            </button>
          </div>
        )}

        {/* 3. PAYMENT DETAILS & UPLOAD SLIP */}
        {!isCompleted && !isRejected && !isExpired && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-red-950/90 via-slate-950 to-red-950/90 border border-red-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-red-900/60 pb-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-300" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Payment Details
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-200 border border-red-500/40">
                Ready to Pay
              </span>
            </div>

            {/* Recipient UPI Handle & Bank Details */}
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-900/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-red-200">Recipient UPI ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-red-800">
                    {recipientUpi}
                  </span>
                  <button
                    onClick={() => handleCopy(recipientUpi)}
                    className="p-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-white transition cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {request.matchedWithBankDetails && (
                <div className="text-[11px] text-red-200 border-t border-red-900/60 pt-2 flex flex-wrap justify-between gap-1">
                  <span>Bank: <strong className="text-white">{request.matchedWithBankDetails.bankName}</strong></span>
                  <span>A/C: <strong className="text-white">{request.matchedWithBankDetails.accountNumber}</strong></span>
                  <span>IFSC: <strong className="text-white">{request.matchedWithBankDetails.ifscCode}</strong></span>
                </div>
              )}

              {/* Direct UPI App Links */}
              <div className="pt-2 border-t border-red-900/60 flex flex-wrap gap-2">
                <a
                  href={`upi://pay?pa=${recipientUpi}&pn=${encodeURIComponent(recipientName)}&am=${amount}&cu=INR`}
                  className="px-3 py-1.5 rounded-xl bg-red-900/80 hover:bg-red-800 border border-red-500/40 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                >
                  <Send className="h-3 w-3 text-amber-300" />
                  <span>PhonePe / GPay / Paytm</span>
                </a>
              </div>
            </div>

            {/* If slip already uploaded / verification pending */}
            {isVerificationPending && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Hourglass className="h-4 w-4 animate-spin" />
                  <span>🟡 PAYMENT VERIFICATION PENDING</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  You have submitted payment with Reference:{' '}
                  <strong className="font-mono text-white">{request.proofReference}</strong>.
                  Verification is in progress. Duplicate submission is disabled for security.
                </p>
                {request.paymentSlipUrl && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      📎 Attached: {request.paymentSlipFileName || 'payment_slip.png'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Slip Upload & UTR Submission Section */}
            {!isVerificationPending && !isCompleted && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-200 flex items-center gap-1.5">
                    <UploadCloud className="h-4 w-4 text-amber-300" />
                    <span>📤 UPLOAD PAYMENT SLIP</span>
                  </span>
                  <span className="text-[10px] text-red-300/70">JPG, JPEG, PNG, PDF</span>
                </div>

                {/* Quick UTR Reference Form */}
                <form onSubmit={handleDirectUtrSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={inlineUtr}
                    onChange={(e) => setInlineUtr(e.target.value)}
                    placeholder="Enter 12-digit UTR / UPI Reference *"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-red-950 border border-red-500/40 text-xs text-white placeholder-red-300/40 focus:outline-none focus:border-white font-mono tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingInline}
                    className="py-2.5 px-4 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs transition cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isSubmittingInline ? 'Submitting...' : 'SUBMIT PAYMENT'}
                  </button>
                </form>

                {/* Big Upload Slip Modal Button */}
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:to-red-700 border border-red-400 text-white font-black text-xs shadow-lg shadow-red-950/60 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4 text-amber-300" />
                  <span>UPLOAD SLIP (ATTACH DOCUMENT / SCREENSHOT)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Completed State View */}
        {isCompleted && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-200">Help Successfully Completed & Verified</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Voluntary ₹{amount} community assistance confirmed by recipient. Reference: <span className="font-mono text-white">{request.proofReference || 'VERIFIED'}</span>
              </p>
            </div>
          </div>
        )}

        {/* 5. Rejection / Expiry State */}
        {isRejected && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
            <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-200">Request Rejected</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Reason: {request.rejectionReason || 'Declined by participant'}
              </p>
            </div>
          </div>
        )}

        {isExpired && !isCompleted && !isRejected && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-300">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-200">12-Hour Time Window Expired</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                This help assignment window has expired. Status automatically transitioned by server.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Accept Confirmation Popup */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-emerald-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Accept Help Request?</h3>
                <p className="text-xs text-slate-400">Request #{request.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              “Are you sure you want to accept this help request?”
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p>Recipient: <strong className="text-white">{recipientName}</strong></p>
              <p>Amount: <strong className="text-emerald-400">₹{amount}</strong></p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition cursor-pointer"
              >
                {isProcessing ? 'Accepting...' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Popup */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Help Request</h3>
                <p className="text-xs text-slate-400">Request #{request.id}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Enter Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Inactive bank handle / Unable to process right now"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg transition cursor-pointer"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-blue-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Provide Help Assignment Details</h3>
                  <p className="text-xs text-slate-400">Request #{request.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-slate-400">Assigned Recipient: <strong className="text-white">{recipientName}</strong> ({recipientId})</p>
                <p className="text-slate-400">Recipient Phone: <strong className="text-white">{recipientMobile}</strong></p>
                <p className="text-slate-400">Recipient Email: <strong className="text-white">{recipientEmail}</strong></p>
                <p className="text-slate-400">Assistance Amount: <strong className="text-emerald-400 font-bold">₹{amount}</strong></p>
                <p className="text-slate-400">Created At: <span className="text-slate-300">{new Date(request.createdAt).toLocaleString()}</span></p>
                <p className="text-slate-400">Timer Expiry: <span className="text-rose-300 font-mono">{request.timerExpiryTime ? new Date(request.timerExpiryTime).toLocaleString() : '12 Hours from assignment'}</span></p>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-blue-300 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  <span>Compliance & Instructions:</span>
                </p>
                <p>1. Review details and click ACCEPT to confirm participation.</p>
                <p>2. Transfer ₹{amount} via UPI to the provided recipient handle.</p>
                <p>3. Submit the 12-digit UTR reference or upload transaction slip screenshot within 12 hours.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Upload Modal Component */}
      <PaymentSlipUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        requestId={request.id}
        recipientName={recipientName}
        amount={amount}
        initialUtr={inlineUtr}
        onSubmit={handleSlipModalSubmit}
      />
    </div>
  );
};

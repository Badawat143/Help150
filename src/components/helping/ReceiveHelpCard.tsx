import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Download,
  CheckCheck,
  Lock,
  Hourglass,
  ArrowRight,
  ZoomIn,
} from 'lucide-react';
import { HelpRequest, User } from '../../types';
import { StatusBadge } from './StatusBadge';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ReceiveHelpCardProps {
  request: HelpRequest;
  currentUser: User;
  onRefresh: () => void;
}

export const ReceiveHelpCard: React.FC<ReceiveHelpCardProps> = ({
  request,
  currentUser,
  onRefresh,
}) => {
  const toast = useToast();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 24-Hour Server-Synchronized Timer calculation
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

  const senderName = request.userName || 'Assigned Peer Member';
  const senderId = request.userId || 'H150-MEMBER';
  const senderMobile = request.userMobile || '9876543210';
  const senderEmail = request.userEmail || `${senderId.toLowerCase()}@help150.org`;
  const amount = request.amount || 150;

  // Status flags
  const isAccepted = Boolean(
    request.receiverAccepted ||
      ['ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'PAYMENT_VERIFIED', 'COMPLETED', 'matched', 'proof_submitted', 'completed'].includes(
        request.status
      )
  );

  const isSlipUploaded = Boolean(
    request.paymentSlipUrl ||
      request.proofReference ||
      ['SLIP_UPLOADED', 'VERIFICATION_PENDING', 'PAYMENT_VERIFIED', 'COMPLETED', 'proof_submitted', 'completed'].includes(request.status)
  );

  const isCompleted = request.status === 'COMPLETED' || request.status === 'completed';
  const isRejected = request.status === 'REJECTED' || request.status === 'cancelled';
  const isExpired = request.status === 'EXPIRED' || request.status === 'expired' || timeLeft.isExpired;

  const handleConfirmAccept = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await api.acceptHelpRequest(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        request.id,
        'receive'
      );
      if (res.success) {
        toast.success(
          'Receive Help assignment accepted successfully! Peer notified to transfer payment.',
          'Request Accepted'
        );
        setShowAcceptModal(false);
        onRefresh();
      } else {
        toast.error(res.error || 'Failed to accept request', 'Error');
        setErrorMsg(res.error || 'Failed to accept');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred', 'Error');
      setErrorMsg(err.message || 'Error occurred');
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
        toast.warning('Help request rejected and reassignment scheduled.', 'Request Rejected');
        setShowRejectModal(false);
        onRefresh();
      } else {
        toast.error(res.error || 'Failed to reject', 'Error');
        setErrorMsg(res.error || 'Failed to reject');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred', 'Error');
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceivedPayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await api.confirmHelpReceivedByMember(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        request.id
      );
      if (res.success) {
        toast.paymentSuccess(
          `Payment of ₹${amount} confirmed! Your wallet has been credited with ₹${amount}.`,
          'Payment Received & Verified 🎉'
        );
        setShowConfirmReceivedModal(false);
        onRefresh();
      } else {
        toast.error(res.error || 'Failed to confirm payment receipt', 'Error');
        setErrorMsg(res.error || 'Failed to confirm payment receipt');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error confirming receipt', 'Error');
      setErrorMsg(err.message || 'Error confirming receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Timer Color Classes
  const timerBadgeColor = timeLeft.isExpired
    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
    : timeLeft.hours < 2
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-2 border-sky-500/50 shadow-2xl shadow-sky-950/30 overflow-hidden transition-all duration-300 hover:border-sky-400">
      {/* 🔵 RECEIVE HELP Header with Sky Blue Gradient */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-950 via-slate-900 to-cyan-950 border-b border-sky-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-600 text-white shadow-lg shadow-sky-500/30 font-black text-lg">
              🔵
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-sky-400 tracking-wide font-heading">
                  RECEIVE HELP
                </h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {request.id}
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5 font-medium">
                RECEIVE HELP ASSIGNMENT • Peer Mutual Inflow
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

        {/* 1. Sender Details Grid */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sender Details
            </span>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Assigned Giver
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="text-base">👤</span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">Sender Name</p>
                <p className="font-bold text-white truncate">{senderName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="text-base">🆔</span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">Sender User ID</p>
                <p className="font-mono font-bold text-rose-400">{senderId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="text-base">📱</span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">Mobile Number</p>
                <a
                  href={`tel:${senderMobile}`}
                  className="font-bold text-slate-200 hover:text-blue-400 transition"
                >
                  {senderMobile}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="text-base">📧</span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">Email Address</p>
                <p className="font-medium text-slate-300 truncate">{senderEmail}</p>
              </div>
            </div>
          </div>

          {/* Amount & Large Timer Display */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-950/30 to-rose-950/30 p-3 rounded-xl">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                💰 Help Amount Incoming
              </p>
              <p className="text-2xl font-black text-blue-400 font-heading">
                ₹{amount}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-base">🕐</span>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  12-Hour Remaining Window
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

        {/* 2. Action Buttons (ACCEPT, REJECT) if pending acceptance */}
        {!isAccepted && !isCompleted && !isRejected && !isExpired && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setShowAcceptModal(true)}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>🟢 ACCEPT</span>
            </button>

            <button
              onClick={() => setShowRejectModal(true)}
              className="py-3 px-4 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              <span>🔴 REJECT</span>
            </button>
          </div>
        )}

        {/* 3. PAYMENT STATUS & RECEIPT VERIFICATION (Shows after acceptance) */}
        {isAccepted && !isCompleted && !isRejected && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-blue-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Payment Status Flow</span>
              </h4>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                24-Hour Sync
              </span>
            </div>

            {/* Visual Step Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-center">
              <div
                className={`p-2 rounded-xl border ${
                  isAccepted
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                1. Accepted
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  isSlipUploaded
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                2. Slip Uploaded
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  request.status === 'VERIFICATION_PENDING' || request.status === 'proof_submitted'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                3. Verification
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                4. Completed
              </div>
            </div>

            {/* Submitted Payment Information */}
            {request.proofReference ? (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Transaction UTR / Ref:</span>
                  <span className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                    {request.proofReference}
                  </span>
                </div>
                {request.proofNotes && (
                  <p className="text-[11px] text-slate-400">Notes: {request.proofNotes}</p>
                )}
                {request.proofSubmittedAt && (
                  <p className="text-[10px] text-slate-500">
                    Uploaded: {new Date(request.proofSubmittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                Awaiting sender member ({senderName}) to transfer payment and upload payment slip.
              </div>
            )}

            {/* Slip Preview Button & Confirm Received Button */}
            <div className="space-y-2.5 pt-1">
              {request.paymentSlipUrl && (
                <button
                  type="button"
                  onClick={() => setShowSlipModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span>📎 VIEW PAYMENT SLIP DOCUMENT</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowConfirmReceivedModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>🟢 CONFIRM PAYMENT RECEIVED (₹{amount})</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Completed State */}
        {isCompleted && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-200">Payment Confirmed & Balance Credited</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                ₹{amount} successfully received from {senderName}. Wallet credited.
              </p>
            </div>
          </div>
        )}

        {/* 5. Rejected / Expired State */}
        {isRejected && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
            <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-200">Request Closed / Rejected</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Reason: {request.rejectionReason || 'Declined'}
              </p>
            </div>
          </div>
        )}

        {isExpired && !isCompleted && !isRejected && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-300">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-200">12-Hour Timer Expired</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                The allocated time window has ended for this incoming help assignment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Accept Confirmation Popup */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-blue-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Accept Receive Help Assignment?</h3>
                <p className="text-xs text-slate-400">Request #{request.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Confirm your availability to receive ₹{amount} from {senderName}.
            </p>

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
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg transition cursor-pointer"
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
                <h3 className="text-base font-bold text-white">Reject Assignment</h3>
                <p className="text-xs text-slate-400">Request #{request.id}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Account not ready / Reassign"
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

      {/* Confirm Payment Received Popup */}
      {showConfirmReceivedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-emerald-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Payment Received</h3>
                <p className="text-xs text-slate-400">Request #{request.id}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <p className="text-slate-300">
                “Have you actually received and verified this payment of <strong className="text-emerald-400 font-bold">₹{amount}</strong> in your bank account / UPI app from <strong className="text-white">{senderName}</strong>?”
              </p>
              {request.proofReference && (
                <p className="text-[11px] text-slate-400">
                  Provided UTR: <span className="font-mono text-white font-bold">{request.proofReference}</span>
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Confirming this will complete the transaction and permanently update both members' ledgers.</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReceivedModal(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReceivedPayment}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition cursor-pointer"
              >
                {isProcessing ? 'Verifying...' : 'Yes, Confirm Received'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Preview Modal */}
      {showSlipModal && request.paymentSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-cyan-500/30 p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Payment Slip Document</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Ref: {request.proofReference || 'N/A'} • {request.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 border border-slate-800 p-4 flex items-center justify-center">
              {request.paymentSlipFileType === 'application/pdf' ? (
                <div className="text-center p-8 space-y-3">
                  <FileText className="h-16 w-16 text-cyan-400 mx-auto" />
                  <p className="text-sm font-bold text-white">PDF Bank Statement / E-Receipt</p>
                  <p className="text-xs text-slate-400">{request.paymentSlipFileName || 'payment_slip.pdf'}</p>
                </div>
              ) : (
                <img
                  src={request.paymentSlipUrl}
                  alt="Payment Slip"
                  className="max-h-[60vh] w-auto object-contain rounded-xl shadow-lg"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Uploaded by {senderName} at{' '}
                {request.paymentSlipUploadedAt
                  ? new Date(request.paymentSlipUploadedAt).toLocaleString()
                  : 'N/A'}
              </span>
              <button
                onClick={() => setShowSlipModal(false)}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

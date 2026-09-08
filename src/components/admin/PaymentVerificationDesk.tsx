import React, { useState } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldCheck,
  FileText,
  User,
  Calendar,
  CreditCard,
  Check,
} from 'lucide-react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { HelpRequest, User as UserType } from '../../types';
import { StatusBadge } from '../helping/StatusBadge';

interface PaymentVerificationDeskProps {
  currentUser: UserType;
  onRefresh: () => void;
}

export const PaymentVerificationDesk: React.FC<PaymentVerificationDeskProps> = ({
  currentUser,
  onRefresh,
}) => {
  const state = db.getState();
  const helpRequests = state.helpRequests;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedSlipReq, setSelectedSlipReq] = useState<HelpRequest | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<HelpRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reuploadModalReq, setReuploadModalReq] = useState<HelpRequest | null>(null);
  const [reuploadNotes, setReuploadNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter help requests with slips or UTRs
  const requestsWithSlips = helpRequests.filter(
    (r) => r.paymentSlipUrl || r.proofReference || ['SLIP_UPLOADED', 'VERIFICATION_PENDING', 'proof_submitted', 'COMPLETED', 'completed'].includes(r.status)
  );

  const filteredRequests = requestsWithSlips.filter((req) => {
    // Search match
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      req.id.toLowerCase().includes(searchLower) ||
      (req.userName && req.userName.toLowerCase().includes(searchLower)) ||
      (req.userId && req.userId.toLowerCase().includes(searchLower)) ||
      (req.proofReference && req.proofReference.toLowerCase().includes(searchLower)) ||
      (req.matchedWithUserName && req.matchedWithUserName.toLowerCase().includes(searchLower));

    if (!matchSearch) return false;

    // Status filter
    if (statusFilter === 'pending') {
      return req.status === 'VERIFICATION_PENDING' || req.status === 'SLIP_UPLOADED' || req.status === 'proof_submitted' || req.slipReviewStatus === 'pending';
    }
    if (statusFilter === 'verified') {
      return req.status === 'COMPLETED' || req.status === 'completed' || req.slipReviewStatus === 'verified';
    }
    if (statusFilter === 'rejected') {
      return req.status === 'REJECTED' || req.slipReviewStatus === 'rejected';
    }
    return true;
  });

  const handleVerify = async (req: HelpRequest) => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await api.adminReviewPaymentSlip({
        adminActor: { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        requestId: req.id,
        action: 'verify',
        notes: `Verified by ${currentUser.fullName} from Payment Desk`,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `Request #${req.id} payment verified and ledger settled!` });
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Verification failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error verifying' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    if (!rejectionReason.trim()) {
      setFeedback({ type: 'error', message: 'Rejection reason is required' });
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await api.adminReviewPaymentSlip({
        adminActor: { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        requestId: rejectModalReq.id,
        action: 'reject',
        rejectionReason: rejectionReason.trim(),
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `Payment slip for #${rejectModalReq.id} rejected.` });
        setRejectModalReq(null);
        setRejectionReason('');
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Rejection failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error rejecting' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReupload = async () => {
    if (!reuploadModalReq) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await api.adminReviewPaymentSlip({
        adminActor: { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        requestId: reuploadModalReq.id,
        action: 'request_new_slip',
        notes: reuploadNotes.trim() || 'Please re-upload a legible payment slip with clear UTR number.',
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `Re-upload requested for #${reuploadModalReq.id}.` });
        setReuploadModalReq(null);
        setReuploadNotes('');
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to request reupload' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error requesting re-upload' });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = requestsWithSlips.filter(
    (r) => r.status === 'VERIFICATION_PENDING' || r.status === 'SLIP_UPLOADED' || r.status === 'proof_submitted' || r.slipReviewStatus === 'pending'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 border border-blue-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-heading flex items-center gap-2">
              <span>Admin Payment Verification Desk</span>
              {pendingCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Review transaction slips, verify 12-digit UTRs, and authorize peer assistance ledger settlements.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({requestsWithSlips.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'verified'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Request ID, Sender / Receiver Name, User ID, or UTR Number..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Verification Records List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
            <FileCheck2 className="h-12 w-12 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No Payment Slips Found</p>
            <p className="text-xs text-slate-500">
              No transactions currently match the selected filter criteria.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPendingReview =
              req.status === 'VERIFICATION_PENDING' ||
              req.status === 'SLIP_UPLOADED' ||
              req.status === 'proof_submitted' ||
              req.slipReviewStatus === 'pending';

            return (
              <div
                key={req.id}
                className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-xl space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-white bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-700">
                      {req.id}
                    </span>
                    <StatusBadge status={req.status} size="sm" />
                    <span className="text-base font-black text-emerald-400 font-heading">
                      ₹{req.amount}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Created: {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Counterparty and Payment Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Sender Details */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                      Sender (Help Giver)
                    </span>
                    <p className="font-bold text-white">{req.userName}</p>
                    <p className="text-slate-400 font-mono text-[11px]">ID: {req.userId}</p>
                    <p className="text-slate-400 text-[11px]">Mobile: {req.userMobile || 'N/A'}</p>
                    <p className="text-slate-400 text-[11px] truncate">Email: {req.userEmail || `${req.userId.toLowerCase()}@help150.org`}</p>
                  </div>

                  {/* Receiver Details */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      Receiver (Help Beneficiary)
                    </span>
                    <p className="font-bold text-white">{req.matchedWithUserName || 'System Treasury'}</p>
                    <p className="text-slate-400 font-mono text-[11px]">ID: {req.matchedWithUserId || 'H150-ADMIN01'}</p>
                    <p className="text-slate-400 text-[11px]">Mobile: {req.matchedWithMobile || '9876543210'}</p>
                    <p className="text-slate-400 text-[11px] truncate">UPI: {req.matchedWithUpi || 'help150.treasury@icici'}</p>
                  </div>

                  {/* Transaction Reference & Slip Info */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        UTR / Transaction Ref
                      </span>
                      <p className="font-mono font-bold text-amber-300 text-sm mt-0.5">
                        {req.proofReference || 'No UTR Submitted'}
                      </p>
                      {req.proofNotes && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">"{req.proofNotes}"</p>
                      )}
                    </div>

                    {req.paymentSlipUrl ? (
                      <button
                        onClick={() => setSelectedSlipReq(req)}
                        className="mt-2 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                        <span>Preview Attached Slip</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">No file document attached</span>
                    )}
                  </div>
                </div>

                {/* Admin Verification Action Buttons */}
                {isPendingReview && (
                  <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-slate-800">
                    <button
                      onClick={() => handleVerify(req)}
                      disabled={isProcessing}
                      className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>VERIFY PAYMENT (₹{req.amount})</span>
                    </button>

                    <button
                      onClick={() => setRejectModalReq(req)}
                      disabled={isProcessing}
                      className="py-2.5 px-4 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>REJECT PAYMENT</span>
                    </button>

                    <button
                      onClick={() => setReuploadModalReq(req)}
                      disabled={isProcessing}
                      className="py-2.5 px-4 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>REQUEST NEW SLIP</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Slip Zoom / Preview Modal */}
      {selectedSlipReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-blue-500/30 p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Payment Slip Document</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Req: {selectedSlipReq.id} • UTR: {selectedSlipReq.proofReference || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlipReq(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 border border-slate-800 p-4 flex items-center justify-center">
              {selectedSlipReq.paymentSlipFileType === 'application/pdf' ? (
                <div className="text-center p-8 space-y-3">
                  <FileText className="h-16 w-16 text-cyan-400 mx-auto" />
                  <p className="text-sm font-bold text-white">PDF Bank Statement Document</p>
                  <p className="text-xs text-slate-400">{selectedSlipReq.paymentSlipFileName || 'receipt.pdf'}</p>
                </div>
              ) : (
                <img
                  src={selectedSlipReq.paymentSlipUrl}
                  alt="Payment Slip"
                  className="max-h-[60vh] w-auto object-contain rounded-xl shadow-lg"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Uploaded by {selectedSlipReq.userName}
              </span>
              <button
                onClick={() => setSelectedSlipReq(null)}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Payment Proof</h3>
                <p className="text-xs text-slate-400">Request #{rejectModalReq.id}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Mandatory Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid / fabricated UTR number, amount mismatch, illegible slip"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
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

      {/* Request New Slip Modal */}
      {reuploadModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-amber-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Request Slip Re-Upload</h3>
                <p className="text-xs text-slate-400">Request #{reuploadModalReq.id}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Instructions for User (Notes)
              </label>
              <textarea
                rows={3}
                value={reuploadNotes}
                onChange={(e) => setReuploadNotes(e.target.value)}
                placeholder="e.g. Please upload an uncropped bank transaction receipt showing full 12-digit UTR"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReuploadModalReq(null)}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReupload}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs shadow-lg transition cursor-pointer"
              >
                {isProcessing ? 'Sending...' : 'Request Re-upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

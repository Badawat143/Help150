import React, { useState } from 'react';
import {
  HeartHandshake,
  ArrowRight,
  ExternalLink,
  Phone,
  MessageCircle,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Clock,
  Send,
  Download,
  Share2,
  UserCheck,
  Sparkles,
  AlertTriangle,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { db } from '../../services/db';
import { HelpRequest, User } from '../../types';
import { CountdownTimer } from '../common/CountdownTimer';

interface MemberLinkBoxProps {
  onNavigateTab?: (tab: string) => void;
}

export const MemberLinkBox: React.FC<MemberLinkBoxProps> = ({ onNavigateTab }) => {
  const { currentUser, refreshUserData } = useAuth();
  const state = db.getState();
  const defaultAmount = state.settings.helpAmountDefault || 150;

  const [activeTab, setActiveTab] = useState<'send_link' | 'receive_link' | 'share_link'>('send_link');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [confirmingReceiptId, setConfirmingReceiptId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!currentUser) return null;

  // Active outgoing link where current user must pay ₹150 to a peer member
  const outgoingRequest = state.helpRequests.find(
    (r) =>
      r.userId === currentUser.id &&
      [
        'pending_match',
        'matched',
        'proof_submitted',
        'PENDING',
        'ACCEPTED',
        'PAYMENT_PENDING',
        'SLIP_UPLOADED',
        'VERIFICATION_PENDING',
      ].includes(r.status)
  );

  // Incoming links where other members are assigned to pay ₹150 to current user
  const incomingRequests = state.helpRequests.filter(
    (r) => r.matchedWithUserId === currentUser.id
  );
  const pendingIncomingRequests = incomingRequests.filter(
    (r) => !['completed', 'COMPLETED', 'PAYMENT_VERIFIED', 'cancelled', 'EXPIRED'].includes(r.status)
  );

  // Matched receiver user object if available
  const matchedReceiverUser: User | undefined = outgoingRequest?.matchedWithUserId
    ? state.users.find((u) => u.id === outgoingRequest.matchedWithUserId)
    : undefined;

  const receiverUpi = outgoingRequest?.matchedWithUpi || state.settings.adminUpiId || 'help150.treasury@icici';
  const receiverName = outgoingRequest?.matchedWithUserName || 'HELP150 Community Peer';
  const receiverPhone = outgoingRequest?.matchedWithMobile || matchedReceiverUser?.mobile || '9876543210';

  // UPI Deep Link for direct app opening on smartphones
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(receiverUpi)}&pn=${encodeURIComponent(
    receiverName
  )}&am=${defaultAmount}&cu=INR&tn=${encodeURIComponent(`HELP150 Peer Assistance from ${currentUser.fullName}`)}`;

  // Shareable direct member helping link
  const origin = window.location.origin;
  const directMemberHelpLink = `${origin}/?sponsor=${currentUser.id}&help_to=${currentUser.id}`;

  const handleCopy = (text: string, type: 'upi' | 'link' | 'card') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (type === 'card') {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingRequest) return;
    setFeedbackMsg(null);

    if (!utrNumber.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please enter valid 12-digit UPI/Bank UTR Reference Number' });
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await api.submitHelpProof({
        requestId: outgoingRequest.id,
        userId: currentUser.id,
        referenceNumber: utrNumber.trim(),
        notes: `Member-to-Member Direct Help sent to ${receiverName}`,
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Payment proof UTR: ${utrNumber.trim()} submitted! Notified receiver member and admin.`,
        });
        setUtrNumber('');
        refreshUserData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to submit proof' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error submitting proof' });
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleConfirmReceived = async (reqId: string) => {
    if (!window.confirm('Are you sure you have received ₹150 in your UPI/Bank from this member?')) {
      return;
    }

    setConfirmingReceiptId(reqId);
    try {
      const res = await api.confirmHelpReceivedByMember(
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role },
        reqId
      );

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: '₹150 Help Receipt successfully verified and credited to your wallet!',
        });
        refreshUserData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Could not verify payment' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Verification error' });
    } finally {
      setConfirmingReceiptId(null);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white font-heading">
                  Member-to-Member Helping Link Box
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Direct P2P Link
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Voluntary 1:1 mutual help link between community members • Direct UPI & WhatsApp connect
              </p>
            </div>
          </div>

          {/* Tab Navigation Chips */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('send_link')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'send_link'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>🔴 Provide Help Link (Red)</span>
              {outgoingRequest && <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
            </button>

            <button
              onClick={() => setActiveTab('receive_link')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
                activeTab === 'receive_link'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>🔵 Receive Help Box (Sky Blue)</span>
              {pendingIncomingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-950 text-sky-300 font-black">
                  {pendingIncomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('share_link')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'share_link'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share My Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification / Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Send Help Member Link Box */}
      {activeTab === 'send_link' && (
        <div className="p-6 space-y-6">
          {outgoingRequest ? (
            <div className="space-y-6">
              {/* Member-to-Member Visual Link diagram */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-slate-800 relative overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 text-center sm:text-left">
                  Live Member-to-Member Peer Link Flow
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  {/* Sender (You) */}
                  <div className="flex items-center gap-3 w-full sm:w-auto p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {currentUser.fullName}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                          YOU (Sender)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {currentUser.id}</div>
                    </div>
                  </div>

                  {/* Flow Arrow & Amount Pill */}
                  <div className="flex flex-col items-center justify-center gap-1 text-center py-1 sm:py-0">
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      <span>₹{outgoingRequest.amount} Direct Help Link</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-[10px] font-mono">
                      <span>──── 12h Timer Active ────▶</span>
                    </div>
                  </div>

                  {/* Receiver (Matched Peer Member) */}
                  <div className="flex items-center gap-3 w-full sm:w-auto p-3 rounded-2xl bg-slate-900 border border-emerald-500/30">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm">
                      {receiverName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {receiverName}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          RECEIVER (Peer)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {outgoingRequest.matchedWithUserId || 'Pool'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 12-Hour Timer & Quick Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Direct Member Payment Details & Contacts */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Timer Widget */}
                  <CountdownTimer
                    requestId={outgoingRequest.id}
                    startTime={outgoingRequest.timerStartTime}
                    expiryTime={outgoingRequest.timerExpiryTime}
                    status={outgoingRequest.timerStatus}
                  />

                  {/* Matched Member Direct Box */}
                  <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Matched Member Payment Details
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                        100% Direct Peer Transfer
                      </span>
                    </div>

                    {/* Member UPI Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-slate-400">Member UPI ID:</div>
                        <div className="text-sm font-mono font-bold text-blue-300">{receiverUpi}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(receiverUpi, 'upi')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowQrModal(true)}
                          className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer transition"
                          title="Show QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Direct Contact Member Actions */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href={`https://wa.me/91${receiverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hello ${receiverName}, I am ${currentUser.fullName} (ID: ${currentUser.id}) on HELP150. I am linked to send you ₹${outgoingRequest.amount} mutual help.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-400" />
                        <span>WhatsApp Chat</span>
                      </a>

                      <a
                        href={`tel:${receiverPhone}`}
                        className="p-2.5 rounded-2xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Phone className="h-4 w-4 text-blue-400" />
                        <span>Call Member</span>
                      </a>
                    </div>

                    {/* 1-Click Pay on PhonePe/GPay/Paytm (Mobile Direct) */}
                    <a
                      href={upiDeepLink}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open UPI App to Pay ₹{outgoingRequest.amount}</span>
                    </a>
                  </div>
                </div>

                {/* Right Column: UTR Proof Submission Form */}
                <div className="lg:col-span-6">
                  <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="h-5 w-5 text-amber-400" />
                        <h4 className="text-sm font-bold text-white font-heading">
                          Confirm Payment to {receiverName}
                        </h4>
                      </div>

                      {outgoingRequest.status === 'proof_submitted' ? (
                        <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500/30 text-center space-y-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                            <Check className="h-5 w-5" />
                          </div>
                          <div className="text-xs font-bold text-white">Payment Proof Submitted</div>
                          <div className="text-xs text-amber-400 font-mono bg-slate-950 p-2 rounded-xl border border-slate-800">
                            UTR Reference: {outgoingRequest.proofReference}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Waiting for receiver member or admin to verify the transaction. Your referral rewards and next queue eligibility will activate instantly once confirmed.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitProof} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              12-Digit Bank UTR / UPI Transaction Reference <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={utrNumber}
                              onChange={(e) => setUtrNumber(e.target.value)}
                              placeholder="e.g. 409281948201"
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-white placeholder-slate-500 font-mono"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Enter the reference number from your payment confirmation screen.
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={submittingProof}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            <span>{submittingProof ? 'Submitting UTR...' : 'Submit Member-to-Member Proof'}</span>
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                      💡 <strong>P2P Tip:</strong> Send the screenshot of payment to {receiverName} on WhatsApp for instantaneous 1-minute verification!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No Active Outgoing Help Pending</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  You have no pending ₹{defaultAmount} outgoing help links. You can initiate a new help request or share your link to grow your community!
                </p>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('help')}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Initiate ₹{defaultAmount} Help Request</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Receive Help Member Link Box (Incoming Direct Assistance) */}
      {activeTab === 'receive_link' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Incoming Member-to-Member Links</h3>
              <p className="text-xs text-slate-400">
                Community members assigned by the algorithm to provide ₹{defaultAmount} assistance directly to you
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-amber-400 font-bold">
              {incomingRequests.length} Total Matched
            </span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <Clock className="h-8 w-8 text-slate-500 mx-auto" />
              <div className="text-xs font-bold text-slate-300">No Incoming Member Links Right Now</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Once you complete your ₹150 helping obligation and sponsor active members, incoming links will be assigned to your UPI.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => {
                const isPending = req.status !== 'completed';
                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isPending
                        ? 'bg-slate-950 border-amber-500/40 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {req.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{req.userName}</span>
                          <span className="font-mono text-[10px] text-amber-400">({req.userId})</span>
                          <span
                            className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                              req.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : req.status === 'proof_submitted'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {req.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Amount: <strong className="text-white font-mono">₹{req.amount}</strong></span>
                          {req.proofReference && (
                            <span>• UTR: <strong className="text-amber-300 font-mono">{req.proofReference}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons for receiver */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isPending ? (
                        <button
                          onClick={() => handleConfirmReceived(req.id)}
                          disabled={confirmingReceiptId === req.id}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{confirmingReceiptId === req.id ? 'Verifying...' : 'Confirm ₹150 Received'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Verified & Credited
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Share My Member Help Link & Social Card */}
      {activeTab === 'share_link' && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Link & QR Code Box */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Your Personal Member Direct Helping Link</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Share this link with your contacts. When they join, they will be mapped in your Level-1 network and link directly to you for mutual assistance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-[11px] font-semibold text-slate-400">Direct Helping Invite URL:</label>
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <code className="text-xs text-amber-300 font-mono truncate flex-1">{directMemberHelpLink}</code>
                  <button
                    onClick={() => handleCopy(directMemberHelpLink, 'link')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition shrink-0"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Direct WhatsApp and Telegram Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `🤝 Join the HELP150 Mutual Assistance Community!\n\nUse my direct member link:\n${directMemberHelpLink}\n\nSponsor ID: ${currentUser.id}\nTransparent Peer-to-Peer System with 12-Hour Verification.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Share on WhatsApp</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    directMemberHelpLink
                  )}&text=${encodeURIComponent(
                    `Join HELP150 Community with Member ID ${currentUser.id}!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share on Telegram</span>
                </a>
              </div>
            </div>

            {/* Right: Preview Member Invitation Card */}
            <div className="lg:col-span-5">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    MEMBER PASS
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">HELP150 COMM</span>
                </div>

                <div className="space-y-1">
                  <div className="text-base font-black text-white font-heading">{currentUser.fullName}</div>
                  <div className="text-xs font-mono text-amber-400 font-bold">Member ID: {currentUser.id}</div>
                  <div className="text-[11px] text-slate-400">Status: Active Peer Participant</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  "I invite you to join our peer-to-peer voluntary mutual help network with transparent 12-hour timer verification."
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      `🤝 HELP150 Peer Assistance Invitation\n\nMember: ${currentUser.fullName}\nSponsor ID: ${currentUser.id}\nLink: ${directMemberHelpLink}`,
                      'card'
                    )
                  }
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  {copiedCard ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCard ? 'Invitation Copied!' : 'Copy Text Invitation Card'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Scan & Pay ₹{defaultAmount}</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  upiDeepLink
                )}`}
                alt="UPI Payment QR Code"
                className="h-48 w-48 object-contain"
              />
              <div className="text-[11px] font-mono font-bold text-slate-900 mt-2 text-center">
                {receiverUpi}
              </div>
            </div>

            <div className="text-center text-xs text-slate-300">
              Paying: <strong className="text-white">{receiverName}</strong> (₹{defaultAmount})
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  HeartHandshake,
  Send,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  QrCode,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Phone,
} from 'lucide-react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { HelpRequest, User } from '../../types';
import { CountdownTimer } from '../common/CountdownTimer';

interface MemberToMemberLinkBoxProps {
  currentUser: { id: string; name: string; role: string; fullName?: string };
  onRefresh?: () => void;
}

export const MemberToMemberLinkBox: React.FC<MemberToMemberLinkBoxProps> = ({
  currentUser,
  onRefresh,
}) => {
  const state = db.getState();
  const allUsers = state.users || [];
  const defaultHelpAmount = state.settings.helpAmountDefault || 150;

  // Form states for creating a new P2P link
  const [senderUserId, setSenderUserId] = useState<string>('');
  const [receiverUserId, setReceiverUserId] = useState<string>('');
  const [amount, setAmount] = useState<number>(defaultHelpAmount);
  const [timerHours, setTimerHours] = useState<number>(12);
  const [remarks, setRemarks] = useState<string>('');
  const [senderSearch, setSenderSearch] = useState('');
  const [receiverSearch, setReceiverSearch] = useState('');

  // Table filter & search
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'proof_submitted' | 'completed' | 'expired'>('all');
  const [tableSearch, setTableSearch] = useState('');

  // Modal / Feedback states
  const [generatedLinkData, setGeneratedLinkData] = useState<{
    helpRequest: HelpRequest;
    shareUrl: string;
    waMessageUrl: string;
  } | null>(null);
  const [reassignModalReq, setReassignModalReq] = useState<HelpRequest | null>(null);
  const [newReceiverForReassign, setNewReceiverForReassign] = useState<string>('');
  const [viewSlipReq, setViewSlipReq] = useState<HelpRequest | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Link / Text copied to clipboard!');
  };

  // Filtered members for dropdowns
  const filteredSenders = allUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(senderSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(senderSearch.toLowerCase()) ||
      u.mobile.includes(senderSearch)
  );

  const filteredReceivers = allUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(receiverSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(receiverSearch.toLowerCase()) ||
      u.mobile.includes(receiverSearch)
  );

  const selectedSender = allUsers.find((u) => u.id === senderUserId);
  const selectedReceiver =
    receiverUserId === 'ADMIN_TREASURY'
      ? { id: 'ADMIN_TREASURY', fullName: 'HELP150 Central Treasury', mobile: '9876543210' }
      : allUsers.find((u) => u.id === receiverUserId);

  const receiverKyc = state.kycRecords.find((k) => k.userId === receiverUserId);
  const receiverUpi =
    receiverUserId === 'ADMIN_TREASURY'
      ? state.settings.adminUpiId || 'help150.treasury@icici'
      : receiverKyc?.upiId || (selectedReceiver ? `${selectedReceiver.id.toLowerCase()}@upi` : 'help150@upi');

  // Submit Link Creation
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderUserId) {
      showToast('Please select a Sender (Provider) Member.', 'error');
      return;
    }
    if (!receiverUserId) {
      showToast('Please select a Receiver (Beneficiary) Member.', 'error');
      return;
    }
    if (senderUserId === receiverUserId) {
      showToast('Sender and Receiver cannot be the same user.', 'error');
      return;
    }

    setIsProcessing(true);
    const res = await api.adminCreateMemberToMemberLink({
      adminActor: {
        id: currentUser.id || 'ADMIN-1',
        name: currentUser.fullName || currentUser.name || 'Super Admin',
        role: currentUser.role || 'admin',
      },
      senderUserId,
      receiverUserId,
      amount: Number(amount),
      timerHours: Number(timerHours),
      remarks: remarks.trim() || undefined,
    });

    setIsProcessing(false);
    if (res.success && res.data) {
      setGeneratedLinkData(res.data);
      showToast(`Member-to-Member Link #${res.data.helpRequest.id} dispatched successfully!`);
      // Reset form
      setSenderUserId('');
      setReceiverUserId('');
      setRemarks('');
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || 'Failed to dispatch member link.', 'error');
    }
  };

  // Reassign receiver
  const handleConfirmReassign = async () => {
    if (!reassignModalReq || !newReceiverForReassign) return;
    setIsProcessing(true);
    const res = await api.adminReassignMemberLink({
      adminActor: {
        id: currentUser.id || 'ADMIN-1',
        name: currentUser.fullName || currentUser.name || 'Super Admin',
        role: currentUser.role || 'admin',
      },
      requestId: reassignModalReq.id,
      newReceiverUserId: newReceiverForReassign,
      reason: 'Admin re-assignment',
    });
    setIsProcessing(false);
    if (res.success) {
      showToast(`Link #${reassignModalReq.id} reassigned successfully.`);
      setReassignModalReq(null);
      setNewReceiverForReassign('');
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || 'Failed to reassign receiver.', 'error');
    }
  };

  // Cancel link
  const handleCancelLink = async (requestId: string) => {
    if (!window.confirm(`Are you sure you want to cancel P2P link #${requestId}?`)) return;
    const res = await api.adminCancelMemberLink({
      adminActor: {
        id: currentUser.id || 'ADMIN-1',
        name: currentUser.fullName || currentUser.name || 'Super Admin',
        role: currentUser.role || 'admin',
      },
      requestId,
      reason: 'Cancelled by Admin from Link Box',
    });
    if (res.success) {
      showToast(`Link #${requestId} cancelled.`);
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || 'Failed to cancel link.', 'error');
    }
  };

  // Force approve link
  const handleForceApprove = async (requestId: string) => {
    if (!window.confirm(`Confirm immediate verification & completion for link #${requestId}?`)) return;
    const res = await api.approveHelpRequest(
      {
        id: currentUser.id || 'ADMIN-1',
        name: currentUser.fullName || currentUser.name || 'Super Admin',
        role: currentUser.role || 'admin',
      },
      requestId,
      'Force approved by Admin from Member Link Box'
    );
    if (res.success) {
      showToast(`Help link #${requestId} verified and completed!`);
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || 'Failed to approve help request.', 'error');
    }
  };

  // Filtered Help Requests in table
  const allHelpRequests = state.helpRequests || [];
  const filteredHelpRequests = allHelpRequests.filter((req) => {
    const isPending = ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'matched', 'pending_match'].includes(req.status);
    const isProof = ['SLIP_UPLOADED', 'VERIFICATION_PENDING', 'proof_submitted'].includes(req.status);
    const isCompleted = ['COMPLETED', 'PAYMENT_VERIFIED', 'completed'].includes(req.status);
    const isExpired = ['EXPIRED', 'REJECTED', 'cancelled', 'expired'].includes(req.status);

    if (filterStatus === 'pending' && !isPending) return false;
    if (filterStatus === 'proof_submitted' && !isProof) return false;
    if (filterStatus === 'completed' && !isCompleted) return false;
    if (filterStatus === 'expired' && !isExpired) return false;

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchSender = req.userName?.toLowerCase().includes(q) || req.userId?.toLowerCase().includes(q);
      const matchReceiver = req.matchedWithUserName?.toLowerCase().includes(q) || req.matchedWithUserId?.toLowerCase().includes(q);
      const matchId = req.id?.toLowerCase().includes(q);
      const matchUpi = req.matchedWithUpi?.toLowerCase().includes(q);
      if (!matchSender && !matchReceiver && !matchId && !matchUpi) return false;
    }
    return true;
  });

  // Statistics
  const totalLinks = allHelpRequests.length;
  const pendingPaymentLinks = allHelpRequests.filter((r) =>
    ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'matched', 'pending_match'].includes(r.status)
  ).length;
  const verificationPendingLinks = allHelpRequests.filter((r) =>
    ['SLIP_UPLOADED', 'VERIFICATION_PENDING', 'proof_submitted'].includes(r.status)
  ).length;
  const completedLinks = allHelpRequests.filter((r) =>
    ['COMPLETED', 'PAYMENT_VERIFIED', 'completed'].includes(r.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* TOAST ALERT */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border border-emerald-500'
              : 'bg-rose-600 text-white border border-rose-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="opacity-80 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0A1938] via-[#0F2A66] to-[#1E3A8A] p-6 text-white shadow-xl border border-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Admin P2P Matcher & Dispatcher</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 font-heading">
              <span>Member-to-Member Send Link Box</span>
              <HeartHandshake className="h-7 w-7 text-amber-400" />
            </h2>
            <p className="text-xs text-blue-100 max-w-2xl font-medium leading-relaxed">
              Match Provider & Beneficiary members directly. Generate official P2P payment links, dispatch automated WhatsApp messages with receiver UPI/QR, and monitor 12h/24h timers in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (onRefresh) onRefresh();
                showToast('Refreshed live P2P member links!');
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-sm border border-white/10 transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Links</span>
            </button>
          </div>
        </div>

        {/* 4 SUMMARY STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] text-blue-200 font-bold uppercase">Total P2P Links</div>
            <div className="text-xl font-black text-white font-heading mt-0.5">{totalLinks}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] text-amber-300 font-bold uppercase">Payment Pending</div>
            <div className="text-xl font-black text-amber-400 font-heading mt-0.5">{pendingPaymentLinks}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] text-cyan-300 font-bold uppercase">Slip Verification</div>
            <div className="text-xl font-black text-cyan-400 font-heading mt-0.5">{verificationPendingLinks}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] text-emerald-300 font-bold uppercase">Completed & Verified</div>
            <div className="text-xl font-black text-emerald-400 font-heading mt-0.5">{completedLinks}</div>
          </div>
        </div>
      </div>

      {/* DISPATCH NEW LINK FORM */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">Generate & Dispatch Member-to-Member Link</h3>
              <p className="text-xs text-slate-500">Select Provider and Beneficiary to create a direct peer help assignment.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateLink} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SENDER SELECTION */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  <span>1. Select Sender (Give Help Member)</span>
                </label>
                {selectedSender && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {selectedSender.id}
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sender by name, mobile, ID..."
                  value={senderSearch}
                  onChange={(e) => setSenderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                />
              </div>

              <select
                value={senderUserId}
                onChange={(e) => setSenderUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose Sender Member --</option>
                {filteredSenders.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.id}) • {u.mobile} • {u.status.toUpperCase()}
                  </option>
                ))}
              </select>

              {selectedSender && (
                <div className="pt-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{selectedSender.fullName}</span>
                    <span className="text-slate-400 ml-1">({selectedSender.mobile})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedSender.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedSender.status}
                  </span>
                </div>
              )}
            </div>

            {/* RECEIVER SELECTION */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span>2. Select Receiver (Receive Help Member)</span>
                </label>
                {selectedReceiver && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {selectedReceiver.id}
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receiver by name, mobile, ID..."
                  value={receiverSearch}
                  onChange={(e) => setReceiverSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                />
              </div>

              <select
                value={receiverUserId}
                onChange={(e) => setReceiverUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- Choose Receiver Member --</option>
                <option value="ADMIN_TREASURY">👑 HELP150 Central Treasury (Platform Receiving UPI)</option>
                {filteredReceivers
                  .filter((u) => u.id !== senderUserId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.id}) • {u.mobile} • {u.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                    </option>
                  ))}
              </select>

              {selectedReceiver && (
                <div className="pt-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{selectedReceiver.fullName}</span>
                    <span className="font-mono text-emerald-600 font-bold">{receiverUpi}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Phone: {selectedReceiver.mobile} {receiverKyc?.bankName ? `• Bank: ${receiverKyc.bankName}` : ''}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: AMOUNT & TIMER CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Help Amount (₹)</label>
              <div className="flex items-center gap-1.5">
                {[150, 300, 500, 1000].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                      amount === amt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 font-mono font-bold text-xs text-slate-900 text-center"
                  placeholder="Custom"
                />
              </div>
            </div>

            {/* Countdown Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Countdown Window</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[6, 12, 24, 48].map((hrs) => (
                  <button
                    type="button"
                    key={hrs}
                    onClick={() => setTimerHours(hrs)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                      timerHours === hrs
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Admin Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Dispatch Note (Optional)</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Level 1 mandatory activation link"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isProcessing || !senderUserId || !receiverUserId}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isProcessing ? 'Generating Link...' : '⚡ Generate & Dispatch Member-to-Member Link'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* POPUP MODAL: DISPATCH SUCCESS & WHATSAPP SHARING */}
      {generatedLinkData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">P2P Member Link Generated!</h3>
                  <p className="text-xs text-slate-500 font-mono">Request ID: #{generatedLinkData.helpRequest.id}</p>
                </div>
              </div>
              <button
                onClick={() => setGeneratedLinkData(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Sender (Payer):</span>
                <span className="font-bold text-slate-900">
                  {generatedLinkData.helpRequest.userName} ({generatedLinkData.helpRequest.userId})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Receiver (Payee):</span>
                <span className="font-bold text-emerald-700">
                  {generatedLinkData.helpRequest.matchedWithUserName} ({generatedLinkData.helpRequest.matchedWithUserId})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Payee UPI ID:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {generatedLinkData.helpRequest.matchedWithUpi}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Amount & Timer:</span>
                <span className="font-black text-red-600 font-mono text-sm">
                  ₹{generatedLinkData.helpRequest.amount} • {generatedLinkData.helpRequest.timerDurationHours || 12} Hours
                </span>
              </div>
            </div>

            {/* COPYABLE LINK BOX */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Shareable P2P Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLinkData.shareUrl}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 bg-slate-50 select-all"
                />
                <button
                  onClick={() => handleCopyText(generatedLinkData.shareUrl, 'modal_link')}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === 'modal_link' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* DISPATCH ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              <a
                href={generatedLinkData.waMessageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Send Direct WhatsApp Message to Sender ({generatedLinkData.helpRequest.userMobile})</span>
              </a>

              <button
                onClick={() => setGeneratedLinkData(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN RECEIVER MODAL */}
      {reassignModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">Reassign P2P Help Receiver</h3>
                  <p className="text-xs text-slate-500 font-mono">Link #{reassignModalReq.id}</p>
                </div>
              </div>
              <button
                onClick={() => setReassignModalReq(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div>Sender: <strong>{reassignModalReq.userName}</strong> ({reassignModalReq.userId})</div>
              <div>Current Receiver: <strong className="text-rose-600">{reassignModalReq.matchedWithUserName}</strong></div>
              <div>Amount: <strong className="text-slate-900 font-mono">₹{reassignModalReq.amount}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select New Receiver Member</label>
              <select
                value={newReceiverForReassign}
                onChange={(e) => setNewReceiverForReassign(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
              >
                <option value="">-- Choose New Receiver --</option>
                <option value="ADMIN_TREASURY">👑 HELP150 Central Treasury</option>
                {allUsers
                  .filter((u) => u.id !== reassignModalReq.userId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.id}) • {u.mobile}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReassignModalReq(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReassign}
                disabled={!newReceiverForReassign || isProcessing}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs disabled:opacity-50 cursor-pointer"
              >
                Confirm Re-assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PAYMENT SLIP MODAL */}
      {viewSlipReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900 font-heading">Payment Slip & Verification</h3>
              </div>
              <button onClick={() => setViewSlipReq(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Sender:</span>
                <span className="font-bold">{viewSlipReq.userName} ({viewSlipReq.userId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receiver:</span>
                <span className="font-bold text-emerald-700">{viewSlipReq.matchedWithUserName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UTR / Reference:</span>
                <span className="font-mono font-black text-blue-600">{viewSlipReq.proofReference || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-black text-red-600">₹{viewSlipReq.amount}</span>
              </div>
            </div>

            {viewSlipReq.paymentSlipUrl ? (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 p-2 flex items-center justify-center max-h-80">
                <img
                  src={viewSlipReq.paymentSlipUrl}
                  alt="Payment Slip Proof"
                  className="max-h-72 object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border-2 border-dashed rounded-2xl">
                No image attachment uploaded. UTR number: {viewSlipReq.proofReference}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleForceApprove(viewSlipReq.id);
                  setViewSlipReq(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Approve & Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE MEMBER-TO-MEMBER LINKS TABLE */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 font-heading">Active Member-to-Member Links</h3>
            <p className="text-xs text-slate-500">Monitor live P2P assignments, countdown timers, and payment slips.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search sender, receiver, ID..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800"
            />
          </div>
        </div>

        {/* FILTER CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Links' },
            { id: 'pending', label: 'Pending Payment' },
            { id: 'proof_submitted', label: 'Slip Uploaded' },
            { id: 'completed', label: 'Completed' },
            { id: 'expired', label: 'Expired / Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-[11px] font-bold text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="py-2.5 px-3">Link ID</th>
                <th className="py-2.5 px-3">Sender (Give Help)</th>
                <th className="py-2.5 px-3">Receiver (Beneficiary)</th>
                <th className="py-2.5 px-3">Amount & UPI</th>
                <th className="py-2.5 px-3">12h Timer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredHelpRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No member-to-member links matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredHelpRequests.map((req) => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://help150.org';
                  const directLink = `${origin}/?action=member_help_link&req=${req.id}&from=${req.userId}&to=${req.matchedWithUserId}&amt=${req.amount}`;

                  const cleanMobile = (req.userMobile || '').replace(/\D/g, '');
                  const waText = `*HELP150 Member-to-Member Direct Help Link*\n\nHello ${req.userName},\nYou are matched to provide ₹${req.amount} assistance to ${req.matchedWithUserName}.\n\nReceiver UPI: ${req.matchedWithUpi}\nLink: ${directLink}`;
                  const waUrl = `https://wa.me/91${cleanMobile.length === 10 ? cleanMobile : cleanMobile.slice(-10)}?text=${encodeURIComponent(waText)}`;

                  const isCompleted = ['COMPLETED', 'PAYMENT_VERIFIED', 'completed'].includes(req.status);
                  const isProof = ['SLIP_UPLOADED', 'VERIFICATION_PENDING', 'proof_submitted'].includes(req.status);
                  const isPending = ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'matched', 'pending_match'].includes(req.status);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      {/* Link ID */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-blue-600">{req.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB') : 'Active'}
                        </div>
                      </td>

                      {/* Sender */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{req.userName || req.userId}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{req.userMobile || req.userId}</div>
                      </td>

                      {/* Receiver */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-emerald-700">{req.matchedWithUserName || 'Treasury'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{req.matchedWithUserId}</div>
                      </td>

                      {/* Amount & UPI */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-black text-red-600">₹{req.amount}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                          {req.matchedWithUpi}
                        </div>
                      </td>

                      {/* Timer */}
                      <td className="py-3 px-3">
                        {isCompleted ? (
                          <span className="text-[10px] font-bold text-emerald-600">Verified</span>
                        ) : req.timerExpiresAt || req.timerExpiryTime ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[10px] font-bold inline-block">
                            {req.timerDurationHours || 12}h Timer
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-700'
                              : isProof
                              ? 'bg-cyan-100 text-cyan-700'
                              : isPending
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp dispatch */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Dispatch via WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyText(directLink, req.id)}
                            title="Copy Direct Link"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition cursor-pointer"
                          >
                            {copiedId === req.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>

                          {/* View Slip / UTR */}
                          {req.proofReference && (
                            <button
                              onClick={() => setViewSlipReq(req)}
                              title="View Payment Slip"
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Force Approve */}
                          {!isCompleted && (
                            <button
                              onClick={() => handleForceApprove(req.id)}
                              title="Approve / Complete Help"
                              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Reassign Receiver */}
                          {!isCompleted && (
                            <button
                              onClick={() => {
                                setReassignModalReq(req);
                                setNewReceiverForReassign('');
                              }}
                              title="Reassign to Another Member"
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Cancel */}
                          {!isCompleted && (
                            <button
                              onClick={() => handleCancelLink(req.id)}
                              title="Cancel Link"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

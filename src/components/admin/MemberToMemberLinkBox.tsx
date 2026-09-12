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
  UserPlus,
  Zap,
  Settings,
  ListFilter,
  CheckSquare,
  Square,
  Building2,
  UserCircle2,
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
  const allHelpRequests = state.helpRequests || [];
  const settings = state.settings;
  const defaultHelpAmount = settings.helpAmountDefault || 150;
  const defaultTimerHours = settings.timerDurationHours || 24;

  // Active Main Tab: 'provide_help_queue' | 'manual_dispatch' | 'auto_mode' | 'active_links'
  const [activeTab, setActiveTab] = useState<'provide_help_queue' | 'manual_dispatch' | 'auto_mode' | 'active_links'>('provide_help_queue');

  // Provide Help Queue Selection & Search
  const [queueSearch, setQueueSearch] = useState('');
  const [selectedQueueUsers, setSelectedQueueUsers] = useState<string[]>([]);
  const [queueBatchReceiver, setQueueBatchReceiver] = useState<string>('ADMIN_TREASURY');
  const [queueBatchLimit, setQueueBatchLimit] = useState<number>(1);

  // Manual Dispatch States
  const [senderUserId, setSenderUserId] = useState<string>('');
  const [receiverUserId, setReceiverUserId] = useState<string>('ADMIN_TREASURY');
  const [amount, setAmount] = useState<number>(defaultHelpAmount);
  const [timerHours, setTimerHours] = useState<number>(defaultTimerHours);
  const [remarks, setRemarks] = useState<string>('');
  const [senderSearch, setSenderSearch] = useState('');
  const [receiverSearch, setReceiverSearch] = useState('');

  // Auto Mode Settings States
  const [autoDispatchMode, setAutoDispatchMode] = useState<boolean>(settings.autoDispatchMode ?? true);
  const [autoDispatchOnRegistration, setAutoDispatchOnRegistration] = useState<boolean>(settings.autoDispatchOnRegistration ?? true);
  const [defaultLinkReceiverType, setDefaultLinkReceiverType] = useState<'admin_treasury' | 'fifo_queue'>(settings.defaultLinkReceiverType || 'admin_treasury');
  const [maxLinksPerReceiver, setMaxLinksPerReceiver] = useState<number>(settings.maxLinksPerReceiver || 1);
  const [autoRunLimit, setAutoRunLimit] = useState<number>(5);

  // Table filter & search for dispatched links
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'proof_submitted' | 'completed' | 'expired'>('all');
  const [tableSearch, setTableSearch] = useState('');

  // Modal / Feedback states
  const [generatedLinkData, setGeneratedLinkData] = useState<{
    helpRequest: HelpRequest;
    shareUrl: string;
    waMessageUrl: string;
  } | null>(null);
  const [batchGeneratedLinks, setBatchGeneratedLinks] = useState<HelpRequest[] | null>(null);
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

  // 1. COMPUTE PROVIDE HELP LIST (Pending Queue / Newly Registered members waiting for match)
  const pendingProvideHelpRequests = allHelpRequests.filter(
    (r) =>
      r.type === 'give_help' &&
      ['pending_match', 'REQUEST_CREATED', 'PENDING'].includes(r.status) &&
      (!r.matchedWithUserId || r.matchedWithUserId === 'H150-ADMIN01' || r.status === 'pending_match')
  );

  // Members who joined and haven't had a confirmed provide help link completed or active
  const pendingSenderUserIds = new Set(pendingProvideHelpRequests.map((r) => r.userId));
  
  // Also check all registered active users without active completed give_help
  const usersWithActiveLink = new Set(
    allHelpRequests
      .filter((r) => r.type === 'give_help' && ['PAYMENT_PENDING', 'SLIP_UPLOADED', 'COMPLETED', 'PAYMENT_VERIFIED'].includes(r.status))
      .map((r) => r.userId)
  );

  const pendingProvideHelpUsers = allUsers.filter(
    (u) => u.role === 'user' && (pendingSenderUserIds.has(u.id) || !usersWithActiveLink.has(u.id))
  );

  const filteredProvideHelpUsers = pendingProvideHelpUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      u.mobile.includes(queueSearch)
  );

  // 2. DISPATCHED / ACTIVE LINKS TABLE FILTERING
  const activeDispatchedLinks = allHelpRequests.filter((r) => r.type === 'give_help');

  const filteredHelpRequests = activeDispatchedLinks.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (req.userName && req.userName.toLowerCase().includes(tableSearch.toLowerCase())) ||
      (req.userId && req.userId.toLowerCase().includes(tableSearch.toLowerCase())) ||
      (req.matchedWithUserName && req.matchedWithUserName.toLowerCase().includes(tableSearch.toLowerCase())) ||
      (req.matchedWithUserId && req.matchedWithUserId.toLowerCase().includes(tableSearch.toLowerCase())) ||
      (req.userMobile && req.userMobile.includes(tableSearch));

    if (!matchesSearch) return false;

    if (filterStatus === 'pending') {
      return ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'matched', 'pending_match'].includes(req.status);
    }
    if (filterStatus === 'proof_submitted') {
      return ['SLIP_UPLOADED', 'VERIFICATION_PENDING', 'proof_submitted'].includes(req.status);
    }
    if (filterStatus === 'completed') {
      return ['COMPLETED', 'PAYMENT_VERIFIED', 'completed'].includes(req.status);
    }
    if (filterStatus === 'expired') {
      return ['EXPIRED', 'CANCELLED', 'REJECTED', 'expired', 'cancelled'].includes(req.status);
    }
    return true;
  });

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
      ? settings.adminUpiId || 'help150.treasury@icici'
      : receiverKyc?.upiId || (selectedReceiver ? `${selectedReceiver.id.toLowerCase()}@upi` : 'help150@upi');

  // Toggle single user selection in Queue
  const toggleQueueUser = (uId: string) => {
    setSelectedQueueUsers((prev) =>
      prev.includes(uId) ? prev.filter((id) => id !== uId) : [...prev, uId]
    );
  };

  // Select all visible queue users
  const toggleSelectAllQueue = () => {
    if (selectedQueueUsers.length === filteredProvideHelpUsers.length) {
      setSelectedQueueUsers([]);
    } else {
      setSelectedQueueUsers(filteredProvideHelpUsers.map((u) => u.id));
    }
  };

  // Quick select top N users in queue
  const selectTopNQueue = (n: number) => {
    const topIds = filteredProvideHelpUsers.slice(0, n).map((u) => u.id);
    setSelectedQueueUsers(topIds);
    showToast(`Selected top ${topIds.length} member(s) from Provide Help list.`);
  };

  // Quick prep manual dispatch for single user
  const handleQuickLinkForUser = (user: User) => {
    setSenderUserId(user.id);
    setActiveTab('manual_dispatch');
    showToast(`Selected ${user.fullName} (${user.id}) in Manual Dispatch.`);
  };

  // BATCH DISPATCH FROM QUEUE (Dispatches exact link count as configured)
  const handleBatchDispatchFromQueue = async () => {
    if (selectedQueueUsers.length === 0) {
      showToast('Please select at least 1 member from the Provide Help list.', 'error');
      return;
    }

    const countToDispatch = Math.min(selectedQueueUsers.length, queueBatchLimit || selectedQueueUsers.length);
    const usersToDispatch = selectedQueueUsers.slice(0, countToDispatch);

    setIsProcessing(true);
    const res = await api.adminBatchCreateMemberLinks({
      adminActor: {
        id: currentUser.id || 'ADMIN-1',
        name: currentUser.fullName || currentUser.name || 'Super Admin',
        role: currentUser.role || 'admin',
      },
      senderUserIds: usersToDispatch,
      receiverUserId: queueBatchReceiver,
      amount: Number(amount),
      timerHours: Number(timerHours),
      remarks: `Batch dispatched ${usersToDispatch.length} links by Admin (${currentUser.name || 'Admin'})`,
    });

    setIsProcessing(false);
    if (res.success && res.data) {
      showToast(`⚡ Success! Dispatched exactly ${res.data.createdCount} Member-to-Member Link(s)!`);
      setBatchGeneratedLinks(res.data.links);
      setSelectedQueueUsers([]);
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || 'Failed to dispatch batch links.', 'error');
    }
  };

  // MANUAL FORM SUBMIT (1 Single Link)
  const handleCreateManualLink = async (e: React.FormEvent) => {
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
      setRemarks('');
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || 'Failed to dispatch member link.', 'error');
    }
  };

  // SAVE AUTO-MODE CONFIGURATION
  const handleSaveAutoSettings = async () => {
    setIsProcessing(true);
    const res = await api.adminUpdateMatchingSettings({
      adminActor: {
        id: currentUser.id || 'ADMIN-1',
        name: currentUser.fullName || currentUser.name || 'Super Admin',
        role: currentUser.role || 'admin',
      },
      autoDispatchMode,
      autoDispatchOnRegistration,
      defaultLinkReceiverType,
      maxLinksPerReceiver,
      helpAmountDefault: amount,
      timerDurationHours: timerHours,
    });

    setIsProcessing(false);
    if (res.success) {
      showToast('✅ Auto-Mode & Registration matching settings saved successfully!');
      if (onRefresh) onRefresh();
    } else {
      showToast(res.error || 'Failed to update settings.', 'error');
    }
  };

  // RUN 1-CLICK AUTO MATCH ENGINE (With exact limit)
  const handleExecuteAutoMatch = async () => {
    setIsProcessing(true);
    try {
      const res = await api.adminAutoMatchMembers({
        adminActor: {
          id: currentUser.id || 'ADMIN-1',
          name: currentUser.fullName || currentUser.name || 'Super Admin',
          role: currentUser.role || 'admin',
        },
        amount: Number(amount),
        timerHours: Number(timerHours),
        maxLinks: autoRunLimit,
        targetReceiver: defaultLinkReceiverType === 'admin_treasury' ? 'ADMIN_TREASURY' : 'FIFO',
      });

      setIsProcessing(false);
      if (res.success && res.data) {
        showToast(`⚡ Auto-Match Engine executed! Paired ${res.data.matchedCount} member(s).`);
        if (res.data.links && res.data.links.length > 0) {
          setBatchGeneratedLinks(res.data.links);
        }
        if (onRefresh) onRefresh();
      } else {
        showToast(res.error || 'Auto-match could not find matching members.', 'error');
      }
    } catch (err: any) {
      setIsProcessing(false);
      showToast(err.message || 'Auto-match error occurred.', 'error');
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
      showToast(res.error || 'Failed to approve link.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* TOAST ALERTS */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-3 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-600/50 shadow-emerald-950/40'
              : 'bg-rose-950 text-rose-100 border-rose-600/50 shadow-rose-950/40'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ADMIN ID RECEIVER POLICY BANNER */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-800/60 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-800/60 text-purple-200 text-sm">🛡️</span>
          <div>
            <div className="font-black text-amber-300">Admin ID Dispatch Policy (एडमिन आईडी नीति):</div>
            <div className="text-[11px] text-purple-200">
              एडमिन ID केवल 'रिसीव हेल्प' (Receiver) के रूप में कार्य करेगी जब रिसीवर ज्यादा/आवश्यक हों। ऑटोमैटिक यूजर ID जनरेशन पूर्णतः बंद है।
            </div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-[10px] font-bold whitespace-nowrap">
          Receiver Mode: ADMIN BACKUP READY
        </span>
      </div>

      {/* TOP HEADER & NAVIGATION TABS */}
      <div className="bg-gradient-to-r from-[#0C1E4A] via-[#102E6C] to-[#1D4492] rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                Admin P2P Control Hub
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-mono">
                {pendingProvideHelpUsers.length} Pending Registration(s)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-heading">
              <Send className="h-6 w-6 text-amber-400" />
              <span>Member to Member Send Link Box</span>
            </h2>
            <p className="text-xs text-blue-100/80">
              New registration queue, provide help list, auto mode and manual mode dispatch controls with batch limits.
            </p>
          </div>

          {/* QUICK STATS COUNTERS */}
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
              <div className="text-[10px] text-blue-200">Provide Help Queue</div>
              <div className="text-base font-black text-amber-400 font-mono">{pendingProvideHelpUsers.length}</div>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
              <div className="text-[10px] text-blue-200">Active Links</div>
              <div className="text-base font-black text-emerald-400 font-mono">{filteredHelpRequests.length}</div>
            </div>
          </div>
        </div>

        {/* 4 MAIN NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-white/10">
          <button
            onClick={() => setActiveTab('provide_help_queue')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'provide_help_queue'
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>📋 Provide Help List (New Registrations Queue)</span>
            {pendingProvideHelpUsers.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'provide_help_queue' ? 'bg-slate-950 text-amber-400' : 'bg-amber-400 text-slate-950'
              }`}>
                {pendingProvideHelpUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('manual_dispatch')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'manual_dispatch'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>✍️ Manual Dispatch</span>
          </button>

          <button
            onClick={() => setActiveTab('auto_mode')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'auto_mode'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Zap className="h-4 w-4 text-amber-300" />
            <span>⚡ Auto Mode Settings</span>
            <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${
              autoDispatchMode ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-200'
            }`}>
              {autoDispatchMode ? 'ACTIVE' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active_links')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'active_links'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>📊 Dispatched Links Table</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROVIDE HELP LIST (Provide Help Queue)                             */}
      {/* ========================================================================= */}
      {activeTab === 'provide_help_queue' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <UserPlus className="h-4 w-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Provide Help Queue (New Registrations)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                New registered users appear here waiting for their Provide Help link. You can select exact member(s) and dispatch links directly.
              </p>
            </div>

            {/* Queue Search bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user ID, Name, Phone..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* BATCH ACTION & LIMIT CONTROL BAR (Dispatches exact link count) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleSelectAllQueue}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border border-white/10"
              >
                {selectedQueueUsers.length > 0 && selectedQueueUsers.length === filteredProvideHelpUsers.length ? (
                  <CheckSquare className="h-4 w-4 text-amber-400" />
                ) : (
                  <Square className="h-4 w-4 text-slate-300" />
                )}
                <span>Select All ({filteredProvideHelpUsers.length})</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-300">Quick Select:</span>
                {[1, 2, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => selectTopNQueue(n)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/50 hover:bg-blue-600 text-white font-mono text-xs font-bold border border-blue-400/30 cursor-pointer"
                  >
                    Top {n}
                  </button>
                ))}
              </div>

              {selectedQueueUsers.length > 0 && (
                <div className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs font-mono">
                  {selectedQueueUsers.length} Selected (₹{selectedQueueUsers.length * amount})
                </div>
              )}
            </div>

            {/* RECEIVER & DISPATCH CONTROL */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-semibold whitespace-nowrap">Send to Receiver:</span>
                <select
                  value={queueBatchReceiver}
                  onChange={(e) => setQueueBatchReceiver(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white max-w-[200px] sm:max-w-[260px]"
                >
                  <option value="ADMIN_TREASURY">👑 Central Treasury (Admin ID - Excess Receiver Pool)</option>
                  {allUsers
                    .filter((u) => u.status === 'active')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.isAdminAccount ? '👑 [Admin ID] ' : '👥 '} {u.fullName} ({u.id})
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={handleBatchDispatchFromQueue}
                disabled={selectedQueueUsers.length === 0 || isProcessing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-slate-950" />
                <span>
                  {isProcessing
                    ? 'Dispatching...'
                    : `⚡ Dispatch (${selectedQueueUsers.length}) Link${selectedQueueUsers.length > 1 ? 's' : ''}`}
                </span>
              </button>
            </div>
          </div>

          {/* QUEUE MEMBER CARDS / TABLE */}
          {filteredProvideHelpUsers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-black text-slate-800 font-heading">No Pending Provide Help Members in Queue</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All registered members currently have active or completed help links. New registrations will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] font-bold text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className="py-2.5 px-3 w-10">Select</th>
                    <th className="py-2.5 px-3">User ID</th>
                    <th className="py-2.5 px-3">Member Name & Phone</th>
                    <th className="py-2.5 px-3">Registered On</th>
                    <th className="py-2.5 px-3">Queue Status</th>
                    <th className="py-2.5 px-3">Help Amount</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProvideHelpUsers.map((user) => {
                    const isSelected = selectedQueueUsers.includes(user.id);
                    return (
                      <tr
                        key={user.id}
                        className={`transition cursor-pointer ${
                          isSelected ? 'bg-amber-50/60' : 'hover:bg-slate-50/70'
                        }`}
                        onClick={() => toggleQueueUser(user.id)}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleQueueUser(user.id)}
                            className="h-4 w-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                          />
                        </td>

                        {/* User ID */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            {user.id}
                          </span>
                        </td>

                        {/* Member Name & Mobile */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{user.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{user.mobile}</span>
                          </div>
                        </td>

                        {/* Registered On */}
                        <td className="py-3 px-3">
                          <div className="text-slate-600 font-medium">
                            {user.joinedAt || (user as any).createdAt ? new Date(user.joinedAt || (user as any).createdAt).toLocaleDateString('en-GB') : 'Recent'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {user.joinedAt || (user as any).createdAt ? new Date(user.joinedAt || (user as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </td>

                        {/* Status Tag */}
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>🔴 New Registration (Waiting for Link)</span>
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 font-mono font-black text-slate-900">
                          ₹{defaultHelpAmount}
                        </td>

                        {/* Quick Action */}
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleQuickLinkForUser(user)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs transition cursor-pointer border border-blue-200"
                          >
                            ⚡ Send Link
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANUAL MODE (Exact Single Dispatch)                                */}
      {/* ========================================================================= */}
      {activeTab === 'manual_dispatch' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Sliders className="h-4 w-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Manual Member-to-Member Link Dispatch
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select sender, receiver, amount, and timer to generate and dispatch direct P2P link.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('provide_help_queue')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              ← Choose from Provide Help List
            </button>
          </div>

          <form onSubmit={handleCreateManualLink} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SENDER SELECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">1</span>
                    <span>Sender (Provide Help Member - Payer)</span>
                  </label>
                  {selectedSender && (
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      ID: {selectedSender.id}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Sender Name, ID, Mobile..."
                    value={senderSearch}
                    onChange={(e) => setSenderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-blue-600"
                  />
                </div>

                <select
                  value={senderUserId}
                  onChange={(e) => setSenderUserId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  required
                >
                  <option value="">-- Choose Sender Member --</option>
                  {filteredSenders
                    .filter((u) => u.id !== 'H150-ADMIN01')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.id}) • {u.mobile}
                      </option>
                    ))}
                </select>

                {selectedSender && (
                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{selectedSender.fullName}</span>
                      <span className="font-mono text-blue-600">{selectedSender.mobile}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Role: {selectedSender.role} • Status: {selectedSender.status}
                    </div>
                  </div>
                )}
              </div>

              {/* RECEIVER SELECTION */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">2</span>
                    <span>Receiver (Receive Help Member - Payee)</span>
                  </label>
                  {selectedReceiver && (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      ID: {selectedReceiver.id}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Receiver Name, ID, Mobile..."
                    value={receiverSearch}
                    onChange={(e) => setReceiverSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-emerald-200 text-xs bg-white text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                <select
                  value={receiverUserId}
                  onChange={(e) => setReceiverUserId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 text-xs font-bold text-slate-900 bg-white"
                  required
                >
                  <option value="ADMIN_TREASURY">👑 HELP150 Central Treasury (Admin ID - Excess Receiver Pool)</option>
                  {filteredReceivers
                    .filter((u) => u.id !== senderUserId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.isAdminAccount ? '👑 [Admin ID] ' : '👥 '} {u.fullName} ({u.id}) • {u.mobile}
                      </option>
                    ))}
                </select>

                {selectedReceiver && (
                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-emerald-200/80 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{selectedReceiver.fullName}</span>
                      <span className="font-mono text-emerald-700 font-bold">{receiverUpi}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Phone: {selectedReceiver.mobile} {receiverKyc?.bankName ? `• Bank: ${receiverKyc.bankName}` : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: AMOUNT, TIMER, REMARKS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Dispatch Note (Optional)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Level 1 activation direct link"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUTO MODE SETTINGS & ENGINE (Auto Mode Controls)                   */}
      {/* ========================================================================= */}
      {activeTab === 'auto_mode' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Zap className="h-4 w-4 text-purple-700" />
                </span>
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Automated Dispatch Controls
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure whether new registrations receive automated help links instantly, and run the 1-click batch engine.
              </p>
            </div>
          </div>

          {/* TOGGLE CONTROLS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TOGGLE 1: Master Auto Mode */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Master Auto-Dispatch Engine</h4>
                  <p className="text-[11px] text-slate-500">Enable algorithmic member-to-member matching</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoDispatchMode(!autoDispatchMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoDispatchMode ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoDispatchMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                Status: <strong className={autoDispatchMode ? 'text-emerald-600' : 'text-slate-500'}>{autoDispatchMode ? 'ACTIVE (Enabled)' : 'INACTIVE (Manual Mode Only)'}</strong>
              </div>
            </div>

            {/* TOGGLE 2: Auto-Dispatch on Registration */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Auto-Link Upon Registration</h4>
                  <p className="text-[11px] text-slate-500">Auto-generate Provide Help link immediately when user registers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoDispatchOnRegistration(!autoDispatchOnRegistration)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoDispatchOnRegistration ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoDispatchOnRegistration ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                On Registration: <strong className={autoDispatchOnRegistration ? 'text-emerald-600' : 'text-amber-600'}>
                  {autoDispatchOnRegistration ? 'Auto-Dispatched to Receiver' : 'Queued in Provide Help List for Manual Dispatch'}
                </strong>
              </div>
            </div>

            {/* RECEIVER TYPE PREFERENCE */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-900">Default Auto-Link Receiver Pool</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDefaultLinkReceiverType('admin_treasury')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition cursor-pointer border text-left flex items-center gap-2 ${
                    defaultLinkReceiverType === 'admin_treasury'
                      ? 'bg-amber-50 text-amber-900 border-amber-400 font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="h-4 w-4 text-amber-600" />
                  <span>👑 Central Treasury</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDefaultLinkReceiverType('fifo_queue')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition cursor-pointer border text-left flex items-center gap-2 ${
                    defaultLinkReceiverType === 'fifo_queue'
                      ? 'bg-blue-50 text-blue-900 border-blue-400 font-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCircle2 className="h-4 w-4 text-blue-600" />
                  <span>👥 FIFO Qualified Downlines</span>
                </button>
              </div>
            </div>

            {/* EXACT LINK COUNT LIMIT PER BATCH */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-900">Batch Match Run Limit</h4>
              <div className="flex items-center gap-2">
                {[1, 2, 5, 10, 25].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setAutoRunLimit(l)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                      autoRunLimit === l
                        ? 'bg-purple-600 text-white border-purple-600 font-black shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {l} Links
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SAVE & EXECUTE BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveAutoSettings}
              disabled={isProcessing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Settings className="h-4 w-4" />
              <span>Save Configuration</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteAutoMatch}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>⚡ Execute 1-Click Auto-Match Now (Limit: {autoRunLimit} Links)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4 / COMMON: ACTIVE DISPATCHED LINKS TABLE                             */}
      {/* ========================================================================= */}
      {(activeTab === 'active_links' || activeTab === 'provide_help_queue') && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">Live Dispatched Member-to-Member Links</h3>
              <p className="text-xs text-slate-500">Monitor active P2P assignments, countdown timers, and payment slips.</p>
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
                  <th className="py-2.5 px-3">Timer</th>
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
                              {req.timerDurationHours || 24}h Timer
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
      )}

      {/* POPUP MODAL: SINGLE DISPATCH SUCCESS & WHATSAPP SHARING */}
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
                  ₹{generatedLinkData.helpRequest.amount} • {generatedLinkData.helpRequest.timerDurationHours || 24} Hours
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

      {/* POPUP MODAL: BATCH DISPATCH SUMMARY */}
      {batchGeneratedLinks && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">
                    {batchGeneratedLinks.length} Link(s) Dispatched Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">Total Dispatched Help: ₹{batchGeneratedLinks.reduce((acc, l) => acc + l.amount, 0)}</p>
                </div>
              </div>
              <button
                onClick={() => setBatchGeneratedLinks(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              {batchGeneratedLinks.map((l) => (
                <div key={l.id} className="py-2 px-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{l.userName} ({l.userId})</div>
                    <div className="text-[10px] text-slate-500">→ To: {l.matchedWithUserName}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-red-600">₹{l.amount}</span>
                    <div className="text-[10px] text-emerald-600 font-bold">{l.timerDurationHours || 24}h Window</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setBatchGeneratedLinks(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Continue to Live Links
            </button>
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
    </div>
  );
};

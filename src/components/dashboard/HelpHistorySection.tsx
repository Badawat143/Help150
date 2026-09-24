import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Search,
  Filter,
  Calendar,
  Hash,
  User,
  FileText,
  Sparkles,
  RefreshCw,
  Receipt,
  X,
  Printer,
  ChevronRight,
  BadgeCheck,
  TrendingUp,
  Download,
  AlertCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import { HelpHistoryItem } from '../../types';
import { useToast } from '../../context/ToastContext';

interface HelpHistorySectionProps {
  currentUserId: string;
  onRefresh?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const HelpHistorySection: React.FC<HelpHistorySectionProps> = ({
  currentUserId,
  onRefresh,
  onNavigateTab,
}) => {
  const toast = useToast();
  const [filterType, setFilterType] = useState<'all' | 'help_given' | 'help_received'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<HelpHistoryItem | null>(null);
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<{ url: string; title: string; ref: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch help history from DB
  const helpHistory = useMemo(() => {
    return db.getUserHelpHistory(currentUserId);
  }, [currentUserId, db.getState()]);

  const handleCopy = (text: string, id: string, label: string = 'Reference ID') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`${label} copied: ${text}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.info('Help history updated with latest verified transactions');
    }, 500);
  };

  // Helper date formatting
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(isoString);
    } catch {
      return '';
    }
  };

  // Filtered and searched items
  const filteredItems = useMemo(() => {
    return helpHistory.items.filter((item) => {
      // Type filter
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.referenceId.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q) ||
        (item.stepTitle && item.stepTitle.toLowerCase().includes(q)) ||
        (item.senderName && item.senderName.toLowerCase().includes(q)) ||
        (item.receiverName && item.receiverName.toLowerCase().includes(q)) ||
        (item.senderUserId && item.senderUserId.toLowerCase().includes(q)) ||
        (item.receiverUserId && item.receiverUserId.toLowerCase().includes(q)) ||
        item.amount.toString().includes(q)
      );
    });
  }, [helpHistory.items, filterType, searchQuery]);

  const givenCount = helpHistory.items.filter((i) => i.type === 'help_given').length;
  const receivedCount = helpHistory.items.filter((i) => i.type === 'help_received').length;

  return (
    <section id="help-history-section" className="space-y-4">
      {/* ======================================================================= */}
      {/* 1. SECTION MAIN CARD HEADER                                             */}
      {/* ======================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-blue-500/5 via-emerald-500/5 to-transparent rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>Help History & Transparency Report</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    100% P2P Verified
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  सहायता इतिहास (प्रदान की गई व प्राप्त सहायता का पूर्ण सत्यापित विवरण मय UTR व टाइमस्टैम्प)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className={`p-2 sm:px-3 sm:py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                isRefreshing ? 'opacity-70' : ''
              }`}
              title="Refresh Help History"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('wallet')}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Wallet Log</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2. TRANSPARENCY KPI SUMMARY BAR (4 STAT CARDS)                          */}
        {/* ======================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {/* Total Given */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50/50 border border-rose-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Total Help Given
              </span>
              <div className="h-6 w-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600">
              ₹ {helpHistory.totalGiven}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {givenCount} Verified Provide Links (₹50/₹100)
            </div>
          </div>

          {/* Total Received */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Total Help Received
              </span>
              <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowDownLeft className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
              ₹ {helpHistory.totalReceived}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {receivedCount} Completed Payouts
            </div>
          </div>

          {/* Net Benefit */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Net Assistance Gain
              </span>
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-blue-600">
              +₹ {helpHistory.netBenefit}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Pure Community Surplus (+₹50/Cycle)
            </div>
          </div>

          {/* Cycles Count */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Completed Cycles
              </span>
              <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <BadgeCheck className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-700">
              #{helpHistory.completedCyclesCount}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              100% Peer Verified Cycles
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 3. CONTROLS: FILTER TABS & SEARCH INPUT                                 */}
        {/* ======================================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-slate-100 mt-5">
          {/* Tabs */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Help ({helpHistory.items.length})
            </button>
            <button
              onClick={() => setFilterType('help_given')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'help_given'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="h-3 w-3" />
              <span>Given / भेजी ({givenCount})</span>
            </button>
            <button
              onClick={() => setFilterType('help_received')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'help_received'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownLeft className="h-3 w-3" />
              <span>Received / मिली ({receivedCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search UTR, Ref ID, Member..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 4. TRANSACTIONS LIST / AUDIT TABLE                                      */}
        {/* ======================================================================= */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 mt-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                {searchQuery
                  ? 'No matching help transactions found'
                  : 'No completed help transactions in this view yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with a different UTR number, member name or ID.'
                  : 'जैसे ही आप ₹50 या ₹100 का प्रोवाइड हेल्प पूरा करेंगे या ₹200 सहायता प्राप्त करेंगे, उसका पूर्ण विवरण मय टाइमस्टैम्प यहाँ दर्ज हो जाएगा।'}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Date & Timestamp</th>
                    <th className="py-3 px-3">Transaction / Type</th>
                    <th className="py-3 px-3">Counterparty (Peer)</th>
                    <th className="py-3 px-3">UTR / Ref No.</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Receipt / Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  {filteredItems.map((item, index) => {
                    const isGiven = item.type === 'help_given';
                    const isCopied = copiedId === item.id;
                    const dateStr = formatDate(item.completedAt || item.createdAt);
                    const timeStr = formatTime(item.completedAt || item.createdAt);
                    const relTime = getRelativeTime(item.completedAt || item.createdAt);

                    return (
                      <tr
                        key={item.id + index}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px] font-semibold">
                          {index + 1}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-slate-400" />
                            <span>{timeStr}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-blue-600 font-sans font-medium">{relTime}</span>
                          </div>
                        </td>

                        {/* Transaction & Step */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-xl shrink-0 ${
                                isGiven
                                  ? 'bg-rose-100 text-rose-600'
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}
                            >
                              {isGiven ? (
                                <HeartHandshake className="h-3.5 w-3.5" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{item.stepTitle || (isGiven ? 'Provide Help' : 'Receive Help')}</span>
                                {item.cycleNumber && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    Cycle #{item.cycleNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]" title={item.remarks}>
                                {item.remarks}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Counterparty (Peer) */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isGiven ? (
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <span className="text-slate-400 text-[10px]">To:</span>
                                <span>{item.receiverName || 'Admin Treasury'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ID: {item.receiverUserId || 'H150-ADMIN01'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <span className="text-slate-400 text-[10px]">From:</span>
                                <span>{item.senderName || 'Community Member'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ID: {item.senderUserId || 'Verified Member'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* UTR / Ref No with Copy */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200/80">
                              {item.referenceId || item.id}
                            </span>
                            <button
                              onClick={() => handleCopy(item.referenceId || item.id, item.id, 'UTR / Reference ID')}
                              className="text-slate-400 hover:text-blue-600 transition p-1 cursor-pointer"
                              title="Copy Reference"
                            >
                              {isCopied ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span
                            className={`font-mono font-black text-sm ${
                              isGiven ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {isGiven ? '-' : '+'} ₹ {item.amount}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-300/80 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Completed ✅</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => setSelectedReceipt(item)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer active:scale-95 inline-flex items-center gap-1"
                            title="View Full Digital Receipt"
                          >
                            <FileText className="h-3 w-3" />
                            <span>रसीद</span>
                          </button>

                          {item.proofUrl && (
                            <button
                              onClick={() =>
                                setSelectedSlipUrl({
                                  url: item.proofUrl!,
                                  title: item.stepTitle || 'Payment Slip',
                                  ref: item.referenceId || item.id,
                                })
                              }
                              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer active:scale-95 inline-flex items-center gap-1"
                              title="View Payment Screenshot"
                            >
                              <Eye className="h-3 w-3" />
                              <span>स्लिप</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2.5">
              {filteredItems.map((item, idx) => {
                const isGiven = item.type === 'help_given';
                const isCopied = copiedId === item.id;
                const dateStr = formatDate(item.completedAt || item.createdAt);
                const timeStr = formatTime(item.completedAt || item.createdAt);
                const relTime = getRelativeTime(item.completedAt || item.createdAt);

                return (
                  <div
                    key={item.id + idx}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    {/* Top Row: Type & Amount */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                            isGiven
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {isGiven ? (
                            <HeartHandshake className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{item.stepTitle || (isGiven ? 'Provide Help' : 'Receive Help')}</span>
                            {item.cycleNumber && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                #{item.cycleNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{dateStr} • {timeStr}</span>
                            <span className="text-blue-600 font-sans font-medium">({relTime})</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-mono font-black text-base ${
                            isGiven ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isGiven ? '-' : '+'} ₹ {item.amount}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          <span>Completed ✅</span>
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Peer & UTR */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">
                          {isGiven ? 'Beneficiary (Receiver):' : 'Provider (Sender):'}
                        </span>
                        <span className="font-bold text-slate-800">
                          {isGiven ? item.receiverName : item.senderName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                        <span className="text-slate-500 font-medium">UTR / Ref:</span>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800 font-bold">
                          <span>{item.referenceId || item.id}</span>
                          <button
                            onClick={() => handleCopy(item.referenceId || item.id, item.id, 'UTR / Reference ID')}
                            className="text-slate-400 hover:text-blue-600 p-0.5"
                          >
                            {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        onClick={() => setSelectedReceipt(item)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>रसीद देखें (Receipt)</span>
                      </button>

                      {item.proofUrl && (
                        <button
                          onClick={() =>
                            setSelectedSlipUrl({
                              url: item.proofUrl!,
                              title: item.stepTitle || 'Payment Slip',
                              ref: item.referenceId || item.id,
                            })
                          }
                          className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>स्लिप</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Note on Transparency */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>
              All transactions are strictly Peer-to-Peer verified and permanently logged for 100% community transparency.
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Showing {filteredItems.length} of {helpHistory.items.length} records
          </span>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 5. DIGITAL AUDIT RECEIPT MODAL                                          */}
      {/* ======================================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Receipt className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-black text-base">Community Help Receipt</h4>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Audit Ref: {selectedReceipt.referenceId || selectedReceipt.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Receipt Amount Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {selectedReceipt.type === 'help_given' ? 'Assistance Given (दी गई सहायता)' : 'Assistance Received (प्राप्त सहायता)'}
                </span>
                <div
                  className={`text-3xl font-black font-mono ${
                    selectedReceipt.type === 'help_given' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {selectedReceipt.type === 'help_given' ? '-' : '+'} ₹ {selectedReceipt.amount}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                  <BadgeCheck className="h-3 w-3 text-emerald-600" />
                  <span>100% P2P Verified & Completed</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedReceipt.id}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">UTR / Bank Reference:</span>
                  <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-900">
                    {selectedReceipt.referenceId || selectedReceipt.id}
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Execution Timestamp:</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(selectedReceipt.completedAt || selectedReceipt.createdAt)} at{' '}
                    {formatTime(selectedReceipt.completedAt || selectedReceipt.createdAt)}
                  </span>
                </div>
                {selectedReceipt.cycleNumber && (
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500">Help Plan Cycle:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Cycle #{selectedReceipt.cycleNumber}
                    </span>
                  </div>
                )}
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Sender (प्रदाता):</span>
                  <span className="font-bold text-slate-900">
                    {selectedReceipt.senderName} ({selectedReceipt.senderUserId || 'Member'})
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Beneficiary (प्राप्तकर्ता):</span>
                  <span className="font-bold text-slate-900">
                    {selectedReceipt.receiverName} ({selectedReceipt.receiverUserId || 'Beneficiary'})
                  </span>
                </div>
                {selectedReceipt.receiverUpi && (
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500">Receiver UPI ID:</span>
                    <span className="font-mono text-slate-800">{selectedReceipt.receiverUpi}</span>
                  </div>
                )}
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Transfer Mode:</span>
                  <span className="font-medium text-slate-800">{selectedReceipt.mode || 'UPI / Instant P2P'}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Purpose / Step:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.stepTitle || selectedReceipt.remarks}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    handleCopy(
                      `HELP150 RECEIPT\nTxn ID: ${selectedReceipt.id}\nUTR: ${selectedReceipt.referenceId}\nAmount: ₹${selectedReceipt.amount}\nDate: ${formatDate(selectedReceipt.completedAt || selectedReceipt.createdAt)}\nStatus: Verified Completed`,
                      selectedReceipt.id,
                      'Receipt Text'
                    );
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Receipt Details</span>
                </button>

                {selectedReceipt.proofUrl && (
                  <button
                    onClick={() => {
                      setSelectedSlipUrl({
                        url: selectedReceipt.proofUrl!,
                        title: selectedReceipt.stepTitle || 'Payment Slip',
                        ref: selectedReceipt.referenceId || selectedReceipt.id,
                      });
                      setSelectedReceipt(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Payment Slip</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 6. SLIP IMAGE MODAL                                                     */}
      {/* ======================================================================= */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="text-white text-xs">
                <div className="font-bold">{selectedSlipUrl.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">Ref: {selectedSlipUrl.ref}</div>
              </div>
              <button
                onClick={() => setSelectedSlipUrl(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/60 max-h-[70vh] overflow-auto">
              <img
                src={selectedSlipUrl.url}
                alt="Payment Slip Proof"
                className="max-h-[60vh] w-auto object-contain rounded-xl shadow-lg border border-slate-800"
              />
            </div>
            <div className="p-3 bg-slate-950 text-center">
              <button
                onClick={() => setSelectedSlipUrl(null)}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Close (बंद करें)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

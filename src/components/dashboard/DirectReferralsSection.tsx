import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Share2,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { ReferralMember } from '../../types';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';

interface DirectReferralsSectionProps {
  currentUserId: string;
  directReferrals: ReferralMember[];
  onSync: () => Promise<void> | void;
  isSyncing: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const DirectReferralsSection: React.FC<DirectReferralsSectionProps> = ({
  currentUserId,
  directReferrals,
  onSync,
  isSyncing,
  onNavigateTab,
}) => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    setCopiedId(userId);
    toast.success(`User ID ${userId} copied!`, 'ID Copied');
    try {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (e) {}
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWelcome = (member: ReferralMember) => {
    const text = `Welcome to HELP150 Community, ${member.fullName}! Your Registered User ID is ${member.userId}. You joined under Sponsor ${currentUserId}. Let's assist and grow together!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredMembers = directReferrals.filter((m) => {
    const matchesSearch =
      m.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.mobile && m.mobile.includes(searchQuery));

    if (!matchesSearch) return false;

    if (statusFilter === 'done') return m.qualifyingDone;
    if (statusFilter === 'pending') return !m.qualifyingDone;
    return true;
  });

  const formatJoinedTime = (joinedAtStr?: string) => {
    if (!joinedAtStr) return 'Recently';
    try {
      const date = new Date(joinedAtStr);
      if (isNaN(date.getTime())) return joinedAtStr;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 5) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} mins ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return 'Yesterday';

      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return joinedAtStr;
    }
  };

  const isRecentMember = (joinedAtStr?: string) => {
    if (!joinedAtStr) return false;
    try {
      const date = new Date(joinedAtStr);
      return Date.now() - date.getTime() < 24 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  };

  return (
    <div
      id="direct-referrals-section"
      className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 space-y-5"
    >
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading tracking-tight">
                My Direct Referrals
              </h3>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {directReferrals.length} {directReferrals.length === 1 ? 'Member' : 'Members'}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Multi-Device Live Sync</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct members who register from any mobile or desktop device appear here in real time.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-sync-direct-members"
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            title="Sync new members from cloud and other devices"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Devices'}</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('referral')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <span>View 6-Level Tree</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by User ID (H150-...) or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Filter:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({directReferrals.length})
          </button>
          <button
            onClick={() => setStatusFilter('done')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'done'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ₹150 Done ({directReferrals.filter((m) => m.qualifyingDone).length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Help ({directReferrals.filter((m) => !m.qualifyingDone).length})
          </button>
        </div>
      </div>

      {/* 3. Direct Members List / Table */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-10 text-center space-y-4 bg-slate-50/50">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-blue-100/70 text-blue-600">
            <Users className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-sm font-bold text-slate-800">
              {searchQuery
                ? 'No matching direct members found'
                : 'No direct members joined yet'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              When a member registers using your sponsor code from any phone or computer, their User ID will appear here instantly.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={onSync}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
              <span>Sync Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Direct User ID</th>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Mobile No.</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Provide Help (₹150)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMembers.map((member, idx) => {
                const isRecent = isRecentMember(member.joinedAt);
                const isCopied = copiedId === member.userId;

                return (
                  <tr
                    key={member.userId}
                    className={`hover:bg-blue-50/40 transition ${
                      isRecent ? 'bg-blue-50/20' : 'bg-white'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-slate-400 font-semibold">{idx + 1}</td>

                    {/* User ID with Copy Button */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200 text-xs">
                          {member.userId}
                        </span>
                        <button
                          onClick={() => handleCopyId(member.userId)}
                          title="Copy User ID"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {isRecent && (
                          <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-200">
                            <Sparkles className="h-2.5 w-2.5" />
                            New
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Member Full Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs uppercase shrink-0">
                          {member.fullName.charAt(0) || 'U'}
                        </div>
                        <span className="font-bold text-slate-800">{member.fullName}</span>
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {member.mobile
                        ? `+91 ${member.mobile.slice(0, 5)}*****`
                        : '—'}
                    </td>

                    {/* Joined Date & Time */}
                    <td className="py-3 px-4">
                      <div className="text-slate-700 text-xs">{formatJoinedTime(member.joinedAt)}</div>
                      <div className="text-[10px] text-slate-400">Level 1 Direct</div>
                    </td>

                    {/* ₹150 Help Status */}
                    <td className="py-3 px-4">
                      {member.qualifyingDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>₹150 Done</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>Help Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <span className="capitalize">{member.status || 'Active'}</span>
                      </span>
                    </td>

                    {/* Quick Action */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleShareWelcome(member)}
                          title="Send Welcome Message on WhatsApp"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition cursor-pointer"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>Welcome</span>
                        </button>
                        <button
                          onClick={() => handleCopyId(member.userId)}
                          title="Copy User ID"
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          {isCopied ? 'Copied' : 'Copy ID'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Footer Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            All direct members are securely synchronized in real time across the peer-to-peer community network.
          </span>
        </div>
        <div className="text-right font-semibold text-slate-700 shrink-0">
          Showing {filteredMembers.length} of {directReferrals.length} Direct Members
        </div>
      </div>
    </div>
  );
};

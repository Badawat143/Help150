import React, { useState } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { ReferralMember } from '../../types';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';

interface DirectReferralsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  directReferrals: ReferralMember[];
  onSync: () => Promise<void> | void;
  isSyncing: boolean;
}

export const DirectReferralsModal: React.FC<DirectReferralsModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  directReferrals,
  onSync,
  isSyncing,
}) => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`User ID ${id} copied!`, 'ID Copied');
    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = directReferrals.filter(
    (m) =>
      m.userId.toLowerCase().includes(search.toLowerCase()) ||
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (m.mobile && m.mobile.includes(search))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-amber-400 border border-white/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight font-heading">
                  Direct Referral IDs
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {directReferrals.length} Members
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Sponsor: <strong className="text-amber-300 font-mono">{currentUserId}</strong> • Live Multi-Device Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSync}
              disabled={isSyncing}
              title="Sync all connected devices"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by User ID (e.g. H150-...) or Member Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-sm font-bold text-slate-700">
                {search ? 'No matching members' : 'No direct referrals registered yet'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When a member registers from any phone or computer using your sponsor code, their User ID will appear here instantly.
              </p>
            </div>
          ) : (
            filtered.map((m, idx) => {
              const isCopied = copiedId === m.userId;
              return (
                <div
                  key={m.userId}
                  className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 p-2.5 rounded-2xl transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-black text-xs shrink-0">
                      {m.fullName.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-700 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {m.userId}
                        </span>
                        <button
                          onClick={() => handleCopy(m.userId)}
                          className="text-slate-400 hover:text-blue-600 p-1 rounded transition cursor-pointer"
                          title="Copy User ID"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">{m.fullName}</div>
                      <div className="text-[10px] text-slate-400">
                        {m.mobile ? `+91 ${m.mobile.slice(0, 5)}*****` : 'Mobile verified'} • Joined Level 1
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {m.qualifyingDone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>₹150 Done</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span>Help Pending</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleCopy(m.userId)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition cursor-pointer"
                    >
                      {isCopied ? 'Copied' : 'Copy ID'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total Direct Members: <strong className="text-slate-800">{directReferrals.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * HELP150 — Multi-Level Referral Analytics Module (Levels 1-6)
 * Real-time downline tree viewer, qualifying reward ledger, and transparent compliance criteria.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Clock,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ReferralBox } from '../common/ReferralBox';
import { db } from '../../services/db';
import { firestoreSync } from '../../services/firestoreSync';

export const ReferralModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [dbTick, setDbTick] = useState<number>(0);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await firestoreSync.fetchAllFromCloud();
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          db.updateState((draft) => {
            data.users.forEach((sUser: any) => {
              const idx = draft.users.findIndex((u) => u.id.toUpperCase() === sUser.id.toUpperCase());
              if (idx < 0) draft.users.unshift(sUser);
              else draft.users[idx] = { ...draft.users[idx], ...sUser };
            });
            if (data.wallets) {
              Object.keys(data.wallets).forEach((uid) => {
                if (!draft.wallets[uid]) draft.wallets[uid] = data.wallets[uid];
              });
            }
          });
          setDbTick((t) => t + 1);
        }
      }
    } catch (e) {
      console.warn('Sync error:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  if (!currentUser) return null;

  const state = db.getState();
  const hierarchy = api.getReferralHierarchy(currentUser.id);
  const referralLevels = state.referralLevels;

  // Referral transactions
  const referralTransactions = state.transactions.filter(
    (t) => t.userId === currentUser.id && t.type === 'referral_reward'
  );
  const totalPaidRewards = referralTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Filter downline members for selected level
  const filteredMembers = hierarchy.allDownline.filter((m) => m.level === selectedLevel);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
                  Multi-Level Referral Analytics (Level 1 – Level 6)
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Compliance Linked
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Transparent team insights • Genuine qualifying activity rules • Real-time reward accounting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              title="Click to sync direct referrals from all devices"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync All Devices'}</span>
            </button>

            <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <div className="text-left px-2 border-r border-slate-800">
                <div className="text-[10px] text-slate-400">Total Rewards Paid</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  ₹{totalPaidRewards.toFixed(2)}
                </div>
              </div>
              <div className="text-left px-2">
                <div className="text-[10px] text-slate-400">Total Team Size</div>
                <div className="text-xl font-bold text-blue-400 font-mono">
                  {hierarchy.totalTeamSize} Members
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Red/Blue Referral Link Box */}
      <ReferralBox />

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] text-slate-400">Direct Referrals (L1)</div>
          <div className="text-2xl font-black text-white font-heading mt-1">
            {hierarchy.directReferrals.length}
          </div>
          <div className="text-[10px] text-amber-400 mt-0.5">Directly Sponsored</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] text-slate-400">Active Qualifying Team</div>
          <div className="text-2xl font-black text-emerald-400 font-heading mt-1">
            {hierarchy.allDownline.filter((m) => m.qualifyingDone).length}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Completed ₹150 Help</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] text-slate-400">Eligible Paid Rewards</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            ₹{totalPaidRewards.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Credited to wallet</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] text-slate-400">Configured Matrix Depth</div>
          <div className="text-2xl font-black text-purple-400 font-heading mt-1">
            6 Levels
          </div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Admin configurable</div>
        </div>
      </div>

      {/* Level-Wise Matrix Breakdown (Level 1 - Level 6) */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-bold text-white font-heading">
              Level-Wise Performance Matrix (L1 – L6)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click a level tab below to inspect members</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {referralLevels.map((lvl) => {
            const stat = hierarchy.levelStats.find((s) => s.level === lvl.level);
            const isSelected = selectedLevel === lvl.level;

            return (
              <button
                key={lvl.level}
                onClick={() => setSelectedLevel(lvl.level)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Level {lvl.level}</span>
                    <span className="text-[10px] font-bold text-amber-400 font-mono">
                      {lvl.percentage}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {stat ? stat.memberCount : 0} Members
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-500">Rewards:</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    ₹{stat ? stat.earnedRewards.toFixed(2) : '0.00'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Level Team Members Table */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Level {selectedLevel} Members ({filteredMembers.length})
            </h4>
            <div className="text-xs text-slate-400">
              Reward Rate: <strong className="text-amber-400">{referralLevels.find((l) => l.level === selectedLevel)?.percentage}%</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Member ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Help Given</th>
                  <th className="py-2.5 px-3">Qualifying Status</th>
                  <th className="py-2.5 px-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No members registered under Level {selectedLevel} yet. Share your referral link to expand your community team.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.userId} className="hover:bg-slate-850/40 transition">
                      <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">{m.userId}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{m.fullName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        ₹{m.totalHelpGiven}
                      </td>
                      <td className="py-2.5 px-3">
                        {m.qualifyingDone ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Qualifying Done
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Clock className="h-3 w-3" />
                            Pending ₹150 Help
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1.5">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          <span>Statutory Referral Compliance & Anti-Pyramid Notice</span>
        </div>
        <p>
          Referral incentives are strictly non-guaranteed and are paid out only as operational assistance incentives upon genuine qualifying community mutual help activities by downline peers. HELP150 does not allow money circulation schemes or recruitment-only financial gains.
        </p>
      </div>
    </div>
  );
};

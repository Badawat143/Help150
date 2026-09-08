/**
 * HELP150 — Comprehensive Wallet & Real-Time Ledger Module
 * Available Balance, Pending Balance, Immutable Transaction Ledger, and audit integrity.
 */

import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpRight,
  Receipt,
  Filter,
  Download,
  ShieldCheck,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TransactionType } from '../../types';
import { db } from '../../services/db';

export const WalletModule: React.FC = () => {
  const { currentUser, wallet, setActiveTab } = useAuth();
  const state = db.getState();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  const transactions = state.transactions
    .filter(
      (t) =>
        t.userId === currentUser.id ||
        t.senderUserId === currentUser.id ||
        t.receiverUserId === currentUser.id
    )
    .filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.remarks.toLowerCase().includes(q) ||
          t.referenceId.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const exportLedgerCsv = () => {
    const headers = ['Transaction ID', 'Date Time', 'Type', 'Amount', 'Status', 'Reference', 'Remarks'];
    const rows = transactions.map((t) => [
      t.id,
      t.createdAt,
      t.type,
      t.amount,
      t.status,
      t.referenceId,
      `"${t.remarks.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HELP150_Ledger_${currentUser.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Wallet Balance Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <WalletIcon className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Official Wallet Ledger
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              ₹{wallet?.availableBalance ?? 0}
              <span className="text-xs sm:text-sm font-semibold text-emerald-400 font-sans ml-2">
                Available Balance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Server-authoritative balance calculated from verified ledger events
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-wallet-withdraw"
              onClick={() => setActiveTab('withdrawal')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowDownCircle className="h-4 w-4" />
              <span>Withdraw to Bank (Min. ₹200)</span>
            </button>

            <button
              id="btn-wallet-help"
              onClick={() => setActiveTab('help')}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Initiate ₹150 Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Available Balance</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            ₹{wallet?.availableBalance ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ready for withdrawal</div>
        </div>

        {/* Pending Balance */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Pending Balance</span>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            ₹{wallet?.pendingBalance ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">In withdrawal / review</div>
        </div>

        {/* Total Referral Rewards */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Referral Incentives</span>
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">
            ₹{wallet?.totalReferralRewards ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Qualifying activity incentives</div>
        </div>

        {/* Total Withdrawn */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Withdrawn</span>
            <ArrowDownCircle className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">
            ₹{wallet?.totalWithdrawn ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Transferred to Bank/UPI</div>
        </div>
      </div>

      {/* Complete Transaction History Section */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        {/* Controls: Search, Filter, Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white font-heading">
              Complete Transaction History ({transactions.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UTR, ID, remarks..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 w-48 focus:border-amber-500"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="help_given">Help Given</option>
              <option value="help_received">Help Received</option>
              <option value="referral_reward">Referral Rewards</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="admin_credit">Admin Adjustments</option>
            </select>

            {/* Export CSV */}
            <button
              onClick={exportLedgerCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-3">Transaction ID</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Balance After</th>
                <th className="py-3 px-3">Reference / UTR</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No transactions match your search filter.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCredit = ['help_received', 'referral_reward', 'admin_credit'].includes(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">{tx.id}</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isCredit ? '+' : '-'}₹{tx.amount}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">₹{tx.balanceAfter}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{tx.referenceId}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px] max-w-xs truncate">
                        {tx.remarks}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Security Rule Footer */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Ledger Integrity Guarantee:</strong> All credit and debit operations are computed atomically on the backend. Client-side modifications are blocked.
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * HELP150 — Verified Withdrawal Module
 * Strict multiples of ₹200 validation, mandatory KYC compliance gate, and multi-stage workflow.
 */

import React, { useState } from 'react';
import {
  ArrowDownCircle,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  Smartphone,
  Info,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { WithdrawalStatus } from '../../types';
import { db } from '../../services/db';

export const WithdrawalModule: React.FC = () => {
  const { currentUser, wallet, refreshUserData, setActiveTab } = useAuth();
  const state = db.getState();
  const settings = state.settings;

  const minAmount = settings.minWithdrawalAmount || 200;
  const multiple = settings.withdrawalMultiple || 200;
  const feePercent = settings.withdrawalProcessingFeePercent || 5;

  const [amount, setAmount] = useState<number>(multiple);
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  // KYC check
  const isKycVerified = currentUser.kycStatus === 'verified';
  const kycRecord = state.kycRecords.find((k) => k.userId === currentUser.id);

  // Prefill banking details from KYC if verified
  React.useEffect(() => {
    if (kycRecord) {
      if (kycRecord.upiId) setUpiId(kycRecord.upiId);
      if (kycRecord.bankName) setBankName(kycRecord.bankName);
      if (kycRecord.accountNumber) setAccountNumber(kycRecord.accountNumber);
      if (kycRecord.ifscCode) setIfscCode(kycRecord.ifscCode);
    }
  }, [kycRecord]);

  const userWithdrawals = state.withdrawals.filter((w) => w.userId === currentUser.id);

  const processingFee = Math.round(((amount * feePercent) / 100) * 100) / 100;
  const netPayable = amount - processingFee;

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate amount
    if (amount < minAmount) {
      setErrorMsg(`Minimum withdrawal amount is ₹${minAmount}`);
      return;
    }
    if (amount % multiple !== 0) {
      setErrorMsg(`Withdrawal amount must be in multiples of ₹${multiple} (e.g. ₹200, ₹400, ₹600, ₹800)`);
      return;
    }
    if ((wallet?.availableBalance ?? 0) < amount) {
      setErrorMsg(`Insufficient available balance (Available: ₹${wallet?.availableBalance ?? 0})`);
      return;
    }
    if (settings.kycRequiredForWithdrawal && !isKycVerified) {
      setErrorMsg('Mandatory KYC verification required before initiating withdrawals.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestWithdrawal({
        userId: currentUser.id,
        amount,
        payoutMethod,
        payoutUpiId: payoutMethod === 'upi' ? upiId : undefined,
        payoutBankDetails:
          payoutMethod === 'bank_transfer'
            ? { bankName, accountNumber, ifscCode }
            : undefined,
      });

      if (res.success && res.data) {
        setSuccessMsg(`Withdrawal request #${res.data.id} submitted successfully for net ₹${res.data.netPayable}.`);
        refreshUserData();
      } else {
        setErrorMsg(res.error || 'Failed to submit withdrawal request');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Withdrawal processing error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed & Paid
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Rejected
          </span>
        );
      case 'approved':
      case 'payment_processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Clock className="h-3 w-3 animate-spin" />
            Processing Payout
          </span>
        );
      case 'requested':
      case 'verification':
      case 'admin_review':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Admin Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
                  Bank & UPI Withdrawal Module
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Multiples of ₹{multiple}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Minimum withdrawal ₹{minAmount} • Direct Bank/UPI transfer • Multi-step verification flow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="text-left px-2 border-r border-slate-800">
              <div className="text-[10px] text-slate-400">Available Balance</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                ₹{wallet?.availableBalance ?? 0}
              </div>
            </div>
            <div className="text-left px-2">
              <div className="text-[10px] text-slate-400">KYC Status</div>
              <div className={`text-xs font-bold uppercase ${isKycVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                {currentUser.kycStatus}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Warning if not verified */}
      {!isKycVerified && (
        <div className="p-5 rounded-3xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0" />
            <div>
              <strong className="text-amber-300 font-bold block text-sm">KYC Verification Required</strong>
              <p className="text-slate-300">
                To comply with Indian statutory standards, identity verification (Aadhaar/PAN) is mandatory before withdrawals can be initiated.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('kyc')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0 cursor-pointer"
          >
            Submit KYC Documents
          </button>
        </div>
      )}

      {/* 5-Step Process Indicator */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Withdrawal Verification Lifecycle
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-amber-400 font-bold font-mono text-sm">1</div>
            <div className="text-slate-300 font-semibold mt-1">Request</div>
            <div className="text-[10px] text-slate-500">Multiples of ₹200</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-blue-400 font-bold font-mono text-sm">2</div>
            <div className="text-slate-300 font-semibold mt-1">KYC Check</div>
            <div className="text-[10px] text-slate-500">Aadhaar/PAN match</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-purple-400 font-bold font-mono text-sm">3</div>
            <div className="text-slate-300 font-semibold mt-1">Admin Review</div>
            <div className="text-[10px] text-slate-500">Audit log generated</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-sky-400 font-bold font-mono text-sm">4</div>
            <div className="text-slate-300 font-semibold mt-1">Payment Process</div>
            <div className="text-[10px] text-slate-500">Gateway/Bank UTR</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
            <div className="text-emerald-400 font-bold font-mono text-sm">5</div>
            <div className="text-slate-300 font-semibold mt-1">Completed</div>
            <div className="text-[10px] text-slate-500">Ledger confirmed</div>
          </div>
        </div>
      </div>

      {/* Main Withdrawal Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Form */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-bold text-white font-heading">
                Initiate New Withdrawal Request
              </h3>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
              {/* Multiples of ₹200 Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Withdrawal Amount (Must be multiple of ₹{multiple})
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[200, 400, 600, 800].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                        amount === val
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                <div className="relative mt-2">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono font-bold">₹</span>
                  <input
                    id="input-withdraw-amount"
                    type="number"
                    step={multiple}
                    min={minAmount}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 text-xs text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Payout Method Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payout Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('upi')}
                    className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer flex items-center gap-2 ${
                      payoutMethod === 'upi'
                        ? 'bg-blue-950/40 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Smartphone className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="font-bold">UPI Transfer</div>
                      <div className="text-[10px] text-slate-500">Instant VPA</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank_transfer')}
                    className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer flex items-center gap-2 ${
                      payoutMethod === 'bank_transfer'
                        ? 'bg-blue-950/40 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="font-bold">Bank IMPS / NEFT</div>
                      <div className="text-[10px] text-slate-500">Account + IFSC</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Payout Fields */}
              {payoutMethod === 'upi' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Verified UPI ID
                  </label>
                  <input
                    id="input-withdraw-upi"
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. ashok@okaxis"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 text-xs text-white placeholder-slate-500 font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name</label>
                    <input
                      id="input-withdraw-bank"
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Account No.</label>
                      <input
                        id="input-withdraw-acc"
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Account Number"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">IFSC Code</label>
                      <input
                        id="input-withdraw-ifsc"
                        type="text"
                        required
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="SBIN0001420"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                id="btn-withdraw-submit"
                type="submit"
                disabled={loading || !isKycVerified || (wallet?.availableBalance ?? 0) < amount}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 text-white font-bold text-xs transition shadow-lg shadow-blue-500/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {loading
                    ? 'Submitting to Backend...'
                    : !isKycVerified
                    ? 'KYC Verification Required'
                    : `Submit Request for Net ₹${netPayable}`}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Transparent Breakdown & Calculations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Financial Breakdown & Fees
            </h3>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Requested Amount:</span>
                <span className="font-bold text-white font-mono">₹{amount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Platform & Processing Fee ({feePercent}%):</span>
                <span className="font-bold text-rose-400 font-mono">-₹{processingFee}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-200">Net Transfer to Account:</span>
                <span className="text-emerald-400 font-mono text-base">₹{netPayable}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed space-y-2">
              <p>
                • <strong>Ledger Debit Policy:</strong> The requested amount is atomically debited from your Available Balance and held in Pending status until admin audit.
              </p>
              <p>
                • <strong>Verification Schedule:</strong> Approved payouts are dispatched within standard banking batch windows.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white font-heading">
              Your Past Withdrawal History ({userWithdrawals.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Request ID</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Net Payable</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Bank / UPI Details</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">UTR Reference</th>
                <th className="py-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No withdrawal requests placed yet.
                  </td>
                </tr>
              ) : (
                userWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">{w.id}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white">₹{w.amount}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">₹{w.netPayable}</td>
                    <td className="py-3 px-3 uppercase text-slate-400">{w.payoutMethod}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {w.payoutUpiId || `${w.payoutBankDetails?.bankName} (${w.payoutBankDetails?.accountNumber})`}
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(w.status)}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {w.transactionRef || 'Under Review'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

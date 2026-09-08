/**
 * HELP150 — Bank & Identity KYC Verification Module
 * Compliant with Indian identity norms (Aadhaar / PAN / Bank verification) and audit logging.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  Smartphone,
  CreditCard,
  Send,
  Lock,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { db } from '../../services/db';

export const KycModule: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const state = db.getState();

  const userKyc = state.kycRecords.find((k) => k.userId === currentUser?.id);

  const [documentType, setDocumentType] = useState<'aadhaar' | 'pan' | 'voter_id'>(
    userKyc?.documentType || 'aadhaar'
  );
  const [fullNameAsPerId, setFullNameAsPerId] = useState(userKyc?.fullNameAsPerId || currentUser.fullName);
  const [aadhaarNumber, setAadhaarNumber] = useState(userKyc?.aadhaarNumber || '');
  const [panNumber, setPanNumber] = useState(userKyc?.panNumber || '');
  const [upiId, setUpiId] = useState(userKyc?.upiId || '');
  const [bankName, setBankName] = useState(userKyc?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(userKyc?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(userKyc?.ifscCode || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    setLoading(true);
    try {
      const res = await api.submitKyc({
        userId: currentUser.id,
        fullNameAsPerId: fullNameAsPerId.trim(),
        aadhaarNumber: aadhaarNumber.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        documentType,
        upiId: upiId.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      });

      if (res.success) {
        setSuccessMsg('KYC documents submitted successfully! Admin verification takes up to 12 hours.');
        refreshUserData();
      } else {
        setErrorMsg(res.error || 'Failed to submit KYC details');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentUser.kycStatus) {
      case 'verified':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>KYC Verified & Compliant</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Under Admin Verification</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>KYC Rejected (Resubmission Required)</span>
          </div>
        );
      case 'not_submitted':
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs">
            <FileCheck className="h-4 w-4 text-slate-400" />
            <span>Not Submitted</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
                  Statutory KYC & Identity Verification
                </h1>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Aadhaar • PAN Card • Bank Account • Real-time Compliance Verification
              </p>
            </div>
          </div>

          <div>{getStatusBadge()}</div>
        </div>
      </div>

      {userKyc?.rejectionReason && currentUser.kycStatus === 'rejected' && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <strong className="block text-rose-200">Rejection Reason from Compliance Desk:</strong>
            <span>{userKyc.rejectionReason}</span>
          </div>
        </div>
      )}

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

      {/* KYC Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-8">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-heading">
                {currentUser.kycStatus === 'verified'
                  ? 'Your Verified KYC Record'
                  : 'Submit / Update Identity Details'}
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">User ID: {currentUser.id}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Legal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name (as per Govt ID) <span className="text-amber-400">*</span>
                </label>
                <input
                  id="input-kyc-fullname"
                  type="text"
                  required
                  disabled={currentUser.kycStatus === 'verified'}
                  value={fullNameAsPerId}
                  onChange={(e) => setFullNameAsPerId(e.target.value)}
                  placeholder="e.g. Ashok Kumar"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-xs text-white placeholder-slate-500"
                />
              </div>

              {/* Aadhaar and PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aadhaar Number (12 Digits) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="input-kyc-aadhaar"
                    type="text"
                    required
                    disabled={currentUser.kycStatus === 'verified'}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-xs text-white placeholder-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PAN Card Number (10 Chars) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="input-kyc-pan"
                    type="text"
                    required
                    disabled={currentUser.kycStatus === 'verified'}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-xs text-white placeholder-slate-500 font-mono uppercase"
                  />
                </div>
              </div>

              {/* UPI & Bank Details for Withdrawal Payouts */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Verified Payout Channels (Bank / UPI)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Primary UPI ID (Optional)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="input-kyc-upi"
                      type="text"
                      disabled={currentUser.kycStatus === 'verified'}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@oksbi"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-xs text-white placeholder-slate-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name</label>
                    <input
                      id="input-kyc-bank"
                      type="text"
                      disabled={currentUser.kycStatus === 'verified'}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Account No.</label>
                    <input
                      id="input-kyc-acc"
                      type="text"
                      disabled={currentUser.kycStatus === 'verified'}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">IFSC Code</label>
                    <input
                      id="input-kyc-ifsc"
                      type="text"
                      disabled={currentUser.kycStatus === 'verified'}
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {currentUser.kycStatus !== 'verified' && (
                <button
                  id="btn-kyc-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-xs transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? 'Submitting to Desk...' : 'Submit Documents for Verification'}</span>
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Right Info Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Security & Verification Guidelines
            </h3>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Name Matching:</strong> Your bank account name must match your registration name ({currentUser.fullName}).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>One KYC per User:</strong> Duplicate accounts using the same PAN/Aadhaar are strictly blocked by the system.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Encrypted Storage:</strong> Financial identifiers are hashed and securely stored for compliance audit logs.
                </span>
              </li>
            </ul>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400">
              <strong>Need quick verification?</strong> Contact our compliance support desk via the Support tab.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

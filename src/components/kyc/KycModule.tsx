/**
 * HELP150 — User Profile & Bank Payment Details Module
 * No Aadhaar / PAN card required. Direct UPI and Bank Account configuration.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Building,
  Smartphone,
  CreditCard,
  Phone,
  Mail,
  Save,
  CheckCircle2,
  Camera,
  UploadCloud,
  Trash2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { db } from '../../services/db';
import { useToast } from '../../context/ToastContext';

export const KycModule: React.FC = () => {
  const { currentUser, refreshUserData, setActiveTab } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const state = db.getState();
  const userKyc = state.kycRecords.find((k) => k.userId === currentUser?.id);

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

  // Banking & UPI
  const [upiId, setUpiId] = useState(currentUser?.upiId || userKyc?.upiId || '');
  const [bankName, setBankName] = useState(currentUser?.bankName || userKyc?.bankName || '');
  const [accountHolderName, setAccountHolderName] = useState(
    currentUser?.accountHolderName || userKyc?.accountHolderName || currentUser?.fullName || ''
  );
  const [accountNumber, setAccountNumber] = useState(currentUser?.accountNumber || userKyc?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(currentUser?.ifscCode || userKyc?.ifscCode || '');
  const [gpayPhonePeNumber, setGpayPhonePeNumber] = useState(
    currentUser?.gpayPhonePeNumber || userKyc?.gpayPhonePeNumber || currentUser?.mobile || ''
  );

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setMobile(currentUser.mobile || '');
      setEmail(currentUser.email || '');
      if (currentUser.avatarUrl) setAvatarUrl(currentUser.avatarUrl);
      if (currentUser.upiId) setUpiId(currentUser.upiId);
      if (currentUser.bankName) setBankName(currentUser.bankName);
      if (currentUser.accountHolderName) setAccountHolderName(currentUser.accountHolderName);
      if (currentUser.accountNumber) setAccountNumber(currentUser.accountNumber);
      if (currentUser.ifscCode) setIfscCode(currentUser.ifscCode);
      if (currentUser.gpayPhonePeNumber) setGpayPhonePeNumber(currentUser.gpayPhonePeNumber);
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WEBP).', 'Invalid File');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo size must be less than 5MB.', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
      toast.success('Profile photo loaded. Click save button to apply.', 'Photo Ready');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!mobile.trim() || mobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateUserProfile({
        userId: currentUser.id,
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        avatarUrl,
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        upiId: upiId.trim(),
        gpayPhonePeNumber: gpayPhonePeNumber.trim(),
      });

      if (res.success) {
        setSuccessMsg('Your profile and bank details have been saved successfully!');
        toast.success('Profile and bank details saved.', 'Saved Successfully 🎉');
        refreshUserData();
      } else {
        setErrorMsg(res.error || 'Failed to save details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0A1633] via-[#0F265C] to-[#12317A] border border-blue-500/30 shadow-2xl relative overflow-hidden text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  User Profile & Bank Details
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  No KYC Required
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                No Aadhaar or PAN card required. Set your profile photo, name, and direct Bank/UPI payout details here.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-black/40 text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-amber-400/30">
              User ID: {currentUser.id}
            </span>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-3xl bg-blue-50 border border-blue-200 text-xs text-slate-700 flex items-start gap-3 shadow-sm">
        <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-blue-900 font-bold block text-sm">Direct Payments & Receiving Help:</strong>
          <p className="mt-0.5 text-slate-600 leading-relaxed">
            Other community members will transfer peer assistance directly to your UPI ID and Bank Account. Please ensure your details are accurate.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal Info & Photo */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">1. Personal Profile & Photo</h3>
            </div>

            {/* Profile Photo Uploader */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xl font-black shadow-md overflow-hidden border-2 border-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{fullName.charAt(0) || 'U'}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-400 text-slate-950 shadow-md hover:bg-amber-300 transition cursor-pointer border-2 border-white"
                  title="Upload Photo"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>

              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800">Profile Picture</div>
                <div className="text-[11px] text-slate-500">JPG, PNG, WEBP (Max 5MB)</div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Change Photo</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs cursor-pointer transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Card 2: Bank & UPI Details */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">2. Bank & UPI Payment Details</h3>
            </div>

            {/* UPI ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                <span>UPI ID (Google Pay / PhonePe / Paytm / BHIM)</span>
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. name@okhdfcbank / 9876543210@paytm"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
              />
            </div>

            {/* GPay PhonePe Mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span>Google Pay / PhonePe Mobile Number</span>
              </label>
              <input
                type="tel"
                value={gpayPhonePeNumber}
                onChange={(e) => setGpayPhonePeNumber(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India / HDFC Bank"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
              />
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Account holder name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
              />
            </div>

            {/* Account Number & IFSC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="384910294819"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-md">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Details are secure and used exclusively for community peer-to-peer transfers.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving...' : 'Save Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

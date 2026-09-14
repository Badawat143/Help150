import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  X,
  Camera,
  UploadCloud,
  Building,
  CreditCard,
  Smartphone,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  CheckCircle2,
  Trash2,
  AlertCircle,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onProfileUpdated?: () => void;
  initialTab?: 'profile' | 'bank' | 'upi';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  initialTab = 'profile',
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [mobile, setMobile] = useState(currentUser.mobile || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser.avatarUrl || '');

  // Bank & Payment Details
  const [bankName, setBankName] = useState(currentUser.bankName || '');
  const [accountHolderName, setAccountHolderName] = useState(
    currentUser.accountHolderName || currentUser.fullName || ''
  );
  const [accountNumber, setAccountNumber] = useState(currentUser.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(currentUser.ifscCode || '');
  const [upiId, setUpiId] = useState(currentUser.upiId || '');
  const [gpayPhonePeNumber, setGpayPhonePeNumber] = useState(
    currentUser.gpayPhonePeNumber || currentUser.mobile || ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'upi'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

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
      toast.success('Profile photo selected successfully.', 'Photo Selected');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name.', 'Validation Error');
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.', 'Validation Error');
      return;
    }

    setIsSaving(true);
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
        toast.success('Profile and bank details updated successfully!', 'Profile Updated 🎉');
        if (onProfileUpdated) onProfileUpdated();
        onClose();
      } else {
        toast.error(res.error || 'Failed to update profile.', 'Save Failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A1633] via-[#0F265C] to-[#12317A] p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">User Profile & Bank Details</h2>
                <p className="text-xs text-blue-200">User Profile, Photo & Payment Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Member ID Pill */}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="bg-black/30 text-amber-300 font-mono font-bold px-3 py-1 rounded-lg border border-amber-400/30">
              User ID: {currentUser.id}
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-lg border border-emerald-400/30 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active Member
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1.5 mt-4 border-b border-white/10 pb-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>1. प्रोफ़ाइल (Profile)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'bank'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building className="h-3.5 w-3.5 text-emerald-600" />
              <span>2. बैंक डिटेल्स (Bank)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'upi'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 text-cyan-600" />
              <span>3. UPI डिटेल्स (UPI)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Profile Photo Uploader */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-md overflow-hidden border-2 border-white">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{fullName.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition cursor-pointer border-2 border-white"
                    title="Upload Profile Photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900">Profile Picture</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG or WEBP (Max 5MB)</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition cursor-pointer"
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

              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium"
                />
              </div>

              {/* Mobile Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                  <span>Mobile Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('bank')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>अगला: बैंक डिटेल्स भरें</span>
                  <Building className="h-3.5 w-3.5 text-emerald-600" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Notice Banner */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <Building className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>बैंक खाता विवरण:</strong> कम्युनिटी सदस्य सहायता राशि व विथड्रॉल सीधे आपके इस बैंक खाते में भेजेंगे।
                </p>
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-blue-600" />
                  <span>Bank Name</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India / HDFC Bank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium"
                />
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                  <span>Account Holder Name</span>
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Name as per Bank Passbook"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium"
                />
              </div>

              {/* Account Number & IFSC in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                    <span>Account Number</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 384910294819"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-blue-600" />
                    <span>IFSC Code</span>
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  ← प्रोफ़ाइल
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upi')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>अगला: UPI भरें</span>
                  <Smartphone className="h-3.5 w-3.5 text-cyan-600" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upi' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Notice Banner */}
              <div className="p-3 bg-cyan-50 rounded-2xl border border-cyan-200 text-xs text-cyan-900 flex items-start gap-2.5">
                <Smartphone className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>UPI पेमेंट विवरण:</strong> Google Pay, PhonePe, Paytm, BHIM आदि UPI से सीधे भुगतान पाने के लिए अपनी UPI ID दर्ज करें।
                </p>
              </div>

              {/* UPI ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                  <span>UPI ID (Google Pay / PhonePe / Paytm / BHIM)</span>
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank / 9876543210@paytm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium font-mono"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-medium">Quick handles:</span>
                  {['@okhdfcbank', '@okaxis', '@oksbi', '@ybl', '@paytm', '@ibl'].map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => {
                        const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || mobile;
                        setUpiId(`${prefix}${handle}`);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 border border-slate-200 font-mono transition cursor-pointer"
                    >
                      {handle}
                    </button>
                  ))}
                </div>
              </div>

              {/* GPay / PhonePe Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Google Pay / PhonePe Mobile Number</span>
                </label>
                <input
                  type="tel"
                  value={gpayPhonePeNumber}
                  onChange={(e) => setGpayPhonePeNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium"
                />
              </div>

              <div className="flex justify-start pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('bank')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  ← वापस बैंक डिटेल्स
                </button>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * HELP150 — User Registration Modal with Instant Credentials Popup
 */

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  Lock,
  Mail,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  Share2,
  Smartphone,
  KeyRound,
  ShieldAlert,
  LogIn,
  UserCheck,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { referralTracker, SponsorLookupResult } from '../../services/referralTracker';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  initialSponsorId?: string;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  initialSponsorId = '',
}) => {
  const { loginAs } = useAuth();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sponsorId, setSponsorId] = useState('');
  const [isAutoTracked, setIsAutoTracked] = useState(false);
  const [sponsorLookup, setSponsorLookup] = useState<SponsorLookupResult | null>(null);
  const [isLookingUpSponsor, setIsLookingUpSponsor] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync sponsor ID on open or prop change
  useEffect(() => {
    if (isOpen) {
      const tracked =
        initialSponsorId ||
        referralTracker.extractReferralFromUrl() ||
        referralTracker.getStoredReferral() ||
        '';
      if (tracked) {
        setSponsorId(tracked.toUpperCase());
        setIsAutoTracked(true);
      }
    }
  }, [isOpen, initialSponsorId]);

  // Live lookup sponsor details when sponsorId changes
  useEffect(() => {
    const clean = sponsorId.trim().toUpperCase();
    if (!clean) {
      setSponsorLookup(null);
      setIsLookingUpSponsor(false);
      return;
    }

    let active = true;
    setIsLookingUpSponsor(true);

    const timer = setTimeout(async () => {
      const result = await referralTracker.lookupSponsor(clean);
      if (active) {
        setSponsorLookup(result);
        setIsLookingUpSponsor(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sponsorId]);

  // Success credentials state
  const [successData, setSuccessData] = useState<{
    id: string;
    fullName: string;
    mobile: string;
    email: string;
    password: string;
    sponsorId: string | null;
  } | null>(null);

  if (!isOpen) return null;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // safe fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match / पासवर्ड मेल नहीं खा रहे हैं');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError('You must agree to both the Terms & Conditions and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const canonicalSponsor = (sponsorLookup?.id || sponsorId).trim();
      const res = await api.register({
        fullName,
        mobile,
        email,
        password,
        sponsorId: canonicalSponsor || undefined,
      });

      if (res.success && res.data) {
        referralTracker.clearTrackedReferral();
        setSuccessData({
          id: res.data.user.id,
          fullName: res.data.user.fullName,
          mobile: res.data.user.mobile,
          email: res.data.user.email,
          password: password,
          sponsorId: res.data.user.sponsorId,
        });
        triggerCelebration();
      } else {
        setError(res.error || 'Failed to complete registration');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyAllCredentials = () => {
    if (!successData) return;
    const textToCopy = `🎉 HELP150 LOGIN CREDENTIALS / लॉगिन विवरण:\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 Name: ${successData.fullName}\n` +
      `🆔 User ID: ${successData.id}\n` +
      `🔒 Password: ${successData.password}\n` +
      `📱 Mobile: ${successData.mobile}\n` +
      `🤝 Sponsor: ${successData.sponsorId || 'Direct'}\n` +
      `🌐 Portal: ${window.location.origin}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ Note: Save this ID & Password safely for logging in across all browsers & devices.`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 3000);
  };

  const handleShareWhatsApp = () => {
    if (!successData) return;
    const message = `🎉 *HELP150 Account Registration Details*\n\n` +
      `*Full Name:* ${successData.fullName}\n` +
      `*User ID:* ${successData.id}\n` +
      `*Password:* ${successData.password}\n` +
      `*Mobile:* ${successData.mobile}\n` +
      `*Website:* ${window.location.origin}\n\n` +
      `_Save these credentials safely to login from any mobile or desktop browser._`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDirectLogin = () => {
    if (successData) {
      loginAs(successData.id);
      onClose();
    }
  };

  const handleGoToLogin = () => {
    onClose();
    onSwitchToLogin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-7 text-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {successData ? (
          /* ========================================================================= */
          /* POPUP: REGISTRATION SUCCESSFUL WITH USER ID & PASSWORD CREDENTIALS */
          /* ========================================================================= */
          <div className="py-2 space-y-4 animate-in zoom-in-95 text-center">
            {/* Header Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>पंजीकरण सफल / Registration Successful</span>
              </div>
              <h3 className="text-2xl font-black text-white font-heading">
                Welcome, {successData.fullName}!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                आपका HELP150 कम्युनिटी अकाउंट सफलतापूर्वक बन गया है।
              </p>
            </div>

            {/* Main Credentials Box */}
            <div className="bg-slate-950/90 rounded-2xl border-2 border-amber-500/50 p-4 sm:p-5 text-left space-y-3.5 shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

              {/* User ID Section */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>User ID (यूजर आईडी)</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-wide">
                    {successData.id}
                  </div>
                </div>
                <button
                  id="btn-copy-user-id"
                  onClick={() => handleCopyText(successData.id, 'userId')}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedField === 'userId' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Password Section */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Password (पासवर्ड)</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono tracking-wider">
                    {showPassword ? successData.password : '••••••••••••'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    id="btn-copy-password"
                    onClick={() => handleCopyText(successData.password, 'password')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedField === 'password' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Additional Account Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Registered Mobile</div>
                  <div className="font-semibold text-slate-200">{successData.mobile}</div>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Sponsor ID</div>
                  <div className="font-semibold text-amber-300 font-mono">
                    {successData.sponsorId || 'None (Direct)'}
                  </div>
                </div>
              </div>

              {/* Important Caution Notice */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-left flex items-start gap-2.5 text-amber-200 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="leading-snug">
                  <strong className="text-amber-300">महत्वपूर्ण सूचना:</strong> कृपया अपना यूजर ID और पासवर्ड कहीं सुरक्षित लिख लें या इसका स्क्रीनशॉट ले लें। किसी भी डिवाइस या ब्राउज़र में लॉगिन करने के लिए इसका उपयोग करें।
                </div>
              </div>
            </div>

            {/* Copy All & WhatsApp Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                id="btn-copy-all-credentials"
                onClick={handleCopyAllCredentials}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-600 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">All Details Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-amber-400" />
                    <span>Copy All Credentials</span>
                  </>
                )}
              </button>

              <button
                id="btn-share-whatsapp-credentials"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                <span>Save on WhatsApp</span>
              </button>
            </div>

            {/* Action Buttons: Direct Login vs Go to Login */}
            <div className="space-y-2 pt-2">
              <button
                id="btn-register-enter-dashboard"
                onClick={handleDirectLogin}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>डैशबोर्ड में लॉगिन करें / Enter Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={handleGoToLogin}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>लॉगिन स्क्रीन पर जाएं / Go to Login Screen</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* REGISTRATION FORM */
          /* ========================================================================= */
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-md">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white font-heading tracking-tight">
                  Join HELP150 Community
                </h3>
                <p className="text-xs text-slate-400">
                  Voluntary mutual helping • All devices & browsers supported
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name (पूरा नाम) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-slate-500 transition"
                  />
                </div>
              </div>

              {/* Mobile & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number (मोबाइल) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="reg-mobile"
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (ईमेल) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password (पासवर्ड) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="reg-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Referral / Sponsor ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Referral / Sponsor ID (रेफरल स्पॉन्सर आईडी)
                  </label>
                  {isAutoTracked && sponsorId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span>Auto-Tracked via Link</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Sparkles className="absolute left-3.5 top-3 h-4 w-4 text-amber-400" />
                  <input
                    id="reg-sponsor-id"
                    type="text"
                    value={sponsorId}
                    onChange={(e) => {
                      setSponsorId(e.target.value.toUpperCase());
                      setIsAutoTracked(false);
                    }}
                    placeholder="e.g. H150-784920 (Leave blank for direct)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-amber-300 font-mono uppercase"
                  />
                </div>

                {/* Live Sponsor Feedback Status */}
                {isLookingUpSponsor ? (
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5 px-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Verifying sponsor credentials...</span>
                  </div>
                ) : sponsorLookup && sponsorLookup.exists ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                          {isAutoTracked ? (
                            <>
                              <Sparkles className="h-3 w-3 text-amber-400" />
                              <span>Referral Link Sponsor</span>
                            </>
                          ) : (
                            <span>Verified Community Sponsor</span>
                          )}
                        </div>
                        <div className="font-semibold text-white">
                          {sponsorLookup.fullName} <span className="text-amber-400 font-mono">({sponsorLookup.id})</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                      Level 1 Team
                    </span>
                  </div>
                ) : sponsorId.trim() ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>User ID "{sponsorId}" not found. Verify the ID or leave empty for direct registration.</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 mt-1 block px-1">
                    Leave blank for direct joining. Newly joined peers automatically connect in real-time.
                  </span>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    id="reg-terms-check"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <span>
                    I accept the <span className="text-amber-400 font-semibold">Terms & Conditions</span>. I understand this platform offers NO guaranteed income or fixed returns.
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    id="reg-privacy-check"
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <span>
                    I agree to the <span className="text-amber-400 font-semibold">Privacy Policy</span> and mandatory KYC identity verification rules.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                id="btn-register-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Generating User ID & Credentials...' : 'Create Account & Generate User ID'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                id="btn-switch-to-login"
                onClick={onSwitchToLogin}
                className="text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Login here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

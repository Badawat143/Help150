/**
 * HELP150 — User Registration Modal
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
  const [sponsorId, setSponsorId] = useState(initialSponsorId);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; fullName: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError('You must agree to both the Terms & Conditions and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName,
        mobile,
        email,
        password,
        sponsorId: sponsorId.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessData({
          id: res.data.user.id,
          fullName: res.data.user.fullName,
        });
      } else {
        setError(res.error || 'Failed to complete registration');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (successData) {
      loginAs(successData.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {successData ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="text-2xl font-black text-white font-heading">Registration Successful!</h3>
            <p className="text-xs text-slate-300">
              Welcome to the HELP150 Community, <strong>{successData.fullName}</strong>.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 my-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Your Auto-Generated User ID
              </span>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-wider mt-1">
                {successData.id}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Please save this ID safely. You can use it to log in and invite community peers.
              </p>
            </div>

            <button
              id="btn-register-enter-dashboard"
              onClick={handleFinish}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Your Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-md">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white font-heading tracking-tight">
                  Join HELP150 Community
                </h3>
                <p className="text-xs text-slate-400">
                  Voluntary mutual helping • No guaranteed income promises
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name (As per Govt ID) <span className="text-amber-400">*</span>
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
                    Mobile Number <span className="text-amber-400">*</span>
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
                    Email Address <span className="text-amber-400">*</span>
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
                    Password <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-white placeholder-slate-500"
                    />
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
                      type="password"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Referral / Sponsor ID (Optional)
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3.5 top-3 h-4 w-4 text-amber-400" />
                  <input
                    id="reg-sponsor-id"
                    type="text"
                    value={sponsorId}
                    onChange={(e) => setSponsorId(e.target.value.toUpperCase())}
                    placeholder="e.g. H150-784920"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-amber-300 font-mono uppercase"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Leave empty if you are registering directly.
                </span>
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Generating Unique User ID...' : 'Create My Account & Generate ID'}
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

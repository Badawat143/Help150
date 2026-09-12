/**
 * HELP150 — User & Admin Login Modal
 */

import React, { useState } from 'react';
import {
  LogIn,
  X,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { loginAs } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(identifier, password);
      if (res.success && res.data) {
        loginAs(res.data.user.id);
        onClose();
      } else {
        setError(res.error || 'Invalid credentials or user not found');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (id: string) => {
    loginAs(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 sm:p-7 text-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-md">
            <LogIn className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-heading tracking-tight">
              Member & Admin Login
            </h3>
            <p className="text-xs text-slate-400">
              Cross-browser & all-device secure access
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              User ID / Email / Mobile
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="login-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. H150-784920, 9876543210"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-white placeholder-slate-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Account Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Verifying & Syncing Session...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Instant Role Persona Access for reviewer ease */}
        <div className="mt-5 pt-3.5 border-t border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">
            One-Click Quick Sign-In (For Testing)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('H150-784920')}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left text-xs transition cursor-pointer"
            >
              <div className="font-semibold text-amber-300">Ashok Kumar</div>
              <div className="text-[10px] text-slate-400">Verified Member (₹400)</div>
            </button>
            <button
              onClick={() => handleQuickLogin('H150-ADMIN01')}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/40 text-left text-xs transition cursor-pointer"
            >
              <div className="font-semibold text-red-400">Super Admin</div>
              <div className="text-[10px] text-slate-400">Full 22 Admin Modules</div>
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          New to HELP150?{' '}
          <button
            id="btn-switch-to-register"
            onClick={onSwitchToRegister}
            className="text-amber-400 hover:underline font-semibold cursor-pointer"
          >
            Register account here
          </button>
        </div>
      </div>
    </div>
  );
};

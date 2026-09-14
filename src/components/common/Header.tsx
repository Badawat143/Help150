/**
 * HELP150 — Responsive Main Navigation Header
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Bell,
  Wallet as WalletIcon,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Lock,
  Crown,
  ChevronDown,
  CheckCircle2,
  Users,
  HeartHandshake,
  ArrowDownCircle,
  HelpCircle,
  FileText,
  Sliders,
  Search,
  Moon,
  Sun,
  Database,
  CreditCard,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FirebaseConnectionModal } from './FirebaseConnectionModal';

interface HeaderProps {
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin, onOpenRegister }) => {
  const {
    currentUser,
    firebaseUser,
    wallet,
    notifications,
    unreadCount,
    isAdmin,
    isCompliance,
    activeTab,
    setActiveTab,
    loginAs,
    loginWithGoogle,
    logout,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [firebaseModalOpen, setFirebaseModalOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: HeartHandshake, publicOnly: false },
    { id: 'dashboard', label: 'Dashboard', icon: Sliders, authRequired: true },
    { id: 'help', label: 'Help ₹150', icon: HeartHandshake, authRequired: true },
    { id: 'wallet', label: 'Wallet', icon: WalletIcon, authRequired: true },
    { id: 'withdrawal', label: 'Withdrawal', icon: ArrowDownCircle, authRequired: true },
    { id: 'referral', label: 'Referral Team', icon: Users, authRequired: true },
    { id: 'kyc', label: 'Bank & UPI', icon: CreditCard, authRequired: true },
    { id: 'support', label: 'Support', icon: HelpCircle, authRequired: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060b17]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer"
            >
              <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-lg shadow-amber-500/25 group-hover:scale-105 group-hover:shadow-amber-500/40 transition-all">
                <img
                  src="/logo.png"
                  alt="HELP150 Official Logo"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain rounded-full"
                />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900 text-[9px] font-bold text-white shadow">
                  ✓
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading">
                    HELP <span className="gradient-gold-text">150</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    HELPING PLAN
                  </span>
                </div>
                <span className="text-[11px] text-amber-200/80 hidden sm:inline font-medium">
                  Together For A Better Tomorrow
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems
              .filter((item) => !item.authRequired || currentUser)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}

            <button
              id="nav-link-admin"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-blue-950/60 text-blue-300 border border-blue-800/60 hover:bg-blue-900/60'
              }`}
            >
              <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>Admin Panel</span>
            </button>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Firebase Database Connection Status Pill */}
            <button
              id="header-firebase-status-pill"
              onClick={() => setFirebaseModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 rounded-full py-1.5 px-3 transition cursor-pointer group shadow-sm"
              title="Firebase Firestore Cloud Database — Connected & Live. Click to inspect connection."
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <Database className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-200">
                DB: <span className="text-emerald-400">Live</span>
              </span>
            </button>

            {currentUser ? (
              <>
                {/* Live Wallet Pill */}
                <button
                  id="header-wallet-pill"
                  onClick={() => setActiveTab('wallet')}
                  className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-full py-1.5 px-3 hover:border-amber-500/40 transition cursor-pointer"
                  title="Click to view Wallet details"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <WalletIcon className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-slate-400 leading-none">Available</span>
                    <span className="text-xs font-bold text-emerald-400 leading-tight">
                      ₹{wallet?.availableBalance ?? 0}
                    </span>
                  </div>
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    id="btn-header-notifs"
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-slate-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Notifications ({unreadCount} new)
                          </h4>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">No notifications yet</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markNotificationRead(n.id);
                                if (n.linkTab) setActiveTab(n.linkTab);
                                setNotifDropdownOpen(false);
                              }}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                n.isRead
                                  ? 'bg-slate-950/40 border-slate-850 text-slate-400'
                                  : 'bg-slate-850/80 border-amber-500/30 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-white">{n.title}</span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu / Persona Switcher */}
                <div className="relative">
                  <button
                    id="btn-header-user-menu"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition cursor-pointer"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-semibold text-white leading-tight max-w-[100px] truncate">
                        {currentUser.fullName}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono leading-none">
                        {currentUser.id}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {/* Persona switch modal/dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50">
                      <div className="p-2 border-b border-slate-800">
                        <div className="text-xs font-bold text-white">{currentUser.fullName}</div>
                        <div className="text-[11px] text-amber-400 font-mono">{currentUser.id}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          Role: <span className="capitalize text-slate-300 font-semibold">{currentUser.role.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {/* Admin Switcher (Visible strictly when currently an Admin) */}
                      {isAdmin && (
                        <div className="py-2">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                            Admin Roles
                          </div>
                          <button
                            onClick={() => {
                              loginAs('H150-ADMIN01');
                              setUserMenuOpen(false);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-red-300 flex items-center justify-between"
                          >
                            <span>Super Admin (Root)</span>
                            {currentUser.id === 'H150-ADMIN01' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          </button>
                          <button
                            onClick={() => {
                              loginAs('H150-COMP01');
                              setUserMenuOpen(false);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-amber-300 flex items-center justify-between"
                          >
                            <span>Compliance Officer</span>
                            {currentUser.id === 'H150-COMP01' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          </button>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800">
                        <button
                          id="btn-logout"
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-2 cursor-pointer font-semibold"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Logout Session
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Logged Out CTAs */
              <div className="flex items-center gap-2">
                <button
                  id="btn-header-google-login"
                  onClick={() => loginWithGoogle()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Sign In with Google via Firebase"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.54 0 2.92.54 4.02 1.43l3.01-3.01C17.21 1.74 14.77 1 12 1 7.42 1 3.53 3.61 1.63 7.41l3.66 2.84C6.18 7.37 8.84 5 12 5z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.67 2.84c2.14-1.98 3.75-4.9 3.75-8.66z" />
                    <path fill="#FBBC05" d="M5.29 14.75c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.63 7.35C.6 9.4 0 11.63 0 14s.6 4.6 1.63 6.65l3.66-2.84z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.67-2.84c-1.07.72-2.45 1.15-4.26 1.15-3.16 0-5.82-2.37-6.71-5.25L1.63 15.99C3.53 19.79 7.42 23 12 23z" />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </button>
                <button
                  id="btn-header-login"
                  onClick={onOpenLogin}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-600 text-xs font-semibold transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  id="btn-header-join"
                  onClick={onOpenRegister}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  Join Now
                </button>
              </div>
            )}

            {/* Direct Admin Portal Trigger */}
            <button
              id="btn-header-admin-portal"
              onClick={() => window.dispatchEvent(new CustomEvent('open-admin-login'))}
              className="px-2.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Admin Login Portal (Direct Link: ?admin=login)"
            >
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden md:inline">Admin Login</span>
            </button>

            {/* Header Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
              title="Search Features & Help"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
              title={isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
            >
              {isDarkMode ? <Moon className="h-4 w-4 text-amber-400" /> : <Sun className="h-4 w-4 text-yellow-400" />}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Quick Search Dialog */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Search className="h-4 w-4 text-amber-400" />
                <span>Search HELP 150 Portal</span>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help, wallet, withdrawal, referral, KYC, prime pass..."
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { name: 'Help ₹150 Module', tab: 'help', color: 'text-amber-400' },
                { name: 'Main Wallet & Ledger', tab: 'wallet', color: 'text-emerald-400' },
                { name: 'Instant Withdrawal', tab: 'withdrawal', color: 'text-blue-400' },
                { name: 'Referral & 6-Level Team', tab: 'referral', color: 'text-purple-400' },
                { name: 'Bank & UPI Profile', tab: 'kyc', color: 'text-indigo-400' },
                { name: '24x7 Help Desk', tab: 'support', color: 'text-teal-400' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setSearchOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left text-slate-300 hover:text-white flex items-center justify-between"
                >
                  <span className={item.color}>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-2">
            {navItems
              .filter((item) => !item.authRequired || currentUser)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-900/60 text-slate-300 border border-slate-850'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
          </div>

          <div className="mt-3">
            <button
              id="mobile-firebase-status-btn"
              onClick={() => {
                setFirebaseModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Database className="h-4 w-4 text-amber-400" />
              <span>Firebase Database: Connected & Live</span>
            </button>
          </div>

          {(isAdmin || isCompliance) && (
            <div className="mt-2">
              <button
                id="mobile-nav-admin"
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4 text-red-400" />
                Open Admin Panel (22 Modules)
              </button>
            </div>
          )}

          {!currentUser && (
            <div className="mt-4 flex gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  onOpenLogin?.();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onOpenRegister?.();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Join Now
              </button>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-slate-800">
            <button
              id="mobile-btn-admin-portal"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-admin-login'));
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="h-4 w-4 text-amber-400" />
              <span>Admin Login Portal (सीधा एडमिन लिंक)</span>
            </button>
          </div>
        </div>
      )}

      {/* Firebase Database Connection & Diagnostics Modal */}
      <FirebaseConnectionModal
        isOpen={firebaseModalOpen}
        onClose={() => setFirebaseModalOpen(false)}
      />
    </header>
  );
};

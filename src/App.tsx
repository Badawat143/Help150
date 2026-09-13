/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ComplianceBanner } from './components/common/ComplianceBanner';
import { Header } from './components/common/Header';
import { HomePage } from './components/home/HomePage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { HelpModule } from './components/helping/HelpModule';
import { ReferralModule } from './components/referral/ReferralModule';
import { WalletModule } from './components/wallet/WalletModule';
import { WithdrawalModule } from './components/withdrawal/WithdrawalModule';
import { KycModule } from './components/kyc/KycModule';
import { SupportModule } from './components/support/SupportModule';
import { NotificationsModule } from './components/notifications/NotificationsModule';
import { AdminPanel } from './components/admin/AdminPanel';
import { BottomNav } from './components/common/BottomNav';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { referralTracker } from './services/referralTracker';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, loginAs } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [sponsorParam, setSponsorParam] = useState('');
  const [impersonatedAdminId, setImpersonatedAdminId] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('HELP150_ADMIN_IMPERSONATOR') : null;
  });

  // Check if admin is currently impersonating / viewing as a member
  useEffect(() => {
    const checkImpersonation = () => {
      const stored = sessionStorage.getItem('HELP150_ADMIN_IMPERSONATOR');
      setImpersonatedAdminId(stored);
    };
    checkImpersonation();
    const interval = setInterval(checkImpersonation, 800);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleReturnToAdmin = () => {
    const adminId = sessionStorage.getItem('HELP150_ADMIN_IMPERSONATOR') || 'H150-ADMIN01';
    sessionStorage.removeItem('HELP150_ADMIN_IMPERSONATOR');
    sessionStorage.removeItem('HELP150_ADMIN_IMPERSONATOR_NAME');
    setImpersonatedAdminId(null);
    loginAs(adminId);
    setActiveTab('admin');
  };

  // Detect direct admin login URL (?admin=login or #/admin/login)
  useEffect(() => {
    const checkAdminUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      const isAdminQuery =
        urlParams.get('admin') === 'login' ||
        urlParams.get('admin') === 'true' ||
        urlParams.get('portal') === 'admin' ||
        hash.includes('admin/login') ||
        hash.includes('#admin');

      if (isAdminQuery) {
        if (currentUser?.role === 'admin' || currentUser?.role === 'compliance_officer') {
          setActiveTab('admin');
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };

    checkAdminUrl();

    // Listen to custom event for opening admin login portal
    const handleOpenAdminPortal = () => setIsAdminLoginOpen(true);
    window.addEventListener('open-admin-login', handleOpenAdminPortal);
    return () => {
      window.removeEventListener('open-admin-login', handleOpenAdminPortal);
    };
  }, [currentUser, setActiveTab]);

  // Automatically track referral ID from URL, query parameters, hash, or saved session
  useEffect(() => {
    const trackedRef = referralTracker.extractReferralFromUrl();
    if (trackedRef) {
      setSponsorParam(trackedRef.toUpperCase());
      // If user arrives via referral link and is not logged in, auto-open register modal
      if (!currentUser) {
        setIsRegisterOpen(true);
      }
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Mandatory Statutory Compliance Banner */}
      <ComplianceBanner />

      {/* Admin Impersonation Notice Bar (जब एडमिन किसी यूजर की ID में लॉगिन हो) */}
      {impersonatedAdminId && currentUser && currentUser.role !== 'admin' && (
        <div
          id="admin-impersonation-banner"
          className="bg-gradient-to-r from-red-700 via-purple-900 to-indigo-900 text-white px-4 py-2.5 shadow-xl border-b border-amber-400/40 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </span>
            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider shadow-xs">
              👑 एडमिन सीधा लॉगिन मोड
            </span>
            <span className="font-medium text-slate-100">
              आप इस समय सदस्य <strong>{currentUser.fullName}</strong> (<span className="font-mono text-amber-300 font-bold">{currentUser.id}</span>) के अकाउंट में लाइव लॉगिन हैं।
            </span>
          </div>
          <button
            id="btn-return-to-admin-console"
            onClick={handleReturnToAdmin}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap ml-auto"
            title="वापस एडमिन पैनल में लौटें"
          >
            <span>↩️ वापस एडमिन पैनल में जाएं (Return to Admin)</span>
          </button>
        </div>
      )}

      {/* Main Responsive Header */}
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Dynamic View Router */}
      <main className="flex-1 w-full pb-20 sm:pb-0">
        {activeTab === 'home' && (
          <HomePage
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && <UserDashboard />}

        {activeTab === 'help' && <HelpModule />}

        {activeTab === 'wallet' && <WalletModule />}

        {activeTab === 'referral' && <ReferralModule />}

        {activeTab === 'withdrawal' && <WithdrawalModule />}

        {activeTab === 'kyc' && <KycModule />}

        {activeTab === 'support' && <SupportModule />}

        {activeTab === 'notifications' && <NotificationsModule />}

        {activeTab === 'admin' && <AdminPanel />}
      </main>

      {/* Mobile Floating Bottom Navigation Bar with Gold Center Rs Coin Button */}
      <BottomNav />

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
        initialSponsorId={sponsorParam}
      />

      {/* Dedicated Master Admin Login Portal (Separated from regular user flow) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}


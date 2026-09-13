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
  const { activeTab, setActiveTab, currentUser } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [sponsorParam, setSponsorParam] = useState('');

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


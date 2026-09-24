import React from 'react';
import { Home, Users, Wallet, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';

interface BottomNavProps {
  onOpenAdJunction?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenAdJunction }) => {
  const { activeTab, setActiveTab, currentUser } = useAuth();

  const hasActiveProvideLink = React.useMemo(() => {
    if (!currentUser?.id) return false;
    const cycle = db.getUserHelpCycle(currentUser.id);
    const step1 = cycle?.verificationLink;
    const step2 = cycle?.secondLink;
    const isStep1Done = (step1?.status as string) === 'completed' || (step1?.status as string) === 'accepted';
    const isStep2Done = (step2?.status as string) === 'completed' || (step2?.status as string) === 'accepted';
    const isStep1Active =
      !isStep1Done &&
      cycle?.status !== 'maturation_timer' &&
      cycle?.status !== 'receive_help' &&
      cycle?.status !== 'completed';
    const isStep2Active =
      isStep1Done &&
      !isStep2Done &&
      cycle?.status !== 'maturation_timer' &&
      cycle?.status !== 'receive_help' &&
      cycle?.status !== 'completed';
    const activeReq = (db.getState().helpRequests || []).find(
      (r) =>
        r.userId === currentUser.id &&
        r.type === 'give_help' &&
        ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'pending_match', 'matched'].includes(r.status)
    );
    return isStep1Active || isStep2Active || Boolean(activeReq);
  }, [currentUser?.id, activeTab]);

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#060b17]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 sm:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center relative">
        {/* 1. HOME */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 transition cursor-pointer relative ${
            activeTab === 'dashboard' || activeTab === 'home'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <Home className="h-5 w-5" />
            {hasActiveProvideLink && (
              <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-slate-950 animate-ping" />
            )}
            {hasActiveProvideLink && (
              <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-slate-950">
                !
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5 flex items-center gap-0.5">
            HOME
            {hasActiveProvideLink && <span className="text-[8px] text-amber-400 font-black">●लिंक</span>}
          </span>
        </button>

        {/* 2. TEAM */}
        <button
          onClick={() => setActiveTab('referral')}
          className={`flex flex-col items-center justify-center py-1 transition cursor-pointer ${
            activeTab === 'referral'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">TEAM</span>
        </button>

        {/* 3. CENTER FLOATING GOLDEN COIN BUTTON (AD JUNCTION / QUICK HELP) */}
        <div className="flex flex-col items-center -mt-6">
          <button
            onClick={() => {
              if (onOpenAdJunction) {
                onOpenAdJunction();
              } else {
                setActiveTab('help');
              }
            }}
            className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-lg shadow-[0_0_20px_rgba(245,158,11,0.6)] border-4 border-slate-950 active:scale-95 transition transform hover:scale-105 cursor-pointer"
            title="Ad Junction & Quick Rewards"
          >
            Rs
          </button>
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-tight mt-0.5 whitespace-nowrap">
            AD JUNCTION
          </span>
        </div>

        {/* 4. WALLET */}
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex flex-col items-center justify-center py-1 transition cursor-pointer ${
            activeTab === 'wallet'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">WALLET</span>
        </button>

        {/* 5. MY PROFILE */}
        <button
          onClick={() => setActiveTab('kyc')}
          className={`flex flex-col items-center justify-center py-1 transition cursor-pointer ${
            activeTab === 'kyc'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-tight mt-0.5">MY PROFILE</span>
        </button>
      </div>
    </div>
  );
};

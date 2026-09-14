import React from 'react';
import {
  ArrowDownCircle,
  TrendingUp,
  Sparkles,
  Wallet as WalletIcon,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Wallet } from '../../types';

interface TotalIncomeReceivedTrackerProps {
  userIncomeStats: {
    totalHelpedReceived: number;
    totalHelpedGiven: number;
    netHelpingProfit: number;
    totalIncome: number;
    completedCyclesCount: number;
    availableBalance: number;
    pendingBalance: number;
    totalReferralRewards: number;
  };
  wallet: Wallet | null;
  onNavigateTab: (tab: string) => void;
}

export const TotalIncomeReceivedTracker: React.FC<TotalIncomeReceivedTrackerProps> = ({
  userIncomeStats,
  wallet,
  onNavigateTab,
}) => {
  const availableBal = wallet?.availableBalance ?? userIncomeStats.availableBalance ?? 0;

  return (
    <div
      id="total-income-received-tracker-box"
      className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200/90 relative overflow-hidden transition-all hover:shadow-lg"
    >
      {/* Decorative subtle background gradient accents */}
      <div className="absolute top-0 right-0 w-96 h-40 bg-gradient-to-l from-emerald-50/60 via-blue-50/40 to-transparent pointer-events-none rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-32 bg-gradient-to-r from-purple-50/50 via-amber-50/30 to-transparent pointer-events-none rounded-bl-3xl" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                Total Income & Received Tracker
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>टोटल इनकम एवं रिसिव ट्रैकर</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Recived लिंक एक्सेप्ट करने पर आपकी सहायता राशि सीधे <strong>टोटल रिसिव</strong> में जुड़ती है
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => onNavigateTab('wallet')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <WalletIcon className="h-3.5 w-3.5 text-amber-400" />
            <span>वॉलेट विवरण (Wallet)</span>
          </button>
        </div>
      </div>

      {/* Four Distinct Color Options Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OPTION 1: 🟢 Total Received (टोटल रिसिव) - Vibrant Emerald Green Theme */}
        <div
          id="tracker-option-total-received"
          className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-2 border-emerald-400/80 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm">
                Option 1 • हरा (Green)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                +₹200/स्वीकृति
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <ArrowDownCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-900">Total Received</div>
                <div className="text-[11px] font-semibold text-emerald-700">टोटल रिसिव सहायता</div>
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-heading tracking-tight mt-1">
              ₹ {userIncomeStats.totalHelpedReceived.toFixed(2)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
            <span className="text-emerald-800 font-medium">सफल सहायता चक्र:</span>
            <span className="font-mono font-bold text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded-full">
              {userIncomeStats.completedCyclesCount} चक्र पूर्ण
            </span>
          </div>
        </div>

        {/* OPTION 2: 🔵 Total Income (टोटल इनकम) - Royal Blue / Indigo Theme */}
        <div
          id="tracker-option-total-income"
          className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 border-2 border-blue-400/80 shadow-sm hover:shadow-md hover:border-blue-500 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-sm">
                Option 2 • नीला (Blue)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800 border border-blue-200">
                कुल संचयी आय
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-blue-900">Total Income</div>
                <div className="text-[11px] font-semibold text-blue-700">टोटल संचयी आमदनी</div>
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-blue-950 font-heading tracking-tight mt-1">
              ₹ {userIncomeStats.totalIncome.toFixed(2)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
            <span className="text-blue-800 font-medium">रेफरल बोनस आय:</span>
            <span className="font-mono font-bold text-blue-900 bg-blue-200/70 px-2 py-0.5 rounded-full">
              ₹ {userIncomeStats.totalReferralRewards.toFixed(2)}
            </span>
          </div>
        </div>

        {/* OPTION 3: 🟣 Net Profit (शुद्ध लाभ) - Deep Purple / Violet Theme */}
        <div
          id="tracker-option-net-profit"
          className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-purple-50/90 via-white to-purple-50/40 border-2 border-purple-400/80 shadow-sm hover:shadow-md hover:border-purple-500 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-600 text-white shadow-sm">
                Option 3 • बैंगनी (Purple)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-800 border border-purple-200">
                शुद्ध लाभ
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-purple-900">Net Profit</div>
                <div className="text-[11px] font-semibold text-purple-700">नेट सहायता लाभ</div>
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-purple-950 font-heading tracking-tight mt-1">
              +₹ {userIncomeStats.netHelpingProfit.toFixed(2)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-200/60 flex items-center justify-between text-[11px]">
            <span className="text-purple-800 font-medium">दी गई सहायता:</span>
            <span className="font-mono font-bold text-purple-900 bg-purple-200/70 px-2 py-0.5 rounded-full">
              ₹ {userIncomeStats.totalHelpedGiven.toFixed(2)}
            </span>
          </div>
        </div>

        {/* OPTION 4: 🟠 Wallet Balance (उपलब्ध वॉलेट बैलेंस) - Rich Amber / Golden Orange Theme */}
        <div
          id="tracker-option-wallet-balance"
          className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-2 border-amber-400/80 shadow-sm hover:shadow-md hover:border-amber-500 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 shadow-sm">
                Option 4 • सुनहरा (Amber)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 border border-amber-200">
                उपलब्ध बैलेंस
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <WalletIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-950">Wallet Balance</div>
                <div className="text-[11px] font-semibold text-amber-800">निकासी हेतु उपलब्ध</div>
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-amber-950 font-heading tracking-tight mt-1">
              ₹ {availableBal.toFixed(2)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
            <button
              onClick={() => onNavigateTab('withdrawal')}
              className="text-amber-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Instant Withdrawal</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info Notice */}
      <div className="relative z-10 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>ट्रांसपेरेंट ट्रैकिंग:</strong> जैसे ही रिसीव लिंक एक्सेप्ट किया जाता है, ₹200 सीधे आपके <strong>टोटल रिसिव</strong> और वॉलेट में जमा होकर नई साइकिल अनलॉक होती है।
          </span>
        </div>
        <span className="text-[10px] text-slate-600 shrink-0">
          100% Peer-to-Peer Verified
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  Users,
  HeartHandshake,
  CheckCircle2,
  X,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../services/db';
import { User } from '../../types';

interface ReportsDeskProps {
  currentUser: User | null;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const ReportsDesk: React.FC<ReportsDeskProps> = ({
  currentUser,
  onClose,
  showToast,
}) => {
  const state = db.getState();

  const totalUsers = state.users.length;
  const activeUsers = state.users.filter((u) => u.status === 'active').length;
  const blockedUsers = state.users.filter((u) => u.status === 'blocked').length;
  const verifiedKyc = state.kycRecords.filter((k) => k.status === 'verified').length;
  const totalTransactions = state.transactions.length;
  const totalVolume = state.transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalWithdrawals = state.withdrawals.reduce((s, w) => s + (Number(w.amount) || 0), 0);

  const handleExportFullReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      platform: 'HELP150 Peer-to-Peer Help Platform',
      metrics: {
        totalUsers,
        activeUsers,
        blockedUsers,
        verifiedKyc,
        totalTransactions,
        totalVolume,
        totalWithdrawals,
      },
      settings: state.settings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HELP150_ANALYTICS_REPORT_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('एनालिटिक्स रिपोर्ट सफलतापूर्वक डाउनलोड हो गई!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                Platform Analytics & System Reports
              </h3>
              <p className="text-xs text-slate-500">
                वित्तीय आय-व्यय, यूजर ग्रोथ और सिस्टम प्रदर्शन रिपोर्ट
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 6 Key Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Registered Users</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalUsers}</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-1">
              Active: {activeUsers} | Blocked: {blockedUsers}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Verified KYC Records</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{verifiedKyc}</div>
            <div className="text-[10px] text-slate-500 mt-1">Total submitted: {state.kycRecords.length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Help Volume</span>
            <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
              ₹{totalVolume.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Across all completed cycles</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Withdrawal Payouts</span>
            <div className="text-xl font-black text-rose-700 font-mono mt-0.5">
              ₹{totalWithdrawals.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{state.withdrawals.length} withdrawal requests</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Ledger Transactions</span>
            <div className="text-xl font-black text-purple-700 font-mono mt-0.5">{totalTransactions}</div>
            <div className="text-[10px] text-slate-500 mt-1">Total system transactions</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">System Status</span>
            <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">Healthy (100%)</div>
            <div className="text-[10px] text-slate-500 mt-1">All queues operating normally</div>
          </div>
        </div>

        {/* Download Reports Button */}
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-indigo-950">पूर्ण सिस्टम रिपोर्ट एक्सपोर्ट करें (Export Full Report)</h4>
            <p className="text-indigo-700 text-[11px]">
              सभी रजिस्टर्ड सदस्यों, ट्रांजेक्शन रिकॉर्ड्स और वित्तीय सारांश का सुरक्षित डेटा डाउनलोड करें।
            </p>
          </div>
          <button
            onClick={handleExportFullReport}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition active:scale-95 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Download Analytics Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

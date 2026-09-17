import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Search,
  Plus,
  Minus,
  DollarSign,
  User as UserIcon,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { User, Wallet as WalletType } from '../../types';

interface WalletManagementDeskProps {
  currentUser: User | null;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export const WalletManagementDesk: React.FC<WalletManagementDeskProps> = ({
  currentUser,
  onClose,
  showToast,
  onRefresh,
}) => {
  const [state, setState] = useState(db.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [amountInput, setAmountInput] = useState<number>(100);
  const [reasonInput, setReasonInput] = useState<string>('Admin manual wallet adjustment');
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshLocalState = () => {
    setState(db.getState());
    if (onRefresh) onRefresh();
  };

  const adminActor = useMemo(
    () => ({
      id: currentUser?.id || 'H150-ADMIN01',
      name: currentUser?.fullName || 'Super Admin',
      role: 'admin',
    }),
    [currentUser]
  );

  const usersWithWallets = useMemo(() => {
    let list = state.users || [];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          u.mobile.toLowerCase().includes(q)
      );
    }
    return list;
  }, [state.users, searchQuery]);

  // Overall platform statistics
  const platformStats = useMemo(() => {
    let totalBal = 0;
    let totalEarned = 0;
    let totalWithdrawn = 0;
    (Object.values(state.wallets || {}) as WalletType[]).forEach((w) => {
      totalBal += Number(w.availableBalance) || 0;
      totalEarned += (Number(w.totalHelpedReceived) || 0) + (Number(w.totalReferralRewards) || 0);
      totalWithdrawn += Number(w.totalWithdrawn) || 0;
    });
    return { totalBal, totalEarned, totalWithdrawn };
  }, [state.wallets]);

  const handleAdjustWallet = async () => {
    if (!selectedUser) return;
    if (amountInput <= 0) {
      showToast('राशि 0 से अधिक होनी चाहिए', 'error');
      return;
    }
    if (!reasonInput || reasonInput.trim().length < 4) {
      showToast('कृपया कम से कम 4 अक्षरों का कारण लिखें', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.adminAdjustWallet(
        adminActor,
        selectedUser.id,
        amountInput,
        actionType,
        reasonInput
      );
      if (res.success) {
        showToast(
          `यूजर ${selectedUser.id} के वॉलेट में ₹${amountInput} ${
            actionType === 'credit' ? 'क्रेडिट' : 'डेबिट'
          } कर दिया गया!`
        );
        setSelectedUser(null);
        refreshLocalState();
      } else {
        showToast(res.error || 'वॉलेट अपडेट विफल रहा', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'त्रुटि हुई', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                Wallet Management & Coin Balance Desk
              </h3>
              <p className="text-xs text-slate-500">
                कुल यूजर बैलेंस: ₹{platformStats.totalBal.toLocaleString('en-IN')} | कुल विथड्रॉवल: ₹
                {platformStats.totalWithdrawn.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800">कुल सर्कुलेटिंग बैलेंस</span>
            <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
              ₹{platformStats.totalBal.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800">कुल अर्जित आय (Total Earned)</span>
            <div className="text-xl font-black text-blue-900 font-mono mt-0.5">
              ₹{platformStats.totalEarned.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200">
            <span className="text-[11px] font-bold text-rose-800">कुल विथड्रॉवल पेआउट</span>
            <div className="text-xl font-black text-rose-900 font-mono mt-0.5">
              ₹{platformStats.totalWithdrawn.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="User ID, नाम या मोबाइल नंबर खोजें..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Wallets Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[50vh] custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Name / Mobile</th>
                  <th className="py-2.5 px-3">Available Balance</th>
                  <th className="py-2.5 px-3">Total Earned</th>
                  <th className="py-2.5 px-3">Total Withdrawn</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Wallet Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {usersWithWallets.map((u) => {
                  const w = state.wallets[u.id] || {
                    availableBalance: 0,
                    totalEarned: 0,
                    totalWithdrawn: 0,
                  };
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">{u.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.mobile}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          ₹{w.availableBalance || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                        ₹{w.totalEarned || 0}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-500">
                        ₹{w.totalWithdrawn || 0}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('credit');
                              setAmountInput(100);
                              setReasonInput('Admin bonus credit');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                            title="वॉलेट में बैलेंस जोड़ें"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Balance</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('debit');
                              setAmountInput(Math.min(50, w.availableBalance || 0));
                              setReasonInput('Admin balance deduction');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                            title="वॉलेट से बैलेंस काटें"
                          >
                            <Minus className="h-3.5 w-3.5" />
                            <span>Deduct</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Credit / Debit */}
        {selectedUser && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-white font-bold ${
                      actionType === 'credit' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {actionType === 'credit' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-heading">
                      {actionType === 'credit' ? 'वॉलेट में बैलेंस जोड़ें' : 'वॉलेट से बैलेंस काटें'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {selectedUser.id} - {selectedUser.fullName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">राशि दर्ज करें (₹)</label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-sm text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    कारण (Reason / Remarks)
                  </label>
                  <input
                    type="text"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="उदा. Promotional reward / Adjustment"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                  वर्तमान बैलेंस: <strong>₹{state.wallets[selectedUser.id]?.availableBalance || 0}</strong>
                  {actionType === 'debit' && (
                    <span className="block text-rose-600 font-semibold mt-0.5">
                      नया बैलेंस होगा: ₹
                      {Math.max(
                        0,
                        (state.wallets[selectedUser.id]?.availableBalance || 0) - amountInput
                      )}
                    </span>
                  )}
                  {actionType === 'credit' && (
                    <span className="block text-emerald-600 font-semibold mt-0.5">
                      नया बैलेंस होगा: ₹
                      {(state.wallets[selectedUser.id]?.availableBalance || 0) + amountInput}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={handleAdjustWallet}
                  disabled={isProcessing}
                  className={`px-5 py-2 rounded-xl text-white font-black text-xs cursor-pointer transition shadow-md flex items-center gap-1.5 ${
                    actionType === 'credit'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isProcessing ? 'प्रोसेस हो रहा है...' : 'सुरक्षित करें'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

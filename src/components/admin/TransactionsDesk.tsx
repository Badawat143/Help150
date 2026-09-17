import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Download,
  Calendar,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { Transaction, User } from '../../types';

interface TransactionsDeskProps {
  currentUser: User | null;
  onClose: () => void;
  initialOpenClearModal?: boolean;
  onRefresh?: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const TransactionsDesk: React.FC<TransactionsDeskProps> = ({
  currentUser,
  onClose,
  initialOpenClearModal = false,
  onRefresh,
  showToast,
}) => {
  const [state, setState] = useState(db.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showClearModal, setShowClearModal] = useState(initialOpenClearModal);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
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

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let list = state.transactions || [];
    if (typeFilter !== 'all') {
      list = list.filter((t) => t.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.userId.toLowerCase().includes(q) ||
          (t.referenceId && t.referenceId.toLowerCase().includes(q)) ||
          (t.remarks && t.remarks.toLowerCase().includes(q))
      );
    }
    return list;
  }, [state.transactions, typeFilter, searchQuery]);

  // Statistics
  const totalCount = (state.transactions || []).length;
  const totalVolume = useMemo(() => {
    return (state.transactions || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [state.transactions]);

  // Handle single transaction delete
  const handleDeleteSingle = async (t: Transaction) => {
    setIsProcessing(true);
    try {
      const res = await api.adminDeleteTransaction(adminActor, t.id);
      if (res.success) {
        showToast(`ट्रांजेक्शन #${t.id} सफलतापूर्वक हटा दिया गया!`);
        setTransactionToDelete(null);
        refreshLocalState();
      } else {
        showToast(res.error || 'ट्रांजेक्शन हटाने में विफल', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'त्रुटि हुई', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle clear all transaction history
  const handleClearAllHistory = async () => {
    setIsProcessing(true);
    try {
      const res = await api.adminClearTransactions(adminActor);
      if (res.success) {
        showToast(res.message || 'सभी ट्रांजेक्शन रिकॉर्ड्स सफलतापूर्वक साफ़ कर दिए गए!');
        setShowClearModal(false);
        refreshLocalState();
      } else {
        showToast(res.error || 'हिस्ट्री साफ़ करने में विफल', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'त्रुटि हुई', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const list = state.transactions || [];
    if (list.length === 0) {
      showToast('डाउनलोड के लिए कोई ट्रांजेक्शन नहीं है', 'error');
      return;
    }
    const headers = ['ID', 'User ID', 'Type', 'Amount (₹)', 'Status', 'Reference ID', 'Date & Time', 'Remarks'];
    const rows = list.map((t) => [
      t.id,
      t.userId,
      t.type,
      t.amount,
      t.status,
      t.referenceId || '-',
      new Date(t.createdAt).toLocaleString('en-IN'),
      `"${(t.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HELP150_TRANSACTIONS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('ट्रांजेक्शन CSV फ़ाइल डाउनलोड हो गई!');
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'help_given':
        return { label: 'Help Given (₹)', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'help_received':
        return { label: 'Help Received (₹)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'referral_bonus':
        return { label: 'Referral Bonus', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'withdrawal':
        return { label: 'Withdrawal', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'admin_credit':
        return { label: 'Admin Credit', bg: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'admin_debit':
        return { label: 'Admin Debit', bg: 'bg-orange-100 text-orange-800 border-orange-200' };
      default:
        return { label: type, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                Transactions & Ledger Management (लेन-देन इतिहास)
              </h3>
              <p className="text-xs text-slate-500">
                कुल {totalCount} ट्रांजेक्शन रिकॉर्ड्स | कुल वॉल्यूम: ₹{totalVolume.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="CSV डाउनलोड करें"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setShowClearModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="सभी ट्रांजेक्शन हिस्ट्री हटाएं"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ट्रांजेक्शन हिस्ट्री रिमूव करें</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="User ID, Trans ID या UTR खोजें..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'सभी (All)' },
              { id: 'help_given', label: 'Help Given' },
              { id: 'help_received', label: 'Help Received' },
              { id: 'referral_bonus', label: 'Referral' },
              { id: 'withdrawal', label: 'Withdrawal' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  typeFilter === f.id
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[50vh] custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Trans ID</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Balance After</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reference / Remarks</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Repeat className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-sm">कोई ट्रांजेक्शन रिकॉर्ड नहीं मिला</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {totalCount === 0
                          ? 'सभी ट्रांजेक्शन इतिहास साफ़ है।'
                          : 'सर्च या फ़िल्टर बदलकर पुनः प्रयास करें।'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const badge = getTypeBadge(t.type);
                    const isCredit =
                      t.type === 'help_received' ||
                      t.type === 'referral_bonus' ||
                      t.type === 'admin_credit';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600 text-[11px]">
                          {t.id}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {t.userId}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-xs">
                          <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                            {isCredit ? '+' : '-'}₹{t.amount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          ₹{t.balanceAfter ?? '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[150px] truncate">
                          {t.referenceId || t.remarks || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setTransactionToDelete(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title={`ट्रांजेक्शन #${t.id} हटाएं`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clear All Transactions Confirmation Dialog */}
        {showClearModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-200 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  ट्रांजेक्शन हिस्ट्री साफ़ करें?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  क्या आप वाकई सिस्टम के सभी{' '}
                  <strong className="text-red-600">{totalCount}</strong> ट्रांजेक्शन रिकॉर्ड्स को
                  हटाना/रिमूव करना चाहते हैं?
                </p>
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs text-left">
                  ⚠️ <strong>सूचना:</strong> इससे केवल लेन-देन इतिहास मिटेगा। यूजर के वॉलेट और हेल्प
                  साइकिल अप्रभावित रहेंगे।
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  disabled={isProcessing}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  disabled={isProcessing}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-md shadow-red-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isProcessing ? 'हटा रहा है...' : 'हाँ, साफ़ करें'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Single Transaction Confirmation Dialog */}
        {transactionToDelete && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                  <Trash2 className="h-4 w-4" />
                  <span>ट्रांजेक्शन हटाएं (Delete Record)</span>
                </div>
                <button
                  onClick={() => setTransactionToDelete(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>
                  ID: <span className="font-mono font-bold text-blue-600">{transactionToDelete.id}</span>
                </div>
                <div>
                  User ID:{' '}
                  <span className="font-mono font-bold text-slate-800">
                    {transactionToDelete.userId}
                  </span>
                </div>
                <div>
                  Amount: <strong className="text-slate-900">₹{transactionToDelete.amount}</strong> (
                  {transactionToDelete.type})
                </div>
                <div>
                  Date: {new Date(transactionToDelete.createdAt).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setTransactionToDelete(null)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => handleDeleteSingle(transactionToDelete)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-sm shadow-red-600/30 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isProcessing ? 'हटा रहा है...' : 'हटाएं'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

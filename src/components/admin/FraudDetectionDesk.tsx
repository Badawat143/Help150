import React, { useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  CheckCircle2,
  X,
  User as UserIcon,
  Phone,
  CreditCard,
  Clock,
} from 'lucide-react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { User } from '../../types';

interface FraudDetectionDeskProps {
  currentUser: User | null;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export const FraudDetectionDesk: React.FC<FraudDetectionDeskProps> = ({
  currentUser,
  onClose,
  showToast,
  onRefresh,
}) => {
  const state = db.getState();

  const adminActor = useMemo(
    () => ({
      id: currentUser?.id || 'H150-ADMIN01',
      name: currentUser?.fullName || 'Super Admin',
      role: 'admin',
    }),
    [currentUser]
  );

  // 1. Find Duplicate Mobile Numbers
  const duplicateMobiles = useMemo(() => {
    const map: Record<string, User[]> = {};
    state.users.forEach((u) => {
      const mob = (u.mobile || '').trim();
      if (mob) {
        if (!map[mob]) map[mob] = [];
        map[mob].push(u);
      }
    });
    return Object.entries(map).filter(([_, list]) => list.length > 1);
  }, [state.users]);

  // 2. Find Duplicate Bank Accounts in KYC
  const duplicateBanks = useMemo(() => {
    const map: Record<string, typeof state.kycRecords> = {};
    (state.kycRecords || []).forEach((k) => {
      const acc = (k.accountNumber || '').trim();
      if (acc) {
        if (!map[acc]) map[acc] = [];
        map[acc].push(k);
      }
    });
    return Object.entries(map).filter(([_, list]) => list.length > 1);
  }, [state.kycRecords]);

  // 3. Block user
  const handleBlockUser = async (userId: string, userName: string) => {
    try {
      const res = await api.updateUserStatus(
        adminActor,
        userId,
        'blocked',
        'Auto-flagged by Fraud Detection Engine for multiple accounts violation'
      );
      if (res.success) {
        showToast(`संदिग्ध यूजर ${userId} (${userName}) को ब्लॉक कर दिया गया!`);
        if (onRefresh) onRefresh();
      } else {
        showToast(res.error || 'ब्लॉक करने में विफल', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'त्रुटि हुई', 'error');
    }
  };

  const totalFlaggedCount = duplicateMobiles.length + duplicateBanks.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                Fraud Detection & Risk Management Desk
              </h3>
              <p className="text-xs text-slate-500">
                एक ही मोबाइल/बैंक खाते से मल्टीपल आईडी और संदिग्ध गतिविधियों की लाइव जांच
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Overview Alert */}
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
            totalFlaggedCount > 0
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {totalFlaggedCount > 0 ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          <div>
            <strong>सिस्टम सुरक्षा स्थिति:</strong>{' '}
            {totalFlaggedCount > 0
              ? `कुल ${totalFlaggedCount} संदिग्ध डुप्लीकेट पैटर्न पाए गए। कृपया नीचे जांचें और आवश्यकता पड़ने पर ब्लॉक करें।`
              : 'कोई संदिग्ध डुप्लीकेट अकाउंट या सुरक्षा उल्लंघन नहीं मिला। सभी खाते सुरक्षित हैं।'}
          </div>
        </div>

        {/* Section 1: Duplicate Mobiles */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-blue-600" />
            <span>एक ही मोबाइल नंबर से पंजीकृत एकाधिक आईडी ({duplicateMobiles.length})</span>
          </h4>

          {duplicateMobiles.length === 0 ? (
            <p className="text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
              कोई डुप्लीकेट मोबाइल नंबर नहीं मिला।
            </p>
          ) : (
            duplicateMobiles.map(([mob, users]) => (
              <div key={mob} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-mono font-bold text-slate-900">
                  मोबाइल: <span className="text-blue-600">{mob}</span> ({users.length} आईडी जुड़ी हैं)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{u.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status}
                        </span>
                        {u.status === 'active' && u.id !== 'H150-ADMIN01' && (
                          <button
                            onClick={() => handleBlockUser(u.id, u.fullName)}
                            className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Section 2: Duplicate Bank Accounts */}
        <div className="space-y-2 text-xs pt-2">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-purple-600" />
            <span>समान बैंक खाता संख्या का उपयोग ({duplicateBanks.length})</span>
          </h4>

          {duplicateBanks.length === 0 ? (
            <p className="text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
              कोई डुप्लीकेट बैंक खाता नहीं मिला।
            </p>
          ) : (
            duplicateBanks.map(([acc, kycList]) => (
              <div key={acc} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-mono font-bold text-slate-900">
                  खाता सं.: <span className="text-purple-600">{acc}</span> ({kycList.length} खाते)
                </div>
                <div className="text-[11px] text-slate-600">
                  संबद्ध यूजर्स: {kycList.map((k) => k.userId).join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

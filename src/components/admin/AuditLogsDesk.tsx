import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Trash2,
  Clock,
  User as UserIcon,
  Shield,
  X,
} from 'lucide-react';
import { db } from '../../services/db';
import { AuditLog, User } from '../../types';

interface AuditLogsDeskProps {
  currentUser: User | null;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export const AuditLogsDesk: React.FC<AuditLogsDeskProps> = ({
  currentUser,
  onClose,
  showToast,
  onRefresh,
}) => {
  const [state, setState] = useState(db.getState());
  const [searchQuery, setSearchQuery] = useState('');

  const refreshLocalState = () => {
    setState(db.getState());
    if (onRefresh) onRefresh();
  };

  const logs = state.auditLogs || [];

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.adminId.toLowerCase().includes(q) ||
        (l.targetId && l.targetId.toLowerCase().includes(q))
    );
  }, [logs, searchQuery]);

  const handleClearLogs = () => {
    db.updateState((draft) => {
      draft.auditLogs = [];
    });
    showToast('ऑडिट लॉग्स साफ़ कर दिए गए!');
    refreshLocalState();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                Admin Audit & Action Logs
              </h3>
              <p className="text-xs text-slate-500">
                एडमिन द्वारा किए गए सभी कार्यों (आईडी डिलीट, ट्रांसफर, सेटिंग्स) का रिकॉर्ड
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Logs</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="एक्शन, एडमिन ID या विवरण खोजें..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-500"
          />
        </div>

        {/* Logs Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      कोई ऑडिट लॉग रिकॉर्ड नहीं मिला
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                        {l.adminName || l.adminId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold border border-slate-200">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {l.targetId || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-md">
                        {l.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

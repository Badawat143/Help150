/**
 * HELP150 — Notifications & System Alerts Center
 */

import React from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const NotificationsModule: React.FC = () => {
  const { currentUser, notifications, refreshUserData } = useAuth();

  if (!currentUser) return null;

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationAsRead(id);
    refreshUserData();
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter((notif) => !notif.isRead)) {
      await api.markNotificationAsRead(n.id);
    }
    refreshUserData();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">
              Notifications & Alerts
            </h1>
            <p className="text-xs text-slate-400">
              System alerts, timer reminders, and financial ledger notifications
            </p>
          </div>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-xs text-slate-500">
            No notifications in your inbox.
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = n.isRead;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  isRead
                    ? 'bg-slate-900/50 border-slate-850 opacity-75'
                    : 'bg-slate-900 border-amber-500/30 shadow-lg ring-1 ring-amber-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      n.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : n.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : n.type === 'alert'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {n.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                    {n.type === 'warning' && <Clock className="h-4 w-4" />}
                    {n.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                    {n.type === 'info' && <Info className="h-4 w-4" />}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">{n.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                    title="Mark as Read"
                  >
                    <Check className="h-4 w-4 text-emerald-400" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

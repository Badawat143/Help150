import React, { useState } from 'react';
import {
  Bell,
  Send,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  Clock,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { db } from '../../services/db';
import { User, NotificationItem } from '../../types';

interface NotificationsDeskProps {
  currentUser: User | null;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export const NotificationsDesk: React.FC<NotificationsDeskProps> = ({
  currentUser,
  onClose,
  showToast,
  onRefresh,
}) => {
  const [state, setState] = useState(db.getState());
  const [targetType, setTargetType] = useState<'all' | 'single'>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'system' | 'help' | 'wallet' | 'kyc'>('system');
  const [isSending, setIsSending] = useState(false);

  const refreshLocalState = () => {
    setState(db.getState());
    if (onRefresh) onRefresh();
  };

  const handleSendNotification = () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('कृपया शीर्षक और संदेश दर्ज करें', 'error');
      return;
    }
    if (targetType === 'single' && !targetUserId.trim()) {
      showToast('कृपया यूजर ID दर्ज करें', 'error');
      return;
    }

    setIsSending(true);
    try {
      const newNotifs: NotificationItem[] = [];
      const now = new Date().toISOString();

      if (targetType === 'all') {
        (state.users || []).forEach((u) => {
          newNotifs.push({
            id: `NOTIF-${Date.now()}-${u.id.slice(-4)}`,
            userId: u.id,
            title: notifTitle.trim(),
            message: notifMessage.trim(),
            type: notifType,
            isRead: false,
            createdAt: now,
          });
        });
      } else {
        newNotifs.push({
          id: `NOTIF-${Date.now()}`,
          userId: targetUserId.trim().toUpperCase(),
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
          isRead: false,
          createdAt: now,
        });
      }

      db.updateState((draft) => {
        if (!draft.notifications) draft.notifications = [];
        draft.notifications = [...newNotifs, ...draft.notifications];
      });

      showToast(
        targetType === 'all'
          ? `सभी ${state.users.length} सदस्यों को नोटिफिकेशन भेजा गया!`
          : `यूजर ${targetUserId} को नोटिफिकेशन भेजा गया!`
      );
      setNotifTitle('');
      setNotifMessage('');
      refreshLocalState();
    } catch (err: any) {
      showToast(err?.message || 'नोटिफिकेशन भेजने में त्रुटि', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotif = (notifId: string) => {
    db.updateState((draft) => {
      if (draft.notifications) {
        draft.notifications = draft.notifications.filter((n) => n.id !== notifId);
      }
    });
    showToast('नोटिफिकेशन हटाया गया');
    refreshLocalState();
  };

  const handleClearAllNotifs = () => {
    db.updateState((draft) => {
      draft.notifications = [];
    });
    showToast('सभी नोटिफिकेशन साफ़ कर दिए गए');
    refreshLocalState();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                System Broadcast & Notifications Desk
              </h3>
              <p className="text-xs text-slate-500">
                प्लेटफ़ॉर्म सदस्यों को तुरंत संदेश, सिस्टम अलर्ट और सूचनाएं भेजें
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Compose Notification Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-600" />
            <span>नया नोटिफिकेशन भेजें (Send Broadcast)</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                checked={targetType === 'all'}
                onChange={() => setTargetType('all')}
                className="text-blue-600"
              />
              <span>सभी सदस्यों को (All Members - {state.users.length})</span>
            </label>
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                checked={targetType === 'single'}
                onChange={() => setTargetType('single')}
                className="text-blue-600"
              />
              <span>विशिष्ट यूजर (Specific User ID)</span>
            </label>
          </div>

          {targetType === 'single' && (
            <div>
              <label className="block text-slate-600 font-bold mb-1">यूजर ID दर्ज करें:</label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="उदा. H150-1002"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs bg-white outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-bold mb-1">शीर्षक (Title)</label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="उदा. सिस्टम रखरखाव सूचना / दिवाली ऑफर"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">प्रकार (Type)</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
              >
                <option value="system">सिस्टम अलर्ट (System)</option>
                <option value="help">हेल्प संबंधित (Help)</option>
                <option value="wallet">वॉलेट व पेआउट (Wallet)</option>
                <option value="kyc">KYC सूचना (KYC)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">संदेश (Message Text)</label>
            <textarea
              rows={2}
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="यहाँ पूरा संदेश लिखें जो यूजर के डैशबोर्ड पर दिखाई देगा..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSendNotification}
              disabled={isSending}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSending ? 'भेज रहा है...' : 'अभी नोटिफिकेशन भेजें'}</span>
            </button>
          </div>
        </div>

        {/* Existing Notifications Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h4 className="font-bold text-xs text-slate-800">
              हाल ही में भेजे गए नोटिफिकेशन ({(state.notifications || []).length})
            </h4>
            {(state.notifications || []).length > 0 && (
              <button
                onClick={handleClearAllNotifs}
                className="text-[11px] text-red-600 hover:underline font-bold cursor-pointer"
              >
                सभी साफ़ करें (Clear All)
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {(state.notifications || []).length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">कोई सक्रिय नोटिफिकेशन नहीं है।</p>
            ) : (
              (state.notifications || []).map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      <span className="font-mono text-blue-600 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded">
                        To: {n.userId}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                    <div className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteNotif(n.id)}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    title="हटाएं"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

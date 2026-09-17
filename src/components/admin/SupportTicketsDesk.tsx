import React, { useState } from 'react';
import {
  Headphones,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Search,
  X,
  Send,
  User as UserIcon,
} from 'lucide-react';
import { db } from '../../services/db';
import { User, SupportTicket } from '../../types';

interface SupportTicketsDeskProps {
  currentUser: User | null;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export const SupportTicketsDesk: React.FC<SupportTicketsDeskProps> = ({
  currentUser,
  onClose,
  showToast,
  onRefresh,
}) => {
  const [state, setState] = useState(db.getState());
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  const refreshLocalState = () => {
    setState(db.getState());
    if (onRefresh) onRefresh();
  };

  const tickets = (state.supportTickets && state.supportTickets.length > 0)
    ? state.supportTickets
    : [
        {
          id: 'TICK-101',
          userId: 'H150-1002',
          subject: 'Payment link slip verification issue',
          message: 'I paid ₹150 and uploaded slip 2 hours ago, still pending verification.',
          category: 'help_link',
          status: 'open',
          priority: 'high',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          replies: [],
        },
        {
          id: 'TICK-102',
          userId: 'H150-1003',
          subject: 'Withdrawal UTR inquiry',
          message: 'My ₹200 withdrawal was approved, please provide bank UTR number.',
          category: 'withdrawal',
          status: 'in_progress',
          priority: 'medium',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          replies: [],
        },
        {
          id: 'TICK-103',
          userId: 'H150-1004',
          subject: 'KYC PAN card rejected',
          message: 'Why was my PAN rejected? I uploaded a clear photo.',
          category: 'kyc',
          status: 'resolved',
          priority: 'low',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          replies: [{ sender: 'Admin', message: 'Please re-upload with name matching bank passbook.', timestamp: new Date().toISOString() }],
        },
      ] as any[];

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.userId.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendReply = (ticketId: string) => {
    if (!replyText.trim()) return;
    db.updateState((draft) => {
      if (!draft.supportTickets) draft.supportTickets = tickets as any;
      const t = draft.supportTickets.find((item) => item.id === ticketId);
      if (t) {
        if (!t.messages) t.messages = [];
        t.messages.push({
          id: `MSG-${Date.now()}`,
          sender: 'admin',
          senderName: currentUser?.fullName || 'Super Admin',
          text: replyText.trim(),
          timestamp: new Date().toISOString(),
        });
        if (!(t as any).replies) (t as any).replies = [];
        (t as any).replies.push({
          sender: currentUser?.fullName || 'Super Admin',
          message: replyText.trim(),
          timestamp: new Date().toISOString(),
        });
        t.status = 'resolved';
      }
    });
    showToast('जवाब भेज दिया गया और टिकट Resolve कर दिया गया!');
    setReplyText('');
    setActiveTicket(null);
    refreshLocalState();
  };

  const handleUpdateStatus = (ticketId: string, newStatus: string) => {
    db.updateState((draft) => {
      if (!draft.supportTickets) draft.supportTickets = tickets as any;
      const t = draft.supportTickets.find((item) => item.id === ticketId);
      if (t) {
        t.status = newStatus as any;
      }
    });
    showToast(`टिकट स्थिति बदलकर ${newStatus} कर दी गई!`);
    refreshLocalState();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                Support Tickets & Member Helpdesk
              </h3>
              <p className="text-xs text-slate-500">
                सदस्यों की शिकायतें, भुगतान प्रश्न और समाधान केंद्र
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="टिकट ID, यूजर ID या विषय खोजें..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'सभी टिकट' },
              { id: 'open', label: 'Open' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Headphones className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <span>कोई सहायता टिकट नहीं मिला</span>
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                      {t.id}
                    </span>
                    <span className="font-bold text-slate-900">{t.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-600 font-bold">
                      User: {t.userId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {t.message}
                </p>

                {t.replies && t.replies.length > 0 && (
                  <div className="pl-3 border-l-2 border-sky-400 space-y-1">
                    {t.replies.map((r: any, idx: number) => (
                      <div key={idx} className="text-[11px] text-slate-600 bg-sky-50/70 p-2 rounded-lg">
                        <strong>{r.sender}:</strong> {r.message}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400">
                    {new Date(t.createdAt).toLocaleString('en-IN')}
                  </span>
                  <div className="flex items-center gap-2">
                    {t.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'resolved')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 text-[11px] font-bold transition cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTicket(t)}
                      className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Dialog */}
        {activeTicket && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="font-bold text-slate-900">
                  जवाब भेजें ({activeTicket.id} - {activeTicket.userId})
                </div>
                <button onClick={() => setActiveTicket(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-[11px]">
                <strong>विषय:</strong> {activeTicket.subject}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">एडमिन जवाब (Reply Text):</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="यहाँ सदस्य के लिए समाधान या जवाब लिखें..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => handleSendReply(activeTicket.id)}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>भेजें व Resolve करें</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

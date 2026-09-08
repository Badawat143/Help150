/**
 * HELP150 — Support Desk & Ticket Resolution Module
 * 24/7 ticket creation, message threads, live FAQ, and official contact channels.
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  Headphones,
  CheckCircle2,
  Clock,
  ExternalLink,
  Smartphone,
  Mail,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { db } from '../../services/db';

export const SupportModule: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const state = db.getState();
  const settings = state.settings;

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'kyc' | 'help_request' | 'withdrawal' | 'referral' | 'security' | 'other'>('help_request');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [message, setMessage] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  if (!currentUser) return null;

  const userTickets = state.supportTickets.filter((t) => t.userId === currentUser.id);
  const selectedTicket = userTickets.find((t) => t.id === selectedTicketId) || userTickets[0];

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const res = await api.createSupportTicket({
        userId: currentUser.id,
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
      });

      if (res.success && res.data) {
        setSubject('');
        setMessage('');
        setShowNewModal(false);
        setSelectedTicketId(res.data.id);
        refreshUserData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    await api.replySupportTicket({
      ticketId: selectedTicket.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      sender: 'user',
      text: replyMessage.trim(),
    });

    setReplyMessage('');
    refreshUserData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-teal-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
                Community Support & Helpdesk
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                24/7 Member Ticket System • Real-Time Telegram & WhatsApp Channels
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/25 transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Open New Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Official Help Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {settings.contactTelegram && (
          <a
            href={settings.contactTelegram}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-slate-900/80 border border-blue-500/30 hover:border-blue-500/60 flex items-center justify-between group transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Official Telegram</div>
                <div className="text-[10px] text-slate-400">Join Community Channel</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
          </a>
        )}

        {settings.contactWhatsapp && (
          <a
            href={settings.contactWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 flex items-center justify-between group transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">WhatsApp Helpline</div>
                <div className="text-[10px] text-slate-400">{settings.contactWhatsapp}</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition" />
          </a>
        )}

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Official Email</div>
              <div className="text-[10px] text-slate-400">{settings.contactEmail}</div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            24h SLA
          </span>
        </div>
      </div>

      {/* Ticket Manager Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Support Tickets ({userTickets.length})
          </h3>

          <div className="space-y-2">
            {userTickets.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-500">
                No support tickets found. Click "Open New Support Ticket" if you need assistance.
              </div>
            ) : (
              userTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-950/30 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-amber-400 font-bold">{t.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'resolved'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs truncate">{t.subject}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span className="capitalize">{t.category}</span>
                      <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Ticket Conversation Thread */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col h-[500px]">
              {/* Thread Header */}
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-bold">{selectedTicket.id}</span>
                    <span className="text-xs text-slate-400 capitalize">• Category: {selectedTicket.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-heading mt-0.5">
                    {selectedTicket.subject}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                  {selectedTicket.status}
                </span>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {selectedTicket.messages.map((m) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1">
                        {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          isUser
                            ? 'bg-amber-500/20 text-white border border-amber-500/30'
                            : 'bg-slate-950 text-slate-200 border border-slate-800'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response to support..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-xs text-slate-500 h-[500px] flex items-center justify-center">
              Select or create a ticket to view messages.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white font-heading mb-4">
              Open New Support Ticket
            </h3>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="helping">Helping Module & 12-Hour Timer</option>
                  <option value="kyc">KYC & Document Verification</option>
                  <option value="withdrawal">Withdrawal & Bank Transfer</option>
                  <option value="technical">Technical / Login / Profile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Summary
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. UTR payment verified but timer still running"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please specify transaction reference, screenshot info, or exact details..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  {loading ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

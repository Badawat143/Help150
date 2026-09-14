/**
 * HELP150 — Configurable ₹150 Helping Module
 * Peer-to-peer assistance with 12-hour timer, matching system, UTR proof upload & audit trails.
 */

import React, { useState } from 'react';
import {
  HeartHandshake,
  Clock,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  Send,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ListFilter,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MemberLinkBox } from './MemberLinkBox';
import { ProvideHelpCard } from './ProvideHelpCard';
import { ReceiveHelpCard } from './ReceiveHelpCard';
import { CommonRequestCard } from './CommonRequestCard';
import { HelpRequest } from '../../types';
import { db } from '../../services/db';

export const HelpModule: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const state = db.getState();
  const defaultAmount = state.settings.helpAmountDefault || 150;

  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'give' | 'receive' | 'completed'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  // Fetch all user-related help requests
  const allUserRequests = state.helpRequests.filter(
    (r) => r.userId === currentUser.id || r.matchedWithUserId === currentUser.id
  );

  // Active Provide Help Request (Current user is sender)
  const activeProvideRequest = allUserRequests.find(
    (r) =>
      r.userId === currentUser.id &&
      ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'pending_match', 'matched', 'proof_submitted', 'REJECTED', 'rejected'].includes(
        r.status
      )
  );

  // Check if user has ANY completed Provide Help request
  const hasCompletedProvideHelp = allUserRequests.some(
    (r) =>
      r.userId === currentUser.id &&
      r.type === 'give_help' &&
      ['COMPLETED', 'completed'].includes(r.status)
  );

  // MANDATORY COMMUNITY RULE: Provide help link complete hone ke baad hi receive help link aayega!
  const isProvideHelpIncomplete = Boolean(activeProvideRequest) || !hasCompletedProvideHelp;

  // Active Receive Help Request (Current user is receiver) - ONLY if Provide Help is completed!
  const activeReceiveRequest = !isProvideHelpIncomplete
    ? allUserRequests.find(
        (r) =>
          r.matchedWithUserId === currentUser.id &&
          ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'pending_match', 'matched', 'proof_submitted'].includes(
            r.status
          )
      )
    : undefined;

  const handleCreateProvideRequest = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCreating(true);

    try {
      const res = await api.createHelpRequest({
        userId: currentUser.id,
        amount: defaultAmount,
      });

      if (res.success && res.data) {
        setSuccessMsg(`Provide Help Request #${res.data.id} assigned successfully! Matched with ${res.data.matchedWithUserName}.`);
        refreshUserData();
      } else {
        setErrorMsg(res.error || 'Could not initiate help request');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create request');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredRequests = allUserRequests.filter((r) => {
    if (activeTab === 'give') return r.userId === currentUser.id;
    if (activeTab === 'receive') return r.matchedWithUserId === currentUser.id;
    if (activeTab === 'completed') return r.status === 'COMPLETED' || r.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-rose-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
                  HELP150 Helping Plan Dashboard
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ₹{defaultAmount} Mutual Assistance
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Member-to-Member Providing & Receiving Links • Server 12-Hour Timers • Verified Payment Slips
              </p>
            </div>
          </div>

          {!activeProvideRequest && (
            <button
              id="btn-create-help-request"
              onClick={handleCreateProvideRequest}
              disabled={isCreating}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-blue-600 hover:from-rose-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-rose-950/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isCreating ? 'Assigning Match...' : `Initiate ₹${defaultAmount} Provide Help`}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two Highly Visible Primary Transaction Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. PROVIDE HELP LINK BOX (RED THEMED LINK BOX) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <span>🔴</span>
              <span>1. Provide Help Link Box</span>
            </span>
            {activeProvideRequest ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                Active Assignment
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Red Link Box
              </span>
            )}
          </div>

          {activeProvideRequest ? (
            <ProvideHelpCard
              request={activeProvideRequest}
              currentUser={currentUser}
              onRefresh={refreshUserData}
            />
          ) : (
            <div className="p-8 rounded-3xl bg-gradient-to-b from-red-950 via-red-900 to-red-950 border-2 border-red-500 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-red-950/60 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white border border-red-400/50 shadow-md">
                <ArrowUpRight className="h-7 w-7 text-white" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-base font-black text-white">No Active Provide Help Request</h3>
                <p className="text-xs text-red-100 mt-1 font-medium">
                  Click below to generate a ₹{defaultAmount} Provide Help link matched with an active community recipient.
                </p>
              </div>
              <button
                onClick={handleCreateProvideRequest}
                disabled={isCreating}
                className="py-2.5 px-5 rounded-2xl bg-white hover:bg-red-50 text-red-700 font-black text-xs shadow-lg shadow-red-950/50 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-red-600" />
                <span>Initiate ₹{defaultAmount} Provide Help (Red Link Box)</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. RECEIVE HELP LINK BOX (SKY BLUE THEMED LINK BOX) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <span>🔵</span>
              <span>2. Receive Help Link Box</span>
            </span>
            {activeReceiveRequest ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Incoming Assistance
              </span>
            ) : isProvideHelpIncomplete ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>🔒 Locked: Provide Help Incomplete</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/40">
                Sky Blue Link Box
              </span>
            )}
          </div>

          {activeReceiveRequest ? (
            <ReceiveHelpCard
              request={activeReceiveRequest}
              currentUser={currentUser}
              onRefresh={refreshUserData}
            />
          ) : isProvideHelpIncomplete ? (
            <div className="p-8 rounded-3xl bg-gradient-to-b from-sky-950 via-sky-900 to-sky-950 border-2 border-amber-400/70 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-sky-950/60 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-md">
                <Lock className="h-7 w-7 text-amber-300 animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40 inline-flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  <span>🔒 Receive Help Link Locked</span>
                </span>
                <h3 className="text-base sm:text-lg font-black text-white font-heading">
                  Provide Help Link Complete होने के बाद ही Receive Help Link आएगा
                </h3>
                <p className="text-xs text-sky-100 font-medium leading-relaxed">
                  कम्युनिटी नियमों के अनुसार, पहले आपको अपना active Provide Help पूरा करना होगा। जब आपका Provide Help पूर्ण व सत्यापित हो जाएगा, तभी आप सहायता प्राप्त (Receive Help) करने के पात्र होंगे।
                </p>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById('btn-create-help-request');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="py-2.5 px-5 rounded-2xl bg-white hover:bg-sky-50 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <span>Complete Provide Help First ➔</span>
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-gradient-to-b from-sky-950 via-sky-900 to-sky-950 border-2 border-sky-400 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-sky-950/60 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white border border-sky-300/50 shadow-md">
                <ArrowDownLeft className="h-7 w-7 text-white" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-base font-black text-white">No Active Receive Help Request</h3>
                <p className="text-xs text-sky-100 mt-1 font-medium">
                  When a community peer is matched to provide assistance to your account, the Receive Help card with 12-hour timer and verification controls will activate here automatically.
                </p>
              </div>
              <span className="text-[11px] font-bold text-sky-950 bg-white px-3.5 py-1.5 rounded-full shadow-md">
                🔵 Standing by in Community Queue (Sky Blue Box)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Helping Member-to-Member Link Box */}
      <MemberLinkBox />

      {/* History of Help Requests with Tabs */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                All Helping Activity History
              </h3>
              <p className="text-xs text-slate-400">
                Transparent logs with immutable server IDs (HP-XXXXXXXX) and UTR records
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({allUserRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('give')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'give'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Provide Help
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'receive'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Receive Help
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No helping transactions recorded for the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((req) => (
              <CommonRequestCard
                key={req.id}
                request={req}
                currentUserId={currentUser.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


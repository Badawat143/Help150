/**
 * HELP150 — Server-Controlled 12-Hour Countdown Timer Component
 * Displays real-time countdown synchronized with server timestamp, surviving page reloads.
 */

import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle, AlertTriangle, PlayCircle } from 'lucide-react';
import { TimerStatus } from '../../types';

interface CountdownTimerProps {
  startTime?: number; // epoch ms
  expiryTime?: number; // epoch ms (default 12 hours from start)
  status: TimerStatus;
  requestId?: string;
  onExpire?: () => void;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  startTime,
  expiryTime,
  status,
  requestId,
  onExpire,
  compact = false,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryTime || status !== 'active') {
      setTimeLeftMs(0);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const diff = expiryTime - now;
      if (diff <= 0) {
        setTimeLeftMs(0);
        setIsExpired(true);
        onExpire?.();
      } else {
        setTimeLeftMs(diff);
        setIsExpired(false);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [expiryTime, status, onExpire]);

  // Format HH:MM:SS
  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            Active Window
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="h-3 w-3" />
            Verified & Completed
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-3 w-3" />
            Window Expired
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="h-3 w-3" />
            Awaiting Match / Approval
          </span>
        );
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 font-mono">
        <Clock className={`h-4 w-4 ${status === 'active' ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
        <span
          className={`text-sm font-bold tracking-wider ${
            status === 'active' ? 'text-amber-300' : 'text-slate-400'
          }`}
        >
          {status === 'active' ? formatTime(timeLeftMs) : '12:00:00'}
        </span>
        {getStatusBadge()}
      </div>
    );
  }

  return (
    <div
      id={`timer-card-${requestId || 'global'}`}
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden"
    >
      {/* Subtle background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              12-Hour Verification Window
            </h4>
            <p className="text-[11px] text-slate-400">
              Server-synchronized countdown for help request processing
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Countdown Digital Display */}
      <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/80 to-slate-950 border-2 border-indigo-500/40 rounded-2xl p-4 text-center my-3 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="text-3xl sm:text-5xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.4)] animate-pulse">
          {status === 'active' ? formatTime(timeLeftMs) : status === 'completed' ? 'COMPLETED' : '12:00:00'}
        </div>
        <div className="flex justify-center gap-10 sm:gap-14 text-[11px] font-bold text-indigo-300 uppercase tracking-widest mt-2 font-mono">
          <span className="text-amber-400">Hours</span>
          <span className="text-pink-400">Minutes</span>
          <span className="text-cyan-400">Seconds</span>
        </div>
      </div>

      {/* Rule & compliance note */}
      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
        <strong className="text-slate-300">Server Audit Note:</strong> This timer enforces timely transaction verification and peer assistance dispatching. It does not promise guaranteed financial returns or daily yields.
      </p>
    </div>
  );
};

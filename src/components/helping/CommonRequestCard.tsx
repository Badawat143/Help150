import React from 'react';
import {
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { HelpRequest } from '../../types';
import { StatusBadge } from './StatusBadge';

interface CommonRequestCardProps {
  request: HelpRequest;
  currentUserId: string;
  onSelect?: (req: HelpRequest) => void;
}

export const CommonRequestCard: React.FC<CommonRequestCardProps> = ({
  request,
  currentUserId,
  onSelect,
}) => {
  const isSender = request.userId === currentUserId;
  const isGiveHelp = request.type === 'give_help' || isSender;

  const otherName = isSender
    ? request.matchedWithUserName || 'Community Member'
    : request.userName || 'Community Member';
  const otherId = isSender
    ? request.matchedWithUserId || 'H150-MEMBER'
    : request.userId || 'H150-MEMBER';
  const otherMobile = isSender
    ? request.matchedWithMobile || '9876543210'
    : request.userMobile || '9876543210';
  const otherEmail = isSender
    ? request.matchedWithEmail || `${otherId.toLowerCase()}@help150.org`
    : request.userEmail || `${otherId.toLowerCase()}@help150.org`;

  const now = Date.now();
  const expiry = request.timerExpiryTime || now;
  const isExpired = expiry <= now && !['COMPLETED', 'REJECTED', 'completed', 'cancelled'].includes(request.status);

  return (
    <div
      onClick={() => onSelect?.(request)}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-slate-900/80 hover:bg-slate-900 ${
        isGiveHelp
          ? 'border-rose-500/30 hover:border-rose-500/60'
          : 'border-blue-500/30 hover:border-blue-500/60'
      } ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isGiveHelp
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isGiveHelp ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white">{request.id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isGiveHelp
                    ? 'bg-rose-500/15 text-rose-300'
                    : 'bg-blue-500/15 text-blue-300'
                }`}
              >
                {isGiveHelp ? 'PROVIDE HELP' : 'RECEIVE HELP'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isGiveHelp ? 'To' : 'From'}: <strong className="text-slate-200">{otherName}</strong> ({otherId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <StatusBadge status={request.status} size="sm" />
          <span className="text-sm font-black text-white font-heading">
            ₹{request.amount}
          </span>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[11px] text-slate-400">
        <div>
          <span className="text-slate-500 block text-[10px]">Mobile</span>
          <span className="font-medium text-slate-200">{otherMobile}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Email</span>
          <span className="font-medium text-slate-200 truncate block">{otherEmail}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Created Date</span>
          <span className="font-medium text-slate-200">
            {new Date(request.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">UTR / Proof</span>
          <span className="font-mono font-bold text-amber-300">
            {request.proofReference || 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};

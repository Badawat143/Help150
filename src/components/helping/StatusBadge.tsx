import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Hourglass,
  FileCheck2,
  FileText,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { HelpRequestStatus } from '../../types';

interface StatusBadgeProps {
  status: HelpRequestStatus | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  const norm = (status || '').toUpperCase();

  let label = 'Pending';
  let badgeClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  let Icon = Clock;

  switch (norm) {
    case 'REQUEST_CREATED':
    case 'PENDING':
    case 'PENDING_MATCH':
      label = 'Pending Match';
      badgeClasses = 'bg-slate-800 text-slate-300 border-slate-700';
      Icon = Clock;
      break;

    case 'ACCEPTED':
    case 'MATCHED':
      label = 'Accepted';
      badgeClasses = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      Icon = CheckCheck;
      break;

    case 'PAYMENT_PENDING':
      label = 'Payment Pending';
      badgeClasses = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      Icon = Hourglass;
      break;

    case 'SLIP_UPLOADED':
      label = 'Slip Uploaded';
      badgeClasses = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      Icon = FileText;
      break;

    case 'VERIFICATION_PENDING':
    case 'PROOF_SUBMITTED':
      label = 'Verification Pending';
      badgeClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      Icon = FileCheck2;
      break;

    case 'PAYMENT_VERIFIED':
      label = 'Payment Verified';
      badgeClasses = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      Icon = ShieldCheck;
      break;

    case 'COMPLETED':
      label = 'Completed';
      badgeClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      Icon = CheckCircle2;
      break;

    case 'REJECTED':
    case 'CANCELLED':
      label = 'Rejected';
      badgeClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      Icon = XCircle;
      break;

    case 'EXPIRED':
      label = 'Expired';
      badgeClasses = 'bg-red-500/20 text-red-400 border-red-500/40';
      Icon = AlertCircle;
      break;

    default:
      label = status;
      badgeClasses = 'bg-slate-800 text-slate-300 border-slate-700';
      Icon = Clock;
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm gap-2'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wide rounded-full border shadow-sm ${badgeClasses} ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      <span>{label}</span>
    </span>
  );
};

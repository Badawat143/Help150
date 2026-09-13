/**
 * HELP150 — Compliance & Regulatory Notice Banner
 */

import React, { useState } from 'react';
import { ShieldAlert, Info, X, ExternalLink, Scale } from 'lucide-react';
import { db } from '../../services/db';

export const ComplianceBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const settings = db.getState().settings;

  if (dismissed || !settings.legalDisclaimerEnabled) return null;

  return (
    <>
      <div
        id="compliance-banner"
        className="w-full bg-slate-900/95 border-b border-amber-500/30 text-xs text-slate-300 py-2.5 px-4 backdrop-blur-md relative z-40"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Scale className="h-3 w-3" />
            </span>
            <p className="leading-snug">
              <strong className="text-amber-400 font-semibold">Important Compliance Declaration:</strong>{' '}
              HELP150 does not offer guaranteed profits, fixed returns, or recruitment-based earnings.
              All participation is strictly subject to community mutual rules and statutory compliance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-view-compliance-terms"
              onClick={() => setShowModal(true)}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              Legal Terms
              <ExternalLink className="h-3 w-3" />
            </button>
            <button
              id="btn-dismiss-compliance-banner"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss banner"
              className="text-slate-400 hover:text-slate-200 p-1 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Regulatory & Compliance Policy</h3>
                <p className="text-xs text-slate-400">Strict transparency and non-guarantee declaration</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 max-h-72 overflow-y-auto">
              <p>
                <strong className="text-white">1. Voluntary Community Peer Assistance:</strong> HELP150 operates solely as a community mutual-help coordination platform. It is not an investment scheme, bank, or collective investment trust.
              </p>
              <p>
                <strong className="text-white">2. No Guaranteed Earnings:</strong> No participant, leader, or marketing material is authorized to claim guaranteed ₹200, daily returns, or fixed profit percentages.
              </p>
              <p>
                <strong className="text-white">3. Statutory Review Notice:</strong> All financial rules, peer payment processing, referral rewards, KYC, taxation, consumer protection, and applicable Indian laws must be reviewed by qualified legal and compliance professionals before real-money live deployment.
              </p>
              <p>
                <strong className="text-white">4. KYC & Audit:</strong> Payouts and withdrawals require government photo identification and verified bank/UPI credentials.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                I Understand & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

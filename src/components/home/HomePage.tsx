/**
 * HELP150 — Modern Fintech & Community Home Page
 * Transparent, mobile-first, and strictly compliant.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  HeartHandshake,
  ReceiptText,
  SlidersHorizontal,
  ArrowRight,
  LogIn,
  UserPlus,
  HelpCircle,
  Headphones,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Lock,
  ExternalLink,
  UserCheck,
  Zap,
} from 'lucide-react';
import { ReferralBox } from '../common/ReferralBox';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { referralTracker, SponsorLookupResult } from '../../services/referralTracker';

interface HomePageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { currentUser, setActiveTab } = useAuth();
  const state = db.getState();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [trackedSponsor, setTrackedSponsor] = useState<SponsorLookupResult | null>(null);

  useEffect(() => {
    const code = referralTracker.extractReferralFromUrl();
    if (code) {
      referralTracker.lookupSponsor(code).then((res) => {
        if (res.exists) {
          setTrackedSponsor(res);
        }
      });
    }
  }, []);

  const stats = {
    totalUsers: state.users.length,
    activeHelps: state.helpRequests.filter((r) => r.status === 'completed').length,
    totalVolume: state.transactions.reduce((acc, t) => acc + t.amount, 0),
    avgVerificationTime: '12 Hours Max',
  };

  const faqs = [
    {
      q: 'What is HELP150 and how does it function?',
      a: 'HELP150 is a transparent, peer-coordinated community mutual assistance platform. Members participate in voluntary ₹150 help requests to assist community peers, tracked via verifiable bank/UPI UTR numbers and a server-controlled 12-hour window.',
    },
    {
      q: 'Does HELP150 offer guaranteed income or fixed returns?',
      a: 'STRICTLY NO. HELP150 does not promise guaranteed ₹200, daily returns, fixed percentages, or passive investment yields. All referral and platform incentives require genuine qualifying community activity and statutory verification.',
    },
    {
      q: 'Why is KYC verification mandatory for withdrawals?',
      a: 'In compliance with Indian financial standards and anti-money-laundering best practices, KYC (Aadhaar/PAN and Bank verification) ensures identity authenticity, prevents fraud/duplicate accounts, and ensures withdrawals reach the rightful bank account.',
    },
    {
      q: 'What is the minimum withdrawal amount and rules?',
      a: 'The minimum withdrawal is ₹200 and withdrawals must be in multiples of ₹200 (e.g. ₹200, ₹400, ₹600, ₹800). Each withdrawal undergoes admin verification and ledger reconciliation before payout transfer.',
    },
    {
      q: 'How does the 12-Hour countdown timer work?',
      a: 'When a help request is matched, a server-side 12:00:00 timer starts to ensure timely assistance and proof upload. The timer continues accurately across browser refreshes and prevents tampering.',
    },
  ];

  return (
    <div className="w-full pb-20">
      {/* Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-xs font-semibold text-amber-300 shadow-lg mb-6 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>Community Help • Transparent System • Secure Dashboard</span>
          </div>

          {/* Main Brand Title */}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none font-heading mb-4">
            HELP<span className="gradient-gold-text">150</span>
          </h1>

          {/* Hindi Tagline */}
          <p className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-amber-200 to-slate-200 font-heading mb-4">
            “एक transparent और community-focused helping platform”
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
            Experience voluntary community mutual assistance engineered with real-time peer matching, 12-hour server-controlled timer windows, 6-level referral analytics, and bank-grade KYC security.
          </p>

          {/* Auto-Tracked Referral Invitation Banner */}
          {!currentUser && trackedSponsor && (
            <div className="mb-6 mx-auto max-w-lg p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-blue-500/20 border border-amber-500/40 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-amber-300 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Special Referral Invitation</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    Invited by: {trackedSponsor.fullName} <span className="text-amber-400 font-mono">({trackedSponsor.id})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenRegister}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition cursor-pointer shadow"
              >
                Join Under Team
              </button>
            </div>
          )}

          {/* 4 Action Buttons as requested */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {currentUser ? (
              <button
                id="hero-btn-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <span>Open User Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  id="hero-btn-join-now"
                  onClick={onOpenRegister}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Join Now</span>
                </button>

                <button
                  id="hero-btn-login"
                  onClick={onOpenLogin}
                  className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="h-4 w-4 text-amber-400" />
                  <span>Login</span>
                </button>
              </>
            )}

            <button
              id="hero-btn-how-it-works"
              onClick={() => {
                const el = document.getElementById('how-it-works-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 text-slate-200 font-semibold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 text-blue-400" />
              <span>How It Works</span>
            </button>

            <button
              id="hero-btn-support"
              onClick={() => setActiveTab('support')}
              className="px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 text-slate-200 font-semibold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Headphones className="h-4 w-4 text-emerald-400" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </section>

      {/* Prominent Referral Link Box (Red + Blue Gradient) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <ReferralBox />
      </section>

      {/* Three Highlight Cards Required */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Built on Three Transparent Pillars
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Engineered for genuine community mutual assistance with zero ambiguity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Community Support */}
          <div
            id="card-community-support"
            className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-amber-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-5 group-hover:scale-110 transition-transform">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading mb-2">
                1. Community Support
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Voluntary peer-to-peer assistance model. Members provide ₹150 help to matched participants, fostering mutual solidarity through transparent, direct coordination.
              </p>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Configurable ₹150 default help pool</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Direct UPI / Bank UTR proof verification</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Transparent Transactions */}
          <div
            id="card-transparent-transactions"
            className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-blue-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5 group-hover:scale-110 transition-transform">
                <ReceiptText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading mb-2">
                2. Transparent Transactions
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Every transaction contains unique Sender/Receiver IDs, timestamp, UTR reference, and immutable audit logging. No hidden deductions or artificial ledger shifts.
              </p>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Idempotent transaction tracking</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Zero fake frontend-only balance changes</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Secure User Dashboard */}
          <div
            id="card-secure-dashboard"
            className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5 group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading mb-2">
                3. Secure User Dashboard
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Full-featured control center featuring a server-controlled 12-hour countdown timer, Level 1-6 referral tree viewer, KYC submission, and withdrawal engine.
              </p>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>12:00:00 server-side countdown clock</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Aadhaar/PAN KYC security & bank payouts</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Live System Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-400" />
                Real-Time Community Ledger Stats
              </h3>
              <p className="text-xs text-slate-400">
                Live platform activity updated directly from verified transactions
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Server Engine
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 font-medium">Registered Members</div>
              <div className="text-2xl sm:text-3xl font-black text-white font-heading mt-1">
                {stats.totalUsers}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Auto-generated IDs</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 font-medium">Completed Helps</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-heading mt-1">
                {stats.activeHelps}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Verified ₹150 Peer Helps</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 font-medium">Community Volume</div>
              <div className="text-2xl sm:text-3xl font-black text-blue-400 font-heading mt-1">
                ₹{stats.totalVolume.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">All Ledger Transactions</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 font-medium">Action Timer Window</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
                12:00:00
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Server Synchronized</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 scroll-mt-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-3 border border-blue-500/20">
            Step-by-Step Flow
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
            How HELP150 Operates
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto mt-1">
            A clear, 4-step transparent workflow with no hidden clauses or automated financial guarantees
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
            <span className="text-3xl font-black text-slate-800 font-mono absolute top-4 right-4">01</span>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm mb-4 border border-amber-500/20">
              1
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">Free Registration</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Register with your mobile and email. A unique User ID (e.g. H150-784920) is securely assigned.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
            <span className="text-3xl font-black text-slate-800 font-mono absolute top-4 right-4">02</span>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm mb-4 border border-blue-500/20">
              2
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">₹150 Peer Help</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Initiate a voluntary ₹150 help request, match with a community member, and submit payment proof.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
            <span className="text-3xl font-black text-slate-800 font-mono absolute top-4 right-4">03</span>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm mb-4 border border-purple-500/20">
              3
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">12h Timer & Audit</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              The 12-hour server countdown governs verification. Admin verifies the UTR and updates wallet state.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
            <span className="text-3xl font-black text-slate-800 font-mono absolute top-4 right-4">04</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4 border border-emerald-500/20">
              4
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">Verified Payouts</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Withdrawals in multiples of ₹200 (₹200, ₹400, etc.) processed after statutory KYC review.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Transparent answers regarding platform rules and compliance
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-white hover:text-amber-300 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4.5 pb-4.5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 pt-10 text-slate-400 text-xs max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                H
              </div>
              <span className="text-lg font-bold text-white font-heading">
                HELP<span className="gradient-gold-text">150</span>
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Community Help • Transparent System • Secure Dashboard
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">Platform</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => setActiveTab('help')} className="hover:text-amber-300">₹150 Help Request</button></li>
              <li><button onClick={() => setActiveTab('wallet')} className="hover:text-amber-300">Wallet & Ledger</button></li>
              <li><button onClick={() => setActiveTab('referral')} className="hover:text-amber-300">Level 1-6 Referral Tree</button></li>
              <li><button onClick={() => setActiveTab('withdrawal')} className="hover:text-amber-300">Multiples of ₹200 Payouts</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">Security & Law</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => setActiveTab('kyc')} className="hover:text-amber-300">KYC Verification</button></li>
              <li><button onClick={() => setActiveTab('support')} className="hover:text-amber-300">Support Desk</button></li>
              <li><span className="text-slate-500">Audit Logs (Immutable)</span></li>
              <li><span className="text-slate-500">Anti-MLM Safeguards</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">Legal Notice</h4>
            <p className="text-[10px] leading-relaxed text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              All financial rules, referral incentives, and payout processing must be reviewed by a certified legal and compliance professional prior to live commercial operations.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 pb-6">
          <p>© {new Date().getFullYear()} HELP150 Community Platform. All rights reserved.</p>
          <p className="text-amber-400/80">Strictly Non-Guaranteed Community Mutual Model</p>
        </div>
      </footer>
    </div>
  );
};

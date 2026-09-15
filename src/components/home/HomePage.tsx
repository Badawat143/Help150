/**
 * HELP150 — Premium Modern Community Home Page
 * World-class Fintech & Mutual Community Template
 * Bilingual (Hindi/English), High-Converting, Transparent, and Mobile-First
 * Includes Official Business Plan PDF Download & Interactive Slides Viewer
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
  Share2,
  Award,
  Check,
  Copy,
  Gift,
  AlertCircle,
  Phone,
  Mail,
  MessageCircle,
  Layers,
  Repeat,
  Wallet,
  Send,
  Users,
  Star,
  Activity,
  ArrowUpRight,
  CheckCircle,
  Download,
  FileText,
  Eye,
  FileDown,
} from 'lucide-react';
import { ReferralBox } from '../common/ReferralBox';
import { PlanPresentationModal } from '../common/PlanPresentationModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../services/db';
import { referralTracker, SponsorLookupResult } from '../../services/referralTracker';
import { generateHelp150PlanPdf } from '../../services/pdfPlanGenerator';

interface HomePageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { currentUser, setActiveTab } = useAuth();
  const toast = useToast();
  const [state, setState] = useState(() => db.getState());
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [trackedSponsor, setTrackedSponsor] = useState<SponsorLookupResult | null>(null);
  const [teamSizeInput, setTeamSizeInput] = useState<number>(3);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Live countdown timer for the 4-day promotion
  const [countdown, setCountdown] = useState({
    days: 4,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setState(db.getState());
    });
    return () => unsub();
  }, []);

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

  useEffect(() => {
    const calculateCountdown = () => {
      const now = Date.now();
      const end = new Date(state.settings.promotionEndDate || Date.now() + 4 * 24 * 3600000).getTime();
      const diff = Math.max(0, end - now);

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const totalSecs = Math.floor(diff / 1000);
        const days = Math.floor(totalSecs / 86400);
        const hours = Math.floor((totalSecs % 86400) / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        setCountdown({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [state.settings.promotionEndDate]);

  const handleDownloadPdf = () => {
    try {
      setIsDownloadingPdf(true);
      generateHelp150PlanPdf();
      setDownloadSuccess(true);
      toast.success('HELP150 ऑफिशियल बिजनेस प्लान PDF डाउनलोड हो गया है।', 'सफलतापूर्वक डाउनलोड!');
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      toast.error('PDF जनरेट करने में समस्या आई, कृपया पुनः प्रयास करें।', 'त्रुटि');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const stats = {
    totalUsers: state.users.length,
    activeHelps: state.helpRequests.filter((r) => r.status === 'completed').length,
    totalVolume: state.transactions.reduce((acc, t) => acc + t.amount, 0),
    avgVerificationTime: '12 Hours Server Time',
  };

  const isPromotionActive = !state.settings.linkSystemEnabled;

  const faqs = [
    {
      q: 'HELP150 क्या है और यह कैसे काम करता है? (What is HELP150?)',
      a: 'HELP150 एक पारदर्शी, सुरक्षित और प्रत्यक्ष पीयर-टू-पीयर (P2P) कम्युनिटी म्यूचुअल हेल्पिंग मंच है। यहाँ सदस्य स्वेच्छा से ₹150 की सहायता (₹50 वेरिफिकेशन लिंक + ₹100 सेकंड लिंक) प्रदान करते हैं। 12-घंटे के सर्वर टाइमर के बाद वे ₹200 की सीधी सहायता अपने बैंक/UPI में प्राप्त करते हैं।',
    },
    {
      q: 'बिजनेस प्लान PDF कैसे और कहाँ से डाउनलोड करें?',
      a: 'होमपेज पर दिए गए "डाउनलोड बिजनेस प्लान (PDF)" बटन पर क्लिक करके आप 12-स्लाइड्स का पूरा आधिकारिक प्रेजेंटेशन PDF अपने फोन या कंप्यूटर में तुरंत डाउनलोड कर सकते हैं। आप "स्लाइड्स ऑनलाइन देखें" पर क्लिक करके इसे सीधे स्क्रीन पर भी पढ़ सकते हैं।',
    },
    {
      q: 'क्या 4-दिवसीय प्री-लॉन्च प्रमोशन अवधि में रजिस्ट्रेशन खुला है?',
      a: 'हाँ! वर्तमान में 4-दिन का विशेष प्री-लॉन्च प्रमोशन चल रहा है। अभी कोई भी व्यक्ति निशुल्क रजिस्ट्रेशन कर सकता है, अपना रेफरल लिंक शेयर करके 6-लेवल की बड़ी टीम बना सकता है। टाइमर समाप्त होते ही ऑटोमैटिक हेल्पिंग लिंक्स शुरू हो जाएंगे।',
    },
    {
      q: 'क्या यहाँ कोई फिक्स्ड रिटर्न या इन्वेस्टमेंट स्कीम है? (Guaranteed Returns?)',
      a: 'बिल्कुल नहीं! HELP150 कोई निवेश कंपनी, बैंक या चिट फंड नहीं है। यह विशुद्ध रूप से सदस्यों के आपसी सहयोग का समुदाय है। सभी सहायता सीधे एक सदस्य के बैंक खाते/UPI से दूसरे सदस्य के खाते में ट्रांसफर होती है।',
    },
    {
      q: '12-घंटे का टाइमर कैसे काम करता है? (12-Hour Maturation Timer)',
      a: 'जब आप ₹50 और ₹100 दोनों सहायता पूर्ण कर लेते हैं और प्राप्तकर्ता द्वारा स्लिप कन्फर्म हो जाती है, तो सिस्टम पर 12:00:00 का सर्वर टाइमर प्रारंभ होता है। टाइमर पूरा होते ही आपके डैशबोर्ड पर ₹200 का रिसीव हेल्प लिंक एक्टिवेट हो जाता है।',
    },
    {
      q: 'लेवल 1 से 6 तक रेफरल इनकम कैसे मिलती है? (Referral Earnings)',
      a: 'HELP150 में 6-स्तरीय रेफरल रिवार्ड सिस्टम है। लेवल 1 (डायरेक्ट) पर 5%, लेवल 2 पर 4%, लेवल 3 पर 3%, लेवल 4 पर 2%, लेवल 5 पर 1%, और लेवल 6 पर 0.5% रिवार्ड मिलता है। यह आपके एक्टिव वॉलेट में तत्काल जमा होता है।',
    },
    {
      q: 'निकासी (Withdrawal) के क्या नियम हैं?',
      a: 'न्यूनतम निकासी राशि ₹200 है और निकासी ₹200 के गुणक (₹200, ₹400, ₹600 आदि) में की जाती है। निकासी के लिए बैंक विवरण और आधार/पैन KYC अनिवार्य है ताकि धन सही सदस्य के खाते में पहुँचे।',
    },
  ];

  // Recent ticker updates
  const recentCommunityActivities = [
    { text: 'New member H150-304082 registered from Maharashtra', time: 'Just now' },
    { text: 'Official Plan PDF downloaded by member H150-784920', time: '1 min ago' },
    { text: 'Level 1 direct referral bonus ₹5 credited to member wallet', time: '2 mins ago' },
    { text: 'User H150-784920 completed KYC verification successfully', time: '4 mins ago' },
    { text: 'New member H150-304091 joined under Sponsor H150-ADMIN01', time: '5 mins ago' },
    { text: '12-Hour timer maturation completed for Cycle #1', time: '8 mins ago' },
  ];

  // Calculate 6-level referral potential with custom direct count
  const calculateReferralEarning = (n: number) => {
    const l1 = n * 7.5; // Level 1: 5% of ₹150 = ₹7.50
    const l2 = n * n * 6.0; // Level 2: 4% = ₹6.00
    const l3 = Math.min(n * n * n, 500) * 4.5; // Level 3: 3% = ₹4.50
    const l4 = Math.min(Math.pow(n, 4), 1000) * 3.0; // Level 4: 2% = ₹3.00
    const l5 = Math.min(Math.pow(n, 5), 2000) * 1.5; // Level 5: 1% = ₹1.50
    const l6 = Math.min(Math.pow(n, 6), 5000) * 0.75; // Level 6: 0.5% = ₹0.75
    return Math.round(l1 + l2 + l3 + l4 + l5 + l6);
  };

  const handleShareWhatsApp = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://help150.org';
    const text = encodeURIComponent(
      `🎉 *HELP150 कम्युनिटी - ऑफिशियल बिजनेस प्लान (PDF)*\n\n` +
      `🔥 *प्लान साइकिल:* ₹50 वेरिफिकेशन + ₹100 सेकंड लिंक ➔ 12 घंटे टाइमर ➔ ₹200 रिसीव लिंक (+₹50 नेट लाभ)\n` +
      `👥 6-लेवल की शानदार रेफरल इनकम\n` +
      `⚡ 100% डायरेक्ट UPI / बैंक ट्रांसफर\n\n` +
      `📥 पूरा प्लान PDF यहाँ से डाउनलोड करें:\n${siteUrl}\n\n` +
      `🚀 अभी तुरंत फ्री रजिस्ट्रेशन करें और अपनी टीम बनाएं!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div id="home-page-root" className="w-full pb-20 overflow-x-hidden text-slate-100 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT BANNER: 4-DAY PRE-LAUNCH COUNTDOWN TICKER & PDF CTA   */}
      {/* ========================================================================= */}
      {isPromotionActive && (
        <div className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-rose-600 text-slate-950 font-black py-2.5 px-4 shadow-lg text-xs sm:text-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center">
              <span className="flex h-6 w-6 rounded-full bg-black text-amber-300 items-center justify-center text-xs shrink-0 animate-bounce">
                ⏳
              </span>
              <span className="text-slate-950 tracking-tight">
                <strong className="underline uppercase">4-दिवसीय प्री-लॉन्च प्रमोशन अवधि सक्रिय:</strong>{' '}
                अभी टीम बनाएं, टाइमर खत्म होते ही लिंक्स चालू होंगे!
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Download PDF Button in Top Bar */}
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 hover:bg-black font-bold text-[11px] border border-amber-400/80 shadow cursor-pointer transition active:scale-95 shrink-0"
              >
                <FileText className="h-3 w-3 text-rose-400" />
                <span>प्लान PDF</span>
              </button>

              {/* Compact Top Timer */}
              <div className="inline-flex items-center gap-1.5 bg-black/90 text-amber-300 px-3 py-1 rounded-full font-mono text-xs font-bold border border-amber-400/50 shadow-inner">
                <Clock className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                <span>
                  {String(countdown.days).padStart(2, '0')}d : {String(countdown.hours).padStart(2, '0')}h :{' '}
                  {String(countdown.minutes).padStart(2, '0')}m : {String(countdown.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GLOWING HERO SECTION WITH EMBLEM & DUAL BOX VISUAL                     */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Background Ambient Radial Lights */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-rose-600/15 to-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Official Emblem Logo with Radiant Pulsing Halo */}
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-yellow-500 opacity-80 blur-lg group-hover:opacity-100 group-hover:blur-xl transition-all animate-pulse" />
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full p-1.5 bg-gradient-to-b from-amber-300 via-amber-600 to-amber-900 shadow-2xl shadow-amber-500/40">
                <img
                  src="/logo.png"
                  alt="HELP150 Official Community Logo"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain rounded-full shadow-inner bg-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Golden Capsule Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/40 text-xs font-bold text-amber-300 shadow-xl mb-4 backdrop-blur-md">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>100% Peer-to-Peer Mutual Aid • Direct UPI Transfers • No Central Wallet</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight font-heading mb-3 drop-shadow-md">
            HELP<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">150</span>
          </h1>

          {/* Slogan */}
          <p className="text-xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 font-heading mb-4 tracking-wide">
            “Together For A Better Tomorrow”
          </p>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8 font-medium">
            भारत का सबसे पारदर्शी और सुरक्षित कम्युनिटी म्यूचुअल हेल्पिंग प्लेटफॉर्म। ₹150 की स्वैच्छिक सहायता, 12-घंटे का सुरक्षित सर्वर टाइमर, और ₹200 की सीधी सहायता प्राप्ति।
          </p>

          {/* Sponsor Tracked Banner (If opened from a referral link) */}
          {!currentUser && trackedSponsor && (
            <div className="mb-8 mx-auto max-w-lg p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-500/20 border-2 border-amber-400 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-left animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-amber-300 flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-current" />
                    <span>Special Referral Invitation</span>
                  </div>
                  <div className="text-xs font-black text-white">
                    Sponsor: {trackedSponsor.fullName} <span className="text-amber-400 font-mono">({trackedSponsor.id})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenRegister}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 transition-transform active:scale-95 cursor-pointer shadow-lg"
              >
                Join Under Team
              </button>
            </div>
          )}

          {/* Hero Action Buttons (Including DOWNLOAD PDF Option) */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
            {currentUser ? (
              <button
                id="hero-btn-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>डैशबोर्ड खोलें (Open Dashboard)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  id="hero-btn-join-now"
                  onClick={onOpenRegister}
                  className="px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 stroke-[2.5]" />
                  <span>तुरंत रजिस्ट्रेशन करें (Free Join)</span>
                </button>

                <button
                  id="hero-btn-login"
                  onClick={onOpenLogin}
                  className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-white font-black text-sm shadow-lg transition-all hover:border-amber-400 flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="h-4 w-4 text-amber-400" />
                  <span>लॉगिन (Member Login)</span>
                </button>
              </>
            )}

            {/* DOWNLOAD PDF PRIMARY BUTTON */}
            <button
              id="hero-btn-download-pdf"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border-2 border-amber-300"
            >
              <Download className="h-4.5 w-4.5 stroke-[2.5]" />
              <span>{isDownloadingPdf ? 'डाउनलोडिंग...' : 'डाउनलोड बिजनेस प्लान (PDF)'}</span>
            </button>

            {/* VIEW SLIDES BUTTON */}
            <button
              id="hero-btn-view-slides"
              onClick={() => setIsPlanModalOpen(true)}
              className="px-5 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 text-slate-200 font-bold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Eye className="h-4 w-4 text-cyan-400" />
              <span>स्लाइड्स देखें</span>
            </button>

            <button
              id="hero-btn-whatsapp-share"
              onClick={handleShareWhatsApp}
              className="px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp पर शेयर</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 3. VIBRANT 4-DAY PRE-LAUNCH COUNTDOWN SHOWCASE CARD                       */}
          {/* ========================================================================= */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0F1026] via-[#161A3D] to-[#0A0E28] border-2 border-amber-400/80 shadow-2xl shadow-indigo-950/90 relative overflow-hidden text-left mb-8">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>PRE-LAUNCH COUNTDOWN ACTIVE</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                  4-दिवसीय प्री-लॉन्च प्रमोशन अवधि
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  सभी नए व पुराने मेंबर्स के लिए हेल्पिंग लिंक्स अभी विराम पर हैं। नीचे चल रहा लाइव टाइमर समाप्त होते ही ऑटोमैटिक हेल्पिंग लिंक्स शुरू हो जाएंगे!
                </p>
              </div>

              {/* Four Giant Glowing Digits matching Banner Colors */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-rose-600 via-red-600 to-rose-950 border-2 border-rose-400/90 text-center shadow-lg min-w-[70px] sm:min-w-[85px]">
                  <div className="text-2xl sm:text-4xl font-black text-white font-mono drop-shadow">
                    {String(countdown.days).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-rose-200 uppercase mt-0.5">DAYS</div>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-500 via-orange-600 to-amber-950 border-2 border-amber-300/90 text-center shadow-lg min-w-[70px] sm:min-w-[85px]">
                  <div className="text-2xl sm:text-4xl font-black text-white font-mono drop-shadow">
                    {String(countdown.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-amber-200 uppercase mt-0.5">HOURS</div>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-fuchsia-600 via-purple-600 to-purple-950 border-2 border-fuchsia-400/90 text-center shadow-lg min-w-[70px] sm:min-w-[85px]">
                  <div className="text-2xl sm:text-4xl font-black text-white font-mono drop-shadow">
                    {String(countdown.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-fuchsia-200 uppercase mt-0.5">MINUTES</div>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-cyan-500 via-teal-600 to-teal-950 border-2 border-cyan-300/90 text-center shadow-lg min-w-[70px] sm:min-w-[85px]">
                  <div className="text-2xl sm:text-4xl font-black text-white font-mono animate-pulse drop-shadow">
                    {String(countdown.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-cyan-200 uppercase mt-0.5">SECONDS</div>
                </div>
              </div>
            </div>

            {/* Fast Action Ticker within countdown */}
            <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span>अभी अपनी टीम बनाएं: लेवल 1 से 6 तक अनलिमिटेड इनकम का अवसर!</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs border border-amber-400/50 cursor-pointer shadow flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>प्लान PDF</span>
                </button>
                <button
                  onClick={onOpenRegister}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer shadow"
                >
                  फ्री आईडी बनाएं ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LIVE COMMUNITY MARQUEE TICKER                                          */}
      {/* ========================================================================= */}
      <div className="w-full bg-slate-900/80 border-y border-slate-800 py-2.5 px-4 overflow-hidden mb-16">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            <Activity className="h-3.5 w-3.5 animate-spin" />
            <span>LIVE LEDGER</span>
          </div>
          <div className="flex items-center gap-8 overflow-x-auto text-xs text-slate-300 whitespace-nowrap scrollbar-none py-0.5">
            {recentCommunityActivities.map((act, idx) => (
              <div key={idx} className="flex items-center gap-2 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>{act.text}</span>
                <span className="text-[10px] font-mono text-slate-500">({act.time})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DEDICATED PDF DOWNLOAD SHOWCASE SECTION                                */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-[#0C1130] via-[#111745] to-[#0A0E2B] border-2 border-amber-400/80 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                <FileDown className="h-4 w-4 text-yellow-300 animate-bounce" />
                <span>OFFICIAL BUSINESS PLAN PRESENTATION (PDF)</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white font-heading leading-tight">
                डाउनलोड करें HELP150 का ऑफिशियल बिजनेस प्लान (PDF)
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                पूरा 12-स्लाइड्स का हाई-डेफिनिशन बिजनेस प्लान PDF डाउनलोड करें। इसमें ₹150 प्रोवाइड हेल्प (₹50+₹100), 12-घंटे सर्वर टाइमर, ₹200 रिसीव सहायता, 6-लेवल सपोर्ट रिवार्ड्स एवं सभी नियम स्पष्ट रूप से दिए गए हैं।
              </p>

              {/* 3 Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
                <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-amber-400/40 text-amber-300 font-bold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>12-स्लाइड्स प्रेजेंटेशन</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-cyan-400/40 text-cyan-300 font-bold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>6-लेवल इनकम चार्ट</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-emerald-400/40 text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>100% P2P नियम व शर्तें</span>
                </span>
              </div>
            </div>

            {/* Right Action Box */}
            <div className="w-full lg:w-auto shrink-0 p-6 rounded-2xl bg-slate-950/80 border-2 border-slate-700 shadow-xl flex flex-col gap-3 min-w-[280px] sm:min-w-[340px]">
              <div className="text-center pb-2 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-400">फाइल साइज: ~250 KB • 16:9 Landscape</div>
                <div className="text-base font-black text-white font-heading mt-0.5">
                  HELP150_Official_Business_Plan.pdf
                </div>
              </div>

              {/* Main Download Button */}
              <button
                id="btn-section-download-pdf"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="h-5 w-5 stroke-[3]" />
                    <span>डाउनलोड सफल! (Downloaded)</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 stroke-[2.5]" />
                    <span>{isDownloadingPdf ? 'डाउनलोडिंग...' : 'डाउनलोड PDF फाइल (Download PDF)'}</span>
                  </>
                )}
              </button>

              {/* Online View Button */}
              <button
                id="btn-section-view-slides"
                onClick={() => setIsPlanModalOpen(true)}
                className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Eye className="h-4 w-4 text-cyan-400" />
                <span>सभी 12 स्लाइड्स ऑनलाइन देखें (View Online)</span>
              </button>

              {/* Share on WhatsApp */}
              <button
                id="btn-section-whatsapp-pdf"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700/60 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 text-emerald-300" />
                <span>WhatsApp पर प्लान भेजें</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. VISUAL DUAL-BOX ARCHITECTURE PREVIEW (Red & Sky Blue Cards)            */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="px-3.5 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/30">
            Revolutionary 2-Box Dual Mechanism
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-heading mt-3 mb-2">
            डैशबोर्ड के दो मुख्य कार्ड्स (Two Main System Boxes)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            हर सदस्य के डैशबोर्ड पर दोनों बॉक्स हमेशा आमने-सामने सक्रिय रहते हैं।
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Box 1 Preview: Provide Help (Matches Minute Timer Box: Fuchsia/Purple) */}
          <div className="rounded-3xl bg-gradient-to-b from-purple-950 via-[#27073b] to-purple-950 border-2 border-fuchsia-400 shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-fuchsia-500/40 pb-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-purple-900 border-2 border-fuchsia-300 shadow-lg">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs sm:text-sm font-black text-white font-heading uppercase tracking-wider">
                    PROVIDE HELP
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-xs font-mono shadow">
                  ₹50 + ₹100
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">1. सहायता प्रदान करें (Provide Help Phase)</h4>
                <p className="text-xs text-purple-100 leading-relaxed">
                  प्रत्येक चक्र में दो चरण होते हैं:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-purple-900/60 border border-fuchsia-800/80 flex items-center justify-between">
                    <span className="font-semibold text-white">स्टेप 1: वेरिफिकेशन लिंक (₹50)</span>
                    <span className="font-mono font-bold text-emerald-300 bg-black/40 px-2 py-0.5 rounded">₹50</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-900/60 border border-fuchsia-800/80 flex items-center justify-between">
                    <span className="font-semibold text-white">स्टेप 2: सेकंड लिंक (₹100)</span>
                    <span className="font-mono font-bold text-emerald-300 bg-black/40 px-2 py-0.5 rounded">₹100</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-fuchsia-400/30 text-[11px] text-fuchsia-200">
                  ⚡ 100% सदस्य-से-सदस्य डायरेक्ट UPI ट्रांसफर। UTR नंबर व स्लिप अपलोड की तुरंत सुविधा।
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-fuchsia-500/30 flex items-center justify-between text-xs text-purple-200">
              <span>कुल प्रदान राशि:</span>
              <span className="font-mono font-black text-emerald-300 text-sm">₹150 प्रति चक्र</span>
            </div>
          </div>

          {/* Box 2 Preview: Receive Help (Matches Second Timer Box: Cyan/Teal) */}
          <div className="rounded-3xl bg-gradient-to-b from-cyan-950 via-[#032428] to-teal-950 border-2 border-cyan-300 shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-400/40 pb-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-teal-600 to-teal-900 border-2 border-cyan-200 shadow-lg">
                  <Repeat className="w-3.5 h-3.5 text-white font-black" />
                  <span className="text-xs sm:text-sm font-black text-white font-heading uppercase tracking-wider">
                    RECEIVE HELP
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs font-mono shadow">
                  ₹200
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">2. सहायता प्राप्त करें (Receive Help Phase)</h4>
                <p className="text-xs text-cyan-100 leading-relaxed">
                  प्रोवाइड हेल्प पूरा करने और 12-घंटे का टाइमर समाप्त होने पर:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-teal-900/60 border border-teal-800/80 flex items-center justify-between">
                    <span className="font-semibold text-white">12-घंटे सर्वर मैच्योरिटी टाइमर</span>
                    <span className="font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded">12:00:00</span>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-900/60 border border-teal-800/80 flex items-center justify-between">
                    <span className="font-semibold text-white">सीधा बैंक/UPI भुगतान प्राप्ति</span>
                    <span className="font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded">₹200 (+₹50 Net)</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-400/30 text-[11px] text-cyan-200">
                  🎯 प्राप्तकर्ता खुद स्लिप देखकर ₹200 "ACCEPT" करता है और राशि तुरंत उसके टोटल रिसीव में दर्ज होती है।
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-cyan-400/30 flex items-center justify-between text-xs text-cyan-200">
              <span>शुद्ध लाभ (Net Benefit):</span>
              <span className="font-mono font-black text-amber-300 text-sm">+₹50 शुद्ध लाभ हर चक्र में</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PLAN CYCLE VISUALIZER (4-Step Animated Roadmap)                        */}
      {/* ========================================================================= */}
      <section id="plan-cycle-visualizer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3.5 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-500/30">
            Step-by-Step Mechanism
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-heading mt-3 mb-2">
            HELP150 साइकिल कैसे पूरा होता है?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            सरल, पारदर्शी और निरंतर चलने वाला रिवॉल्विंग कम्युनिटी मॉडल
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 hover:border-amber-400/60 shadow-xl transition-all relative flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-300 items-center justify-center font-black text-base border border-amber-500/40">
                  1
                </span>
                <span className="font-mono text-xs font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  ₹50 LINK
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                वेरिफिकेशन सहायता (₹50)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                आईडी एक्टिवेशन हेतु पहला लिंक प्राप्त होता है। ₹50 का सीधा UPI पेमेंट करें और 12-अंकों का UTR नंबर व स्लिप सबमिट करें।
              </p>
            </div>
            <div className="text-[11px] text-amber-300/90 font-semibold pt-3 border-t border-slate-800 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>सत्यापन के बाद स्टेप 2 अनलॉक</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 hover:border-red-400/60 shadow-xl transition-all relative flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-11 w-11 rounded-2xl bg-red-500/20 text-red-300 items-center justify-center font-black text-base border border-red-500/40">
                  2
                </span>
                <span className="font-mono text-xs font-black text-red-300 bg-red-500/10 px-2.5 py-1 rounded-full">
                  ₹100 LINK
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                सेकंड लिंक सहायता (₹100)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                कम्युनिटी सदस्य को ₹100 सहायता प्रदान करें। रसीद अपलोड करें। प्राप्तकर्ता द्वारा पुष्टि होते ही प्रोवाइड हेल्प पूर्ण होता है।
              </p>
            </div>
            <div className="text-[11px] text-red-300/90 font-semibold pt-3 border-t border-slate-800 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>कुल सहायता ₹150 संपन्न</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 hover:border-cyan-400/60 shadow-xl transition-all relative flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-11 w-11 rounded-2xl bg-cyan-500/20 text-cyan-300 items-center justify-center font-black text-base border border-cyan-500/40">
                  3
                </span>
                <span className="font-mono text-xs font-black text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full">
                  12h TIMER
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                12-घंटे मैच्योरिटी टाइमर
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                सिस्टम पर 12-घंटे का सर्वर-सिंक्रनाइज़्ड टाइमर चलता है। यह टाइमर रिफ्रेश से रीसेट नहीं होता और पूर्ण सुरक्षा सुनिश्चित करता है।
              </p>
            </div>
            <div className="text-[11px] text-cyan-300/90 font-semibold pt-3 border-t border-slate-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
              <span>टाइमर खत्म होते ही रिसीव लिंक</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 hover:border-emerald-400/60 shadow-xl transition-all relative flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-11 w-11 rounded-2xl bg-emerald-500/20 text-emerald-300 items-center justify-center font-black text-base border border-emerald-500/40">
                  4
                </span>
                <span className="font-mono text-xs font-black text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  ₹200 RECEIVE
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                ₹200 सहायता प्राप्त करें
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                आपके बैंक खाते में ₹200 का भुगतान प्राप्त होता है। स्लिप देखकर "ACCEPT" दबाएं। +₹50 का शुद्ध लाभ आपके वॉलेट में जुड़ता है!
              </p>
            </div>
            <div className="text-[11px] text-emerald-300/90 font-semibold pt-3 border-t border-slate-800 flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5 text-emerald-400" />
              <span>अगला साइकिल ऑटो री-एंट्री</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. INTERACTIVE 6-LEVEL REFERRAL INCOME CALCULATOR                         */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#0F112E] via-[#14183E] to-[#0A0D24] border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/40">
                Unlimited Growth Potential
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white font-heading mt-3 mb-2">
                6-लेवल रेफरल इनकम कैलकुलेटर
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                प्रत्येक सक्रिय डायरेक्ट सदस्य पर 6-लेवल तक स्वचालित आय प्राप्त करें
              </p>
            </div>

            {/* Interactive Direct Referrals Slider */}
            <div className="max-w-xl mx-auto mb-10 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-bold text-slate-200">
                  आपके डायरेक्ट स्पॉन्सर सदस्य (Direct Referrals):
                </span>
                <span className="font-mono text-xl font-black text-amber-400 bg-amber-500/20 px-3 py-0.5 rounded-lg border border-amber-400/40">
                  {teamSizeInput} Members
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={teamSizeInput}
                onChange={(e) => setTeamSizeInput(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>2 Members</span>
                <span>3 Members</span>
                <span>5 Members</span>
                <span>10 Members</span>
              </div>
            </div>

            {/* 6-Level Grid Table */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Level 1 (Direct)</div>
                <div className="text-xl font-black text-amber-400 mt-1">5%</div>
                <div className="text-[10px] text-emerald-400 mt-1">₹7.50 / हेल्प</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Level 2</div>
                <div className="text-xl font-black text-cyan-400 mt-1">4%</div>
                <div className="text-[10px] text-emerald-400 mt-1">₹6.00 / हेल्प</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Level 3</div>
                <div className="text-xl font-black text-purple-400 mt-1">3%</div>
                <div className="text-[10px] text-emerald-400 mt-1">₹4.50 / हेल्प</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Level 4</div>
                <div className="text-xl font-black text-rose-400 mt-1">2%</div>
                <div className="text-[10px] text-emerald-400 mt-1">₹3.00 / हेल्प</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Level 5</div>
                <div className="text-xl font-black text-emerald-400 mt-1">1%</div>
                <div className="text-[10px] text-emerald-400 mt-1">₹1.50 / हेल्प</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Level 6</div>
                <div className="text-xl font-black text-indigo-400 mt-1">0.5%</div>
                <div className="text-[10px] text-emerald-400 mt-1">₹0.75 / हेल्प</div>
              </div>
            </div>

            {/* Estimated Total Projected Potential Box */}
            <div className="max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                  <Award className="h-4 w-4" />
                  <span>अनुमानित संभावित टीम आय (Estimated Team Yield):</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                  ₹{calculateReferralEarning(teamSizeInput).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  {teamSizeInput} डायरेक्ट डुप्लीकेशन पर 6-लेवल पूर्ण टीम का रिवॉर्ड
                </div>
              </div>

              <button
                onClick={onOpenRegister}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                अपनी टीम बनाना शुरू करें ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PROMINENT RED + BLUE GRADIENT REFERRAL LINK WIDGET                     */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <ReferralBox />
      </section>

      {/* ========================================================================= */}
      {/* 10. THREE CORE PILLARS OF HELP150                                         */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            कम्युनिटी के 3 मुख्य पारदर्शी स्तंभ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            बिना किसी अस्पष्टता के 100% सटीक और नियमों पर आधारित मंच
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-amber-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-5">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1. सामुदायिक सहयोग (Mutual Aid)</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                स्वैच्छिक पीयर-टू-पीयर सहायता मॉडल। सदस्य सीधे साथी सदस्यों को सहायता प्रदान करते हैं, बिना किसी मध्यस्थ कंपनी या वॉलेट के।
              </p>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>₹150 का सरल व सुरक्षित साइकिल</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>प्रत्यक्ष UPI व बैंक UTR द्वारा सत्यापन</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-blue-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5">
                <ReceiptText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">2. पारदर्शी बहीखाता (Audited Ledger)</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                प्रत्येक लेनदेन का प्रेषक व प्राप्तकर्ता आईडी, यूटीआर और समय-मुहर रिकॉर्ड होता है। किसी भी प्रकार की बनावटी या छुपी हुई कटौती नहीं।
              </p>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>अपरिवर्तनीय डिजिटल ऑडिट लॉग्स</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>24 घंटे में भुगतान न करने पर ऑटो-ब्लॉक</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-emerald-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5">
                <SlidersHorizontal className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">3. सुरक्षित डैशबोर्ड (Bank-Grade KYC)</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                12-घंटे का लाइव सर्वर टाइमर, लेवल 1-6 टीम एनालिटिक्स, आधार/पैन आधारित सुरक्षा और त्वरित सहायता डेस्क उपलब्ध।
              </p>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>12:00:00 सर्वर-सिंक्रनाइज़्ड काउंटडाउन</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>₹200 के गुणक में सीधी निकासी</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. REAL-TIME COMMUNITY PLATFORM STATS                                    */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-400" />
                <span>प्लेटफ़ॉर्म लाइव आंकड़े (Real-Time Community Stats)</span>
              </h3>
              <p className="text-xs text-slate-400">
                सत्यापित लेनदेन और वास्तविक सदस्यों द्वारा संचालित
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>लाइव सर्वर संचालित</span>
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 font-medium">कुल पंजीकृत सदस्य</div>
              <div className="text-2xl sm:text-3xl font-black text-white font-heading mt-1">
                {stats.totalUsers}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">सक्रिय आईडीज़</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 font-medium">सत्यापित सहायता चक्र</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-heading mt-1">
                {stats.activeHelps}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">₹150 पूर्ण सहायता</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 font-medium">कुल सहायता वॉल्यूम</div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-heading mt-1">
                ₹{stats.totalVolume.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">डायरेक्ट P2P ट्रांसफर</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 font-medium">सुरक्षित टाइमर विंडो</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
                12:00:00
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">ऑटोमैटिक मैच्योरिटी</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FAQ ACCORDION SECTION (Bilingual)                                     */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-8">
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider border border-slate-700">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading mt-2">
            अक्सर पूछे जाने वाले सवाल (FAQ)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            कम्युनिटी नियमों और प्रक्रिया के बारे में संपूर्ण स्पष्टता
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-white hover:text-amber-300 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90 text-amber-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. JOIN TELEGRAM & WHATSAPP COMMUNITY SECTION                            */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-black text-white font-heading flex items-center gap-2 justify-center sm:justify-start">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
              <span>HELP150 आधिकारिक सोशल कम्युनिटी</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-lg">
              प्री-लॉन्च की सभी ताजा अपडेट, ज़ूम मीटिंग्स और लीडर ट्रेनिंग के लिए आधिकारिक व्हाट्सएप व टेलीग्राम ग्रुप से अवश्य जुड़ें।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://t.me/help150_official"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow"
            >
              <Send className="h-4 w-4" />
              <span>Telegram चैनल</span>
            </a>

            <button
              onClick={handleShareWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp ग्रुप</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. RICH FOOTER                                                           */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-800/80 pt-12 text-slate-400 text-xs max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base">
                H
              </div>
              <span className="text-xl font-bold text-white font-heading">
                HELP<span className="text-amber-400">150</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Community Mutual Help • Transparent Ledger • Bank-Grade Security • 100% Peer-to-Peer Direct Transfers
            </p>
            <div className="text-[11px] text-amber-300 font-mono">
              Official Helpline: +91 70664 63676
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">प्लेटफ़ॉर्म नेविगेशन</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={handleDownloadPdf} className="hover:text-amber-300 transition cursor-pointer flex items-center gap-1.5 text-amber-300 font-bold">
                  <Download className="h-3.5 w-3.5" />
                  <span>ऑफिशियल बिजनेस प्लान (PDF)</span>
                </button>
              </li>
              <li>
                <button onClick={() => setIsPlanModalOpen(true)} className="hover:text-amber-300 transition cursor-pointer flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-cyan-400" />
                  <span>प्लान स्लाइड्स देखें</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('help')} className="hover:text-amber-300 transition cursor-pointer">
                  ₹150 सहायता साइकिल
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('wallet')} className="hover:text-amber-300 transition cursor-pointer">
                  वॉलेट व लेन-देन विवरण
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('referral')} className="hover:text-amber-300 transition cursor-pointer">
                  लेवल 1 से 6 रेफरल ट्री
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('withdrawal')} className="hover:text-amber-300 transition cursor-pointer">
                  ₹200 गुणक में निकासी
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">सुरक्षा व सहायता</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('kyc')} className="hover:text-amber-300 transition cursor-pointer">
                  आधार / पैन KYC प्रमाणीकरण
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('support')} className="hover:text-amber-300 transition cursor-pointer">
                  24x7 सपोर्ट टिकट डेस्क
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('rules')} className="hover:text-amber-300 transition cursor-pointer">
                  कम्युनिटी नियम व शर्तें
                </button>
              </li>
              <li>
                <span className="text-slate-500">अपरिवर्तनीय ऑडिट लॉग्स</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">वैधानिक अस्वीकरण</h4>
            <div className="text-[10px] leading-relaxed text-slate-400 bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <p>
                HELP150 विशुद्ध रूप से स्वैच्छिक पीयर-टू-पीयर सामुदायिक सहायता पोर्टल है। यह कोई एनबीएफसी, बैंक, या गारंटीड रिटर्न स्कीम नहीं है।
              </p>
              <p className="text-slate-500">
                सभी लेनदेन सदस्यों के आपसी बैंक/UPI खातों के माध्यम से होते हैं।
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pb-8">
          <p>© {new Date().getFullYear()} HELP150 Community Platform. All rights reserved.</p>
          <p className="text-amber-400 font-semibold">“Together For A Better Tomorrow”</p>
        </div>
      </footer>

      {/* Interactive Plan Presentation & Download Modal */}
      <PlanPresentationModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />
    </div>
  );
};

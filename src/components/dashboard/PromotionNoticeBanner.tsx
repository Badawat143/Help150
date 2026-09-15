/**
 * HELP150 — 4-Day Pre-Launch Promotion Notice Banner
 * Shown to all members on Dashboard and Helping sections while links are in Promotion/OFF mode.
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Share2,
  Users,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface PromotionNoticeBannerProps {
  compact?: boolean;
}

export const PromotionNoticeBanner: React.FC<PromotionNoticeBannerProps> = ({ compact = false }) => {
  const { currentUser, setActiveTab } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState(() => db.getState().settings);
  const [copied, setCopied] = useState(false);

  // Live countdown
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    days: 4,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setSettings(db.getState().settings);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = Date.now();
      const end = new Date(settings.promotionEndDate || Date.now() + 4 * 24 * 3600000).getTime();
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
  }, [settings.promotionEndDate]);

  const referralCode = currentUser?.referralCode || currentUser?.id || 'H150-MEMBER';
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://help150.org/?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('रेफरल लिंक कॉपी हो गया! अपनी टीम को शेयर करें।', 'Link Copied');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🙏 नमस्कार! HELP150 कम्युनिटी का विशेष 4-दिवसीय प्री-लॉन्च प्रमोशन चल रहा है!\n\n` +
      `📌 अभी रजिस्टर करें और अपनी टीम बनाएं। 4 दिन बाद ऑटोमैटिक हेल्पिंग लिंक्स शुरू होंगे!\n` +
      `🔗 मेरा जॉइनिंग लिंक: ${referralUrl}\n` +
      `🔑 स्पांसर कोड: ${referralCode}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const isLinksOn = settings.linkSystemEnabled ?? false;

  // When links are ON (Live mode), display a sleek notification chip
  if (isLinksOn) {
    if (compact) return null;
    return (
      <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-emerald-200 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 rounded-lg bg-emerald-500/20 items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-white">🟢 ऑटोमैटिक हेल्पिंग लिंक्स लाइव हैं: </span>
            Provide Help (₹50/₹100) और Receive Help (₹200) लिंक्स ऑटोमैटिक डिस्पैच हो रहे हैं।
          </div>
        </div>
        <button
          onClick={() => setActiveTab('help')}
          className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shrink-0 transition flex items-center gap-1 cursor-pointer"
        >
          <span>कार्ड्स देखें</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // When links are OFF (Promotion Mode Active)
  return (
    <div className="mb-6 rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#0F1026] via-[#15193B] to-[#0A0D22] border-2 border-amber-400/80 shadow-2xl shadow-indigo-950/80 relative overflow-hidden">
      {/* Decorative ambient color spots */}
      <div className="absolute top-0 right-0 h-48 w-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-48 w-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Row: Badges and Exact Provide Help / Receive Help Pills from user's image */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-4 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md">
            <Megaphone className="h-3.5 w-3.5 fill-current" />
            <span>4-दिन प्री-लॉन्च प्रमोशन (LIVE COUNTDOWN)</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/50 text-red-300 text-xs font-bold animate-pulse">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>लिंक्स अभी बंद हैं • लाइव टाइमर जारी</span>
          </span>
        </div>

        {/* Exact Provide Help & Receive Help Capsules matching Minute & Second Timer Boxes */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('box-provide-help');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-purple-700 hover:from-fuchsia-400 hover:to-purple-600 border-2 border-white shadow-lg shadow-purple-900/40 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-white"
            title="Provide Help Card (हल्का मिनट टाइमर बॉक्स रंग)"
          >
            <span className="text-base sm:text-lg">🔥</span>
            <span className="text-xs sm:text-sm font-black tracking-wider text-white font-heading uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              PROVIDE HELP
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('box-receive-help');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-teal-500 to-teal-700 hover:from-cyan-300 hover:to-teal-600 border-2 border-white shadow-lg shadow-teal-900/40 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-white"
            title="Receive Help Card (हल्का सेकंड टाइमर बॉक्स रंग)"
          >
            <RotateCw className="w-3.5 h-3.5 text-white font-black stroke-[2.5]" />
            <span className="text-xs sm:text-sm font-black tracking-wider text-white font-heading uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              RECEIVE HELP
            </span>
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left Column: Promotion Title & Message */}
        <div className="space-y-3 max-w-xl">
          <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white font-heading tracking-tight leading-snug">
            {settings.promotionNoticeTitle || '🎉 4-दिवसीय प्री-लॉन्च प्रमोशन अवधि सक्रिय है!'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {settings.promotionNoticeText ||
              'वर्तमान में 4 दिन का विशेष प्रमोशन चल रहा है। अभी लिंक्स बंद हैं ताकि सभी सदस्य रजिस्ट्रेशन करें, अपनी बड़ी टीम बनाएं और KYC पूरा करें। 4 दिन पूरे होते ही ऑटोमैटिक हेल्पिंग लिंक्स शुरू कर दिए जाएंगे!'}
          </p>

          {/* Referral Link Quick Copy Bar */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-xl bg-slate-950/90 border border-amber-500/40 text-xs font-mono text-amber-300 truncate">
              {referralUrl}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'कॉपी हुआ!' : 'कॉपी लिंक'}</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer shrink-0"
                title="Share on WhatsApp"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: BIG & COLORFUL 4-DAY COUNTDOWN TIMER DISPLAY */}
        <div className="w-full lg:w-auto shrink-0 bg-gradient-to-b from-slate-950/90 via-[#0B0D1F] to-slate-950 border-2 border-indigo-500/50 rounded-3xl p-4 sm:p-5 text-center shadow-2xl relative overflow-hidden">
          <div className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 animate-spin text-amber-400" />
            <span>ऑटो लिंक शुरू होने में समय शेष</span>
          </div>

          {/* 4 Extra-Large, Vibrant, Colorful Timer Boxes */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. DAYS (Vibrant Ruby / Red Box) */}
            <div className="flex flex-col items-center bg-gradient-to-b from-rose-600 via-red-600 to-rose-950 border-2 border-rose-400/90 rounded-2xl p-2 sm:p-3 min-w-[68px] sm:min-w-[85px] shadow-lg shadow-rose-900/40 transform hover:scale-105 transition-transform">
              <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {countdown.days}
              </div>
              <div className="mt-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-400/50 text-[9px] sm:text-[10px] font-black text-rose-200 uppercase tracking-wider">
                दिन (Days)
              </div>
            </div>

            {/* 2. HOURS (Vibrant Amber / Sunset Orange Box) */}
            <div className="flex flex-col items-center bg-gradient-to-b from-amber-500 via-orange-600 to-amber-950 border-2 border-amber-300/90 rounded-2xl p-2 sm:p-3 min-w-[68px] sm:min-w-[85px] shadow-lg shadow-orange-900/40 transform hover:scale-105 transition-transform">
              <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {countdown.hours.toString().padStart(2, '0')}
              </div>
              <div className="mt-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-300/50 text-[9px] sm:text-[10px] font-black text-amber-200 uppercase tracking-wider">
                घंटे (Hrs)
              </div>
            </div>

            {/* 3. MINUTES (Vibrant Neon Fuchsia / Purple Box) */}
            <div className="flex flex-col items-center bg-gradient-to-b from-fuchsia-600 via-purple-600 to-purple-950 border-2 border-fuchsia-400/90 rounded-2xl p-2 sm:p-3 min-w-[68px] sm:min-w-[85px] shadow-lg shadow-purple-900/40 transform hover:scale-105 transition-transform">
              <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {countdown.minutes.toString().padStart(2, '0')}
              </div>
              <div className="mt-1.5 px-2 py-0.5 rounded-full bg-purple-950/80 border border-fuchsia-400/50 text-[9px] sm:text-[10px] font-black text-fuchsia-200 uppercase tracking-wider">
                मिनट (Min)
              </div>
            </div>

            {/* 4. SECONDS (Vibrant Radiant Cyan / Emerald Box) */}
            <div className="flex flex-col items-center bg-gradient-to-b from-cyan-500 via-teal-600 to-teal-950 border-2 border-cyan-300/90 rounded-2xl p-2 sm:p-3 min-w-[68px] sm:min-w-[85px] shadow-lg shadow-cyan-900/40 transform hover:scale-105 transition-transform">
              <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-pulse">
                {countdown.seconds.toString().padStart(2, '0')}
              </div>
              <div className="mt-1.5 px-2 py-0.5 rounded-full bg-teal-950/80 border border-cyan-300/50 text-[9px] sm:text-[10px] font-black text-cyan-200 uppercase tracking-wider">
                सेकंड (Sec)
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800 text-[11px] text-amber-300/90 font-bold flex items-center justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>काउंटडाउन पूरा होते ही सभी सदस्यों को ऑटोमैटिक लिंक्स डिस्पैच होंगे</span>
          </div>
        </div>
      </div>
    </div>
  );
};

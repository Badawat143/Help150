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
    <div className="mb-5 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-amber-950/80 via-slate-900 to-indigo-950/80 border-2 border-amber-500/80 shadow-xl shadow-amber-950/40 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Left Column: Promotion Title, Message & Explainer */}
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md">
              <Megaphone className="h-3.5 w-3.5 fill-current" />
              <span>4-दिन प्री-लॉन्च प्रमोशन (Promotion Active)</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-bold">
              <span>🔴 लिंक्स अभी बंद हैं • टीम निर्माण का सुनहरा अवसर</span>
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white font-heading tracking-tight leading-snug">
            {settings.promotionNoticeTitle || '🎉 4-दिवसीय प्री-लॉन्च प्रमोशन अवधि सक्रिय है!'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {settings.promotionNoticeText ||
              'वर्तमान में 4 दिन का विशेष प्रमोशन चल रहा है। अभी लिंक्स बंद हैं ताकि सभी सदस्य रजिस्ट्रेशन करें, अपनी बड़ी टीम बनाएं और KYC पूरा करें। 4 दिन पूरे होते ही ऑटोमैटिक हेल्पिंग लिंक्स शुरू कर दिए जाएंगे!'}
          </p>

          {/* Referral Link Quick Copy Bar */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
            <div className="flex-1 px-3 py-2 rounded-xl bg-slate-950/90 border border-amber-500/40 text-[11px] font-mono text-amber-300 truncate">
              {referralUrl}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'कॉपी हुआ!' : 'कॉपी लिंक'}</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer shrink-0"
                title="Share on WhatsApp"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 4-Day Countdown Display Box */}
        <div className="w-full md:w-auto shrink-0 bg-slate-950/80 border border-amber-500/50 rounded-2xl p-4 text-center shadow-lg">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5 animate-pulse text-amber-400" />
            <span>ऑटो लिंक शुरू होने में समय शेष</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 min-w-[54px]">
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {countdown.days}
              </div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">दिन (Days)</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 min-w-[54px]">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {countdown.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">घंटे (Hrs)</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 min-w-[54px]">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {countdown.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">मिनट (Min)</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 min-w-[54px]">
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {countdown.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">सेकंड (Sec)</div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-medium">
            प्रमोशन के बाद सभी सदस्यों को ऑटोमैटिक लिंक्स जाएंगे
          </div>
        </div>
      </div>
    </div>
  );
};

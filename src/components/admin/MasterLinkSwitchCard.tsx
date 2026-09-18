/**
 * HELP150 — Master Link System Switch & 4-Day Promotion Control Card
 * Allows the administrator to toggle links ON/OFF, manage the 4-day pre-launch promotion,
 * and view live promotion countdown status.
 */

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Power,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Share2,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  RefreshCw,
} from 'lucide-react';
import { db } from '../../services/db';
import { useToast } from '../../context/ToastContext';

interface MasterLinkSwitchCardProps {
  onRefresh?: () => void;
}

export const MasterLinkSwitchCard: React.FC<MasterLinkSwitchCardProps> = ({ onRefresh }) => {
  const toast = useToast();
  const [settings, setSettings] = useState(() => db.getState().settings);
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [promotionDays, setPromotionDays] = useState(settings.promotionDaysTotal || 7);
  const [noticeTitle, setNoticeTitle] = useState(settings.promotionNoticeTitle || '🎉 7-दिवसीय प्री-लॉन्च प्रमोशन सक्रिय (3 दिन का समय बढ़ाया गया)');
  const [noticeText, setNoticeText] = useState(settings.promotionNoticeText || 'विशेष सूचना: लिंक स्टार्ट होने का समय 3 दिन और बढ़ा दिया गया है! वर्तमान में 7 दिन का विशेष प्रमोशन चल रहा है। सभी सदस्य रजिस्ट्रेशन करें, अपनी बड़ी टीम बनाएं और KYC पूरा करें। टाइमर समाप्त होते ही ऑटोमैटिक हेल्पिंग लिंक्स शुरू हो जाएंगे!');
  const [isProcessing, setIsProcessing] = useState(false);

  // Live countdown timer for the promotion
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  // Sync settings on db updates
  useEffect(() => {
    const unsub = db.subscribe(() => {
      const current = db.getState().settings;
      setSettings(current);
      setPromotionDays(current.promotionDaysTotal || 7);
      setNoticeTitle(current.promotionNoticeTitle || '🎉 7-दिवसीय प्री-लॉन्च प्रमोशन सक्रिय (3 दिन का समय बढ़ाया गया)');
      setNoticeText(current.promotionNoticeText || '');
    });
    return () => unsub();
  }, []);

  // Calculate remaining promotion time
  useEffect(() => {
    const calculateCountdown = () => {
      const now = Date.now();
      const end = new Date(settings.promotionEndDate || Date.now() + 7 * 24 * 3600000).getTime();
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

  const handleToggleLinkSystem = async (enabled: boolean) => {
    setIsProcessing(true);
    try {
      db.toggleLinkSystem(enabled, promotionDays);
      if (enabled) {
        toast.success(
          'ऑटोमैटिक हेल्पिंग लिंक्स सफलतापूर्वक चालू कर दिए गए हैं! (Automatic Links are now LIVE)',
          'Links Turned ON'
        );
      } else {
        toast.warning(
          `प्रमोशन मोड चालू कर दिया गया है। लिंक्स विराम पर हैं। (Links Paused for ${promotionDays}-Day Promotion)`,
          'Promotion Mode Active'
        );
      }
      onRefresh?.();
    } catch (err: any) {
      toast.error('Failed to update link system status', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickExtend = (days: number = 3) => {
    setIsProcessing(true);
    try {
      db.extendPromotionDays(days);
      toast.success(
        `प्रमोशन में ${days} दिन का समय सफलतापूर्वक बढ़ा दिया गया है! नया काउंटडाउन लाइव हो गया है।`,
        'Time Extended'
      );
      onRefresh?.();
    } catch (err: any) {
      toast.error('समय बढ़ाने में त्रुटि आई', 'Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNotice = () => {
    db.updatePromotionConfig({
      promotionDaysTotal: Number(promotionDays),
      promotionNoticeTitle: noticeTitle.trim(),
      promotionNoticeText: noticeText.trim(),
    });
    setIsEditingNotice(false);
    toast.success('प्रमोशन सेटिंग्स और संदेश सफलतापूर्वक अपडेट हो गए!', 'Saved');
    onRefresh?.();
  };

  const isEnabled = settings.linkSystemEnabled ?? false;

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border-2 transition-all duration-300 shadow-xl ${
      isEnabled
        ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-emerald-500 shadow-emerald-950/30'
        : 'bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-amber-500/80 shadow-amber-950/30'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Status Information */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border ${
              isEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                : 'bg-red-500/20 text-red-300 border-red-500/50'
            }`}>
              <span className="h-2 w-2 rounded-full animate-ping inline-block bg-current" />
              <span>{isEnabled ? '🟢 LINKS STATUS: ON (ऑटोमैटिक लिंक चालू)' : '🔴 LINKS STATUS: OFF (प्रमोशन मोड चालू)'}</span>
            </div>

            {!isEnabled && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                <span>
                  प्रमोशन शेष: {countdown.days} दिन {countdown.hours.toString().padStart(2, '0')}:
                  {countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
                </span>
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-black text-white font-heading tracking-wide">
            {isEnabled
              ? '⚡ स्वचालित लिंक डिस्पेच सक्रिय है (Automatic Peer Links Active)'
              : `📢 ${settings.promotionDaysTotal || 7}-दिवसीय प्री-लॉन्च प्रमोशन मोड (Links Paused for Promotion)`}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isEnabled
              ? 'सिस्टम स्वचालित रूप से नए सदस्यों को Provide Help (₹50 / ₹100) और Receive Help (₹200) लिंक्स भेज रहा है।'
              : `वर्तमान में ${settings.promotionDaysTotal || 7} दिन का प्रमोशन चल रहा है (लिंक स्टार्ट होने का समय 3 दिन बढ़ाया गया है)। अभी लिंक्स रोके गए हैं ताकि सदस्य ज्यादा से ज्यादा टीम बना सकें। टाइमर पूरा होते ही ऑटोमैटिक लिंक जाने लगेंगे।`}
          </p>
        </div>

        {/* Right Toggle Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isEnabled && (
            <button
              onClick={() => handleQuickExtend(3)}
              disabled={isProcessing}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition cursor-pointer disabled:opacity-50"
              title="काउंटडाउन टाइमर में 3 दिन का अतिरिक्त समय जोड़ें"
            >
              <Clock className="h-4 w-4 text-slate-950" />
              <span>+3 दिन समय बढ़ाएं (+3 Days)</span>
            </button>
          )}

          {isEnabled ? (
            <button
              onClick={() => handleToggleLinkSystem(false)}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <Power className="h-4 w-4" />
              <span>🔴 लिंक्स बंद करें (Start Promotion Mode)</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleLinkSystem(true)}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition cursor-pointer disabled:opacity-50"
            >
              <Zap className="h-4 w-4 text-slate-950 fill-current" />
              <span>🟢 तुरंत लिंक चालू करें (Start Automatic Links Now)</span>
            </button>
          )}

          <button
            onClick={() => setIsEditingNotice(!isEditingNotice)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="प्रमोशन सेटिंग्स व नोटिस संपादित करें"
          >
            <Settings className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Settings</span>
            {isEditingNotice ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Promotion Settings Panel */}
      {isEditingNotice && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3.5 bg-slate-950/60 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              प्रमोशन अवधि एवं यूज़र नोटिस कॉन्फ़िगरेशन (Promotion & Notice Settings)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                प्रमोशन कुल दिन (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={promotionDays}
                onChange={(e) => setPromotionDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                प्रमोशन बैनर शीर्षक (Banner Title)
              </label>
              <input
                type="text"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              सदस्यों को दिखने वाला संदेश (Promotion Message for Members)
            </label>
            <textarea
              rows={2}
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setIsEditingNotice(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNotice}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Save className="h-3.5 w-3.5" />
              <span>सेव करें (Save Settings)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

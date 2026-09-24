import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Phone,
  Send,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { UserHelpCycle, HelpRequest } from '../../types';

interface ActiveLinkArrivalNotificationProps {
  onGoToLinkBox?: () => void;
}

export const ActiveLinkArrivalNotification: React.FC<ActiveLinkArrivalNotificationProps> = ({
  onGoToLinkBox,
}) => {
  const { currentUser } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasDismissedPopup, setHasDismissedPopup] = useState(() => {
    return typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('HELP150_DISMISSED_LINK_POPUP') === 'true'
      : false;
  });

  // Fetch active cycle & requests
  const cycle = useMemo(() => {
    if (!currentUser?.id) return null;
    return db.getUserHelpCycle(currentUser.id);
  }, [currentUser?.id, db.getState().helpCycles]);

  const activeOutgoingRequest = useMemo(() => {
    if (!currentUser?.id) return null;
    const all = db.getState().helpRequests || [];
    return all.find(
      (r) =>
        r.userId === currentUser.id &&
        r.type === 'give_help' &&
        ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'pending_match', 'matched'].includes(
          r.status
        )
    );
  }, [currentUser?.id, db.getState().helpRequests]);

  // Determine active step
  const step1 = cycle?.verificationLink;
  const step2 = cycle?.secondLink;

  const isStep1Done = step1?.status === 'completed' || step1?.status === 'accepted';
  const isStep2Done = step2?.status === 'completed' || step2?.status === 'accepted';

  const isStep1Active =
    !isStep1Done &&
    cycle?.status !== 'maturation_timer' &&
    cycle?.status !== 'receive_help' &&
    cycle?.status !== 'completed';

  const isStep2Active =
    (isStep1Done || cycle?.status === 'provide_second') &&
    !isStep2Done &&
    cycle?.status !== 'maturation_timer' &&
    cycle?.status !== 'receive_help' &&
    cycle?.status !== 'completed';

  const isAnyProvideActive = isStep1Active || isStep2Active || Boolean(activeOutgoingRequest);

  // Active Beneficiary details
  const beneficiary = useMemo(() => {
    const adminDefault = {
      name: 'Yenkanna Badawat (Admin Treasury)',
      id: 'H150-ADMIN01',
      upi: '7066463676@naviaxis',
      mobile: '7066463676',
    };

    if (isStep1Active) {
      return {
        amount: 50,
        stepName: 'Step 1: ₹50 वेरिफिकेशन लिंक',
        stepType: 'verification',
        name: activeOutgoingRequest?.matchedWithUserName || step1?.matchedWithUserName || adminDefault.name,
        id: activeOutgoingRequest?.matchedWithUserId || step1?.matchedWithUserId || adminDefault.id,
        upi: activeOutgoingRequest?.matchedWithUpi || step1?.matchedWithUpi || adminDefault.upi,
        mobile: activeOutgoingRequest?.matchedWithMobile || step1?.matchedWithMobile || adminDefault.mobile,
        status: step1?.status || activeOutgoingRequest?.status || 'pending',
        isSlipUploaded: Boolean(step1?.slipUrl || step1?.proofReference || activeOutgoingRequest?.paymentSlipUrl),
      };
    }

    if (isStep2Active) {
      return {
        amount: 100,
        stepName: 'Step 2: ₹100 सेकंड हेल्प लिंक',
        stepType: 'second',
        name: activeOutgoingRequest?.matchedWithUserName || step2?.matchedWithUserName || adminDefault.name,
        id: activeOutgoingRequest?.matchedWithUserId || step2?.matchedWithUserId || adminDefault.id,
        upi: activeOutgoingRequest?.matchedWithUpi || step2?.matchedWithUpi || adminDefault.upi,
        mobile: activeOutgoingRequest?.matchedWithMobile || step2?.matchedWithMobile || adminDefault.mobile,
        status: step2?.status || activeOutgoingRequest?.status || 'pending',
        isSlipUploaded: Boolean(step2?.slipUrl || step2?.proofReference || activeOutgoingRequest?.paymentSlipUrl),
      };
    }

    if (activeOutgoingRequest) {
      return {
        amount: activeOutgoingRequest.amount || 150,
        stepName: `P2P हेल्प लिंक (₹${activeOutgoingRequest.amount})`,
        stepType: 'p2p',
        name: activeOutgoingRequest.matchedWithUserName || adminDefault.name,
        id: activeOutgoingRequest.matchedWithUserId || adminDefault.id,
        upi: activeOutgoingRequest.matchedWithUpi || adminDefault.upi,
        mobile: activeOutgoingRequest.matchedWithMobile || adminDefault.mobile,
        status: activeOutgoingRequest.status,
        isSlipUploaded: Boolean(activeOutgoingRequest.paymentSlipUrl || activeOutgoingRequest.proofReference),
      };
    }

    return null;
  }, [isStep1Active, isStep2Active, activeOutgoingRequest, step1, step2]);

  // Live Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    if (!isAnyProvideActive || !cycle) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const deadline =
        (isStep2Active ? step2?.deadlineTime : step1?.deadlineTime) ||
        (cycle.createdAt ? new Date(cycle.createdAt).getTime() + 24 * 3600000 : now + 24 * 3600000);
      const diff = Math.max(0, deadline - now);

      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnyProvideActive, cycle, isStep2Active, step1?.deadlineTime, step2?.deadlineTime]);

  // Auto-open modal on first load if link is pending and not yet dismissed
  useEffect(() => {
    if (isAnyProvideActive && beneficiary && !beneficiary.isSlipUploaded && !hasDismissedPopup) {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAnyProvideActive, beneficiary, hasDismissedPopup]);

  const handleDismissModal = () => {
    setShowModal(false);
    setHasDismissedPopup(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('HELP150_DISMISSED_LINK_POPUP', 'true');
    }
  };

  const handleScrollToBox = () => {
    handleDismissModal();
    if (onGoToLinkBox) {
      onGoToLinkBox();
    } else {
      const el = document.getElementById('box-provide-help');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash animation
        el.classList.add('ring-4', 'ring-amber-400', 'animate-pulse');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-amber-400', 'animate-pulse');
        }, 3500);
      }
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isAnyProvideActive || !beneficiary) return null;

  const timerString = `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(beneficiary.upi)}&pn=${encodeURIComponent(
    beneficiary.name
  )}&am=${beneficiary.amount}&cu=INR&tn=${encodeURIComponent(`HELP150 ${beneficiary.stepName} from ${currentUser?.fullName || ''}`)}`;

  return (
    <>
      {/* ========================================================================= */}
      {/* 🌟 VIBRANT LINK BOX ARRIVAL TOP BANNER (यूजर को दिखाई दे की लिंक बॉक्स आया है) */}
      {/* ========================================================================= */}
      <div
        id="link-box-arrival-banner"
        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-900 p-4 sm:p-5 text-white shadow-2xl border-2 border-amber-300 relative overflow-hidden animate-fadeIn"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center shrink-0 shadow-lg animate-bounce">
              <Bell className="h-6 w-6 text-amber-200 fill-amber-300" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                  🔔 लिंक बॉक्स आ गया है!
                </span>
                <span className="font-mono text-xs font-bold text-amber-200 bg-black/30 px-2 py-0.5 rounded-lg border border-white/20">
                  {beneficiary.stepName}
                </span>
                <span className="font-mono text-xs font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-400/50">
                  राशि: ₹{beneficiary.amount}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white font-heading">
                आपको ₹{beneficiary.amount} का प्रोवाइड हेल्प लिंक प्राप्त हुआ है
              </h2>

              <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed font-medium">
                किसे पेमेंट करना है: <strong className="text-amber-200">{beneficiary.name}</strong>{' '}
                <span className="font-mono text-xs opacity-80">({beneficiary.id})</span> | UPI:{' '}
                <strong className="text-emerald-200 font-mono">{beneficiary.upi}</strong>
              </p>

              {/* Countdown & Status */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/30 font-mono font-bold text-amber-300">
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>शेष समय: {timerString}</span>
                </div>

                {beneficiary.isSlipUploaded ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>स्लिप अपलोड हो चुकी है (सत्यापन पेंडिंग)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>भुगतान व स्लिप सबमिट करें</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={handleScrollToBox}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl hover:shadow-2xl transition cursor-pointer flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <span>👉 लिंक बॉक्स पर जाएं और पेमेंट करें</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <a
                href={upiUrl}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/40 transition flex items-center justify-center gap-1 text-center"
                title="GPay / PhonePe ऐप में खोलें"
              >
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>UPI ऐप से पे करें</span>
              </a>

              <button
                onClick={() => handleCopy(beneficiary.upi, 'upi_top')}
                className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white text-xs font-mono font-bold border border-white/20 transition flex items-center gap-1 cursor-pointer"
                title="UPI ID कॉपी करें"
              >
                {copiedKey === 'upi_top' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>UPI कॉपी</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 FIRST-ARRIVAL POPUP MODAL (सीधा पॉपअप ताकि यूजर को तुरंत पता चले)      */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl max-w-md w-full p-5 sm:p-6 text-white shadow-2xl relative animate-scaleUp space-y-4">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 animate-bounce">
                <Bell className="h-8 w-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>नया लिंक बॉक्स आ गया है!</span>
              </div>

              <h3 className="text-xl font-black text-white font-heading">
                {beneficiary.stepName}
              </h3>
              <p className="text-xs text-slate-300">
                एडमिन द्वारा आपको सहायता प्रदान करने के लिए लिंक जारी कर दिया गया है। 24 घंटे के अंदर पेमेंट पूर्ण करें।
              </p>
            </div>

            {/* Link Details Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">भुगतान राशि:</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  ₹{beneficiary.amount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">प्राप्तकर्ता (Beneficiary):</span>
                <span className="font-bold text-white text-right">
                  {beneficiary.name} ({beneficiary.id})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">मोबाइल नंबर:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-slate-200">{beneficiary.mobile}</span>
                  <button
                    onClick={() => handleCopy(beneficiary.mobile, 'modal_mobile')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    {copiedKey === 'modal_mobile' ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">UPI ID:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-emerald-300">{beneficiary.upi}</span>
                  <button
                    onClick={() => handleCopy(beneficiary.upi, 'modal_upi')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    {copiedKey === 'modal_upi' ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-amber-300 font-mono font-bold">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>समय सीमा (Deadline):</span>
                </span>
                <span>{timerString}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleScrollToBox}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>👉 लिंक बॉक्स पर जाएं और स्लिप अपलोड करें</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex gap-2">
                <a
                  href={upiUrl}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 text-center"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  <span>PhonePe / GPay ऐप</span>
                </a>

                <button
                  onClick={handleDismissModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  बाद में देखें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

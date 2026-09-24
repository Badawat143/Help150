import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Gift,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { UserHelpCycle, HelpRequest } from '../../types';
import {
  playLinkArrivalChime,
  subscribeToLinkArrival,
  LinkArrivalPayload,
} from '../../services/linkArrivalEvents';

interface ActiveLinkArrivalNotificationProps {
  onGoToLinkBox?: (type?: 'provide' | 'receive') => void;
}

export const ActiveLinkArrivalNotification: React.FC<ActiveLinkArrivalNotificationProps> = ({
  onGoToLinkBox,
}) => {
  const { currentUser } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dbTick, setDbTick] = useState(0);

  // Subscribe to db state updates so dashboard reacts in real time
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  // Fetch active cycle & requests
  const cycle = useMemo(() => {
    if (!currentUser?.id) return null;
    return db.getUserHelpCycle(currentUser.id);
  }, [currentUser?.id, dbTick]);

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
  }, [currentUser?.id, dbTick]);

  // Determine active Provide steps
  const step1 = cycle?.verificationLink;
  const step2 = cycle?.secondLink;

  const isStep1Done = step1?.status === 'completed' || step1?.status === 'accepted';
  const isStep2Done = step2?.status === 'completed' || step2?.status === 'accepted';

  // Step 1 is active ONLY when not yet completed/accepted
  const isStep1Active =
    !isStep1Done &&
    cycle?.status !== 'maturation_timer' &&
    cycle?.status !== 'receive_help' &&
    cycle?.status !== 'completed';

  // Step 2 is active ONLY AFTER Step 1 is completed/accepted AND Step 2 is not completed
  const isStep2Active =
    isStep1Done &&
    !isStep2Done &&
    cycle?.status !== 'maturation_timer' &&
    cycle?.status !== 'receive_help' &&
    cycle?.status !== 'completed';

  const isAnyProvideActive = isStep1Active || isStep2Active || Boolean(activeOutgoingRequest);

  // Check for active Receive Help Link
  const isReceiveHelpActive =
    cycle?.status === 'receive_help' &&
    Boolean(cycle.receiveLink) &&
    cycle.receiveLink?.status !== 'completed';

  // Incoming payment from another user matched to currentUser
  const activeIncomingRequest = useMemo(() => {
    if (!currentUser?.id) return null;
    const all = db.getState().helpRequests || [];
    return all.find(
      (r) =>
        r.matchedWithUserId === currentUser.id &&
        r.userId !== currentUser.id &&
        ['PAYMENT_PENDING', 'SLIP_UPLOADED', 'VERIFICATION_PENDING', 'matched'].includes(r.status)
    );
  }, [currentUser?.id, dbTick]);

  const isAnyReceiveActive = isReceiveHelpActive || Boolean(activeIncomingRequest);

  // Active details (either provide or receive)
  const activeDetails = useMemo(() => {
    const adminDefault = {
      name: 'Yenkanna Badawat (Admin Treasury)',
      id: 'H150-ADMIN01',
      upi: '7066463676@naviaxis',
      mobile: '7066463676',
    };

    // Priority 1: Provide Help Step 1
    if (isStep1Active) {
      const linkId = step1?.requestId || (cycle ? `${cycle.id}-ver` : 'req-step-1');
      return {
        type: 'provide' as const,
        linkId,
        amount: 50,
        stepName: 'Step 1: ₹50 वेरिफिकेशन लिंक',
        stepType: 'verification',
        name:
          (activeOutgoingRequest?.amount && activeOutgoingRequest.amount <= 50
            ? activeOutgoingRequest.matchedWithUserName
            : null) ||
          step1?.matchedWithUserName ||
          adminDefault.name,
        id:
          (activeOutgoingRequest?.amount && activeOutgoingRequest.amount <= 50
            ? activeOutgoingRequest.matchedWithUserId
            : null) ||
          step1?.matchedWithUserId ||
          adminDefault.id,
        upi:
          (activeOutgoingRequest?.amount && activeOutgoingRequest.amount <= 50
            ? activeOutgoingRequest.matchedWithUpi
            : null) ||
          step1?.matchedWithUpi ||
          adminDefault.upi,
        mobile:
          (activeOutgoingRequest?.amount && activeOutgoingRequest.amount <= 50
            ? activeOutgoingRequest.matchedWithMobile
            : null) ||
          step1?.matchedWithMobile ||
          adminDefault.mobile,
        status: step1?.status || activeOutgoingRequest?.status || 'pending',
        isSlipUploaded: Boolean(
          step1?.slipUrl || step1?.proofReference || activeOutgoingRequest?.paymentSlipUrl
        ),
        deadlineTime: step1?.deadlineTime,
      };
    }

    // Priority 2: Provide Help Step 2
    if (isStep2Active) {
      const linkId = step2?.requestId || (cycle ? `${cycle.id}-sec` : 'req-step-2');
      return {
        type: 'provide' as const,
        linkId,
        amount: 100,
        stepName: 'Step 2: ₹100 सेकंड हेल्प लिंक (हल्का हरा)',
        stepType: 'second',
        name:
          (activeOutgoingRequest?.amount && activeOutgoingRequest.amount > 50
            ? activeOutgoingRequest.matchedWithUserName
            : null) ||
          step2?.matchedWithUserName ||
          adminDefault.name,
        id:
          (activeOutgoingRequest?.amount && activeOutgoingRequest.amount > 50
            ? activeOutgoingRequest.matchedWithUserId
            : null) ||
          step2?.matchedWithUserId ||
          adminDefault.id,
        upi:
          (activeOutgoingRequest?.amount && activeOutgoingRequest.amount > 50
            ? activeOutgoingRequest.matchedWithUpi
            : null) ||
          step2?.matchedWithUpi ||
          adminDefault.upi,
        mobile:
          (activeOutgoingRequest?.amount && activeOutgoingRequest.amount > 50
            ? activeOutgoingRequest.matchedWithMobile
            : null) ||
          step2?.matchedWithMobile ||
          adminDefault.mobile,
        status: step2?.status || activeOutgoingRequest?.status || 'pending',
        isSlipUploaded: Boolean(
          step2?.slipUrl || step2?.proofReference || activeOutgoingRequest?.paymentSlipUrl
        ),
        deadlineTime: step2?.deadlineTime,
      };
    }

    // Priority 3: P2P Outgoing Give Help
    if (activeOutgoingRequest) {
      return {
        type: 'provide' as const,
        linkId: activeOutgoingRequest.id,
        amount: activeOutgoingRequest.amount || 150,
        stepName: `P2P हेल्प लिंक (₹${activeOutgoingRequest.amount})`,
        stepType: 'p2p',
        name: activeOutgoingRequest.matchedWithUserName || adminDefault.name,
        id: activeOutgoingRequest.matchedWithUserId || adminDefault.id,
        upi: activeOutgoingRequest.matchedWithUpi || adminDefault.upi,
        mobile: activeOutgoingRequest.matchedWithMobile || adminDefault.mobile,
        status: activeOutgoingRequest.status,
        isSlipUploaded: Boolean(
          activeOutgoingRequest.paymentSlipUrl || activeOutgoingRequest.proofReference
        ),
        deadlineTime: activeOutgoingRequest.timerExpiryTime,
      };
    }

    // Priority 4: Receive Help Step (₹200)
    if (isReceiveHelpActive && cycle?.receiveLink) {
      const rec = cycle.receiveLink;
      const linkId = rec.requestId || `${cycle.id}-rec`;
      return {
        type: 'receive' as const,
        linkId,
        amount: rec.amount || 200,
        stepName: 'Step 4: ₹200 रिसीव हेल्प लिंक',
        stepType: 'receive',
        name: rec.matchedWithUserName || activeIncomingRequest?.userName || 'Community Sender',
        id: rec.matchedWithUserId || activeIncomingRequest?.userId || 'MEMBER',
        upi: rec.matchedWithUpi || activeIncomingRequest?.userUpi || '',
        mobile: rec.matchedWithMobile || activeIncomingRequest?.userMobile || '',
        status: rec.status,
        isSlipUploaded: rec.status === 'submitted' || Boolean(activeIncomingRequest?.paymentSlipUrl),
        deadlineTime: rec.deadlineTime,
      };
    }

    // Priority 5: Incoming direct member payment
    if (activeIncomingRequest) {
      return {
        type: 'receive' as const,
        linkId: activeIncomingRequest.id,
        amount: activeIncomingRequest.amount || 100,
        stepName: `इनकमिंग हेल्प लिंक (₹${activeIncomingRequest.amount})`,
        stepType: 'receive_p2p',
        name: activeIncomingRequest.userName || activeIncomingRequest.userId,
        id: activeIncomingRequest.userId,
        upi: activeIncomingRequest.userUpi || '',
        mobile: activeIncomingRequest.userMobile || '',
        status: activeIncomingRequest.status,
        isSlipUploaded:
          activeIncomingRequest.status === 'SLIP_UPLOADED' ||
          Boolean(activeIncomingRequest.paymentSlipUrl),
        deadlineTime: activeIncomingRequest.timerExpiryTime,
      };
    }

    return null;
  }, [
    isStep1Active,
    isStep2Active,
    activeOutgoingRequest,
    isReceiveHelpActive,
    activeIncomingRequest,
    step1,
    step2,
    cycle,
  ]);

  const activeLinkId = activeDetails?.linkId || null;
  const lastAnnouncedLinkId = useRef<string | null>(null);

  // Auto-play chime & open modal whenever a new link arrives
  useEffect(() => {
    if (!activeLinkId || !activeDetails) return;

    const storageKey = `HELP150_SEEN_LINK_${currentUser?.id}_${activeLinkId}`;
    const alreadySeen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey) === 'true';

    if (lastAnnouncedLinkId.current !== activeLinkId) {
      lastAnnouncedLinkId.current = activeLinkId;

      // Play audio chime if this link wasn't seen yet in this session
      if (!alreadySeen) {
        playLinkArrivalChime();
        setShowModal(true);
      }
    }
  }, [activeLinkId, activeDetails, currentUser?.id]);

  // Subscribe to inter-tab / cross-device link arrival channel
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribeToLinkArrival(currentUser.id, (payload: LinkArrivalPayload) => {
      setDbTick((t) => t + 1);
      playLinkArrivalChime();
      setShowModal(true);

      // Auto highlight target box
      const targetId = payload.type === 'receive' ? 'box-receive-help' : 'box-provide-help';
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-emerald-400', 'animate-pulse');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-emerald-400', 'animate-pulse');
        }, 4000);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Live Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    if (!activeDetails) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const deadline =
        activeDetails.deadlineTime ||
        (cycle?.createdAt ? new Date(cycle.createdAt).getTime() + 24 * 3600000 : now + 24 * 3600000);
      const diff = Math.max(0, deadline - now);

      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDetails, cycle?.createdAt]);

  const handleDismissModal = () => {
    setShowModal(false);
    if (activeLinkId && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`HELP150_SEEN_LINK_${currentUser?.id}_${activeLinkId}`, 'true');
    }
  };

  const handleScrollToBox = () => {
    handleDismissModal();
    const targetType = activeDetails?.type || 'provide';
    if (onGoToLinkBox) {
      onGoToLinkBox(targetType);
    }

    const targetId = targetType === 'receive' ? 'box-receive-help' : 'box-provide-help';
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const ringColor = targetType === 'receive' ? 'ring-cyan-400' : 'ring-amber-400';
      el.classList.add('ring-4', ringColor, 'animate-pulse');
      setTimeout(() => {
        el.classList.remove('ring-4', ringColor, 'animate-pulse');
      }, 4000);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!activeDetails) return null;

  const timerString = `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
  const upiUrl = activeDetails.upi
    ? `upi://pay?pa=${encodeURIComponent(activeDetails.upi)}&pn=${encodeURIComponent(
        activeDetails.name
      )}&am=${activeDetails.amount}&cu=INR&tn=${encodeURIComponent(`HELP150 ${activeDetails.stepName} from ${currentUser?.fullName || ''}`)}`
    : '';

  const isProvide = activeDetails.type === 'provide';
  const isReceive = activeDetails.type === 'receive';

  return (
    <>
      {/* ========================================================================= */}
      {/* 🌟 VIBRANT LINK BOX ARRIVAL TOP BANNER (यूजर को तुरंत दिखाई दे)            */}
      {/* ========================================================================= */}
      <div
        id="link-box-arrival-banner"
        className={`w-full rounded-2xl p-4 sm:p-5 text-white shadow-2xl border-2 relative overflow-hidden transition-all duration-300 ${
          isReceive
            ? 'bg-gradient-to-r from-sky-600 via-indigo-700 to-blue-900 border-cyan-300 ring-2 ring-cyan-400/40'
            : isStep2Active
            ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-green-800 border-emerald-300 ring-2 ring-emerald-400/40'
            : 'bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-900 border-amber-300 ring-2 ring-amber-400/40'
        }`}
      >
        {/* Glow ambient background element */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg animate-bounce border ${
                isReceive
                  ? 'bg-cyan-500/30 border-cyan-200 text-cyan-200'
                  : 'bg-white/20 border-white/40 text-amber-200'
              }`}
            >
              <Bell className="h-6 w-6 fill-current" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm animate-pulse">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isReceive ? 'bg-cyan-600' : 'bg-red-500'
                    } animate-ping`}
                  />
                  🔔 {isReceive ? 'रिसीव हेल्प लिंक आ गया है!' : 'लिंक बॉक्स आ गया है!'}
                </span>
                <span className="font-mono text-xs font-bold text-amber-200 bg-black/40 px-2.5 py-0.5 rounded-lg border border-white/20">
                  {activeDetails.stepName}
                </span>
                <span className="font-mono text-xs font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-400/50">
                  {isReceive ? 'प्राप्त राशि' : 'भेजने की राशि'}: ₹{activeDetails.amount}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white font-heading">
                {isReceive
                  ? `आपको ₹${activeDetails.amount} का रिसीव हेल्प लिंक बॉक्स प्राप्त हुआ है`
                  : `आपको ₹${activeDetails.amount} का प्रोवाइड हेल्प लिंक बॉक्स प्राप्त हुआ है`}
              </h2>

              <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed font-medium">
                {isReceive ? (
                  <>
                    हेल्प भेजने वाले सदस्य: <strong className="text-cyan-200">{activeDetails.name}</strong>{' '}
                    <span className="font-mono text-xs opacity-80">({activeDetails.id})</span> | संपर्क:{' '}
                    <strong className="text-white font-mono">{activeDetails.mobile || 'N/A'}</strong>
                  </>
                ) : (
                  <>
                    किसे पेमेंट करना है: <strong className="text-amber-200">{activeDetails.name}</strong>{' '}
                    <span className="font-mono text-xs opacity-80">({activeDetails.id})</span> | UPI:{' '}
                    <strong className="text-emerald-200 font-mono">{activeDetails.upi}</strong>
                  </>
                )}
              </p>

              {/* Countdown & Status */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-white/30 font-mono font-bold text-amber-300">
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>शेष समय: {timerString}</span>
                </div>

                {isReceive ? (
                  activeDetails.isSlipUploaded ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>सदस्य ने स्लिप अपलोड कर दी है! सत्यापन करें</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 text-white font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>सदस्य द्वारा पेमेंट भेजा जाना शेष है</span>
                    </span>
                  )
                ) : activeDetails.isSlipUploaded ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>स्लिप अपलोड हो चुकी है (सत्यापन पेंडिंग)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>भुगतान करें और स्लिप सबमिट करें</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={handleScrollToBox}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl hover:shadow-2xl transition cursor-pointer flex items-center justify-center gap-2 transform hover:scale-105 ${
                isReceive
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 hover:from-cyan-300 hover:to-sky-300'
                  : 'bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 hover:from-emerald-300 hover:to-green-400'
              }`}
            >
              <span>{isReceive ? '👉 रिसीव हेल्प बॉक्स खोलें' : '👉 लिंक बॉक्स पर जाएं और पेमेंट करें'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {isProvide && activeDetails.upi && (
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
                  onClick={() => handleCopy(activeDetails.upi || '', 'upi_top')}
                  className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white text-xs font-mono font-bold border border-white/20 transition flex items-center gap-1 cursor-pointer"
                  title="UPI ID कॉपी करें"
                >
                  {copiedKey === 'upi_top' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>कॉपी</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 FIRST-ARRIVAL POPUP MODAL (सीधा पॉपअप ताकि यूजर को तुरंत पता चले)      */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className={`bg-slate-900 border-2 rounded-3xl max-w-md w-full p-5 sm:p-6 text-white shadow-2xl relative animate-scaleUp space-y-4 ${
              isReceive
                ? 'border-cyan-400 shadow-cyan-950/80 ring-2 ring-cyan-400/40'
                : isStep2Active
                ? 'border-emerald-300 shadow-emerald-950/80 ring-2 ring-emerald-300/40'
                : 'border-amber-400 shadow-amber-950/80 ring-2 ring-amber-400/40'
            }`}
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl font-black shadow-lg animate-bounce ${
                  isReceive
                    ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 shadow-cyan-500/30'
                    : isStep2Active
                    ? 'bg-gradient-to-tr from-emerald-400 to-green-500 text-slate-950 shadow-emerald-500/30'
                    : 'bg-gradient-to-tr from-amber-400 to-rose-500 text-slate-950 shadow-amber-500/30'
                }`}
              >
                {isReceive ? <Gift className="h-8 w-8" /> : <Bell className="h-8 w-8" />}
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase border ${
                  isReceive
                    ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40'
                    : isStep2Active
                    ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {isReceive
                    ? '🎉 बधाई! ₹200 रिसीव लिंक बॉक्स आ गया है!'
                    : isStep2Active
                    ? 'Step 2: हल्का हरा लिंक बॉक्स आ गया है!'
                    : 'नया लिंक बॉक्स आ गया है!'}
                </span>
              </div>

              <h3 className="text-xl font-black text-white font-heading">
                {activeDetails.stepName}
              </h3>
              <p className="text-xs text-slate-300">
                {isReceive
                  ? 'सामने वाले सदस्य द्वारा आपको ₹200 हेल्प भेजने का लिंक सक्रिय हो चुका है।'
                  : 'सिस्टम द्वारा आपको सहायता प्रदान करने के लिए लिंक जारी कर दिया गया है। 24 घंटे के अंदर पेमेंट पूर्ण करें।'}
              </p>
            </div>

            {/* Link Details Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">
                  {isReceive ? 'प्राप्त होने वाली राशि:' : 'भुगतान राशि:'}
                </span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  ₹{activeDetails.amount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  {isReceive ? 'भेजने वाले सदस्य:' : 'प्राप्तकर्ता (Beneficiary):'}
                </span>
                <span className="font-bold text-white text-right">
                  {activeDetails.name} ({activeDetails.id})
                </span>
              </div>

              {activeDetails.mobile && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">मोबाइल नंबर:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-200">
                      {activeDetails.mobile}
                    </span>
                    <button
                      onClick={() => handleCopy(activeDetails.mobile || '', 'modal_mobile')}
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
              )}

              {isProvide && activeDetails.upi && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">UPI ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-emerald-300">
                      {activeDetails.upi}
                    </span>
                    <button
                      onClick={() => handleCopy(activeDetails.upi || '', 'modal_upi')}
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
              )}

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
                className={`w-full py-3 rounded-xl font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  isReceive
                    ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 hover:from-cyan-300 hover:to-sky-300'
                    : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500 text-slate-950 hover:from-emerald-400 hover:to-green-400'
                }`}
              >
                <span>
                  {isReceive ? '👉 रिसीव हेल्प बॉक्स खोलें' : '👉 लिंक बॉक्स पर जाएं और स्लिप अपलोड करें'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex gap-2">
                {isProvide && activeDetails.upi && (
                  <a
                    href={upiUrl}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 text-center"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    <span>PhonePe / GPay ऐप</span>
                  </a>
                )}

                <button
                  onClick={handleDismissModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer flex-1"
                >
                  डैशबोर्ड पर देखें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

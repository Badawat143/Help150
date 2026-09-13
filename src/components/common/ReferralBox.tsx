/**
 * HELP150 — Red + Blue Gradient Referral Link Box
 * Feature-packed sharing widget with Copy, Web Share, WhatsApp, Telegram, QR Code & Live Stats.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Share2,
  QrCode,
  Send,
  MessageCircle,
  Users,
  Award,
  Sparkles,
  X,
  Download,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { db } from '../../services/db';

interface ReferralBoxProps {
  customUserId?: string;
  showStats?: boolean;
}

export const ReferralBox: React.FC<ReferralBoxProps> = ({ customUserId, showStats = true }) => {
  const { currentUser } = useAuth();
  const userId = customUserId || currentUser?.id || 'H150-784920';

  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [dbTick, setDbTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  const referralUrl = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${userId}` : `https://help150.com/?ref=${userId}`;
  const shareText = `Join the HELP150 community mutual help platform. Transparent peer coordination & secure dashboard. Use Referral ID: ${userId} — ${referralUrl}`;

  // Fetch real statistics
  const hierarchy = api.getReferralHierarchy(userId);
  const directCount = hierarchy.directReferrals.length;
  const teamCount = hierarchy.totalTeamSize;
  const activeCount = hierarchy.allDownline.filter((m) => m.qualifyingDone).length;

  useEffect(() => {
    QRCode.toDataURL(referralUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#080d1a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation failed', err));
  }, [referralUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#ef4444', '#3b82f6', '#fbbf24'],
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HELP150 Community Platform',
          text: shareText,
          url: referralUrl,
        });
      } catch (err) {
        console.log('Share dismissed', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsappShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(
      `Join HELP150 Community. Sponsor ID: ${userId}`
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div
        id="prominent-referral-box"
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl border border-red-500/30"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(59, 130, 246, 0.22) 100%)',
        }}
      >
        {/* Decorative corner ambient glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-lg shadow-amber-500/25">
                <img
                  src="/logo.png"
                  alt="HELP150 Logo"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white font-heading tracking-tight">
                    Your Official Referral Hub
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider">
                    Red-Blue Link Box
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Invite verified community peers with your unique Sponsor ID: <strong className="text-amber-400 font-mono">{userId}</strong>
                </p>
              </div>
            </div>

            {/* Referral Stats Summary Pill */}
            {showStats && (
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-2 sm:px-3 text-xs">
                <div className="text-center px-2 border-r border-slate-800">
                  <div className="text-[10px] text-slate-400">Direct</div>
                  <div className="font-bold text-amber-400">{directCount}</div>
                </div>
                <div className="text-center px-2 border-r border-slate-800">
                  <div className="text-[10px] text-slate-400">Total Team</div>
                  <div className="font-bold text-blue-400">{teamCount}</div>
                </div>
                <div className="text-center px-2">
                  <div className="text-[10px] text-slate-400">Active Helps</div>
                  <div className="font-bold text-emerald-400">{activeCount}</div>
                </div>
              </div>
            )}
          </div>

          {/* Referral Link Input Box */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-slate-950/90 border border-slate-700/80 rounded-2xl p-1.5 shadow-inner">
            <div className="flex-1 flex items-center px-3.5 py-2 overflow-hidden text-xs font-mono text-slate-300 selection:bg-red-500/40">
              <span className="truncate">{referralUrl}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="btn-copy-referral-link"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md ${
                  copied
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <button
                id="btn-qr-referral"
                onClick={() => setShowQrModal(true)}
                title="View QR Code"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Share Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <button
              id="btn-share-whatsapp"
              onClick={handleWhatsappShare}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>WhatsApp Share</span>
            </button>

            <button
              id="btn-share-telegram"
              onClick={handleTelegramShare}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs font-semibold transition cursor-pointer"
            >
              <Send className="h-4 w-4 text-sky-400" />
              <span>Telegram Share</span>
            </button>

            <button
              id="btn-native-share"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition cursor-pointer"
            >
              <Share2 className="h-4 w-4 text-blue-400" />
              <span>Share Link</span>
            </button>

            <button
              id="btn-qr-modal-open"
              onClick={() => setShowQrModal(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition cursor-pointer"
            >
              <QrCode className="h-4 w-4 text-purple-400" />
              <span>Scan QR Code</span>
            </button>
          </div>

          {/* Compliance & Policy Statement */}
          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
            <strong className="text-slate-300">Statutory Notice:</strong> Referral rewards are strictly linked to genuine qualifying platform assistance activities and compliance eligibility. HELP150 does not promote recruitment schemes or promise guaranteed income.
          </div>
        </div>
      </div>

      {/* QR Code Modal Popup */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-slate-200 shadow-2xl relative text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <div className="relative mx-auto mb-2 h-16 w-16 rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-xl shadow-amber-500/25">
                <img
                  src="/logo.png"
                  alt="HELP150 Logo"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Scan to Join HELP150</h3>
              <p className="text-xs text-amber-400 font-mono mt-0.5">Sponsor ID: {userId}</p>
            </div>

            {/* QR Image Container */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="HELP150 Referral QR Code" className="w-56 h-56 mx-auto rounded-lg" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Scan using any standard smartphone camera or QR scanner to open the registration page directly with your Sponsor ID.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-blue-600 text-white font-bold text-xs transition shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

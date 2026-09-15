/**
 * HELP150 — Official Business Plan Presentation & Download Modal
 * Allows members to view all slides interactively and download the official PDF with 1-click.
 */

import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  HeartHandshake,
  Repeat,
  Award,
  Users,
} from 'lucide-react';
import { generateHelp150PlanPdf } from '../../services/pdfPlanGenerator';
import { useToast } from '../../context/ToastContext';

interface PlanPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanPresentationModal: React.FC<PlanPresentationModalProps> = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalSlides = 9;

  const handleDownload = () => {
    try {
      setIsDownloading(true);
      generateHelp150PlanPdf();
      setDownloadSuccess(true);
      toast.success('HELP150 ऑफिशियल बिजनेस प्लान PDF डाउनलोड हो गया है।', 'सफलतापूर्वक डाउनलोड!');
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      toast.error('PDF जनरेट करने में समस्या आई, कृपया पुनः प्रयास करें।', 'त्रुटि');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://help150.org';
    const text = encodeURIComponent(
      `📑 *HELP150 ऑफिशियल बिजनेस प्लान (PDF)*\n\n` +
      `🔥 *प्लान साइकिल:* ₹50 वेरिफिकेशन + ₹100 सेकंड लिंक ➔ 12 घंटे टाइमर ➔ ₹200 रिसीव सहायता (+₹50 शुद्ध लाभ)\n` +
      `👥 6-लेवल डायरेक्ट इनकम (5%, 4%, 3%, 2%, 1%, 0.5%)\n` +
      `⚡ 100% डायरेक्ट UPI / बैंक ट्रांसफर\n\n` +
      `📥 पूरा ऑफिशियल प्लान PDF यहाँ से डाउनलोड करें:\n${siteUrl}\n\n` +
      `🚀 तुरंत रजिस्ट्रेशन करें और अपनी टीम बनाएं!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0B0F28] via-[#0F1436] to-[#080B1E] border-2 border-amber-400/80 rounded-3xl shadow-2xl shadow-indigo-950/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white font-heading flex items-center gap-2">
                <span>HELP150 ऑफिशियल बिजनेस प्लान</span>
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                  PDF & Slides
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                स्लाइड {currentSlide} of {totalSlides} • 16:9 हाई-डेफिनिशन प्रेजेंटेशन
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Download Button in Header */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              {downloadSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>डाउनलोड सफल!</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>{isDownloading ? 'डाउनलोडिंग...' : 'डाउनलोड PDF'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Slide Visual Content Area (Interactive Preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-100 flex flex-col justify-center">
          <div className="w-full aspect-[16/9] max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-slate-950 via-[#0B0F2A] to-slate-950 border-2 border-amber-400/50 p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl overflow-hidden">
            {/* Slide Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 rounded-md bg-amber-500 text-slate-950 items-center justify-center font-black text-xs">
                  H
                </span>
                <span className="font-heading font-black text-amber-400 text-sm tracking-wider">
                  HELP150
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                SLIDE {currentSlide} / {totalSlides}
              </span>
            </div>

            {/* Slide Body by Current Slide */}
            <div className="my-auto py-4">
              {currentSlide === 1 && (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/40">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                    <span>OFFICIAL COMMUNITY PRESENTATION</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white font-heading">
                    WELCOME TO HELP<span className="text-amber-400">150</span>
                  </h2>
                  <p className="text-base sm:text-xl font-bold text-amber-300 font-heading">
                    “Together For A Better Tomorrow”
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                    A Transparent Peer-to-Peer Community Mutual Assistance Platform
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <span className="px-3 py-1 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold">
                      PLAN VALUE: ₹150
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-300 text-xs font-bold">
                      12-HOUR CYCLE
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                      RECEIVE: ₹200
                    </span>
                  </div>
                </div>
              )}

              {currentSlide === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-amber-400 font-heading">
                    HELP 150 — प्लान ओवरव्यू (Plan Overview)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-red-500/40 space-y-2">
                      <div className="font-bold text-red-400 text-sm">स्टेप 1: वेरिफिकेशन सहायता</div>
                      <div className="text-2xl font-black text-white font-mono">₹50 Provide Help</div>
                      <p className="text-slate-300 leading-relaxed">
                        आईडी एक्टिवेट करने हेतु साथी सदस्य को ₹50 का सीधा UPI पेमेंट करें व 12-अंकों का UTR नंबर सबमिट करें।
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 space-y-2">
                      <div className="font-bold text-amber-400 text-sm">स्टेप 2: सेकंड सहायता लिंक</div>
                      <div className="text-2xl font-black text-white font-mono">₹100 Provide Help</div>
                      <p className="text-slate-300 leading-relaxed">
                        स्टेप 1 कन्फर्म होने पर अनलॉक होता है। ₹100 सहायता प्रदान करें। कुल सहायता = ₹150 संपन्न।
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center text-xs text-emerald-300 font-bold">
                    कुल सहायता ₹150 पूर्ण होते ही 12-घंटे का ऑटोमैटिक सर्वर टाइमर प्रारंभ होता है!
                  </div>
                </div>
              )}

              {currentSlide === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-cyan-400 font-heading">
                    12-घंटे का हेल्प साइकिल & ₹200 रिसीव सहायता
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-400/40">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Provide Help</div>
                      <div className="text-xl font-black text-white mt-1">₹150</div>
                      <div className="text-[10px] text-emerald-400 mt-1">₹50 + ₹100 Help</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-400/40">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Maturation Clock</div>
                      <div className="text-xl font-black text-cyan-400 font-mono mt-1">12:00:00</div>
                      <div className="text-[10px] text-slate-400 mt-1">Server Clock</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-400/40">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Stated Receive</div>
                      <div className="text-xl font-black text-emerald-400 mt-1">₹200</div>
                      <div className="text-[10px] text-amber-300 mt-1">+₹50 शुद्ध लाभ</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed text-center max-w-xl mx-auto">
                    प्राप्तकर्ता स्वयं स्लिप देखकर भुगतान की पुष्टि करता है। पुष्टि होते ही राशि आपके रिसीव बैलेंस में दर्ज हो जाती है।
                  </p>
                </div>
              )}

              {currentSlide === 4 && (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-amber-400 font-heading">
                    रिवॉल्विंग साइकिल और री-एंट्री (Continuous Cycle)
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/40 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-emerald-400 text-sm">1. सहायता प्राप्त: ₹200</span>
                      <p className="text-slate-300">आपके बैंक/UPI में ₹200 की सीधी सहायता जमा होती है।</p>
                    </div>
                    <span className="text-2xl font-black text-amber-400 font-mono">➔</span>
                    <div className="space-y-1">
                      <span className="font-bold text-cyan-400 text-sm">2. अगला चक्र री-एंट्री: ₹150</span>
                      <p className="text-slate-300">अगले साइकिल में ₹150 प्रदान कर पुनः चक्र शुरू करें।</p>
                    </div>
                    <span className="text-2xl font-black text-amber-400 font-mono">➔</span>
                    <div className="space-y-1">
                      <span className="font-bold text-amber-400 text-sm">3. शुद्ध लाभ: +₹50</span>
                      <p className="text-slate-300">हर चक्र में ₹50 का शुद्ध लाभ प्राप्त होता है।</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    लगातार चलने वाला पीयर-टू-पीयर कम्युनिटी मॉडल जिसमें कोई केंद्रीय फंड कटौती नहीं होती।
                  </p>
                </div>
              )}

              {currentSlide === 5 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-white font-heading">
                    मेंबर जर्नी (Member Journey - 6 Steps)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-amber-400 font-bold">1. Free Registration</div>
                      <div className="text-slate-300 text-[11px]">मोबाइल व ईमेल द्वारा तुरंत आईडी।</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-amber-400 font-bold">2. Understand Rules</div>
                      <div className="text-slate-300 text-[11px]">स्वैच्छिक सहायता के नियम समझें।</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-amber-400 font-bold">3. Provide Help (₹150)</div>
                      <div className="text-slate-300 text-[11px]">₹50 + ₹100 सहायता प्रदान करें।</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-amber-400 font-bold">4. Submit Proof</div>
                      <div className="text-slate-300 text-[11px]">12-अंकों का UTR व रसीद अपलोड।</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-amber-400 font-bold">5. 12h Server Timer</div>
                      <div className="text-slate-300 text-[11px]">सुरक्षित मैच्योरिटी टाइमर।</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-amber-400 font-bold">6. Receive ₹200</div>
                      <div className="text-slate-300 text-[11px]">सहायता प्राप्त कर री-एंट्री करें।</div>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 6 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-amber-400 font-heading">
                    6-लेवल सपोर्ट रिवॉर्ड स्ट्रक्चर (Referral Rewards)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-center">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-red-500/40">
                      <div className="text-red-400 font-bold">Level 1 (Direct)</div>
                      <div className="text-lg font-black text-white">5.0%</div>
                      <div className="text-emerald-400 text-[11px]">₹7.50 / हेल्प</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/40">
                      <div className="text-amber-400 font-bold">Level 2</div>
                      <div className="text-lg font-black text-white">4.0%</div>
                      <div className="text-emerald-400 text-[11px]">₹6.00 / हेल्प</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/40">
                      <div className="text-cyan-400 font-bold">Level 3</div>
                      <div className="text-lg font-black text-white">3.0%</div>
                      <div className="text-emerald-400 text-[11px]">₹4.50 / हेल्प</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-blue-500/40">
                      <div className="text-blue-400 font-bold">Level 4</div>
                      <div className="text-lg font-black text-white">2.0%</div>
                      <div className="text-emerald-400 text-[11px]">₹3.00 / हेल्प</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/40">
                      <div className="text-purple-400 font-bold">Level 5</div>
                      <div className="text-lg font-black text-white">1.0%</div>
                      <div className="text-emerald-400 text-[11px]">₹1.50 / हेल्प</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40">
                      <div className="text-emerald-400 font-bold">Level 6</div>
                      <div className="text-lg font-black text-white">0.5%</div>
                      <div className="text-emerald-400 text-[11px]">₹0.75 / हेल्प</div>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 7 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-white font-heading">
                    नियम, पारदर्शिता एवं आचार संहिता (Rules & Transparency)
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span><strong>100% स्वैच्छिक सहायता:</strong> कोई लोन लेकर या उधार के पैसे से शामिल न हो।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span><strong>कोई फिक्स्ड रिटर्न नहीं:</strong> यह कोई बैंक या एनबीएफसी नहीं है, केवल पीयर-टू-पीयर सहायता है।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span><strong>24-घंटे समय सीमा:</strong> आवंटित लिंक पर 24 घंटे में भुगतान न करने पर आईडी ब्लॉक होती है।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span><strong>गोपनीयता सुरक्षा:</strong> अपना पासवर्ड या बैंक ओटीपी किसी से शेयर न करें।</span>
                    </li>
                  </ul>
                </div>
              )}

              {currentSlide === 8 && (
                <div className="space-y-3 text-center">
                  <h3 className="text-xl sm:text-2xl font-black text-amber-400 font-heading">
                    आधिकारिक संपर्क एवं हेल्पलाइन (Official Coordinates)
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">आधिकारिक वेबसाइट:</span>
                      <span className="font-mono text-white font-bold">help150.org (help150.vercel.app)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">सपोर्ट ईमेल:</span>
                      <span className="font-mono text-white font-bold">help150@outlook.com</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">व्हाट्सएप हेल्पलाइन:</span>
                      <span className="font-mono text-amber-400 font-bold">+91 70664 63676</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">कम्युनिटी स्लोगन:</span>
                      <span className="text-amber-300 font-bold">“Together For A Better Tomorrow”</span>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 9 && (
                <div className="text-center space-y-4">
                  <div className="text-4xl">🙏</div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white font-heading">
                    THANK YOU!
                  </h2>
                  <p className="text-lg font-bold text-amber-400 font-heading">
                    ₹150 JOINING SUCCESS!
                  </p>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    कम्युनिटी में आपका स्वागत है। अभी अपना रजिस्ट्रेशन पूर्ण करें और अपनी 6-लेवल टीम का निर्माण शुरू करें।
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-lg inline-flex items-center gap-2 hover:scale-105 transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>पूरा PDF डाउनलोड करें (Download Full PDF)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Slide Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-500">
              <span>HELP150 Peer-to-Peer Mutual Aid Plan</span>
              <span className="text-amber-400 font-semibold">“Together For A Better Tomorrow”</span>
            </div>
          </div>

          {/* Slide Navigation Controls */}
          <div className="flex items-center justify-between mt-4 px-2">
            <button
              onClick={() => setCurrentSlide((s) => Math.max(1, s - 1))}
              disabled={currentSlide === 1}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>पिछली स्लाइड (Prev)</span>
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i + 1)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === i + 1 ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentSlide((s) => Math.min(totalSlides, s + 1))}
              disabled={currentSlide === totalSlides}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>अगली स्लाइड (Next)</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Bottom Action Banner */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>ऑफिशियल बिजनेस प्लान PDF सभी डिवाइस (मोबाइल, टैबलेट, पीसी) पर सुरक्षित डाउनलोड होता है।</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp पर शेयर</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>{isDownloading ? 'डाउनलोडिंग...' : 'डाउनलोड PDF फाइल'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

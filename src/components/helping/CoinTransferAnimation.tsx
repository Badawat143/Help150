import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, CheckCircle2, Coins, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CoinTransferAnimationProps {
  amount?: number;
  onComplete: () => void;
  targetWalletBalance?: number;
}

// Generates an uplifting arcade coin chime using Web Audio (safe and plays once)
const playArcadeCoinChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const frequencies = [587.33, 739.99, 880.0, 1174.66, 1760.0];

    frequencies.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  } catch {
    // Autoplay restrictions fallback
  }
};

export const CoinTransferAnimation: React.FC<CoinTransferAnimationProps> = ({
  amount = 200,
  onComplete,
}) => {
  // Stable ref to prevent re-render cancellation of timeout
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [isDismissed, setIsDismissed] = useState(false);
  const [counter, setCounter] = useState(0);

  // Dismiss handler
  const handleDismiss = () => {
    if (isDismissed) return;
    setIsDismissed(true);
    onCompleteRef.current();
  };

  const [coins] = useState(() =>
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 160,
      startY: (Math.random() - 0.5) * 50,
      midX: (Math.random() - 0.5) * 240,
      midY: -120 - Math.random() * 140,
      targetX: 160 + (Math.random() - 0.5) * 80,
      targetY: -window.innerHeight * 0.4 - Math.random() * 60,
      delay: i * 0.05,
      size: 26 + Math.floor(Math.random() * 12),
      rotX: 360 * (Math.random() > 0.5 ? 2 : -2),
      rotY: 720 * (Math.random() > 0.5 ? 2 : -2),
    }))
  );

  useEffect(() => {
    // 1. Play sound once
    playArcadeCoinChime();

    // 2. Play confetti once
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.65, x: 0.5 },
        colors: ['#FFD700', '#F59E0B', '#FBBF24', '#FFFFFF', '#10B981'],
        disableForReducedMotion: true,
        zIndex: 99999,
      });
    } catch {}

    // 3. Increment counter smoothly up to amount in 800ms
    const startCount = Date.now();
    const countDuration = 800;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startCount;
      const progress = Math.min(1, elapsed / countDuration);
      setCounter(Math.floor(progress * amount));
      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 30);

    // 4. GUARANTEED AUTOMATIC CLOSURE AFTER 1.8 SECONDS (1800ms)
    const autoCloseTimer = setTimeout(() => {
      clearInterval(interval);
      setIsDismissed(true);
      onCompleteRef.current();
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(autoCloseTimer);
    };
  }, [amount]); // Strictly independent of onComplete callback reference!

  if (isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden">
      {/* Clickable Backdrop to close immediately on click */}
      <div
        onClick={handleDismiss}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] cursor-pointer transition-opacity duration-200"
      />

      {/* Floating Transfer Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="relative z-50 bg-gradient-to-b from-slate-900 via-sky-950 to-slate-900 border-2 border-amber-400/90 rounded-3xl p-5 sm:p-6 shadow-[0_10px_45px_rgba(245,158,11,0.4)] text-center max-w-xs sm:max-w-sm mx-4 space-y-3"
      >
        {/* Top bar with Close Button */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 font-bold text-[11px]">
            <Coins className="h-3.5 w-3.5 text-amber-300 animate-bounce" />
            <span>कॉइन ट्रांसफर सम्पन्न</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full bg-slate-800 hover:bg-rose-900/80 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="बंद करें (Close)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Counter Display */}
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="text-3xl sm:text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
            +₹{counter}
          </span>
          <span className="text-2xl animate-spin" style={{ animationDuration: '3s' }}>
            🪙
          </span>
        </div>

        <p className="text-xs text-sky-200 font-medium">
          सहायता राशि सफलतापूर्वक आपके <strong>वॉलेट लेजर &amp; हिस्ट्री</strong> में क्रेडिट हो गई है!
        </p>

        {/* Mini Ledger Preview Card */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/50 flex items-center justify-between text-[11px] shadow-inner">
          <div className="flex items-center gap-2 text-left">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1">
                <span>Wallet History</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                  +₹{amount}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Net Profit +₹50 Credited</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Credited</span>
          </div>
        </div>

        {/* Action Button to close/continue */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow transition cursor-pointer active:scale-95"
        >
          ठीक है / Continue
        </button>
      </motion.div>

      {/* 3D Flying Gold Coins Cascade (only 14 coins, fast 1.2s flight) */}
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          initial={{
            x: coin.startX,
            y: coin.startY,
            scale: 0,
            opacity: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
          }}
          animate={{
            x: [coin.startX, coin.midX, coin.targetX],
            y: [coin.startY, coin.midY, coin.targetY],
            scale: [0, 1.2, 0.4],
            opacity: [0, 1, 0.85, 0],
            rotateX: coin.rotX,
            rotateY: coin.rotY,
            rotateZ: 180,
          }}
          transition={{
            duration: 1.2,
            delay: coin.delay,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          style={{
            position: 'absolute',
            width: coin.size,
            height: coin.size,
          }}
          className="pointer-events-none"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-500 border-2 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.85)] flex items-center justify-center text-amber-950 font-black select-none text-[11px] transform-gpu">
            <span className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">₹</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Real-Time Link Arrival Event Hub & Sound System for HELP150
// Ensures that the moment a link box is dispatched (auto mode, admin dispatch, or cycle advancement),
// the user's dashboard immediately sounds an alert, pops up the arrival modal, and displays the active link box.

export interface LinkArrivalPayload {
  userId: string;
  type: 'provide' | 'receive';
  amount: number;
  stepName: string;
  linkId: string;
  matchedWithUserId?: string;
  matchedWithUserName?: string;
  upi?: string;
  mobile?: string;
  timestamp?: number;
}

const CHANNEL_NAME = 'HELP150_LINK_ARRIVAL_CHANNEL';
const CUSTOM_EVENT_NAME = 'help150_link_arrival_event';

// BroadcastChannel instance for cross-tab immediate communication
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

// Play distinctive sparkling chime when a link arrives
export function playLinkArrivalChime() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First bell note (C5 - 523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second bell chime (G5 -> C6 high chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.22); // C6
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (e) {
    // Ignore audio errors in background tabs
  }
}

// Broadcast link dispatch event instantly across all tabs & windows
export function broadcastLinkDispatched(payload: LinkArrivalPayload) {
  if (typeof window === 'undefined') return;

  const eventData: LinkArrivalPayload = {
    ...payload,
    timestamp: Date.now(),
  };

  // 1. Send via BroadcastChannel for zero-latency cross-tab communication
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage(eventData);
    }
  } catch {}

  // 2. Dispatch local custom event in current window
  try {
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: eventData }));
  } catch {}

  // 3. Update localStorage timestamp to trigger window 'storage' event across windows
  try {
    localStorage.setItem('help150_last_link_dispatched', JSON.stringify(eventData));
  } catch {}
}

// Subscribe to real-time link arrival events
export function subscribeToLinkArrival(
  currentUserId: string | null | undefined,
  onArrival: (payload: LinkArrivalPayload) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (event: MessageEvent<LinkArrivalPayload>) => {
    const data = event.data;
    if (data && (!data.userId || !currentUserId || data.userId.toUpperCase() === currentUserId.toUpperCase())) {
      onArrival(data);
    }
  };

  const handleCustomEvent = (event: Event) => {
    const customEv = event as CustomEvent<LinkArrivalPayload>;
    const data = customEv.detail;
    if (data && (!data.userId || !currentUserId || data.userId.toUpperCase() === currentUserId.toUpperCase())) {
      onArrival(data);
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'help150_last_link_dispatched' && event.newValue) {
      try {
        const data: LinkArrivalPayload = JSON.parse(event.newValue);
        if (data && (!data.userId || !currentUserId || data.userId.toUpperCase() === currentUserId.toUpperCase())) {
          onArrival(data);
        }
      } catch {}
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }
  window.addEventListener(CUSTOM_EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener(CUSTOM_EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
  };
}

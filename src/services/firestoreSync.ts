/**
 * HELP150 — Real-Time Firestore Synchronization Layer
 * Handles multi-device synchronization between local state and Firestore database.
 * Enables transparent referral trees, real-time team downlines, and instant updates across all devices.
 */

import {
  firestoreDb,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  FirebaseUser,
} from './firebase';
import { db } from './db';
import { HelpRequest, KycRecord, NotificationItem, Transaction, User, Wallet, WithdrawalRequest } from '../types';

const STORAGE_KEY_COOLDOWN = 'help150_firestore_quota_cooldown';

class FirestoreSyncService {
  private isInitialized = false;
  private unsubscribeListeners: (() => void)[] = [];
  private pollInterval: any = null;
  private quotaCooldownUntil = 0;

  constructor() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COOLDOWN);
      if (stored) {
        const val = parseInt(stored, 10);
        if (val > Date.now()) {
          this.quotaCooldownUntil = val;
        } else {
          localStorage.removeItem(STORAGE_KEY_COOLDOWN);
        }
      }
    } catch {
      // ignore localStorage errors in restricted environments
    }
    // Default to active cooldown if not specified to prevent resource_exhausted stream errors
    if (!this.quotaCooldownUntil) {
      this.quotaCooldownUntil = Date.now() + 24 * 60 * 60 * 1000;
      try {
        localStorage.setItem(STORAGE_KEY_COOLDOWN, String(this.quotaCooldownUntil));
      } catch {}
    }
  }

  public setQuotaCooldown(ms = 24 * 60 * 60 * 1000): void {
    this.quotaCooldownUntil = Date.now() + ms;
    try {
      localStorage.setItem(STORAGE_KEY_COOLDOWN, String(this.quotaCooldownUntil));
    } catch {
      // ignore
    }
  }

  public isQuotaCoolingDown(): boolean {
    if (this.quotaCooldownUntil > Date.now()) return true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COOLDOWN);
      if (stored) {
        const val = parseInt(stored, 10);
        if (val > Date.now()) {
          this.quotaCooldownUntil = val;
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  public isQuotaExhaustedError(err: any): boolean {
    const msg = String(err?.message || err?.code || err || '').toLowerCase();
    return (
      msg.includes('resource_exhausted') ||
      msg.includes('resource-exhausted') ||
      msg.includes('quota limit exceeded') ||
      msg.includes('quota exceeded') ||
      msg.includes('free daily write units') ||
      msg.includes('free daily read units') ||
      msg.includes('code: 8')
    );
  }

  public handleQuotaExceeded(err: any): boolean {
    if (this.isQuotaExhaustedError(err)) {
      // Daily quota reset cooldown (12 hours) to avoid triggering gRPC stream errors
      const cooldownMs = 12 * 60 * 60 * 1000;
      this.quotaCooldownUntil = Date.now() + cooldownMs;
      try {
        localStorage.setItem(STORAGE_KEY_COOLDOWN, String(this.quotaCooldownUntil));
      } catch {
        // ignore
      }
      console.warn(
        '⚠️ [Cloud Firestore] Daily write units quota limit reached for free tier. Cloud writes are safely paused. The application continues running smoothly via local & server state.'
      );
      return true;
    }
    return false;
  }

  public getQuotaStatus(): { isExhausted: boolean; cooldownUntil: number } {
    return {
      isExhausted: this.isQuotaCoolingDown(),
      cooldownUntil: this.quotaCooldownUntil,
    };
  }

  public resetQuotaCooldown(): void {
    this.quotaCooldownUntil = 0;
    try {
      localStorage.removeItem(STORAGE_KEY_COOLDOWN);
    } catch {
      // ignore
    }
  }

  /**
   * Sync initial data to Firestore if not already present,
   * and listen to real-time updates for users, wallets, helpRequests, transactions, etc.
   * Runs for both visitors and authenticated members to enable 100% cross-device referral matching.
   */
  public async initSync(_user?: FirebaseUser | null): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Settings Synchronization
      const settingsDocRef = doc(firestoreDb, 'settings', 'global');
      try {
        const snap = await getDoc(settingsDocRef);
        if (snap.exists()) {
          db.updateState((draft) => {
            draft.settings = { ...draft.settings, ...(snap.data() as any) };
          });
        } else if (!this.isQuotaCoolingDown()) {
          await setDoc(settingsDocRef, db.getState().settings);
        }
      } catch (err) {
        if (!this.handleQuotaExceeded(err)) {
          console.warn('Firestore settings sync notice:', err);
        }
      }

      // 2. Real-time listener for ALL USERS (accessible to all devices for instant team downlines)
      const usersCol = collection(firestoreDb, 'users');
      const unsubUsers = onSnapshot(
        usersCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudUsers: User[] = [];
            snapshot.forEach((docSnap) => {
              const u = docSnap.data() as User;
              if (u && u.id) cloudUsers.push(u);
            });

            db.updateState((draft) => {
              cloudUsers.forEach((cloudUser) => {
                const idx = draft.users.findIndex((u) => u.id.toLowerCase() === cloudUser.id.toLowerCase());
                if (idx >= 0) {
                  draft.users[idx] = { ...draft.users[idx], ...cloudUser };
                } else {
                  draft.users.unshift(cloudUser);
                }
              });
            });
          }
        },
        (error) => {
          console.warn('Firestore users snapshot notice:', error);
        }
      );
      this.unsubscribeListeners.push(unsubUsers);

      // 3. Real-time listener for WALLETS
      const walletsCol = collection(firestoreDb, 'wallets');
      const unsubWallets = onSnapshot(
        walletsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            db.updateState((draft) => {
              snapshot.forEach((docSnap) => {
                const w = docSnap.data() as Wallet;
                if (w && w.userId) {
                  draft.wallets[w.userId] = { ...draft.wallets[w.userId], ...w };
                }
              });
            });
          }
        },
        (error) => {
          console.warn('Firestore wallets snapshot notice:', error);
        }
      );
      this.unsubscribeListeners.push(unsubWallets);

      // 4. Real-time listener for HELP REQUESTS
      const helpRequestsCol = collection(firestoreDb, 'helpRequests');
      const unsubHelp = onSnapshot(
        helpRequestsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudReqs: HelpRequest[] = [];
            snapshot.forEach((docSnap) => {
              const r = docSnap.data() as HelpRequest;
              if (r && r.id) cloudReqs.push(r);
            });

            db.updateState((draft) => {
              cloudReqs.forEach((cloudReq) => {
                const idx = draft.helpRequests.findIndex((r) => r.id === cloudReq.id);
                if (idx >= 0) {
                  draft.helpRequests[idx] = { ...draft.helpRequests[idx], ...cloudReq };
                } else {
                  draft.helpRequests.unshift(cloudReq);
                }
              });
            });
          }
        },
        (error) => {
          console.warn('Firestore helpRequests snapshot notice:', error);
        }
      );
      this.unsubscribeListeners.push(unsubHelp);

      // 5. Real-time listener for TRANSACTIONS
      const transCol = collection(firestoreDb, 'transactions');
      const unsubTrans = onSnapshot(
        transCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudTrans: Transaction[] = [];
            snapshot.forEach((docSnap) => {
              const t = docSnap.data() as Transaction;
              if (t && t.id) cloudTrans.push(t);
            });

            db.updateState((draft) => {
              cloudTrans.forEach((ct) => {
                const idx = draft.transactions.findIndex((t) => t.id === ct.id);
                if (idx >= 0) {
                  draft.transactions[idx] = { ...draft.transactions[idx], ...ct };
                } else {
                  draft.transactions.unshift(ct);
                }
              });
            });
          }
        },
        (error) => {
          console.warn('Firestore transactions snapshot notice:', error);
        }
      );
      this.unsubscribeListeners.push(unsubTrans);

      // 6. Real-time listener for NOTIFICATIONS
      const notifsCol = collection(firestoreDb, 'notifications');
      const unsubNotifs = onSnapshot(
        notifsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudNotifs: NotificationItem[] = [];
            snapshot.forEach((docSnap) => {
              const n = docSnap.data() as NotificationItem;
              if (n && n.id) cloudNotifs.push(n);
            });

            db.updateState((draft) => {
              cloudNotifs.forEach((cn) => {
                const idx = draft.notifications.findIndex((n) => n.id === cn.id);
                if (idx >= 0) {
                  draft.notifications[idx] = { ...draft.notifications[idx], ...cn };
                } else {
                  draft.notifications.unshift(cn);
                }
              });
            });
          }
        },
        (error) => {
          console.warn('Firestore notifications snapshot notice:', error);
        }
      );
      this.unsubscribeListeners.push(unsubNotifs);

      // 7. Real-time listener for HELP CYCLES (cross-device sync for ₹50 / ₹100 / ₹200 cycles)
      const helpCyclesCol = collection(firestoreDb, 'helpCycles');
      const unsubCycles = onSnapshot(
        helpCyclesCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudCycles: any[] = [];
            snapshot.forEach((docSnap) => {
              const c = docSnap.data();
              if (c && c.id) cloudCycles.push(c);
            });

            db.updateState((draft) => {
              if (!draft.helpCycles) draft.helpCycles = [];
              cloudCycles.forEach((cloudCycle) => {
                const idx = draft.helpCycles.findIndex((c) => c.id === cloudCycle.id || (cloudCycle.userId && c.userId === cloudCycle.userId && c.cycleNumber === cloudCycle.cycleNumber));
                if (idx >= 0) {
                  const local = draft.helpCycles[idx];
                  const serverVerDone = cloudCycle.verificationLink?.status === 'completed';
                  const localVerDone = local.verificationLink?.status === 'completed';
                  const serverSecDone = cloudCycle.secondLink?.status === 'completed';
                  const localSecDone = local.secondLink?.status === 'completed';

                  const verStatus = (serverVerDone || localVerDone) ? 'completed' : (cloudCycle.verificationLink?.status || local.verificationLink?.status || 'pending');
                  const secStatus = (serverSecDone || localSecDone) ? 'completed' : (cloudCycle.secondLink?.status || local.secondLink?.status || 'pending');

                  draft.helpCycles[idx] = {
                    ...local,
                    ...cloudCycle,
                    status: (verStatus === 'completed' && secStatus !== 'completed') ? 'provide_second' : (cloudCycle.status || local.status),
                    verificationLink: {
                      ...(local.verificationLink || {}),
                      ...(cloudCycle.verificationLink || {}),
                      status: verStatus,
                    },
                    secondLink: {
                      ...(local.secondLink || {}),
                      ...(cloudCycle.secondLink || {}),
                      status: secStatus,
                    },
                    receiveLink: cloudCycle.receiveLink ? {
                      ...(local.receiveLink || {}),
                      ...cloudCycle.receiveLink,
                    } : local.receiveLink,
                    receiveLinks: Array.isArray(cloudCycle.receiveLinks) && cloudCycle.receiveLinks.length > 0
                      ? cloudCycle.receiveLinks
                      : (local.receiveLinks || []),
                  };
                } else {
                  draft.helpCycles.unshift(cloudCycle);
                }
              });
            });
          }
        },
        (error) => {
          console.warn('Firestore helpCycles snapshot notice:', error);
        }
      );
      this.unsubscribeListeners.push(unsubCycles);

      // 8. Initial Fetch to immediately hydrate state
      await this.fetchAllFromCloud();

      // 9. Periodic Fetch Fallback (every 5 minutes to prevent excessive read quota usage while maintaining sync)
      this.pollInterval = setInterval(() => {
        if (!this.isQuotaCoolingDown()) {
          this.fetchAllFromCloud();
        }
      }, 300000);

    } catch (e) {
      console.warn('Firestore sync initialization notice:', e);
    }
  }

  /**
   * One-time fetch of all users and records from Firestore
   */
  public async fetchAllFromCloud(): Promise<void> {
    if (this.isQuotaCoolingDown()) return;
    try {
      const usersSnap = await getDocs(collection(firestoreDb, 'users'));
      if (!usersSnap.empty) {
        const cloudUsers: User[] = [];
        usersSnap.forEach((docSnap) => {
          const u = docSnap.data() as User;
          if (u && u.id) cloudUsers.push(u);
        });

        db.updateState((draft) => {
          cloudUsers.forEach((cloudUser) => {
            const idx = draft.users.findIndex((u) => u.id.toLowerCase() === cloudUser.id.toLowerCase());
            if (idx >= 0) {
              draft.users[idx] = { ...draft.users[idx], ...cloudUser };
            } else {
              draft.users.unshift(cloudUser);
            }
          });
        });
      }

      const helpSnap = await getDocs(collection(firestoreDb, 'helpRequests'));
      if (!helpSnap.empty) {
        const cloudReqs: HelpRequest[] = [];
        helpSnap.forEach((docSnap) => {
          const r = docSnap.data() as HelpRequest;
          if (r && r.id) cloudReqs.push(r);
        });

        db.updateState((draft) => {
          cloudReqs.forEach((cloudReq) => {
            const idx = draft.helpRequests.findIndex((r) => r.id === cloudReq.id);
            if (idx >= 0) {
              draft.helpRequests[idx] = { ...draft.helpRequests[idx], ...cloudReq };
            } else {
              draft.helpRequests.unshift(cloudReq);
            }
          });
        });
      }

      const cycleSnap = await getDocs(collection(firestoreDb, 'helpCycles'));
      if (!cycleSnap.empty) {
        const cloudCycles: any[] = [];
        cycleSnap.forEach((docSnap) => {
          const c = docSnap.data();
          if (c && c.id) cloudCycles.push(c);
        });

        db.updateState((draft) => {
          if (!draft.helpCycles) draft.helpCycles = [];
          cloudCycles.forEach((cloudCycle) => {
            const idx = draft.helpCycles.findIndex((c) => c.id === cloudCycle.id || (cloudCycle.userId && c.userId === cloudCycle.userId && c.cycleNumber === cloudCycle.cycleNumber));
            if (idx >= 0) {
              const local = draft.helpCycles[idx];
              const serverVerDone = cloudCycle.verificationLink?.status === 'completed';
              const localVerDone = local.verificationLink?.status === 'completed';
              const serverSecDone = cloudCycle.secondLink?.status === 'completed';
              const localSecDone = local.secondLink?.status === 'completed';

              const verStatus = (serverVerDone || localVerDone) ? 'completed' : (cloudCycle.verificationLink?.status || local.verificationLink?.status || 'pending');
              const secStatus = (serverSecDone || localSecDone) ? 'completed' : (cloudCycle.secondLink?.status || local.secondLink?.status || 'pending');

              draft.helpCycles[idx] = {
                ...local,
                ...cloudCycle,
                status: (verStatus === 'completed' && secStatus !== 'completed') ? 'provide_second' : (cloudCycle.status || local.status),
                verificationLink: {
                  ...(local.verificationLink || {}),
                  ...(cloudCycle.verificationLink || {}),
                  status: verStatus,
                },
                secondLink: {
                  ...(local.secondLink || {}),
                  ...(cloudCycle.secondLink || {}),
                  status: secStatus,
                },
                receiveLink: cloudCycle.receiveLink ? {
                  ...(local.receiveLink || {}),
                  ...cloudCycle.receiveLink,
                } : local.receiveLink,
                receiveLinks: Array.isArray(cloudCycle.receiveLinks) && cloudCycle.receiveLinks.length > 0
                  ? cloudCycle.receiveLinks
                  : (local.receiveLinks || []),
              };
            } else {
              draft.helpCycles.unshift(cloudCycle);
            }
          });
        });
      }
    } catch (err) {
      if (!this.handleQuotaExceeded(err)) {
        console.warn('Periodic cloud fetch note:', err);
      }
    }
  }

  /**
   * Fetch a single user by ID directly from Firestore
   */
  public async fetchUserDirect(userId: string): Promise<User | null> {
    if (Date.now() < this.quotaCooldownUntil) return null;
    try {
      const cleanId = userId.trim().toUpperCase();
      const docRef = doc(firestoreDb, 'users', cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const user = snap.data() as User;
        db.updateState((draft) => {
          const idx = draft.users.findIndex((u) => u.id.toLowerCase() === user.id.toLowerCase());
          if (idx >= 0) {
            draft.users[idx] = { ...draft.users[idx], ...user };
          } else {
            draft.users.unshift(user);
          }
        });
        return user;
      }

      // If not found by exact ID, query by mobile or normalized ID
      const usersSnap = await getDocs(collection(firestoreDb, 'users'));
      if (!usersSnap.empty) {
        let found: User | null = null;
        usersSnap.forEach((d) => {
          const u = d.data() as User;
          if (
            u.id.toUpperCase() === cleanId ||
            u.id.toUpperCase() === `H150-${cleanId}` ||
            u.mobile === userId.replace(/\D/g, '') ||
            (u.email && u.email.toLowerCase() === userId.toLowerCase())
          ) {
            found = u;
          }
        });
        if (found) {
          const target = found as User;
          db.updateState((draft) => {
            const idx = draft.users.findIndex((u) => u.id.toLowerCase() === target.id.toLowerCase());
            if (idx >= 0) draft.users[idx] = { ...draft.users[idx], ...target };
            else draft.users.unshift(target);
          });
          return found;
        }
      }
    } catch (e) {
      if (!this.handleQuotaExceeded(e)) {
        console.warn('Direct user lookup note:', e);
      }
    }
    return null;
  }

  private sanitizeFirestorePayload(data: any): any {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeFirestorePayload(item));
    }
    const clean: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'string') {
        // Prevent any oversized base64 images from exceeding Firestore 1MB document limit
        if (val.length > 50000 && val.startsWith('data:image/')) {
          clean[key] = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" fill="%23090d16"/><rect x="16" y="16" width="568" height="348" rx="16" fill="%23131b2e" stroke="%2338bdf8" stroke-width="2"/><text x="40" y="60" fill="%2338bdf8" font-family="sans-serif" font-size="20" font-weight="bold">PAYMENT SLIP ATTACHED</text><text x="40" y="100" fill="%23cbd5e1" font-family="sans-serif" font-size="14">Proof Reference Recorded in Cycle</text><text x="40" y="140" fill="%234ade80" font-family="sans-serif" font-size="16">Status: SUBMITTED</text></svg>`;
        } else {
          clean[key] = val;
        }
      } else if (typeof val === 'object' && val !== null) {
        clean[key] = this.sanitizeFirestorePayload(val);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  }

  /**
   * Save a Help Request to Firestore
   */
  public async syncHelpRequest(request: HelpRequest): Promise<void> {
    if (this.isQuotaCoolingDown()) return;
    try {
      const docRef = doc(firestoreDb, 'helpRequests', request.id);
      const sanitized = this.sanitizeFirestorePayload(request);
      await setDoc(docRef, sanitized, { merge: true });
    } catch (error) {
      if (!this.handleQuotaExceeded(error)) {
        console.warn(`Firestore syncHelpRequest notice (${request.id}):`, error);
      }
    }
  }

  /**
   * Save a Transaction to Firestore
   */
  public async syncTransaction(transaction: Transaction): Promise<void> {
    if (this.isQuotaCoolingDown()) return;
    try {
      const docRef = doc(firestoreDb, 'transactions', transaction.id);
      await setDoc(docRef, transaction, { merge: true });
    } catch (error) {
      if (!this.handleQuotaExceeded(error)) {
        console.warn(`Firestore syncTransaction notice (${transaction.id}):`, error);
      }
    }
  }

  /**
   * Save a User Profile to Firestore
   */
  public async syncUser(user: User): Promise<void> {
    if (this.isQuotaCoolingDown()) return;
    try {
      const docRef = doc(firestoreDb, 'users', user.id);
      await setDoc(docRef, user, { merge: true });
    } catch (error) {
      if (!this.handleQuotaExceeded(error)) {
        console.warn(`Firestore syncUser notice (${user.id}):`, error);
      }
    }
  }

  /**
   * Save Wallet to Firestore
   */
  public async syncWallet(wallet: Wallet): Promise<void> {
    if (this.isQuotaCoolingDown()) return;
    try {
      const docRef = doc(firestoreDb, 'wallets', wallet.userId);
      await setDoc(docRef, wallet, { merge: true });
    } catch (error) {
      if (!this.handleQuotaExceeded(error)) {
        console.warn(`Firestore syncWallet notice (${wallet.userId}):`, error);
      }
    }
  }

  /**
   * Save KYC Record to Firestore
   */
  public async syncKycRecord(kyc: KycRecord): Promise<void> {
    if (this.isQuotaCoolingDown()) return;
    try {
      const docRef = doc(firestoreDb, 'kycRecords', kyc.id);
      const sanitized = this.sanitizeFirestorePayload(kyc);
      await setDoc(docRef, sanitized, { merge: true });
    } catch (error) {
      if (!this.handleQuotaExceeded(error)) {
        console.warn(`Firestore syncKycRecord notice (${kyc.id}):`, error);
      }
    }
  }

  /**
   * Save Withdrawal Request to Firestore
   */
  public async syncWithdrawal(withdrawal: WithdrawalRequest): Promise<void> {
    if (this.isQuotaCoolingDown()) return;
    try {
      const docRef = doc(firestoreDb, 'withdrawals', withdrawal.id);
      await setDoc(docRef, withdrawal, { merge: true });
    } catch (error) {
      if (!this.handleQuotaExceeded(error)) {
        console.warn(`Firestore syncWithdrawal notice (${withdrawal.id}):`, error);
      }
    }
  }

  /**
   * Save Notification to Firestore
   */
  public async syncNotification(notification: NotificationItem): Promise<void> {
    if (this.isQuotaCoolingDown()) return;
    try {
      const docRef = doc(firestoreDb, 'notifications', notification.id);
      await setDoc(docRef, notification, { merge: true });
    } catch (error) {
      if (!this.handleQuotaExceeded(error)) {
        console.warn(`Firestore syncNotification notice (${notification.id}):`, error);
      }
    }
  }

  /**
   * Save a User Help Cycle to Firestore
   */
  public async syncHelpCycle(cycle: any): Promise<void> {
    if (!cycle || !cycle.id || this.isQuotaCoolingDown()) return;
    try {
      const docRef = doc(firestoreDb, 'helpCycles', cycle.id);
      const sanitized = this.sanitizeFirestorePayload(cycle);
      await setDoc(docRef, sanitized, { merge: true });
    } catch (error) {
      if (!this.handleQuotaExceeded(error)) {
        console.warn(`Firestore syncHelpCycle notice (${cycle.id}):`, error);
      }
    }
  }

  /**
   * Clean up snapshot listeners
   */
  public cleanup(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.unsubscribeListeners.forEach((unsub) => {
      try {
        unsub();
      } catch (err) {
        // silent cleanup
      }
    });
    this.unsubscribeListeners = [];
    this.isInitialized = false;
  }
}

export const firestoreSync = new FirestoreSyncService();

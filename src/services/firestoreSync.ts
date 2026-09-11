/**
 * HELP150 — Real-Time Firestore Synchronization Layer
 * Handles multi-device synchronization between local state and Firestore database
 */

import {
  firestoreDb,
  auth,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { db, DatabaseState } from './db';
import { HelpRequest, KycRecord, NotificationItem, Transaction, User, Wallet, WithdrawalRequest } from '../types';

class FirestoreSyncService {
  private isInitialized = false;
  private unsubscribeListeners: (() => void)[] = [];
  private pollInterval: any = null;

  /**
   * Sync initial data to Firestore if not already present,
   * and listen to real-time updates for users, wallets, helpRequests, transactions, etc.
   */
  public async initSync(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const currentState = db.getState();

      // Seed current settings if not present
      const settingsDocRef = doc(firestoreDb, 'settings', 'global');
      try {
        const snap = await getDoc(settingsDocRef);
        if (!snap.exists()) {
          await setDoc(settingsDocRef, currentState.settings);
        } else {
          db.updateState((draft) => {
            draft.settings = { ...draft.settings, ...(snap.data() as any) };
          });
        }
      } catch (err) {
        console.warn('Firestore settings fetch notice:', err);
      }

      // 1. Attach real-time listener for USERS (Essential for multi-device registration & Direct Referral tracking!)
      const usersCol = collection(firestoreDb, 'users');
      const unsubUsers = onSnapshot(
        usersCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudUsers: User[] = [];
            snapshot.forEach((docSnap) => {
              const u = docSnap.data() as User;
              if (u && u.id) {
                cloudUsers.push(u);
              }
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
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      );
      this.unsubscribeListeners.push(unsubUsers);

      // 2. Attach real-time listener for WALLETS
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
          handleFirestoreError(error, OperationType.GET, 'wallets');
        }
      );
      this.unsubscribeListeners.push(unsubWallets);

      // 3. Attach real-time listener for HELP REQUESTS
      const helpRequestsCol = collection(firestoreDb, 'helpRequests');
      const unsubHelp = onSnapshot(
        helpRequestsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudReqs: HelpRequest[] = [];
            snapshot.forEach((docSnap) => {
              const r = docSnap.data() as HelpRequest;
              if (r && r.id) {
                cloudReqs.push(r);
              }
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
          handleFirestoreError(error, OperationType.GET, 'helpRequests');
        }
      );
      this.unsubscribeListeners.push(unsubHelp);

      // 4. Attach real-time listener for TRANSACTIONS
      const transCol = collection(firestoreDb, 'transactions');
      const unsubTrans = onSnapshot(
        transCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudTrans: Transaction[] = [];
            snapshot.forEach((docSnap) => {
              const t = docSnap.data() as Transaction;
              if (t && t.id) {
                cloudTrans.push(t);
              }
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
          handleFirestoreError(error, OperationType.GET, 'transactions');
        }
      );
      this.unsubscribeListeners.push(unsubTrans);

      // 5. Attach real-time listener for NOTIFICATIONS
      const notifsCol = collection(firestoreDb, 'notifications');
      const unsubNotifs = onSnapshot(
        notifsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudNotifs: NotificationItem[] = [];
            snapshot.forEach((docSnap) => {
              const n = docSnap.data() as NotificationItem;
              if (n && n.id) {
                cloudNotifs.push(n);
              }
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
          handleFirestoreError(error, OperationType.GET, 'notifications');
        }
      );
      this.unsubscribeListeners.push(unsubNotifs);

      // 6. Attach real-time listener for KYC RECORDS
      const kycCol = collection(firestoreDb, 'kycRecords');
      const unsubKyc = onSnapshot(
        kycCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudKyc: KycRecord[] = [];
            snapshot.forEach((docSnap) => {
              const k = docSnap.data() as KycRecord;
              if (k && k.id) {
                cloudKyc.push(k);
              }
            });

            db.updateState((draft) => {
              cloudKyc.forEach((ck) => {
                const idx = draft.kycRecords.findIndex((k) => k.id === ck.id);
                if (idx >= 0) {
                  draft.kycRecords[idx] = { ...draft.kycRecords[idx], ...ck };
                } else {
                  draft.kycRecords.unshift(ck);
                }
              });
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'kycRecords');
        }
      );
      this.unsubscribeListeners.push(unsubKyc);

      // 7. Attach real-time listener for WITHDRAWALS
      const withCol = collection(firestoreDb, 'withdrawals');
      const unsubWith = onSnapshot(
        withCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudWith: WithdrawalRequest[] = [];
            snapshot.forEach((docSnap) => {
              const w = docSnap.data() as WithdrawalRequest;
              if (w && w.id) {
                cloudWith.push(w);
              }
            });

            db.updateState((draft) => {
              cloudWith.forEach((cw) => {
                const idx = draft.withdrawals.findIndex((w) => w.id === cw.id);
                if (idx >= 0) {
                  draft.withdrawals[idx] = { ...draft.withdrawals[idx], ...cw };
                } else {
                  draft.withdrawals.unshift(cw);
                }
              });
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'withdrawals');
        }
      );
      this.unsubscribeListeners.push(unsubWith);

      // Periodic fetch fallback for mobile browsers & background tabs
      this.pollInterval = setInterval(() => {
        this.fetchAllFromCloud();
      }, 8000);

      // Initial one-time fetch to catch up on any data right away
      this.fetchAllFromCloud();

    } catch (e) {
      console.warn('Firestore sync initialization notice:', e);
    }
  }

  /**
   * One-time fetch of all collections from Firestore
   */
  public async fetchAllFromCloud(): Promise<void> {
    try {
      // Fetch users
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

      // Fetch help requests
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
    } catch (err) {
      console.warn('Periodic cloud fetch note:', err);
    }
  }

  /**
   * Fetch a single user by ID directly from Firestore (ensures login works on any device/browser)
   */
  public async fetchUserDirect(userId: string): Promise<User | null> {
    try {
      const docRef = doc(firestoreDb, 'users', userId);
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
    } catch (e) {
      console.warn('Direct user lookup note:', e);
    }
    return null;
  }

  /**
   * Save a Help Request to Firestore
   */
  public async syncHelpRequest(request: HelpRequest): Promise<void> {
    const docPath = `helpRequests/${request.id}`;
    try {
      const docRef = doc(firestoreDb, 'helpRequests', request.id);
      await setDoc(docRef, request, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  /**
   * Save a Transaction to Firestore
   */
  public async syncTransaction(transaction: Transaction): Promise<void> {
    const docPath = `transactions/${transaction.id}`;
    try {
      const docRef = doc(firestoreDb, 'transactions', transaction.id);
      await setDoc(docRef, transaction, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  /**
   * Save a User Profile to Firestore
   */
  public async syncUser(user: User): Promise<void> {
    const docPath = `users/${user.id}`;
    try {
      const docRef = doc(firestoreDb, 'users', user.id);
      await setDoc(docRef, user, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  /**
   * Save Wallet to Firestore
   */
  public async syncWallet(wallet: Wallet): Promise<void> {
    const docPath = `wallets/${wallet.userId}`;
    try {
      const docRef = doc(firestoreDb, 'wallets', wallet.userId);
      await setDoc(docRef, wallet, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  /**
   * Save KYC Record to Firestore
   */
  public async syncKycRecord(kyc: KycRecord): Promise<void> {
    const docPath = `kycRecords/${kyc.id}`;
    try {
      const docRef = doc(firestoreDb, 'kycRecords', kyc.id);
      await setDoc(docRef, kyc, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  /**
   * Save Withdrawal Request to Firestore
   */
  public async syncWithdrawal(withdrawal: WithdrawalRequest): Promise<void> {
    const docPath = `withdrawals/${withdrawal.id}`;
    try {
      const docRef = doc(firestoreDb, 'withdrawals', withdrawal.id);
      await setDoc(docRef, withdrawal, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
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
    this.unsubscribeListeners.forEach((unsub) => unsub());
    this.unsubscribeListeners = [];
    this.isInitialized = false;
  }
}

export const firestoreSync = new FirestoreSyncService();

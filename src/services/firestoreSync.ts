/**
 * HELP150 — Real-Time Firestore Synchronization Layer
 * Handles multi-device synchronization between local state and Firestore database.
 * Strictly adheres to Zero-Trust security rules and role-scoped permissions.
 */

import {
  firestoreDb,
  auth,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  FirebaseUser,
} from './firebase';
import { db } from './db';
import { HelpRequest, KycRecord, NotificationItem, Transaction, User, Wallet, WithdrawalRequest } from '../types';

class FirestoreSyncService {
  private isInitialized = false;
  private unsubscribeListeners: (() => void)[] = [];
  private pollInterval: any = null;

  /**
   * Sync initial data to Firestore if not already present,
   * and listen to real-time updates for users, wallets, helpRequests, transactions, etc.
   * Only executes if a user is authenticated with Firebase Auth.
   */
  public async initSync(user?: FirebaseUser | null): Promise<void> {
    const activeUser = user || auth.currentUser;
    if (!activeUser) {
      // Unauthenticated visitor: do not attach authenticated Firestore listeners
      return;
    }

    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const isAdmin = activeUser.email?.toLowerCase() === 'ashuk2968@gmail.com';
      const uid = activeUser.uid;

      // 1. Settings Synchronization
      const settingsDocRef = doc(firestoreDb, 'settings', 'global');
      try {
        const snap = await getDoc(settingsDocRef);
        if (snap.exists()) {
          db.updateState((draft) => {
            draft.settings = { ...draft.settings, ...(snap.data() as any) };
          });
        } else if (isAdmin) {
          await setDoc(settingsDocRef, db.getState().settings);
        }
      } catch (err) {
        console.warn('Firestore settings fetch notice:', err);
      }

      // 2. Real-time listener for USERS
      if (isAdmin) {
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
            handleFirestoreError(error, OperationType.GET, 'users');
          }
        );
        this.unsubscribeListeners.push(unsubUsers);
      } else {
        // Scoped to current authenticated user
        const userDocRef = doc(firestoreDb, 'users', uid);
        const unsubUser = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const cloudUser = docSnap.data() as User;
              db.updateState((draft) => {
                const idx = draft.users.findIndex((u) => u.id.toLowerCase() === cloudUser.id.toLowerCase());
                if (idx >= 0) {
                  draft.users[idx] = { ...draft.users[idx], ...cloudUser };
                } else {
                  draft.users.unshift(cloudUser);
                }
              });
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${uid}`);
          }
        );
        this.unsubscribeListeners.push(unsubUser);
      }

      // 3. Real-time listener for WALLETS
      if (isAdmin) {
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
      } else {
        const walletDocRef = doc(firestoreDb, 'wallets', uid);
        const unsubWallet = onSnapshot(
          walletDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const w = docSnap.data() as Wallet;
              db.updateState((draft) => {
                draft.wallets[uid] = { ...draft.wallets[uid], ...w };
              });
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `wallets/${uid}`);
          }
        );
        this.unsubscribeListeners.push(unsubWallet);
      }

      // 4. Real-time listener for HELP REQUESTS
      if (isAdmin) {
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
            handleFirestoreError(error, OperationType.GET, 'helpRequests');
          }
        );
        this.unsubscribeListeners.push(unsubHelp);
      } else {
        const helpQuery = query(
          collection(firestoreDb, 'helpRequests'),
          where('status', 'in', ['waiting_for_help', 'pending'])
        );
        const unsubHelp = onSnapshot(
          helpQuery,
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
            handleFirestoreError(error, OperationType.GET, 'helpRequests');
          }
        );
        this.unsubscribeListeners.push(unsubHelp);
      }

      // 5. Real-time listener for TRANSACTIONS
      if (isAdmin) {
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
            handleFirestoreError(error, OperationType.GET, 'transactions');
          }
        );
        this.unsubscribeListeners.push(unsubTrans);
      } else {
        const transQuery = query(
          collection(firestoreDb, 'transactions'),
          where('userId', '==', uid)
        );
        const unsubTrans = onSnapshot(
          transQuery,
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
            handleFirestoreError(error, OperationType.GET, 'transactions');
          }
        );
        this.unsubscribeListeners.push(unsubTrans);
      }

      // 6. Real-time listener for NOTIFICATIONS
      if (isAdmin) {
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
            handleFirestoreError(error, OperationType.GET, 'notifications');
          }
        );
        this.unsubscribeListeners.push(unsubNotifs);
      } else {
        const notifsQuery = query(
          collection(firestoreDb, 'notifications'),
          where('userId', 'in', [uid, 'all'])
        );
        const unsubNotifs = onSnapshot(
          notifsQuery,
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
            handleFirestoreError(error, OperationType.GET, 'notifications');
          }
        );
        this.unsubscribeListeners.push(unsubNotifs);
      }

      // 7. Real-time listener for KYC RECORDS
      if (isAdmin) {
        const kycCol = collection(firestoreDb, 'kycRecords');
        const unsubKyc = onSnapshot(
          kycCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudKyc: KycRecord[] = [];
              snapshot.forEach((docSnap) => {
                const k = docSnap.data() as KycRecord;
                if (k && k.id) cloudKyc.push(k);
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
      } else {
        const kycQuery = query(
          collection(firestoreDb, 'kycRecords'),
          where('userId', '==', uid)
        );
        const unsubKyc = onSnapshot(
          kycQuery,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudKyc: KycRecord[] = [];
              snapshot.forEach((docSnap) => {
                const k = docSnap.data() as KycRecord;
                if (k && k.id) cloudKyc.push(k);
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
      }

      // 8. Real-time listener for WITHDRAWALS
      if (isAdmin) {
        const withCol = collection(firestoreDb, 'withdrawals');
        const unsubWith = onSnapshot(
          withCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudWith: WithdrawalRequest[] = [];
              snapshot.forEach((docSnap) => {
                const w = docSnap.data() as WithdrawalRequest;
                if (w && w.id) cloudWith.push(w);
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
      } else {
        const withQuery = query(
          collection(firestoreDb, 'withdrawals'),
          where('userId', '==', uid)
        );
        const unsubWith = onSnapshot(
          withQuery,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudWith: WithdrawalRequest[] = [];
              snapshot.forEach((docSnap) => {
                const w = docSnap.data() as WithdrawalRequest;
                if (w && w.id) cloudWith.push(w);
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
      }

      // Periodic admin fetch fallback
      if (isAdmin) {
        this.pollInterval = setInterval(() => {
          this.fetchAllFromCloud();
        }, 15000);
      }

    } catch (e) {
      console.warn('Firestore sync initialization notice:', e);
    }
  }

  /**
   * One-time fetch of collections from Firestore (admin only)
   */
  public async fetchAllFromCloud(): Promise<void> {
    if (!auth.currentUser) return;
    const isAdmin = auth.currentUser.email?.toLowerCase() === 'ashuk2968@gmail.com';
    if (!isAdmin) return;

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
    } catch (err) {
      console.warn('Periodic cloud fetch note:', err);
    }
  }

  /**
   * Fetch a single user by ID directly from Firestore
   */
  public async fetchUserDirect(userId: string): Promise<User | null> {
    if (!auth.currentUser) return null;
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
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
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

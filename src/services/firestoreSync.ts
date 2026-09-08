/**
 * HELP150 — Real-Time Firestore Synchronization Layer
 * Handles synchronization between local state and Firestore database
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

  /**
   * Sync initial data to Firestore if not already present,
   * and listen to real-time updates.
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
        }
      } catch (err) {
        console.warn('Firestore settings fetch notice:', err);
      }

      // Attach real-time listener for helpRequests
      const helpRequestsCol = collection(firestoreDb, 'helpRequests');
      const unsubHelp = onSnapshot(
        helpRequestsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudReqs: HelpRequest[] = [];
            snapshot.forEach((docSnap) => {
              cloudReqs.push(docSnap.data() as HelpRequest);
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

      // Attach real-time listener for notifications
      const notifsCol = collection(firestoreDb, 'notifications');
      const unsubNotifs = onSnapshot(
        notifsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudNotifs: NotificationItem[] = [];
            snapshot.forEach((docSnap) => {
              cloudNotifs.push(docSnap.data() as NotificationItem);
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

    } catch (e) {
      console.warn('Firestore sync initialization notice:', e);
    }
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
    this.unsubscribeListeners.forEach((unsub) => unsub());
    this.unsubscribeListeners = [];
    this.isInitialized = false;
  }
}

export const firestoreSync = new FirestoreSyncService();

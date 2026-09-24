/**
 * HELP150 — Auth & Session Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Wallet, NotificationItem } from '../types';
import { db } from '../services/db';
import { api } from '../services/api';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
} from '../services/firebase';
import { firestoreSync } from '../services/firestoreSync';
import { referralTracker } from '../services/referralTracker';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  wallet: Wallet | null;
  notifications: NotificationItem[];
  unreadCount: number;
  isAdmin: boolean;
  isCompliance: boolean;
  activeTab: string;
  isFirebaseLoading: boolean;
  setActiveTab: (tab: string) => void;
  loginAs: (userId: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUserData: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Ashok Kumar for immediate preview delight
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('HELP150_AUTH_USER_ID') || 'H150-784920';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Multi-device server & Firestore cloud synchronization
  useEffect(() => {
    let isMounted = true;

    // Immediately connect to Firestore cloud database for real-time downline & team sync across devices
    firestoreSync.initSync();

    const syncWithServer = async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data?.firestoreQuotaExhausted) {
            firestoreSync.setQuotaCooldown();
          }
          if (data && Array.isArray(data.users)) {
            let hasAnyUpdate = false;
            db.updateState((draft) => {
              // 1. Merge users from all devices
              data.users.forEach((sUser: User) => {
                const idx = draft.users.findIndex(
                  (u) => u.id.toUpperCase() === sUser.id.toUpperCase()
                );
                if (idx < 0) {
                  draft.users.unshift(sUser);
                  hasAnyUpdate = true;
                } else {
                  if (
                    draft.users[idx].lastLoginAt !== sUser.lastLoginAt ||
                    draft.users[idx].status !== sUser.status ||
                    draft.users[idx].sponsorId !== sUser.sponsorId
                  ) {
                    if (draft.users[idx].status === 'blocked' && sUser.status === 'active') {
                      // Preserve local block status
                    } else {
                      draft.users[idx] = { ...draft.users[idx], ...sUser };
                      hasAnyUpdate = true;
                    }
                  }
                }
              });

              // 2. Merge wallets
              if (data.wallets) {
                Object.keys(data.wallets).forEach((uid) => {
                  if (!draft.wallets[uid]) {
                    draft.wallets[uid] = data.wallets[uid];
                    hasAnyUpdate = true;
                  }
                });
              }

              // 2.5 Merge system settings (Ensure promotion is disabled and links are live across all devices)
              if (data.settings) {
                draft.settings = {
                  ...draft.settings,
                  ...data.settings,
                  linkSystemEnabled: true,
                  promotionMode: false,
                  promotionEndedV1: true,
                };
                hasAnyUpdate = true;
              }

              // 3. Merge helpRequests (Including updates to matched receiver and status)
              if (Array.isArray(data.helpRequests)) {
                data.helpRequests.forEach((hr: any) => {
                  const hrIdx = draft.helpRequests.findIndex((x) => x.id === hr.id);
                  if (hrIdx < 0) {
                    draft.helpRequests.unshift(hr);
                    hasAnyUpdate = true;
                  } else {
                    const localHr = draft.helpRequests[hrIdx];
                    if (
                      localHr.status !== hr.status ||
                      localHr.matchedWithUserId !== hr.matchedWithUserId ||
                      localHr.amount !== hr.amount ||
                      localHr.paymentSlipUrl !== hr.paymentSlipUrl ||
                      localHr.proofReference !== hr.proofReference ||
                      localHr.adminApproved !== hr.adminApproved
                    ) {
                      draft.helpRequests[hrIdx] = { ...localHr, ...hr };
                      hasAnyUpdate = true;
                    }
                  }
                });
              }

              // 4. Merge helpCycles (50/100/200 Plan Loop) - Seamless Multi-Device Synchronization
              if (Array.isArray(data.helpCycles)) {
                if (!draft.helpCycles) draft.helpCycles = [];
                data.helpCycles.forEach((hc: any) => {
                  const hcIdx = draft.helpCycles.findIndex(
                    (x) => x.id === hc.id || (hc.userId && x.userId === hc.userId && x.cycleNumber === hc.cycleNumber)
                  );
                  if (hcIdx < 0) {
                    draft.helpCycles.unshift(hc);
                    hasAnyUpdate = true;
                  } else {
                    const local = draft.helpCycles[hcIdx];
                    const serverVerDone = hc.verificationLink?.status === 'completed' || hc.verificationLink?.status === 'submitted';
                    const localVerDone = local.verificationLink?.status === 'completed' || local.verificationLink?.status === 'submitted';
                    const serverSecDone = hc.secondLink?.status === 'completed' || hc.secondLink?.status === 'submitted';
                    const localSecDone = local.secondLink?.status === 'completed' || local.secondLink?.status === 'submitted';

                    const verReceiverChanged =
                      hc.verificationLink?.matchedWithUserId &&
                      local.verificationLink?.matchedWithUserId !== hc.verificationLink?.matchedWithUserId;
                    const secReceiverChanged =
                      hc.secondLink?.matchedWithUserId &&
                      local.secondLink?.matchedWithUserId !== hc.secondLink?.matchedWithUserId;
                    const receiveLinkChanged =
                      JSON.stringify(local.receiveLink) !== JSON.stringify(hc.receiveLink) ||
                      JSON.stringify(local.receiveLinks) !== JSON.stringify(hc.receiveLinks);

                    const needsUpdate =
                      local.status !== hc.status ||
                      verReceiverChanged ||
                      secReceiverChanged ||
                      receiveLinkChanged ||
                      (serverVerDone && !localVerDone) ||
                      (serverSecDone && !localSecDone) ||
                      local.verificationLink?.status !== hc.verificationLink?.status ||
                      local.secondLink?.status !== hc.secondLink?.status ||
                      local.verificationLink?.proofReference !== hc.verificationLink?.proofReference ||
                      local.secondLink?.proofReference !== hc.secondLink?.proofReference ||
                      local.verificationLink?.slipUrl !== hc.verificationLink?.slipUrl ||
                      local.secondLink?.slipUrl !== hc.secondLink?.slipUrl ||
                      local.timerExpiryTime !== hc.timerExpiryTime ||
                      local.completedAt !== hc.completedAt;

                    if (needsUpdate) {
                      const verFinalStatus = (serverVerDone || localVerDone) ? 'completed' : (hc.verificationLink?.status || local.verificationLink?.status || 'pending');
                      const secFinalStatus = (serverSecDone || localSecDone) ? 'completed' : (hc.secondLink?.status || local.secondLink?.status || 'pending');
                      const finalStatus = (verFinalStatus === 'completed' && secFinalStatus !== 'completed')
                        ? 'provide_second'
                        : (hc.status || local.status);

                      draft.helpCycles[hcIdx] = {
                        ...local,
                        ...hc,
                        status: finalStatus,
                        verificationLink: {
                          ...(local.verificationLink || {}),
                          ...(hc.verificationLink || {}),
                          status: verFinalStatus,
                        },
                        secondLink: {
                          ...(local.secondLink || {}),
                          ...(hc.secondLink || {}),
                          status: secFinalStatus === 'completed' ? 'completed' : 'pending',
                          deadlineTime: hc.secondLink?.deadlineTime || local.secondLink?.deadlineTime || Date.now() + 24 * 3600000,
                        },
                        receiveLink: hc.receiveLink ? {
                          ...(local.receiveLink || {}),
                          ...hc.receiveLink,
                        } : local.receiveLink,
                        receiveLinks: Array.isArray(hc.receiveLinks) && hc.receiveLinks.length > 0
                          ? hc.receiveLinks
                          : (local.receiveLinks || []),
                      };
                      hasAnyUpdate = true;
                    }
                  }
                });
              }
            });

            if (hasAnyUpdate && isMounted) {
              db.notifySubscribers();
              refreshUserData();
            }
          }
        }
      } catch (err) {
        // network sync silent
      }
    };

    syncWithServer();
    const interval = setInterval(syncWithServer, 1000);

    const handleFocusOrVisible = () => {
      syncWithServer();
    };
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      firestoreSync.cleanup();
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsFirebaseLoading(false);

      if (user) {
        // Authenticated with Firebase: start role-aware real-time synchronization
        firestoreSync.initSync(user);

        if (user.email) {
          // If logged in via Firebase Google Auth, find or link account
          const state = db.getState();
          let existing = state.users.find(
            (u) => u.email.toLowerCase() === user.email?.toLowerCase()
          );

          if (!existing) {
            // Register new Firebase Google user into HELP150 database
            const newUserId = `H150-${Math.floor(100000 + Math.random() * 900000)}`;
            const trackedSponsor =
              referralTracker.extractReferralFromUrl() ||
              referralTracker.getStoredReferral() ||
              'H150-784920';

            const newUser: User = {
              id: newUserId,
              fullName: user.displayName || 'Google Member',
              email: user.email,
              mobile: user.phoneNumber || '9876500000',
              role: user.email === 'ashuk2968@gmail.com' ? 'admin' : 'user',
              sponsorId: trackedSponsor,
              status: 'active',
              kycStatus: 'verified',
              isMobileVerified: true,
              isEmailVerified: true,
              joinedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              avatarUrl: user.photoURL || undefined,
            };

            const initialWallet = {
              userId: newUserId,
              availableBalance: 300,
              pendingBalance: 0,
              totalHelpedGiven: 150,
              totalHelpedReceived: 0,
              totalReferralRewards: 0,
              totalWithdrawn: 0,
              lastUpdated: new Date().toISOString(),
            };

            db.updateState((draft) => {
              draft.users.push(newUser);
              draft.wallets[newUserId] = initialWallet;
            });

            // Push to centralized server for instant cross-device recognition
            fetch('/api/sync/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                users: [newUser],
                wallets: { [newUserId]: initialWallet },
              }),
            }).catch(() => {});

            firestoreSync.syncUser(newUser);
            setCurrentUserId(newUserId);
            localStorage.setItem('HELP150_AUTH_USER_ID', newUserId);
          } else {
            setCurrentUserId(existing.id);
            localStorage.setItem('HELP150_AUTH_USER_ID', existing.id);
          }
        }
      } else {
        // Keep multi-device cloud listener active for public collections (users, wallets)
        // Only authenticated user actions require Firebase Auth token
      }
    });

    return () => {
      unsubscribe();
      firestoreSync.cleanup();
    };
  }, []);

  const refreshUserData = useCallback(() => {
    const state = db.getState();
    if (currentUserId) {
      const user = state.users.find((u) => u.id.toUpperCase() === currentUserId.toUpperCase()) || null;
      setCurrentUser(user);
      if (user) {
        const w = state.wallets[user.id] || null;
        setWallet(w);
        const notifs = state.notifications.filter(
          (n) => n.userId === 'all' || n.userId === user.id
        );
        setNotifications(notifs);
      } else {
        setWallet(null);
        setNotifications([]);
      }
    } else {
      setCurrentUser(null);
      setWallet(null);
      setNotifications([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    refreshUserData();
    const unsubscribeDb = db.subscribe(() => {
      refreshUserData();
    });
    return () => {
      unsubscribeDb();
    };
  }, [currentUserId, refreshUserData]);

  const loginAs = (userId: string) => {
    localStorage.setItem('HELP150_AUTH_USER_ID', userId);
    setCurrentUserId(userId);
    const state = db.getState();
    const user = state.users.find((u) => u.id === userId);
    if (user && user.role !== 'admin' && user.role !== 'compliance_officer') {
      try {
        db.getUserHelpCycle(userId);
      } catch (e) {
        // silent fallback
      }
    }
    if (user?.role === 'admin' || user?.role === 'compliance_officer') {
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Firebase Google Sign-In Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Firebase sign out error:', err);
    }
    localStorage.removeItem('HELP150_AUTH_USER_ID');
    setCurrentUserId(null);
    setCurrentUser(null);
    setWallet(null);
    setActiveTab('home');
  };

  const markNotificationRead = (id: string) => {
    db.updateState((draft) => {
      const item = draft.notifications.find((n) => n.id === id);
      if (item) item.isRead = true;
    });
    refreshUserData();
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    db.updateState((draft) => {
      draft.notifications.forEach((n) => {
        if (n.userId === 'all' || n.userId === currentUser.id) {
          n.isRead = true;
        }
      });
    });
    refreshUserData();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isAdmin = currentUser?.role === 'admin';
  const isCompliance = currentUser?.role === 'compliance_officer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        wallet,
        notifications,
        unreadCount,
        isAdmin,
        isCompliance,
        activeTab,
        isFirebaseLoading,
        setActiveTab,
        loginAs,
        loginWithGoogle,
        logout,
        refreshUserData,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


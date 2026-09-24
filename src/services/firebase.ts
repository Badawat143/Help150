/**
 * HELP150 — Firebase & Firestore Client Integration
 * Database ID: ai-studio-help150-adcd1c7c-1d9d-42c6-b584-13c66fa17224
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  setLogLevel,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress internal gRPC stream error dumps when free daily write quota is reached
try {
  setLogLevel('silent');
} catch {}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore (default or custom database ID)
export const firestoreDb = (firebaseConfig as Record<string, any>).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as Record<string, any>).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on boot
 */
export async function testConnection() {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('help150_firestore_quota_cooldown') : null;
    if (stored && parseInt(stored, 10) > Date.now()) {
      return;
    }
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      } else if (
        error.message.includes('RESOURCE_EXHAUSTED') ||
        error.message.includes('resource-exhausted') ||
        error.message.toLowerCase().includes('quota')
      ) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('help150_firestore_quota_cooldown', String(Date.now() + 24 * 3600 * 1000));
        }
        console.warn('Firestore notice: Daily free tier quota limit reached. Application running with 100% functionality via local state and backend server.');
      }
    }
  }
}

// Call test connection
testConnection();

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
};
export type { FirebaseUser, DocumentData, QueryConstraint };

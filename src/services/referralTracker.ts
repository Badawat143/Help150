/**
 * HELP150 — Intelligent Referral Link Tracking & Sponsor Resolver
 * Automatically detects referral parameters from URL, Hash, Path & Browser Storage.
 */

import { db } from './db';
import { firestoreSync } from './firestoreSync';
import { User } from '../types';

const STORAGE_KEY = 'help150_tracked_referral';

export interface SponsorLookupResult {
  exists: boolean;
  id: string;
  fullName: string;
  mobile?: string;
  status?: string;
  isAutoTracked?: boolean;
}

export class ReferralTrackerService {
  /**
   * Extract referral ID from any incoming URL format
   * Supports:
   *  - ?ref=H150-123456
   *  - ?sponsor=H150-123456
   *  - ?r=H150-123456
   *  - ?sponsorId=H150-123456
   *  - #/?ref=H150-123456
   *  - /ref/H150-123456
   *  - /register?ref=H150-123456
   */
  public extractReferralFromUrl(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      // 1. Check Standard Search Query Params
      const searchParams = new URLSearchParams(window.location.search);
      const refParam =
        searchParams.get('ref') ||
        searchParams.get('sponsor') ||
        searchParams.get('r') ||
        searchParams.get('sponsorId') ||
        searchParams.get('refId');

      if (refParam && refParam.trim()) {
        const cleaned = refParam.trim().toUpperCase();
        this.saveTrackedReferral(cleaned);
        return cleaned;
      }

      // 2. Check Hash Query Params (e.g. /#/?ref=H150-123456)
      if (window.location.hash && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        const hashRef =
          hashParams.get('ref') ||
          hashParams.get('sponsor') ||
          hashParams.get('r') ||
          hashParams.get('sponsorId');
        if (hashRef && hashRef.trim()) {
          const cleaned = hashRef.trim().toUpperCase();
          this.saveTrackedReferral(cleaned);
          return cleaned;
        }
      }

      // 3. Check Pathname pattern (e.g. /ref/H150-123456 or /join/H150-123456)
      const path = window.location.pathname;
      const pathMatch = path.match(/\/(?:ref|join|sponsor)\/([a-zA-Z0-9_-]+)/i);
      if (pathMatch && pathMatch[1]) {
        const cleaned = pathMatch[1].trim().toUpperCase();
        this.saveTrackedReferral(cleaned);
        return cleaned;
      }
    } catch (err) {
      console.warn('Referral extraction notice:', err);
    }

    // 4. Fallback to Stored Referral in Session / Local Storage
    return this.getStoredReferral();
  }

  /**
   * Save detected referral ID to persistent browser storage so user doesn't lose it while browsing
   */
  public saveTrackedReferral(refCode: string): void {
    if (!refCode) return;
    try {
      const code = refCode.trim().toUpperCase();
      sessionStorage.setItem(STORAGE_KEY, code);
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      // Storage access safe fallback
    }
  }

  /**
   * Get previously tracked referral ID from storage
   */
  public getStoredReferral(): string | null {
    try {
      const sessionRef = sessionStorage.getItem(STORAGE_KEY);
      if (sessionRef && sessionRef.trim()) return sessionRef.trim().toUpperCase();

      const localRef = localStorage.getItem(STORAGE_KEY);
      if (localRef && localRef.trim()) return localRef.trim().toUpperCase();
    } catch (e) {
      // ignore
    }
    return null;
  }

  /**
   * Clear tracked referral
   */
  public clearTrackedReferral(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Look up sponsor information in local state and Firestore database
   */
  public async lookupSponsor(sponsorId: string): Promise<SponsorLookupResult> {
    const raw = sponsorId.trim();
    const cleanId = raw.toUpperCase();
    const cleanDigits = raw.replace(/\D/g, '');
    if (!cleanId) {
      return { exists: false, id: '', fullName: '' };
    }

    // 1. Check local state
    const state = db.getState();
    let sponsor: User | undefined = state.users.find((u) => {
      if (u.id.toUpperCase() === cleanId) return true;
      if (u.id.toUpperCase() === `H150-${cleanId}`) return true;
      if (cleanDigits.length === 10 && u.mobile?.slice(-10) === cleanDigits) return true;
      if (cleanDigits.length === 6 && u.id.toUpperCase().endsWith(cleanDigits)) return true;
      return false;
    });

    // 2. Cross-device lookup from central server
    if (!sponsor) {
      try {
        const resp = await fetch(`/api/sponsor/${encodeURIComponent(cleanId)}`);
        if (resp.ok) {
          const sData = await resp.json();
          if (sData && sData.exists) {
            return {
              exists: true,
              id: sData.id,
              fullName: sData.fullName,
              status: sData.status,
            };
          }
        }
      } catch (err) {
        // network fallback
      }
    }

    // 3. Cross-device lookup from Firestore if not in memory
    if (!sponsor) {
      const cloudUser = await firestoreSync.fetchUserDirect(cleanId);
      if (cloudUser) {
        sponsor = cloudUser;
      }
    }

    if (sponsor) {
      return {
        exists: true,
        id: sponsor.id,
        fullName: sponsor.fullName,
        mobile: sponsor.mobile ? `+91 ${sponsor.mobile.slice(-4).padStart(10, '•')}` : undefined,
        status: sponsor.status,
      };
    }

    return {
      exists: false,
      id: cleanId,
      fullName: '',
    };
  }

  /**
   * Generate clean official referral link for any member
   */
  public generateReferralLink(userId: string): string {
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://help150.com';
    return `${origin}/?ref=${userId}`;
  }
}

export const referralTracker = new ReferralTrackerService();

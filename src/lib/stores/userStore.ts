import {action, computed, makeAutoObservable, runInAction} from 'mobx';
import type {User} from '../types/user';
import {USER_STORAGE_KEY} from '../constants';

interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

type RefreshExecutorResult = {access: string; refresh?: string} | null;
type RefreshExecutor = () => Promise<RefreshExecutorResult>;

export class UserStore {
  user: User | null = null;
  accessToken: string | null = null;
  refreshToken: string | null = null;
  isHydrated = false;

  // Proactive refresh wiring
  private refreshTimer: number | null = null;
  private refreshExec?: RefreshExecutor;

  constructor() {
    makeAutoObservable(this, {
      authHeader: computed,
      setAuth: action.bound,
      setTokens: action.bound,
      logout: action.bound,
      registerRefreshExecutor: action.bound,
    });
    this.hydrate();
  }

  /** Computed helper that builds the Authorization header. */
  get authHeader(): {Authorization?: string} {
    return this.accessToken
      ? {Authorization: `Bearer ${this.accessToken}`}
      : {};
  }

  /** Call this once (e.g., from client.ts) to inject the refresh function. */
  registerRefreshExecutor(exec: RefreshExecutor) {
    this.refreshExec = exec;
  }

  /** Populate the store with tokens and user data returned from login. */
  setAuth({access, refresh, user}: AuthResponse) {
    this.user = user;
    this.setTokens(access, refresh);
  }

  /** Update access/refresh tokens (supports rotation). Also persists + schedules proactive refresh. */
  setTokens(access: string, refresh?: string) {
    this.accessToken = access ?? null;
    if (refresh !== undefined) this.refreshToken = refresh ?? null;

    this.persistAuth();

    // (Re)schedule a proactive refresh if we can read exp
    this.clearRefreshTimer();
    const exp = decodeJwtExp(access);
    if (exp) {
      // refresh 60s before expiry (clamped to >=0)
      const leadMs = 60_000;
      const delay = Math.max(0, exp * 1000 - Date.now() - leadMs);

      this.refreshTimer = window.setTimeout(async () => {
        // If no executor or no refresh token, let the 401 path handle it
        if (!this.refreshExec || !this.refreshToken) return;

        try {
          const result = await this.refreshExec();
          if (result?.access) {
            this.setTokens(result.access, result.refresh);
          } else {
            // backend said no -> logout; 401 flow will also catch it
            this.logout();
          }
        } catch {
          // Swallow here; the interceptor 401 path will still work
        }
      }, delay);
    }
  }

  /** Clears all authentication and user data. */
  logout() {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.clearRefreshTimer();
    this.removePersistedAuth();
  }

  // -------------------- persistence & hydration --------------------

  private persistAuth() {
    try {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({
          access: this.accessToken,
          refresh: this.refreshToken,
          user: this.user,
        }),
      );
    } catch (e) {
      console.warn('Failed to persist auth to localStorage', e);
    }
  }

  private removePersistedAuth() {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove auth from localStorage', e);
    }
  }

  /** Load saved auth from localStorage and re-arm the proactive timer. */
  private async hydrate() {
    try {
      const json = localStorage.getItem(USER_STORAGE_KEY);
      if (json) {
        const {access, refresh, user}: AuthResponse = JSON.parse(json);
        runInAction(() => {
          this.user = user ?? null;
          this.accessToken = access ?? null;
          this.refreshToken = refresh ?? null;
        });
        // schedule proactive refresh if possible
        if (access) this.setTokens(access, refresh);
      }
    } catch (e) {
      console.warn('UserStore hydration failed', e);
    } finally {
      runInAction(() => {
        this.isHydrated = true;
      });
    }
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

/** Safe-ish JWT exp decoder; returns exp (seconds) or null */
function decodeJwtExp(accessToken: string): number | null {
  try {
    const base64 = accessToken.split('.')[1];
    const payload = JSON.parse(atob(base64));
    return typeof payload?.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

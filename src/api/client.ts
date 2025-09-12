import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import rootStore from '../lib/stores/rootStore.ts';
import i18n from 'i18next';

// -------------------- Axios instances --------------------
const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// A "bare" client that never attaches auth headers and has no interceptors.
// Use this ONLY for the refresh call to avoid infinite loops.
const refreshClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// -------------------- Helpers --------------------
const getAccessToken = () => rootStore.userStore.accessToken;
const getRefreshToken = () => rootStore.userStore.refreshToken;
const setTokens = (access: string, refresh?: string) =>
  rootStore.userStore.setTokens(access, refresh); // implement in your store
const logout = () => rootStore.userStore.logout?.(); // implement in your store

function withAuthHeader(config: InternalAxiosRequestConfig, token: string) {
  const headers = new AxiosHeaders(config.headers);
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
  return config;
}

// -------------------- Request interceptor --------------------
client.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    withAuthHeader(config, token);
  }
  return config;
});

// -------------------- Refresh logic (single-flight) --------------------
let refreshPromise: Promise<string | null> | null = null;

/**
 * Calls the refresh endpoint once and updates the store.
 * Returns the new access token or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    // Adjust path/body to your API
    const {data} = await refreshClient.post<{
      access: string;
      refresh?: string; // some APIs rotate it
    }>('/auth/refresh', {refreshToken});

    setTokens(data.access, data.refresh);
    return data.access;
  } catch (e) {
    return null;
  }
}

/**
 * Ensures only one refresh is in-flight. Others await the same promise.
 */
function getOrCreateRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      // Reset so future 401s can trigger a new refresh
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// -------------------- Response interceptor (401 handler) --------------------
client.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & {_retry?: boolean})
      | undefined;

    // If there's no response or no config, or it's not 401, just reject
    if (!original || status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite loops
    if (original._retry) {
      // Already retried once; give up and bubble error
      return Promise.reject(error);
    }

    // Try to refresh once for any 401 that could be due to an expired access token
    original._retry = true;
    const newAccess = await getOrCreateRefresh();

    if (!newAccess) {
      // Refresh failed: clear auth and reject
      logout?.();
      return Promise.reject(error);
    }

    // Re-attach the fresh token and retry the original request
    withAuthHeader(original, newAccess);
    return client(original);
  },
);

// -------------------- RequestWrapper (unchanged) --------------------
export type HandleOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: AxiosError) => void;
  successMessage?: string;
  errorMessage?: string;
  onFinally?: () => void;
};

export type ApiErrorData = {
  localKey?: string;
};

class RequestWrapper<T> {
  constructor(private promise: Promise<AxiosResponse<T>>) {}

  handle(opts: HandleOptions<T> = {}) {
    this.promise
      .then(res => {
        if (opts.successMessage) console.log(opts.successMessage);
        opts.onSuccess?.(res.data);
      })
      .catch((err: AxiosError<ApiErrorData>) => {
        if (!!err.response) {
          if (opts.errorMessage) {
            rootStore.uiStore.showSnackbar(opts.errorMessage, 'danger');
          } else if (err && err.response?.data?.localKey) {
            rootStore.uiStore.showSnackbar(
              i18n.t(err.response?.data?.localKey),
              'danger',
            );
          }
        } else {
          console.log('Network error:', err);
        }
        opts.onError?.(err);
      })
      .finally(() => {
        opts.onFinally?.();
      });
  }
}

export function wrapRequest<T>(p: Promise<AxiosResponse<T>>) {
  return new RequestWrapper<T>(p);
}

export default client;

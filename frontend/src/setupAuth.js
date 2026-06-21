import axios from 'axios';

// ─── Global Axios configuration ──────────────────────────────────────────────
// Ensures all axios requests send & accept cookies (for the httpOnly refreshToken)
axios.defaults.withCredentials = true;

// ─── Global fetch interceptor for JWT auto-refresh ───────────────────────────
// Strategy:
//   1. Attach the current access token (from localStorage) to every backend request.
//   2. If a 401 is received, silently call /api/auth/refresh with the cookie.
//   3. Store the new access token, then replay the original request once.
//   4. If refresh fails (cookie expired / revoked), clear state & redirect to /login.
//   5. Concurrent requests that arrive while a refresh is in-flight are queued
//      and replayed with the new token once it arrives.

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

export function setupAuth() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (url, options = {}) => {
    // Only intercept requests to our own backend
    const isApiRequest = typeof url === 'string' && url.startsWith(API_URL);

    if (!isApiRequest) {
      return originalFetch(url, options);
    }

    const token = localStorage.getItem('token');

    // Inject access token if not already present
    const headers = new Headers(options.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Always include credentials (cookies) for backend API calls
    const modifiedOptions = { ...options, headers, credentials: 'include' };

    let response = await originalFetch(url, modifiedOptions);

    // Skip refresh loop for auth endpoints themselves
    const isAuthEndpoint =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/logout');

    if (response.status === 401 && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(newToken => {
          headers.set('Authorization', `Bearer ${newToken}`);
          return originalFetch(url, { ...modifiedOptions, headers });
        });
      }

      isRefreshing = true;

      try {
        // Attempt silent refresh using the httpOnly refreshToken cookie
        const refreshResponse = await originalFetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const { token: newToken } = await refreshResponse.json();
          localStorage.setItem('token', newToken);
          processQueue(null, newToken);

          // Replay the original request with the new access token
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await originalFetch(url, { ...modifiedOptions, headers });
        } else {
          // Refresh token expired / revoked — force the user to log in again
          processQueue(new Error('Session expired'));
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } catch (err) {
        processQueue(err);
        localStorage.removeItem('token');
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  };
}

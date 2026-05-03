/**
 * ChefPath — Supabase Auth Client
 *
 * Handles sign-in, sign-up, sign-out, session management, and
 * transparent token refresh so users are never signed out mid-session.
 */

const SUPABASE_URL      = window.__SUPABASE_URL__      || '';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || '';
const AppRoutes = Object.assign({
  login:    '/login',
  dashboard: '/dashboard',
  lectures: '/lectures',
  lecture:  '/lecture'
}, window.__APP_ROUTES__ || {});

// ── Session helpers ──────────────────────────────────────────
const Session = {
  save(data) {
    // Supabase returns expires_in (seconds). Pre-compute absolute expiry.
    if (data.expires_in) {
      data._expires_at = Date.now() + (data.expires_in - 60) * 1000; // 60s buffer
    }
    localStorage.setItem('chefpath_session', JSON.stringify(data));
  },
  get() {
    const raw = localStorage.getItem('chefpath_session');
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    localStorage.removeItem('chefpath_session');
  },
  getJwt()    { return this.get()?.access_token  || null; },
  getUserId() { return this.get()?.user?.id       || null; },
  isExpired() {
    const s = this.get();
    if (!s) return true;
    if (!s._expires_at) return true; // No expiry info → force refresh to be safe
    return Date.now() >= s._expires_at;
  },
  getRefreshToken() { return this.get()?.refresh_token || null; }
};

// ── Auth API calls ───────────────────────────────────────────
const Auth = {

  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error_description || err.msg || 'Sign in failed');
    }
    const data = await res.json();
    Session.save(data);
    return data;
  },

  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error_description || err.msg || 'Sign up failed');
    }
    const data = await res.json();
    if (data.access_token) Session.save(data);
    return data;
  },

  /**
   * Exchange the stored refresh_token for a new access_token.
   * Returns true on success, false if refresh_token is missing or expired.
   */
  async refreshSession() {
    const refreshToken = Session.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (!res.ok) { Session.clear(); return false; }
      const data = await res.json();
      Session.save(data);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Returns a valid JWT, refreshing the session transparently if needed.
   * Returns null if the user must log in again.
   */
  async getValidJwt() {
    if (Session.isExpired()) {
      const ok = await this.refreshSession();
      if (!ok) return null;
    }
    return Session.getJwt();
  },

  signOut() {
    Session.clear();
    window.location.href = AppRoutes.login;
  },

  isAuthenticated() { return !!Session.getJwt(); },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = AppRoutes.login;
      return false;
    }
    return true;
  }
};

window.Session  = Session;
window.Auth     = Auth;
window.AppRoutes = AppRoutes;

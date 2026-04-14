/**
 * ChefPath — Supabase Auth Client
 *
 * Handles sign-in, sign-up, sign-out, and session management.
 * The JWT is stored and forwarded on every API call.
 */

const SUPABASE_URL = window.__SUPABASE_URL__ || '';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || '';
const AppRoutes = Object.assign({
  login: '/login',
  dashboard: '/dashboard',
  lectures: '/lectures',
  lecture: '/lecture'
}, window.__APP_ROUTES__ || {});

// ---- Session storage helpers ----
const Session = {
  save(data) {
    localStorage.setItem('chefpath_session', JSON.stringify(data));
  },
  get() {
    const raw = localStorage.getItem('chefpath_session');
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    localStorage.removeItem('chefpath_session');
  },
  getJwt() {
    const s = this.get();
    return s?.access_token || null;
  },
  getUserId() {
    const s = this.get();
    return s?.user?.id || null;
  }
};

// ---- Auth API calls to Supabase ----
const Auth = {

  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
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
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error_description || err.msg || 'Sign up failed');
    }

    const data = await res.json();
    // some flows auto-confirm, some require email verification
    if (data.access_token) Session.save(data);
    return data;
  },

  signOut() {
    Session.clear();
    window.location.href = AppRoutes.login;
  },

  isAuthenticated() {
    return !!Session.getJwt();
  },

  /** Redirect to login if not authenticated */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = AppRoutes.login;
      return false;
    }
    return true;
  }
};

window.Session = Session;
window.Auth = Auth;
window.AppRoutes = AppRoutes;

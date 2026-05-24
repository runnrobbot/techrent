import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase, fetchProfile as fetchProfileQuery } from "../lib/supabase";

const AuthContext = createContext(null);

// ─── Role-based home routes ──────────────────────────────────────────────
const HOME_BY_ROLE = {
  admin:  "admin-dashboard",
  lender: "lender-dashboard",
  user:   "home",
};

const homeFor = (role) => HOME_BY_ROLE[role] || "home";

export function AuthProvider({ children }) {
  // ─── State ──────────────────────────────────────────────────────────────
  const [user,        setUser]        = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [currentPage, setCurrentPage] = useState("landing");
  const [pageParams,  setPageParams]  = useState({});
  const [authError,   setAuthError]   = useState("");
  const [loading,     setLoading]     = useState(true);

  // ─── Refs untuk lifecycle safety ────────────────────────────────────────
  const mountedRef          = useRef(true);
  const initialRedirectDone = useRef(false);

  // ─── Navigation ─────────────────────────────────────────────────────────
  const navigate = useCallback((page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  // ─── Profile loader (safe terhadap unmount) ─────────────────────────────
  const loadProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await fetchProfileQuery(userId);
      if (error || !data) return null;
      if (mountedRef.current) setProfile(data);
      return data;
    } catch (err) {
      console.error("[Auth] loadProfile error:", err);
      return null;
    }
  }, []);

  // ─── Auth state initialization ──────────────────────────────────────────
  //
  // POLA SUPABASE V2 YANG BENAR:
  // 1. getSession() — handle initial state. Wrap di try/finally agar
  //    setLoading(false) PASTI dipanggil (cegah stuck loading).
  // 2. onAuthStateChange — SYNC callback (Supabase tidak await async di sini).
  //    Skip event "INITIAL_SESSION" karena sudah ditangani getSession().
  //    Async work (fetchProfile) fire-and-forget di luar callback.

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        if (session?.user) {
          setUser(session.user);
          const p = await loadProfile(session.user.id);
          if (mountedRef.current && p && !initialRedirectDone.current) {
            initialRedirectDone.current = true;
            navigate(homeFor(p.role));
          }
        }
      } catch (err) {
        console.error("[Auth] init error:", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // initial session sudah dihandle init() → skip
      if (event === "INITIAL_SESSION") return;
      if (!mountedRef.current) return;

      if (session?.user) {
        setUser(session.user);
        // Fire-and-forget; jangan await dalam callback ini
        loadProfile(session.user.id).then(p => {
          if (!mountedRef.current || !p) return;
          if (!initialRedirectDone.current) {
            initialRedirectDone.current = true;
            navigate(homeFor(p.role));
          }
        });
      } else {
        // SIGNED_OUT atau session expired
        setUser(null);
        setProfile(null);
        initialRedirectDone.current = false;
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError("Email atau password salah.");
        return false;
      }
      const p = await loadProfile(data.user.id);
      if (p) {
        initialRedirectDone.current = true;
        navigate(homeFor(p.role));
      }
      return true;
    } catch (err) {
      console.error("[Auth] login error:", err);
      setAuthError("Terjadi kesalahan. Coba lagi.");
      return false;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [loadProfile, navigate]);

  // ─── Register ───────────────────────────────────────────────────────────
  const register = useCallback(async ({ email, password, name, role = "user", phone = "" }) => {
    // Hanya izinkan 'user' atau 'lender' dari publik (admin via SQL)
    const safeRole = role === "lender" ? "lender" : "user";
    setLoading(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, role: safeRole, phone } },
      });
      if (error) {
        setAuthError(error.message);
        return false;
      }

      // Trigger handle_new_user() di DB insert profile setelah signup.
      // Polling sebentar sampai profile available (max ~3.5 detik).
      // Pakai exponential-ish backoff biar tidak spam request.
      let p = null;
      const delays = [400, 600, 800, 1000, 1200];
      for (const delay of delays) {
        await new Promise(r => setTimeout(r, delay));
        if (!mountedRef.current) return false;
        p = await loadProfile(data.user.id);
        if (p) break;
      }

      if (p) {
        initialRedirectDone.current = true;
        // Lender baru → arahkan ke setup toko
        if (p.role === "lender") navigate("lender-store-setup");
        else navigate(homeFor(p.role));
      } else {
        setAuthError("Akun dibuat. Silakan login.");
        navigate("login");
      }
      return true;
    } catch (err) {
      console.error("[Auth] register error:", err);
      setAuthError("Terjadi kesalahan. Coba lagi.");
      return false;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [loadProfile, navigate]);

  // ─── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    initialRedirectDone.current = false;
    navigate("landing");
  }, [navigate]);

  // ─── Update profile (local-only optimistic update) ──────────────────────
  const updateUser = useCallback((updates) => {
    setProfile(prev => prev ? ({ ...prev, ...updates }) : prev);
  }, []);

  // ─── Refresh profile dari DB (panggil setelah update DB) ────────────────
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null;
    return loadProfile(user.id);
  }, [user?.id, loadProfile]);

  return (
    <AuthContext.Provider value={{
      user, profile, loading, authError,
      currentPage, pageParams, navigate,
      login, register, logout,
      updateUser, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

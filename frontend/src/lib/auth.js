import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStore, getState, replaceState } from "@/lib/store";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const store = useStore();
  const readyRef = useRef(false);
  const pushTimer = useRef();
  const callbackHandled = useRef(false);

  const setToken = (tok, usr) => {
    if (tok) { localStorage.setItem("d2_token", tok); localStorage.setItem("d2_user", JSON.stringify(usr)); }
    else { localStorage.removeItem("d2_token"); localStorage.removeItem("d2_user"); }
  };

  // Merge local (localStorage) state into the account, then adopt merged result.
  const mergeAndAdopt = async () => {
    const s = getState();
    try {
      const r = await api.post("/user/sync", { obtained: s.obtained, fav_items: s.favItems, fav_activities: s.favActs });
      replaceState({ obtained: r.data.obtained, favItems: r.data.fav_items, favActs: r.data.fav_activities });
    } catch (e) { /* keep local copy */ }
  };

  const register = async (email, password) => {
    const r = await api.post("/auth/register", { email, password });
    setToken(r.data.token, r.data.user); setUser(r.data.user);
    await mergeAndAdopt();
    return r.data.user;
  };
  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    setToken(r.data.token, r.data.user); setUser(r.data.user);
    await mergeAndAdopt();
    return r.data.user;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (e) { /* ignore */ }
    setToken(null, null); setUser(null);
  };

  const checkAuth = async () => {
    try {
      const me = await api.get("/auth/me");
      setUser(me.data);
      await mergeAndAdopt();
    } catch { setUser(null); }
  };

  // Handle Emergent Google callback (#session_id=...) then fall back to /auth/me.
  const processCallback = async () => {
    const hash = window.location.hash || "";
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) return false;
    if (callbackHandled.current) return true;
    callbackHandled.current = true;
    const sid = decodeURIComponent(m[1]);
    try {
      const r = await api.post("/auth/session", { session_id: sid });
      setUser(r.data.user);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      await mergeAndAdopt();
      toast.success(`Signed in as ${r.data.user.name || r.data.user.email}`);
    } catch (e) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      toast.error("Google sign-in failed. Please try again.");
    }
    return true;
  };

  useEffect(() => {
    (async () => {
      if (window.location.hash?.includes("session_id=")) { await processCallback(); }
      else { await checkAuth(); }
      readyRef.current = true;
    })();
    // eslint-disable-next-line
  }, []);

  // When signed in, push checklist/favorites changes to the account (debounced).
  useEffect(() => {
    if (!user || !readyRef.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      api.put("/user/data", { obtained: store.obtained, fav_items: store.favItems, fav_activities: store.favActs }).catch(() => {});
    }, 800);
    return () => clearTimeout(pushTimer.current);
  }, [store, user]);

  return (
    <AuthCtx.Provider value={{ user, register, login, logout, loginWithGoogle }}>
      {children}
    </AuthCtx.Provider>
  );
};

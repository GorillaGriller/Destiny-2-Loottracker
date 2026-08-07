import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useStore, getState, replaceState } from "@/lib/store";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("d2_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("d2_user") || "null"); } catch { return null; }
  });
  const store = useStore();
  const readyRef = useRef(false);
  const pushTimer = useRef();

  const persist = (tok, usr) => {
    if (tok) { localStorage.setItem("d2_token", tok); localStorage.setItem("d2_user", JSON.stringify(usr)); }
    else { localStorage.removeItem("d2_token"); localStorage.removeItem("d2_user"); }
    setToken(tok || null); setUser(usr || null);
  };

  // Merge local state into the account, then adopt the merged result.
  const mergeAndAdopt = async () => {
    const s = getState();
    try {
      const r = await api.post("/user/sync", { obtained: s.obtained, fav_items: s.favItems, fav_activities: s.favActs });
      replaceState({ obtained: r.data.obtained, favItems: r.data.fav_items, favActs: r.data.fav_activities });
    } catch (e) { /* keep local */ }
  };

  const register = async (email, password) => {
    const r = await api.post("/auth/register", { email, password });
    persist(r.data.token, r.data.user);
    await mergeAndAdopt();
    return r.data.user;
  };
  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    persist(r.data.token, r.data.user);
    await mergeAndAdopt();
    return r.data.user;
  };
  const logout = () => { persist(null, null); };

  // On mount with an existing token: verify + merge/pull server state.
  useEffect(() => {
    if (!token) { readyRef.current = true; return; }
    (async () => {
      try {
        const me = await api.get("/auth/me");
        setUser(me.data); localStorage.setItem("d2_user", JSON.stringify(me.data));
        await mergeAndAdopt();
      } catch { persist(null, null); }
      finally { readyRef.current = true; }
    })();
    // eslint-disable-next-line
  }, []);

  // When signed in, push state changes to the account (debounced).
  useEffect(() => {
    if (!token || !readyRef.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      api.put("/user/data", { obtained: store.obtained, fav_items: store.favItems, fav_activities: store.favActs }).catch(() => {});
    }, 800);
    return () => clearTimeout(pushTimer.current);
  }, [store, token]);

  return <AuthCtx.Provider value={{ token, user, register, login, logout }}>{children}</AuthCtx.Provider>;
};

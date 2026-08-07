import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStore, getState, replaceState } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, UserCheck } from "lucide-react";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [merge, setMerge] = useState(null); // { localCount }
  const store = useStore();
  const readyRef = useRef(false);
  const pushTimer = useRef();
  const mergeResolve = useRef(null);
  const callbackHandled = useRef(false);

  const setToken = (tok, usr) => {
    if (tok) { localStorage.setItem("d2_token", tok); localStorage.setItem("d2_user", JSON.stringify(usr)); }
    else { localStorage.removeItem("d2_token"); localStorage.removeItem("d2_user"); }
  };

  const pushLocalToServer = async () => {
    const s = getState();
    try {
      const r = await api.post("/user/sync", { obtained: s.obtained, fav_items: s.favItems, fav_activities: s.favActs });
      replaceState({ obtained: r.data.obtained, favItems: r.data.fav_items, favActs: r.data.fav_activities });
    } catch (e) { /* keep local */ }
  };

  const pullServer = async () => {
    try {
      const r = await api.get("/user/data");
      replaceState({ obtained: r.data.obtained, favItems: r.data.fav_items, favActs: r.data.fav_activities });
    } catch (e) { /* ignore */ }
  };

  // Ask the user how to reconcile local device data with their account.
  const askMerge = (localCount) =>
    new Promise((resolve) => { mergeResolve.current = resolve; setMerge({ localCount }); });

  const resolveMerge = (choice) => {
    setMerge(null);
    if (mergeResolve.current) { mergeResolve.current(choice); mergeResolve.current = null; }
  };

  const afterAuth = async ({ prompt } = {}) => {
    const s = getState();
    const localCount = (s.obtained?.length || 0) + (s.favItems?.length || 0) + (s.favActs?.length || 0);
    if (prompt && localCount > 0) {
      const choice = await askMerge(localCount);
      if (choice === "merge") { await pushLocalToServer(); toast.success("Device progress merged into your account"); }
      else { await pullServer(); toast.success("Using your account's saved progress"); }
    } else {
      await pushLocalToServer(); // silent union (safe, no data loss)
    }
  };

  const register = async (email, password) => {
    const r = await api.post("/auth/register", { email, password });
    setToken(r.data.token, r.data.user); setUser(r.data.user);
    await afterAuth({ prompt: false });
    return r.data.user;
  };
  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    setToken(r.data.token, r.data.user); setUser(r.data.user);
    await afterAuth({ prompt: true });
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
      await afterAuth({ prompt: false }); // silent union on reload
    } catch { setUser(null); }
  };

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
      await afterAuth({ prompt: true }); // ask before merging on Google sign-in
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
      <Dialog open={!!merge} onOpenChange={(o) => { if (!o) resolveMerge("account"); }}>
        <DialogContent data-testid="merge-dialog" className="max-w-md border-white/10 bg-[#0b0f14]">
          <DialogHeader>
            <DialogTitle className="font-display">Merge your progress?</DialogTitle>
            <DialogDescription>
              You've tracked <span className="font-semibold text-foreground">{merge?.localCount}</span> item{merge?.localCount === 1 ? "" : "s"} on this device.
              Add them to your account, or use only what's already saved to your account?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button data-testid="merge-confirm-button" className="w-full justify-start gap-2" onClick={() => resolveMerge("merge")}>
              <CloudUpload size={16} /> Merge this device into my account
            </Button>
            <Button data-testid="merge-skip-button" variant="outline" className="w-full justify-start gap-2" onClick={() => resolveMerge("account")}>
              <UserCheck size={16} /> Use my account's progress only
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthCtx.Provider>
  );
};

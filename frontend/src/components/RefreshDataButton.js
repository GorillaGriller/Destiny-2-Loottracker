import { useEffect, useState, useRef } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const RefreshDataButton = ({ variant = "outline", size = "default" }) => {
  const [state, setState] = useState("idle");
  const [version, setVersion] = useState(null);
  const pollRef = useRef();

  const loadStatus = async () => {
    try { const r = await api.get("/refresh/status"); setState(r.data.state); setVersion(r.data.manifest_version); return r.data; }
    catch { return null; }
  };

  useEffect(() => { loadStatus(); return () => clearInterval(pollRef.current); }, []);

  const start = async () => {
    if (state === "running") return;
    setState("running");
    toast.info("Checking Bungie for the latest loot data…");
    try { await api.post("/refresh"); } catch { toast.error("Could not start refresh"); setState("error"); return; }
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const s = await loadStatus();
      if (!s) return;
      if (s.state === "done") { clearInterval(pollRef.current); toast.success(s.message || "Loot data updated"); }
      if (s.state === "error") { clearInterval(pollRef.current); toast.error(`Refresh failed: ${s.message}`); }
    }, 3000);
  };

  const Icon = state === "error" ? AlertTriangle : state === "done" ? CheckCircle2 : RefreshCw;
  return (
    <Button data-testid="refresh-data-button" variant={variant} size={size} onClick={start} disabled={state === "running"} className="gap-2">
      <Icon size={15} className={state === "running" ? "animate-spin" : ""} />
      {state === "running" ? "Updating…" : "Update Loot Data"}
    </Button>
  );
};

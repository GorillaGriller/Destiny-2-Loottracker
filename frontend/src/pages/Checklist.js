import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy, RotateCcw } from "lucide-react";
import { api, TYPE_META } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LoadingGrid } from "@/components/LoadingGrid";
import { useStore, clearObtained } from "@/lib/store";

export default function Checklist() {
  const [activities, setActivities] = useState(null);
  const { obtained, favActs } = useStore();

  useEffect(() => { api.get("/activities").then((r) => setActivities(r.data.activities)).catch(() => setActivities([])); }, []);

  const obtainedSet = useMemo(() => new Set(obtained), [obtained]);

  const overall = useMemo(() => {
    if (!activities) return { done: 0, total: 0 };
    const all = new Set();
    activities.forEach((a) => (a.item_hashes || []).forEach((h) => all.add(h)));
    let done = 0; all.forEach((h) => { if (obtainedSet.has(h)) done++; });
    return { done, total: all.size };
  }, [activities, obtainedSet]);

  const pct = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;

  const rows = (activities || []).map((a) => {
    const total = a.item_hashes?.length || 0;
    const done = (a.item_hashes || []).filter((h) => obtainedSet.has(h)).length;
    return { ...a, total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }).sort((x, y) => (favActs.includes(y.id) - favActs.includes(x.id)) || (y.pct - x.pct));

  return (
    <main data-testid="checklist-page" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-2 label-caps">Farming Tracker</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your Checklist</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Progress is saved on this device. Mark items as obtained from any loot table or item detail.</p>

      {/* Overall */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <Trophy size={20} className="text-[hsl(var(--primary))]" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="label-caps">Overall Collection</span>
              <span className="font-mono text-sm" data-testid="checklist-overall-label">{overall.done}/{overall.total} · {pct}%</span>
            </div>
            <Progress value={pct} className="mt-2 h-2.5 bg-white/10" data-testid="checklist-overall-progress" />
          </div>
          <Button variant="outline" size="sm" className="gap-1" data-testid="checklist-reset" onClick={() => clearObtained()}><RotateCcw size={14} /> Reset</Button>
        </div>
      </div>

      {/* Per activity */}
      <div className="mt-6">
        {!activities ? <LoadingGrid count={6} square={false} /> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((a) => {
              const meta = TYPE_META[a.type] || TYPE_META.raid;
              return (
                <Link key={a.id} to={`/activity/${a.id}`} data-testid="checklist-activity-row"
                  className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/25">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
                    <ArrowRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="mt-1 font-display text-base font-semibold">{a.name}</h3>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="label-caps">Collected</span>
                    <span className="font-mono text-muted-foreground">{a.done}/{a.total}</span>
                  </div>
                  <Progress value={a.pct} className="mt-1.5 h-1.5 bg-white/10" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

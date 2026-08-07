import { useEffect, useMemo, useState } from "react";
import { Target, CheckCircle2 } from "lucide-react";
import { api, TYPE_META } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LootItemCard } from "@/components/LootItemCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { LoadingGrid } from "@/components/LoadingGrid";
import { EmptyState } from "@/components/EmptyState";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";

const ALL = "all";

export default function Targets() {
  const [activities, setActivities] = useState(null);
  const [sel, setSel] = useState(ALL);
  const [detail, setDetail] = useState(null);   // full activity detail cache
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const { obtained } = useStore();
  const obtainedSet = useMemo(() => new Set(obtained), [obtained]);

  useEffect(() => { api.get("/activities").then((r) => setActivities(r.data.activities)).catch(() => setActivities([])); }, []);

  // Fetch details for selected (or all) activities
  useEffect(() => {
    if (!activities) return;
    const ids = sel === ALL ? activities.map((a) => a.id) : [sel];
    const missing = ids.filter((id) => !details[id]);
    if (missing.length === 0) { setDetail(true); return; }
    setLoading(true);
    Promise.all(missing.map((id) => api.get(`/activities/${id}`).then((r) => [id, r.data]).catch(() => [id, null])))
      .then((pairs) => {
        setDetails((prev) => { const n = { ...prev }; pairs.forEach(([id, d]) => { if (d) n[id] = d; }); return n; });
        setLoading(false); setDetail(true);
      });
    // eslint-disable-next-line
  }, [sel, activities]);

  const groups = useMemo(() => {
    if (!activities) return [];
    const ids = sel === ALL ? activities.map((a) => a.id) : [sel];
    return ids.map((id) => {
      const d = details[id];
      if (!d) return null;
      const items = [];
      d.encounters.forEach((e) => e.items.forEach((it) => items.push(it)));
      d.shared_weapons.forEach((it) => items.push(it));
      d.armor.forEach((it) => items.push(it));
      const seen = new Set();
      const unique = items.filter((it) => (seen.has(it.hash) ? false : seen.add(it.hash)));
      const missing = unique.filter((it) => !obtainedSet.has(it.hash));
      return { id, name: d.name, type: d.type, total: unique.length, missing };
    }).filter(Boolean).filter((g) => g.missing.length > 0);
  }, [details, activities, sel, obtainedSet]);

  const totalMissing = groups.reduce((s, g) => s + g.missing.length, 0);
  const openItem = (it) => { setActive(it); setOpen(true); };

  return (
    <main data-testid="targets-page" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-2 label-caps">Farming Targets</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">What You Still Need</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Only the drops you haven't collected yet — your personal farming list.</p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="min-w-[220px]">
          <label className="label-caps mb-1 block">Activity</label>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger data-testid="targets-activity-select" className="h-9 border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80 border-white/10 bg-[#0b0f14]">
              <SelectItem value={ALL}>All Activities</SelectItem>
              {(activities || []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">
          <span className="font-mono text-lg text-[hsl(var(--primary))]" data-testid="targets-total">{totalMissing}</span>
          <span className="ml-1 text-muted-foreground">items remaining</span>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {!activities || (loading && !detail) ? <LoadingGrid count={10} />
          : groups.length === 0 ? (
            <EmptyState title="All caught up!" desc="You've collected every tracked drop for this selection. Time to flex." />
          ) : groups.map((g) => {
            const meta = TYPE_META[g.type] || TYPE_META.raid;
            const done = g.total - g.missing.length;
            const pct = g.total ? Math.round((done / g.total) * 100) : 0;
            return (
              <section key={g.id} data-testid="targets-group">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
                    {g.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{g.missing.length} left · {pct}% done</span>
                    <div className="w-28"><Progress value={pct} className="h-1.5 bg-white/10" /></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {g.missing.map((it) => <LootItemCard key={it.hash} item={it} onOpen={openItem} />)}
                </div>
              </section>
            );
          })}
      </div>
      <ItemDetailModal item={active} open={open} onOpenChange={setOpen} />
    </main>
  );
}

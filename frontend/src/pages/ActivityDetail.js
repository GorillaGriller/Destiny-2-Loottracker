import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Boxes } from "lucide-react";
import { api } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EncounterSection } from "@/components/EncounterSection";
import { LootItemCard } from "@/components/LootItemCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { LoadingGrid } from "@/components/LoadingGrid";
import { useStore, setManyObtained } from "@/lib/store";
import { TYPE_META } from "@/lib/api";

export default function ActivityDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const { obtained } = useStore();

  useEffect(() => {
    setData(null); setErr(false);
    api.get(`/activities/${id}`).then((r) => setData(r.data)).catch(() => setErr(true));
    window.scrollTo(0, 0);
  }, [id]);

  const openItem = (it) => { setActive(it); setOpen(true); };

  const allHashes = data?.all_item_hashes || [];
  const done = useMemo(() => allHashes.filter((h) => obtained.includes(h)).length, [allHashes, obtained]);
  const pct = allHashes.length ? Math.round((done / allHashes.length) * 100) : 0;

  if (err) return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center" data-testid="error-state">
      <h1 className="font-display text-2xl">Activity not found</h1>
      <Button asChild variant="secondary" className="mt-4"><Link to="/activities">Back to Activities</Link></Button>
    </main>
  );
  if (!data) return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><LoadingGrid count={10} /></main>;

  const meta = TYPE_META[data.type] || TYPE_META.raid;
  const armorByClass = data.armor.reduce((acc, a) => { const k = a.class_type || "Any"; (acc[k] = acc[k] || []).push(a); return acc; }, {});

  return (
    <main data-testid="activity-detail-page">
      {/* Banner header */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        {data.banner ? <img src={data.banner} alt={data.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-black/40" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(var(--background)) 4%, rgba(10,14,18,0.55) 45%, rgba(10,14,18,0.2))" }} />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="mb-3 gap-1 text-muted-foreground" data-testid="back-button">
              <Link to="/activities"><ArrowLeft size={15} /> Activities</Link>
            </Button>
            <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ borderColor: meta.color, color: meta.color, background: "rgba(0,0,0,0.4)" }}>{meta.label}</span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">{data.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin size={14} /> {data.location}</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> {data.release}</span>
              <span className="flex items-center gap-1"><Boxes size={14} /> {data.counts?.total} items</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <p className="max-w-3xl text-muted-foreground">{data.description}</p>

        {/* Progress panel */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="label-caps">Collection Progress</span>
            <span className="font-mono text-sm" data-testid="activity-completion-label">{done}/{allHashes.length} · {pct}%</span>
          </div>
          <Progress value={pct} className="h-2 bg-white/10" data-testid="activity-completion-progress" />
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" data-testid="mark-all-button" onClick={() => setManyObtained(allHashes, true)}>Mark all obtained</Button>
            <Button size="sm" variant="outline" data-testid="unmark-all-button" onClick={() => setManyObtained(allHashes, false)}>Reset</Button>
          </div>
        </div>

        {/* Encounters */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Encounters & Boss Drops</h2>
          {data.encounters.map((enc) => <EncounterSection key={enc.order} encounter={enc} onOpenItem={openItem} />)}
        </section>

        {/* Shared weapon pool */}
        {data.shared_weapons?.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Additional Weapon Drops</h2>
              <p className="text-sm text-muted-foreground">Other weapons in this activity's reward pool.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {data.shared_weapons.map((it) => <LootItemCard key={it.hash} item={it} onOpen={openItem} />)}
            </div>
          </section>
        ) : null}

        {/* Armor */}
        {data.armor?.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Armor Set</h2>
              <p className="text-sm text-muted-foreground">Full armor set dropped across this activity.</p>
            </div>
            {Object.entries(armorByClass).map(([cls, pieces]) => (
              <div key={cls}>
                <div className="label-caps mb-2">{cls}</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {pieces.map((it) => <LootItemCard key={it.hash} item={it} onOpen={openItem} />)}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>

      <ItemDetailModal item={active} open={open} onOpenChange={setOpen} />
    </main>
  );
}

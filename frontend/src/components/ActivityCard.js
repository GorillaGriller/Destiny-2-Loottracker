import { Link } from "react-router-dom";
import { Star, MapPin, Swords, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TYPE_META } from "@/lib/api";
import { useStore, toggleFavActivity } from "@/lib/store";

export const ActivityCard = ({ activity }) => {
  const { obtained, favActs } = useStore();
  const meta = TYPE_META[activity.type] || TYPE_META.raid;
  const total = activity.item_hashes?.length || 0;
  const done = (activity.item_hashes || []).filter((h) => obtained.includes(h)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isFav = favActs.includes(activity.id);

  return (
    <div data-testid="activity-card" className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[var(--shadow-soft)] transition-colors duration-150 hover:border-white/25">
      <span className="absolute left-0 top-0 z-10 h-full w-[3px]" style={{ background: meta.color }} />
      <div className="relative h-36 overflow-hidden">
        {activity.banner ? (
          <img src={activity.banner} alt={activity.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : <div className="h-full w-full bg-black/40" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,14,18,0.96) 6%, rgba(10,14,18,0.2) 60%, transparent)" }} />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ borderColor: meta.color, color: meta.color, background: "rgba(0,0,0,0.4)" }}>{meta.label}</span>
        </div>
        <button data-testid="activity-card-favorite" onClick={() => toggleFavActivity(activity.id)} aria-label="Favorite activity"
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur ${isFav ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-400" : "border-white/15 bg-black/40 text-white/80 hover:text-white"}`}>
          <Star size={15} fill={isFav ? "currentColor" : "none"} />
        </button>
        <div className="absolute bottom-2 left-4 right-4">
          <h3 className="font-display text-lg font-semibold leading-tight">{activity.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {activity.location} · {activity.release}</div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Swords size={13} /> {activity.counts?.weapons || 0} weapons</span>
          <span className="flex items-center gap-1"><Shield size={13} /> {activity.counts?.armor || 0} armor</span>
          {activity.encounter_count ? <span>· {activity.encounter_count} bosses</span> : null}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="label-caps">Collected</span>
            <span className="font-mono text-muted-foreground" data-testid="activity-card-progress-label">{done}/{total}</span>
          </div>
          <Progress value={pct} className="h-1.5 bg-white/10" />
        </div>
        <Button asChild data-testid="activity-card-view-button" className="w-full" style={{ background: meta.color, color: "#0b0f14" }}>
          <Link to={`/activity/${activity.id}`}>View Loot Table</Link>
        </Button>
      </div>
    </div>
  );
};

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, CalendarClock, ArrowRight, Info } from "lucide-react";
import { api, TYPE_META } from "@/lib/api";
import { LoadingGrid } from "@/components/LoadingGrid";

// Destiny resets at 17:00 UTC; weekly reset is Tuesday 17:00 UTC.
function nextDaily(now) {
  const r = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 17, 0, 0));
  if (r <= now) r.setUTCDate(r.getUTCDate() + 1);
  return r;
}
function nextWeekly(now) {
  let r = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 17, 0, 0));
  while (r.getUTCDay() !== 2 || r <= now) r.setUTCDate(r.getUTCDate() + 1);
  return r;
}
function fmt(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return { d, h, m, s: sec };
}

const Countdown = ({ target, label, icon: Icon, accent }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const t = fmt(target - now);
  const Cell = ({ v, u }) => (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl" style={{ color: accent }}>{String(v).padStart(2, "0")}</span>
      <span className="label-caps">{u}</span>
    </div>
  );
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5" data-testid="rotation-countdown">
      <div className="mb-3 flex items-center gap-2 label-caps"><Icon size={14} style={{ color: accent }} /> {label}</div>
      <div className="flex items-center gap-4">
        <Cell v={t.d} u="Days" /><span className="text-xl text-muted-foreground">:</span>
        <Cell v={t.h} u="Hrs" /><span className="text-xl text-muted-foreground">:</span>
        <Cell v={t.m} u="Min" /><span className="text-xl text-muted-foreground">:</span>
        <Cell v={t.s} u="Sec" />
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{target.toUTCString().replace("GMT", "UTC")}</div>
    </div>
  );
};

const ROTATORS = [
  { id: "nightfall_ordeal", cadence: "Resets weekly", note: "The featured Strike & its weapon change every weekly reset." },
  { id: "the_wellspring", cadence: "Rotates daily", note: "The active boss (and its craftable weapon) rotates each daily reset." },
  { id: "trials_of_osiris", cadence: "Every weekend", note: "Live Fri–Tue. The featured Adept weapon changes weekly." },
  { id: "iron_banner", cadence: "Seasonal weeks", note: "Runs for a full week, a few times per season, via Lord Saladin." },
];

export default function Rotation() {
  const [byId, setById] = useState(null);
  const now = new Date();
  const daily = useMemo(() => nextDaily(now), []); // eslint-disable-line
  const weekly = useMemo(() => nextWeekly(now), []); // eslint-disable-line

  useEffect(() => {
    api.get("/activities").then((r) => {
      const map = {}; r.data.activities.forEach((a) => (map[a.id] = a)); setById(map);
    }).catch(() => setById({}));
  }, []);

  return (
    <main data-testid="rotation-page" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-2 label-caps">This Week in Destiny</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Rotation & Reset Tracker</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Live countdowns to the next daily and weekly resets, plus the rotating activities worth farming.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Countdown target={weekly} label="Next Weekly Reset (Tuesday)" icon={CalendarClock} accent="#F6C453" />
        <Countdown target={daily} label="Next Daily Reset" icon={Clock} accent="#7FE7FF" />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold tracking-tight">Rotating Activities</h2>
      </div>

      {!byId ? <div className="mt-4"><LoadingGrid count={4} square={false} /></div> : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ROTATORS.map((rot) => {
            const a = byId[rot.id];
            if (!a) return null;
            const meta = TYPE_META[a.type] || TYPE_META.raid;
            return (
              <Link key={rot.id} to={`/activity/${a.id}`} data-testid="rotation-activity-card"
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-white/25">
                <div className="relative h-32 overflow-hidden">
                  {a.banner ? <img src={a.banner} alt={a.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="h-full w-full bg-black/40" />}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,14,18,0.96) 8%, rgba(10,14,18,0.25) 60%, transparent)" }} />
                  <span className="absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ borderColor: meta.color, color: meta.color, background: "rgba(0,0,0,0.4)" }}>{meta.label}</span>
                  <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] text-white/90">{rot.cadence}</span>
                  <div className="absolute bottom-2 left-4 right-4 flex items-end justify-between">
                    <h3 className="font-display text-lg font-semibold">{a.name}</h3>
                    <ArrowRight size={18} className="mb-1 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-sm text-muted-foreground">{rot.note}</p>
                  <div className="pt-1 text-xs" style={{ color: meta.color }}>{a.counts?.weapons || 0} weapons · {a.counts?.armor || 0} armor in the pool →</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground" data-testid="rotation-note">
        <Info size={16} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" />
        <p>Reset countdowns are exact. The specific weapon featured on any given day/week is served from Bungie's live rotation feed, which requires an authenticated Bungie API key — connect one and this page can pin the exact featured drop. For now, browse each activity's full reward pool above.</p>
      </div>
    </main>
  );
}

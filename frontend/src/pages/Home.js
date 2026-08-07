import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Swords, Shield, Sparkles, Boxes, Search as SearchIcon } from "lucide-react";
import { api } from "@/lib/api";
import { ActivityCard } from "@/components/ActivityCard";
import { LoadingGrid } from "@/components/LoadingGrid";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { Button } from "@/components/ui/button";

const Stat = ({ icon: Icon, value, label }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <Icon size={18} className="text-[hsl(var(--primary))]" />
    <div className="mt-2 font-display text-2xl font-semibold" data-testid="stat-value">{value ?? "—"}</div>
    <div className="label-caps">{label}</div>
  </div>
);

export default function Home() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/activities").then((r) => setActivities(r.data.activities)).catch(() => setActivities([]));
  }, []);

  const featured = (activities || []).slice(0, 6);

  return (
    <main data-testid="home-page">
      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="home-hero">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(900px 380px at 20% 0%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(700px 320px at 85% 10%, rgba(255,154,61,0.08), transparent 55%)" }} />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <span className="label-caps rounded-full border border-white/10 bg-white/5 px-3 py-1">Destiny 2 · Loot Index</span>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Know every <span className="text-[hsl(var(--primary))]">boss drop</span> before you dive in.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Complete raid & dungeon loot tables with real weapon icons, elements and rarities — plus a farming checklist to track exactly what you still need.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2" data-testid="hero-browse-button">
                <Link to="/activities">Browse Activities <ArrowRight size={16} /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2" data-testid="hero-search-button">
                <Link to="/search"><SearchIcon size={16} /> Search Loot</Link>
              </Button>
              <RefreshDataButton variant="ghost" size="lg" />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Stat icon={Boxes} value={stats?.activities} label="Activities" />
            <Stat icon={Swords} value={stats?.weapons} label="Weapons" />
            <Stat icon={Shield} value={stats?.armor} label="Armor Pieces" />
            <Stat icon={Sparkles} value={stats?.exotics} label="Exotics" />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Featured Activities</h2>
          <Link to="/activities" className="flex items-center gap-1 text-sm text-[hsl(var(--primary))] hover:underline" data-testid="home-view-all">View all <ArrowRight size={14} /></Link>
        </div>
        {!activities ? <LoadingGrid count={6} square={false} /> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {featured.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        )}
      </section>
    </main>
  );
}

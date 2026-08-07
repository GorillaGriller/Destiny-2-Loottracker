import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityCard } from "@/components/ActivityCard";
import { LoadingGrid } from "@/components/LoadingGrid";
import { EmptyState } from "@/components/EmptyState";

export default function Activities() {
  const [tab, setTab] = useState("all");
  const [activities, setActivities] = useState(null);

  useEffect(() => {
    setActivities(null);
    const params = tab === "all" ? {} : { type: tab };
    api.get("/activities", { params }).then((r) => setActivities(r.data.activities)).catch(() => setActivities([]));
  }, [tab]);

  return (
    <main data-testid="activities-page" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-2 label-caps">Loot Tables</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Activities</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Pick a raid or dungeon to see every boss and the loot it drops.</p>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList data-testid="activities-tabs" className="flex flex-wrap rounded-xl border border-white/10 bg-white/5 p-1">
          <TabsTrigger value="all" data-testid="activities-tab-all">All</TabsTrigger>
          <TabsTrigger value="raid" data-testid="activities-tab-raids">Raids</TabsTrigger>
          <TabsTrigger value="dungeon" data-testid="activities-tab-dungeons">Dungeons</TabsTrigger>
          <TabsTrigger value="nightfall" data-testid="activities-tab-nightfall">Nightfall</TabsTrigger>
          <TabsTrigger value="crucible" data-testid="activities-tab-crucible">Crucible</TabsTrigger>
          <TabsTrigger value="world" data-testid="activities-tab-world">World</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {!activities ? <LoadingGrid count={6} square={false} />
          : activities.length === 0 ? <EmptyState title="No activities found" />
          : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {activities.map((a) => <ActivityCard key={a.id} activity={a} />)}
            </div>
          )}
      </div>
    </main>
  );
}

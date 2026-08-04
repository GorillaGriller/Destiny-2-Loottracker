import { Progress } from "@/components/ui/progress";
import { Skull } from "lucide-react";
import { LootItemCard } from "@/components/LootItemCard";
import { useStore } from "@/lib/store";

export const EncounterSection = ({ encounter, onOpenItem }) => {
  const { obtained } = useStore();
  const items = encounter.items || [];
  const total = items.length;
  const done = items.filter((i) => obtained.includes(i.hash)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div data-testid="encounter-section" className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30 font-mono text-sm text-[hsl(var(--primary))]">
            {String(encounter.order).padStart(2, "0")}
          </div>
          <div>
            <div className="label-caps">Encounter {encounter.order}</div>
            <h3 className="flex items-center gap-1.5 font-display text-base font-semibold sm:text-lg">
              <Skull size={16} className="text-muted-foreground" /> {encounter.boss}
            </h3>
          </div>
        </div>
        {total ? (
          <div className="w-40">
            <div className="mb-1 flex justify-between text-xs"><span className="label-caps">Loot</span><span className="font-mono text-muted-foreground">{done}/{total}</span></div>
            <Progress value={pct} className="h-1.5 bg-white/10" />
          </div>
        ) : null}
      </div>
      {total ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((it) => <LootItemCard key={it.hash} item={it} onOpen={onOpenItem} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Encounter-specific weapon drops are shared with this activity's pool below.</p>
      )}
    </div>
  );
};

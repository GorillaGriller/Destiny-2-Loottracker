import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Star, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { rarityVars, RARITY } from "@/lib/api";
import { ElementBadge } from "@/components/ElementIcon";
import { useStore, toggleObtained, toggleFavItem } from "@/lib/store";

export const ItemDetailModal = ({ item, open, onOpenChange }) => {
  const { obtained, favItems } = useStore();
  if (!item) return null;
  const isObtained = obtained.includes(item.hash);
  const isFav = favItems.includes(item.hash);
  const rarity = RARITY[item.rarity] || RARITY.Legendary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="item-detail-modal" className="max-w-3xl border-white/10 bg-[#0b0f14] p-0 overflow-hidden">
        {item.screenshot ? (
          <div className="relative h-40 w-full overflow-hidden">
            <img src={item.screenshot} alt="" className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0b0f14 8%, transparent 70%)" }} />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-[140px_1fr]">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-black/40 rarity-frame" style={rarityVars(item.rarity)}>
              {item.icon ? <img src={item.icon} alt={item.name} className="h-full w-full object-cover" /> : null}
              {item.watermark ? <img src={item.watermark} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="label-caps" style={{ color: rarity.color }}>{item.rarity} · {item.type_name}</div>
              <h2 className="text-2xl font-semibold" style={{ color: rarity.color }}>{item.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.kind === "weapon" && item.element ? <ElementBadge element={item.element} /> : null}
              {item.ammo ? <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px]">{item.ammo} Ammo</span> : null}
              {item.class_type && item.class_type !== "Any" ? <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px]">{item.class_type}</span> : null}
            </div>
            {item.flavor ? <p className="text-sm italic leading-relaxed text-muted-foreground">“{item.flavor}”</p> : null}

            {item.sources?.length ? (
              <div className="space-y-1.5">
                <div className="label-caps">Drops From</div>
                {item.sources.map((s) => (
                  <Link key={s.activity_id} to={`/activity/${s.activity_id}`} onClick={() => onOpenChange(false)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:border-white/25">
                    <MapPin size={14} className="text-[hsl(var(--primary))]" />
                    <span className="font-medium">{s.activity_name}</span>
                    {s.encounters?.length ? <span className="text-xs text-muted-foreground">· {s.encounters.join(", ")}</span> : null}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              <Button data-testid="modal-toggle-obtained" onClick={() => toggleObtained(item.hash)}
                variant={isObtained ? "default" : "secondary"} className="gap-1.5">
                <Check size={15} /> {isObtained ? "Obtained" : "Mark Obtained"}
              </Button>
              <Button data-testid="modal-toggle-favorite" onClick={() => toggleFavItem(item.hash)} variant="outline" className="gap-1.5">
                <Star size={15} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-yellow-400" : ""} /> {isFav ? "Favorited" : "Favorite"}
              </Button>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground/60">hash {item.hash}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

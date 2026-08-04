import { Check, Star } from "lucide-react";
import { rarityVars, RARITY } from "@/lib/api";
import { ElementIcon } from "@/components/ElementIcon";
import { useStore, toggleObtained, toggleFavItem } from "@/lib/store";

export const LootItemCard = ({ item, onOpen }) => {
  const { obtained, favItems } = useStore();
  const isObtained = obtained.includes(item.hash);
  const isFav = favItems.includes(item.hash);
  const rarity = RARITY[item.rarity] || RARITY.Legendary;

  return (
    <div
      data-testid="loot-item-card"
      data-obtained={isObtained}
      className="group relative rounded-xl hud-panel p-2 transition-colors duration-150 hover:border-white/25"
    >
      <button
        data-testid="loot-item-open-detail"
        onClick={() => onOpen(item)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded-lg"
        aria-label={`View ${item.name}`}
      >
        <div
          className="relative aspect-square overflow-hidden rounded-lg bg-black/40 rarity-frame"
          style={rarityVars(item.rarity)}
        >
          <span className="corner-notch" style={rarityVars(item.rarity)} />
          {item.icon ? (
            <img
              src={item.icon}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
              style={{ opacity: isObtained ? 0.6 : 1, filter: isObtained ? "grayscale(0.2)" : "none" }}
            />
          ) : null}
          {item.watermark ? (
            <img src={item.watermark} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90" />
          ) : null}
          {isObtained && (
            <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow">
              <Check size={13} strokeWidth={3} />
            </div>
          )}
        </div>
        <div className="mt-2 space-y-1">
          <div className="line-clamp-1 text-sm font-semibold" style={{ color: rarity.color }}>{item.name}</div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="line-clamp-1">{item.type_name}</span>
            {item.kind === "weapon" && item.element ? <ElementIcon element={item.element} /> : null}
          </div>
        </div>
      </button>
      <div className="mt-2 flex items-center gap-1.5">
        <button
          data-testid="loot-item-toggle-obtained"
          onClick={() => toggleObtained(item.hash)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors duration-150 ${isObtained ? "border-[hsl(var(--primary))]/60 bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]" : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20"}`}
          aria-pressed={isObtained}
        >
          <Check size={12} /> {isObtained ? "Obtained" : "Track"}
        </button>
        <button
          data-testid="loot-item-toggle-favorite"
          onClick={() => toggleFavItem(item.hash)}
          aria-label="Favorite"
          className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors duration-150 ${isFav ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400" : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"}`}
        >
          <Star size={12} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
};

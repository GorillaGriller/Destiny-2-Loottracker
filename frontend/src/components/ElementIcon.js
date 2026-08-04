import { Zap, Flame, CircleDot, Snowflake, Waypoints, Circle } from "lucide-react";
import { ELEMENT } from "@/lib/api";

const MAP = {
  Arc: Zap,
  Solar: Flame,
  Void: CircleDot,
  Stasis: Snowflake,
  Strand: Waypoints,
  Kinetic: Circle,
};

export const ElementIcon = ({ element, size = 14 }) => {
  if (!element) return null;
  const Icon = MAP[element] || Circle;
  const meta = ELEMENT[element] || ELEMENT.Kinetic;
  return <Icon size={size} style={{ color: meta.color }} aria-label={element} />;
};

export const ElementBadge = ({ element }) => {
  if (!element) return null;
  const meta = ELEMENT[element] || ELEMENT.Kinetic;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
    >
      <ElementIcon element={element} size={11} />
      {element}
    </span>
  );
};

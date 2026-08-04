import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ALL = "all";

const Dropdown = ({ label, value, onChange, options, testid }) => (
  <div className="min-w-[130px]">
    <label className="label-caps mb-1 block">{label}</label>
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger data-testid={testid} className="h-9 border-white/10 bg-white/5 text-sm">
        <SelectValue placeholder={`All`} />
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-[#0b0f14]">
        <SelectItem value={ALL}>All {label}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

export const FiltersBar = ({ options, values, onChange, onClear }) => {
  const active = Object.values(values).some((v) => v);
  return (
    <div data-testid="filters-bar" className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <Dropdown label="Type" testid="filter-kind-select" value={values.kind} onChange={(v) => onChange("kind", v)} options={["weapon", "armor"]} />
      <Dropdown label="Element" testid="filter-element-select" value={values.element} onChange={(v) => onChange("element", v)} options={options.elements || []} />
      <Dropdown label="Rarity" testid="filter-rarity-select" value={values.rarity} onChange={(v) => onChange("rarity", v)} options={options.rarities || []} />
      <Dropdown label="Weapon" testid="filter-weapon-type-select" value={values.weapon_type} onChange={(v) => onChange("weapon_type", v)} options={options.weapon_types || []} />
      <Dropdown label="Class" testid="filter-class-select" value={values.class_type} onChange={(v) => onChange("class_type", v)} options={options.classes || []} />
      {active ? (
        <Button data-testid="filters-clear-button" variant="ghost" size="sm" onClick={onClear} className="gap-1 text-muted-foreground">
          <X size={14} /> Clear
        </Button>
      ) : null}
    </div>
  );
};

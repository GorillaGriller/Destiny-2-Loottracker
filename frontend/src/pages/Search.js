import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiltersBar } from "@/components/FiltersBar";
import { LootItemCard } from "@/components/LootItemCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { LoadingGrid } from "@/components/LoadingGrid";
import { EmptyState } from "@/components/EmptyState";

const PAGE = 60;

export default function Search() {
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const [options, setOptions] = useState({});
  const [values, setValues] = useState({ kind: "", element: "", rarity: "", weapon_type: "", class_type: "" });
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef();

  useEffect(() => { api.get("/filters").then((r) => setOptions(r.data)).catch(() => {}); }, []);

  const fetchItems = useCallback((reset) => {
    const off = reset ? 0 : offset;
    const params = { limit: PAGE, offset: off, sort: "rarity" };
    if (q.trim()) params.q = q.trim();
    Object.entries(values).forEach(([k, v]) => { if (v) params[k] = v; });
    if (reset) setItems(null);
    api.get("/items", { params }).then((r) => {
      setTotal(r.data.total);
      setOffset(off + PAGE);
      setItems((prev) => (reset || !prev ? r.data.items : [...prev, ...r.data.items]));
    }).catch(() => setItems([]));
  }, [q, values, offset]);

  // debounce on q / values
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setOffset(0);
      const params = { limit: PAGE, offset: 0, sort: "rarity" };
      if (q.trim()) params.q = q.trim();
      Object.entries(values).forEach(([k, v]) => { if (v) params[k] = v; });
      setItems(null);
      api.get("/items", { params }).then((r) => { setTotal(r.data.total); setItems(r.data.items); setOffset(PAGE); }).catch(() => setItems([]));
    }, 250);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, values]);

  // Keep local query in sync with URL (?q=) for header search + direct links\n  useEffect(() => { setQ(sp.get(\"q\") || \"\"); /* eslint-disable-next-line */ }, [sp]);

  const onChange = (k, v) => setValues((s) => ({ ...s, [k]: v }));
  const onClear = () => { setValues({ kind: "", element: "", rarity: "", weapon_type: "", class_type: "" }); setQ(""); };
  const openItem = (it) => { setActive(it); setOpen(true); };

  return (
    <main data-testid="search-page" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-2 label-caps">Loot Database</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Search & Filter</h1>

      <div className="relative mt-6">
        <SearchIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input data-testid="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, e.g. Fatebringer"
          className="h-12 border-white/10 bg-white/5 pl-11 text-base focus-visible:ring-[hsl(var(--ring))]" />
      </div>

      <div className="mt-4"><FiltersBar options={options} values={values} onChange={onChange} onClear={onClear} /></div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground" data-testid="search-total">{items ? `${total} result${total === 1 ? "" : "s"}` : "Searching…"}</span>
      </div>

      <div className="mt-4">
        {!items ? <LoadingGrid count={15} />
          : items.length === 0 ? <EmptyState title="No loot matches" desc="Try adjusting your filters or search term." actionLabel="Clear filters" onAction={onClear} />
          : (
            <>
              <div data-testid="search-results-grid" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((it) => <LootItemCard key={it.hash} item={it} onOpen={openItem} />)}
              </div>
              {items.length < total ? (
                <div className="mt-8 flex justify-center">
                  <Button variant="secondary" data-testid="load-more-button" onClick={() => fetchItems(false)}>Load more</Button>
                </div>
              ) : null}
            </>
          )}
      </div>

      <ItemDetailModal item={active} open={open} onOpenChange={setOpen} />
    </main>
  );
}

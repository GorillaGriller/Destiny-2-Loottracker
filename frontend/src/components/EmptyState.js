import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmptyState = ({ title = "Nothing here", desc, actionLabel, onAction }) => (
  <div data-testid="empty-state" className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
      <PackageOpen size={22} />
    </div>
    <h3 className="font-display text-lg font-semibold">{title}</h3>
    {desc ? <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{desc}</p> : null}
    {actionLabel ? <Button onClick={onAction} variant="secondary" className="mt-4" data-testid="empty-state-action">{actionLabel}</Button> : null}
  </div>
);

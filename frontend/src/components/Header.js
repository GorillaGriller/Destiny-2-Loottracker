import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, Hexagon, ListChecks, LogOut, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { AuthDialog } from "@/components/AuthDialog";

export const Header = () => {
  const [q, setQ] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const { obtained } = useStore();
  const { user, logout } = useAuth();

  const submit = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${isActive ? "text-[hsl(var(--primary))]" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[color:var(--panel)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" data-testid="brand-link">
          <Hexagon size={22} className="text-[hsl(var(--primary))]" fill="currentColor" fillOpacity={0.15} />
          <span className="font-display text-base font-semibold tracking-tight">BOSS DROPS<span className="text-[hsl(var(--primary))]">·D2</span></span>
        </Link>

        <nav className="ml-2 hidden items-center gap-5 md:flex">
          <NavLink to="/activities" className={linkCls} data-testid="nav-activities-link">Activities</NavLink>
          <NavLink to="/search" className={linkCls} data-testid="nav-search-link">Search</NavLink>
          <NavLink to="/targets" className={linkCls} data-testid="nav-targets-link">Targets</NavLink>
          <NavLink to="/checklist" className={linkCls} data-testid="nav-checklist-link">Checklist</NavLink>
        </nav>

        <form onSubmit={submit} className="ml-auto hidden max-w-xs flex-1 items-center sm:flex">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input data-testid="global-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search weapons & armor"
              className="h-9 border-white/10 bg-white/5 pl-9 text-sm focus-visible:ring-[hsl(var(--ring))]" />
          </div>
        </form>

        <Link to="/checklist" data-testid="header-checklist-badge" className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ListChecks size={14} className="text-[hsl(var(--primary))]" />
          <span className="font-mono">{obtained.length}</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            {user.picture ? (
              <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-7 w-7 rounded-full border border-white/15 object-cover" />
            ) : null}
            <span data-testid="header-user-email" className="hidden max-w-[150px] truncate text-xs text-muted-foreground sm:inline">{user.name || user.email}</span>
            <Button variant="ghost" size="icon" data-testid="logout-button" aria-label="Sign out" onClick={logout} className="h-8 w-8">
              <LogOut size={15} />
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" data-testid="signin-button" onClick={() => setAuthOpen(true)} className="gap-1.5">
            <UserIcon size={14} /> Sign In
          </Button>
        )}
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
};

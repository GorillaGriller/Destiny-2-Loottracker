import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, CheckCircle2, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const { obtained } = useStore();
  if (!user) return null;
  const initials = (user.name || user.email || "G").trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-testid="profile-menu-trigger" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
        <Avatar className="h-8 w-8 border border-white/15">
          {user.picture ? <AvatarImage src={user.picture} alt={user.name || user.email} referrerPolicy="no-referrer" /> : null}
          <AvatarFallback className="bg-[hsl(var(--secondary))] text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 border-white/10 bg-[#0b0f14]" data-testid="profile-menu-content">
        <DropdownMenuLabel className="flex items-center gap-3 py-3">
          <Avatar className="h-9 w-9 border border-white/15">
            {user.picture ? <AvatarImage src={user.picture} alt="" referrerPolicy="no-referrer" /> : null}
            <AvatarFallback className="bg-[hsl(var(--secondary))] text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {user.name ? <div className="truncate text-sm font-semibold">{user.name}</div> : null}
            <div data-testid="profile-menu-email" className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
          </div>
        </DropdownMenuLabel>
        <div className="mx-2 mb-1 flex items-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1.5 text-xs text-emerald-400" data-testid="profile-sync-status">
          <CheckCircle2 size={13} /> Cloud sync on \u00b7 {obtained.length} tracked
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/checklist" data-testid="profile-menu-checklist"><ListChecks size={14} className="mr-2" /> My Checklist</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem data-testid="profile-menu-logout" onClick={logout} className="cursor-pointer text-red-300 focus:text-red-200">
          <LogOut size={14} className="mr-2" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

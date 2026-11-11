"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, ChevronDown, GraduationCap, User as UserIcon, CreditCard } from "lucide-react";
import { apiPost } from "@/hooks/use-api";

const TITLES: Record<string, string> = {
  overview: "Dashboard",
  courses: "Explore Courses",
  assignments: "Assignments",
  subscription: "My Subscription",
  certificates: "Certificates",
  profile: "Profile",
  universities: "Explore Universities",
};

export function StudentTopbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const refreshUser = useAppStore((s) => s.refreshUser);

  const current = segments[1] || "overview";
  const title = segments[2] && current === "learn" ? "Course Learning" : TITLES[current] || "Dashboard";

  async function logout() {
    await apiPost("/api/auth/logout", null, { method: "POST" });
    await refreshUser();
    navigate([""]);
  }

  const initials = (user?.name || "S")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/80 bg-background/80 px-4 shadow-sm backdrop-blur-xl transition-shadow duration-300 md:px-6">
      {/* Subtle accent underline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-semibold leading-tight tracking-tight text-foreground">{title}</h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">Student Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Accent "Student" badge */}
        <div className="hidden items-center gap-1.5 rounded-full border border-accent/20 bg-gradient-to-r from-accent/10 to-accent/5 px-3 py-1 text-xs font-semibold text-accent shadow-sm transition-colors duration-200 sm:flex">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Student</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-all duration-200 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {/* Ringed avatar */}
              <Avatar className="h-8 w-8 ring-2 ring-accent/30 ring-offset-2 ring-offset-background transition-shadow duration-200">
                {user?.profilePhoto ? <AvatarImage src={user.profilePhoto} alt={user?.name || ""} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-none text-foreground">{user?.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(["student", "profile"])} className="gap-2">
              <UserIcon className="h-4 w-4" /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(["student", "subscription"])} className="gap-2">
              <CreditCard className="h-4 w-4" /> My Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive gap-2 focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

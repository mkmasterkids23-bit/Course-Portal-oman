"use client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, ChevronDown, Shield } from "lucide-react";
import { apiPost } from "@/hooks/use-api";

const TITLES: Record<string, string> = {
  overview: "Dashboard Overview",
  students: "Student Management",
  courses: "Course Management",
  materials: "Learning Materials",
  assignments: "Assignment Management",
  submissions: "Assignment Submissions",
  plans: "Subscription Plans",
  certificates: "Certificate Management",
  settings: "Settings",
};

export function AdminTopbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const refreshUser = useAppStore((s) => s.refreshUser);

  const current = segments[1] || "overview";
  const title = segments[2] && current === "courses" ? "Edit Course" : TITLES[current] || "Dashboard";

  async function logout() {
    await apiPost("/api/auth/logout", null, { method: "POST" });
    await refreshUser();
    navigate([""]);
  }

  const initials = (user?.name || "A")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/80 bg-background/75 px-4 shadow-[0_1px_3px_rgba(37,51,43,0.04)] backdrop-blur-xl transition-shadow duration-300 md:px-6">
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
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground/80">CourseLearn · Admin</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="hidden items-center gap-1.5 rounded-full border border-accent/25 bg-soft-sage px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm transition-colors duration-200 sm:flex">
          <Shield className="h-3 w-3" />
          <span>Administrator</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2.5 rounded-lg p-1 pr-2 transition-all duration-200 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Avatar className="h-9 w-9 ring-2 ring-accent/20 ring-offset-2 ring-offset-background transition-all duration-200 group-hover:ring-accent/40">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-none text-foreground">{user?.name}</p>
                <p className="mt-1 text-xs text-muted-foreground truncate max-w-[180px]">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
              Signed in as
              <p className="mt-0.5 text-sm font-semibold text-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive gap-2 focus:bg-destructive/5">
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

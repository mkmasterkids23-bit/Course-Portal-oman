"use client";

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
import { Menu, LogOut, ChevronDown, GraduationCap } from "lucide-react";
import { apiPost } from "@/hooks/use-api";

const TITLES: Record<string, string> = {
  overview: "My Overview",
  courses: "My Courses",
  assignments: "My Assignments",
  subscription: "My Subscription",
  certificates: "My Certificates",
  profile: "My Profile",
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
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
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground leading-none">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Student Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <GraduationCap className="h-3 w-3 text-accent" />
          <span>Student</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(["student", "profile"])} className="gap-2">
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(["student", "subscription"])} className="gap-2">
              My Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

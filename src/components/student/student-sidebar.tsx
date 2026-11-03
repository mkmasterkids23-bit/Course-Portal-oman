"use client";

import { useAppStore } from "@/stores/app-store";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, PlayCircle, ClipboardList, CreditCard,
  Award, User, LogOut
} from "lucide-react";
import { apiPost } from "@/hooks/use-api";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, segments: ["student", "overview"] },
  { label: "My Courses", icon: BookOpen, segments: ["student", "courses"] },
  { label: "My Assignments", icon: ClipboardList, segments: ["student", "assignments"] },
  { label: "My Subscription", icon: CreditCard, segments: ["student", "subscription"] },
  { label: "My Certificates", icon: Award, segments: ["student", "certificates"] },
  { label: "My Profile", icon: User, segments: ["student", "profile"] },
];

export function StudentSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);
  const refreshUser = useAppStore((s) => s.refreshUser);
  const current = segments[1] || "overview";

  async function logout() {
    await apiPost("/api/auth/logout", null, { method: "POST" });
    await refreshUser();
    navigate([""]);
  }

  return (
    <aside className="relative flex h-full w-full flex-col border-r border-sidebar-border bg-gradient-to-b from-card via-muted/20 to-muted/50">
      {/* Subtle accent right edge */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-accent/0 via-accent/40 to-accent/0" />
      {/* Logo header */}
      <div className="flex h-16 items-center border-b border-sidebar-border/80 px-5">
        <BrandLogo onClick={() => { navigate(["student", "overview"]); onNavigate?.(); }} />
      </div>
      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="space-y-1">
          <p className="px-3 pb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
            Learning Hub
          </p>
          {NAV.map((item) => {
            const active = current === item.segments[1];
            return (
              <button
                key={item.label}
                onClick={() => { navigate(item.segments); onNavigate?.(); }}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-accent/10 text-accent font-semibold"
                    : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-accent" />
                )}
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-200",
                  active
                    ? "text-accent"
                    : "text-muted-foreground/70 group-hover:text-foreground"
                )} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
      {/* Logout footer with separator */}
      <div className="relative border-t border-sidebar-border/80 p-3">
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0 transition-colors duration-200 group-hover:text-destructive" />
          Logout
        </button>
      </div>
    </aside>
  );
}

// Unused export kept for tree-shaking clarity
export const _icons = { PlayCircle };

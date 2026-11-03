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
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <BrandLogo onClick={() => { navigate(["student", "overview"]); onNavigate?.(); }} />
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Learning Hub
          </p>
          {NAV.map((item) => {
            const active = current === item.segments[1];
            return (
              <button
                key={item.label}
                onClick={() => { navigate(item.segments); onNavigate?.(); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

// Unused export kept for tree-shaking clarity
export const _icons = { PlayCircle };

"use client";

import { useAppStore } from "@/stores/app-store";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, PlayCircle, ClipboardList, CreditCard,
  Award, User, LogOut, GraduationCap, Building2,
  StickyNote, Bookmark, MessagesSquare, Bell,
} from "lucide-react";
import { apiPost } from "@/hooks/use-api";
import { useI18n } from "@/lib/i18n/store";

const NAV = [
  { labelKey: "nav.dashboard", icon: LayoutDashboard, segments: ["student", "overview"] },
  { labelKey: "nav.exploreUniversities", icon: Building2, segments: ["student", "universities"] },
  { labelKey: "nav.exploreCourses", icon: BookOpen, segments: ["student", "courses"] },
  { labelKey: "nav.myAssignments", icon: ClipboardList, segments: ["student", "assignments"] },
  { labelKey: "nav.myNotes", icon: StickyNote, segments: ["student", "notes"] },
  { labelKey: "nav.myBookmarks", icon: Bookmark, segments: ["student", "bookmarks"] },
  { labelKey: "nav.discussions", icon: MessagesSquare, segments: ["student", "discussions"] },
  { labelKey: "nav.notifications", icon: Bell, segments: ["student", "notifications"] },
  { labelKey: "nav.mySubscription", icon: CreditCard, segments: ["student", "subscription"] },
  { labelKey: "nav.myCertificates", icon: Award, segments: ["student", "certificates"] },
  { labelKey: "nav.myProfile", icon: User, segments: ["student", "profile"] },
];

export function StudentSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
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
    <aside className="relative flex h-full w-full flex-col border-r border-sidebar-border bg-gradient-to-b from-card via-card to-soft-sage/30">
      {/* Subtle accent right edge */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-accent/0 via-accent/20 to-accent/0" />

      {/* Logo header — premium gradient accent */}
      <div className="relative flex h-16 items-center border-b border-sidebar-border/80 px-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-soft-sage/40 via-transparent to-transparent" />
        <BrandLogo onClick={() => { navigate(["student", "overview"]); onNavigate?.(); }} />
      </div>

      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="space-y-1">
          {/* Elegant section label */}
          <div className="flex items-center gap-2 px-3 pb-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("nav.learningHub")}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>
          {NAV.map((item) => {
            const active = current === item.segments[1];
            return (
              <button
                key={item.labelKey}
                onClick={() => { navigate(item.segments); onNavigate?.(); }}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-soft-sage text-primary font-semibold shadow-sm"
                    : "font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-7 -translate-y-1/2 w-1 rounded-r-full bg-primary shadow-[0_0_0_3px_rgba(52,79,66,0.12)]" />
                )}
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground/70 group-hover:text-foreground"
                )} />
                <span className="flex-1 text-left truncate">{t(item.labelKey as any)}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-primary/20" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Premium upsell card */}
        <div className="mt-6 rounded-xl border border-accent/20 bg-gradient-to-br from-soft-sage to-accent/[0.04] p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{t("student.keepLearning")}</p>
              <p className="text-[11px] text-muted-foreground">{t("student.stayConsistent")}</p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Logout footer with separator */}
      <div className="relative border-t border-sidebar-border/80 p-3">
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0 transition-colors duration-200 group-hover:text-destructive" />
          <span>{t("common.logout")}</span>
        </button>
      </div>
    </aside>
  );
}

// Unused export kept for tree-shaking clarity
export const _icons = { PlayCircle };

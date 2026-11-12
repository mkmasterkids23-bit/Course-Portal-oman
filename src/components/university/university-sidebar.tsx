"use client";

import { useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Building2, BookOpen, FileText, ClipboardList, Inbox,
  Award, Settings, LogOut, GraduationCap,
  Users, BarChart3, PieChart, TrendingUp,
  Megaphone, UserCog, CalendarDays, Palette,
  MessageSquare,
} from "lucide-react";
import { apiPost } from "@/hooks/use-api";

const NAV_SECTIONS = [
  {
    label: "nav.teaching" as const,
    items: [
      { label: "nav.overview" as const, icon: Building2, segments: ["university", "overview"] },
      { label: "common.courses" as const, icon: BookOpen, segments: ["university", "courses"] },
      { label: "common.learningMaterials" as const, icon: FileText, segments: ["university", "materials"] },
      { label: "common.scheduling" as const, icon: CalendarDays, segments: ["university", "scheduling"] },
    ],
  },
  {
    label: "nav.assessment" as const,
    items: [
      { label: "common.assignments" as const, icon: ClipboardList, segments: ["university", "assignments"] },
      { label: "common.submissions" as const, icon: Inbox, segments: ["university", "submissions"] },
      { label: "common.discussions" as const, icon: MessageSquare, segments: ["university", "discussions"] },
    ],
  },
  {
    label: "nav.insights" as const,
    items: [
      { label: "common.students" as const, icon: Users, segments: ["university", "students"] },
      { label: "common.courseAnalytics" as const, icon: BarChart3, segments: ["university", "course-analytics"] },
      { label: "common.assessmentAnalytics" as const, icon: PieChart, segments: ["university", "assessment-analytics"] },
      { label: "common.revenue" as const, icon: TrendingUp, segments: ["university", "revenue"] },
    ],
  },
  {
    label: "nav.organization" as const,
    items: [
      { label: "common.announcements" as const, icon: Megaphone, segments: ["university", "announcements"] },
      { label: "common.instructors" as const, icon: UserCog, segments: ["university", "instructors"] },
      { label: "common.certificateManagement" as const, icon: Award, segments: ["university", "certificates"] },
      { label: "common.branding" as const, icon: Palette, segments: ["university", "branding"] },
      { label: "nav.settings" as const, icon: Settings, segments: ["university", "settings"] },
    ],
  },
];

export function UniversitySidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);
  const refreshUser = useAppStore((s) => s.refreshUser);
  const user = useAppStore((s) => s.user);
  const current = segments[1] || "overview";

  async function logout() {
    await apiPost("/api/auth/logout", null, { method: "POST" });
    await refreshUser();
    navigate([""]);
  }

  // University initials for the logo block
  const uniName = user?.universityName || user?.name || "University";
  const uniInitials = uniName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="relative flex h-full w-full flex-col border-r border-sidebar-border bg-gradient-to-b from-card via-muted/20 to-muted/50">
      {/* Subtle accent right edge */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-accent/0 via-accent/40 to-accent/0" />

      {/* University brand header */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border/80 px-5">
        {user?.universityLogo ? (
          <img
            src={user.universityLogo}
            alt={uniName}
            className="h-9 w-9 rounded-xl object-cover ring-1 ring-border"
          />
        ) : (
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            {user?.universityLogo ? null : <GraduationCap className="h-5 w-5" />}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold tracking-tight text-foreground truncate leading-tight">
            {uniName}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {t("dashboard.adminConsole")}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
                {t(section.label)}
              </p>
              {section.items.map((item) => {
                const active = current === item.segments[1];
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.segments);
                      onNavigate?.();
                    }}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                      active
                        ? "bg-soft-sage text-primary font-semibold"
                        : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-primary" />
                    )}
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors duration-200",
                        active
                          ? "text-primary"
                          : "text-muted-foreground/70 group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{t(item.label)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User badge + logout footer */}
      <div className="relative border-t border-sidebar-border/80 p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2">
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
              {uniInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0 transition-colors duration-200 group-hover:text-destructive" />
          {t("common.logout")}
        </button>
      </div>
    </aside>
  );
}

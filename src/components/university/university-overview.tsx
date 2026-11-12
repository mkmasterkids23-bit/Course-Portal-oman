"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n/store";
import { formatDateTime } from "@/types";
import {
  BookOpen, Award, ClipboardList, Video, FileText, Inbox,
  TrendingUp, ArrowRight, PlusCircle, Sparkles,
} from "lucide-react";

interface OverviewData {
  totalCourses: number;
  totalPublishedCourses: number;
  totalVideoLessons: number;
  pendingReviews: number;
  totalCertificatesIssued: number;
  totalAssignments: number;
  totalSubmittedAssignments: number;
  totalStudents: number;
  recentSubmissions: {
    id: string;
    studentName: string;
    studentEmail: string;
    assignmentTitle: string;
    courseTitle: string;
    submittedAt: string;
    status: "SUBMITTED" | "REVIEWED";
  }[];
  recentCourses: {
    id: string;
    title: string;
    createdAt: string;
    isPublished: boolean;
  }[];
}

export function UniversityOverview() {
  const { t } = useI18n();
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const { data, loading, error } = useApiFetch<OverviewData>("/api/university/overview");

  return (
    <div className="space-y-6">
      {/* Premium welcome header */}
      <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/85 p-6 text-primary-foreground shadow-sm">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(120,151,134,0.45), transparent 55%), radial-gradient(circle at 85% 15%, rgba(252,252,250,0.14), transparent 45%), radial-gradient(circle at 70% 90%, rgba(67,134,106,0.35), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              {t("dashboard.adminConsole")}
            </p>
            <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">
              {t("dashboard.welcome")}, {user?.universityName || t("common.university")}
            </h2>
            <p className="mt-1.5 text-sm text-primary-foreground/75 max-w-md">
              {t("dashboard.snapshot")}
            </p>
          </div>
          <Badge className="self-start gap-1.5 border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Badge>
        </div>
      </div>

      {loading ? (
        <OverviewSkeleton />
      ) : error ? (
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title={t("common.error")}
          description={error}
        />
      ) : data ? (
        <>
          {/* Primary stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
            <PremiumStatCard
              icon={<BookOpen className="h-5 w-5" />}
              label={t("dashboard.totalCourses")}
              value={data.totalCourses}
              hint={`${data.totalPublishedCourses} ${t("common.published")}`}
              tone="navy"
            />
            <PremiumStatCard
              icon={<Video className="h-5 w-5" />}
              label={t("dashboard.totalVideoLessons")}
              value={data.totalVideoLessons}
              hint={t("courses.publishedLessons")}
              tone="teal"
            />
            <PremiumStatCard
              icon={<ClipboardList className="h-5 w-5" />}
              label={t("dashboard.pendingReviews")}
              value={data.pendingReviews}
              hint={`${data.totalSubmittedAssignments} ${t("common.submissions")}`}
              tone="amber"
              urgent={data.pendingReviews > 0}
            />
            <PremiumStatCard
              icon={<Award className="h-5 w-5" />}
              label={t("dashboard.certificatesIssued")}
              value={data.totalCertificatesIssued}
              hint={`${data.totalStudents} ${t("dashboard.activeLearners")}`}
              tone="green"
            />
          </div>

          {/* Recent activity + quick actions row */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Recent submissions */}
            <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                    <Inbox className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      {t("dashboard.recentSubmissions")}
                    </h3>
                    <p className="text-xs text-muted-foreground">{t("common.submissions")}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs text-muted-foreground hover:text-accent"
                  onClick={() => navigate(["university", "submissions"])}
                >
                  {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2">
                {data.recentSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {t("empty.noData")}
                  </p>
                ) : (
                  <ul className="divide-y divide-border max-h-80 overflow-y-auto scrollbar-thin">
                    {data.recentSubmissions.slice(0, 6).map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-3 transition-colors duration-200 rounded-md hover:bg-muted/40"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {s.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {s.assignmentTitle} · {s.courseTitle}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {formatDateTime(s.submittedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Quick actions card */}
            <Card className="border-dashed rounded-lg border-border bg-card/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    {t("dashboard.quickActions")}
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    {t("dashboard.quickActions")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                  {t("dashboard.snapshot")}
                </p>
                <div className="flex flex-col gap-2">
                  <QuickActionButton
                    icon={<PlusCircle className="h-4 w-4" />}
                    label={t("dashboard.createCourse")}
                    onClick={() => navigate(["university", "courses"], { action: "new" })}
                  />
                  <QuickActionButton
                    icon={<FileText className="h-4 w-4" />}
                    label={t("dashboard.addMaterial")}
                    onClick={() => navigate(["university", "materials"], { action: "new" })}
                  />
                  <QuickActionButton
                    icon={<ClipboardList className="h-4 w-4" />}
                    label={t("dashboard.createAssignment")}
                    onClick={() => navigate(["university", "assignments"], { action: "new" })}
                  />
                  <QuickActionButton
                    icon={<Inbox className="h-4 w-4" />}
                    label={t("common.submissions")}
                    onClick={() => navigate(["university", "submissions"])}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent courses */}
          <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    {t("dashboard.recentCourses")}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t("dashboard.recentCourses")}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-muted-foreground hover:text-accent"
                onClick={() => navigate(["university", "courses"])}
              >
                {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="p-2">
              {data.recentCourses.length === 0 ? (
                <EmptyState
                  className="m-4"
                  icon={<BookOpen className="h-5 w-5" />}
                  title={t("empty.noCourses")}
                  description={t("empty.noCoursesDesc")}
                  action={
                    <Button
                      onClick={() => navigate(["university", "courses"], { action: "new" })}
                      className="gap-2"
                    >
                      <PlusCircle className="h-4 w-4" /> {t("dashboard.createCourse")}
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentCourses.slice(0, 5).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-3 transition-colors duration-200 rounded-md hover:bg-muted/40"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(c.createdAt)}
                        </p>
                      </div>
                      {c.isPublished ? (
                        <Badge className="bg-success/15 text-success">{t("common.published")}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          {t("common.draft")}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => navigate(["university", "courses", c.id])}
                      >
                        {t("common.manage")} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function PremiumStatCard({
  icon,
  label,
  value,
  hint,
  tone,
  urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tone: "navy" | "teal" | "amber" | "green";
  urgent?: boolean;
}) {
  const toneClasses = {
    navy: "bg-primary/10 text-primary",
    teal: "bg-accent/10 text-accent",
    amber: "bg-warning/15 text-warning",
    green: "bg-success/15 text-success",
  };
  const borderClass = urgent ? "ring-1 ring-warning/30" : "";

  return (
    <Card
      className={`group overflow-hidden rounded-lg border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${borderClass}`}
    >
      <div className="flex flex-col gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]} transition-transform duration-200 group-hover:scale-105`}
        >
          {icon}
        </div>
        <div>
          <p className="font-heading text-[28px] font-bold text-foreground leading-none tracking-tight">
            {value.toLocaleString()}
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-foreground/90">{label}</p>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 w-full justify-start gap-2 border-border bg-card transition-all duration-200 hover:border-accent/30 hover:bg-soft-sage/40"
      onClick={onClick}
    >
      <span className="text-accent">{icon}</span>
      {label}
    </Button>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-10 w-10 rounded-lg mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-12 w-full" />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-9 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

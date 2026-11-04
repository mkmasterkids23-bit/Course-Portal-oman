"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { useApiFetch } from "@/hooks/use-api";
import {
  BookOpen, PlayCircle, ClipboardList, Award, TrendingUp, ArrowRight,
  CalendarDays, CheckCircle2, Lock, Clock, Sparkles, GraduationCap, CreditCard,
} from "lucide-react";
import { formatDate, formatPrice } from "@/types";

interface SubscriptionInfo {
  planId: string;
  planName: string;
  planPrice: number;
  planCurrency: string;
  planDuration: number;
  planDurationUnit: string;
  startDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRED";
  remainingDays: number;
  elapsedPercent: number;
}

interface OverviewData {
  welcomeName: string;
  subscription: SubscriptionInfo | null;
  learning: {
    availableCourses: number;
    inProgressCourses: number;
    completedCourses: number;
    overallPercent: number;
  };
  continueLearning: {
    courseId: string;
    courseTitle: string;
    thumbnail: string | null;
    lastVideoId: string;
    lastVideoTitle: string;
    percent: number;
  }[];
  upcomingAssignments: {
    id: string;
    courseId: string;
    courseTitle: string;
    assignmentTitle: string;
    dueDate: string | null;
    unlocked: boolean;
    submitted: boolean;
    coursePercent: number;
  }[];
  recentCertificates: {
    id: string;
    courseTitle: string;
    issuedAt: string;
    certificateNumber: string;
  }[];
}

export function StudentOverview() {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading, error } = useApiFetch<OverviewData>("/api/student/overview");

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-5 w-5" />}
        title="Couldn't load your overview"
        description={error || "Please try again later."}
        action={<Button onClick={() => window.location.reload()}>Reload</Button>}
      />
    );
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ─── Premium welcome header ─── */}
      <Card className="relative overflow-hidden border-border shadow-sm">
        {/* Navy gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        {/* Decorative teal glow */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, rgba(15,118,110,0.45), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(240,253,250,0.3), transparent 70%)" }}
        />
        <CardContent className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-primary-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm mb-3">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{today}</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              Welcome back, {data.welcomeName}
            </h1>
            <p className="text-white/80 mt-2 max-w-xl text-sm md:text-base">
              {data.learning.inProgressCourses > 0
                ? `You have ${data.learning.inProgressCourses} course${data.learning.inProgressCourses > 1 ? "s" : ""} in progress. Keep up the momentum!`
                : data.learning.availableCourses > 0
                  ? "Pick a course below to start your learning journey."
                  : "No courses available to you yet. Explore the catalog or activate a subscription."}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate(["student", "courses"])}
            className="gap-2 self-start md:self-center bg-white text-primary hover:bg-white/90 shadow-md"
          >
            <BookOpen className="h-4 w-4" /> Browse Courses
          </Button>
        </CardContent>
      </Card>

      {/* ─── Subscription status ─── */}
      {data.subscription ? (
        <Card className="overflow-hidden border-border shadow-sm transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <CreditCard className="h-4 w-4" />
                </span>
                Subscription Status
              </CardTitle>
              <CardDescription className="mt-1.5">
                {data.subscription.planName} · {formatPrice(data.subscription.planPrice, data.subscription.planCurrency)}
              </CardDescription>
            </div>
            <Badge
              className={
                data.subscription.status === "ACTIVE"
                  ? "bg-success/15 text-success border-transparent"
                  : "bg-destructive/10 text-destructive border-transparent"
              }
            >
              {data.subscription.status === "ACTIVE" ? "Active" : "Expired"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-accent" />
                Started {formatDate(data.subscription.startDate)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-accent" />
                Expires {formatDate(data.subscription.expiryDate)}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent text-[10px]">⏱</span>
                {data.subscription.remainingDays} days left
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Plan usage</span>
                <span className="font-medium text-foreground">{Math.round(data.subscription.elapsedPercent)}%</span>
              </div>
              <Progress
                value={data.subscription.elapsedPercent}
                className="h-2 bg-muted [&_[data-slot=progress-indicator]]:bg-accent"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(["student", "subscription"])} className="mt-1">
              Manage subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/30 bg-gradient-to-br from-light-teal to-card shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0 ring-1 ring-accent/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">Unlock premium courses</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Subscribe to a learning plan to access paid courses, assignments and certificates.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(["student", "subscription"])} className="gap-2 shadow-sm">
              View Plans <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Summary stat cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Available Courses"
          value={data.learning.availableCourses}
          tint="accent"
        />
        <StatCard
          icon={<PlayCircle className="h-5 w-5" />}
          label="In Progress"
          value={data.learning.inProgressCourses}
          tint="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={data.learning.completedCourses}
          tint="success"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Overall Progress"
          value={`${data.learning.overallPercent}%`}
          tint="warning"
        />
      </div>

      {/* ─── Continue Learning ─── */}
      <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-accent" />
              Continue Learning
            </CardTitle>
            <CardDescription className="mt-1">Pick up where you left off</CardDescription>
          </div>
          {data.continueLearning.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate(["student", "courses"])} className="gap-1 text-accent hover:bg-accent/10 hover:text-accent">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {data.continueLearning.length === 0 ? (
            <EmptyState
              icon={<PlayCircle className="h-5 w-5" />}
              title="No lessons watched yet"
              description="Start a course to see your continue-learning list here."
              action={<Button size="sm" onClick={() => navigate(["student", "courses"])} className="gap-2">
                Explore Courses <ArrowRight className="h-4 w-4" />
              </Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.continueLearning.map((c) => (
                <button
                  key={c.courseId}
                  onClick={() => navigate(["student", "learn", c.courseId])}
                  className="group relative text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-accent/40 transition-all duration-200"
                >
                  <div className="flex gap-3">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                      <CourseThumbnail
                        thumbnail={c.thumbnail}
                        firstVideoUrl={(c as any).firstVideoUrl}
                        firstVideoSource={(c as any).firstVideoSource}
                        alt={c.courseTitle}
                        className="h-full w-full"
                        showPlayOverlay
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                        {c.courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        Up next: {c.lastVideoTitle}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">{c.percent}%</span>
                    </div>
                    <Progress
                      value={c.percent}
                      className={`h-1.5 bg-muted ${c.percent === 100 ? "[&_[data-slot=progress-indicator]]:bg-success" : "[&_[data-slot=progress-indicator]]:bg-accent"}`}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Upcoming Assignments + Recent Certificates ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-accent" />
                Upcoming Assignments
              </CardTitle>
              <CardDescription className="mt-1">Submit after course completion</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(["student", "assignments"])} className="gap-1 text-accent hover:bg-accent/10 hover:text-accent">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {data.upcomingAssignments.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-5 w-5" />}
                title="No assignments available"
                description="Assignments will appear here once you start a course."
              />
            ) : (
              <ul className="space-y-2">
                {data.upcomingAssignments.slice(0, 5).map((a) => (
                  <li
                    key={a.id}
                    className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 hover:border-accent/30 hover:bg-light-teal/30 transition-all duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{a.assignmentTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.courseTitle}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        {a.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-accent" /> Due {formatDate(a.dueDate)}
                          </span>
                        )}
                        <span>{a.coursePercent}% course progress</span>
                      </div>
                    </div>
                    <Badge
                      className={
                        a.submitted
                          ? "bg-success/15 text-success border-transparent"
                          : a.unlocked
                            ? "bg-accent/10 text-accent border-transparent"
                            : "bg-muted text-muted-foreground border-transparent"
                      }
                    >
                      {a.submitted ? "Submitted" : a.unlocked ? "Available" : (
                        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>
                      )}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-accent" />
                Recent Certificates
              </CardTitle>
              <CardDescription className="mt-1">Your achievements</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(["student", "certificates"])} className="gap-1 text-accent hover:bg-accent/10 hover:text-accent">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentCertificates.length === 0 ? (
              <EmptyState
                icon={<Award className="h-5 w-5" />}
                title="No certificates yet"
                description="Complete a course and submit its assignment to earn your first certificate."
              />
            ) : (
              <ul className="space-y-2">
                {data.recentCertificates.map((c) => (
                  <li
                    key={c.id}
                    className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 hover:border-accent/30 hover:bg-light-teal/30 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 text-accent shrink-0 ring-1 ring-accent/20">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{c.courseTitle}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Issued {formatDate(c.issuedAt)} · {c.certificateNumber}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(["student", "certificates"])} className="shrink-0">
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tint: "accent" | "primary" | "success" | "warning";
}) {
  const tintClasses: Record<typeof tint, string> = {
    accent: "bg-accent/10 text-accent ring-accent/20",
    primary: "bg-primary/10 text-primary ring-primary/20",
    success: "bg-success/15 text-success ring-success/20",
    warning: "bg-warning/15 text-warning ring-warning/20",
  };
  return (
    <Card className="p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tintClasses[tint]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-heading text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1.5 truncate">{label}</p>
        </div>
      </div>
    </Card>
  );
}

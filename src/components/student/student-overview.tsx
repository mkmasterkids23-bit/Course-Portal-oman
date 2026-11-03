"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import {
  BookOpen, PlayCircle, ClipboardList, Award, TrendingUp, ArrowRight,
  CalendarDays, CheckCircle2, Lock, Clock, Sparkles, GraduationCap,
} from "lucide-react";
import { formatDate, formatPrice, durationUnitLabel } from "@/types";

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
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
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
      {/* Welcome header */}
      <Card className="relative overflow-hidden border-accent/20">
        <div
          className="absolute inset-y-0 right-0 w-1/3 opacity-50 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, rgba(15,118,110,0.12), transparent 60%)",
          }}
        />
        <CardContent className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-3">
              <CalendarDays className="h-3.5 w-3.5 text-accent" />
              <span>{today}</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {data.welcomeName}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              {data.learning.inProgressCourses > 0
                ? `You have ${data.learning.inProgressCourses} course${data.learning.inProgressCourses > 1 ? "s" : ""} in progress. Keep up the momentum!`
                : data.learning.availableCourses > 0
                  ? "Pick a course below to start your learning journey."
                  : "No courses available to you yet. Explore the catalog or activate a subscription."}
            </p>
          </div>
          <Button size="lg" onClick={() => navigate(["student", "courses"])} className="gap-2 self-start md:self-center">
            <BookOpen className="h-4 w-4" /> Browse Courses
          </Button>
        </CardContent>
      </Card>

      {/* Subscription status */}
      {data.subscription ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">Subscription Status</CardTitle>
              <CardDescription className="mt-1">
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
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Started {formatDate(data.subscription.startDate)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                Expires {formatDate(data.subscription.expiryDate)}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {data.subscription.remainingDays} days left
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Plan usage</span>
                <span>{Math.round(data.subscription.elapsedPercent)}%</span>
              </div>
              <Progress value={data.subscription.elapsedPercent} className="h-2" />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(["student", "subscription"])} className="mt-2">
              Manage subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/30">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">Unlock premium courses</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Subscribe to a learning plan to access paid courses, assignments and certificates.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(["student", "subscription"])} className="gap-2">
              View Plans <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Learning stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Continue Learning */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </div>
          {data.continueLearning.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate(["student", "courses"])} className="gap-1 text-accent">
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
                  className="text-left group rounded-lg border border-border bg-card p-4 hover:border-accent/40 hover:shadow-sm transition-all"
                >
                  <div className="flex gap-3">
                    <div className="h-12 w-16 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <PlayCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-accent">
                        {c.courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        Up next: {c.lastVideoTitle}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{c.percent}%</span>
                    </div>
                    <Progress value={c.percent} className="h-1.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Assignments + Recent Certificates */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Upcoming Assignments</CardTitle>
              <CardDescription>Submit after course completion</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(["student", "assignments"])} className="gap-1 text-accent">
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
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{a.assignmentTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.courseTitle}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        {a.dueDate && <span>Due {formatDate(a.dueDate)}</span>}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent Certificates</CardTitle>
              <CardDescription>Your achievements</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(["student", "certificates"])} className="gap-1 text-accent">
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
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{c.courseTitle}</p>
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
    accent: "bg-accent/10 text-accent",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tintClasses[tint]}`}>
          {icon}
        </div>
        <div>
          <p className="font-heading text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </div>
    </Card>
  );
}

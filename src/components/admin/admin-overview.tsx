"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { formatDateTime } from "@/types";
import {
  Users, BookOpen, Award, CreditCard, FileText, ClipboardList,
  TrendingUp, ArrowRight, UserPlus, PlusCircle, Layers, GraduationCap,
  Sparkles,
} from "lucide-react";

interface OverviewData {
  totalStudents: number;
  totalCourses: number;
  totalFreeCourses: number;
  totalPaidCourses: number;
  totalActiveSubscriptions: number;
  totalExpiredSubscriptions: number;
  totalAssignments: number;
  totalSubmittedAssignments: number;
  totalCertificatesIssued: number;
  recentStudents: { id: string; name: string; email: string; createdAt: string }[];
  recentCourses: { id: string; title: string; createdAt: string; isPublished: boolean }[];
  recentSubmissions: {
    id: string;
    studentName: string;
    assignmentTitle: string;
    submittedAt: string;
  }[];
  recentCertificates: {
    id: string;
    studentName: string;
    courseTitle: string;
    issuedAt: string;
  }[];
}

export function AdminOverview() {
  const navigate = useAppStore((s) => s.navigate);
  const query = useAppStore((s) => s.query);
  const { data, loading, error } = useApiFetch<OverviewData>("/api/admin/overview");

  // Quick-action deep links: when query.action=new is present, route to the relevant section
  useEffect(() => {
    if (query.action === "new") {
      // The section router already directs the user to the right page based on segments[1].
      // The pages read query.action themselves to open their create dialogs.
    }
  }, [query.action]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s a snapshot of your platform today.
          </p>
        </div>
        <Badge variant="outline" className="bg-card text-muted-foreground gap-1.5 self-start">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Badge>
      </div>

      {loading ? (
        <OverviewSkeleton />
      ) : error ? (
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="Couldn't load dashboard"
          description={error}
        />
      ) : data ? (
        <>
          {/* Primary stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Total Students"
              value={data.totalStudents}
              hint="enrolled learners"
              tone="primary"
            />
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Total Courses"
              value={data.totalCourses}
              hint={`${data.totalFreeCourses} free / ${data.totalPaidCourses} paid`}
              tone="accent"
            />
            <StatCard
              icon={<CreditCard className="h-5 w-5" />}
              label="Active Subscriptions"
              value={data.totalActiveSubscriptions}
              hint={`${data.totalExpiredSubscriptions} expired`}
              tone="success"
            />
            <StatCard
              icon={<Award className="h-5 w-5" />}
              label="Certificates Issued"
              value={data.totalCertificatesIssued}
              hint="lifetime"
              tone="primary"
            />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SmallStat
              icon={<GraduationCap className="h-4 w-4" />}
              label="Free Courses"
              value={data.totalFreeCourses}
            />
            <SmallStat
              icon={<Layers className="h-4 w-4" />}
              label="Paid Courses"
              value={data.totalPaidCourses}
            />
            <SmallStat
              icon={<CreditCard className="h-4 w-4" />}
              label="Expired Subscriptions"
              value={data.totalExpiredSubscriptions}
            />
            <SmallStat
              icon={<ClipboardList className="h-4 w-4" />}
              label="Submitted Assignments"
              value={data.totalSubmittedAssignments}
            />
          </div>

          {/* Recent Activity */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Recent Activity
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <RecentCard
                title="New Students"
                icon={<Users className="h-4 w-4" />}
                items={data.recentStudents.map((s) => ({
                  id: s.id,
                  primary: s.name,
                  secondary: s.email,
                  date: s.createdAt,
                }))}
                onMore={() => navigate(["admin", "students"])}
                emptyText="No students yet"
              />
              <RecentCard
                title="Recent Courses"
                icon={<BookOpen className="h-4 w-4" />}
                items={data.recentCourses.map((c) => ({
                  id: c.id,
                  primary: c.title,
                  secondary: c.isPublished ? "Published" : "Draft",
                  date: c.createdAt,
                }))}
                onMore={() => navigate(["admin", "courses"])}
                emptyText="No courses yet"
              />
              <RecentCard
                title="Recent Submissions"
                icon={<ClipboardList className="h-4 w-4" />}
                items={data.recentSubmissions.map((s) => ({
                  id: s.id,
                  primary: s.studentName,
                  secondary: s.assignmentTitle,
                  date: s.submittedAt,
                }))}
                onMore={() => navigate(["admin", "submissions"])}
                emptyText="No submissions yet"
              />
              <RecentCard
                title="Recent Certificates"
                icon={<Award className="h-4 w-4" />}
                items={data.recentCertificates.map((c) => ({
                  id: c.id,
                  primary: c.studentName,
                  secondary: c.courseTitle,
                  date: c.issuedAt,
                }))}
                onMore={() => navigate(["admin", "certificates"])}
                emptyText="No certificates issued yet"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(["admin", "students"], { action: "new" })}
                >
                  <UserPlus className="h-4 w-4 text-accent" /> Add Student
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(["admin", "courses"], { action: "new" })}
                >
                  <PlusCircle className="h-4 w-4 text-accent" /> Create Course
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(["admin", "materials"], { action: "new" })}
                >
                  <FileText className="h-4 w-4 text-accent" /> Add Material
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(["admin", "assignments"], { action: "new" })}
                >
                  <ClipboardList className="h-4 w-4 text-accent" /> Create Assignment
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(["admin", "plans"], { action: "new" })}
                >
                  <CreditCard className="h-4 w-4 text-accent" /> Create Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tone: "primary" | "accent" | "success";
}) {
  const toneClasses =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "accent"
      ? "bg-accent/10 text-accent"
      : "bg-success/15 text-success";
  return (
    <Card className="overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-3xl font-bold text-foreground leading-none">
            {value.toLocaleString()}
          </p>
          {hint && <p className="text-xs text-muted-foreground pt-1">{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${toneClasses}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function SmallStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-heading text-xl font-bold text-foreground leading-none">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function RecentCard({
  title,
  icon,
  items,
  onMore,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; primary: string; secondary: string; date: string }[];
  onMore: () => void;
  emptyText: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
            {icon}
          </div>
          <h4 className="font-heading text-sm font-semibold text-foreground">{title}</h4>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={onMore}>
          View all <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 5).map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{it.primary}</p>
                <p className="text-xs text-muted-foreground truncate">{it.secondary}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDateTime(it.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

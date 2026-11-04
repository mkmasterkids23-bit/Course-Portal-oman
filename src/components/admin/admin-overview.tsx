"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { formatDateTime } from "@/types";
import {
  Users, BookOpen, Award, CreditCard, FileText, ClipboardList,
  TrendingUp, ArrowRight, UserPlus, PlusCircle,
  Sparkles, Video,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

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
  totalVideoLessons: number;
  pendingReviews: number;
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
  coursePerformance: {
    id: string;
    title: string;
    lessons: number;
    topics: number;
    certificates: number;
  }[];
  studentCompletionBuckets: {
    notStarted: number;
    beginner: number;
    intermediate: number;
    advanced: number;
    completed: number;
  };
}

const PIE_COLORS = ["#E2E8F0", "#94A3B8", "#0F766E", "#172554", "#15803D"];

export function AdminOverview() {
  const navigate = useAppStore((s) => s.navigate);
  const query = useAppStore((s) => s.query);
  const { data, loading, error } = useApiFetch<OverviewData>("/api/admin/overview");

  useEffect(() => {
    if (query.action === "new") {
      // Section pages read query.action to auto-open create dialogs
    }
  }, [query.action]);

  const completionData = data
    ? [
        { name: "Not Started", value: data.studentCompletionBuckets.notStarted },
        { name: "Beginner", value: data.studentCompletionBuckets.beginner },
        { name: "Intermediate", value: data.studentCompletionBuckets.intermediate },
        { name: "Advanced", value: data.studentCompletionBuckets.advanced },
        { name: "Completed", value: data.studentCompletionBuckets.completed },
      ]
    : [];

  const totalCompletionStudents = completionData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Premium welcome header */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/85 p-6 text-primary-foreground shadow-sm">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(15,118,110,0.5), transparent 55%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.12), transparent 45%), radial-gradient(circle at 70% 90%, rgba(15,118,110,0.3), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              Admin Console
            </p>
            <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">
              Welcome back, Administrator
            </h2>
            <p className="mt-1.5 text-sm text-primary-foreground/75 max-w-md">
              Here&apos;s a snapshot of your platform today. Monitor learners, courses and engagement at a glance.
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
          title="Couldn't load dashboard"
          description={error}
        />
      ) : data ? (
        <>
          {/* Primary stat cards — 5 elegant cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 stagger-children">
            <PremiumStatCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Total Courses"
              value={data.totalCourses}
              hint={`${data.totalFreeCourses} free · ${data.totalPaidCourses} paid`}
              tone="navy"
            />
            <PremiumStatCard
              icon={<Users className="h-5 w-5" />}
              label="Enrolled Students"
              value={data.totalStudents}
              hint={`${data.totalActiveSubscriptions} active subs`}
              tone="teal"
            />
            <PremiumStatCard
              icon={<Video className="h-5 w-5" />}
              label="Video Lessons"
              value={data.totalVideoLessons}
              hint="published lessons"
              tone="navy"
            />
            <PremiumStatCard
              icon={<ClipboardList className="h-5 w-5" />}
              label="Pending Reviews"
              value={data.pendingReviews}
              hint={`${data.totalSubmittedAssignments} total submissions`}
              tone="amber"
              urgent={data.pendingReviews > 0}
            />
            <PremiumStatCard
              icon={<Award className="h-5 w-5" />}
              label="Certificates"
              value={data.totalCertificatesIssued}
              hint="lifetime issued"
              tone="green"
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Course Performance — bar chart */}
            <Card className="overflow-hidden border-border bg-card shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Course Performance
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Lessons & certificates per course
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-accent" onClick={() => navigate(["admin", "courses"])}>
                  View courses <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-4">
                {data.coursePerformance.length === 0 ? (
                  <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                    No courses to display yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.coursePerformance} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="title"
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickLine={false}
                        axisLine={{ stroke: "#E2E8F0" }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #E2E8F0",
                          fontSize: 12,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                        cursor={{ fill: "#F1F5F9" }}
                      />
                      <Bar dataKey="lessons" fill="#172554" radius={[4, 4, 0, 0]} name="Lessons" />
                      <Bar dataKey="certificates" fill="#0F766E" radius={[4, 4, 0, 0]} name="Certificates" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Student Completion — donut chart */}
            <Card className="overflow-hidden border-border bg-card shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Student Completion
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Learning progress distribution
                  </p>
                </div>
              </div>
              <div className="p-4">
                {totalCompletionStudents === 0 ? (
                  <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                    No student data yet
                  </div>
                ) : (
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={completionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {completionData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-heading text-2xl font-bold text-foreground">
                        {totalCompletionStudents}
                      </span>
                      <span className="text-xs text-muted-foreground">students</span>
                    </div>
                  </div>
                )}
                {/* Legend */}
                <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                  {completionData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-medium text-foreground ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent activity — two columns */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent Students */}
            <Card className="overflow-hidden border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">Recently Registered Students</h3>
                    <p className="text-xs text-muted-foreground">Latest enrollments</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-accent" onClick={() => navigate(["admin", "students"])}>
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2">
                {data.recentStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No students yet</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.recentStudents.slice(0, 5).map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-3 py-3 transition-colors duration-200 rounded-md hover:bg-muted/40">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                          {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {formatDateTime(s.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Recent Submissions */}
            <Card className="overflow-hidden border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">Recent Assignment Submissions</h3>
                    <p className="text-xs text-muted-foreground">Latest student submissions</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-accent" onClick={() => navigate(["admin", "submissions"])}>
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2">
                {data.recentSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No submissions yet</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.recentSubmissions.slice(0, 5).map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-3 py-3 transition-colors duration-200 rounded-md hover:bg-muted/40">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{s.studentName}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.assignmentTitle}</p>
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
          </div>

          {/* Quick actions */}
          <Card className="border-dashed border-border bg-card/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-semibold text-foreground">Quick Actions</h3>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">Shortcuts</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Jump straight into common tasks</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <QuickActionButton icon={<UserPlus className="h-4 w-4" />} label="Add Student" onClick={() => navigate(["admin", "students"], { action: "new" })} />
                  <QuickActionButton icon={<PlusCircle className="h-4 w-4" />} label="Create Course" onClick={() => navigate(["admin", "courses"], { action: "new" })} />
                  <QuickActionButton icon={<FileText className="h-4 w-4" />} label="Add Material" onClick={() => navigate(["admin", "materials"], { action: "new" })} />
                  <QuickActionButton icon={<ClipboardList className="h-4 w-4" />} label="Create Assignment" onClick={() => navigate(["admin", "assignments"], { action: "new" })} />
                  <QuickActionButton icon={<CreditCard className="h-4 w-4" />} label="Create Plan" onClick={() => navigate(["admin", "plans"], { action: "new" })} />
                </div>
              </div>
            </CardContent>
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
    <Card className={`group overflow-hidden border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${borderClass}`}>
      <div className="flex flex-col gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]} transition-transform duration-200 group-hover:scale-105`}>
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

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="h-9 gap-2 border-border bg-card transition-all duration-200 hover:border-accent/30 hover:bg-light-teal/40" onClick={onClick}>
      <span className="text-accent">{icon}</span>
      {label}
    </Button>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 stagger-children">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-10 w-10 rounded-lg mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[260px] w-full" />
        </Card>
        <Card className="lg:col-span-2 p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[220px] w-full" />
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-5 w-48 mb-4" />
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

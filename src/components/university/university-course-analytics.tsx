"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { formatDate } from "@/types";
import {
  BookOpen, Users, Award, TrendingUp, Activity, BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

// ---- types ----------------------------------------------------------------

interface OverviewData {
  totalPublishedCourses: number;
  totalEnrolledStudents: number;
  totalCompletions: number;
  activeLearners: number;
  avgCompletionRate: number;
  enrollmentTrend: { date: string; count: number }[];
  coursePerformance: {
    id: string;
    title: string;
    enrolled: number;
    completed: number;
    inProgress: number;
    avgCompletion: number;
    createdAt: string;
    isPublished: boolean;
  }[];
}

// Sage palette
const SAGE_PRIMARY = "#344F42";
const SAGE_ACCENT = "#789786";
const SAGE_LIGHT = "#A5B8AD";
const SAGE_SUCCESS = "#43866A";
const SAGE_WARNING = "#D9A441";

// ---- Component ------------------------------------------------------------

export function UniversityCourseAnalytics() {
  const { data, loading, error } = useApiFetch<OverviewData>(
    "/api/university/analytics/overview"
  );

  if (loading) return <AnalyticsSkeleton />;
  if (error) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-5 w-5" />}
        title="Couldn't load analytics"
        description={error}
      />
    );
  }
  if (!data) return null;

  const trendData = data.enrollmentTrend.map((t) => ({
    ...t,
    label: formatDateShort(t.date),
  }));

  const comparisonData = data.coursePerformance.slice(0, 8).map((c) => ({
    name: c.title.length > 18 ? c.title.slice(0, 18) + "…" : c.title,
    fullName: c.title,
    Enrolled: c.enrolled,
    Completed: c.completed,
    "In Progress": c.inProgress,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/85 p-5 text-primary-foreground shadow-sm">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 50%, rgba(120,151,134,0.45), transparent 55%), radial-gradient(circle at 85% 15%, rgba(252,252,250,0.14), transparent 45%), radial-gradient(circle at 70% 90%, rgba(67,134,106,0.35), transparent 50%)",
          }}
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Course Analytics
          </p>
          <h2 className="font-heading mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            Teaching Performance Overview
          </h2>
          <p className="mt-1 text-sm text-primary-foreground/75 max-w-md">
            Enrollment trends, completion rates and per-course performance for your university.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5 stagger-children">
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Published Courses"
          value={data.totalPublishedCourses}
          tone="primary"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Enrolled Students"
          value={data.totalEnrolledStudents}
          tone="accent"
        />
        <StatCard
          icon={<Award className="h-4 w-4" />}
          label="Completions"
          value={data.totalCompletions}
          tone="success"
          hint="certificates issued"
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Active Learners"
          value={data.activeLearners}
          tone="warning"
          hint="last 7 days"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Completion"
          value={`${data.avgCompletionRate}%`}
          tone="primary"
        />
      </div>

      {/* Trend + comparison */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Enrollment trend */}
        <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Enrollment Trend
                </h3>
                <p className="text-xs text-muted-foreground">New learners per day · last 30 days</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {data.enrollmentTrend.reduce((s, t) => s + t.count, 0)} enrollments
            </Badge>
          </div>
          <div className="p-4">
            {trendData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No enrollment activity yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SAGE_PRIMARY} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={SAGE_PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAE5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#77827B" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5EAE5" }}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#77827B" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E5EAE5",
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(37,51,43,0.08)",
                    }}
                    labelStyle={{ color: "#344F42", fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Enrollments"
                    stroke={SAGE_PRIMARY}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: SAGE_PRIMARY, stroke: SAGE_PRIMARY }}
                    activeDot={{ r: 5, fill: SAGE_PRIMARY }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Course comparison */}
        <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Course Comparison
                </h3>
                <p className="text-xs text-muted-foreground">Enrolled vs completed vs in-progress</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {comparisonData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No course data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comparisonData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAE5" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#77827B" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5EAE5" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#77827B" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E5EAE5",
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(37,51,43,0.08)",
                    }}
                    cursor={{ fill: "#E8EFEA" }}
                  />
                  <Bar dataKey="Enrolled" fill={SAGE_PRIMARY} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill={SAGE_SUCCESS} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="In Progress" fill={SAGE_LIGHT} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Course performance table */}
      <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Course Performance
              </h3>
              <p className="text-xs text-muted-foreground">Per-course enrollment & completion breakdown</p>
            </div>
          </div>
        </div>
        {data.coursePerformance.length === 0 ? (
          <EmptyState
            className="m-4"
            icon={<BookOpen className="h-5 w-5" />}
            title="No courses yet"
            description="Create and publish courses to see performance metrics here."
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
<Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enrolled</TableHead>
                <TableHead className="hidden text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Completed</TableHead>
                <TableHead className="hidden text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">In Progress</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Completion</TableHead>
                <TableHead className="hidden text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.coursePerformance.map((c) => (
                <TableRow key={c.id} className="hover:bg-soft-sage/40">
                  <TableCell>
                    <div className="min-w-0 max-w-[260px]">
                      <p className="font-medium text-foreground truncate">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground">Created {formatDate(c.createdAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground tabular-nums">{c.enrolled}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums">
                    <span className="text-success font-medium">{c.completed}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">{c.inProgress}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={c.avgCompletion} className="h-1.5" />
                      <span className="text-xs font-medium text-foreground tabular-nums">{c.avgCompletion}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    {c.isPublished ? (
                      <Badge className="bg-success/15 text-success">Published</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
</div>
        )}
      </Card>
    </div>
  );
}

// ---- helpers --------------------------------------------------------------

function formatDateShort(iso: string): string {
  // iso is YYYY-MM-DD
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ---- sub-components -------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "accent" | "success" | "warning";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  };
  return (
    <Card className="group overflow-hidden rounded-lg border-border bg-card p-3 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-w-0">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]} transition-transform group-hover:scale-105 shrink-0`}>
        {icon}
      </div>
      <p className="font-heading text-xl sm:text-2xl font-bold text-foreground leading-none tracking-tight mt-3 truncate">
        {value}
      </p>
      <p className="text-[12px] font-medium text-foreground/90 mt-1.5 truncate">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-16 mt-3" />
            <Skeleton className="h-3 w-24 mt-2" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[260px] w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[260px] w-full" />
        </Card>
      </div>
      <Card className="p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}

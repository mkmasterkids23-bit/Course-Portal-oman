"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import {
  ClipboardList, Repeat, TrendingUp, CheckCircle2, XCircle,
  BarChart3, PieChart as PieIcon, Award,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";

// ---- types ----------------------------------------------------------------

interface AssessmentsData {
  totalAssessments: number;
  totalAttempts: number;
  avgScore: number;
  passRate: number;
  failRate: number;
  passedCount: number;
  retakeCount: number;
  assessmentDetails: {
    videoId: string;
    videoTitle: string;
    courseTitle: string;
    questionCount: number;
    participants: number;
    avgScore: number;
    highScore: number;
    lowScore: number;
    passRate: number;
    attempts: number;
  }[];
}

// Sage palette
const SAGE_PRIMARY = "#344F42";
const SAGE_ACCENT = "#789786";
const SAGE_LIGHT = "#A5B8AD";
const SAGE_SUCCESS = "#43866A";
const SAGE_WARNING = "#D9A441";

const SCORE_BUCKETS = [
  { label: "0-20", min: 0, max: 20 },
  { label: "21-40", min: 21, max: 40 },
  { label: "41-60", min: 41, max: 60 },
  { label: "61-80", min: 61, max: 80 },
  { label: "81-100", min: 81, max: 100 },
];

// ---- Component ------------------------------------------------------------

export function UniversityAssessmentAnalytics() {
  const { data, loading, error } = useApiFetch<AssessmentsData>(
    "/api/university/analytics/assessments"
  );

  // Memoised derived data
  const distribution = useMemo(() => {
    if (!data) return [];
    return SCORE_BUCKETS.map((b) => ({
      label: b.label,
      count: data.assessmentDetails.filter((d) => d.avgScore >= b.min && d.avgScore <= b.max).length,
    }));
  }, [data]);

  const passFailData = useMemo(() => {
    if (!data) return [];
    const failed = data.totalAssessments - data.passedCount;
    return [
      { name: "Passed", value: data.passedCount, color: SAGE_SUCCESS },
      { name: "Failed", value: failed, color: SAGE_WARNING },
    ];
  }, [data]);

  const comparisonData = useMemo(() => {
    if (!data) return [];
    return data.assessmentDetails.slice(0, 10).map((a) => ({
      name: a.videoTitle.length > 16 ? a.videoTitle.slice(0, 16) + "…" : a.videoTitle,
      fullName: a.videoTitle,
      "Avg Score": a.avgScore,
      "High Score": a.highScore,
      "Low Score": a.lowScore,
    }));
  }, [data]);

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
            Assessment Analytics
          </p>
          <h2 className="font-heading mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            Quiz & Test Performance
          </h2>
          <p className="mt-1 text-sm text-primary-foreground/75 max-w-md">
            Track assessment attempts, scores, pass rates and identify which quizzes need attention.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 stagger-children">
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Total Assessments"
          value={data.totalAssessments}
          tone="primary"
          hint={`${data.assessmentDetails.length} quizzes`}
        />
        <StatCard
          icon={<Repeat className="h-4 w-4" />}
          label="Total Attempts"
          value={data.totalAttempts}
          tone="accent"
          hint={`${data.retakeCount} retakes`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Score"
          value={`${data.avgScore}%`}
          tone="success"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Pass Rate"
          value={`${data.passRate}%`}
          tone="warning"
          hint={`${data.passedCount} passed`}
        />
      </div>

      {/* Distribution + pie */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Score distribution bar chart */}
        <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Score Distribution
                </h3>
                <p className="text-xs text-muted-foreground">Quizzes bucketed by average score</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              avg {data.avgScore}%
            </Badge>
          </div>
          <div className="p-4">
            {data.assessmentDetails.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No assessment data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distribution} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAE5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#77827B" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E5EAE5" }}
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
                  <Bar dataKey="count" name="Quizzes" radius={[4, 4, 0, 0]}>
                    {distribution.map((entry, idx) => {
                      const bucket = SCORE_BUCKETS[idx];
                      const color =
                        bucket.min >= 81
                          ? SAGE_SUCCESS
                          : bucket.min >= 61
                            ? SAGE_ACCENT
                            : bucket.min >= 41
                              ? SAGE_LIGHT
                              : SAGE_WARNING;
                      return <Cell key={entry.label} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Pass/Fail pie */}
        <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success">
                <PieIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Pass / Fail
                </h3>
                <p className="text-xs text-muted-foreground">Outcome breakdown</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {data.totalAssessments === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No attempts yet
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={passFailData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {passFailData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #E5EAE5",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 top-[40%] flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-heading text-2xl font-bold text-foreground leading-none">
                    {data.passRate}%
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">pass rate</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Score comparison per assessment */}
      <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Per-Assessment Score Range
              </h3>
              <p className="text-xs text-muted-foreground">Avg / high / low score per quiz</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          {comparisonData.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              No assessment data yet
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
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#77827B" }}
                  tickLine={false}
                  axisLine={false}
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
                <Legend
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
                <Bar dataKey="Low Score" fill={SAGE_WARNING} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Avg Score" fill={SAGE_PRIMARY} radius={[4, 4, 0, 0]} />
                <Bar dataKey="High Score" fill={SAGE_SUCCESS} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Assessment performance table */}
      <Card className="rounded-lg border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Assessment Performance
              </h3>
              <p className="text-xs text-muted-foreground">Detailed results per quiz</p>
            </div>
          </div>
        </div>
        {data.assessmentDetails.length === 0 ? (
          <EmptyState
            className="m-4"
            icon={<ClipboardList className="h-5 w-5" />}
            title="No assessments yet"
            description="Add quiz questions to your videos to see assessment analytics here."
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
<Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assessment</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Course</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participants</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg</TableHead>
                <TableHead className="hidden text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">High</TableHead>
                <TableHead className="hidden text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Low</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pass Rate</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attempts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.assessmentDetails.map((a) => (
                <TableRow key={a.videoId} className="hover:bg-soft-sage/40">
                  <TableCell>
                    <div className="min-w-0 max-w-[240px]">
                      <p className="font-medium text-foreground truncate">{a.videoTitle}</p>
                      <p className="text-[11px] text-muted-foreground">{a.questionCount} questions</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-foreground/80 truncate max-w-[200px]">
                    {a.courseTitle}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-foreground">{a.participants}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <ScorePill score={a.avgScore} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums text-success font-medium">{a.highScore}%</TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums text-warning font-medium">{a.lowScore}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-28">
                      <Progress value={a.passRate} className="h-1.5" />
                      <span className="text-xs font-medium text-foreground tabular-nums">{a.passRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{a.attempts}</TableCell>
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

function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 70
      ? "bg-success/15 text-success"
      : score >= 50
        ? "bg-warning/15 text-warning"
        : "bg-destructive/10 text-destructive";
  const Icon = score >= 70 ? CheckCircle2 : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {score}%
    </span>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-16 mt-3" />
            <Skeleton className="h-3 w-24 mt-2" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
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

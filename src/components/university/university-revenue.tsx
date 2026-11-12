"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { useI18n } from "@/lib/i18n/store";
import { formatPrice } from "@/types";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  TrendingUp, DollarSign, Users, Gift, BarChart3, ArrowRight,
  Lock, Sparkles, BookOpen, CheckCircle2,
} from "lucide-react";

interface CourseRevenueRow {
  courseId: string;
  title: string;
  accessType: "FREE" | "PAID";
  price: number;
  enrollments: number;
  grossSales: number;
}

interface MonthlyTrendPoint {
  month: string;
  revenue: number;
}

interface RevenueData {
  hasPaymentData: boolean;
  totalSales: number;
  grossRevenue: number;
  paidEnrollments: number;
  freeEnrollments: number;
  currency: string;
  courseRevenue: CourseRevenueRow[];
  monthlyTrend: MonthlyTrendPoint[];
}

export function UniversityRevenue() {
  const { t } = useI18n();
  const { data, loading, error } = useApiFetch<RevenueData>("/api/university/revenue");

  return (
    <div className="space-y-6">
      {/* Premium header */}
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
              Revenue Insights
            </p>
            <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">
              Revenue Dashboard
            </h2>
            <p className="mt-1.5 text-sm text-primary-foreground/75 max-w-md">
              Track subscription-driven course sales, learner enrollments, and month-over-month
              revenue performance at a glance.
            </p>
          </div>
          <Badge className="self-start gap-1.5 border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </Badge>
        </div>
      </div>

      {loading ? (
        <RevenueSkeleton />
      ) : error ? (
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="Couldn't load revenue data"
          description={error}
          action={<Button onClick={() => window.location.reload()}>Reload</Button>}
        />
      ) : data ? (
        data.hasPaymentData ? (
          <RevenueContent data={data} />
        ) : (
          <NoPaymentData />
        )
      ) : null}
    </div>
  );
}

function RevenueContent({ data }: { data: RevenueData }) {
  const currency = data.currency || "OMR";

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 stagger-children">
        <RevenueStatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Gross Revenue"
          value={formatPrice(data.grossRevenue, currency)}
          hint="from paying subscriptions"
          tone="green"
        />
        <RevenueStatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Sales"
          value={data.totalSales}
          hint="paying subscriptions"
          tone="navy"
        />
        <RevenueStatCard
          icon={<Users className="h-5 w-5" />}
          label="Paid Enrollments"
          value={data.paidEnrollments}
          hint="paid course progress"
          tone="teal"
        />
        <RevenueStatCard
          icon={<Gift className="h-5 w-5" />}
          label="Free Enrollments"
          value={data.freeEnrollments}
          hint="free course progress"
          tone="amber"
        />
      </div>

      {/* Monthly trend chart */}
      <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border pb-5">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <BarChart3 className="h-4 w-4" />
              </span>
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription className="mt-1.5">
              Subscription revenue attributed by start month — last 6 months
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-muted-foreground border-border">
            {currency}
          </Badge>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {data.monthlyTrend.length === 0 ||
          data.monthlyTrend.every((p) => p.revenue === 0) ? (
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" />}
              title="No revenue in the last 6 months"
              description="Revenue from new subscriptions will appear here as it accrues."
              className="m-4"
            />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthlyTrend}
                  margin={{ top: 16, right: 16, left: 4, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#344F42" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#789786" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E5EAE5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#77827B", fontSize: 12 }}
                    dy={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#77827B", fontSize: 12 }}
                    width={56}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
                  />
                  <Tooltip
                    cursor={{ stroke: "#789786", strokeWidth: 1, strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #E5EAE5",
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(37,51,43,0.08)",
                      color: "#25332B",
                    }}
                    labelStyle={{ color: "#77827B", fontWeight: 600 }}
                    formatter={(value: number) => [
                      formatPrice(value, currency),
                      "Revenue",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#344F42"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{ r: 3, fill: "#344F42", strokeWidth: 0 }}
                    activeDot={{
                      r: 5,
                      fill: "#344F42",
                      stroke: "#FFFFFF",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course-wise revenue table */}
      <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-5">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              Course-wise Revenue
            </CardTitle>
            <CardDescription className="mt-1.5">
              Per-course enrollment counts and attributable gross sales
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-muted-foreground border-border">
            {data.courseRevenue.length} courses
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {data.courseRevenue.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-5 w-5" />}
              title="No published courses yet"
              description="Once you publish courses and learners start enrolling, the breakdown will appear here."
              className="m-4"
            />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full premium-table">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left">Course</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Enrollments</th>
                    <th className="px-5 py-3 text-right">Gross Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.courseRevenue.map((row) => (
                    <tr
                      key={row.courseId}
                      className="hover:bg-muted/30 transition-colors duration-200"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {row.title}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {row.accessType === "FREE" ? (
                          <Badge className="bg-success/15 text-success border-transparent">
                            Free
                          </Badge>
                        ) : (
                          <Badge className="bg-primary/10 text-primary border-transparent">
                            Paid
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm tabular-nums text-foreground">
                        {row.accessType === "FREE"
                          ? "—"
                          : formatPrice(row.price, currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-foreground">
                          <Users className="h-3.5 w-3.5 text-accent" />
                          {row.enrollments}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm tabular-nums font-semibold text-foreground">
                        {row.grossSales > 0 ? (
                          formatPrice(row.grossSales, currency)
                        ) : (
                          <span className="text-muted-foreground font-normal">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function NoPaymentData() {
  return (
    <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
      <CardContent className="p-0">
        {/* Soft sage hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-soft-sage via-soft-sage/60 to-card p-8 md:p-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, rgba(120,151,134,0.25), transparent 55%), radial-gradient(circle at 15% 85%, rgba(52,79,66,0.08), transparent 55%)",
            }}
          />
          <div className="relative flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm">
              <Lock className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Revenue tracking will appear here once payment processing is configured
              </h3>
              <p className="text-sm text-muted-foreground">
                Once learners subscribe to plans that unlock your paid courses and start
                making progress, this dashboard will surface your gross revenue, sales
                trends, and per-course breakdown — all in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Badge
                variant="outline"
                className="bg-card/80 border-border text-muted-foreground backdrop-blur-sm"
              >
                <CheckCircle2 className="h-3 w-3 text-accent mr-1.5" />
                Subscription plans detected
              </Badge>
              <Badge
                variant="outline"
                className="bg-card/80 border-border text-muted-foreground backdrop-blur-sm"
              >
                <ArrowRight className="h-3 w-3 text-accent mr-1.5" />
                Awaiting first paying enrollment
              </Badge>
            </div>
          </div>
        </div>

        {/* Placeholder stat skeleton row */}
        <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4 lg:p-8">
          {[
            { label: "Gross Revenue", icon: DollarSign },
            { label: "Total Sales", icon: TrendingUp },
            { label: "Paid Enrollments", icon: Users },
            { label: "Free Enrollments", icon: Gift },
          ].map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-dashed border-border bg-muted/20 p-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground mb-3">
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-heading text-xl font-bold text-muted-foreground leading-none">
                —
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueStatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  tone: "navy" | "teal" | "amber" | "green";
}) {
  const toneClasses = {
    navy: "bg-primary/10 text-primary",
    teal: "bg-accent/10 text-accent",
    amber: "bg-warning/15 text-warning",
    green: "bg-success/15 text-success",
  };
  return (
    <Card className="group overflow-hidden rounded-lg border-border bg-card p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-3 min-w-0">
        <div
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl ${toneClasses[tone]} transition-transform duration-200 group-hover:scale-105 shrink-0`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-heading text-xl sm:text-2xl lg:text-[28px] font-bold text-foreground leading-none tracking-tight truncate">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-foreground/90 truncate">{label}</p>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 stagger-children">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-10 w-10 rounded-lg mb-3" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-72 w-full" />
      </Card>
      <Card className="p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}

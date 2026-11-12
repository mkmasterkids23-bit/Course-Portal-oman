"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch, apiPost } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n/store";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/types";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import {
  CalendarDays,
  CalendarRange,
  Infinity as InfinityIcon,
  Lock,
  Unlock,
  Search,
  MoreHorizontal,
  Pencil,
  CalendarClock,
  Clock,
  BookOpen,
  Users,
} from "lucide-react";

type AvailabilityMode = "ALWAYS" | "SCHEDULED" | "LIMITED";

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  firstVideoUrl?: string | null;
  firstVideoSource?: "UPLOAD" | "YOUTUBE" | "URL" | null;
  category: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  accessType: "FREE" | "PAID";
  isPublished: boolean;
  startDate: string | null;
  endDate: string | null;
  availabilityMode: AvailabilityMode;
  enrollmentOpen: boolean;
  createdAt: string;
  topicsCount: number;
  videosCount: number;
  planNames: string[];
}

interface CoursesResponse {
  courses: CourseRow[];
}

interface EditFormValues {
  availabilityMode: AvailabilityMode;
  startDate: string;
  endDate: string;
  enrollmentOpen: boolean;
}

const MODE_META: Record<
  AvailabilityMode,
  { label: string; icon: typeof InfinityIcon; hint: string }
> = {
  ALWAYS: {
    label: "Always Available",
    icon: InfinityIcon,
    hint: "Course is available to students at any time.",
  },
  SCHEDULED: {
    label: "Scheduled",
    icon: CalendarRange,
    hint: "Course is only available between start and end dates.",
  },
  LIMITED: {
    label: "Limited Enrollment",
    icon: Lock,
    hint: "Enrollment closes after the end date; existing students keep access.",
  },
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function UniversityScheduling() {
  const { t } = useI18n();
  const navigate = useAppStore((s) => s.navigate);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<"ALL" | AvailabilityMode>("ALL");
  const [editTarget, setEditTarget] = useState<CourseRow | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (modeFilter !== "ALL") p.set("mode", modeFilter);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [search, modeFilter]);

  // Always fetch full list (no published filter) — we want all scheduling data
  const { data, loading, error, refetch } = useApiFetch<CoursesResponse>(
    qs ? `/api/university/courses${qs}` : "/api/university/courses"
  );
  const courses = data?.courses || [];

  // Stats
  const stats = useMemo(() => {
    const total = courses.length;
    const always = courses.filter(
      (c) => c.availabilityMode === "ALWAYS"
    ).length;
    const scheduled = courses.filter(
      (c) => c.availabilityMode === "SCHEDULED"
    ).length;
    const limited = courses.filter(
      (c) => c.availabilityMode === "LIMITED"
    ).length;
    const openEnrollment = courses.filter((c) => c.enrollmentOpen).length;
    return { total, always, scheduled, limited, openEnrollment };
  }, [courses]);

  // Build a list of upcoming / active scheduled courses for the "calendar" view
  const now = new Date();
  const upcomingCourses = useMemo(() => {
    return courses
      .filter(
        (c) =>
          c.availabilityMode !== "ALWAYS" &&
          (c.startDate || c.endDate)
      )
      .map((c) => ({
        ...c,
        start: c.startDate ? new Date(c.startDate) : null,
        end: c.endDate ? new Date(c.endDate) : null,
        status:
          c.start && c.start > now
            ? "upcoming"
            : c.end && c.end < now
              ? "ended"
              : "active",
      }))
      .sort((a, b) => {
        const aT = a.start?.getTime() || a.end?.getTime() || 0;
        const bT = b.start?.getTime() || b.end?.getTime() || 0;
        return aT - bT;
      });
  }, [courses]);

  return (
    <div className="space-y-4">
      {/* Stat strip */}
      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<BookOpen className="h-4 w-4" />}
            value={stats.total}
            label="Total courses"
          />
          <StatCard
            icon={<InfinityIcon className="h-4 w-4" />}
            value={stats.always}
            label="Always available"
          />
          <StatCard
            icon={<CalendarRange className="h-4 w-4" />}
            value={stats.scheduled + stats.limited}
            label="Time-boxed"
          />
          <StatCard
            icon={<Unlock className="h-4 w-4" />}
            value={stats.openEnrollment}
            label="Enrollment open"
          />
        </div>
      )}

      {/* Calendar-style upcoming panel */}
      {!loading && !error && upcomingCourses.length > 0 && (
        <Card className="rounded-lg border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Upcoming &amp; Active Schedules
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingCourses.slice(0, 6).map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:border-accent/40 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground truncate flex-1">
                    {c.title}
                  </p>
                  <ScheduleStatusBadge status={c.status as ScheduleStatus} />
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  {c.start && (
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" />
                      Start: {formatDate(c.start)}
                    </p>
                  )}
                  {c.end && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      End: {formatDate(c.end)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter card */}
      <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses by title…"
                className="h-9 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("common.search")}
              />
            </div>
            <Select
              value={modeFilter}
              onValueChange={(v) =>
                setModeFilter(v as "ALL" | AvailabilityMode)
              }
            >
              <SelectTrigger
                className="h-9 w-full rounded-lg sm:w-[180px]"
                aria-label="Filter by availability"
              >
                <SelectValue placeholder="All availability modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All modes</SelectItem>
                <SelectItem value="ALWAYS">Always available</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="LIMITED">Limited enrollment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Course list */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-lg border-border p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-8 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          className="m-4"
          icon={<CalendarDays className="h-5 w-5" />}
          title="Couldn't load schedule"
          description={error}
        />
      ) : courses.length === 0 ? (
        <EmptyState
          className="m-4"
          icon={<CalendarDays className="h-5 w-5" />}
          title="No courses to schedule"
          description="Create a course first, then come back to configure its availability and enrollment windows."
          action={
            <Button
              className="gap-2"
              onClick={() => navigate(["university", "courses"])}
            >
              <BookOpen className="h-4 w-4" /> Go to Courses
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map((c) => (
            <CourseScheduleCard
              key={c.id}
              course={c}
              onEdit={() => setEditTarget(c)}
              onManage={() => navigate(["university", "courses", c.id])}
            />
          ))}
        </div>
      )}

      <ScheduleEditDialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        target={editTarget}
        onSaved={() => {
          setEditTarget(null);
          refetch();
          toast({ title: "Schedule updated" });
        }}
      />
    </div>
  );
}

type ScheduleStatus = "upcoming" | "active" | "ended" | "always";

function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  if (status === "always")
    return (
      <Badge
        variant="outline"
        className="bg-soft-sage/40 text-primary text-[10px]"
      >
        Always
      </Badge>
    );
  if (status === "upcoming")
    return (
      <Badge
        variant="outline"
        className="bg-accent/15 text-accent text-[10px] gap-1"
      >
        <CalendarClock className="h-3 w-3" /> Upcoming
      </Badge>
    );
  if (status === "active")
    return (
      <Badge className="border-0 bg-success/95 text-success-foreground text-[10px] gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-success-foreground animate-pulse" />
        Active
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground text-[10px] gap-1"
    >
      <Clock className="h-3 w-3" /> Ended
    </Badge>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-soft-sage text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xl font-heading font-semibold text-foreground">
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Schedule Card ────────────────────────────────────────────────────────
function CourseScheduleCard({
  course,
  onEdit,
  onManage,
}: {
  course: CourseRow;
  onEdit: () => void;
  onManage: () => void;
}) {
  const mode = MODE_META[course.availabilityMode];
  const ModeIcon = mode.icon;
  const start = course.startDate ? new Date(course.startDate) : null;
  const end = course.endDate ? new Date(course.endDate) : null;
  const now = new Date();

  let status: ScheduleStatus = "always";
  if (course.availabilityMode !== "ALWAYS") {
    if (start && start > now) status = "upcoming";
    else if (end && end < now) status = "ended";
    else status = "active";
  }

  return (
    <Card className="group flex flex-col rounded-lg border-border bg-card p-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/40 overflow-hidden">
      {/* Header strip */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border flex items-center justify-center">
          <CourseThumbnail
            thumbnail={course.thumbnail}
            firstVideoUrl={course.firstVideoUrl}
            firstVideoSource={course.firstVideoSource}
            alt={course.title}
            className="h-full w-full"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold text-foreground line-clamp-1">
            {course.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {course.level && (
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground"
              >
                {LEVEL_LABEL[course.level] || course.level}
              </Badge>
            )}
            <ScheduleStatusBadge status={status} />
            {course.isPublished ? null : (
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground"
              >
                Draft
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              aria-label="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit schedule
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManage} className="gap-2">
              <BookOpen className="h-4 w-4" /> Open course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mode + dates */}
      <div className="space-y-2 px-4 pb-4">
        <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <ModeIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {mode.label}
            </p>
            <p className="text-[11px] text-muted-foreground">{mode.hint}</p>
          </div>
        </div>

        {(start || end) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Start
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">
                {start ? formatDate(start) : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                End
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">
                {end ? formatDate(end) : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Enrollment */}
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <div className="flex items-center gap-2">
            {course.enrollmentOpen ? (
              <Unlock className="h-3.5 w-3.5 text-success" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-foreground">
              Enrollment {course.enrollmentOpen ? "Open" : "Closed"}
            </span>
          </div>
          <Badge
            variant="outline"
            className={
              course.enrollmentOpen
                ? "border-success/40 bg-success/10 text-success text-[10px]"
                : "text-muted-foreground text-[10px]"
            }
          >
            {course.enrollmentOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-2 border-t border-border p-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1 gap-1.5"
          onClick={onManage}
        >
          <BookOpen className="h-3.5 w-3.5" /> Manage
        </Button>
        <Button
          size="sm"
          className="h-8 flex-1 gap-1.5"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" /> Edit Schedule
        </Button>
      </div>
    </Card>
  );
}

// ─── Schedule Edit Dialog ─────────────────────────────────────────────────
function ScheduleEditDialog({
  open,
  onOpenChange,
  target,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: CourseRow | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<EditFormValues>({
    availabilityMode: "ALWAYS",
    startDate: "",
    endDate: "",
    enrollmentOpen: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      const toLocalDate = (iso: string | null) => {
        if (!iso) return "";
        const d = new Date(iso);
        // Format as yyyy-MM-dd for input[type=date]
        const off = d.getTimezoneOffset();
        const local = new Date(d.getTime() - off * 60 * 1000);
        return local.toISOString().slice(0, 10);
      };
      setValues({
        availabilityMode: target.availabilityMode,
        startDate: toLocalDate(target.startDate),
        endDate: toLocalDate(target.endDate),
        enrollmentOpen: target.enrollmentOpen,
      });
    }
  }, [target]);

  async function submit() {
    if (!target) return;
    if (
      values.availabilityMode !== "ALWAYS" &&
      values.startDate &&
      values.endDate &&
      new Date(values.endDate) < new Date(values.startDate)
    ) {
      toast({
        title: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }
    if (
      values.availabilityMode === "SCHEDULED" &&
      (!values.startDate || !values.endDate)
    ) {
      toast({
        title: "Scheduled mode needs both dates",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await apiPost(
        `/api/university/courses/${target.id}`,
        {
          availabilityMode: values.availabilityMode,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          enrollmentOpen: values.enrollmentOpen,
        },
        { method: "PUT" }
      );
      onSaved();
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  }

  const ModeIcon = MODE_META[values.availabilityMode].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Edit Schedule
          </DialogTitle>
          <DialogDescription className="truncate">
            {target?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Availability Mode */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Availability mode
            </Label>
            <Select
              value={values.availabilityMode}
              onValueChange={(v) =>
                setValues({
                  ...values,
                  availabilityMode: v as AvailabilityMode,
                })
              }
            >
              <SelectTrigger className="w-full h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MODE_META) as AvailabilityMode[]).map((m) => {
                  const MIcon = MODE_META[m].icon;
                  return (
                    <SelectItem key={m} value={m}>
                      <span className="flex items-center gap-2">
                        <MIcon className="h-3.5 w-3.5" />
                        {MODE_META[m].label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {MODE_META[values.availabilityMode].hint}
            </p>
          </div>

          {/* Dates */}
          {values.availabilityMode !== "ALWAYS" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="sch-start"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Start date
                </Label>
                <Input
                  id="sch-start"
                  type="date"
                  value={values.startDate}
                  onChange={(e) =>
                    setValues({ ...values, startDate: e.target.value })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="sch-end"
                  className="text-xs font-medium text-muted-foreground"
                >
                  End date
                </Label>
                <Input
                  id="sch-end"
                  type="date"
                  value={values.endDate}
                  onChange={(e) =>
                    setValues({ ...values, endDate: e.target.value })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Enrollment toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <ModeIcon className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <Label
                  htmlFor="sch-enroll"
                  className="text-sm font-medium text-foreground"
                >
                  Enrollment open
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When off, new students cannot enroll.
                </p>
              </div>
            </div>
            <Switch
              id="sch-enroll"
              checked={values.enrollmentOpen}
              onCheckedChange={(v) =>
                setValues({ ...values, enrollmentOpen: v })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="h-9"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={saving} className="h-9" onClick={submit}>
            {saving ? "Saving…" : "Save Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { useI18n } from "@/lib/i18n/store";
import { formatDate, formatDateTime } from "@/types";
import {
  Search, Users, BookOpen, Award, ClipboardList, Inbox, FileText,
  TrendingUp, CheckCircle2, Clock, GraduationCap, X,
} from "lucide-react";

// ---- API response types ---------------------------------------------------

interface CourseListItem {
  id: string;
  title: string;
  isPublished: boolean;
}

interface StudentEnrolledCourse {
  id: string;
  title: string;
  completedVideos: number;
  totalVideos: number;
  completionPct: number;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  createdAt: string;
  enrolledCourseCount: number;
  completedCourseCount: number;
  avgCompletionPct: number;
  status: "Completed" | "In Progress" | "Just Started";
  active: boolean;
  lastActivity: string;
  enrolledCourses: StudentEnrolledCourse[];
}

interface StudentProfile {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    bio: string | null;
    profilePhoto: string | null;
    createdAt: string;
  };
  stats: {
    enrolledCourseCount: number;
    completedCourseCount: number;
    avgCompletionPct: number;
    assessmentCount: number;
    avgAssessmentScore: number;
    passedAssessmentCount: number;
    submissionCount: number;
    certificateCount: number;
  };
  enrolledCourses: {
    id: string;
    title: string;
    totalVideos: number;
    completedVideos: number;
    completionPct: number;
    lastActivity: string;
  }[];
  assessments: {
    id: string;
    videoId: string;
    videoTitle: string;
    courseId: string;
    courseTitle: string;
    score: number;
    passed: boolean;
    attempts: number;
    updatedAt: string;
  }[];
  submissions: {
    id: string;
    fileUrl: string;
    submittedAt: string;
    status: "SUBMITTED" | "REVIEWED";
    reviewNotes: string | null;
    reviewedAt: string | null;
    assignmentId: string;
    assignmentTitle: string;
    courseId: string;
    courseTitle: string;
  }[];
  certificates: {
    id: string;
    certificateNumber: string;
    templateTitle: string;
    organizationName: string;
    issuedAt: string;
    courseId: string;
    courseTitle: string;
  }[];
}

// ---- Component ------------------------------------------------------------

export function UniversityStudents() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [viewId, setViewId] = useState<string | null>(null);

  const { data: coursesData } = useApiFetch<{ courses: CourseListItem[] }>(
    "/api/university/courses"
  );

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (courseFilter !== "ALL") p.set("courseId", courseFilter);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [search, courseFilter]);

  const { data, loading, error } = useApiFetch<{ students: StudentRow[] }>(
    qs ? `/api/university/students${qs}` : "/api/university/students"
  );

  const students = data?.students || [];
  const activeCount = students.filter((s) => s.active).length;

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
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              Student Directory
            </p>
            <h2 className="font-heading mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Enrolled Students
            </h2>
            <p className="mt-1 text-sm text-primary-foreground/75 max-w-md">
              Track every learner who has interacted with your courses — their progress,
              assessments, submissions and certificates in one place.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-heading text-2xl font-bold">{students.length}</p>
              <p className="text-[11px] uppercase tracking-wider text-primary-foreground/70">Total</p>
            </div>
            <div className="h-10 w-px bg-primary-foreground/20" />
            <div className="text-right">
              <p className="font-heading text-2xl font-bold flex items-center gap-1.5 justify-end">
                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                {activeCount}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-primary-foreground/70">Active (7d)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or email…"
              className="h-9 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("common.search")}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-9 w-full rounded-lg md:w-[220px]" aria-label={t("common.course")}>
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("common.all")}</SelectItem>
              {(coursesData?.courses || []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="rounded-lg border-border bg-card p-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            className="m-4"
            icon={<Users className="h-5 w-5" />}
            title={t("common.error")}
            description={error}
          />
        ) : students.length === 0 ? (
          <EmptyState
            className="m-4"
            icon={<Users className="h-5 w-5" />}
            title={search || courseFilter !== "ALL" ? "No matching students" : "No students yet"}
            description={
              search || courseFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "Students who watch your course videos will appear here automatically."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Courses</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Avg Progress</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Last Activity</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-soft-sage/40 transition-colors"
                  onClick={() => setViewId(s.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0 max-w-[260px]">
                      <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
                        {s.profilePhoto ? (
                          <AvatarImage src={s.profilePhoto} alt={s.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                          {s.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate flex items-center gap-1.5">
                          {s.name}
                          {s.active && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" title="Active in last 7 days" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{s.enrolledCourseCount}</span>
                      <span className="text-muted-foreground text-xs">
                        ({s.completedCourseCount} done)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={s.avgCompletionPct} className="h-1.5" />
                      <span className="text-xs font-medium text-foreground tabular-nums">
                        {s.avgCompletionPct}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} active={s.active} />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {formatDateTime(s.lastActivity)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewId(s.id);
                      }}
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Profile Dialog */}
      <StudentProfileDialog
        studentId={viewId}
        onOpenChange={(open) => !open && setViewId(null)}
      />
    </div>
  );
}

// ---- Sub-components -------------------------------------------------------

function StatusBadge({
  status,
  active,
}: {
  status: "Completed" | "In Progress" | "Just Started";
  active: boolean;
}) {
  if (status === "Completed") {
    return (
      <Badge className="bg-success/15 text-success gap-1">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </Badge>
    );
  }
  if (status === "In Progress") {
    return (
      <Badge className="bg-accent/15 text-accent gap-1">
        <Clock className="h-3 w-3" /> In Progress
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning/15 text-warning gap-1">
      <TrendingUp className="h-3 w-3" /> {active ? "Started" : "Just Started"}
    </Badge>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "primary" | "accent" | "success" | "warning";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${tones[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold text-foreground leading-none">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StudentProfileDialog({
  studentId,
  onOpenChange,
}: {
  studentId: string | null;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const { data, loading, error } = useApiFetch<StudentProfile>(
    studentId ? `/api/university/students/${studentId}` : null,
    { skip: !studentId }
  );

  const open = !!studentId;
  const p = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Student Profile
          </DialogTitle>
          <DialogDescription>
            {p ? p.student.name : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 px-1">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="Couldn't load profile"
            description={error}
          />
        ) : p ? (
          <div className="flex flex-col overflow-hidden">
            {/* Student header */}
            <div className="rounded-lg border border-border bg-soft-sage/30 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 ring-1 ring-border">
                  {p.student.profilePhoto ? (
                    <AvatarImage src={p.student.profilePhoto} alt={p.student.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {p.student.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-base font-semibold text-foreground">{p.student.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{p.student.email}</p>
                  {p.student.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{p.student.phone}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Joined {formatDate(p.student.createdAt)}
                  </p>
                </div>
              </div>
              {p.student.bio && (
                <p className="text-sm text-foreground/80 mt-3 leading-relaxed border-l-2 border-accent/30 pl-3">
                  {p.student.bio}
                </p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <StatTile icon={<BookOpen className="h-4 w-4" />} label="Enrolled" value={p.stats.enrolledCourseCount} />
              <StatTile icon={<Award className="h-4 w-4" />} label="Completed" value={p.stats.completedCourseCount} tone="success" />
              <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Avg Progress" value={`${p.stats.avgCompletionPct}%`} tone="accent" />
              <StatTile icon={<ClipboardList className="h-4 w-4" />} label="Assessments" value={p.stats.assessmentCount} tone="warning" />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="courses" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="self-start">
                <TabsTrigger value="courses" className="gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Courses
                </TabsTrigger>
                <TabsTrigger value="assessments" className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Assessments
                </TabsTrigger>
                <TabsTrigger value="submissions" className="gap-1.5">
                  <Inbox className="h-3.5 w-3.5" /> Submissions
                </TabsTrigger>
                <TabsTrigger value="certificates" className="gap-1.5">
                  <Award className="h-3.5 w-3.5" /> Certificates
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-3 pr-1 scrollbar-thin">
                <TabsContent value="courses">
                  <CourseProgressList courses={p.enrolledCourses} />
                </TabsContent>
                <TabsContent value="assessments">
                  <AssessmentList assessments={p.assessments} avgScore={p.stats.avgAssessmentScore} passedCount={p.stats.passedAssessmentCount} />
                </TabsContent>
                <TabsContent value="submissions">
                  <SubmissionList submissions={p.submissions} />
                </TabsContent>
                <TabsContent value="certificates">
                  <CertificateList certificates={p.certificates} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CourseProgressList({
  courses,
}: {
  courses: StudentProfile["enrolledCourses"];
}) {
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-5 w-5" />}
        title="No enrolled courses"
        description="This student hasn't started any of your courses yet."
      />
    );
  }
  return (
    <div className="space-y-2">
      {courses.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border border-border bg-card p-3 hover:border-accent/30 transition-colors"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground text-sm truncate">{c.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {c.completedVideos} / {c.totalVideos} videos · last activity {formatDateTime(c.lastActivity)}
              </p>
            </div>
            <Badge
              className={
                c.completionPct >= 100
                  ? "bg-success/15 text-success"
                  : c.completionPct > 0
                    ? "bg-accent/15 text-accent"
                    : "bg-muted text-muted-foreground"
              }
            >
              {c.completionPct}%
            </Badge>
          </div>
          <Progress value={c.completionPct} className="h-1.5" />
        </div>
      ))}
    </div>
  );
}

function AssessmentList({
  assessments,
  avgScore,
  passedCount,
}: {
  assessments: StudentProfile["assessments"];
  avgScore: number;
  passedCount: number;
}) {
  if (assessments.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-5 w-5" />}
        title="No assessment attempts"
        description="This student hasn't completed any video assessments in your courses."
      />
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <StatTile icon={<ClipboardList className="h-4 w-4" />} label="Attempts" value={assessments.length} />
        <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Avg Score" value={`${avgScore}%`} tone="accent" />
        <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Passed" value={passedCount} tone="success" />
      </div>
      <div className="space-y-2">
        {assessments.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{a.videoTitle}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {a.courseTitle} · {a.attempts > 1 ? `${a.attempts} attempts` : "1 attempt"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-heading text-lg font-bold tabular-nums text-foreground">
                  {a.score}%
                </span>
                {a.passed ? (
                  <Badge className="bg-success/15 text-success gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Pass
                  </Badge>
                ) : (
                  <Badge className="bg-warning/15 text-warning gap-1">
                    <X className="h-3 w-3" /> Fail
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Last attempt {formatDateTime(a.updatedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionList({
  submissions,
}: {
  submissions: StudentProfile["submissions"];
}) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-5 w-5" />}
        title="No submissions"
        description="This student hasn't submitted any assignments in your courses."
      />
    );
  }
  return (
    <div className="space-y-2">
      {submissions.map((s) => (
        <div key={s.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground text-sm truncate">{s.assignmentTitle}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{s.courseTitle}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Submitted {formatDateTime(s.submittedAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {s.status === "REVIEWED" ? (
                <Badge className="bg-accent/15 text-accent gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Reviewed
                </Badge>
              ) : (
                <Badge className="bg-warning/15 text-warning gap-1">
                  <Clock className="h-3 w-3" /> Submitted
                </Badge>
              )}
              <a
                href={s.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-accent hover:underline inline-flex items-center gap-1"
              >
                <FileText className="h-3 w-3" /> Open
              </a>
            </div>
          </div>
          {s.reviewNotes && (
            <>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground italic border-l-2 border-accent/30 pl-2">
                {s.reviewNotes}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function CertificateList({
  certificates,
}: {
  certificates: StudentProfile["certificates"];
}) {
  if (certificates.length === 0) {
    return (
      <EmptyState
        icon={<Award className="h-5 w-5" />}
        title="No certificates"
        description="This student hasn't earned any certificates from your courses yet."
      />
    );
  }
  return (
    <div className="space-y-2">
      {certificates.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border border-border bg-gradient-to-br from-soft-sage/40 to-card p-3"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-success/15 text-success shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground text-sm truncate">{c.templateTitle}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {c.courseTitle}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Issued {formatDate(c.issuedAt)} · #{c.certificateNumber}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch, apiPost } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n/store";
import { toast } from "@/hooks/use-toast";
import { formatDateTime } from "@/types";
import {
  Inbox, Search, MoreHorizontal, Eye, Download, CheckCircle2, ExternalLink,
} from "lucide-react";

interface CourseListItem {
  id: string;
  title: string;
  isPublished: boolean;
}

interface SubmissionRow {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  fileUrl: string;
  submittedAt: string;
  status: "SUBMITTED" | "REVIEWED";
  reviewNotes: string | null;
  reviewedAt: string | null;
}

interface SubmissionDetail {
  id: string;
  fileUrl: string;
  submittedAt: string;
  status: "SUBMITTED" | "REVIEWED";
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
  };
  assignment: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    fileUrl: string | null;
    dueDate: string | null;
    course: { id: string; title: string };
  };
}

export function UniversitySubmissions() {
  const { t } = useI18n();
  const navigate = useAppStore((s) => s.navigate);
  const query = useAppStore((s) => s.query);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUBMITTED" | "REVIEWED">("ALL");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState<string>(
    query.assignmentId || "ALL"
  );
  const [viewId, setViewId] = useState<string | null>(null);

  const { data: coursesData } = useApiFetch<{ courses: CourseListItem[] }>(
    "/api/university/courses"
  );

  // Auto-apply assignmentId filter from URL — React 19 "store previous value" pattern
  const [lastAssignmentId, setLastAssignmentId] = useState<string | undefined>(undefined);
  if (query.assignmentId !== lastAssignmentId) {
    setLastAssignmentId(query.assignmentId);
    if (query.assignmentId) setAssignmentFilter(query.assignmentId);
  }

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (statusFilter !== "ALL") p.set("status", statusFilter);
    if (courseFilter !== "ALL") p.set("courseId", courseFilter);
    if (assignmentFilter !== "ALL") p.set("assignmentId", assignmentFilter);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [search, statusFilter, courseFilter, assignmentFilter]);

  const { data, loading, error, refetch } = useApiFetch<{ submissions: SubmissionRow[] }>(
    qs ? `/api/university/submissions${qs}` : "/api/university/submissions"
  );

  const submissions = data?.submissions || [];

  function clearAssignmentFilter() {
    setAssignmentFilter("ALL");
    navigate(["university", "submissions"]);
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student, assignment or course…"
                className="h-9 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("common.search")}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "ALL" | "SUBMITTED" | "REVIEWED")}
            >
              <SelectTrigger className="h-9 w-full rounded-lg sm:w-[140px]" aria-label={t("common.status")}>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-9 w-full rounded-lg sm:w-[180px]" aria-label={t("common.course")}>
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
        </div>
        {assignmentFilter !== "ALL" && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-warning/15 text-warning">
              Filtered by assignment
            </Badge>
            <button className="text-accent hover:underline" onClick={clearAssignmentFilter}>
              Clear filter
            </button>
          </div>
        )}
      </Card>

      <Card className="rounded-lg border-border bg-card p-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState className="m-4" icon={<Inbox className="h-5 w-5" />} title={t("common.error")} description={error} />
        ) : submissions.length === 0 ? (
          <EmptyState
            className="m-4"
            icon={<Inbox className="h-5 w-5" />}
            title={t("empty.noData")}
            description="Student assignment submissions for your courses will appear here once they start submitting."
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
<Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Course</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignment</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Submitted</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0 max-w-[200px]">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0 ring-1 ring-border">
                        {s.studentName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{s.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.studentEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-foreground md:table-cell">{s.courseTitle}</TableCell>
                  <TableCell className="text-sm text-foreground">{s.assignmentTitle}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatDateTime(s.submittedAt)}
                  </TableCell>
                  <TableCell>
                    {s.status === "REVIEWED" ? (
                      <Badge className="bg-accent/15 text-accent">Reviewed</Badge>
                    ) : (
                      <Badge className="bg-warning/15 text-warning">Submitted</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={s.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                        aria-label="Download submission"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${s.studentName}'s submission`} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setViewId(s.id)} className="gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" /> View details
                          </DropdownMenuItem>
                          {s.status === "SUBMITTED" && (
                            <DropdownMenuItem onClick={() => setViewId(s.id)} className="gap-2">
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Mark as reviewed
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
</div>
        )}
      </Card>

      <SubmissionDetailDialog
        submissionId={viewId}
        onOpenChange={(open) => !open && setViewId(null)}
        onReviewed={() => refetch()}
      />
    </div>
  );
}

function SubmissionDetailDialog({
  submissionId,
  onOpenChange,
  onReviewed,
}: {
  submissionId: string | null;
  onOpenChange: (v: boolean) => void;
  onReviewed: () => void;
}) {
  const { t } = useI18n();
  const { data, loading, error } = useApiFetch<{ submission: SubmissionDetail }>(
    submissionId ? `/api/university/submissions/${submissionId}` : null,
    { skip: !submissionId }
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [status, setStatus] = useState<"SUBMITTED" | "REVIEWED">("SUBMITTED");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setReviewNotes(data.submission.reviewNotes || "");
      setStatus(data.submission.status);
    }
  }, [data]);

  async function submitReview() {
    if (!submissionId || !data) return;
    setSaving(true);
    try {
      await apiPost(
        `/api/university/submissions/${submissionId}/review`,
        {
          status,
          reviewNotes: reviewNotes.trim() || null,
        },
        { method: "PATCH" }
      );
      toast({
        title: "Review saved",
        description:
          status === "REVIEWED"
            ? "Submission marked as reviewed."
            : "Submission updated.",
      });
      onReviewed();
      onOpenChange(false);
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  }

  const open = !!submissionId;
  const s = data?.submission;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Submission Details
          </DialogTitle>
          <DialogDescription>
            {s ? `${s.student.name} — ${s.assignment.title}` : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="Couldn't load submission" description={error} />
        ) : s ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
            {/* Student info */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Student
              </h4>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                  {s.student.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="grid flex-1 grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground mt-0.5">{s.student.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground mt-0.5 truncate">{s.student.email}</p>
                  </div>
                  {s.student.phone && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground mt-0.5">{s.student.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Joined</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {formatDateTime(s.student.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment info */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Assignment
              </h4>
              <div className="space-y-1.5 text-sm">
                <p className="font-medium text-foreground">{s.assignment.title}</p>
                <p className="text-xs text-muted-foreground">Course: {s.assignment.course.title}</p>
                {s.assignment.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    Due: {formatDateTime(s.assignment.dueDate)}
                  </p>
                )}
                {s.assignment.description && (
                  <p className="text-foreground mt-2">{s.assignment.description}</p>
                )}
                {s.assignment.instructions && (
                  <div className="mt-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground border-l-2 border-accent/30">
                    {s.assignment.instructions}
                  </div>
                )}
                {s.assignment.fileUrl && (
                  <a
                    href={s.assignment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline mt-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" /> Assignment brief
                  </a>
                )}
              </div>
            </div>

            {/* Submission file */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-sm font-semibold text-foreground">Submitted Work</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submitted {formatDateTime(s.submittedAt)}
                  </p>
                  {s.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed {formatDateTime(s.reviewedAt)}
                    </p>
                  )}
                </div>
                <Badge
                  className={
                    s.status === "REVIEWED"
                      ? "bg-accent/15 text-accent"
                      : "bg-warning/15 text-warning"
                  }
                >
                  {s.status}
                </Badge>
              </div>
              <Separator className="my-3" />
              <a
                href={s.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4 text-accent" /> Download submission
              </a>
            </div>

            {/* Review form */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-3">
              <h4 className="font-heading text-sm font-semibold text-foreground">Review</h4>
              <div className="space-y-1.5">
                <Label htmlFor="sub-status" className="text-xs font-medium text-muted-foreground">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as "SUBMITTED" | "REVIEWED")}
                >
                  <SelectTrigger id="sub-status" className="w-full h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUBMITTED">Submitted — pending review</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-notes" className="text-xs font-medium text-muted-foreground">
                  Review Notes (internal)
                </Label>
                <Textarea
                  id="sub-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes about this submission…"
                  className="rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-border">
                <Button variant="outline" className="h-9 mt-3" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button disabled={saving} className="h-9 mt-3" onClick={submitReview}>
                  {saving ? "Saving…" : "Save Review"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

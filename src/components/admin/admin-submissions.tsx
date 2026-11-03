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
import { toast } from "@/hooks/use-toast";
import { formatDateTime } from "@/types";
import {
  Inbox, Search, MoreHorizontal, Eye, Download, CheckCircle2, ExternalLink,
} from "lucide-react";

interface CourseListItem { id: string; title: string; isPublished: boolean; }

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

export function AdminSubmissions() {
  const query = useAppStore((s) => s.query);
  const navigate = useAppStore((s) => s.navigate);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUBMITTED" | "REVIEWED">("ALL");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState<string>(query.assignmentId || "ALL");
  const [viewId, setViewId] = useState<string | null>(null);

  const { data: coursesData } = useApiFetch<{ courses: CourseListItem[] }>("/api/admin/courses");

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
    qs ? `/api/admin/submissions${qs}` : "/api/admin/submissions"
  );

  const submissions = data?.submissions || [];

  function clearAssignmentFilter() {
    setAssignmentFilter("ALL");
    // Also clear the URL query
    navigate(["admin", "submissions"]);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student, assignment or course…"
                className="pl-9"
                aria-label="Search submissions"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | "SUBMITTED" | "REVIEWED")}>
              <SelectTrigger className="w-full sm:w-[140px]" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by course">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All courses</SelectItem>
                {(coursesData?.courses || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {assignmentFilter !== "ALL" && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-warning/15 text-warning">Filtered by assignment</Badge>
            <button className="text-accent hover:underline" onClick={clearAssignmentFilter}>
              Clear filter
            </button>
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState className="m-4" icon={<Inbox className="h-5 w-5" />} title="Couldn't load submissions" description={error} />
        ) : submissions.length === 0 ? (
          <EmptyState
            className="m-4"
            icon={<Inbox className="h-5 w-5" />}
            title="No submissions yet"
            description="Student assignment submissions will appear here once they start submitting."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Course</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="min-w-0 max-w-[200px]">
                      <p className="font-medium text-foreground truncate">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.studentEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-foreground">{s.courseTitle}</TableCell>
                  <TableCell className="text-sm text-foreground">{s.assignmentTitle}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-accent"
                        aria-label="Download submission"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${s.studentName}'s submission`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewId(s.id)}>
                            <Eye className="h-4 w-4" /> View details
                          </DropdownMenuItem>
                          {s.status === "SUBMITTED" && (
                            <DropdownMenuItem onClick={() => setViewId(s.id)}>
                              <CheckCircle2 className="h-4 w-4" /> Mark as reviewed
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
  submissionId, onOpenChange, onReviewed,
}: {
  submissionId: string | null;
  onOpenChange: (v: boolean) => void;
  onReviewed: () => void;
}) {
  const { data, loading, error } = useApiFetch<{ submission: SubmissionDetail }>(
    submissionId ? `/api/admin/submissions/${submissionId}` : null,
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
      await apiPost(`/api/admin/submissions/${submissionId}/review`, {
        status,
        reviewNotes: reviewNotes.trim() || null,
      }, { method: "PATCH" });
      toast({ title: "Review saved", description: status === "REVIEWED" ? "Submission marked as reviewed." : "Submission updated." });
      onReviewed();
      onOpenChange(false);
    } catch { /* toast */ } finally {
      setSaving(false);
    }
  }

  const open = !!submissionId;
  const s = data?.submission;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
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
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Student info */}
            <div className="rounded-lg border border-border bg-card p-3">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-2">Student</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{s.student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground truncate">{s.student.email}</p>
                </div>
                {s.student.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{s.student.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium text-foreground">{formatDateTime(s.student.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Assignment info */}
            <div className="rounded-lg border border-border bg-card p-3">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-2">Assignment</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">{s.assignment.title}</p>
                <p className="text-xs text-muted-foreground">Course: {s.assignment.course.title}</p>
                {s.assignment.dueDate && (
                  <p className="text-xs text-muted-foreground">Due: {formatDateTime(s.assignment.dueDate)}</p>
                )}
                {s.assignment.description && (
                  <p className="text-foreground mt-2">{s.assignment.description}</p>
                )}
                {s.assignment.instructions && (
                  <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
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
            <div className="rounded-lg border border-border bg-card p-3">
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
                <Badge className={
                  s.status === "REVIEWED"
                    ? "bg-accent/15 text-accent"
                    : "bg-warning/15 text-warning"
                }>
                  {s.status}
                </Badge>
              </div>
              <Separator className="my-2" />
              <a
                href={s.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4 text-accent" /> Download submission
              </a>
            </div>

            {/* Review form */}
            <div className="rounded-lg border border-border bg-card p-3 space-y-3">
              <h4 className="font-heading text-sm font-semibold text-foreground">Review</h4>
              <div className="space-y-1.5">
                <Label htmlFor="sub-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "SUBMITTED" | "REVIEWED")}>
                  <SelectTrigger id="sub-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUBMITTED">Submitted — pending review</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-notes">Review Notes (visible to admin)</Label>
                <Textarea
                  id="sub-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes about this submission…"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button disabled={saving} onClick={submitReview}>
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

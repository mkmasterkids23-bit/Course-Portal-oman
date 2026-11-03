"use client";

import { useRef, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";
import { useApiFetch, apiUpload } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import {
  ClipboardList, Lock, Download, Upload, ChevronDown, CheckCircle2,
  Clock, AlertTriangle, Award, FileText, BookOpen,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/types";

interface AssignmentItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string | null;
  instructions: string | null;
  fileUrl: string | null;
  dueDate: string | null;
  isPublished: boolean;
  allowResubmission: boolean;
  submission: {
    id: string;
    fileUrl: string;
    submittedAt: string;
    status: "SUBMITTED" | "REVIEWED";
    reviewNotes: string | null;
    reviewedAt: string | null;
  } | null;
  unlocked: boolean;
  lockedReason: string | null;
  courseCompletion: {
    percent: number;
    completedVideos: number;
    totalVideos: number;
    allCompleted: boolean;
  };
}

interface AssignmentsData {
  assignments: AssignmentItem[];
  subscription: {
    status: "ACTIVE" | "EXPIRED";
    planName: string;
  } | null;
}

export function StudentAssignments() {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading, error, refetch } = useApiFetch<AssignmentsData>(
    "/api/student/assignments"
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-5 w-5" />}
        title="Couldn't load assignments"
        description={error}
        action={<Button onClick={() => window.location.reload()}>Reload</Button>}
      />
    );
  }

  const assignments = data?.assignments || [];
  const isExpired = data?.subscription?.status === "EXPIRED";

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-5 w-5" />}
        title="No assignments yet"
        description="Assignments will appear here once you have access to a course with a published assignment."
        action={<Button onClick={() => navigate(["student", "courses"])} className="gap-2">
          Browse Courses <BookOpen className="h-4 w-4" />
        </Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {isExpired && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Subscription expired</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  All assignments are locked until you renew your subscription.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(["student", "subscription"])} className="shrink-0">
              Renew Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {assignments.map((a) => (
        <AssignmentCard key={a.id} assignment={a} onSubmitted={refetch} />
      ))}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onSubmitted,
}: {
  assignment: AssignmentItem;
  onSubmitted: () => void;
}) {
  const navigate = useAppStore((s) => s.navigate);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = assignment.submission
    ? assignment.submission.status === "REVIEWED"
      ? "Reviewed"
      : "Submitted"
    : assignment.unlocked
      ? "Available"
      : "Locked";

  const statusBadge = (() => {
    if (assignment.submission) {
      return assignment.submission.status === "REVIEWED"
        ? <Badge className="bg-accent/10 text-accent border-transparent"><CheckCircle2 className="h-3 w-3" /> Reviewed</Badge>
        : <Badge className="bg-success/15 text-success border-transparent"><CheckCircle2 className="h-3 w-3" /> Submitted</Badge>;
    }
    if (assignment.unlocked) {
      return <Badge className="bg-primary text-primary-foreground">Available</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground"><Lock className="h-3 w-3" /> Locked</Badge>;
  })();

  async function handleSubmit() {
    if (!selectedFile) {
      toast({ title: "Select a file", description: "Please choose a file to upload.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const res = await apiUpload<{
        certificateIssued: boolean;
        certificateId?: string;
      }>(`/api/student/assignments/${assignment.id}/submit`, fd);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSubmitted();
      if (res.certificateIssued) {
        toast({
          title: "Submitted & certificate issued!",
          description: "Your submission was received and a certificate was automatically issued.",
        });
      } else {
        toast({ title: "Submission received", description: "Your assignment has been submitted for review." });
      }
    } catch {
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BookOpen className="h-3 w-3" />
              <button
                onClick={() => navigate(["student", "learn", assignment.courseId])}
                className="hover:text-accent hover:underline"
              >
                {assignment.courseTitle}
              </button>
            </div>
            <CardTitle className="text-base">{assignment.title}</CardTitle>
            {assignment.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {assignment.description}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {statusBadge}
            {assignment.dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due {formatDate(assignment.dueDate)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Locked progress bar */}
        {!assignment.unlocked && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {assignment.lockedReason || "Complete the course first"}
              </p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{assignment.courseCompletion.completedVideos}/{assignment.courseCompletion.totalVideos} lessons completed</span>
                <span>{assignment.courseCompletion.percent}%</span>
              </div>
              <Progress value={assignment.courseCompletion.percent} className="h-1.5" />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(["student", "learn", assignment.courseId])}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" /> Continue Course
            </Button>
          </div>
        )}

        {/* Submission view */}
        {assignment.submission && (
          <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-2">
            <p className="text-sm text-foreground">
              Submitted on {formatDateTime(assignment.submission.submittedAt)}
            </p>
            <a
              href={assignment.submission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <Download className="h-3 w-3" /> View your submission
            </a>
            {assignment.submission.reviewNotes && (
              <div className="rounded-md border border-border bg-card p-3 mt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reviewer notes</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {assignment.submission.reviewNotes}
                </p>
              </div>
            )}
            {assignment.allowResubmission && (
              <p className="text-xs text-muted-foreground">
                Resubmission is enabled — expand below to upload a new file.
              </p>
            )}
          </div>
        )}

        {/* Expandable upload section when unlocked & no submission (or resubmission allowed) */}
        {assignment.unlocked && (!assignment.submission || assignment.allowResubmission) && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex flex-wrap items-center gap-2">
              {assignment.fileUrl && (
                <a
                  href={assignment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" /> Download Brief
                  </Button>
                </a>
              )}
              <CollapsibleTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {assignment.submission ? "Resubmit" : "Submit Assignment"}
                  <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-3 space-y-3">
              {assignment.instructions && (
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Instructions</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{assignment.instructions}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  Upload your submission (PDF, DOC, DOCX, PPT, PPTX, TXT — max 25MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-foreground file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
                <Button onClick={handleSubmit} disabled={!selectedFile || uploading} size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Confirm Submission"}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Certificate link if reviewed or any certificate was issued */}
        {assignment.submission && (
          <div className="pt-2 border-t border-border">
            <Button variant="link" size="sm" onClick={() => navigate(["student", "certificates"])} className="gap-2 p-0 h-auto text-accent">
              <Award className="h-4 w-4" /> View my certificates
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

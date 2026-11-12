"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch, apiPost } from "@/hooks/use-api";
import { useI18n } from "@/lib/i18n/store";
import { toast } from "@/hooks/use-toast";
import { formatDateTime } from "@/types";
import {
  Megaphone,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Paperclip,
  FileImage,
  Globe,
  BookOpen,
  Calendar,
  X,
} from "lucide-react";

interface CourseListItem {
  id: string;
  title: string;
  isPublished: boolean;
}

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  attachmentUrl: string | null;
  courseId: string | null;
  courseTitle: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementsResponse {
  announcements: AnnouncementRow[];
}

interface CoursesResponse {
  courses: CourseListItem[];
}

interface FormValues {
  title: string;
  content: string;
  courseId: string; // "ALL" or course id
  attachmentUrl: string | null;
  isPublished: boolean;
  publishedAt: string; // ISO datetime-local value, "" for now
  removeAttachment: boolean;
}

const DEFAULT_FORM: FormValues = {
  title: "",
  content: "",
  courseId: "ALL",
  attachmentUrl: null,
  isPublished: false,
  publishedAt: "",
  removeAttachment: false,
};

export function UniversityAnnouncements() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "true" | "false">(
    "ALL"
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AnnouncementRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(null);

  const { data: coursesData } = useApiFetch<CoursesResponse>(
    "/api/university/courses"
  );
  const courses = coursesData?.courses || [];

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (courseFilter !== "ALL") p.set("courseId", courseFilter);
    if (statusFilter !== "ALL") p.set("published", statusFilter);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [search, courseFilter, statusFilter]);

  const { data, loading, error, refetch } = useApiFetch<AnnouncementsResponse>(
    qs ? `/api/university/announcements${qs}` : "/api/university/announcements"
  );

  const announcements = data?.announcements || [];

  async function quickTogglePublish(a: AnnouncementRow) {
    try {
      await apiPost(
        `/api/university/announcements/${a.id}`,
        { isPublished: !a.isPublished },
        { method: "PUT" }
      );
      toast({
        title: a.isPublished ? "Unpublished" : "Published",
        description: a.title,
      });
      refetch();
    } catch {
      /* handled by apiPost toast */
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter card */}
      <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.search")}
                className="h-9 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("common.search")}
              />
            </div>
            <Select
              value={courseFilter}
              onValueChange={(v) => setCourseFilter(v)}
            >
              <SelectTrigger
                className="h-9 w-full rounded-lg sm:w-[180px]"
                aria-label="Filter by target course"
              >
                <SelectValue placeholder="All targets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All targets</SelectItem>
                <SelectItem value="NULL">All Students</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "ALL" | "true" | "false")
              }
            >
              <SelectTrigger
                className="h-9 w-full rounded-lg sm:w-[140px]"
                aria-label={t("common.status")}
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="true">{t("common.published")}</SelectItem>
                <SelectItem value="false">Drafts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="h-9 gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        </div>
      </Card>

      {/* Count summary */}
      {!loading && !error && announcements.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {announcements.length}
            </span>{" "}
            announcement{announcements.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-lg border-border p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-16 w-full" />
              <Skeleton className="mt-3 h-8 w-40" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          className="m-4"
          icon={<Megaphone className="h-5 w-5" />}
          title={t("common.error")}
          description={error}
        />
      ) : announcements.length === 0 ? (
        <EmptyState
          className="m-4"
          icon={<Megaphone className="h-5 w-5" />}
          title={t("common.announcements")}
          description="Share updates with all your students or target a specific course. Schedule announcements for later or publish them instantly."
          action={
            <Button
              onClick={() => setAddOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Create Announcement
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onEdit={() => setEditTarget(a)}
              onTogglePublish={() => quickTogglePublish(a)}
              onDelete={() => setDeleteTarget(a)}
            />
          ))}
        </div>
      )}

      <AnnouncementFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        courses={courses}
        onSaved={() => {
          setAddOpen(false);
          refetch();
          toast({ title: "Announcement created" });
        }}
      />

      <AnnouncementFormDialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        target={editTarget}
        courses={courses}
        onSaved={() => {
          setEditTarget(null);
          refetch();
          toast({ title: "Announcement updated" });
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.title}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await apiPost(
                    `/api/university/announcements/${deleteTarget.id}`,
                    null,
                    { method: "DELETE" }
                  );
                  toast({
                    title: "Announcement deleted",
                    description: deleteTarget.title,
                  });
                  setDeleteTarget(null);
                  refetch();
                } catch {
                  /* toast handled */
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────
function AnnouncementCard({
  announcement,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  announcement: AnnouncementRow;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group flex flex-col rounded-lg border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/40">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-soft-sage text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-semibold text-foreground line-clamp-2 leading-tight">
              {announcement.title}
            </h3>
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
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTogglePublish} className="gap-2">
                  {announcement.isPublished ? (
                    <>
                      <EyeOff className="h-4 w-4" /> Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" /> Publish now
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Target + status row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {announcement.isPublished ? (
              <Badge className="gap-1 border-0 bg-success/95 text-success-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success-foreground animate-pulse" />
                Published
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Draft
              </Badge>
            )}
            <Badge
              variant="outline"
              className="gap-1 bg-soft-sage/40 text-primary"
            >
              {announcement.courseId ? (
                <>
                  <BookOpen className="h-3 w-3" />
                  {announcement.courseTitle}
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3" />
                  All Students
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Body content */}
      <p className="mt-3 text-sm text-muted-foreground line-clamp-4 min-h-[3.5rem] whitespace-pre-wrap">
        {announcement.content}
      </p>

      {announcement.attachmentUrl && (
        <a
          href={announcement.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attached image
        </a>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {announcement.publishedAt
            ? `Published ${formatDateTime(announcement.publishedAt)}`
            : `Created ${formatDateTime(announcement.createdAt)}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" /> Edit
        </Button>
      </div>
    </Card>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────
function AnnouncementFormDialog({
  open,
  onOpenChange,
  target,
  courses,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target?: AnnouncementRow | null;
  courses: CourseListItem[];
  onSaved: () => void;
}) {
  const isEdit = !!target;
  const [values, setValues] = useState<FormValues>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      // Convert ISO to datetime-local value (yyyy-MM-ddThh:mm)
      const localVal = target.publishedAt
        ? new Date(target.publishedAt).toISOString().slice(0, 16)
        : "";
      setValues({
        title: target.title,
        content: target.content,
        courseId: target.courseId || "ALL",
        attachmentUrl: target.attachmentUrl,
        isPublished: target.isPublished,
        publishedAt: localVal,
        removeAttachment: false,
      });
      setPendingFile(null);
      setPreviewUrl(target.attachmentUrl);
    } else if (open) {
      setValues(DEFAULT_FORM);
      setPendingFile(null);
      setPreviewUrl(null);
    }
  }, [target, open]);

  function pickFile(file: File) {
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Keep existing attachmentUrl so we know what we had, but mark as not removed
    setValues((v) => ({ ...v, removeAttachment: false }));
  }

  function clearAttachment() {
    if (pendingFile) {
      URL.revokeObjectURL(previewUrl || "");
      setPendingFile(null);
    }
    setPreviewUrl(null);
    setValues((v) => ({
      ...v,
      attachmentUrl: null,
      removeAttachment: isEdit ? true : false,
    }));
  }

  function submit() {
    if (!values.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!values.content.trim()) {
      toast({ title: "Content is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    (async () => {
      try {
        const fd = new FormData();
        fd.append("title", values.title.trim());
        fd.append("content", values.content.trim());
        fd.append("courseId", values.courseId); // "ALL" handled server-side
        fd.append("isPublished", String(values.isPublished));
        if (values.isPublished && values.publishedAt) {
          fd.append("publishedAt", values.publishedAt);
        }
        if (values.removeAttachment) {
          fd.append("removeAttachment", "true");
        }
        if (pendingFile) {
          fd.append("file", pendingFile);
        }

        const url = isEdit
          ? `/api/university/announcements/${target!.id}`
          : "/api/university/announcements";
        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          body: fd,
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) {
          const msg = json.error || `Request failed (${res.status})`;
          toast({ title: "Error", description: msg, variant: "destructive" });
          throw new Error(msg);
        }
        if (pendingFile) URL.revokeObjectURL(previewUrl || "");
        onSaved();
      } catch {
        /* handled */
      } finally {
        setSaving(false);
      }
    })();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the announcement details, target audience and publish state."
              : "Broadcast an update to all your students or just one course. Save as draft or publish immediately."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          {/* Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="an-title"
              className="text-xs font-medium text-muted-foreground"
            >
              Title
            </Label>
            <Input
              id="an-title"
              value={values.title}
              onChange={(e) =>
                setValues({ ...values, title: e.target.value })
              }
              placeholder="e.g. Spring semester schedule update"
              className="h-9 rounded-lg"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label
              htmlFor="an-content"
              className="text-xs font-medium text-muted-foreground"
            >
              Content
            </Label>
            <Textarea
              id="an-content"
              value={values.content}
              onChange={(e) =>
                setValues({ ...values, content: e.target.value })
              }
              placeholder="Write your announcement here…"
              rows={5}
              className="rounded-lg"
            />
          </div>

          {/* Target course */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Audience
            </Label>
            <Select
              value={values.courseId}
              onValueChange={(v) => setValues({ ...values, courseId: v })}
            >
              <SelectTrigger className="w-full h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <span className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" /> All Students
                  </span>
                </SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5" />
                      {c.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {values.courseId === "ALL"
                ? "Visible to every student in any of your courses."
                : "Only shown to students with progress in this course."}
            </p>
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Attachment (image)
            </Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted flex items-center justify-center shrink-0 ring-1 ring-border">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileImage className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-accent hover:underline">
                  <Paperclip className="h-3.5 w-3.5" />
                  {pendingFile ? "Replace image" : "Choose image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) pickFile(f);
                    }}
                  />
                </label>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={clearAttachment}
                    className="ml-2 inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Publish toggle + schedule */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label
                  htmlFor="an-pub"
                  className="text-sm font-medium text-foreground"
                >
                  Publish
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Drafts are invisible to students.
                </p>
              </div>
              <Switch
                id="an-pub"
                checked={values.isPublished}
                onCheckedChange={(v) =>
                  setValues({ ...values, isPublished: v })
                }
              />
            </div>
            {values.isPublished && (
              <div className="space-y-1.5 border-t border-border pt-3">
                <Label
                  htmlFor="an-schedule"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Schedule for (optional)
                </Label>
                <Input
                  id="an-schedule"
                  type="datetime-local"
                  value={values.publishedAt}
                  onChange={(e) =>
                    setValues({ ...values, publishedAt: e.target.value })
                  }
                  className="h-9 rounded-lg"
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to publish immediately.
                </p>
              </div>
            )}
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
            {saving
              ? "Saving…"
              : isEdit
                ? "Save Changes"
                : values.isPublished
                  ? "Publish"
                  : "Save Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

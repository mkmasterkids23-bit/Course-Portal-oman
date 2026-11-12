"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
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
import { useApiFetch, apiPost } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  StickyNote, Search, Pencil, Trash2, Clock, PlayCircle,
  BookOpen, FileText, Plus, X, ChevronRight,
} from "lucide-react";
import { formatDateTime } from "@/types";
import { useAppStore } from "@/stores/app-store";

interface NoteItem {
  id: string;
  courseId: string;
  topicId: string | null;
  videoId: string | null;
  videoTimestamp: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  course: { id: string; title: string };
  topic: { id: string; title: string } | null;
  video: { id: string; title: string } | null;
}

interface NotesResponse {
  notes: NoteItem[];
}

/**
 * StudentNotes — full-page notes view.
 *
 * Lists every note the student has taken across all enrolled courses.
 * Provides:
 *   - free-text search over note content / course title / topic title
 *   - a "filter by course" dropdown built from the courses that appear in
 *     the notes list (so we never show options that have zero notes)
 *   - per-card edit (Dialog) + delete (AlertDialog confirm)
 *   - clickable video-timestamp chip that deep-links back into the
 *     learning page for the note's video
 */
export function StudentNotes() {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading, error, refetch, setData } = useApiFetch<NotesResponse>(
    "/api/student/notes"
  );

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const [editing, setEditing] = useState<NoteItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<NoteItem | null>(null);

  // Build the list of courses that appear in the notes — used to populate
  // the filter dropdown without making a separate /api/student/courses call.
  const courseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const n of data?.notes ?? []) {
      if (!seen.has(n.courseId)) seen.set(n.courseId, n.course.title);
    }
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [data?.notes]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.notes ?? []).filter((n) => {
      if (courseFilter !== "all" && n.courseId !== courseFilter) return false;
      if (!q) return true;
      return (
        n.content.toLowerCase().includes(q) ||
        n.course.title.toLowerCase().includes(q) ||
        (n.topic?.title.toLowerCase().includes(q) ?? false) ||
        (n.video?.title.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data?.notes, search, courseFilter]);

  function openEdit(note: NoteItem) {
    setEditing(note);
    setEditContent(note.content);
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editContent.trim()) {
      toast({
        title: "Note can't be empty",
        description: "Write something before saving.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await apiPost<{ note: NoteItem }>(
        `/api/student/notes/${editing.id}`,
        { content: editContent },
        { method: "PUT" }
      );
      // Replace locally so the UI updates instantly without a refetch.
      if (data) {
        setData({
          notes: data.notes.map((n) => (n.id === res.note.id ? res.note : n)),
        });
      }
      setEditing(null);
      toast({ title: "Note updated" });
    } catch {
      // apiPost surfaces the error toast
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await apiPost(`/api/student/notes/${deleting.id}`, null, {
        method: "DELETE",
      });
      if (data) {
        setData({ notes: data.notes.filter((n) => n.id !== deleting.id) });
      }
      toast({ title: "Note deleted" });
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<StickyNote className="h-5 w-5" />}
        title="Couldn't load notes"
        description={error}
        action={<Button onClick={() => refetch()}>Try again</Button>}
      />
    );
  }

  const notes = data?.notes ?? [];
  const total = notes.length;

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-soft-sage/60 via-card to-card p-4 md:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/20">
              <StickyNote className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-lg font-semibold text-foreground truncate">
                My Notes
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {total === 0
                  ? "Capture insights from your video lessons."
                  : `${total} note${total > 1 ? "s" : ""} across ${courseOptions.length} course${courseOptions.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search + filter ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, courses, topics…"
            className="pl-9"
            aria-label="Search notes"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={courseFilter}
            onValueChange={setCourseFilter}
          >
            <SelectTrigger className="w-full" aria-label="Filter by course">
              <BookOpen className="h-4 w-4 text-muted-foreground mr-1.5" />
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courseOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Notes list ─── */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<StickyNote className="h-5 w-5" />}
          title={total === 0 ? "No notes yet" : "No notes match your search"}
          description={
            total === 0
              ? "Open a course, watch a video, and capture key points as you go. Your notes will appear here."
              : "Try a different search term or clear the course filter."
          }
          action={
            total === 0 ? (
              <Button onClick={() => navigate(["student", "courses"])} className="gap-2">
                Browse courses <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCourseFilter("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => openEdit(note)}
              onDelete={() => setDeleting(note)}
              onSeekVideo={() =>
                navigate(["student", "learn", note.courseId])
              }
            />
          ))}
        </div>
      )}

      {/* ─── Edit dialog ─── */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
            <DialogDescription>
              {editing?.course.title}
              {editing?.topic ? ` · ${editing.topic.title}` : ""}
              {editing?.video ? ` · ${editing.video.title}` : ""}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
            autoFocus
            placeholder="Update your note…"
            className="resize-y"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving} className="gap-2">
              <Pencil className="h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete confirmation ─── */}
      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The note will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function NoteCard({
  note,
  onEdit,
  onDelete,
  onSeekVideo,
}: {
  note: NoteItem;
  onEdit: () => void;
  onDelete: () => void;
  onSeekVideo: () => void;
}) {
  const wasEdited = new Date(note.updatedAt).getTime() > new Date(note.createdAt).getTime() + 1000;

  return (
    <Card className="group shadow-sm border-border hover:border-accent/40 transition-colors duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent shrink-0">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent truncate">
                {note.course.title}
              </p>
            </div>
            {note.topic && (
              <p className="text-xs text-muted-foreground truncate mb-0.5">
                Topic · {note.topic.title}
              </p>
            )}
            {note.video && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <PlayCircle className="h-3 w-3 shrink-0" />
                {note.video.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-accent"
              onClick={onEdit}
              aria-label="Edit note"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Content preview — preserves line breaks */}
        <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-6 leading-relaxed">
          {note.content}
        </p>

        {/* Video timestamp chip */}
        {note.videoId && note.videoTimestamp !== null && (
          <button
            onClick={onSeekVideo}
            className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
            title="Open video at this timestamp"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            {formatTimestamp(note.videoTimestamp)}
          </button>
        )}

        {/* Date row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {wasEdited
              ? `Updated ${formatDateTime(note.updatedAt)}`
              : `Created ${formatDateTime(note.createdAt)}`}
          </span>
          {wasEdited && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground">
              edited
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Unused export kept for tree-shaking clarity
export const _icons = { Plus };

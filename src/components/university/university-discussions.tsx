"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch, apiPost } from "@/hooks/use-api";
import { useI18n } from "@/lib/i18n/store";
import { toast } from "@/hooks/use-toast";
import { formatDateTime } from "@/types";
import {
  MessageSquare, Search, Pin, Lock, Unlock, PinOff, Trash2,
  Send, ChevronLeft, ShieldCheck, BookOpen,
} from "lucide-react";

interface DiscussionItem {
  id: string;
  courseId: string;
  courseTitle: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DiscussionDetail {
  id: string;
  courseId: string;
  courseTitle: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  authorRole: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  replies: {
    id: string;
    authorId: string;
    authorName: string;
    authorPhoto: string | null;
    authorRole: string;
    content: string;
    isInstructor: boolean;
    createdAt: string;
  }[];
}

export function UniversityDiscussions() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiscussionItem | null>(null);

  const qs = (() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (courseFilter !== "ALL") p.set("courseId", courseFilter);
    const s = p.toString();
    return s ? `?${s}` : "";
  })();

  const { data, loading, error, refetch } = useApiFetch<{ discussions: DiscussionItem[] }>(
    qs ? `/api/university/discussions${qs}` : "/api/university/discussions"
  );

  const discussions = data?.discussions || [];
  const courses = Array.from(
    new Set(discussions.map((d) => `${d.courseId}|${d.courseTitle}`))
  ).map((s) => {
    const [id, title] = s.split("|");
    return { id, title };
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("discussions.searchDiscussions")}
              className="h-9 rounded-lg pl-9"
              aria-label={t("discussions.searchDiscussions")}
            />
          </div>
          {courses.length > 0 && (
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full md:w-[200px] h-9 rounded-lg" aria-label={t("common.course")}>
                <SelectValue placeholder={t("discussions.allCourses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("discussions.allCourses")}</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Count */}
      {!loading && !error && discussions.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t("common.showing")} <span className="font-medium text-foreground">{discussions.length}</span> {t("common.discussions")}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          title={t("common.error")}
          description={error}
        />
      ) : discussions.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          title={t("discussions.noDiscussions")}
          description={t("discussions.beFirst")}
        />
      ) : (
        <div className="space-y-3">
          {discussions.map((d) => (
            <Card
              key={d.id}
              className="group cursor-pointer border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-accent/30"
              onClick={() => setSelectedId(d.id)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  {d.authorPhoto ? (
                    <img src={d.authorPhoto} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-soft-sage text-primary text-xs">
                    {d.authorName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.isPinned && (
                      <Badge className="bg-primary/10 text-primary border-0 gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    {d.isLocked && (
                      <Badge className="bg-warning/15 text-warning border-0 gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </Badge>
                    )}
                    <h3 className="font-heading font-semibold text-foreground text-sm line-clamp-1">
                      {d.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {d.courseTitle}
                    </span>
                    <span>by {d.authorName}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {d.replyCount} {d.replyCount === 1 ? "reply" : "replies"}
                    </span>
                    <span>{formatDateTime(d.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Discussion detail dialog */}
      {selectedId && (
        <DiscussionDetailDialog
          discussionId={selectedId}
          onClose={() => {
            setSelectedId(null);
            refetch();
          }}
          onDelete={(d) => {
            setSelectedId(null);
            setDeleteTarget(d);
          }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete discussion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong> and all its replies.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await apiPost(`/api/university/discussions/${deleteTarget.id}`, null, { method: "DELETE" });
                  toast({ title: "Discussion deleted" });
                  setDeleteTarget(null);
                  refetch();
                } catch {}
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

// ─── Discussion Detail Dialog ───────────────────────────────────────────

function DiscussionDetailDialog({
  discussionId,
  onClose,
  onDelete,
}: {
  discussionId: string;
  onClose: () => void;
  onDelete: (d: DiscussionItem) => void;
}) {
  const { t } = useI18n();
  const { data, loading, error, refetch } = useApiFetch<{ discussion: DiscussionDetail }>(
    `/api/university/discussions/${discussionId}`
  );
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  const discussion = data?.discussion;

  async function submitReply() {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      await apiPost(`/api/university/discussions/${discussionId}/replies`, {
        content: replyText.trim(),
      });
      setReplyText("");
      toast({ title: "Reply posted", description: "Your response has been posted with an instructor badge." });
      refetch();
    } catch {
    } finally {
      setPosting(false);
    }
  }

  async function togglePin() {
    if (!discussion) return;
    try {
      await apiPost(`/api/university/discussions/${discussionId}`, {
        isPinned: !discussion.isPinned,
      }, { method: "PUT" });
      toast({ title: discussion.isPinned ? "Unpinned" : "Pinned" });
      refetch();
    } catch {}
  }

  async function toggleLock() {
    if (!discussion) return;
    try {
      await apiPost(`/api/university/discussions/${discussionId}`, {
        isLocked: !discussion.isLocked,
      }, { method: "PUT" });
      toast({ title: discussion.isLocked ? "Unlocked" : "Locked" });
      refetch();
    } catch {}
  }

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="animate-scale-in max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {discussion && (
                <>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" /> {discussion.courseTitle}
                    </Badge>
                    {discussion.isPinned && (
                      <Badge className="bg-primary/10 text-primary border-0 gap-1 text-xs">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    {discussion.isLocked && (
                      <Badge className="bg-warning/15 text-warning border-0 gap-1 text-xs">
                        <Lock className="h-3 w-3" /> Locked
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="font-heading text-lg font-semibold">
                    {discussion.title}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    by {discussion.authorName} · {formatDateTime(discussion.createdAt)}
                  </DialogDescription>
                </>
              )}
            </div>
            {/* Moderation actions */}
            {discussion && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={togglePin}
                  title={discussion.isPinned ? "Unpin" : "Pin discussion"}
                >
                  {discussion.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleLock}
                  title={discussion.isLocked ? "Unlock" : "Lock discussion"}
                >
                  {discussion.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete({
                    id: discussion.id,
                    courseId: discussion.courseId,
                    courseTitle: discussion.courseTitle,
                    authorId: discussion.authorId,
                    authorName: discussion.authorName,
                    authorPhoto: discussion.authorPhoto,
                    title: discussion.title,
                    content: discussion.content,
                    isPinned: discussion.isPinned,
                    isLocked: discussion.isLocked,
                    replyCount: discussion.replies.length,
                    createdAt: discussion.createdAt,
                    updatedAt: discussion.updatedAt,
                  })}
                  title="Delete discussion"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : discussion ? (
            <>
              {/* Original post */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    {discussion.authorPhoto && (
                      <img src={discussion.authorPhoto} alt="" className="h-full w-full object-cover" />
                    )}
                    <AvatarFallback className="bg-soft-sage text-primary text-xs">
                      {discussion.authorName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{discussion.authorName}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(discussion.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{discussion.content}</p>
              </div>

              {/* Replies */}
              {discussion.replies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {discussion.replies.length} {discussion.replies.length === 1 ? "Reply" : "Replies"}
                  </p>
                  {discussion.replies.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-lg border p-4 ${
                        r.isInstructor
                          ? "border-primary/20 bg-soft-sage/40"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-7 w-7">
                          {r.authorPhoto && (
                            <img src={r.authorPhoto} alt="" className="h-full w-full object-cover" />
                          )}
                          <AvatarFallback className={`text-xs ${
                            r.isInstructor ? "bg-primary text-primary-foreground" : "bg-soft-sage text-primary"
                          }`}>
                            {r.authorName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{r.authorName}</p>
                          {r.isInstructor && (
                            <Badge className="bg-primary text-primary-foreground border-0 gap-1 text-xs">
                              <ShieldCheck className="h-3 w-3" /> Instructor
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDateTime(r.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply box */}
              {!discussion.isLocked ? (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Reply as {discussion.courseTitle} Instructor
                    </p>
                  </div>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your response…"
                    rows={3}
                    className="rounded-lg"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={submitReply}
                      disabled={!replyText.trim() || posting}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {posting ? "Posting…" : "Post Reply"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-center">
                  <Lock className="h-5 w-5 text-warning mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    This discussion is locked. Unlock it to allow replies.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApiFetch, apiPost, apiUpload } from "@/hooks/use-api";
import { VideoNotesPanel } from "@/components/student/video-notes-panel";
import { CourseDiscussionsPanel } from "@/components/student/course-discussions-panel";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, PlayCircle, CheckCircle2, Lock, FileText, Download, Link as LinkIcon,
  Upload, Award, ClipboardList, AlertTriangle, Clock, Video as VideoIcon, Info,
  Maximize2, Minimize2, ChevronLeft, ChevronRight, BookOpen, Sparkles,
  HelpCircle, XCircle, RefreshCw, ListChecks, MessageSquare, StickyNote,
  LayoutDashboard, Bookmark, Bell, User as UserIcon, MessagesSquare,
  GraduationCap, Trophy, ChevronDown,
} from "lucide-react";
import { formatDateTime } from "@/types";
import { useI18n } from "@/lib/i18n/store";

// ─── YouTube IFrame Player API (loaded once, shared across mounts) ───
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<any> | null = null;
function loadYouTubeAPI(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") { try { prev(); } catch {} }
      resolve(window.YT);
    };
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

// Player abstraction — lets HTML5 <video> and the YouTube IFrame player share
// one set of tracking logic (time ticks, seek handling, question triggers).
interface PlayerApi {
  currentTime: () => number;
  duration: () => number;
  pause: () => void;
  play: () => void;
  seekTo: (t: number) => void;
  paused: () => boolean;
}

interface VideoProgressInfo {
  lastPosition: number;
  watchTimeSeconds: number;
  duration: number;
  isCompleted: boolean;
  completedAt: string | null;
}

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  source: "UPLOAD" | "YOUTUBE" | "URL";
  videoUrl: string;
  thumbnail: string | null;
  displayOrder: number;
  duration: number;
  hasQuestions: boolean;
  questionCount: number;
  assessmentPassed: boolean | null; // null = no questions, true/false if has questions
  progress: VideoProgressInfo | null;
}

// ─── Video Assessment types ───
// Mirrors the shape returned by GET /api/student/videos/[videoId]/questions
// (note: correctAnswer is intentionally NOT included by the API for security).
interface VideoQuestionData {
  id: string;
  question: string;
  options: string[];
  timestamp: number;
}

interface VideoAssessmentSummary {
  score: number;
  passed: boolean;
  attempts: number;
}

// Mirrors the POST assessment response — includes per-question correctness
// because the server validates answers server-side and reveals them here.
interface AssessmentAnswerResult {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  correct: boolean;
}

interface AssessmentResult {
  id?: string;
  score: number;
  passed: boolean;
  attempts: number;
  correctCount: number;
  totalQuestions: number;
  answers: AssessmentAnswerResult[];
}

interface TopicItem {
  id: string;
  title: string;
  description: string | null;
  displayOrder: number;
  videos: VideoItem[];
  materials: MaterialItem[];
}

interface MaterialItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  topic?: { id: string; title: string } | null;
}

interface AssignmentInfo {
  id: string;
  title: string | null;
  description: string | null;
  instructions: string | null;
  fileUrl: string | null;
  dueDate: string | null;
  isPublished: boolean;
  allowResubmission: boolean;
}

interface SubmissionInfo {
  id: string;
  fileUrl: string;
  submittedAt: string;
  status: "SUBMITTED" | "REVIEWED";
  reviewNotes: string | null;
  reviewedAt: string | null;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  accessType: "FREE" | "PAID";
  topics: TopicItem[];
  materials: MaterialItem[];
  assignment: AssignmentInfo | null;
  submission: SubmissionInfo | null;
  courseCompletion: {
    totalVideos: number;
    completedVideos: number;
    completedTopics: number;
    totalTopics: number;
    percent: number;
    allCompleted: boolean;
  };
  certificateTemplate: {
    id: string;
    isEnabled: boolean;
    title: string;
    bodyText: string;
    organizationName: string;
  } | null;
}

interface CourseResponse { course: CourseDetail }

/* ===================== Learning Left Icon Sidebar ===================== */
/*
 * Narrow 56px icon-only navigation rendered as a fixed bar on the left of
 * the learning page. Reuses the same student NAV items as the global
 * StudentSidebar but strips text/labels. Tooltips on hover reveal labels.
 * The brand logo sits at the top, the user avatar at the bottom.
 */
const LEARNING_NAV: Array<{
  labelKey: string;
  icon: typeof LayoutDashboard;
  segments: string[];
}> = [
  { labelKey: "nav.dashboard", icon: LayoutDashboard, segments: ["student", "overview"] },
  { labelKey: "nav.exploreCourses", icon: BookOpen, segments: ["student", "courses"] },
  { labelKey: "nav.myNotes", icon: StickyNote, segments: ["student", "notes"] },
  { labelKey: "nav.myBookmarks", icon: Bookmark, segments: ["student", "bookmarks"] },
  { labelKey: "nav.discussions", icon: MessagesSquare, segments: ["student", "discussions"] },
  { labelKey: "nav.notifications", icon: Bell, segments: ["student", "notifications"] },
  { labelKey: "nav.myProfile", icon: UserIcon, segments: ["student", "profile"] },
];

function LearningLeftSidebar() {
  const { t } = useI18n();
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const current = segments[1] || "overview";

  const initials = (user?.name || "S")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-14 flex-col items-center gap-1 border-r border-border bg-card py-3 lg:flex">
        {/* Brand logo (icon only) */}
        <button
          onClick={() => navigate(["student", "overview"])}
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
          aria-label="CourseLearn home"
        >
          <GraduationCap className="h-5 w-5" />
        </button>

        {/* Vertical icon nav */}
        <nav className="flex flex-1 flex-col items-center gap-1.5 py-2">
          {LEARNING_NAV.map((item) => {
            const active = current === item.segments[1];
            const Icon = item.icon;
            return (
              <Tooltip key={item.labelKey}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(item.segments)}
                    aria-label={t(item.labelKey as any)}
                    className={cn(
                      "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                      active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t(item.labelKey as any)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* User avatar at the bottom */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(["student", "profile"])}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-card transition-shadow hover:ring-primary/50"
              aria-label={user?.name || "Profile"}
            >
              <Avatar className="h-9 w-9">
                {user?.profilePhoto ? (
                  <AvatarImage src={user.profilePhoto} alt={user?.name || ""} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {user?.name || "Profile"}
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}

/* ===================== Learning Right Sidebar ===================== */
/*
 * ~300px right rail with course title, segmented teal progress bar,
 * a chapter (topic) list using numbered circles (completed = green check,
 * active = purple, locked = gray lock), expandable lessons per chapter,
 * and a "discussion preview" footer showing recent comments with avatars.
 *
 * The discussion preview fetches its own lightweight list via the existing
 * /api/student/discussions endpoint scoped to the course. It's purely
 * informational — clicking the Discussions tab on the main content area
 * is the entry point to the full thread UI.
 */
interface SidebarDiscussion {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; name: string; profilePhoto: string | null };
  replyCount: number;
}

function LearningRightSidebar({
  course,
  activeTopic,
  activeVideoId,
  onSelectVideo,
}: {
  course: CourseDetail;
  activeTopic: TopicItem | undefined;
  activeVideoId: string | null;
  onSelectVideo: (id: string) => void;
}) {
  const { t } = useI18n();
  const navigate = useAppStore((s) => s.navigate);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    () => new Set(activeTopic ? [activeTopic.id] : course.topics[0] ? [course.topics[0].id] : [])
  );

  // Lightweight discussions list (preview only). Uses the same endpoint as
  // the full CourseDiscussionsPanel — this fetch is independent so the
  // preview doesn't block rendering and doesn't share state with the panel.
  const { data: discussionsData } = useApiFetch<{ discussions: SidebarDiscussion[] }>(
    `/api/student/discussions?courseId=${encodeURIComponent(course.id)}`
  );
  const previewDiscussions = (discussionsData?.discussions ?? []).slice(0, 3);

  function toggleTopic(id: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Segmented progress bar: one segment per topic, lit teal when the
  // topic is fully completed.
  const totalTopics = course.topics.length;
  const completedTopics = course.courseCompletion.completedTopics;
  const segmentCount = Math.max(totalTopics, 1);

  return (
    <aside className="fixed right-0 top-0 z-20 hidden h-screen w-[300px] overflow-y-auto border-l border-border bg-card lg:block">
      <ScrollArea className="h-screen">
        <div className="space-y-5 p-5">
          {/* Course title */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("courses.courseContent")}
            </p>
            <h2 className="font-heading text-base font-bold leading-snug text-foreground">
              {course.title}
            </h2>
            {course.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground">
                {course.category}
              </Badge>
            )}
          </div>

          {/* Progress — segmented teal bar + trophy */}
          <div className="rounded-xl border border-border bg-muted/30 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-semibold text-foreground">
                  {completedTopics}/{totalTopics} {t("learning.completed").toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-semibold tabular-nums text-teal-600">
                {course.courseCompletion.percent}%
              </span>
            </div>
            {/* Segmented bar */}
            <div className="mt-2.5 flex gap-1" aria-hidden>
              {Array.from({ length: segmentCount }).map((_, i) => {
                const topic = course.topics[i];
                const lit =
                  topic &&
                  topic.videos.length > 0 &&
                  topic.videos.every((v) => v.progress?.isCompleted);
                return (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      lit ? "bg-teal-500" : "bg-muted"
                    )}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {course.courseCompletion.completedVideos}/{course.courseCompletion.totalVideos} {t("courses.lessons")}
            </p>
          </div>

          {/* Chapter list */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("common.topics")}
            </p>
            {course.topics.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center rounded-lg border border-dashed border-border">
                {t("learning.noTopicsPublished")}
              </p>
            ) : (
              <ul className="space-y-1">
                {course.topics.map((topic, topicIdx) => {
                  const completedInTopic = topic.videos.filter(
                    (v) => v.progress?.isCompleted
                  ).length;
                  const isActiveTopic = topic.id === activeTopic?.id;
                  const topicComplete =
                    completedInTopic === topic.videos.length && topic.videos.length > 0;
                  // Locked = previous topic isn't complete yet (unless it's
                  // the first topic, which is always unlocked).
                  const prevTopic = topicIdx > 0 ? course.topics[topicIdx - 1] : null;
                  const isLocked =
                    !!prevTopic &&
                    prevTopic.videos.length > 0 &&
                    !prevTopic.videos.every((v) => v.progress?.isCompleted) &&
                    !topicComplete;
                  const expanded = expandedTopics.has(topic.id);

                  return (
                    <li key={topic.id}>
                      <button
                        onClick={() => !isLocked && toggleTopic(topic.id)}
                        disabled={isLocked}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                          isActiveTopic
                            ? "bg-primary/5 ring-1 ring-primary/15"
                            : "hover:bg-muted/60",
                          isLocked && "cursor-not-allowed opacity-60 hover:bg-transparent"
                        )}
                      >
                        {/* Numbered circle */}
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                            topicComplete
                              ? "bg-teal-500 text-white"
                              : isActiveTopic
                                ? "bg-primary text-primary-foreground"
                                : isLocked
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-muted/70 text-foreground"
                          )}
                        >
                          {topicComplete ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : isLocked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            String(topicIdx + 1).padStart(2, "0")
                          )}
                        </span>
                        {/* Title + meta */}
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-xs font-semibold",
                              topicComplete
                                ? "text-teal-700"
                                : isActiveTopic
                                  ? "text-primary"
                                  : "text-foreground"
                            )}
                          >
                            {topic.title}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {completedInTopic}/{topic.videos.length} {t("courses.lessons")}
                          </span>
                        </span>
                        {/* Expand chevron */}
                        {!isLocked && topic.videos.length > 0 && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                              expanded && "rotate-180"
                            )}
                          />
                        )}
                      </button>

                      {/* Lessons */}
                      {expanded && !isLocked && topic.videos.length > 0 && (
                        <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border/70 pl-3">
                          {topic.videos.map((video) => {
                            const isActive = video.id === activeVideoId;
                            const completed = video.progress?.isCompleted;
                            return (
                              <li key={video.id}>
                                <button
                                  onClick={() => onSelectVideo(video.id)}
                                  className={cn(
                                    "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors",
                                    isActive
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "text-foreground hover:bg-muted/60"
                                  )}
                                >
                                  <span className="shrink-0 flex h-4 w-4 items-center justify-center">
                                    {completed ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                                    ) : isActive ? (
                                      <PlayCircle className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <PlayCircle className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground" />
                                    )}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate">{video.title}</span>
                                  {video.hasQuestions && (
                                    <span
                                      className={cn(
                                        "inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold",
                                        video.assessmentPassed === true
                                          ? "bg-teal-50 text-teal-700"
                                          : video.assessmentPassed === false
                                            ? "bg-destructive/10 text-destructive"
                                            : "bg-primary/10 text-primary"
                                      )}
                                    >
                                      <HelpCircle className="h-2.5 w-2.5" />
                                      {video.questionCount}
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Discussion preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("nav.discussions")}
              </p>
              <button
                onClick={() => navigate(["student", "discussions"])}
                className="text-[10px] font-semibold text-primary hover:underline"
              >
                {t("learning.tab.discussion")} →
              </button>
            </div>
            {previewDiscussions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-3 text-center">
                <MessageSquare className="mx-auto h-4 w-4 text-muted-foreground/60" />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("learning.beFirstToAsk")}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {previewDiscussions.map((d) => {
                  const initials = (d.author?.name || "S")
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <li
                      key={d.id}
                      className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/20 p-2.5"
                    >
                      <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border">
                        {d.author?.profilePhoto ? (
                          <AvatarImage src={d.author.profilePhoto} alt={d.author?.name || ""} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-foreground">
                          {d.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {d.author?.name} · {formatDateTime(d.createdAt)}
                        </p>
                      </div>
                      {d.replyCount > 0 && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {d.replyCount}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

export function StudentLearning({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { t } = useI18n();
  const { data, loading, error, refetch, setData } = useApiFetch<CourseResponse>(
    `/api/student/courses/${courseId}`
  );

  // Read the hash query for deep-link support. The global Discussions
  // view navigates here with `?tab=discussions&discussion=<id>`; we honour
  // that by defaulting the Materials/Discussions tab to "discussions" and
  // asking the panel to highlight (and scroll to) the matching thread.
  const routeQuery = useAppStore((s) => s.query);
  const highlightDiscussionId = routeQuery.discussion || null;
  const discussionsTabDefault = routeQuery.tab === "discussions";

  // Pick the initial video: last watched, or first available.
  const initialVideoId = (() => {
    if (!data?.course) return null;
    // 1) lastWatchedVideoId is implicitly captured via progress; find the
    //    most recently updated progress entry in the topics tree.
    let candidate: VideoItem | null = null;
    for (const t of data.course.topics) {
      for (const v of t.videos) {
        if (v.progress && !v.progress.isCompleted) {
          if (!candidate || (v.progress.watchTimeSeconds > (candidate.progress?.watchTimeSeconds || 0))) {
            candidate = v;
          }
        }
      }
    }
    if (candidate) return candidate.id;
    // 2) First video of the first topic
    return data.course.topics[0]?.videos[0]?.id ?? null;
  })();

  const [userSelectedVideoId, setUserSelectedVideoId] = useState<string | null>(null);
  // Reset user selection when courseId changes — "adjust state during render"
  // pattern (avoids setState-in-effect warnings).
  const [prevCourseId, setPrevCourseId] = useState(courseId);
  if (courseId !== prevCourseId) {
    setPrevCourseId(courseId);
    setUserSelectedVideoId(null);
  }
  // Effective active video: explicit user selection overrides the auto-pick
  // (which is the last-watched or first video). When data loads and we have an
  // initial pick, this falls back to it without needing an effect.
  const activeVideoId = userSelectedVideoId ?? initialVideoId;

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 lg:pl-14 lg:pr-[300px]">
        <LearningLeftSidebar />
        <div className="space-y-5 p-4 sm:p-6 lg:p-8">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-64 rounded-md" />
              <Skeleton className="h-7 w-96 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
            <Skeleton className="h-8 w-40 rounded-full" />
          </div>
          {/* Video player skeleton */}
          <Skeleton className="h-[420px] rounded-2xl" />
          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 lg:pl-14">
        <LearningLeftSidebar />
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {t("learning.backToCourses")}
          </Button>
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title={t("learning.couldntOpenCourse")}
            description={error}
            action={<Button onClick={onBack}>{t("learning.backToCourses")}</Button>}
          />
        </div>
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="min-h-screen bg-muted/30 lg:pl-14">
        <LearningLeftSidebar />
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {t("learning.backToCourses")}
          </Button>
          <EmptyState
            icon={<PlayCircle className="h-5 w-5" />}
            title={t("learning.courseNotFound")}
            description={t("learning.courseMayRemoved")}
            action={<Button onClick={onBack}>{t("learning.backToCourses")}</Button>}
          />
        </div>
      </div>
    );
  }

  const course = data.course;
  const allVideos = course.topics.flatMap((t) => t.videos);
  const activeVideo =
    allVideos.find((v) => v.id === activeVideoId) || allVideos[0] || null;

  // Find the topic containing the active video
  const activeTopic = course.topics.find((t) =>
    t.videos.some((v) => v.id === activeVideo?.id)
  );

  // Build a flat ordered list for prev/next navigation
  const flatVideoIds = allVideos.map((v) => v.id);
  const activeIndex = activeVideo ? flatVideoIds.indexOf(activeVideo.id) : -1;
  const prevVideo = activeIndex > 0 ? allVideos[activeIndex - 1] : null;
  const nextVideo = activeIndex >= 0 && activeIndex < allVideos.length - 1 ? allVideos[activeIndex + 1] : null;

  function handleProgressUpdate(updated: {
    videoId: string;
    progress: VideoProgressInfo;
    justCompleted: boolean;
  }) {
    if (!data) return;
    const newCourse = {
      ...data.course,
      topics: data.course.topics.map((t) => ({
        ...t,
        videos: t.videos.map((v) =>
          v.id === updated.videoId ? { ...v, progress: updated.progress } : v
        ),
      })),
      courseCompletion: (() => {
        // Recompute local snapshot
        const videos = data.course.topics.flatMap((t) => t.videos);
        const completed = videos.filter(
          (v) =>
            v.id === updated.videoId
              ? updated.progress.isCompleted
              : v.progress?.isCompleted
        ).length;
        const total = videos.length;
        // No videos → course is considered fully watched (assignment unlocked).
        const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
        const totalTopics = data.course.topics.length;
        const completedTopics = data.course.topics.filter((topic) =>
          topic.videos.length > 0 &&
          topic.videos.every(
            (v) =>
              (v.id === updated.videoId ? updated.progress.isCompleted : v.progress?.isCompleted)
          )
        ).length;
        return {
          totalVideos: total,
          completedVideos: completed,
          completedTopics,
          totalTopics,
          percent,
          allCompleted: total === 0 || completed === total,
        };
      })(),
    };
    setData({ course: newCourse });

    if (updated.justCompleted) {
      toast({
        title: t("learning.lessonCompletedToast"),
        description: t("learning.greatWorkSaved"),
      });
    }
  }

  async function handleSubmissionSuccess() {
    await refetch();
    toast({
      title: t("learning.assignmentSubmittedToast"),
      description: t("learning.assignmentSubmittedDesc"),
    });
  }

  return (
    <div className="min-h-screen bg-muted/30 animate-page-in pb-20 lg:pb-8 lg:pl-14 lg:pr-[300px]">
      {/* ─── Narrow left icon-only sidebar ─── */}
      <LearningLeftSidebar />

      {/* ─── Right sidebar — course content + progress + discussions ─── */}
      <LearningRightSidebar
        course={course}
        activeTopic={activeTopic}
        activeVideoId={activeVideo?.id || null}
        onSelectVideo={(id) => setUserSelectedVideoId(id)}
      />

      {/* ─── Main content area ─── */}
      <main className="space-y-5 p-4 sm:p-6 lg:p-8">
        {/* ─── Header: breadcrumb + large title + chapter nav ─── */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <button
                onClick={onBack}
                className="flex items-center gap-1 transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                {t("learning.myCourses")}
              </button>
              <span className="text-muted-foreground/60">/</span>
              <span className="truncate">{course.title}</span>
              {activeVideo && (
                <>
                  <span className="text-muted-foreground/60">/</span>
                  <span className="truncate font-medium text-foreground">
                    {activeVideo.title}
                  </span>
                </>
              )}
            </nav>

            {/* Large bold lesson title */}
            {activeVideo && (
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {activeVideo.title}
              </h1>
            )}

            {/* Subtitle — course name + tags */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {activeTopic && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {activeTopic.title}
                </span>
              )}
              {activeTopic && <span className="text-muted-foreground/40">·</span>}
              <button
                onClick={onBack}
                className="truncate transition-colors hover:text-primary"
              >
                {course.title}
              </button>
              {course.category && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground">
                    {course.category}
                  </Badge>
                </>
              )}
              <Badge
                className={
                  course.accessType === "FREE"
                    ? "bg-teal-50 text-teal-700 border-transparent text-[10px] px-1.5 py-0 h-4"
                    : "bg-primary text-primary-foreground border-transparent text-[10px] px-1.5 py-0 h-4"
                }
              >
                {course.accessType === "FREE" ? t("common.free") : t("common.paid")}
              </Badge>
            </div>
          </div>

          {/* Top-right: chapter prev/next navigation */}
          {(prevVideo || nextVideo) && (
            <div className="flex shrink-0 items-center gap-2 self-start">
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:inline">
                {t("learning.topic")} {(activeTopic ? course.topics.indexOf(activeTopic) : 0) + 1}/{course.topics.length}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prevVideo && setUserSelectedVideoId(prevVideo.id)}
                  disabled={!prevVideo}
                  className="h-8 gap-1.5 rounded-full border-border bg-card px-3 text-xs font-medium shadow-sm hover:bg-muted"
                  aria-label={t("learning.prevLesson")}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => nextVideo && setUserSelectedVideoId(nextVideo.id)}
                  disabled={!nextVideo}
                  className="h-8 gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  aria-label={t("learning.nextLesson")}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* ─── Video player (rounded card with shadow) ─── */}
        {activeVideo ? (
          <VideoPlayer
            key={activeVideo.id}
            video={activeVideo}
            topicTitle={activeTopic?.title || null}
            courseId={course.id}
            topicId={activeTopic?.id || null}
            onProgress={handleProgressUpdate}
            refetchCourse={refetch}
          />
        ) : (
          <EmptyState
            icon={<VideoIcon className="h-5 w-5" />}
            title={t("courses.noVideosYet")}
            description={t("courses.noVideosDesc")}
          />
        )}

        {/* ─── 4-Tab Interface below video ─── */}
        <Tabs defaultValue="overview" className="gap-0">
          <div className="border-b border-border overflow-x-auto scrollbar-thin">
            <TabsList className="bg-transparent border-0 p-0 h-auto gap-0 flex-nowrap">
              <TabsTrigger
                value="overview"
                className="tab-underline rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
              >
                <Info className="h-3.5 w-3.5" />
                {t("learning.tab.overview")}
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="tab-underline rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
              >
                <StickyNote className="h-3.5 w-3.5" />
                {t("learning.tab.notes")}
              </TabsTrigger>
              <TabsTrigger
                value="discussions"
                className="tab-underline rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {t("learning.tab.discussion")}
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="tab-underline rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
              >
                <FileText className="h-3.5 w-3.5" />
                {t("learning.tab.resources")}
                {(course.materials.length > 0 || (activeTopic && activeTopic.materials.length > 0)) && (
                  <Badge variant="outline" className="ml-0.5 text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground">
                    {course.materials.length + (activeTopic?.materials.length || 0)}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="mt-0 p-4">
            <div className="space-y-3">
              {activeVideo && (
                <>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {activeVideo.title}
                    </h3>
                    {activeTopic && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("learning.topic")} {activeTopic.title}
                      </p>
                    )}
                  </div>
                  {activeVideo.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {activeVideo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    {activeVideo.progress?.isCompleted ? (
                      <Badge className="bg-teal-50 text-teal-700 border-transparent gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {t("common.completed")}
                      </Badge>
                    ) : activeVideo.progress?.lastPosition ? (
                      <Badge className="bg-warning/15 text-warning border-transparent gap-1">
                        <Clock className="h-3 w-3" /> {t("common.inProgress")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground gap-1">
                        <PlayCircle className="h-3 w-3" /> {t("common.notStarted")}
                      </Badge>
                    )}
                    {activeVideo.duration > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t("common.duration")}: {formatVideoDuration(activeVideo.duration)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: My Notes */}
          <TabsContent value="notes" className="mt-0 p-4">
            {activeVideo && (
              <VideoNotesPanel
                videoId={activeVideo.id}
                courseId={course.id}
                topicId={activeTopic?.id || null}
                videoTitle={activeVideo.title}
                canCaptureTimestamp={false}
                getCurrentTime={() => 0}
                seekTo={() => {}}
              />
            )}
          </TabsContent>

          {/* Tab 3: Discussion */}
          <TabsContent value="discussions" className="mt-0">
            <CourseDiscussionsPanel
              courseId={course.id}
              highlightDiscussionId={highlightDiscussionId}
            />
          </TabsContent>

          {/* Tab 4: Resources */}
          <TabsContent value="resources" className="mt-0 p-4">
            <div className="space-y-3">
              {activeTopic && activeTopic.materials.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("learning.topicMaterialsLabel")} · {activeTopic.title}
                  </p>
                  <ul className="space-y-2">
                    {activeTopic.materials.map((m) => (
                      <MaterialRow key={m.id} material={m} />
                    ))}
                  </ul>
                </div>
              )}
              {course.materials.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("learning.courseMaterials")}
                  </p>
                  <ul className="space-y-2">
                    {course.materials.map((m) => (
                      <MaterialRow key={m.id} material={m} />
                    ))}
                  </ul>
                </div>
              )}
              {course.materials.length === 0 && (!activeTopic || activeTopic.materials.length === 0) && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t("learning.noResources")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("learning.noResourcesDesc")}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ─── Assignment panel — hidden until all videos completed ─── */}
        {course.assignment && course.courseCompletion.allCompleted ? (
          <AssignmentPanel course={course} onSubmitted={handleSubmissionSuccess} />
        ) : course.assignment ? (
          <LockedAssignmentCard
            completedVideos={course.courseCompletion.completedVideos}
            totalVideos={course.courseCompletion.totalVideos}
            percent={course.courseCompletion.percent}
          />
        ) : null}
      </main>
    </div>
  );
}

/* ===================== Video player ===================== */

function VideoPlayer({
  video,
  topicTitle,
  courseId,
  topicId,
  onProgress,
  refetchCourse,
}: {
  video: VideoItem;
  topicTitle: string | null;
  courseId: string;
  topicId: string | null;
  onProgress: (update: {
    videoId: string;
    progress: VideoProgressInfo;
    justCompleted: boolean;
  }) => void;
  refetchCourse?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef<number>(0);
  const watchTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const lastPostRef = useRef<number>(0);
  const resumeAppliedRef = useRef<boolean>(false);
  const [expanded, setExpanded] = useState(false);

  // ─── Video Assessment state ───
  // Fetches the questions for THIS video (without correctAnswer — security).
  // The hook is unconditional (rules of hooks); the URL just changes per video.
  const questionsUrl = `/api/student/videos/${video.id}/questions`;
  const {
    data: questionsData,
    loading: questionsLoading,
    refetch: refetchQuestions,
  } = useApiFetch<{
    questions: VideoQuestionData[];
    assessment: VideoAssessmentSummary | null;
  }>(questionsUrl);

  // Currently-displayed question popup (null = no popup shown).
  const [activeQuestion, setActiveQuestion] = useState<VideoQuestionData | null>(null);
  // Map of questionId → selected option index (answers given this session).
  const [answeredMap, setAnsweredMap] = useState<Map<string, number>>(new Map());
  // Currently-selected option in the active popup (null = nothing selected yet).
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  // Brief "Answer saved" confirmation shown after submitting a popup answer.
  const [showFeedback, setShowFeedback] = useState(false);
  // Result returned from POST /assessment — when set, the result overlay shows.
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  // True while the assessment POST is in flight.
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  // Timer ref for the post-submit feedback delay (cleared on unmount/video change).
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Player abstraction + YouTube IFrame player ───
  const playerApiRef = useRef<PlayerApi | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);

  // Local UI state
  const [localCompleted, setLocalCompleted] = useState<boolean>(
    video.progress?.isCompleted || false
  );
  const [posting, setPosting] = useState(false);

  // Are question popups active for this viewing session?
  // They are NOT active if the student has already passed the assessment —
  // in that case the video plays freely and the "Passed" badge is shown.
  const questionsActive = Boolean(
    questionsData &&
      questionsData.questions.length > 0 &&
      questionsData.assessment?.passed !== true
  );

  // Reset on video change
  useEffect(() => {
    lastTimeRef.current = 0;
    watchTimeRef.current = video.progress?.watchTimeSeconds || 0;
    durationRef.current = video.duration || video.progress?.duration || 0;
    lastPostRef.current = 0;
    resumeAppliedRef.current = false;
    setLocalCompleted(video.progress?.isCompleted || false);
    // Tear down any YouTube player + polling from the previous video.
    if (ytPollRef.current) {
      clearInterval(ytPollRef.current);
      ytPollRef.current = null;
    }
    try { ytPlayerRef.current?.destroy?.(); } catch {}
    ytPlayerRef.current = null;
    playerApiRef.current = null;
    // ─── Reset assessment state ───
    setActiveQuestion(null);
    setSelectedAnswer(null);
    setAnsweredMap(new Map());
    setShowFeedback(false);
    setAssessmentResult(null);
    setSubmittingAssessment(false);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, [video.id]);

  // ─── Missed-question catch-up ───
  // Fires when questions data arrives, when a popup/feedback dismisses, or when
  // the student answers a question. If the playhead has already moved past an
  // unanswered question's timestamp (e.g. they resumed a half-watched video, or
  // the questions fetch landed late), pause and surface that question now.
  useEffect(() => {
    if (!questionsActive || !questionsData) return;
    if (activeQuestion || assessmentResult || showFeedback || submittingAssessment) return;
    const api = playerApiRef.current;
    if (!api) return;
    const cur = api.currentTime();
    const missed = questionsData.questions.find(
      (q) => !answeredMap.has(q.id) && cur >= q.timestamp - 0.5
    );
    if (missed && !api.paused()) {
      try {
        api.pause();
        lastTimeRef.current = api.currentTime();
      } catch {}
      setActiveQuestion(missed);
      setSelectedAnswer(null);
    }
  }, [
    questionsActive,
    questionsData,
    activeQuestion,
    assessmentResult,
    showFeedback,
    submittingAssessment,
    answeredMap,
  ]);

  // For HTML5 video: apply resume position once metadata is loaded.
  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (!el) return;
    // Wire up the shared player abstraction for HTML5 video.
    playerApiRef.current = {
      currentTime: () => el.currentTime,
      duration: () => el.duration,
      pause: () => { el.pause(); },
      play: () => { void el.play().catch(() => {}); },
      seekTo: (t) => { el.currentTime = t; },
      paused: () => el.paused,
    };
    durationRef.current = el.duration || durationRef.current;
    if (!resumeAppliedRef.current && video.progress?.lastPosition) {
      // resume within (duration - 2) so we don't immediately fire ended
      const target = Math.min(
        video.progress.lastPosition,
        Math.max(0, (el.duration || 0) - 3)
      );
      try {
        el.currentTime = target;
      } catch {}
      lastTimeRef.current = target;
      resumeAppliedRef.current = true;
    }
  };

  // Core: timeupdate handler — accumulate real watch time.
  const handleTimeUpdate = () => {
    const api = playerApiRef.current;
    if (!api) return;
    const cur = api.currentTime();
    const last = lastTimeRef.current;

    // ─── Question trigger check ───
    // Pause and surface a popup the moment the playhead crosses an unanswered
    // question's timestamp going forward. We require BOTH:
    //   - cur >= q.timestamp    (we're at or past it)
    //   - last < q.timestamp    (we were before it on the previous tick — i.e.
    //                            this is a forward crossing, not a re-tick while
    //                            paused, and not a backward seek landing past it)
    // The 0.5s tolerance from the spec is absorbed by `last < q.timestamp` —
    // timeupdate fires ~4×/s so `last` is at most ~0.25s behind `cur`.
    if (
      questionsActive &&
      !activeQuestion &&
      !assessmentResult &&
      !showFeedback &&
      !submittingAssessment &&
      questionsData
    ) {
      for (const q of questionsData.questions) {
        if (answeredMap.has(q.id)) continue;
        if (cur >= q.timestamp && last < q.timestamp) {
          try {
            api.pause();
            lastTimeRef.current = cur;
          } catch {}
          setActiveQuestion(q);
          setSelectedAnswer(null);
          return; // do NOT accumulate watch time for this tick
        }
      }
    }

    // Watch time tracking — only counts normal forward playback deltas.
    const delta = cur - last;
    // Only count normal playback deltas (0 to 1.5s). This rejects both seeks
    // (large positive deltas) and rewinds (negative deltas).
    if (delta > 0 && delta <= 1.5) {
      watchTimeRef.current += delta;
    }
    // Update lastTime to current — even on seek, so next delta is small.
    lastTimeRef.current = cur;

    // Forward-seek past an unanswered question (YouTube doesn't fire seeked).
    if (delta > 1.5 && questionsActive && !activeQuestion && !assessmentResult && !showFeedback && !submittingAssessment && questionsData) {
      const skipped = questionsData.questions.find((q) => !answeredMap.has(q.id) && cur > q.timestamp + 0.5);
      if (skipped) { try { api.pause(); } catch {} setActiveQuestion(skipped); setSelectedAnswer(null); return; }
    }

    // Throttled server POST every 5 seconds
    const now = Date.now();
    if (now - lastPostRef.current > 5000) {
      lastPostRef.current = now;
      void postProgress(false);
    }
  };

  // Seeked event — log; backend rejects completion if watchTime < 85%.
  // Also catches forward-seek-past-question: if the student scrubs the
  // progress bar past an unanswered question, pause and surface that question
  // so they can't skip it.
  const handleSeeked = () => {
    const api = playerApiRef.current;
    if (!api) return;
    const newTime = api.currentTime();
    lastTimeRef.current = newTime;

    if (
      questionsActive &&
      !activeQuestion &&
      !assessmentResult &&
      !showFeedback &&
      !submittingAssessment &&
      questionsData
    ) {
      // Find the earliest unanswered question we've now skipped past.
      const skipped = questionsData.questions.find(
        (q) => !answeredMap.has(q.id) && newTime > q.timestamp + 0.5
      );
      if (skipped) {
        try {
          api.pause();
        } catch {}
        setActiveQuestion(skipped);
        setSelectedAnswer(null);
      }
    }
  };

  // Ended event — submit final progress with completion hint.
  const handleEnded = () => {
    void postProgress(true);
  };

  const postProgress = useCallback(
    async (isCompletionHint: boolean) => {
      setPosting(true);
      try {
        const res = await apiPost<{
          progress: VideoProgressInfo;
          justCompleted: boolean;
          rejectedCompletion: boolean;
          certificateIssued: boolean;
          certificateId: string | null;
        }>("/api/student/progress", {
          videoId: video.id,
          lastPosition: isCompletionHint && Number.isFinite(durationRef.current) && durationRef.current > 0
            ? durationRef.current : (videoRef.current?.currentTime || 0),
          watchTimeSeconds: watchTimeRef.current,
          duration: Number.isFinite(durationRef.current) ? durationRef.current : 0,
          isCompleted: isCompletionHint,
          ended: isCompletionHint,
        });
        setLocalCompleted(res.progress.isCompleted);
        onProgress({
          videoId: video.id,
          progress: res.progress,
          justCompleted: res.justCompleted,
        });
        if (isCompletionHint && res.rejectedCompletion) {
          toast({
            title: "Completion not recorded",
            description:
              "You need to watch at least 85% of the video before it's marked complete.",
            variant: "destructive",
          });
        }
        // ─── Certificate auto-issued upon course completion ───
        if (res.certificateIssued && res.certificateId) {
          toast({
            title: "🎉 Certificate Issued!",
            description:
              "Congratulations! You've completed the course and your certificate has been automatically generated. View it in My Certificates.",
          });
        }
      } catch {
        // apiPost already surfaces errors
      } finally {
        setPosting(false);
      }
    },
    [video.id, onProgress]
  );

  /* ──────────────────────────────────────────────────────────────
     Video Assessment — submit, retake, dismiss handlers
     ────────────────────────────────────────────────────────────── */

  // Submit the collected answers to the server. The server evaluates
  // correctness (correctAnswer never leaves the server) and returns the
  // score, pass/fail, and per-question correctness for review.
  const submitAssessment = useCallback(
    async (answersMap: Map<string, number>) => {
      if (!questionsData || submittingAssessment) return;
      setSubmittingAssessment(true);
      try {
        const answers = questionsData.questions.map((q) => ({
          questionId: q.id,
          selectedAnswer: answersMap.get(q.id) ?? -1,
        }));
        const res = await apiPost<{ assessment: AssessmentResult }>(
          `/api/student/videos/${video.id}/assessment`,
          { answers }
        );
        setAssessmentResult(res.assessment);
        // Refresh the questions endpoint so the assessment badge reflects
        // the latest passed/attempts state. Defer the course refetch so it
        // doesn't cause a re-render that disrupts video playback.
        refetchQuestions();
        setTimeout(() => refetchCourse?.(), 1000);
        if (res.assessment.passed) {
          toast({
            title: "Assessment Passed!",
            description: `You scored ${res.assessment.score}% (${res.assessment.correctCount}/${res.assessment.totalQuestions} correct).`,
          });
        }
      } catch {
        // apiPost surfaces the error toast
      } finally {
        setSubmittingAssessment(false);
      }
    },
    [questionsData, submittingAssessment, video.id, refetchQuestions, refetchCourse]
  );

  // After a popup answer is submitted + the brief confirmation shows, decide
  // what to do next: either surface the next missed question (e.g. if the
  // student had seeked forward past several), or auto-submit if all answered,
  // or simply resume playback.
  const afterAnswerSubmitted = useCallback(
    (newMap: Map<string, number>) => {
      setShowFeedback(false);
      setActiveQuestion(null);
      setSelectedAnswer(null);

      if (questionsData && newMap.size >= questionsData.questions.length) {
        // All answered → resume playback FIRST (within the user gesture),
        // then auto-submit the assessment in the background.
        try {
          const api = playerApiRef.current;
          if (api && api.paused()) api.play();
        } catch {}
        void submitAssessment(newMap);
        return;
      }

      // If the playhead is already past another unanswered question (e.g.
      // after a forward seek that skipped several), surface the next one
      // instead of resuming playback.
      const api = playerApiRef.current;
      const cur = api?.currentTime() || 0;
      if (questionsData) {
        const nextQ = questionsData.questions.find(
          (q) => !newMap.has(q.id) && cur >= q.timestamp - 0.5
        );
        if (nextQ) {
          setActiveQuestion(nextQ);
          setSelectedAnswer(null);
          return;
        }
      }

      // Otherwise resume normal playback
      try {
        if (api && api.paused()) {
          api.play();
        }
      } catch {}
    },
    [questionsData, submitAssessment]
  );

  // Submit the currently-selected answer for the active popup question.
  // Shows a "Answer saved" confirmation with a Continue button. The user
  // clicks Continue to advance — this keeps the resume within a user gesture
  // (browsers block play() from setTimeout/auto-timer callbacks).
  const handleSubmitAnswer = useCallback(() => {
    if (!activeQuestion || selectedAnswer === null) return;
    const qid = activeQuestion.id;
    const newMap = new Map(answeredMap);
    newMap.set(qid, selectedAnswer);
    setAnsweredMap(newMap);
    setShowFeedback(true);
    // No auto-timer — the Continue button calls handleContinueAfterAnswer.
  }, [activeQuestion, selectedAnswer, answeredMap]);

  // Reset all in-session assessment state and let the student try again.
  // Seeks back to ~1s before the first question so popups re-trigger as the
  // video plays forward.
  const handleRetake = useCallback(() => {
    setAssessmentResult(null);
    setActiveQuestion(null);
    setSelectedAnswer(null);
    setAnsweredMap(new Map());
    setShowFeedback(false);
    setSubmittingAssessment(false);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    const api = playerApiRef.current;
    if (api && questionsData && questionsData.questions.length > 0) {
      const firstTs = questionsData.questions[0].timestamp;
      const target = Math.max(0, firstTs - 1);
      try {
        api.seekTo(target);
        lastTimeRef.current = target;
        api.play();
      } catch {}
    }
  }, [questionsData]);

  // Dismiss the result overlay after a passing attempt — just resume the video.
  const handleDismissResult = useCallback(() => {
    setAssessmentResult(null);
    try {
      const api = playerApiRef.current;
      if (api && api.paused()) {
        api.play();
      }
    } catch {}
  }, []);

  // Cleanup the feedback timer on unmount so it can't fire on stale state.
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  /* YouTube handling — full IFrame Player API integration */
  const ytVideoId = useMemo(() => toYouTubeVideoId(video.videoUrl), [video.videoUrl]);
  const isYouTube = video.source === "YOUTUBE" && ytVideoId !== null;

  // Keep latest handlers in refs so the YouTube polling always calls current closures.
  const handleTimeUpdateRef = useRef<() => void>(() => {});
  const handleEndedRef = useRef<() => void>(() => {});
  handleTimeUpdateRef.current = handleTimeUpdate;
  handleEndedRef.current = handleEnded;

  // Create a YouTube IFrame Player on the container div.
  useEffect(() => {
    if (!isYouTube || !ytVideoId) return;
    const container = ytContainerRef.current;
    if (!container) return;
    let cancelled = false;
    let player: any = null;

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !YT || !YT.Player || !ytContainerRef.current) return;
      player = new YT.Player(ytContainerRef.current, {
        videoId: ytVideoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            const p = e.target;
            ytPlayerRef.current = p;
            playerApiRef.current = {
              currentTime: () => { try { return p.getCurrentTime() || 0; } catch { return 0; } },
              duration: () => { try { return p.getDuration() || 0; } catch { return 0; } },
              pause: () => { try { p.pauseVideo(); } catch {} },
              play: () => { try { p.playVideo(); } catch {} },
              seekTo: (t) => { try { p.seekTo(t, true); } catch {} },
              paused: () => { try { return p.getPlayerState() === 2; } catch { return true; } },
            };
            try { const d = p.getDuration(); if (Number.isFinite(d) && d > 0) durationRef.current = d; } catch {}
            if (!resumeAppliedRef.current && video.progress?.lastPosition) {
              const dur = durationRef.current;
              if (dur > 0) {
                const target = Math.min(video.progress.lastPosition, Math.max(0, dur - 3));
                try { p.seekTo(target, true); } catch {}
                lastTimeRef.current = target;
                resumeAppliedRef.current = true;
              }
            }
          },
          onStateChange: (e: any) => {
            const state = e.data;
            if (state === 1) { // PLAYING
              if (ytPollRef.current) clearInterval(ytPollRef.current);
              ytPollRef.current = setInterval(() => { handleTimeUpdateRef.current(); }, 250);
            } else if (state === 0) { // ENDED
              if (ytPollRef.current) { clearInterval(ytPollRef.current); ytPollRef.current = null; }
              handleEndedRef.current();
            } else {
              if (ytPollRef.current) { clearInterval(ytPollRef.current); ytPollRef.current = null; }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (ytPollRef.current) { clearInterval(ytPollRef.current); ytPollRef.current = null; }
      try { player?.destroy?.(); } catch {}
      ytPlayerRef.current = null;
      if (isYouTube) playerApiRef.current = null;
    };
  }, [isYouTube, ytVideoId, video.id, expanded]);

  // Pre-compute the assessment status badge + overlay JSX so both the compact
  // and expanded views can render the same overlays without duplication.
  const currentAssessment: VideoAssessmentSummary | null =
    assessmentResult
      ? {
          score: assessmentResult.score,
          passed: assessmentResult.passed,
          attempts: assessmentResult.attempts,
        }
      : questionsData?.assessment ?? null;

  const hasQuestions = Boolean(questionsData && questionsData.questions.length > 0);

  const assessmentStatusBadge = hasQuestions ? (
    currentAssessment?.passed === true ? (
      <Badge className="bg-success/15 text-success border-transparent">
        <CheckCircle2 className="h-3 w-3" /> Assessment Passed ✓
      </Badge>
    ) : currentAssessment && currentAssessment.attempts > 0 ? (
      <Badge className="bg-destructive/10 text-destructive border-transparent">
        <AlertTriangle className="h-3 w-3" /> Assessment Failed — Retake Needed
      </Badge>
    ) : (
      <Badge className="bg-warning/15 text-warning border-transparent">
        <ClipboardList className="h-3 w-3" /> Assessment Required
      </Badge>
    )
  ) : null;

  // Overlay JSX rendered on top of the video element (question popup or
  // assessment result card). Same JSX reused in compact + expanded views.
  // Manually continue after the feedback confirmation — clears the feedback
  // timer and advances immediately (submits assessment or resumes playback).
  const handleContinueAfterAnswer = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    // Resume playback IMMEDIATELY — directly in the click handler so it's
    // within the user gesture and before any state updates / re-renders
    // from the assessment submission can interfere.
    try {
      const api = playerApiRef.current;
      if (api && api.paused()) api.play();
    } catch {}
    // Then advance (submit assessment or check for next question)
    afterAnswerSubmitted(answeredMap);
  }, [answeredMap, afterAnswerSubmitted]);

  // Skip the current question without answering — dismisses the popup and
  // resumes the video. The question is marked as "answered" with -1 (skipped)
  // so the missed-question catch-up effect doesn't immediately re-trigger it.
  // The assessment will treat -1 as "no answer" (wrong) if the user doesn't
  // retake.
  const handleSkipQuestion = useCallback(() => {
    if (activeQuestion) {
      const newMap = new Map(answeredMap);
      newMap.set(activeQuestion.id, -1);
      setAnsweredMap(newMap);
    }
    setActiveQuestion(null);
    setSelectedAnswer(null);
    setShowFeedback(false);
    try {
      const api = playerApiRef.current;
      if (api && api.paused()) api.play();
    } catch {}
  }, [activeQuestion, answeredMap]);

  const videoOverlays = (
    <>
      {activeQuestion && (
        <QuestionOverlay
          question={activeQuestion}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          onSelect={(idx) => setSelectedAnswer(idx)}
          onSubmit={handleSubmitAnswer}
          onContinue={handleContinueAfterAnswer}
          onSkip={handleSkipQuestion}
          answeredCount={answeredMap.size}
          totalCount={questionsData?.questions.length ?? 0}
        />
      )}
      {assessmentResult && (
        <AssessmentResultOverlay
          result={assessmentResult}
          onRetake={handleRetake}
          onDismiss={handleDismissResult}
          submitting={submittingAssessment}
        />
      )}
      {/* Subtle "loading questions" hint while the questions fetch is in flight
          and we don't yet know whether this video has them. */}
      {questionsLoading && !questionsData && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-sm">
          <Clock className="h-3 w-3 animate-spin" /> Loading quiz…
        </div>
      )}
    </>
  );

  // Render the right player
  return (
    <>
      {/* Expanded fullscreen overlay — rendered as a portal-like fixed layer */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Top bar with title + close */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent backdrop-blur">
            <div className="min-w-0 flex-1">
              {topicTitle && (
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/60 mb-0.5 truncate">
                  {topicTitle}
                </p>
              )}
              <p className="text-sm font-semibold text-white truncate">{video.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {localCompleted && (
                <Badge className="bg-success/20 text-success border-transparent">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </Badge>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                aria-label="Exit fullscreen"
              >
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Exit fullscreen</span>
              </button>
            </div>
          </div>
          {/* Video fills the remaining space */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
            <div className="relative w-full h-full flex items-center justify-center">
              {isYouTube ? (
                <div
                  key={video.id}
                  ref={ytContainerRef}
                  className="w-full h-full"
                />
              ) : (
                <video
                  key={video.id}
                  ref={videoRef}
                  src={video.videoUrl}
                  poster={video.thumbnail || undefined}
                  controls
                  autoPlay
                  className="w-full h-full max-h-full object-contain"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onSeeked={handleSeeked}
                  onEnded={handleEnded}
                />
              )}
              {videoOverlays}
            </div>
          </div>
        </div>
      )}

      {/* ─── Default compact view ─── */}
      <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-lg ring-1 ring-black/[0.02]">
        {/* Video area — full width, rounded, subtle shadow */}
        <div className="bg-card p-3 sm:p-4">
          <div className="relative mx-auto aspect-video w-full max-w-[720px] overflow-hidden rounded-xl bg-black shadow-md ring-1 ring-black/10">
            {expanded ? (
              // When expanded, the video element lives in the fullscreen
              // overlay above. Render a placeholder here so videoRef/
              // ytContainerRef don't point at a hidden second video element.
              <div className="flex h-full w-full items-center justify-center text-white/40">
                <PlayCircle className="h-8 w-8" />
              </div>
            ) : isYouTube ? (
              <div
                key={video.id}
                ref={ytContainerRef}
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <video
                key={video.id}
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnail || undefined}
                controls
                autoPlay
                className="absolute inset-0 h-full w-full"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onSeeked={handleSeeked}
                onEnded={handleEnded}
              />
            )}
            {/* Expand button overlay */}
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/90 transition-colors z-10 shadow-lg ring-1 ring-white/10"
                aria-label="Expand video to fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Expand</span>
              </button>
            )}
            {!expanded && videoOverlays}
          </div>
        </div>

        <CardContent className="space-y-3 p-4 sm:p-5">
          {/* Status row — badges + posting indicator */}
          <div className="flex flex-wrap items-center gap-2">
            {posting && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {hasQuestions && (
              <Badge variant="outline" className="border-primary/30 text-primary gap-1">
                <ListChecks className="h-3 w-3" />
                {questionsData!.questions.length} Question{questionsData!.questions.length > 1 ? "s" : ""}
              </Badge>
            )}
            {assessmentStatusBadge}
            {localCompleted ? (
              <Badge className="bg-teal-50 text-teal-700 border-transparent">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-border">
                <PlayCircle className="h-3 w-3" /> In progress
              </Badge>
            )}
          </div>

          {/* Assessment hint */}
          {hasQuestions && (
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <ListChecks className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
              <span>
                This lesson includes {questionsData!.questions.length} in-video question{questionsData!.questions.length > 1 ? "s" : ""}.
                {" "}
                {currentAssessment?.passed === true
                  ? "You've passed the assessment — the video will play without interruption."
                  : currentAssessment && currentAssessment.attempts > 0
                    ? `Previous score: ${currentAssessment.score}%. Retake the assessment by watching again.`
                    : "Answer each one as it appears to complete the assessment."}
              </span>
            </p>
          )}

          {/* YouTube videos are fully embedded + auto-tracked via the IFrame
              Player API. No manual "Mark as complete" button needed. */}
        </CardContent>
      </Card>
    </>
  );
}

/* ===================== Helpers ===================== */

/* ──────────────────────────────────────────────────────────────
   QuestionOverlay — inline popup rendered on top of the video
   ──────────────────────────────────────────────────────────────
   Shows one question at a time. The student must select an option and
   submit before the video can resume. After submit, a brief "Answer
   saved" confirmation is shown (the actual correct/incorrect feedback
   is deferred to the final assessment result, since correctAnswer is
   never sent to the client for security reasons). */
function QuestionOverlay({
  question,
  selectedAnswer,
  showFeedback,
  onSelect,
  onSubmit,
  onContinue,
  onSkip,
  answeredCount,
  totalCount,
}: {
  question: VideoQuestionData;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onSelect: (idx: number) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onSkip: () => void;
  answeredCount: number;
  totalCount: number;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={`Question ${answeredCount + 1} of ${totalCount}`}
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl border border-accent/20 bg-card shadow-2xl ring-1 ring-accent/10 overflow-hidden">
        {/* Header strip — sage themed (fixed at top) */}
        <div className="flex items-center justify-between gap-2 border-b border-accent/15 bg-gradient-to-r from-soft-sage to-transparent px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-primary shrink-0">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary truncate">
              Quick Check
            </span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
            {answeredCount + 1} / {totalCount}
          </span>
        </div>

        {/* Body — scrollable if content is tall */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-5 space-y-4">
          <p className="text-base font-semibold text-foreground leading-relaxed">
            {question.question}
          </p>

          <div className="space-y-2">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={showFeedback}
                  onClick={() => onSelect(idx)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150",
                    isSelected
                      ? "border-accent bg-soft-sage ring-1 ring-accent/30"
                      : "border-border bg-card hover:border-accent/40 hover:bg-soft-sage/40",
                    showFeedback && "cursor-default opacity-70"
                  )}
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
                      isSelected
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground group-hover:border-accent/50"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={cn(
                    "text-sm",
                    isSelected ? "font-medium text-foreground" : "text-foreground"
                  )}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer — always visible at the bottom (submit / skip / continue) */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border px-4 py-3 bg-card">
          <p className="text-[11px] text-muted-foreground">
            {showFeedback
              ? "Answer recorded."
              : "Pick an answer to continue."}
          </p>
          {showFeedback ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2.5 py-1.5 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
              <Button
                onClick={onContinue}
                size="sm"
                className="gap-1.5 shadow-sm"
              >
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={onSkip}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={onSubmit}
                disabled={selectedAnswer === null}
                size="sm"
                className="gap-2 shadow-sm"
              >
                Submit Answer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   AssessmentResultOverlay — shown after all questions are answered
   ──────────────────────────────────────────────────────────────
   Reveals the final score, pass/fail status, and per-question
   correctness (the only place where correctAnswer is revealed — the
   server returns it in the POST response). */
function AssessmentResultOverlay({
  result,
  onRetake,
  onDismiss,
  submitting,
}: {
  result: AssessmentResult;
  onRetake: () => void;
  onDismiss: () => void;
  submitting: boolean;
}) {
  const passed = result.passed;
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Assessment result"
    >
      <div className="w-full max-w-md max-h-full overflow-y-auto scrollbar-thin rounded-xl border border-border bg-card shadow-2xl ring-1 ring-black/5">
        {/* Header — pass/fail banner */}
        <div
          className={cn(
            "flex flex-col items-center text-center px-5 py-5 border-b",
            passed ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
          )}
        >
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full mb-2.5",
              passed ? "bg-success/15" : "bg-destructive/10"
            )}
          >
            {passed ? (
              <CheckCircle2 className="h-7 w-7 text-success" />
            ) : (
              <AlertTriangle className="h-7 w-7 text-destructive" />
            )}
          </div>
          <h3 className={cn(
            "text-lg font-semibold",
            passed ? "text-success" : "text-destructive"
          )}>
            {passed ? "Assessment Passed!" : "Assessment Failed"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {passed
              ? `You scored ${result.score}% — ${result.correctCount}/${result.totalQuestions} correct.`
              : `Score: ${result.score}%. You need 70% to pass. You can retake the assessment.`}
          </p>
          {/* Score ring */}
          <div className="mt-3 w-full max-w-[220px]">
            <Progress
              value={result.score}
              className={cn(
                "h-2 bg-muted",
                passed
                  ? "[&_[data-slot=progress-indicator]]:bg-success"
                  : "[&_[data-slot=progress-indicator]]:bg-destructive"
              )}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
              <span>0%</span>
              <span className="font-semibold text-foreground">{result.score}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Per-question review */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Review
          </p>
          {result.answers.map((a, idx) => (
            <div
              key={a.questionId}
              className={cn(
                "rounded-lg border p-3",
                a.correct
                  ? "border-success/20 bg-success/5"
                  : "border-destructive/20 bg-destructive/5"
              )}
            >
              <div className="flex items-start gap-2">
                {a.correct ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    <span className="text-muted-foreground mr-1">Q{idx + 1}.</span>
                    {a.question}
                  </p>
                  {!a.correct && a.selectedAnswer >= 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Your answer:{" "}
                      <span className="text-destructive font-medium line-clamp-1">
                        {a.options[a.selectedAnswer]}
                      </span>
                    </p>
                  )}
                  {!a.correct && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Correct:{" "}
                      <span className="text-success font-medium line-clamp-1">
                        {a.options[a.correctAnswer]}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3">
          {passed ? (
            <Button onClick={onDismiss} size="sm" className="gap-2 shadow-sm">
              <CheckCircle2 className="h-4 w-4" /> Continue watching
            </Button>
          ) : (
            <Button
              onClick={onRetake}
              disabled={submitting}
              size="sm"
              className="gap-2 shadow-sm"
            >
              <RefreshCw className={cn("h-4 w-4", submitting && "animate-spin")} />
              {submitting ? "Retaking…" : "Retake Assessment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MaterialRow({ material }: { material: MaterialItem }) {
  const { t } = useI18n();
  const isLink = material.type === "LINK";
  const Icon = isLink ? LinkIcon : FileText;
  return (
    <li>
      <a
        href={material.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-accent/40 hover:bg-soft-sage/40 transition-all duration-200"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0 ring-1 ring-accent/20">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">{material.title}</p>
          {material.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{material.description}</p>
          )}
          {material.topic && (
            <p className="text-xs text-muted-foreground mt-0.5">Topic: {material.topic.title}</p>
          )}
        </div>
        <span className="text-xs font-medium text-accent flex items-center gap-1 shrink-0">
          {isLink ? "Open" : "Download"} <Download className="h-3 w-3" />
        </span>
      </a>
    </li>
  );
}

/* ===================== Locked Assignment Placeholder ===================== */

function LockedAssignmentCard({
  completedVideos,
  totalVideos,
  percent,
}: {
  completedVideos: number;
  totalVideos: number;
  percent: number;
}) {
  const { t } = useI18n();
  return (
    <Card className="border-dashed border-border bg-muted/20 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0 ring-1 ring-border">
            <Lock className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-foreground">
                Assignment Locked
              </h3>
              <Badge className="bg-muted text-muted-foreground border-transparent">Locked</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              Complete all video lessons in this course to unlock your assignment.
              The assignment details will appear here once you finish every lesson.
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{completedVideos}/{totalVideos} lessons completed</span>
                <span className="font-semibold text-foreground">{percent}%</span>
              </div>
              <Progress
                value={percent}
                className={`h-2 bg-muted ${percent === 100 ? "[&_[data-slot=progress-indicator]]:bg-success" : "[&_[data-slot=progress-indicator]]:bg-accent"}`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentPanel({
  course,
  onSubmitted,
}: {
  course: CourseDetail;
  onSubmitted: () => void;
}) {
  const { t } = useI18n();
  const navigate = useAppStore((s) => s.navigate);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const assignment = course.assignment!;
  const submission = course.submission;
  const completed = course.courseCompletion.allCompleted;

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
      await onSubmitted();
      if (res.certificateIssued) {
        toast({
          title: "Submitted & certificate issued!",
          description: "Your submission was received and a certificate was automatically issued.",
        });
      } else {
        toast({
          title: "Submission received",
          description: "Your assignment has been submitted for review.",
        });
      }
    } catch {
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="card-elevated border-accent/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <ClipboardList className="h-4 w-4" />
          </span>
          {assignment.title}
        </CardTitle>
        <CardDescription>
          Course assignment · {completed ? "Unlocked" : "Locked"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!completed ? (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Assignment locked</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete all video lessons in this course to unlock your assignment.
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{course.courseCompletion.completedVideos}/{course.courseCompletion.totalVideos} lessons</span>
                    <span>{course.courseCompletion.percent}%</span>
                  </div>
                  <Progress value={course.courseCompletion.percent} className="h-1.5 bg-muted [&_[data-slot=progress-indicator]]:bg-accent" />
                </div>
              </div>
            </div>
          </div>
        ) : submission ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-success/15 text-success border-transparent">
                <CheckCircle2 className="h-3 w-3" /> Submitted
              </Badge>
              {submission.status === "REVIEWED" && (
                <Badge className="bg-accent/10 text-accent border-transparent">Reviewed</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Submitted on {formatDateTime(submission.submittedAt)}
            </p>
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <Download className="h-3.5 w-3.5" /> View your submission
            </a>
            {submission.reviewNotes && (
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reviewer notes</p>
                <p className="text-sm text-foreground">{submission.reviewNotes}</p>
              </div>
            )}
            {course.certificateTemplate?.isEnabled && (
              <Button variant="outline" size="sm" onClick={() => navigate(["student", "certificates"])} className="gap-2 shadow-sm">
                <Award className="h-4 w-4" /> View your certificate
              </Button>
            )}
            {assignment.allowResubmission && (
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                Resubmission is allowed — pick a new file below to replace your submission.
              </p>
            )}
          </div>
        ) : null}

        {completed && (!submission || assignment.allowResubmission) && (
          <div className="space-y-3">
            {assignment.description && (
              <p className="text-sm text-foreground">{assignment.description}</p>
            )}
            {assignment.instructions && (
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Instructions</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
            )}
            {assignment.fileUrl && (
              <a
                href={assignment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> Download assignment brief
              </a>
            )}
            {assignment.dueDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent" /> Due {formatDateTime(assignment.dueDate)}
              </p>
            )}
            <div className="border-t border-border pt-4 space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Upload your submission
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-foreground file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
              <Button onClick={handleSubmit} disabled={!selectedFile || uploading} className="gap-2 shadow-sm">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Submit Assignment"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Local helper for YouTube URL parsing
function toYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
      if (m) return m[2];
    }
    return null;
  } catch {
    return null;
  }
}

function formatVideoDuration(seconds: number): string {
  if (seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

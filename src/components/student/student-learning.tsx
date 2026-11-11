"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import { useApiFetch, apiPost, apiUpload } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, PlayCircle, CheckCircle2, Lock, FileText, Download, Link as LinkIcon,
  Upload, Award, ClipboardList, AlertTriangle, Clock, Video as VideoIcon, Info,
  Maximize2, Minimize2, ChevronLeft, ChevronRight, BookOpen, Sparkles,
  HelpCircle, XCircle, RefreshCw, ListChecks,
} from "lucide-react";
import { formatDateTime } from "@/types";

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

export function StudentLearning({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { data, loading, error, refetch, setData } = useApiFetch<CourseResponse>(
    `/api/student/courses/${courseId}`
  );

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
      <div className="space-y-5">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Skeleton className="h-[420px] rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Button>
        <EmptyState
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Couldn't open course"
          description={error}
          action={<Button onClick={onBack}>Back to courses</Button>}
        />
      </div>
    );
  }

  if (!data?.course) {
    return (
      <EmptyState
        icon={<PlayCircle className="h-5 w-5" />}
        title="Course not found"
        description="This course may have been removed or is not accessible."
        action={<Button onClick={onBack}>Back to courses</Button>}
      />
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
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          totalVideos: total,
          completedVideos: completed,
          percent,
          allCompleted: total > 0 && completed === total,
        };
      })(),
    };
    setData({ course: newCourse });

    if (updated.justCompleted) {
      toast({
        title: "Lesson completed",
        description: "Great work! Your progress has been saved.",
      });
    }
  }

  async function handleSubmissionSuccess() {
    await refetch();
    toast({
      title: "Assignment submitted",
      description: "Your submission has been received.",
    });
  }

  return (
    <div className="space-y-5">
      {/* ─── Premium header ─── */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button variant="outline" size="icon" onClick={onBack} className="shrink-0 h-9 w-9" aria-label="Back to courses">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                {course.category && (
                  <Badge variant="outline" className="text-[11px] border-border text-muted-foreground">
                    {course.category}
                  </Badge>
                )}
                <Badge
                  className={
                    course.accessType === "FREE"
                      ? "bg-success/15 text-success border-transparent"
                      : "bg-primary text-primary-foreground border-transparent"
                  }
                >
                  {course.accessType === "FREE" ? "Free" : "Paid"}
                </Badge>
              </div>
              <h1 className="font-heading text-lg md:text-xl font-semibold text-foreground truncate">
                {course.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <span className="text-xs font-medium text-foreground">
                {course.courseCompletion.completedVideos}/{course.courseCompletion.totalVideos} lessons
              </span>
              <span className="text-[11px] text-muted-foreground">completed</span>
            </div>
            <div className="flex items-center gap-2.5 min-w-[160px]">
              <Progress
                value={course.courseCompletion.percent}
                className={`h-2 w-32 bg-muted ${course.courseCompletion.allCompleted ? "[&_[data-slot=progress-indicator]]:bg-success" : "[&_[data-slot=progress-indicator]]:bg-accent"}`}
              />
              <span className="text-sm font-semibold text-foreground tabular-nums">{course.courseCompletion.percent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile: stacked. Desktop: split. ─── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Left: player + materials + assignment */}
        <div className="space-y-5 min-w-0">
          {activeVideo ? (
            <VideoPlayer
              key={activeVideo.id}
              video={activeVideo}
              topicTitle={activeTopic?.title || null}
              onProgress={handleProgressUpdate}
              prevVideo={prevVideo}
              nextVideo={nextVideo}
              onNavigateLesson={(id) => setUserSelectedVideoId(id)}
              refetchCourse={refetch}
            />
          ) : (
            <EmptyState
              icon={<VideoIcon className="h-5 w-5" />}
              title="No videos in this course"
              description="This course doesn't have any published video lessons yet."
            />
          )}

          {/* Topic materials */}
          {activeTopic && activeTopic.materials.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <FileText className="h-4 w-4" />
                  </span>
                  Materials · {activeTopic.title}
                </CardTitle>
                <CardDescription>Reference documents for this topic</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {activeTopic.materials.map((m) => (
                    <MaterialRow key={m.id} material={m} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Assignment panel — completely hidden until ALL videos are completed.
              Before completion, show a locked placeholder that does NOT reveal
              the assignment title, description, or instructions. */}
          {course.assignment && course.courseCompletion.allCompleted ? (
            <AssignmentPanel
              course={course}
              onSubmitted={handleSubmissionSuccess}
            />
          ) : course.assignment ? (
            <LockedAssignmentCard
              completedVideos={course.courseCompletion.completedVideos}
              totalVideos={course.courseCompletion.totalVideos}
              percent={course.courseCompletion.percent}
            />
          ) : null}

          {/* All materials (course-level) */}
          {course.materials.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <FileText className="h-4 w-4" />
                  </span>
                  All Course Materials
                </CardTitle>
                <CardDescription>
                  {course.materials.length} document{course.materials.length > 1 ? "s" : ""} attached to this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.materials.map((m) => (
                    <MaterialRow key={m.id} material={m} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: course sidebar */}
        <Card className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] flex flex-col shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border bg-gradient-to-br from-soft-sage/60 to-card">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              Course Lessons
            </CardTitle>
            <CardDescription className="mt-1">
              {course.topics.length} topic{course.topics.length > 1 ? "s" : ""} · {course.courseCompletion.totalVideos} lessons
            </CardDescription>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{course.courseCompletion.percent}%</span>
              </div>
              <Progress
                value={course.courseCompletion.percent}
                className={`h-1.5 bg-muted ${course.courseCompletion.allCompleted ? "[&_[data-slot=progress-indicator]]:bg-success" : "[&_[data-slot=progress-indicator]]:bg-accent"}`}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-15rem)] scrollbar-thin">
            {course.topics.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6 text-center">
                No topics published yet.
              </p>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={[course.topics[0]?.id].filter(Boolean) as string[]}
                className="px-3 py-2"
              >
                {course.topics.map((topic, topicIdx) => {
                  const completedInTopic = topic.videos.filter(
                    (v) => v.progress?.isCompleted
                  ).length;
                  const isActiveTopic = topic.id === activeTopic?.id;
                  const topicComplete = completedInTopic === topic.videos.length && topic.videos.length > 0;
                  return (
                    <AccordionItem key={topic.id} value={topic.id} className="border-b border-border/60 last:border-b-0">
                      <AccordionTrigger className="hover:no-underline px-2 py-3 rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${
                            topicComplete
                              ? "bg-success/15 text-success"
                              : isActiveTopic
                                ? "bg-accent/15 text-accent"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {topicComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : topicIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isActiveTopic ? "text-accent" : "text-foreground"}`}>
                              {topic.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {completedInTopic}/{topic.videos.length} lessons
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-1">
                        <ul className="space-y-0.5 ml-9">
                          {topic.videos.map((video, videoIdx) => {
                            const isActive = video.id === activeVideo?.id;
                            const completed = video.progress?.isCompleted;
                            return (
                              <li key={video.id} className="relative">
                                {/* Vertical connecting line */}
                                {videoIdx < topic.videos.length - 1 && (
                                  <span className="absolute left-3 top-7 bottom-0 w-px bg-border" aria-hidden />
                                )}
                                <button
                                  onClick={() => setUserSelectedVideoId(video.id)}
                                  className={`group flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-all duration-200 ${
                                    isActive
                                      ? "bg-soft-sage text-primary"
                                      : "text-foreground hover:bg-muted/60"
                                  }`}
                                >
                                  {/* Icon: status indicator */}
                                  <span className="relative z-10 mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-card ring-1 ring-border">
                                    {completed ? (
                                      <CheckCircle2 className="h-4 w-4 text-success" />
                                    ) : isActive ? (
                                      <PlayCircle className="h-4 w-4 text-primary" />
                                    ) : (
                                      <PlayCircle className="h-4 w-4 text-muted-foreground/70 group-hover:text-foreground" />
                                    )}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className={`flex items-center gap-1.5 truncate ${isActive ? "font-semibold text-primary" : "font-medium text-foreground group-hover:text-accent"}`}>
                                      <span className="truncate">{video.title}</span>
                                      {video.hasQuestions && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className={cn(
                                              "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold shrink-0",
                                              video.assessmentPassed === true
                                                ? "bg-success/15 text-success"
                                                : video.assessmentPassed === false
                                                  ? "bg-destructive/10 text-destructive"
                                                  : "bg-accent/10 text-accent"
                                            )}>
                                              <HelpCircle className="h-3 w-3" />
                                              {video.questionCount}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent side="right">
                                            {video.assessmentPassed === true
                                              ? "Assessment passed"
                                              : video.assessmentPassed === false
                                                ? "Assessment not passed — retake needed"
                                                : `${video.questionCount} question${video.questionCount > 1 ? "s" : ""} in this video`}
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </span>
                                    {video.duration > 0 && (
                                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                                        {formatVideoDuration(video.duration)}
                                      </span>
                                    )}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ===================== Video player ===================== */

function VideoPlayer({
  video,
  topicTitle,
  onProgress,
  prevVideo,
  nextVideo,
  onNavigateLesson,
  refetchCourse,
}: {
  video: VideoItem;
  topicTitle: string | null;
  onProgress: (update: {
    videoId: string;
    progress: VideoProgressInfo;
    justCompleted: boolean;
  }) => void;
  prevVideo: VideoItem | null;
  nextVideo: VideoItem | null;
  onNavigateLesson: (id: string) => void;
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

  // YouTube completion timer
  const ytStartRef = useRef<number | null>(null);
  const ytTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytWatchSecondsRef = useRef<number>(0);
  const [ytCanMarkComplete, setYtCanMarkComplete] = useState(false);

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
    setYtCanMarkComplete(false);
    ytWatchSecondsRef.current = 0;
    if (ytTimerRef.current) {
      clearInterval(ytTimerRef.current);
      ytTimerRef.current = null;
    }
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
    const el = videoRef.current;
    if (!el) return;
    const cur = el.currentTime;
    const missed = questionsData.questions.find(
      (q) => !answeredMap.has(q.id) && cur >= q.timestamp - 0.5
    );
    if (missed && !el.paused) {
      try {
        el.pause();
        lastTimeRef.current = el.currentTime;
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
    const el = videoRef.current;
    if (!el) return;
    const cur = el.currentTime;
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
            el.pause();
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
    const el = videoRef.current;
    if (!el) return;
    const newTime = el.currentTime;
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
          el.pause();
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
          lastPosition: videoRef.current?.currentTime || 0,
          watchTimeSeconds: watchTimeRef.current,
          duration: durationRef.current,
          isCompleted: isCompletionHint,
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

  // Manual "Mark complete" for YouTube videos
  const markYtComplete = async () => {
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
        lastPosition: durationRef.current,
        watchTimeSeconds: ytWatchSecondsRef.current,
        duration: durationRef.current,
        isCompleted: true,
      });
      setLocalCompleted(res.progress.isCompleted);
      onProgress({
        videoId: video.id,
        progress: res.progress,
        justCompleted: res.justCompleted,
      });
      if (res.justCompleted) {
        toast({
          title: "Lesson completed",
          description: "Great work! Your progress has been saved.",
        });
      }
      if (res.rejectedCompletion) {
        toast({
          title: "Completion not recorded",
          description:
            "You need to keep the video playing for at least 85% of its duration.",
          variant: "destructive",
        });
      }
      // Certificate auto-issued upon course completion
      if (res.certificateIssued && res.certificateId) {
        toast({
          title: "🎉 Certificate Issued!",
          description:
            "Congratulations! You've completed the course and your certificate has been automatically generated. View it in My Certificates.",
        });
      }
    } catch {
    } finally {
      setPosting(false);
    }
  };

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
        // the latest passed/attempts state, and refresh the parent course
        // data so the sidebar + course completion update.
        refetchQuestions();
        refetchCourse?.();
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
        // All answered → auto-submit the assessment
        void submitAssessment(newMap);
        return;
      }

      // If the playhead is already past another unanswered question (e.g.
      // after a forward seek that skipped several), surface the next one
      // instead of resuming playback.
      const cur = videoRef.current?.currentTime || 0;
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
        const el = videoRef.current;
        if (el && el.paused) {
          void el.play().catch(() => {});
        }
      } catch {}
    },
    [questionsData, submitAssessment]
  );

  // Submit the currently-selected answer for the active popup question.
  // Shows a brief "Answer saved" confirmation, then advances via
  // afterAnswerSubmitted.
  const handleSubmitAnswer = useCallback(() => {
    if (!activeQuestion || selectedAnswer === null) return;
    const qid = activeQuestion.id;
    const newMap = new Map(answeredMap);
    newMap.set(qid, selectedAnswer);
    setAnsweredMap(newMap);
    setShowFeedback(true);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      feedbackTimerRef.current = null;
      afterAnswerSubmitted(newMap);
    }, 1200);
  }, [activeQuestion, selectedAnswer, answeredMap, afterAnswerSubmitted]);

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
    const el = videoRef.current;
    if (el && questionsData && questionsData.questions.length > 0) {
      const firstTs = questionsData.questions[0].timestamp;
      const target = Math.max(0, firstTs - 1);
      try {
        el.currentTime = target;
        lastTimeRef.current = target;
        void el.play().catch(() => {});
      } catch {}
    }
  }, [questionsData]);

  // Dismiss the result overlay after a passing attempt — just resume the video.
  const handleDismissResult = useCallback(() => {
    setAssessmentResult(null);
    try {
      const el = videoRef.current;
      if (el && el.paused) {
        void el.play().catch(() => {});
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

  /* YouTube handling */
  const ytEmbedUrl = useMemo(() => toYouTubeEmbed(video.videoUrl), [video.videoUrl]);
  const isYouTube = video.source === "YOUTUBE" && ytEmbedUrl !== null;

  // YouTube timer: accumulate watch time + enable mark-complete after 85%.
  useEffect(() => {
    if (!isYouTube) return;
    if (ytTimerRef.current) clearInterval(ytTimerRef.current);
    ytStartRef.current = Date.now();

    ytTimerRef.current = setInterval(() => {
      ytWatchSecondsRef.current = (Date.now() - (ytStartRef.current || Date.now())) / 1000;
      const dur = durationRef.current;
      if (dur > 0 && ytWatchSecondsRef.current >= dur * 0.85) {
        setYtCanMarkComplete(true);
      }
    }, 1000);

    return () => {
      if (ytTimerRef.current) {
        clearInterval(ytTimerRef.current);
        ytTimerRef.current = null;
      }
    };
  }, [isYouTube, video.id]);

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
  const videoOverlays = (
    <>
      {activeQuestion && (
        <QuestionOverlay
          question={activeQuestion}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          onSelect={(idx) => setSelectedAnswer(idx)}
          onSubmit={handleSubmitAnswer}
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
              {video.source === "YOUTUBE" && ytEmbedUrl ? (
                <iframe
                  key={video.id}
                  src={ytEmbedUrl}
                  title={video.title}
                  className="w-full h-full max-w-[1600px]"
                  style={{ aspectRatio: "16 / 9" }}
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
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
      <Card className="overflow-hidden p-0 shadow-sm">
        {/* Compact video area — centered, max 640px, dark frame */}
        <div className="bg-gradient-to-b from-foreground/[0.03] to-card p-4 md:p-6">
          <div className="relative mx-auto overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/20" style={{ maxWidth: "640px" }}>
            <div className="aspect-video w-full flex items-center justify-center relative">
              {video.source === "YOUTUBE" && ytEmbedUrl ? (
                <iframe
                  key={video.id}
                  src={ytEmbedUrl}
                  title={video.title}
                  className="w-full h-full"
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  key={video.id}
                  ref={videoRef}
                  src={video.videoUrl}
                  poster={video.thumbnail || undefined}
                  controls
                  className="w-full h-full"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onSeeked={handleSeeked}
                  onEnded={handleEnded}
                />
              )}
              {/* Expand button overlay */}
              <button
                onClick={() => setExpanded(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/90 transition-colors z-10 shadow-lg ring-1 ring-white/10"
                aria-label="Expand video to fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Expand</span>
              </button>
              {videoOverlays}
            </div>
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Video info */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {topicTitle && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-1.5">
                  {topicTitle}
                </p>
              )}
              <h2 className="font-heading text-lg font-semibold text-foreground">{video.title}</h2>
              {video.description && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{video.description}</p>
              )}
              {hasQuestions && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-accent" />
                  This lesson includes {questionsData!.questions.length} in-video question{questionsData!.questions.length > 1 ? "s" : ""}.
                  {" "}
                  {currentAssessment?.passed === true
                    ? "You've passed the assessment — the video will play without interruption."
                    : currentAssessment && currentAssessment.attempts > 0
                      ? `Previous score: ${currentAssessment.score}%. Retake the assessment by watching again.`
                      : "Answer each one as it appears to complete the assessment."}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {posting && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3 animate-spin" /> Saving...
                </span>
              )}
              {hasQuestions && (
                <Badge variant="outline" className="border-accent/30 text-accent gap-1">
                  <ListChecks className="h-3 w-3" />
                  {questionsData!.questions.length} Question{questionsData!.questions.length > 1 ? "s" : ""}
                </Badge>
              )}
              {assessmentStatusBadge}
              {localCompleted ? (
                <Badge className="bg-success/15 text-success border-transparent">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground border-border">
                  <PlayCircle className="h-3 w-3" /> In progress
                </Badge>
              )}
            </div>
          </div>

          {/* Prev / Next navigation */}
          {(prevVideo || nextVideo) && (
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => prevVideo && onNavigateLesson(prevVideo.id)}
                disabled={!prevVideo}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <span className="text-xs text-muted-foreground">Lesson</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nextVideo && onNavigateLesson(nextVideo.id)}
                disabled={!nextVideo}
                className="gap-2"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* YouTube: explain limitation + show manual mark-complete */}
          {isYouTube && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3.5 space-y-2">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    YouTube video tracking
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    YouTube videos cannot report precise playback events to us. The
                    &quot;Mark as complete&quot; button below unlocks after you have
                    kept this page open for at least 85% of the video&apos;s duration.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex">
                      <Button
                        size="sm"
                        onClick={markYtComplete}
                        disabled={!ytCanMarkComplete || localCompleted || posting}
                        className="gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {localCompleted ? "Completed" : ytCanMarkComplete ? "Mark as complete" : `Keep watching (${Math.round((ytWatchSecondsRef.current / Math.max(1, durationRef.current)) * 100)}%)`}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {ytCanMarkComplete
                      ? "You can now mark this video complete."
                      : "Available after watching at least 85% of the video duration."}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
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
  answeredCount,
  totalCount,
}: {
  question: VideoQuestionData;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onSelect: (idx: number) => void;
  onSubmit: () => void;
  answeredCount: number;
  totalCount: number;
}) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={`Question ${answeredCount + 1} of ${totalCount}`}
    >
      <div className="w-full max-w-md rounded-xl border border-accent/20 bg-card shadow-2xl ring-1 ring-accent/10 overflow-hidden">
        {/* Header strip — sage themed */}
        <div className="flex items-center justify-between gap-2 border-b border-accent/15 bg-gradient-to-r from-soft-sage to-transparent px-4 py-2.5">
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

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
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

          {/* Footer — submit / feedback */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-muted-foreground">
              {showFeedback
                ? "Answer recorded — your video will resume shortly."
                : "Pick an answer to continue."}
            </p>
            {showFeedback ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2.5 py-1.5 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            ) : (
              <Button
                onClick={onSubmit}
                disabled={selectedAnswer === null}
                size="sm"
                className="gap-2 shadow-sm"
              >
                Submit Answer
              </Button>
            )}
          </div>
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
    <Card className="shadow-sm border-accent/20">
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
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
      // /embed/ID or /shorts/ID
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[2]}?rel=0`;
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

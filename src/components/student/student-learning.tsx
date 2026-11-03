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
import {
  ArrowLeft, PlayCircle, CheckCircle2, Lock, FileText, Download, Link as LinkIcon,
  Upload, Award, ClipboardList, AlertTriangle, Clock, Video as VideoIcon, Info,
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
  progress: VideoProgressInfo | null;
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
  title: string;
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
      <div className="space-y-4">
        <Skeleton className="h-12 w-32 rounded-md" />
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-[480px] rounded-xl" />
          <Skeleton className="h-[480px] rounded-xl" />
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
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h1 className="font-heading text-lg md:text-xl font-semibold text-foreground truncate">
            {course.title}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{course.courseCompletion.completedVideos}/{course.courseCompletion.totalVideos} lessons</span>
          </div>
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={course.courseCompletion.percent} className="h-2 w-24" />
            <span className="text-sm font-medium text-foreground">{course.courseCompletion.percent}%</span>
          </div>
        </div>
      </div>

      {/* Mobile: stacked. Desktop: split. */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left: player + materials + assignment */}
        <div className="space-y-4 min-w-0">
          {activeVideo ? (
            <VideoPlayer
              key={activeVideo.id}
              video={activeVideo}
              onProgress={handleProgressUpdate}
            />
          ) : (
            <EmptyState
              icon={<VideoIcon className="h-5 w-5" />}
              title="No videos in this course"
              description="This course doesn't have any published video lessons yet."
            />
          )}

          {/* Materials */}
          {activeTopic && activeTopic.materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  Materials for {activeTopic.title}
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

          {/* Assignment panel */}
          {course.assignment && (
            <AssignmentPanel
              course={course}
              onSubmitted={handleSubmissionSuccess}
            />
          )}

          {/* All materials (course-level) */}
          {course.materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
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

        {/* Right: topic sidebar */}
        <Card className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] flex flex-col">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Course Lessons</CardTitle>
            <CardDescription>
              {course.topics.length} topic{course.topics.length > 1 ? "s" : ""} · {course.courseCompletion.totalVideos} lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-12rem)] scrollbar-thin">
            {course.topics.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6 text-center">
                No topics published yet.
              </p>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={[course.topics[0]?.id].filter(Boolean) as string[]}
                className="px-3"
              >
                {course.topics.map((topic) => {
                  const completedInTopic = topic.videos.filter(
                    (v) => v.progress?.isCompleted
                  ).length;
                  const isActiveTopic = topic.id === activeTopic?.id;
                  return (
                    <AccordionItem key={topic.id} value={topic.id} className="border-b border-border last:border-b-0">
                      <AccordionTrigger className="hover:no-underline px-2">
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-sm font-semibold truncate ${isActiveTopic ? "text-accent" : "text-foreground"}`}>
                            {topic.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {completedInTopic}/{topic.videos.length} videos
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-0.5">
                          {topic.videos.map((video) => {
                            const isActive = video.id === activeVideo?.id;
                            const completed = video.progress?.isCompleted;
                            return (
                              <li key={video.id}>
                                <button
                                  onClick={() => setUserSelectedVideoId(video.id)}
                                  className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                                    isActive
                                      ? "bg-accent/10 text-accent"
                                      : "text-foreground hover:bg-muted"
                                  }`}
                                >
                                  <span className="mt-0.5 shrink-0">
                                    {completed ? (
                                      <CheckCircle2 className="h-4 w-4 text-success" />
                                    ) : isActive ? (
                                      <PlayCircle className="h-4 w-4 text-accent" />
                                    ) : (
                                      <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{video.title}</span>
                                    {video.duration > 0 && (
                                      <span className="block text-xs text-muted-foreground mt-0.5">
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
  onProgress,
}: {
  video: VideoItem;
  onProgress: (update: {
    videoId: string;
    progress: VideoProgressInfo;
    justCompleted: boolean;
  }) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef<number>(0);
  const watchTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const lastPostRef = useRef<number>(0);
  const resumeAppliedRef = useRef<boolean>(false);

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
  }, [video.id]);

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
  const handleSeeked = () => {
    const el = videoRef.current;
    if (!el) return;
    lastTimeRef.current = el.currentTime;
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
    } catch {
    } finally {
      setPosting(false);
    }
  };

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

  // Render the right player
  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-black aspect-video w-full flex items-center justify-center">
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
      </div>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-semibold text-foreground">{video.title}</h2>
            {video.description && (
              <p className="text-sm text-muted-foreground mt-1.5">{video.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {posting && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {localCompleted ? (
              <Badge className="bg-success/15 text-success border-transparent">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <PlayCircle className="h-3 w-3" /> In progress
              </Badge>
            )}
          </div>
        </div>

        {/* YouTube: explain limitation + show manual mark-complete */}
        {isYouTube && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
            <div className="flex items-start gap-2">
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
                      className="gap-2"
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
  );
}

/* ===================== Helpers ===================== */

function MaterialRow({ material }: { material: MaterialItem }) {
  const isLink = material.type === "LINK";
  const Icon = isLink ? LinkIcon : FileText;
  return (
    <li>
      <a
        href={material.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground line-clamp-1">{material.title}</p>
          {material.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{material.description}</p>
          )}
          {material.topic && (
            <p className="text-xs text-muted-foreground mt-0.5">Topic: {material.topic.title}</p>
          )}
        </div>
        <span className="text-xs text-accent flex items-center gap-1 shrink-0">
          {isLink ? "Open" : "Download"} <Download className="h-3 w-3" />
        </span>
      </a>
    </li>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-accent" />
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
                  <Progress value={course.courseCompletion.percent} className="h-1.5" />
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
              <Download className="h-3 w-3" /> View your submission
            </a>
            {submission.reviewNotes && (
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reviewer notes</p>
                <p className="text-sm text-foreground">{submission.reviewNotes}</p>
              </div>
            )}
            {course.certificateTemplate?.isEnabled && (
              <Button variant="outline" size="sm" onClick={() => navigate(["student", "certificates"])} className="gap-2">
                <Award className="h-4 w-4" /> View your certificate
              </Button>
            )}
            {assignment.allowResubmission && (
              <p className="text-xs text-muted-foreground">
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
              <div className="rounded-md border border-border bg-muted/40 p-3">
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
                <Download className="h-3 w-3" /> Download assignment brief
              </a>
            )}
            {assignment.dueDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due {formatDateTime(assignment.dueDate)}
              </p>
            )}
            <div className="border-t border-border pt-3 space-y-3">
              <label className="text-sm font-medium text-foreground">Upload your submission</label>
              <input
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
              <Button onClick={handleSubmit} disabled={!selectedFile || uploading} className="gap-2">
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

"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UniversityBadge, type UniversityRef } from "@/components/shared/university-badge";
import { useApiFetch } from "@/hooks/use-api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import {
  Search, BookOpen, Video, PlayCircle, CheckCircle2, AlertTriangle,
  ArrowRight, ShieldCheck, X, Building2, SlidersHorizontal, Signal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  accessType: "FREE" | "PAID";
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  university?: UniversityRef | null;
  topicsCount: number;
  videosCount: number;
  completedVideos: number;
  completedTopics: number;
  percent: number;
  lastWatchedVideoId: string | null;
  lastWatchedVideoTitle: string | null;
  createdAt?: string;
  popularity?: number;
}

interface SubscriptionInfo {
  planName: string;
  status: "ACTIVE" | "EXPIRED";
  expiryDate: string;
}

interface CoursesData {
  courses: CourseItem[];
  subscription: SubscriptionInfo | null;
  expired: boolean;
  universities?: UniversityRef[];
}

const LEVEL_LABELS: Record<NonNullable<CourseItem["level"]>, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const LEVEL_BADGE_CLASS: Record<NonNullable<CourseItem["level"]>, string> = {
  BEGINNER: "bg-success/15 text-success border-transparent",
  INTERMEDIATE: "bg-warning/15 text-warning border-transparent",
  ADVANCED: "bg-destructive/10 text-destructive border-transparent",
};

/**
 * Map a course's topic count to a coarse "duration" bucket used by the
 * duration filter. The thresholds are deliberately simple so the filter is
 * meaningful even for universities with sparse topic data.
 *   - short   : 1-3 topics
 *   - medium  : 4-7 topics
 *   - long    : 8+ topics
 *   - (courses with 0 topics are bucketed as "short" so they still appear)
 */
function durationBucket(topicsCount: number): "short" | "medium" | "long" {
  if (topicsCount >= 8) return "long";
  if (topicsCount >= 4) return "medium";
  return "short";
}

export function StudentMyCourses() {
  const navigate = useAppStore((s) => s.navigate);
  const routeQuery = useAppStore((s) => s.query);
  const { data, loading, error } = useApiFetch<CoursesData>("/api/student/courses");

  // Initial university filter is derived from the route query (?university=ID),
  // e.g. when arriving from the Universities directory. Because the dashboard
  // remounts this component when the section key changes (universities →
  // courses), reading the query at mount-time is sufficient; manual changes
  // from the dropdown afterwards still update local state.
  const [querySearch, setQuerySearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [universityFilter, setUniversityFilter] = useState<string>(
    routeQuery?.university || "all"
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data?.courses || []).forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [data]);

  const universities = data?.universities || [];

  const filtered = useMemo(() => {
    const q = querySearch.trim().toLowerCase();
    const list = (data?.courses || []).filter((c) => {
      if (q) {
        const hay = (c.title + " " + (c.description || "") + " " + (c.category || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category !== "all" && c.category !== category) return false;
      if (universityFilter !== "all") {
        if (!c.university || c.university.id !== universityFilter) return false;
      }
      if (statusFilter === "in-progress") {
        if (!(c.completedVideos > 0 && c.percent < 100)) return false;
      } else if (statusFilter === "completed") {
        if (!(c.percent === 100 && c.videosCount > 0)) return false;
      } else if (statusFilter === "not-started") {
        if (c.completedVideos > 0) return false;
      }
      if (levelFilter !== "all" && c.level !== levelFilter) return false;
      if (typeFilter !== "all" && c.accessType !== typeFilter) return false;
      if (durationFilter !== "all" && durationBucket(c.topicsCount) !== durationFilter) return false;
      return true;
    });

    // Sort the filtered list according to the selected order
    if (sort === "alphabetical") {
      list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    } else if (sort === "popular") {
      list.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    }
    // "newest" — server already returns createdAt desc, so we keep list order
    return list;
  }, [data, querySearch, category, statusFilter, universityFilter, levelFilter, typeFilter, durationFilter, sort]);

  const activeUniversity = useMemo(() => {
    if (universityFilter === "all") return null;
    const found = universities.find((u) => u.id === universityFilter);
    return found || null;
  }, [universityFilter, universities]);

  function clearUniversityFilter() {
    setUniversityFilter("all");
    // Also clear the query param from the URL so a reload doesn't reapply it.
    if (routeQuery?.university) {
      navigate(["student", "courses"]);
    }
  }

  function clearAllFilters() {
    setQuerySearch("");
    setCategory("all");
    setStatusFilter("all");
    setLevelFilter("all");
    setTypeFilter("all");
    setDurationFilter("all");
    setSort("newest");
    setUniversityFilter("all");
    if (routeQuery?.university) {
      navigate(["student", "courses"]);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<BookOpen className="h-5 w-5" />}
        title="Couldn't load courses"
        description={error}
        action={<Button onClick={() => window.location.reload()}>Reload</Button>}
      />
    );
  }

  const expired = data?.expired;
  const totalCourses = data?.courses.length || 0;
  const hasActiveFilters =
    querySearch !== "" ||
    category !== "all" ||
    statusFilter !== "all" ||
    universityFilter !== "all" ||
    levelFilter !== "all" ||
    typeFilter !== "all" ||
    durationFilter !== "all" ||
    sort !== "newest";

  return (
    <div className="space-y-6">
      {/* Expired warning banner */}
      {expired && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Your subscription has expired</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Paid courses are locked. Renew your subscription to restore full access.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(["student", "subscription"])} className="gap-2 shrink-0 shadow-sm">
              <ShieldCheck className="h-4 w-4" /> Renew Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active university filter banner */}
      {activeUniversity && (
        <Card className="border-accent/30 bg-gradient-to-br from-soft-sage to-card shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0 ring-1 ring-accent/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Showing courses from {activeUniversity.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Filtered to {filtered.length} course{filtered.length === 1 ? "" : "s"} from this university.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearUniversityFilter}
              className="gap-1.5 shrink-0"
            >
              <X className="h-3.5 w-3.5" /> Clear university filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Faceted filters toolbar */}
      <Card className="p-4 shadow-sm">
        {/* Row 1 — search + sort */}
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={querySearch}
              onChange={(e) => setQuerySearch(e.target.value)}
              placeholder="Search courses..."
              className="pl-9 h-10"
              aria-label="Search courses"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="md:w-48 w-full h-10" aria-label="Sort courses">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most popular</SelectItem>
              <SelectItem value="alphabetical">A → Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 2 — faceted filter dropdowns */}
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-[repeat(6,minmax(0,1fr))] md:items-center">
          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger className="w-full h-10" aria-label="Filter by university">
              <Building2 className="h-4 w-4 text-muted-foreground mr-1.5 shrink-0" />
              <SelectValue placeholder="All universities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All universities</SelectItem>
              {universities.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full h-10" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full h-10" aria-label="Filter by level">
              <Signal className="h-4 w-4 text-muted-foreground mr-1.5 shrink-0" />
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full h-10" aria-label="Filter by type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={durationFilter} onValueChange={setDurationFilter}>
            <SelectTrigger className="w-full h-10" aria-label="Filter by duration">
              <SelectValue placeholder="All durations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All durations</SelectItem>
              <SelectItem value="short">Short (1–3 topics)</SelectItem>
              <SelectItem value="medium">Medium (4–7 topics)</SelectItem>
              <SelectItem value="long">Long (8+ topics)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full h-10" aria-label="Filter by status">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="not-started">Not started</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Active filters:{" "}
              <span className="font-medium text-foreground">
                {[
                  universityFilter !== "all" ? "university" : null,
                  category !== "all" ? "category" : null,
                  levelFilter !== "all" ? "level" : null,
                  typeFilter !== "all" ? "type" : null,
                  durationFilter !== "all" ? "duration" : null,
                  statusFilter !== "all" ? "status" : null,
                  sort !== "newest" ? "sort" : null,
                  querySearch !== "" ? "search" : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 gap-1 text-muted-foreground self-start sm:self-auto">
              <X className="h-3 w-3" /> Clear all
            </Button>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {totalCourses} accessible courses
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title={totalCourses === 0 ? "No courses available" : "No courses match your filters"}
          description={
            totalCourses === 0
              ? "Explore the public catalog or activate a subscription to unlock paid courses."
              : "Try adjusting your search or filters."
          }
          action={
            totalCourses === 0 ? (
              <Button onClick={() => navigate(["courses"])} className="gap-2 shadow-sm">
                Browse Public Catalog <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onOpen={() => navigate(["student", "learn", c.id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, onOpen }: { course: CourseItem; onOpen: () => void }) {
  const started = course.completedVideos > 0;
  const completed = course.videosCount > 0 && course.percent === 100;

  return (
    <Card
      className="group overflow-hidden p-0 cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-accent/40"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden bg-muted">
        <CourseThumbnail
          thumbnail={course.thumbnail}
          firstVideoUrl={(course as any).firstVideoUrl}
          firstVideoSource={(course as any).firstVideoSource}
          alt={course.title}
          className="h-full w-full"
          showPlayOverlay
        />
        {/* Subtle gradient overlay for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-1.5rem)]">
          <Badge
            className={
              course.accessType === "FREE"
                ? "bg-success/15 text-success border-transparent backdrop-blur-sm"
                : "bg-primary text-primary-foreground border-transparent shadow-sm"
            }
          >
            {course.accessType === "FREE" ? "Free" : "Paid"}
          </Badge>
          {course.level && (
            <Badge className={cn("backdrop-blur-sm", LEVEL_BADGE_CLASS[course.level])}>
              {LEVEL_LABELS[course.level]}
            </Badge>
          )}
          {course.category && (
            <Badge variant="outline" className="bg-background/85 backdrop-blur-sm border-border/60 text-foreground">
              {course.category}
            </Badge>
          )}
        </div>
        {completed && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-success text-success-foreground border-transparent shadow-sm">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </Badge>
          </div>
        )}
        {/* Play hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/15 transition-colors duration-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200">
            <PlayCircle className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-3.5">
        <div className="space-y-2">
          <h3 className="font-heading text-base font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
            {course.title}
          </h3>
          {course.university && (
            <UniversityBadge university={course.university} size="xs" />
          )}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
            {course.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-accent" /> {course.topicsCount} topics
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="h-3 w-3 text-accent" /> {course.videosCount} lessons
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className={started ? "" : "font-medium"}>{started ? "Progress" : "Not started"}</span>
            <span className="font-medium text-foreground">{course.percent}%</span>
          </div>
          <Progress
            value={course.percent}
            className={`h-1.5 bg-muted ${completed ? "[&_[data-slot=progress-indicator]]:bg-success" : "[&_[data-slot=progress-indicator]]:bg-accent"}`}
          />
        </div>

        <Button
          size="sm"
          variant={started ? "default" : "outline"}
          className="w-full gap-2 mt-1 h-9 shadow-sm"
        >
          {started ? (
            <>
              <PlayCircle className="h-4 w-4" /> Continue Learning
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" /> Start Learning
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

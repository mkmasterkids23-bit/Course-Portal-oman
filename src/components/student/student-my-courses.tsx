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
import { useApiFetch } from "@/hooks/use-api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, BookOpen, Video, PlayCircle, CheckCircle2, AlertTriangle,
  ArrowRight, ShieldCheck,
} from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  accessType: "FREE" | "PAID";
  topicsCount: number;
  videosCount: number;
  completedVideos: number;
  completedTopics: number;
  percent: number;
  lastWatchedVideoId: string | null;
  lastWatchedVideoTitle: string | null;
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
}

export function StudentMyCourses() {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading, error } = useApiFetch<CoursesData>("/api/student/courses");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data?.courses || []).forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.courses || []).filter((c) => {
      if (q) {
        const hay = (c.title + " " + (c.description || "") + " " + (c.category || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category !== "all" && c.category !== category) return false;
      if (statusFilter === "in-progress") {
        if (!(c.completedVideos > 0 && c.percent < 100)) return false;
      } else if (statusFilter === "completed") {
        if (!(c.percent === 100 && c.videosCount > 0)) return false;
      } else if (statusFilter === "not-started") {
        if (c.completedVideos > 0) return false;
      }
      return true;
    });
  }, [data, query, category, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
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

  return (
    <div className="space-y-6">
      {/* Expired warning banner */}
      {expired && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Your subscription has expired</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Paid courses are locked. Renew your subscription to restore full access.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(["student", "subscription"])} className="gap-2 shrink-0">
              <ShieldCheck className="h-4 w-4" /> Renew Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-9"
              aria-label="Search courses"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="md:w-48 w-full" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-40 w-full" aria-label="Filter by status">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="not-started">Not started</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of {totalCourses} accessible courses
      </p>

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
              <Button onClick={() => navigate(["courses"])} className="gap-2">
                Browse Public Catalog <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setQuery(""); setCategory("all"); setStatusFilter("all"); }}>
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
      className="group overflow-hidden p-0 cursor-pointer transition-all hover:shadow-md hover:border-accent/40"
      onClick={onOpen}
    >
      <div className="relative h-40 overflow-hidden bg-muted">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <PlayCircle className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge
            className={
              course.accessType === "FREE"
                ? "bg-success/15 text-success border-transparent"
                : "bg-primary text-primary-foreground"
            }
          >
            {course.accessType === "FREE" ? "Free" : "Paid"}
          </Badge>
          {course.category && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur">
              {course.category}
            </Badge>
          )}
        </div>
        {completed && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-success text-success-foreground border-transparent">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-5 space-y-3">
        <div>
          <h3 className="font-heading font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
            {course.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.topicsCount} topics</span>
          <span className="flex items-center gap-1"><Video className="h-3 w-3" /> {course.videosCount} lessons</span>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{started ? "Progress" : "Not started"}</span>
            <span>{course.percent}%</span>
          </div>
          <Progress value={course.percent} className="h-1.5" />
        </div>

        <Button size="sm" variant={started ? "default" : "outline"} className="w-full gap-2 mt-2">
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

"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { useApiFetch } from "@/hooks/use-api";
import { BookOpen, Video, ShieldCheck, Search, Lock, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoursePublic } from "@/types";

export function CoursesPage() {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading } = useApiFetch<{ courses: CoursePublic[] }>("/api/public/courses");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const courses = data?.courses || [];
  const categories = useMemo(
    () => Array.from(new Set(courses.map((c) => c.category).filter(Boolean))) as string[],
    [courses]
  );

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (category && c.category !== category) return false;
      if (q && !`${c.title} ${c.description || ""}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [courses, q, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Course Catalog</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
          All Courses
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Browse our complete catalog. Register and pick a learning plan to start learning.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses by title or keyword..."
            className="h-9 pl-9"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="hidden items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground md:inline-flex">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </span>
            <Button
              variant={category === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("")}
              className="h-8 shrink-0"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat)}
                className="h-8 shrink-0"
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Result count */}
      {!loading && (
        <div className="mb-4 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{courses.length}</span> courses
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden p-0">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="No courses found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="group cursor-pointer overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/40"
              onClick={() => navigate(["register"])}
            >
              <div className="relative h-44 overflow-hidden bg-muted">
                <CourseThumbnail
                  thumbnail={c.thumbnail}
                  firstVideoUrl={(c as any).firstVideoUrl}
                  firstVideoSource={(c as any).firstVideoSource}
                  alt={c.title}
                  className="h-full w-full"
                  showPlayOverlay
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge
                    variant={c.accessType === "FREE" ? "secondary" : "default"}
                    className={cn(
                      c.accessType === "FREE"
                        ? "bg-success/15 text-success hover:bg-success/20"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {c.accessType === "FREE" ? "Free" : "Paid"}
                  </Badge>
                  {c.category && (
                    <Badge variant="outline" className="border-border bg-background/85 backdrop-blur">
                      {c.category}
                    </Badge>
                  )}
                </div>
                {c.accessType === "PAID" && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                      <Lock className="h-3 w-3" /> Subscription
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2.5 p-5">
                <h3 className="font-heading text-[15px] font-semibold tracking-tight text-foreground line-clamp-1 transition-colors group-hover:text-accent">
                  {c.title}
                </h3>
                <p className="min-h-[2.5rem] text-sm text-muted-foreground line-clamp-2">
                  {c.description || "No description provided."}
                </p>
                <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> {c.topicsCount} topics
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" /> {c.videosCount} lessons
                  </span>
                  {c.accessType === "PAID" && c.planNames.length > 0 && (
                    <span className="flex items-center gap-1.5 truncate text-accent">
                      <ShieldCheck className="h-3.5 w-3.5" /> {c.planNames.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

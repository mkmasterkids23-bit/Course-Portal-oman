"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { BookOpen, Video, ShieldCheck, Search, Lock, PlayCircle } from "lucide-react";
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
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">All Courses</h1>
        <p className="text-muted-foreground mt-2">
          Browse our complete catalog. Register and pick a learning plan to start learning.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses..."
            className="pl-9"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={category === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("")}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden p-0">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-5 space-y-3">
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
              className="group overflow-hidden p-0 transition-all hover:shadow-md hover:border-accent/40 cursor-pointer"
              onClick={() => navigate(["register"])}
            >
              <div className="relative h-44 overflow-hidden bg-muted">
                {c.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <PlayCircle className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge variant={c.accessType === "FREE" ? "secondary" : "default"} className={c.accessType === "FREE" ? "bg-success/15 text-success hover:bg-success/20" : "bg-primary text-primary-foreground"}>
                    {c.accessType === "FREE" ? "Free" : "Paid"}
                  </Badge>
                  {c.category && (
                    <Badge variant="outline" className="bg-background/80 backdrop-blur">{c.category}</Badge>
                  )}
                </div>
                {c.accessType === "PAID" && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2 py-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Subscription
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-heading font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {c.description || "No description provided."}
                </p>
                <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {c.topicsCount} topics</span>
                  <span className="flex items-center gap-1"><Video className="h-3 w-3" /> {c.videosCount} lessons</span>
                  {c.accessType === "PAID" && c.planNames.length > 0 && (
                    <span className="flex items-center gap-1 text-accent truncate">
                      <ShieldCheck className="h-3 w-3" /> {c.planNames.join(", ")}
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

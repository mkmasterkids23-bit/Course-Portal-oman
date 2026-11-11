"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import {
  Building2, BookOpen, Search, ArrowRight, GraduationCap,
} from "lucide-react";

interface UniversityListItem {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  courseCount: number;
}

interface UniversitiesData {
  universities: UniversityListItem[];
}

export function StudentUniversities() {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading, error } = useApiFetch<UniversitiesData>(
    "/api/public/universities"
  );
  const [q, setQ] = useState("");

  const universities = data?.universities || [];
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return universities;
    return universities.filter((u) => {
      const hay = `${u.name} ${u.description || ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [universities, q]);

  const totalCourses = useMemo(
    () => universities.reduce((sum, u) => sum + u.courseCount, 0),
    [universities]
  );

  function openUniversity(universityId: string) {
    navigate(["student", "courses"], { university: universityId });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-10 w-full max-w-md rounded-md" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Building2 className="h-5 w-5" />}
        title="Couldn't load universities"
        description={error}
        action={<Button onClick={() => window.location.reload()}>Reload</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="relative overflow-hidden border-border shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(15,118,110,0.45), transparent 70%)" }}
        />
        <CardContent className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-primary-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm mb-3">
              <Building2 className="h-3.5 w-3.5" />
              <span>Partner Universities</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              Browse by University
            </h1>
            <p className="text-white/80 mt-2 max-w-xl text-sm md:text-base">
              Discover courses offered by our partner institutions. Pick a
              university to filter its catalog and start learning.
            </p>
          </div>
          <div className="flex gap-6 self-start md:self-center">
            <div className="text-center">
              <p className="font-heading text-3xl font-bold text-white leading-none">
                {universities.length}
              </p>
              <p className="text-xs text-white/70 mt-1">Universities</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-3xl font-bold text-white leading-none">
                {totalCourses}
              </p>
              <p className="text-xs text-white/70 mt-1">Published courses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search universities by name or description..."
            className="pl-9 h-10"
            aria-label="Search universities"
          />
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        of {universities.length} universities
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={universities.length === 0 ? "No universities yet" : "No matches found"}
          description={
            universities.length === 0
              ? "Universities will appear here once administrators create them."
              : "Try adjusting your search."
          }
          action={
            universities.length > 0 ? (
              <Button variant="outline" onClick={() => setQ("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <UniversityCard
              key={u.id}
              university={u}
              onOpen={() => openUniversity(u.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UniversityCard({
  university,
  onOpen,
}: {
  university: UniversityListItem;
  onOpen: () => void;
}) {
  return (
    <Card
      className="group flex flex-col overflow-hidden p-0 cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-accent/40"
      onClick={onOpen}
    >
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-light-teal via-card to-accent/[0.04]">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "radial-gradient(circle at 30% 30%, rgba(15,118,110,0.08), transparent 60%)" }} />
        {university.logo ? (
          <img
            src={university.logo}
            alt={`${university.name} logo`}
            className="relative h-16 w-16 rounded-xl object-cover bg-white ring-1 ring-border shadow-sm transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground ring-1 ring-primary/30 shadow-sm transition-transform duration-200 group-hover:scale-105">
            <GraduationCap className="h-8 w-8" />
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
            {university.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mt-1 min-h-[3.75rem]">
            {university.description || "No description provided."}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <Badge className="bg-light-teal text-accent border-transparent">
            <BookOpen className="h-3 w-3" />
            {university.courseCount} course{university.courseCount === 1 ? "" : "s"}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
            View courses
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

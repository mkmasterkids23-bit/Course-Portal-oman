"use client";

import { GraduationCap } from "lucide-react";

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl animate-pulse" />
        <div className="relative h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
          <GraduationCap className="h-7 w-7" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="h-2 w-2 rounded-full bg-accent animate-bounce" />
        <span>Loading CourseLearn…</span>
      </div>
    </div>
  );
}

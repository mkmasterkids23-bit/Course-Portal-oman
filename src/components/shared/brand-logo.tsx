"use client";

import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showText = true,
  onClick,
}: {
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("flex items-center gap-2 group", className)}
      aria-label="LearnCourse home"
    >
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <GraduationCap className="h-5 w-5" />
      </span>
      {showText && (
        <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Learn<span className="text-accent">Course</span>
        </span>
      )}
    </button>
  );
}

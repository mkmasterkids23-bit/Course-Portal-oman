"use client";

import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, Home } from "lucide-react";

export function NotFoundPage({ onHome }: { onHome: () => void }) {
  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(15,118,110,0.08), transparent 50%), radial-gradient(circle at 70% 70%, rgba(23,37,84,0.05), transparent 50%)",
        }}
      />
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="relative mb-6">
          <span className="font-heading text-[120px] font-bold leading-none tracking-tight text-muted/60">
            404
          </span>
          <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-border bg-card text-accent shadow-sm">
            <Compass className="h-7 w-7" />
          </div>
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
          Page not found
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has moved. Let&apos;s get you back on
          track.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onHome} className="h-10 gap-2 px-5">
            <Home className="h-4 w-4" /> Back to home
          </Button>
          <Button
            variant="outline"
            onClick={onHome}
            className="h-10 gap-2 px-5"
          >
            Browse courses
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

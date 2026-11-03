"use client";

import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export function NotFoundPage({ onHome }: { onHome: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="font-heading text-3xl font-bold text-foreground">Page not found</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        The page you are looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>
      <Button onClick={onHome} className="mt-6">Back to home</Button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", segments: [""] },
  { label: "Courses", segments: ["courses"] },
  { label: "Learning Plans", segments: ["plans"] },
  { label: "About", segments: ["about"] },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useAppStore((s) => s.navigate);
  const segments = useAppStore((s) => s.segments);
  const current = segments[0] || "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-border shadow-sm"
          : "bg-background border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <BrandLogo onClick={() => navigate([""])} />

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = current === item.segments[0];
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.segments)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-accent bg-accent/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(["login"])}
            className="gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
          <Button onClick={() => navigate(["register"])} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Register
          </Button>
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="flex flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.segments);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  current === item.segments[0]
                    ? "text-accent bg-accent/10"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => { navigate(["login"]); setOpen(false); }} className="gap-2">
                <LogIn className="h-4 w-4" /> Login
              </Button>
              <Button onClick={() => { navigate(["register"]); setOpen(false); }} className="gap-2">
                <UserPlus className="h-4 w-4" /> Register
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

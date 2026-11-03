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
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-background border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <BrandLogo onClick={() => navigate([""])} />

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = current === item.segments[0];
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.segments)}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(["login"])}
            className="gap-2 h-9"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
          <Button onClick={() => navigate(["register"])} className="gap-2 h-9">
            <UserPlus className="h-4 w-4" />
            Register
          </Button>
        </div>

        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-border bg-background transition-all duration-200 ease-out",
          open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0 border-transparent"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {NAV_ITEMS.map((item) => {
            const active = current === item.segments[0];
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.segments);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200",
                  active
                    ? "text-accent bg-light-teal"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {item.label}
              </button>
            );
          })}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => { navigate(["login"]); setOpen(false); }} className="gap-2 h-10">
              <LogIn className="h-4 w-4" /> Login
            </Button>
            <Button onClick={() => { navigate(["register"]); setOpen(false); }} className="gap-2 h-10">
              <UserPlus className="h-4 w-4" /> Register
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

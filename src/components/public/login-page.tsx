"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Mail, Lock, ArrowLeft, LogIn, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { apiPost } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";

export function LoginPage() {
  const navigate = useAppStore((s) => s.navigate);
  const refreshUser = useAppStore((s) => s.refreshUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiPost<{ user: { role: string } }>("/api/auth/login", { email, password });
      toast({ title: "Welcome back!", description: "You have been logged in." });
      // Refresh the user state in the store (fetches /api/auth/me with the new cookie)
      await refreshUser();
      // Explicitly navigate to the correct dashboard based on role.
      // This works together with the page.tsx effect to guarantee the right
      // dashboard renders even if there's a timing issue with state updates.
      const role = result?.user?.role;
      if (role === "ADMIN") {
        navigate(["admin", "overview"]);
      } else if (role === "STUDENT") {
        navigate(["student", "overview"]);
      }
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-light-teal/60">
      {/* Subtle decorative shapes */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(15,118,110,0.10), transparent 45%), radial-gradient(circle at 85% 80%, rgba(23,37,84,0.06), transparent 45%)",
        }}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between p-4 md:px-6 lg:px-8">
        <BrandLogo onClick={() => navigate([""])} />
        <Button variant="ghost" size="sm" onClick={() => navigate([""])} className="gap-2 h-9">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6 shadow-md md:p-8">
          {/* Header */}
          <div className="mb-6 space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <LogIn className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-9 pl-9"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="h-10 w-full gap-2">
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Demo credentials box */}
          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Demo admin credentials
            </div>
            <dl className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-mono font-medium text-foreground">admin@learncourse.dev</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Password</dt>
                <dd className="font-mono font-medium text-foreground">admin123</dd>
              </div>
            </dl>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <Sparkles className="h-3 w-3 text-accent" />
              Created automatically on first visit. Please change after login.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate(["register"])}
              className="font-medium text-accent transition-colors hover:text-accent/80 hover:underline"
            >
              Register here
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}

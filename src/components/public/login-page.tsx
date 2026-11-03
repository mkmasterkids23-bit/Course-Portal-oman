"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Mail, Lock, ArrowLeft, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/40">
      <div className="flex items-center justify-between p-4 md:p-6">
        <BrandLogo onClick={() => navigate([""])} />
        <Button variant="ghost" size="sm" onClick={() => navigate([""])} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 md:p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 rounded-md bg-muted/60 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Demo admin credentials</p>
            <p>Email: admin@lumina.dev</p>
            <p>Password: admin123</p>
            <p className="mt-2 text-muted-foreground/80">
              (Created automatically on first visit. Please change after login.)
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate(["register"])}
              className="font-medium text-accent hover:underline"
            >
              Register here
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}

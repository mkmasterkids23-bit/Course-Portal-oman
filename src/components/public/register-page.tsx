"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail, Lock, User, ArrowLeft, UserPlus, AlertCircle, CheckCircle2,
  ArrowRight, ArrowLeft as ArrowLeftIcon, Eye, EyeOff, ShieldCheck, Sparkles
} from "lucide-react";
import { apiPost } from "@/hooks/use-api";
import { useApiFetch } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import { formatPrice, durationUnitLabel, type SubscriptionPlanPublic } from "@/types";
import { cn } from "@/lib/utils";

export function RegisterPage() {
  const navigate = useAppStore((s) => s.navigate);
  const query = useAppStore((s) => s.query);
  const refreshUser = useAppStore((s) => s.refreshUser);

  const { data, loading } = useApiFetch<{ plans: SubscriptionPlanPublic[] }>("/api/public/plans");
  const plans = data?.plans || [];

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Preselect plan from URL query
  useEffect(() => {
    if (query.planId && !selectedPlanId) {
      setSelectedPlanId(query.planId);
    }
  }, [query.planId, selectedPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedPlanId) {
      setError("Please select a subscription plan");
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/auth/register", { name, email, password, planId: selectedPlanId });
      toast({
        title: "Account created!",
        description: `Welcome to LearnCourse. Your subscription is now active.`,
      });
      await refreshUser();
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-light-teal/60">
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

      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-2xl p-6 shadow-md md:p-8">
          {/* Header */}
          <div className="mb-6 space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
              <UserPlus className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Join LearnCourse and start your professional learning journey
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2",
                step === 1 ? "text-accent" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                  step === 1
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : step > 1
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </span>
              <span className="text-xs font-medium">Your details</span>
            </div>
            <span className="h-px w-10 bg-border" />
            <div
              className={cn(
                "flex items-center gap-2",
                step === 2 ? "text-accent" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                  step === 2
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                )}
              >
                2
              </span>
              <span className="text-xs font-medium">Select plan</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="h-9 pl-9"
                      autoComplete="name"
                    />
                  </div>
                </div>
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
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="h-9 pl-9"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => {
                    if (!name || !email || password.length < 6) {
                      setError("Please complete all fields. Password must be at least 6 characters.");
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                  className="h-10 w-full gap-2"
                >
                  Continue to plan selection
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate(["login"])}
                    className="font-medium text-accent transition-colors hover:text-accent/80 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">
                    Choose a subscription plan
                  </p>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : plans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No plans are currently available. Please contact the administrator.
                    </p>
                  ) : (
                    <div className="max-h-[400px] space-y-3 overflow-y-auto scrollbar-thin pr-1">
                      {plans.map((p) => {
                        const selected = selectedPlanId === p.id;
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => setSelectedPlanId(p.id)}
                            className={cn(
                              "w-full rounded-xl border p-4 text-left transition-all duration-200",
                              selected
                                ? "border-accent bg-light-teal/60 ring-1 ring-accent/30"
                                : "border-border bg-card hover:border-accent/40 hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className="font-heading text-sm font-semibold tracking-tight text-foreground">
                                    {p.name}
                                  </span>
                                  {p.isPopular && (
                                    <Badge className="bg-accent text-accent-foreground text-[10px]">
                                      <Sparkles className="h-2.5 w-2.5" /> Popular
                                    </Badge>
                                  )}
                                  {selected && (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                                      <CheckCircle2 className="h-3 w-3" />
                                    </span>
                                  )}
                                </div>
                                {p.description && (
                                  <p className="line-clamp-1 text-xs text-muted-foreground">
                                    {p.description}
                                  </p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  {p.features.slice(0, 3).map((f, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-accent" /> {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-heading text-base font-bold tracking-tight text-foreground">
                                  {formatPrice(p.price, p.currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.duration} {durationUnitLabel(p.durationUnit).toLowerCase()}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedPlan && (
                  <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Selected plan</span>
                      <span className="font-medium text-foreground">{selectedPlan.name}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-heading font-bold tracking-tight text-foreground">
                        {formatPrice(selectedPlan.price, selectedPlan.currency)}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-10 gap-2"
                  >
                    <ArrowLeftIcon className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !selectedPlanId}
                    className="h-10 flex-1 gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Create account &amp; start learning
                      </>
                    )}
                  </Button>
                </div>

                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  No payment is processed at registration. You are simply selecting your plan.
                </p>
              </>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}

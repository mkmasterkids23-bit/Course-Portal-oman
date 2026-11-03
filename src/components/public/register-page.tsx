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
  ArrowRight, ArrowLeft as ArrowLeftIcon
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
        description: `Welcome to Lumina Learning. Your subscription is now active.`,
      });
      await refreshUser();
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setSubmitting(false);
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

      <div className="flex-1 flex items-center justify-center p-4 pb-12">
        <Card className="w-full max-w-2xl p-6 md:p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Join Lumina Learning and start your professional learning journey
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={cn("flex items-center gap-2", step === 1 ? "text-accent" : "text-muted-foreground")}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", step === 1 ? "bg-accent text-accent-foreground" : step > 1 ? "bg-success text-success-foreground" : "bg-muted")}>
                {step > 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : "1"}
              </span>
              <span className="text-xs font-medium">Your details</span>
            </div>
            <span className="h-px w-8 bg-border" />
            <div className={cn("flex items-center gap-2", step === 2 ? "text-accent" : "text-muted-foreground")}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", step === 2 ? "bg-accent text-accent-foreground" : "bg-muted")}>
                2
              </span>
              <span className="text-xs font-medium">Select plan</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="pl-9"
                      autoComplete="name"
                    />
                  </div>
                </div>
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
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={show ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="pl-9"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
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
                  className="w-full gap-2"
                >
                  Continue to plan selection <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate(["login"])}
                    className="font-medium text-accent hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
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
                    <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                      {plans.map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setSelectedPlanId(p.id)}
                          className={cn(
                            "w-full text-left rounded-lg border p-4 transition-all",
                            selectedPlanId === p.id
                              ? "border-accent ring-1 ring-accent/30 bg-accent/[0.03]"
                              : "border-border hover:border-accent/40 bg-card"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-heading font-semibold text-foreground">{p.name}</span>
                                {p.isPopular && (
                                  <Badge className="bg-accent text-accent-foreground text-[10px]">Popular</Badge>
                                )}
                              </div>
                              {p.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {p.features.slice(0, 3).map((f, i) => (
                                  <span key={i} className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-accent" /> {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-heading text-lg font-bold text-foreground">
                                {formatPrice(p.price, p.currency)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.duration} {durationUnitLabel(p.durationUnit).toLowerCase()}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPlan && (
                  <div className="rounded-md bg-muted/60 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Selected plan</span>
                      <span className="font-medium text-foreground">{selectedPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-heading font-bold text-foreground">
                        {formatPrice(selectedPlan.price, selectedPlan.currency)}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2"
                  >
                    <ArrowLeftIcon className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !selectedPlanId}
                    className="flex-1 gap-2"
                  >
                    {submitting ? "Creating account..." : "Create account & start learning"}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
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

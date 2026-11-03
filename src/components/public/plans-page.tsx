"use client";

import { useAppStore } from "@/stores/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { CheckCircle2, ArrowRight, TrendingUp, Clock } from "lucide-react";
import { formatPrice, durationUnitLabel, type SubscriptionPlanPublic } from "@/types";

export function PlansPage() {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading } = useApiFetch<{ plans: SubscriptionPlanPublic[] }>("/api/public/plans");
  const plans = data?.plans || [];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
      <div className="text-center mb-10">
        <p className="text-sm font-semibold text-accent uppercase tracking-wide">Learning Plans</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-1">
          Choose the plan that fits your goals
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Transparent pricing. No hidden fees. All plans include video lessons, learning
          materials, assignments and verifiable certificates.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-10 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="h-10 w-full mt-6" />
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="No subscription plans available yet"
          description="Our team is preparing learning plans. Please check back soon."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={`relative p-6 flex flex-col ${p.isPopular ? "border-accent ring-1 ring-accent/30 shadow-md" : ""}`}
            >
              {p.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground">★ Most Popular</Badge>
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-heading text-xl font-bold text-foreground">{p.name}</h3>
                {p.description && (
                  <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                )}
              </div>
              <div className="mb-2">
                <span className="font-heading text-3xl font-bold text-foreground">
                  {formatPrice(p.price, p.currency)}
                </span>
              </div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
                <Clock className="h-3 w-3" />
                Duration: {p.duration} {durationUnitLabel(p.durationUnit).toLowerCase()}
              </p>
              <ul className="mb-6 space-y-2.5 flex-1">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {p.benefits.length > 0 && (
                <div className="mb-6 rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Benefits</p>
                  <ul className="space-y-1.5">
                    {p.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <ArrowRight className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button onClick={() => navigate(["register"], { planId: p.id })} variant={p.isPopular ? "default" : "outline"} className="w-full gap-2">
                Select Plan <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import {
  ArrowRight, PlayCircle, BookOpen, Award, Users, Clock, CheckCircle2,
  Sparkles, GraduationCap, Video, FileText, ShieldCheck, Star, TrendingUp
} from "lucide-react";
import { formatPrice, durationUnitLabel, type CoursePublic, type SubscriptionPlanPublic } from "@/types";

export function HomePage() {
  const navigate = useAppStore((s) => s.navigate);

  const { data: coursesData, loading: coursesLoading } = useApiFetch<{ courses: CoursePublic[] }>(
    "/api/public/courses"
  );
  const { data: plansData, loading: plansLoading } = useApiFetch<{ plans: SubscriptionPlanPublic[] }>(
    "/api/public/plans"
  );

  const featured = (coursesData?.courses || []).slice(0, 6);
  const plans = plansData?.plans || [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.03] via-background to-accent/[0.03]" />
        <div
          className="absolute inset-y-0 right-0 -z-10 hidden lg:block w-1/2 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, rgba(15,118,110,0.10), transparent 55%), radial-gradient(circle at 30% 80%, rgba(23,37,84,0.08), transparent 55%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>Trusted by 2,000+ learners worldwide</span>
              </div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Learn Professionally.
                <span className="block text-accent">Get Certified.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Lumina Learning delivers structured online training with recorded video lessons,
                hands-on assignments and verifiable completion certificates — designed for working
                professionals and dedicated learners.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => navigate(["courses"])} className="gap-2 h-12 px-6">
                  Explore Courses
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate(["plans"])} className="gap-2 h-12 px-6">
                  View Learning Plans
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-accent" /> Recorded video lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-accent" /> Verifiable certificates
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Structured learning paths
                </span>
              </div>
            </div>

            <div className="relative hidden lg:block animate-fade-in-up">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">Course Dashboard</p>
                    <p className="text-xs text-muted-foreground">Track your learning progress</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { name: "Graphic Designing", progress: 80, color: "bg-accent" },
                    { name: "Digital Marketing", progress: 45, color: "bg-primary" },
                    { name: "Web Development", progress: 100, color: "bg-success" },
                  ].map((course) => (
                    <div key={course.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground">{course.name}</span>
                        <span className="text-xs text-muted-foreground">{course.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${course.color} transition-all`} style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-6">
                  {[
                    { label: "Topics", value: "24" },
                    { label: "Lessons", value: "86" },
                    { label: "Certs", value: "3" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl bg-accent/5 border border-accent/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, label: "Active Learners", value: "2,000+" },
              { icon: BookOpen, label: "Courses", value: "48" },
              { icon: Video, label: "Video Lessons", value: "1,200+" },
              { icon: Award, label: "Certificates Issued", value: "5,400+" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading text-xl font-bold text-foreground leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section id="courses" className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-wide">Featured Courses</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground mt-1">
              Start learning from our most popular courses
            </h2>
          </div>
          <Button variant="outline" onClick={() => navigate(["courses"])} className="gap-2">
            View all courses <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {coursesLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden p-0">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title="No courses published yet"
            description="Our team is preparing new courses. Please check back soon."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CourseCardMini key={c.id} course={c} onOpen={() => navigate(["courses"])} />
            ))}
          </div>
        )}
      </section>

      {/* Pricing */}
      <section id="plans" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-accent uppercase tracking-wide">Learning Plans</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground mt-1">
              Choose the plan that fits your goals
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Transparent pricing. No hidden fees. Cancel anytime by letting your plan expire.
            </p>
          </div>

          {plansLoading ? (
            <div className="grid gap-5 md:grid-cols-3">
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
                <PlanCard key={p.id} plan={p} onSelect={() => navigate(["register"], { planId: p.id })} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold text-accent uppercase tracking-wide">About Lumina</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              A learning experience built for serious outcomes
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Lumina Learning is built on a simple belief: real learning requires structure,
              accountability and measurable progress. We organize every course into clear topics,
              pair recorded video lessons with hands-on assignments, and issue verifiable
              certificates that recognize genuine completion — not just attendance.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Video, title: "Structured video lessons", desc: "Watch, track and resume your progress anywhere." },
                { icon: FileText, title: "Hands-on assignments", desc: "Apply what you learn with downloadable assignments." },
                { icon: Award, title: "Verifiable certificates", desc: "Receive a unique certificate ID after completion." },
                { icon: ShieldCheck, title: "Progress accountability", desc: "Lessons are only marked complete when truly watched." },
              ].map((f) => (
                <div key={f.title} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent mb-2">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <p className="font-medium text-foreground text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">4.8 / 5.0</p>
                  <p className="text-xs text-muted-foreground">Average learner rating</p>
                </div>
              </div>
              <blockquote className="text-sm text-foreground italic leading-relaxed">
                &ldquo;The structured learning path kept me accountable. I finished the course,
                submitted my assignment and received a certificate I could actually show to my
                employer. Exactly what I needed.&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  AK
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Aisha K.</p>
                  <p className="text-xs text-muted-foreground">Digital Marketing graduate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold">
            Ready to start your learning journey?
          </h2>
          <p className="mt-2 text-primary-foreground/80 max-w-xl mx-auto">
            Create your account, pick a learning plan and unlock structured courses today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" onClick={() => navigate(["register"])} className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(["courses"])} className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              Browse Courses
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CourseCardMini({ course, onOpen }: { course: CoursePublic; onOpen: () => void }) {
  return (
    <Card className="group overflow-hidden p-0 transition-all hover:shadow-md hover:border-accent/40 cursor-pointer" onClick={onOpen}>
      <div className="relative h-44 overflow-hidden bg-muted">
        {course.thumbnail ? (
           
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <PlayCircle className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={course.accessType === "FREE" ? "secondary" : "default"} className={course.accessType === "FREE" ? "bg-success/15 text-success hover:bg-success/20" : "bg-primary text-primary-foreground"}>
            {course.accessType === "FREE" ? "Free" : "Paid"}
          </Badge>
          {course.category && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur">
              {course.category}
            </Badge>
          )}
        </div>
      </div>
      <div className="p-5 space-y-2">
        <h3 className="font-heading font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {course.description || "No description provided."}
        </p>
        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.topicsCount} topics</span>
          <span className="flex items-center gap-1"><Video className="h-3 w-3" /> {course.videosCount} lessons</span>
          {course.accessType === "PAID" && course.planNames.length > 0 && (
            <span className="flex items-center gap-1 text-accent">
              <ShieldCheck className="h-3 w-3" /> {course.planNames.join(", ")}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function PlanCard({ plan, onSelect }: { plan: SubscriptionPlanPublic; onSelect: () => void }) {
  return (
    <Card className={`relative p-6 flex flex-col ${plan.isPopular ? "border-accent ring-1 ring-accent/30 shadow-md" : ""}`}>
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-accent text-accent-foreground">★ Most Popular</Badge>
        </div>
      )}
      <div className="mb-4">
        <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
        {plan.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
        )}
      </div>
      <div className="mb-4">
        <span className="font-heading text-3xl font-bold text-foreground">
          {formatPrice(plan.price, plan.currency)}
        </span>
        <span className="text-sm text-muted-foreground ml-1">/ {plan.duration} {durationUnitLabel(plan.durationUnit).toLowerCase().replace(/s$/, "")}{plan.duration > 1 ? "s" : ""}</span>
      </div>
      <ul className="mb-6 space-y-2.5 flex-1">
        {plan.features.slice(0, 6).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
        {plan.features.length > 6 && (
          <li className="text-xs text-muted-foreground">+ {plan.features.length - 6} more</li>
        )}
      </ul>
      <Button onClick={onSelect} variant={plan.isPopular ? "default" : "outline"} className="w-full gap-2">
        Select Plan <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}

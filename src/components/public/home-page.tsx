"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { UniversityBadge } from "@/components/shared/university-badge";
import { useApiFetch } from "@/hooks/use-api";
import {
  ArrowRight, BookOpen, Award, Users, Clock, CheckCircle2,
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
      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.03] via-background to-light-teal" />
        <div
          className="absolute inset-y-0 right-0 -z-10 hidden lg:block w-1/2 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, rgba(15,118,110,0.10), transparent 55%), radial-gradient(circle at 30% 80%, rgba(23,37,84,0.06), transparent 55%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-14 md:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>Trusted by 2,000+ learners worldwide</span>
              </div>
              <h1 className="font-heading text-3xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-4xl lg:text-[44px]">
                Learn Professionally.
                <span className="block text-accent">Get Certified.</span>
              </h1>
              <p className="text-base text-muted-foreground max-w-xl leading-relaxed md:text-lg">
                CourseLearn delivers structured online training with recorded video lessons,
                hands-on assignments and verifiable completion certificates — designed for working
                professionals and dedicated learners.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button size="lg" onClick={() => navigate(["courses"])} className="gap-2 h-11 px-6">
                  Explore Courses
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(["plans"])}
                  className="gap-2 h-11 px-6"
                >
                  <TrendingUp className="h-4 w-4" />
                  View Learning Plans
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 text-sm text-muted-foreground">
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

            {/* Dashboard mockup */}
            <div className="relative hidden lg:block animate-fade-in-up">
              <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-teal text-accent">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
                        Course Dashboard
                      </p>
                      <p className="text-xs text-muted-foreground">Track your learning progress</p>
                    </div>
                  </div>
                  <Badge className="bg-success/15 text-success hover:bg-success/15" variant="secondary">
                    Active
                  </Badge>
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    { name: "Graphic Designing", progress: 80, color: "bg-accent" },
                    { name: "Digital Marketing", progress: 45, color: "bg-primary" },
                    { name: "Web Development", progress: 100, color: "bg-success" },
                  ].map((course) => (
                    <div key={course.name}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{course.name}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${course.color} transition-all duration-500`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5">
                  {[
                    { label: "Topics", value: "24" },
                    { label: "Lessons", value: "86" },
                    { label: "Certs", value: "3" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-muted/50 px-3 py-3 text-center">
                      <p className="font-heading text-xl font-bold tabular-nums text-foreground">
                        {s.value}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-xl border border-accent/15 bg-light-teal/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Stats bar ─────────── */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:divide-x md:divide-border">
            {[
              { icon: Users, label: "Active Learners", value: "2,000+" },
              { icon: BookOpen, label: "Courses", value: "48" },
              { icon: Video, label: "Video Lessons", value: "1,200+" },
              { icon: Award, label: "Certificates Issued", value: "5,400+" },
            ].map((s, idx) => (
              <div
                key={s.label}
                className={`flex items-center gap-3 ${idx > 0 ? "md:pl-6" : ""}`}
              >
                <div className="stat-icon bg-light-teal text-accent">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading text-xl font-bold tabular-nums leading-none text-foreground">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Featured Courses ─────────── */}
      <section id="courses" className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Featured Courses
            </p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
              Start learning from our most popular courses
            </h2>
          </div>
          <Button variant="outline" onClick={() => navigate(["courses"])} className="gap-2 h-9">
            View all courses
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {coursesLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden p-0">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="space-y-3 p-5">
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

      {/* ─────────── Pricing ─────────── */}
      <section id="plans" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16">
          <div className="mb-10 space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Learning Plans
            </p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
              Choose the plan that fits your goals
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
              Transparent pricing. No hidden fees. Cancel anytime by letting your plan expire.
            </p>
          </div>

          {plansLoading ? (
            <div className="grid gap-5 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="mb-4 h-6 w-1/3" />
                  <Skeleton className="mb-2 h-10 w-2/3" />
                  <Skeleton className="mb-6 h-4 w-1/2" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                  <Skeleton className="mt-6 h-10 w-full" />
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
            <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
              {plans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onSelect={() => navigate(["register"], { planId: p.id })}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────── About ─────────── */}
      <section id="about" className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">About CourseLearn</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
              A learning experience built for serious outcomes
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              CourseLearn is built on a simple belief: real learning requires structure,
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
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-sm"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-light-teal text-accent">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <p className="font-heading text-sm font-medium tracking-tight text-foreground">
                    {f.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial card */}
          <div className="relative">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
                    4.8 / 5.0
                  </p>
                  <p className="text-xs text-muted-foreground">Average learner rating</p>
                </div>
              </div>
              <blockquote className="text-sm leading-relaxed text-foreground md:text-base">
                <span className="font-heading text-2xl leading-none text-accent">&ldquo;</span>
                The structured learning path kept me accountable. I finished the course, submitted my
                assignment and received a certificate I could actually show to my employer. Exactly
                what I needed.
                <span className="font-heading text-2xl leading-none text-accent">&rdquo;</span>
              </blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  AK
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Aisha K.</p>
                  <p className="text-xs text-muted-foreground">Digital Marketing graduate</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-xl border border-accent/15 bg-light-teal/40" />
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-14 text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-[28px]">
            Ready to start your learning journey?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-primary-foreground/80 md:text-base">
            Create your account, pick a learning plan and unlock structured courses today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(["register"])}
              className="gap-2 h-11 px-6"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(["courses"])}
              className="h-11 border-primary-foreground/30 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
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
    <Card
      className="group cursor-pointer overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/40"
      onClick={onOpen}
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        <CourseThumbnail
          thumbnail={course.thumbnail}
          firstVideoUrl={(course as any).firstVideoUrl}
          firstVideoSource={(course as any).firstVideoSource}
          alt={course.title}
          className="h-full w-full"
          showPlayOverlay
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge
            variant={course.accessType === "FREE" ? "secondary" : "default"}
            className={
              course.accessType === "FREE"
                ? "bg-success/15 text-success hover:bg-success/20"
                : "bg-primary text-primary-foreground"
            }
          >
            {course.accessType === "FREE" ? "Free" : "Paid"}
          </Badge>
          {course.category && (
            <Badge variant="outline" className="border-border bg-background/85 backdrop-blur">
              {course.category}
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-2.5 p-5">
        <h3 className="font-heading text-[15px] font-semibold tracking-tight text-foreground line-clamp-1 transition-colors group-hover:text-accent">
          {course.title}
        </h3>
        {course.university && (
          <UniversityBadge university={course.university} size="xs" />
        )}
        <p className="min-h-[2.5rem] text-sm text-muted-foreground line-clamp-2">
          {course.description || "No description provided."}
        </p>
        <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> {course.topicsCount} topics
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5" /> {course.videosCount} lessons
          </span>
          {course.accessType === "PAID" && course.planNames.length > 0 && (
            <span className="flex items-center gap-1.5 text-accent">
              <ShieldCheck className="h-3.5 w-3.5" /> {course.planNames.join(", ")}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function PlanCard({ plan, onSelect }: { plan: SubscriptionPlanPublic; onSelect: () => void }) {
  return (
    <Card
      className={`relative flex flex-col p-6 transition-all duration-200 hover:shadow-md ${
        plan.isPopular
          ? "border-accent/60 ring-1 ring-accent/25 shadow-md"
          : "hover:border-accent/40"
      }`}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-accent text-accent-foreground shadow-sm">
            <Star className="h-3 w-3 fill-current" /> Most Popular
          </Badge>
        </div>
      )}
      <div className="mb-4">
        <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {plan.name}
        </h3>
        {plan.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
        )}
      </div>
      <div className="mb-5">
        <span className="font-heading text-3xl font-bold tracking-tight text-foreground">
          {formatPrice(plan.price, plan.currency)}
        </span>
        <span className="ml-1 text-sm text-muted-foreground">
          / {plan.duration}{" "}
          {durationUnitLabel(plan.durationUnit).toLowerCase().replace(/s$/, "")}
          {plan.duration > 1 ? "s" : ""}
        </span>
      </div>
      <ul className="mb-6 flex-1 space-y-2.5">
        {plan.features.slice(0, 6).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{f}</span>
          </li>
        ))}
        {plan.features.length > 6 && (
          <li className="text-xs text-muted-foreground">+ {plan.features.length - 6} more</li>
        )}
      </ul>
      <Button
        onClick={onSelect}
        variant={plan.isPopular ? "default" : "outline"}
        className="h-10 w-full gap-2"
      >
        Select Plan
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}

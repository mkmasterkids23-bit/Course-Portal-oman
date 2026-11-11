"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Award, Video, FileText, ShieldCheck, Users, Target, Sparkles, ArrowRight, GraduationCap, BookOpen
} from "lucide-react";

export function AboutPage() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div>
      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden border-b border-border bg-soft-sage/40">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-90"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, rgba(120,151,134,0.18), transparent 55%), radial-gradient(circle at 10% 80%, rgba(52,79,66,0.06), transparent 55%)",
          }}
        />
        <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-16 text-center md:py-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Professional online training since 2021</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-[40px] md:leading-[1.1]">
            About CourseLearn
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed md:text-lg">
            We build learning experiences designed for serious outcomes. Structured courses,
            recorded video lessons, hands-on assignments and verifiable certificates — all in one
            professional platform.
          </p>
        </div>
      </section>

      {/* ─────────── Mission ─────────── */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Our Mission</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
              Make professional learning accountable
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Too many online courses reward attendance instead of mastery. CourseLearn was
              founded on a different idea: every lesson should be genuinely completed before it
              counts. Every assignment should be a real application of knowledge. Every certificate
              should represent actual work.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Our platform organizes courses into clear topics, tracks real video-watch progress,
              unlocks assignments only after genuine completion, and issues unique certificate
              numbers that learners can be proud of.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, value: "2,000+", label: "Active learners" },
              { icon: BookOpen, value: "48", label: "Published courses" },
              { icon: Video, value: "1,200+", label: "Video lessons" },
              { icon: Award, value: "5,400+", label: "Certificates issued" },
            ].map((s) => (
              <Card key={s.label} className="p-5 text-center shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-soft-sage text-accent">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="font-heading text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Approach ─────────── */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-20">
          <div className="mb-12 space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Our Approach</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
              A complete learning journey
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: GraduationCap, title: "Register & choose a plan", desc: "Pick a learning plan that suits your goals and timeline." },
              { icon: Video, title: "Watch & track progress", desc: "Lessons are only marked complete when genuinely watched." },
              { icon: FileText, title: "Apply with assignments", desc: "Assignments unlock after you complete every video lesson." },
              { icon: Award, title: "Earn verifiable certificates", desc: "Receive a unique certificate ID after successful submission." },
            ].map((step, i) => (
              <Card
                key={step.title}
                className="relative p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="absolute -top-3 left-6 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold tabular-nums text-primary-foreground shadow-sm">
                  {i + 1}
                </span>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-soft-sage text-accent">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Values ─────────── */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-20">
        <div className="mb-12 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">What We Stand For</p>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
            Principles behind every course
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Target, title: "Outcome-focused", desc: "We design courses around real skills and verifiable completion, not vanity metrics." },
            { icon: ShieldCheck, title: "Accountability", desc: "Lessons track real watch progress. Assignments unlock only after genuine completion." },
            { icon: Sparkles, title: "Quality first", desc: "Every course is structured into topics with clear video lessons and supporting materials." },
          ].map((v) => (
            <Card
              key={v.title}
              className="p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-accent/40"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-soft-sage text-accent">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
                {v.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 text-center md:py-20">
          <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-[32px]">
            Start learning today
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80 md:text-base">
            Join thousands of learners building real skills with CourseLearn.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(["register"])}
              className="gap-2 h-11 px-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
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

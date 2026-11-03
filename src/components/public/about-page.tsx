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
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-primary/[0.03] via-background to-accent/[0.03]">
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Professional online training since 2021</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            About Lumina Learning
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            We build learning experiences designed for serious outcomes. Structured courses,
            recorded video lessons, hands-on assignments and verifiable certificates — all in
            one professional platform.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold text-accent uppercase tracking-wide">Our Mission</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Make professional learning accountable
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Too many online courses reward attendance instead of mastery. Lumina Learning was
              founded on a different idea: every lesson should be genuinely completed before it
              counts. Every assignment should be a real application of knowledge. Every
              certificate should represent actual work.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our platform organizes courses into clear topics, tracks real video-watch
              progress, unlocks assignments only after genuine completion, and issues unique
              certificate numbers that learners can be proud of.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, value: "2,000+", label: "Active learners" },
              { icon: BookOpen, value: "48", label: "Published courses" },
              { icon: Video, value: "1,200+", label: "Video lessons" },
              { icon: Award, value: "5,400+", label: "Certificates issued" },
            ].map((s) => (
              <Card key={s.label} className="p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent mb-3">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-accent uppercase tracking-wide">Our Approach</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground mt-1">
              A complete learning journey
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: GraduationCap, title: "Register & choose a plan", desc: "Pick a learning plan that suits your goals and timeline." },
              { icon: Video, title: "Watch & track progress", desc: "Lessons are only marked complete when genuinely watched." },
              { icon: FileText, title: "Apply with assignments", desc: "Assignments unlock after you complete every video lesson." },
              { icon: Award, title: "Earn verifiable certificates", desc: "Receive a unique certificate ID after successful submission." },
            ].map((step, i) => (
              <Card key={step.title} className="relative p-6">
                <span className="absolute -top-3 left-6 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent mb-3">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-accent uppercase tracking-wide">What We Stand For</p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground mt-1">
            Principles behind every course
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "Outcome-focused", desc: "We design courses around real skills and verifiable completion, not vanity metrics." },
            { icon: ShieldCheck, title: "Accountability", desc: "Lessons track real watch progress. Assignments unlock only after genuine completion." },
            { icon: Sparkles, title: "Quality first", desc: "Every course is structured into topics with clear video lessons and supporting materials." },
          ].map((v) => (
            <Card key={v.title} className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent mb-3">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">{v.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold">Start learning today</h2>
          <p className="mt-2 text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands of learners building real skills with Lumina Learning.
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

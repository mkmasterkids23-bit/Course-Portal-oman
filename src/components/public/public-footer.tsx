"use client";

import { Mail, Phone, MapPin, GraduationCap, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useAppStore } from "@/stores/app-store";

export function PublicFooter() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-5 lg:col-span-1">
            <BrandLogo onClick={() => navigate([""])} />
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              A professional online training platform delivering structured courses,
              recorded video lessons and verifiable completion certificates.
            </p>
            <div className="flex items-center gap-2">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Linkedin, label: "LinkedIn" },
                { Icon: Youtube, label: "YouTube" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:border-accent/40 hover:text-accent hover:bg-light-teal"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              Navigation
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Home", segments: [""] },
                { label: "Courses", segments: ["courses"] },
                { label: "Learning Plans", segments: ["plans"] },
                { label: "About", segments: ["about"] },
                { label: "Login", segments: ["login"] },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.segments)}
                    className="text-muted-foreground transition-colors duration-200 hover:text-accent"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular courses */}
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              Popular Courses
            </h4>
            <ul className="space-y-3 text-sm">
              {["Graphic Designing", "Digital Marketing", "Web Development", "Business Analytics"].map(
                (label) => (
                  <li key={label}>
                    <button
                      onClick={() => navigate(["courses"])}
                      className="text-muted-foreground transition-colors duration-200 hover:text-accent"
                    >
                      {label}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              Get in touch
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-light-teal text-accent">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <span className="text-muted-foreground">hello@luminalearning.dev</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-light-teal text-accent">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <span className="text-muted-foreground">+968 9000 0000</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-light-teal text-accent">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span className="text-muted-foreground">Muscat, Sultanate of Oman</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Lumina Learning. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-accent" />
            <span>Professional online training &amp; certification</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

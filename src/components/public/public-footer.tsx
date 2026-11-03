"use client";

import { Mail, Phone, MapPin, GraduationCap, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useAppStore } from "@/stores/app-store";

export function PublicFooter() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <BrandLogo onClick={() => navigate([""])} />
            <p className="text-sm text-muted-foreground max-w-xs">
              A professional online training platform delivering structured courses,
              recorded video lessons and verifiable completion certificates.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li><button onClick={() => navigate([""])} className="text-muted-foreground hover:text-accent transition-colors">Home</button></li>
              <li><button onClick={() => navigate(["courses"])} className="text-muted-foreground hover:text-accent transition-colors">Courses</button></li>
              <li><button onClick={() => navigate(["plans"])} className="text-muted-foreground hover:text-accent transition-colors">Learning Plans</button></li>
              <li><button onClick={() => navigate(["about"])} className="text-muted-foreground hover:text-accent transition-colors">About</button></li>
              <li><button onClick={() => navigate(["login"])} className="text-muted-foreground hover:text-accent transition-colors">Login</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground mb-4">Popular Courses</h4>
            <ul className="space-y-2.5 text-sm">
              <li><button onClick={() => navigate(["courses"])} className="text-muted-foreground hover:text-accent transition-colors">Graphic Designing</button></li>
              <li><button onClick={() => navigate(["courses"])} className="text-muted-foreground hover:text-accent transition-colors">Digital Marketing</button></li>
              <li><button onClick={() => navigate(["courses"])} className="text-muted-foreground hover:text-accent transition-colors">Web Development</button></li>
              <li><button onClick={() => navigate(["courses"])} className="text-muted-foreground hover:text-accent transition-colors">Business Analytics</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <span>hello@luminalearning.dev</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                <span>+968 9000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                <span>Muscat, Sultanate of Oman</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Lumina Learning. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Professional online training & certification</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

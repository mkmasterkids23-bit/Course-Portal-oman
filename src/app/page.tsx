"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { PublicSite } from "@/components/public/public-site";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { StudentDashboard } from "@/components/student/student-dashboard";
import { UniversityDashboard } from "@/components/university/university-dashboard";
import { FullPageLoader } from "@/components/shared/full-page-loader";

export default function Home() {
  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);
  const refreshUser = useAppStore((s) => s.refreshUser);
  const setHashFromWindow = useAppStore((s) => s.setHashFromWindow);

  // Initial auth + hash setup
  useEffect(() => {
    refreshUser();
    setHashFromWindow();
    const onHash = () => setHashFromWindow();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [refreshUser, setHashFromWindow]);

  // Auto-initialize the platform (creates default admin/plans if empty)
  useEffect(() => {
    fetch("/api/public/init", { cache: "no-store" }).catch(() => {});
  }, []);

  // Whenever user logs in/out, force the route to a sensible default
  useEffect(() => {
    if (authLoading) return;
    const hash = window.location.hash.replace(/^#/, "");
    if (user?.role === "ADMIN") {
      if (!hash.startsWith("/admin")) {
        window.location.hash = "/admin";
      }
    } else if (user?.role === "UNIVERSITY") {
      if (!hash.startsWith("/university")) {
        window.location.hash = "/university";
      }
    } else if (user?.role === "STUDENT") {
      if (
        hash.startsWith("/admin") ||
        hash.startsWith("/university") ||
        hash.startsWith("/login") ||
        hash.startsWith("/register")
      ) {
        window.location.hash = "/student";
      }
    } else {
      // Not logged in — redirect away from protected areas
      if (
        hash.startsWith("/admin") ||
        hash.startsWith("/student") ||
        hash.startsWith("/university")
      ) {
        window.location.hash = "/";
      }
    }
  }, [user, authLoading]);

  if (authLoading) {
    return <FullPageLoader />;
  }

  if (user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  if (user?.role === "UNIVERSITY") {
    return <UniversityDashboard />;
  }

  if (user?.role === "STUDENT") {
    return <StudentDashboard />;
  }

  return <PublicSite />;
}

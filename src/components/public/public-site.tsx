"use client";

import { useAppStore } from "@/stores/app-store";
import { PublicNavbar } from "./public-navbar";
import { PublicFooter } from "./public-footer";
import { HomePage } from "./home-page";
import { CoursesPage } from "./courses-page";
import { PlansPage } from "./plans-page";
import { AboutPage } from "./about-page";
import { LoginPage } from "./login-page";
import { RegisterPage } from "./register-page";
import { NotFoundPage } from "./not-found-page";
import { FullPageLoader } from "@/components/shared/full-page-loader";
import { useEffect } from "react";

export function PublicSite() {
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);

  const first = segments[0] || "";

  // If someone lands on /admin or /student while not authenticated (or while
  // auth is still resolving), don't show "Page not found". Instead:
  //  - If we know the user is null, redirect to home immediately.
  //  - If auth is still loading, show the full-page loader.
  // The page.tsx effect also handles this, but doing it here prevents the
  // NotFoundPage flash that happens between authLoading flipping to false
  // and the redirect effect running.
  useEffect(() => {
    if (first === "admin" || first === "student") {
      // user is null here (otherwise AdminDashboard / StudentDashboard would render)
      navigate([""]);
    }
  }, [first, navigate]);

  if (first === "admin" || first === "student") {
    // Show loader while the redirect above takes effect
    return <FullPageLoader />;
  }

  // Auth pages get a minimal layout (no navbar/footer)
  if (first === "login") {
    return <LoginPage />;
  }
  if (first === "register") {
    return <RegisterPage />;
  }

  let page: React.ReactNode;
  switch (first) {
    case "":
    case "home":
      page = <HomePage />;
      break;
    case "courses":
      page = <CoursesPage />;
      break;
    case "plans":
      page = <PlansPage />;
      break;
    case "about":
      page = <AboutPage />;
      break;
    default:
      page = <NotFoundPage onHome={() => navigate([""])} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">{page}</main>
      <PublicFooter />
    </div>
  );
}

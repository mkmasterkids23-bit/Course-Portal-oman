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

export function PublicSite() {
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);

  const first = segments[0] || "";

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

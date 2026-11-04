"use client";

import { useAppStore } from "@/stores/app-store";
import { StudentSidebar } from "./student-sidebar";
import { StudentTopbar } from "./student-topbar";
import { StudentOverview } from "./student-overview";
import { StudentMyCourses } from "./student-my-courses";
import { StudentLearning } from "./student-learning";
import { StudentAssignments } from "./student-assignments";
import { StudentSubscription } from "./student-subscription";
import { StudentCertificates } from "./student-certificates";
import { StudentProfile } from "./student-profile";
import { ExpiredScreen } from "./expired-screen";
import { useApiFetch } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SubscriptionInfo {
  subscriptionId: string;
  planId: string;
  planName: string;
  planPrice: number;
  planCurrency: string;
  planDuration: number;
  planDurationUnit: string;
  startDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRED";
  remainingDays: number;
  elapsedPercent: number;
}

export function StudentDashboard() {
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const section = segments[1] || "overview";

  // For protected sections, fetch subscription and show expired screen if needed.
  // Hook is called unconditionally to satisfy the rules-of-hooks (the early
  // return for the "learn" route happens below).
  const isProtected = ["overview", "courses", "assignments", "certificates"].includes(section);
  const { data: subData } = useApiFetch<{ subscription: SubscriptionInfo | null }>(
    isProtected ? "/api/student/subscription" : null
  );

  // /student/learn/:courseId → learning page (subscription-guarded)
  if (section === "learn" && segments[2]) {
    return (
      <StudentLearning
        courseId={segments[2]}
        onBack={() => navigate(["student", "courses"])}
      />
    );
  }

  if (isProtected && subData?.subscription && subData.subscription.status === "EXPIRED") {
    return <ExpiredScreen />;
  }

  let content: React.ReactNode;
  switch (section) {
    case "overview":
      content = <StudentOverview />;
      break;
    case "courses":
      content = <StudentMyCourses />;
      break;
    case "assignments":
      content = <StudentAssignments />;
      break;
    case "subscription":
      content = <StudentSubscription />;
      break;
    case "certificates":
      content = <StudentCertificates />;
      break;
    case "profile":
      content = <StudentProfile />;
      break;
    default:
      content = <StudentOverview />;
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <StudentSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="lg:pl-64">
        <StudentTopbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="p-4 md:p-6 lg:p-8 animate-page-in" key={section}>{content}</main>
      </div>
    </div>
  );
}

"use client";

import { useAppStore } from "@/stores/app-store";
import { UniversitySidebar } from "./university-sidebar";
import { UniversityTopbar } from "./university-topbar";
import { UniversityOverview } from "./university-overview";
import { UniversityCourses } from "./university-courses";
import { UniversityCourseEditor } from "./university-course-editor";
import { UniversityMaterials } from "./university-materials";
import { UniversityAssignments } from "./university-assignments";
import { UniversitySubmissions } from "./university-submissions";
import { UniversityCertificates } from "./university-certificates";
import { UniversitySettings } from "./university-settings";
import { UniversityRevenue } from "./university-revenue";
import { UniversityStudents } from "./university-students";
import { UniversityCourseAnalytics } from "./university-course-analytics";
import { UniversityAssessmentAnalytics } from "./university-assessment-analytics";
import { UniversityAnnouncements } from "./university-announcements";
import { UniversityInstructors } from "./university-instructors";
import { UniversityScheduling } from "./university-scheduling";
import { UniversityBranding } from "./university-branding";
import { UniversityDiscussions } from "./university-discussions";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function UniversityDashboard() {
  const segments = useAppStore((s) => s.segments);
  const navigate = useAppStore((s) => s.navigate);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const section = segments[1] || "overview";

  let content: React.ReactNode;
  if (section === "courses" && segments[2]) {
    content = (
      <UniversityCourseEditor
        courseId={segments[2]}
        onBack={() => navigate(["university", "courses"])}
      />
    );
  } else {
    switch (section) {
      case "overview":
        content = <UniversityOverview />;
        break;
      case "courses":
        content = <UniversityCourses />;
        break;
      case "materials":
        content = <UniversityMaterials />;
        break;
      case "scheduling":
        content = <UniversityScheduling />;
        break;
      case "assignments":
        content = <UniversityAssignments />;
        break;
      case "submissions":
        content = <UniversitySubmissions />;
        break;
      case "discussions":
        content = <UniversityDiscussions />;
        break;
      case "students":
        content = <UniversityStudents />;
        break;
      case "course-analytics":
        content = <UniversityCourseAnalytics />;
        break;
      case "assessment-analytics":
        content = <UniversityAssessmentAnalytics />;
        break;
      case "announcements":
        content = <UniversityAnnouncements />;
        break;
      case "instructors":
        content = <UniversityInstructors />;
        break;
      case "certificates":
        content = <UniversityCertificates />;
        break;
      case "branding":
        content = <UniversityBranding />;
        break;
      case "revenue":
        content = <UniversityRevenue />;
        break;
      case "settings":
        content = <UniversitySettings />;
        break;
      default:
        content = <UniversityOverview />;
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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
        <UniversitySidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="lg:pl-64">
        <UniversityTopbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 animate-page-in" key={section}>
          {content}
        </main>
      </div>
    </div>
  );
}

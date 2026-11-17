import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  getStudentSubscription,
  handleAuthError,
} from "@/lib/auth";
import {
  canStudentAccessCourse,
  getCourseCompletionStats,
  isCourseCompletedByStudent,
} from "@/lib/course-utils";

export async function GET() {
  try {
    const user = await requireStudent();
    const subscription = await getStudentSubscription(user.id);
    const isSubActive = subscription?.status === "ACTIVE";

    // Fetch all published assignments across published courses
    const assignments = await db.assignment.findMany({
      where: {
        isPublished: true,
        course: { isPublished: true },
      },
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          where: { studentId: user.id },
          select: {
            id: true,
            fileUrl: true,
            submittedAt: true,
            status: true,
            reviewNotes: true,
            reviewedAt: true,
          },
          take: 1,
        },
      },
    });

    type AssignmentWithCourse = {
      id: string;
      courseId: string;
      courseTitle: string;
      title: string;
      description: string | null;
      instructions: string | null;
      fileUrl: string | null;
      dueDate: Date | null;
      isPublished: boolean;
      allowResubmission: boolean;
      submission: {
        id: string;
        fileUrl: string;
        submittedAt: Date;
        status: "SUBMITTED" | "REVIEWED";
        reviewNotes: string | null;
        reviewedAt: Date | null;
      } | null;
      unlocked: boolean;
      lockedReason: string | null;
      courseCompletion: {
        percent: number;
        completedVideos: number;
        totalVideos: number;
        allCompleted: boolean;
      };
    };
    const result: AssignmentWithCourse[] = [];
    for (const a of assignments) {
      const access = await canStudentAccessCourse(user.id, a.course.id);
      if (!access.allowed) continue; // skip courses student can't access

      const stats = await getCourseCompletionStats(user.id, a.course.id);
      const completed = await isCourseCompletedByStudent(user.id, a.course.id);
      const unlocked = isSubActive && completed;

      const submission = a.submissions[0] || null;

      result.push({
        id: a.id,
        courseId: a.course.id,
        courseTitle: a.course.title,
        title: a.title,
        description: a.description,
        instructions: a.instructions,
        fileUrl: a.fileUrl,
        dueDate: a.dueDate,
        isPublished: a.isPublished,
        allowResubmission: a.allowResubmission,
        submission: submission
          ? {
              id: submission.id,
              fileUrl: submission.fileUrl,
              submittedAt: submission.submittedAt,
              status: submission.status as "SUBMITTED" | "REVIEWED",
              reviewNotes: submission.reviewNotes,
              reviewedAt: submission.reviewedAt,
            }
          : null,
        unlocked,
        lockedReason: !isSubActive
          ? "Subscription expired"
          : !completed
            ? "Complete all course lessons first"
            : null,
        courseCompletion: {
          percent: stats.percent,
          completedVideos: stats.completedVideos,
          totalVideos: stats.totalVideos,
          allCompleted: completed,
        },
      });
    }

    return NextResponse.json({
      assignments: result,
      subscription,
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/assignments GET]", e);
    return NextResponse.json(
      { error: "Failed to load assignments" },
      { status: 500 }
    );
  }
}

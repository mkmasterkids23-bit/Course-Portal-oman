import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireUniversityOrInstructor,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";

/**
 * GET /api/university/overview
 * Returns dashboard stats scoped to the logged-in university.
 * Instructors see stats only for their assigned courses.
 */
export async function GET() {
  try {
    const user = await requireUniversityOrInstructor();
    const universityId = user.universityId!;

    // Instructors are scoped to their assigned courses.
    const isInstructor = user.role === "INSTRUCTOR";
    const instructorId = isInstructor ? user.instructorId : null;
    const courseFilter = instructorId
      ? { universityId, instructorId }
      : { universityId };

    // Pull all aggregate stats in parallel
    const [
      totalCourses,
      totalPublishedCourses,
      totalVideoLessons,
      pendingReviews,
      totalCertificatesIssued,
      totalAssignments,
      totalSubmittedAssignments,
      recentSubmissionsRaw,
      recentCoursesRaw,
    ] = await Promise.all([
      db.course.count({ where: courseFilter }),
      db.course.count({ where: { ...courseFilter, isPublished: true } }),
      db.videoLesson.count({
        where: { course: courseFilter, isPublished: true },
      }),
      db.assignmentSubmission.count({
        where: {
          status: "SUBMITTED",
          assignment: { course: courseFilter },
        },
      }),
      db.certificate.count({ where: { course: courseFilter } }),
      db.assignment.count({ where: { course: courseFilter } }),
      db.assignmentSubmission.count({
        where: { assignment: { course: courseFilter } },
      }),
      db.assignmentSubmission.findMany({
        where: { assignment: { course: courseFilter } },
        orderBy: { submittedAt: "desc" },
        take: 6,
        include: {
          student: { select: { id: true, name: true, email: true } },
          assignment: {
            select: {
              id: true,
              title: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      }),
      db.course.findMany({
        where: courseFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          isPublished: true,
        },
      }),
    ]);

    // Count distinct students who have any progress in this scope's courses
    const distinctStudents = await db.videoProgress.groupBy({
      by: ["studentId"],
      where: { video: { course: courseFilter } },
    });
    const totalStudents = distinctStudents.length;

    return NextResponse.json({
      totalCourses,
      totalPublishedCourses,
      totalVideoLessons,
      pendingReviews,
      totalCertificatesIssued,
      totalAssignments,
      totalSubmittedAssignments,
      totalStudents,
      recentSubmissions: recentSubmissionsRaw.map((s) => ({
        id: s.id,
        studentId: s.student.id,
        studentName: s.student.name,
        studentEmail: s.student.email,
        assignmentId: s.assignment.id,
        assignmentTitle: s.assignment.title,
        courseId: s.assignment.course.id,
        courseTitle: s.assignment.course.title,
        submittedAt: s.submittedAt,
        status: s.status,
      })),
      recentCourses: recentCoursesRaw.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        isPublished: c.isPublished,
      })),
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/overview]", e);
    return errorResponse("Failed to load overview", 500);
  }
}

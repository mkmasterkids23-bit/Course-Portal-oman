import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalStudents,
      totalCourses,
      totalFreeCourses,
      totalPaidCourses,
      totalActiveSubscriptions,
      totalExpiredSubscriptions,
      totalAssignments,
      totalSubmittedAssignments,
      totalCertificatesIssued,
      recentStudentsRaw,
      recentCoursesRaw,
      recentSubmissionsRaw,
      recentCertificatesRaw,
    ] = await Promise.all([
      db.user.count({ where: { role: "STUDENT" } }),
      db.course.count(),
      db.course.count({ where: { accessType: "FREE" } }),
      db.course.count({ where: { accessType: "PAID" } }),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.subscription.count({ where: { status: "EXPIRED" } }),
      db.assignment.count(),
      db.assignmentSubmission.count(),
      db.certificate.count(),
      db.user.findMany({
        where: { role: "STUDENT" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      db.course.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, createdAt: true, isPublished: true },
      }),
      db.assignmentSubmission.findMany({
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: {
          student: { select: { name: true } },
          assignment: { select: { title: true } },
        },
      }),
      db.certificate.findMany({
        orderBy: { issuedAt: "desc" },
        take: 5,
        include: {
          student: { select: { name: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalStudents,
      totalCourses,
      totalFreeCourses,
      totalPaidCourses,
      totalActiveSubscriptions,
      totalExpiredSubscriptions,
      totalAssignments,
      totalSubmittedAssignments,
      totalCertificatesIssued,
      recentStudents: recentStudentsRaw.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        createdAt: s.createdAt,
      })),
      recentCourses: recentCoursesRaw.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        isPublished: c.isPublished,
      })),
      recentSubmissions: recentSubmissionsRaw.map((s) => ({
        id: s.id,
        studentName: s.student.name,
        assignmentTitle: s.assignment.title,
        submittedAt: s.submittedAt,
      })),
      recentCertificates: recentCertificatesRaw.map((c) => ({
        id: c.id,
        studentName: c.student.name,
        courseTitle: c.course.title,
        issuedAt: c.issuedAt,
      })),
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[admin/overview]", e);
    return errorResponse("Failed to load overview", 500);
  }
}

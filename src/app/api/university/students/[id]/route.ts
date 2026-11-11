import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUniversity, handleAuthError, errorResponse } from "@/lib/auth";

/**
 * GET /api/university/students/[id]
 * Detailed student profile scoped to the logged-in university.
 * Returns: enrolled courses (with progress), assessment scores, assignment
 * submissions, and issued certificates — but ONLY for courses owned by this
 * university.
 *
 * Ownership guard: the student must have at least one VideoProgress record
 * in one of this university's courses. Otherwise we 404.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUniversity();
    const universityId = user.universityId!;
    const { id: studentId } = await params;

    // Verify the student exists and is actually enrolled in this university
    // (has progress in any of its courses).
    const enrollmentCount = await db.videoProgress.count({
      where: {
        studentId,
        video: { course: { universityId } },
      },
    });
    if (enrollmentCount === 0) {
      return errorResponse("Student not found in your university", 404, "NOT_FOUND");
    }

    const student = await db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        profilePhoto: true,
        createdAt: true,
      },
    });
    if (!student) {
      return errorResponse("Student not found", 404, "NOT_FOUND");
    }

    // Fetch everything scoped to the university in parallel.
    const [progress, assessments, submissions, certificates, universityCourses] =
      await Promise.all([
        db.videoProgress.findMany({
          where: {
            studentId,
            video: { course: { universityId } },
          },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                isPublished: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        }),
        db.videoAssessment.findMany({
          where: {
            studentId,
            video: { course: { universityId } },
          },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        db.assignmentSubmission.findMany({
          where: {
            studentId,
            assignment: { course: { universityId } },
          },
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        }),
        db.certificate.findMany({
          where: {
            studentId,
            course: { universityId },
          },
          include: {
            course: { select: { id: true, title: true } },
          },
          orderBy: { issuedAt: "desc" },
        }),
        db.course.findMany({
          where: { universityId },
          select: {
            id: true,
            title: true,
            videos: { where: { isPublished: true }, select: { id: true } },
          },
        }),
      ]);

    // Per-course published video counts.
    const courseVideoCount = new Map<string, number>();
    for (const c of universityCourses) courseVideoCount.set(c.id, c.videos.length);

    // Group progress by course → compute completion %.
    const courseMap = new Map<
      string,
      {
        id: string;
        title: string;
        totalVideos: number;
        completedVideos: number;
        lastActivity: Date;
      }
    >();
    for (const p of progress) {
      const cId = p.video.course.id;
      const cTitle = p.video.course.title;
      const existing = courseMap.get(cId);
      if (existing) {
        if (p.isCompleted) existing.completedVideos += 1;
        if (p.updatedAt > existing.lastActivity) existing.lastActivity = p.updatedAt;
      } else {
        courseMap.set(cId, {
          id: cId,
          title: cTitle,
          totalVideos: courseVideoCount.get(cId) ?? 0,
          completedVideos: p.isCompleted ? 1 : 0,
          lastActivity: p.updatedAt,
        });
      }
    }

    const enrolledCourses = Array.from(courseMap.values())
      .map((c) => {
        const completionPct =
          c.totalVideos > 0
            ? Math.round((c.completedVideos / c.totalVideos) * 100)
            : c.completedVideos > 0
              ? 100
              : 0;
        return {
          id: c.id,
          title: c.title,
          totalVideos: c.totalVideos,
          completedVideos: c.completedVideos,
          completionPct,
          lastActivity: c.lastActivity,
        };
      })
      .sort((a, b) => b.completionPct - a.completionPct);

    // Assessment summary stats.
    const assessmentList = assessments.map((a) => ({
      id: a.id,
      videoId: a.video.id,
      videoTitle: a.video.title,
      courseId: a.video.course.id,
      courseTitle: a.video.course.title,
      score: a.score,
      passed: a.passed,
      attempts: a.attempts,
      updatedAt: a.updatedAt,
    }));
    const avgAssessmentScore =
      assessmentList.length > 0
        ? Math.round(
            assessmentList.reduce((sum, a) => sum + a.score, 0) / assessmentList.length,
          )
        : 0;
    const passedAssessmentCount = assessmentList.filter((a) => a.passed).length;

    const submissionList = submissions.map((s) => ({
      id: s.id,
      fileUrl: s.fileUrl,
      submittedAt: s.submittedAt,
      status: s.status as "SUBMITTED" | "REVIEWED",
      reviewNotes: s.reviewNotes,
      reviewedAt: s.reviewedAt,
      assignmentId: s.assignment.id,
      assignmentTitle: s.assignment.title,
      courseId: s.assignment.course.id,
      courseTitle: s.assignment.course.title,
    }));

    const certificateList = certificates.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      templateTitle: c.templateTitle,
      organizationName: c.organizationName,
      issuedAt: c.issuedAt,
      courseId: c.course.id,
      courseTitle: c.course.title,
    }));

    const avgCompletionPct =
      enrolledCourses.length > 0
        ? Math.round(
            enrolledCourses.reduce((sum, c) => sum + c.completionPct, 0) /
              enrolledCourses.length,
          )
        : 0;

    return NextResponse.json({
      student,
      stats: {
        enrolledCourseCount: enrolledCourses.length,
        completedCourseCount: enrolledCourses.filter((c) => c.completionPct >= 100).length,
        avgCompletionPct,
        assessmentCount: assessmentList.length,
        avgAssessmentScore,
        passedAssessmentCount,
        submissionCount: submissionList.length,
        certificateCount: certificateList.length,
      },
      enrolledCourses,
      assessments: assessmentList,
      submissions: submissionList,
      certificates: certificateList,
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/students/[id]]", e);
    return errorResponse("Failed to load student profile", 500);
  }
}

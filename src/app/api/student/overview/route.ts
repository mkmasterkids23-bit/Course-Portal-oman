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
    const firstName = user.name.split(" ")[0] || user.name;
    const subscription = await getStudentSubscription(user.id);

    // Fetch all accessible courses (mirror the courses endpoint logic)
    const allCourses = await db.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        planAccess: { select: { planId: true } },
        accessType: true,
      },
    });

    const isSubActive = subscription?.status === "ACTIVE";
    const subPlanId = subscription?.planId;

    const accessibleCourseIds: string[] = [];
    for (const c of allCourses) {
      let allowed = false;
      if (c.accessType === "FREE") allowed = true;
      else if (isSubActive && subPlanId)
        allowed = c.planAccess.some((pa) => pa.planId === subPlanId);
      if (allowed) accessibleCourseIds.push(c.id);
    }

    let availableCourses = 0;
    let inProgressCourses = 0;
    let completedCourses = 0;
    let overallPercentSum = 0;

    const continueLearning: any[] = [];

    for (const cid of accessibleCourseIds) {
      const stats = await getCourseCompletionStats(user.id, cid);
      availableCourses++;
      overallPercentSum += stats.percent;

      if (
        stats.totalVideos > 0 &&
        stats.completedVideos === stats.totalVideos
      ) {
        completedCourses++;
      } else if (stats.completedVideos > 0) {
        inProgressCourses++;
      }

      // last-watched video for "Continue Learning"
      const lastProgress = await db.videoProgress.findFirst({
        where: {
          studentId: user.id,
          video: { courseId: cid, isPublished: true },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          videoId: true,
          video: { select: { title: true } },
        },
      });
      const courseMeta = allCourses.find((c) => c.id === cid);
      if (lastProgress && courseMeta) {
        // Fetch first video thumbnail for fallback
        const firstVideo = await db.videoLesson.findFirst({
          where: { courseId: cid, isPublished: true },
          orderBy: { displayOrder: "asc" },
          select: { thumbnail: true, videoUrl: true, source: true },
        });
        continueLearning.push({
          courseId: cid,
          courseTitle: courseMeta.title,
          thumbnail: courseMeta.thumbnail || firstVideo?.thumbnail || null,
          firstVideoUrl: firstVideo?.videoUrl || null,
          firstVideoSource: firstVideo?.source || null,
          lastVideoId: lastProgress.videoId,
          lastVideoTitle: lastProgress.video.title,
          percent: stats.percent,
        });
      }
    }

    const overallPercent =
      availableCourses > 0
        ? Math.round(overallPercentSum / availableCourses)
        : 0;

    // Upcoming assignments (accessible + not yet submitted)
    const assignments = await db.assignment.findMany({
      where: {
        isPublished: true,
        course: { isPublished: true },
      },
      orderBy: { dueDate: "asc" },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          where: { studentId: user.id },
          select: { id: true },
          take: 1,
        },
      },
    });

    const upcomingAssignments: any[] = [];
    for (const a of assignments) {
      const access = await canStudentAccessCourse(user.id, a.course.id);
      if (!access.allowed) continue;
      const completed = await isCourseCompletedByStudent(user.id, a.course.id);
      const stats = await getCourseCompletionStats(user.id, a.course.id);
      upcomingAssignments.push({
        id: a.id,
        courseId: a.course.id,
        courseTitle: a.course.title,
        assignmentTitle: a.title,
        dueDate: a.dueDate,
        unlocked: isSubActive && completed,
        submitted: a.submissions.length > 0,
        coursePercent: stats.percent,
      });
    }

    // Recent certificates
    const recentCertificatesRaw = await db.certificate.findMany({
      where: { studentId: user.id },
      orderBy: { issuedAt: "desc" },
      take: 5,
      include: { course: { select: { title: true } } },
    });
    const recentCertificates = recentCertificatesRaw.map((c) => ({
      id: c.id,
      courseTitle: c.course.title,
      issuedAt: c.issuedAt,
      certificateNumber: c.certificateNumber,
    }));

    // Sort continue-learning by recency (already sorted via DB), take 6
    continueLearning.splice(6);

    return NextResponse.json({
      welcomeName: firstName,
      subscription,
      learning: {
        availableCourses,
        inProgressCourses,
        completedCourses,
        overallPercent,
      },
      continueLearning,
      upcomingAssignments,
      recentCertificates,
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/overview GET]", e);
    return NextResponse.json(
      { error: "Failed to load overview" },
      { status: 500 }
    );
  }
}

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
        university: { select: { id: true, name: true, logo: true } },
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

      if (stats.completedVideos === stats.totalVideos) {
        // Includes no-video courses (0 === 0) — considered completed.
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
        const uni = courseMeta.university;
        continueLearning.push({
          courseId: cid,
          courseTitle: courseMeta.title,
          thumbnail: courseMeta.thumbnail || firstVideo?.thumbnail || null,
          firstVideoUrl: firstVideo?.videoUrl || null,
          firstVideoSource: firstVideo?.source || null,
          lastVideoId: lastProgress.videoId,
          lastVideoTitle: lastProgress.video.title,
          percent: stats.percent,
          university: uni ? { id: uni.id, name: uni.name, logo: uni.logo } : null,
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

    // ─── Upcoming activities: pending assignments + pending video assessments ───
    // We extend the existing upcomingAssignments list with assessment items
    // (videos that have questions and the student hasn't passed the test yet)
    // so the dashboard can show a single consolidated "Upcoming Activities"
    // section. Each item is normalized to:
    //   { id, type, courseId, courseTitle, title, dueDate?, status, priority }
    const upcomingActivities: any[] = [];

    // 1. Pending assignments (reuse upcomingAssignments but re-shape)
    for (const a of upcomingAssignments) {
      const dueMs = a.dueDate ? new Date(a.dueDate).getTime() - Date.now() : null;
      upcomingActivities.push({
        id: `asg-${a.id}`,
        type: "assignment",
        courseId: a.courseId,
        courseTitle: a.courseTitle,
        title: a.assignmentTitle,
        dueDate: a.dueDate,
        status: a.submitted
          ? "submitted"
          : a.unlocked
            ? "available"
            : "locked",
        priority: dueMs !== null && dueMs < 0 ? "overdue" : "normal",
      });
    }

    // 2. Pending video assessments — videos with questions where the student
    //    has watched (or started) but hasn't yet passed the assessment.
    //    Limit to the student's accessible courses to keep things relevant.
    const accessibleCourseIdSet = new Set(accessibleCourseIds);
    const videosWithQuestions = await db.videoQuestion.findMany({
      where: {
        video: {
          courseId: { in: accessibleCourseIds },
          isPublished: true,
        },
      },
      select: { videoId: true },
      distinct: ["videoId"],
    });
    const videoIdsWithQuestions = videosWithQuestions.map((q) => q.videoId);

    if (videoIdsWithQuestions.length) {
      // Already-passed assessments
      const passedAssessments = await db.videoAssessment.findMany({
        where: {
          studentId: user.id,
          videoId: { in: videoIdsWithQuestions },
          passed: true,
        },
        select: { videoId: true },
      });
      const passedSet = new Set(passedAssessments.map((a) => a.videoId));

      // Pull the videos themselves (with course context) — only those not yet passed
      const pendingAssessmentVideos = await db.videoLesson.findMany({
        where: {
          id: { in: videoIdsWithQuestions },
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          courseId: true,
          course: { select: { id: true, title: true } },
        },
        take: 50,
      });

      for (const v of pendingAssessmentVideos) {
        if (passedSet.has(v.id)) continue;
        // Only show if the course is accessible to the student
        if (!accessibleCourseIdSet.has(v.courseId)) continue;
        upcomingActivities.push({
          id: `va-${v.id}`,
          type: "assessment",
          courseId: v.courseId,
          courseTitle: v.course.title,
          title: v.title,
          dueDate: null,
          status: "pending",
          priority: "normal",
        });
      }
    }

    // Sort upcoming activities: overdue first, then by due date asc (nulls last)
    upcomingActivities.sort((a, b) => {
      const pa = a.priority === "overdue" ? 0 : 1;
      const pb = b.priority === "overdue" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    });
    // Cap at 8 entries so the dashboard stays tidy
    upcomingActivities.splice(8);

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
      upcomingActivities,
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

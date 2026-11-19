import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  getStudentSubscription,
  handleAuthError,
} from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireStudent();

    // ─── Fetch data in small batches (3 at a time) to avoid exhausting
    // the remote PostgreSQL connection pool ───
    const [subscription, assignments, allCourses] = await Promise.all([
      getStudentSubscription(user.id),
      db.assignment.findMany({
        where: { isPublished: true, course: { isPublished: true } },
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true } },
          submissions: {
            where: { studentId: user.id },
            select: { id: true, fileUrl: true, submittedAt: true, status: true, reviewNotes: true, reviewedAt: true },
            take: 1,
          },
        },
      }),
      db.course.findMany({
        where: { isPublished: true },
        select: { id: true, accessType: true, planAccess: { select: { planId: true } } },
      }),
    ]);

    const [allVideoProgress, allVideoQuestions, allPassedAssessments] = await Promise.all([
      db.videoProgress.findMany({ where: { studentId: user.id }, select: { videoId: true, isCompleted: true } }),
      db.videoQuestion.findMany({ distinct: ["videoId"], select: { videoId: true } }),
      db.videoAssessment.findMany({ where: { studentId: user.id, passed: true }, select: { videoId: true } }),
    ]);

    const allPublishedVideos = await db.videoLesson.findMany({
      where: { isPublished: true },
      select: { id: true, courseId: true },
    });

    // ─── Build lookup maps ───
    const isSubActive = subscription?.status === "ACTIVE";
    const subPlanId = subscription?.planId;

    const progressMap = new Map(allVideoProgress.map((p) => [p.videoId, p]));
    const questionVideoIds = new Set(allVideoQuestions.map((q) => q.videoId));
    const passedSet = new Set(allPassedAssessments.map((a) => a.videoId));
    const videosByCourse = new Map<string, string[]>();
    for (const v of allPublishedVideos) {
      if (!videosByCourse.has(v.courseId)) videosByCourse.set(v.courseId, []);
      videosByCourse.get(v.courseId)!.push(v.id);
    }

    // Access check map
    const accessibleCourseIds = new Set<string>();
    for (const c of allCourses) {
      if (c.accessType === "FREE") accessibleCourseIds.add(c.id);
      else if (isSubActive && subPlanId && c.planAccess.some((pa) => pa.planId === subPlanId))
        accessibleCourseIds.add(c.id);
    }

    // ─── Helper: compute completion inline ───
    function computeStats(courseId: string) {
      const videoIds = videosByCourse.get(courseId) || [];
      const totalVideos = videoIds.length;
      if (totalVideos === 0) return { totalVideos: 0, completedVideos: 0, percent: 100, allCompleted: true };
      let completedVideos = 0;
      for (const vid of videoIds) {
        const p = progressMap.get(vid);
        if (p?.isCompleted === true && (!questionVideoIds.has(vid) || passedSet.has(vid))) {
          completedVideos++;
        }
      }
      return {
        totalVideos,
        completedVideos,
        percent: Math.round((completedVideos / totalVideos) * 100),
        allCompleted: completedVideos === totalVideos,
      };
    }

    // ─── Build result ───
    const result = assignments
      .filter((a) => accessibleCourseIds.has(a.course.id))
      .map((a) => {
        const stats = computeStats(a.course.id);
        const submission = a.submissions[0] || null;
        return {
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
          submission: submission ? {
            id: submission.id,
            fileUrl: submission.fileUrl,
            submittedAt: submission.submittedAt,
            status: submission.status as "SUBMITTED" | "REVIEWED",
            reviewNotes: submission.reviewNotes,
            reviewedAt: submission.reviewedAt,
          } : null,
          unlocked: isSubActive && stats.allCompleted,
          lockedReason: !isSubActive ? "Subscription expired" : !stats.allCompleted ? "Complete all lessons first" : null,
          courseCompletion: {
            percent: stats.percent,
            completedVideos: stats.completedVideos,
            totalVideos: stats.totalVideos,
            allCompleted: stats.allCompleted,
          },
        };
      });

    return NextResponse.json({ assignments: result });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/assignments GET]", e);
    return NextResponse.json({ error: "Failed to load assignments" }, { status: 500 });
  }
}

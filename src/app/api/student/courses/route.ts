import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  getStudentSubscription,
  handleAuthError,
} from "@/lib/auth";
import { getCourseCompletionStats } from "@/lib/course-utils";

export async function GET() {
  try {
    const user = await requireStudent();

    const [subscription, allCourses] = await Promise.all([
      getStudentSubscription(user.id),
      db.course.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          category: true,
          accessType: true,
          planAccess: { include: { plan: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    const isSubActive = subscription?.status === "ACTIVE";
    const subPlanId = subscription?.planId;

    // Determine which courses are accessible to the student
    const accessibleCourses = [];
    for (const c of allCourses) {
      let allowed = false;
      if (c.accessType === "FREE") {
        allowed = true;
      } else if (isSubActive && subPlanId) {
        // Paid course: must have an active subscription with a plan in coursePlanAccess
        allowed = c.planAccess.some((pa) => pa.planId === subPlanId);
      }
      if (!allowed) continue;

      const stats = await getCourseCompletionStats(user.id, c.id);
      // Determine last-watched video for this student in the course
      const lastProgress = await db.videoProgress.findFirst({
        where: {
          studentId: user.id,
          video: { courseId: c.id, isPublished: true },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          videoId: true,
          updatedAt: true,
          video: { select: { title: true } },
        },
      });

      accessibleCourses.push({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        category: c.category,
        accessType: c.accessType as "FREE" | "PAID",
        topicsCount: stats.totalTopics,
        videosCount: stats.totalVideos,
        completedVideos: stats.completedVideos,
        completedTopics: stats.completedTopics,
        percent: stats.percent,
        lastWatchedVideoId: lastProgress?.videoId ?? null,
        lastWatchedVideoTitle: lastProgress?.video.title ?? null,
        lastWatchedAt: lastProgress?.updatedAt ?? null,
      });
    }

    return NextResponse.json({
      courses: accessibleCourses,
      subscription,
      expired: !isSubActive && subscription !== null,
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/courses GET]", e);
    return NextResponse.json(
      { error: "Failed to load courses" },
      { status: 500 }
    );
  }
}

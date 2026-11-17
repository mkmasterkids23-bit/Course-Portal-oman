import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  getStudentSubscription,
  handleAuthError,
} from "@/lib/auth";
import { getCourseCompletionStats } from "@/lib/course-utils";

export async function GET(req: Request) {
  try {
    const user = await requireStudent();

    const url = new URL(req.url);
    const levelParam = url.searchParams.get("level")?.toUpperCase().trim();
    const sortParam = url.searchParams.get("sort")?.toLowerCase().trim();
    const validLevels = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
    const levelFilter =
      levelParam && validLevels.has(levelParam) ? levelParam : undefined;

    const baseWhere = levelFilter
      ? { isPublished: true, level: levelFilter }
      : { isPublished: true };

    const [subscription, allCourses, universities] = await Promise.all([
      getStudentSubscription(user.id),
      db.course.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          category: true,
          accessType: true,
          level: true,
          createdAt: true,
          university: { select: { id: true, name: true, logo: true } },
          planAccess: { include: { plan: { select: { id: true, name: true } } } },
        },
      }),
      db.university.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, logo: true },
      }),
    ]);

    const isSubActive = subscription?.status === "ACTIVE";
    const subPlanId = subscription?.planId;

    // Determine which courses are accessible to the student
    type AccessibleCourse = {
      id: string;
      title: string;
      description: string | null;
      thumbnail: string | null;
      firstVideoUrl: string | null;
      firstVideoSource: string | null;
      category: string | null;
      accessType: "FREE" | "PAID";
      level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
      university: { id: string; name: string; logo: string | null } | null;
      topicsCount: number;
      videosCount: number;
      completedVideos: number;
      completedTopics: number;
      percent: number;
      lastWatchedVideoId: string | null;
      lastWatchedVideoTitle: string | null;
      lastWatchedAt: string | null;
      createdAt: string;
      popularity: number;
    };
    const accessibleCourses: AccessibleCourse[] = [];
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
      // Fetch the first published video's thumbnail for fallback
      const firstVideo = await db.videoLesson.findFirst({
        where: { courseId: c.id, isPublished: true },
        orderBy: { displayOrder: "asc" },
        select: { thumbnail: true, videoUrl: true, source: true },
      });
      // Popularity metric: distinct students with any progress in this course
      const popularityRows = await db.videoProgress.groupBy({
        by: ["studentId"],
        where: { video: { courseId: c.id } },
      });

      const uni = c.university;
      accessibleCourses.push({
        id: c.id,
        title: c.title,
        description: c.description,
        // Fall back to first video's thumbnail when course has no custom thumbnail
        thumbnail: c.thumbnail || firstVideo?.thumbnail || null,
        firstVideoUrl: firstVideo?.videoUrl || null,
        firstVideoSource: firstVideo?.source || null,
        category: c.category,
        accessType: c.accessType as "FREE" | "PAID",
        level: c.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        university: uni ? { id: uni.id, name: uni.name, logo: uni.logo } : null,
        topicsCount: stats.totalTopics,
        videosCount: stats.totalVideos,
        completedVideos: stats.completedVideos,
        completedTopics: stats.completedTopics,
        percent: stats.percent,
        lastWatchedVideoId: lastProgress?.videoId ?? null,
        lastWatchedVideoTitle: lastProgress?.video.title ?? null,
        lastWatchedAt: lastProgress?.updatedAt
          ? lastProgress.updatedAt.toISOString()
          : null,
        createdAt: c.createdAt.toISOString(),
        popularity: popularityRows.length,
      });
    }

    // Apply server-side sort when requested. The client re-sorts locally as
    // well so the user can switch ordering instantly without a refetch.
    let sortedCourses = accessibleCourses;
    if (sortParam === "popular") {
      sortedCourses = [...accessibleCourses].sort(
        (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
      );
    } else if (sortParam === "alphabetical" || sortParam === "alpha") {
      sortedCourses = [...accessibleCourses].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    }
    // "newest" / default — already createdAt desc from the DB query

    return NextResponse.json({
      courses: sortedCourses,
      subscription,
      expired: !isSubActive && subscription !== null,
      universities: universities.map((u) => ({
        id: u.id,
        name: u.name,
        logo: u.logo,
      })),
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

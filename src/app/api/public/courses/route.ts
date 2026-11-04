import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      category: true,
      accessType: true,
    },
  });

  // enrich with counts + first video thumbnail fallback
  const enriched = await Promise.all(
    courses.map(async (c) => {
      const [topicsCount, videosCount, planAccess, firstVideo] = await Promise.all([
        db.topic.count({ where: { courseId: c.id } }),
        db.videoLesson.count({ where: { courseId: c.id, isPublished: true } }),
        db.coursePlanAccess.findMany({
          where: { courseId: c.id },
          include: { plan: { select: { name: true } } },
        }),
        // Fetch the first published video's thumbnail for fallback
        db.videoLesson.findFirst({
          where: { courseId: c.id, isPublished: true },
          orderBy: { displayOrder: "asc" },
          select: { thumbnail: true, videoUrl: true, source: true },
        }),
      ]);
      // Use course thumbnail, or fall back to first video's thumbnail
      const thumbnail = c.thumbnail || firstVideo?.thumbnail || null;
      return {
        ...c,
        thumbnail,
        firstVideoUrl: firstVideo?.videoUrl || null,
        firstVideoSource: firstVideo?.source || null,
        topicsCount,
        videosCount,
        planNames: planAccess.map((p) => p.plan.name),
      };
    })
  );

  return NextResponse.json({ courses: enriched });
}

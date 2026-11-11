import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [courses, universities] = await Promise.all([
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
        university: { select: { id: true, name: true, logo: true } },
      },
    }),
    db.university.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, logo: true },
    }),
  ]);

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
      const uni = c.university;
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail,
        category: c.category,
        accessType: c.accessType,
        firstVideoUrl: firstVideo?.videoUrl || null,
        firstVideoSource: firstVideo?.source || null,
        topicsCount,
        videosCount,
        planNames: planAccess.map((p) => p.plan.name),
        university: uni ? { id: uni.id, name: uni.name, logo: uni.logo } : null,
      };
    })
  );

  return NextResponse.json({
    courses: enriched,
    universities: universities.map((u) => ({
      id: u.id,
      name: u.name,
      logo: u.logo,
    })),
  });
}

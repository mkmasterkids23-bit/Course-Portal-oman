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

  // enrich with counts
  const enriched = await Promise.all(
    courses.map(async (c) => {
      const [topicsCount, videosCount, planAccess] = await Promise.all([
        db.topic.count({ where: { courseId: c.id } }),
        db.videoLesson.count({ where: { courseId: c.id, isPublished: true } }),
        db.coursePlanAccess.findMany({
          where: { courseId: c.id },
          include: { plan: { select: { name: true } } },
        }),
      ]);
      return {
        ...c,
        topicsCount,
        videosCount,
        planNames: planAccess.map((p) => p.plan.name),
      };
    })
  );

  return NextResponse.json({ courses: enriched });
}

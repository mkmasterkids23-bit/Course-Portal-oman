import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireUniversityOrInstructor,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";

/**
 * GET /api/university/courses
 * List courses owned by the logged-in university.
 * Instructors see only courses assigned to them.
 */
export async function GET(req: Request) {
  try {
    const user = await requireUniversityOrInstructor();
    const universityId = user.universityId!;
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const category = url.searchParams.get("category") || "";
    const published = url.searchParams.get("published"); // "true" | "false"

    // Instructors only see courses assigned to them.
    const instructorFilter =
      user.role === "INSTRUCTOR" && user.instructorId
        ? { instructorId: user.instructorId }
        : {};

    const courses = await db.course.findMany({
      where: {
        universityId,
        ...instructorFilter,
        ...(q ? { title: { contains: q } } : {}),
        ...(category ? { category } : {}),
        ...(published === "true"
          ? { isPublished: true }
          : published === "false"
          ? { isPublished: false }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        topics: { select: { id: true } },
        videos: {
          where: { isPublished: true },
          orderBy: { displayOrder: "asc" },
          take: 1,
          select: { thumbnail: true, videoUrl: true, source: true },
        },
        planAccess: { include: { plan: { select: { name: true } } } },
        instructor: {
          select: {
            id: true,
            user: { select: { name: true, email: true, profilePhoto: true } },
          },
        },
      },
    });

    return NextResponse.json({
      courses: courses.map((c) => {
        const firstVideo = c.videos[0];
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          thumbnail: c.thumbnail || firstVideo?.thumbnail || null,
          firstVideoUrl: firstVideo?.videoUrl || null,
          firstVideoSource: firstVideo?.source || null,
          category: c.category,
          level: c.level,
          accessType: c.accessType,
          isPublished: c.isPublished,
          startDate: c.startDate,
          endDate: c.endDate,
          availabilityMode: c.availabilityMode,
          enrollmentOpen: c.enrollmentOpen,
          createdAt: c.createdAt,
          topicsCount: c.topics.length,
          videosCount: c.videos.length,
          planNames: c.planAccess.map((p) => p.plan.name),
          instructorId: c.instructor?.id ?? null,
          instructorName: c.instructor?.user.name ?? null,
        };
      }),
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/courses GET]", e);
    return errorResponse("Failed to load courses", 500);
  }
}

/**
 * POST /api/university/courses
 * Create a course auto-scoped to the logged-in university.
 * University admins can also assign an instructor via `instructorId`.
 * (Instructors are not permitted to create courses.)
 */
export async function POST(req: Request) {
  try {
    const user = await requireUniversityOrInstructor();
    if (user.role === "INSTRUCTOR") {
      return errorResponse("Instructors cannot create courses", 403, "INSTRUCTOR_NO_CREATE");
    }
    const universityId = user.universityId!;
    const body = await req.json();
    const {
      title,
      description,
      thumbnail,
      category,
      level,
      accessType,
      isPublished,
      planIds = [],
      startDate,
      endDate,
      availabilityMode,
      enrollmentOpen,
      instructorId,
    } = body as {
      title?: string;
      description?: string;
      thumbnail?: string;
      category?: string;
      level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
      accessType?: "FREE" | "PAID";
      isPublished?: boolean;
      planIds?: string[];
      startDate?: string | null;
      endDate?: string | null;
      availabilityMode?: "ALWAYS" | "SCHEDULED" | "LIMITED";
      enrollmentOpen?: boolean;
      instructorId?: string | null;
    };

    if (!title || !title.trim()) {
      return errorResponse("Title is required", 400);
    }
    const aType = accessType === "PAID" ? "PAID" : "FREE";
    const validLevel =
      level === "INTERMEDIATE" || level === "ADVANCED" ? level : "BEGINNER";
    const validMode =
      availabilityMode === "SCHEDULED" || availabilityMode === "LIMITED"
        ? availabilityMode
        : "ALWAYS";

    // Parse dates (allow null/empty to clear)
    const startDateParsed =
      startDate === null || startDate === ""
        ? null
        : startDate
          ? new Date(startDate)
          : null;
    const endDateParsed =
      endDate === null || endDate === ""
        ? null
        : endDate
          ? new Date(endDate)
          : null;

    if (
      startDateParsed &&
      endDateParsed &&
      endDateParsed < startDateParsed
    ) {
      return errorResponse("End date must be after start date", 400);
    }

    if (aType === "PAID" && planIds.length === 0) {
      return errorResponse(
        "Paid courses must specify at least one subscription plan",
        400
      );
    }

    // Validate planIds exist
    if (planIds.length > 0) {
      const foundPlans = await db.subscriptionPlan.findMany({
        where: { id: { in: planIds } },
        select: { id: true },
      });
      if (foundPlans.length !== planIds.length) {
        return errorResponse("One or more plans not found", 400);
      }
    }

    // Validate the instructor belongs to this university (if provided)
    let resolvedInstructorId: string | null = null;
    if (instructorId) {
      const instructor = await db.instructor.findFirst({
        where: { id: instructorId, universityId, isActive: true },
        select: { id: true },
      });
      if (!instructor) {
        return errorResponse(
          "Selected instructor is not part of your university",
          400
        );
      }
      resolvedInstructorId = instructor.id;
    }

    const course = await db.course.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail: thumbnail?.trim() || null,
        category: category?.trim() || null,
        level: validLevel,
        accessType: aType,
        isPublished: !!isPublished,
        // Auto-scope to the logged-in university
        universityId,
        availabilityMode: validMode,
        startDate: startDateParsed,
        endDate: endDateParsed,
        enrollmentOpen: enrollmentOpen === undefined ? true : !!enrollmentOpen,
        instructorId: resolvedInstructorId,
      },
    });

    if (aType === "PAID" && planIds.length > 0) {
      await db.coursePlanAccess.createMany({
        data: planIds.map((pid) => ({ courseId: course.id, planId: pid })),
      });
    }

    return NextResponse.json({ course: { id: course.id } });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/courses POST]", e);
    return errorResponse("Failed to create course", 500);
  }
}

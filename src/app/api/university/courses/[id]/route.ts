import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireUniversityOrInstructor,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";

/** Verify the given course belongs to the logged-in university (and, for instructors, is assigned to them). */
async function verifyOwnership(
  courseId: string,
  user: { universityId: string | null; role: string; instructorId?: string | null }
) {
  if (!user.universityId) return null;
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { universityId: true, instructorId: true },
  });
  if (!course || course.universityId !== user.universityId) return null;
  // Instructors can only access courses assigned to them.
  if (user.role === "INSTRUCTOR") {
    if (!user.instructorId || course.instructorId !== user.instructorId) {
      return null;
    }
  }
  return course;
}

/**
 * GET /api/university/courses/[id]
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUniversityOrInstructor();
    const { id } = await params;
    const owned = await verifyOwnership(id, user);
    if (!owned) return errorResponse("Not found", 404);

    const course = await db.course.findUnique({
      where: { id },
      include: {
        topics: {
          orderBy: { displayOrder: "asc" },
          include: {
            videos: { orderBy: { displayOrder: "asc" } },
            materials: { orderBy: { createdAt: "desc" } },
          },
        },
        materials: {
          orderBy: { createdAt: "desc" },
          include: { topic: { select: { id: true, title: true } } },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { submissions: true } } },
        },
        certificateTemplate: true,
        planAccess: {
          include: { plan: { select: { id: true, name: true } } },
        },
        instructor: {
          select: {
            id: true,
            user: { select: { name: true, email: true, profilePhoto: true } },
          },
        },
      },
    });
    if (!course || course.universityId !== user.universityId) {
      return errorResponse("Not found", 404);
    }
    // Instructors must only access their assigned course.
    if (
      user.role === "INSTRUCTOR" &&
      (!user.instructorId || course.instructorId !== user.instructorId)
    ) {
      return errorResponse("Not found", 404);
    }

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        accessType: course.accessType,
        isPublished: course.isPublished,
        startDate: course.startDate,
        endDate: course.endDate,
        availabilityMode: course.availabilityMode,
        enrollmentOpen: course.enrollmentOpen,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        instructorId: course.instructor?.id ?? null,
        instructorName: course.instructor?.user.name ?? null,
        topics: course.topics.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          displayOrder: t.displayOrder,
          videos: t.videos.map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            source: v.source,
            videoUrl: v.videoUrl,
            thumbnail: v.thumbnail,
            displayOrder: v.displayOrder,
            isPublished: v.isPublished,
            duration: v.duration,
          })),
          materials: t.materials.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            type: m.type,
            fileUrl: m.fileUrl,
            isPublished: m.isPublished,
          })),
        })),
        materials: course.materials.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          type: m.type,
          fileUrl: m.fileUrl,
          isPublished: m.isPublished,
          topic: m.topic,
        })),
        assignments: course.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          fileUrl: a.fileUrl,
          dueDate: a.dueDate,
          isPublished: a.isPublished,
          allowResubmission: a.allowResubmission,
          submissionsCount: a._count.submissions,
          createdAt: a.createdAt,
        })),
        certificateTemplate: course.certificateTemplate
          ? {
              id: course.certificateTemplate.id,
              isEnabled: course.certificateTemplate.isEnabled,
              title: course.certificateTemplate.title,
              bodyText: course.certificateTemplate.bodyText,
              organizationName: course.certificateTemplate.organizationName,
              layout: course.certificateTemplate.layout,
            }
          : null,
        planAccess: course.planAccess.map((p) => ({
          id: p.id,
          planId: p.planId,
          planName: p.plan.name,
        })),
      },
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/courses GET id]", e);
    return errorResponse("Failed to load course", 500);
  }
}

/**
 * PUT /api/university/courses/[id]
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUniversityOrInstructor();
    if (user.role === "INSTRUCTOR") {
      return errorResponse("Instructors cannot edit course settings", 403, "INSTRUCTOR_NO_EDIT");
    }
    const { id } = await params;
    const owned = await verifyOwnership(id, user);
    if (!owned) return errorResponse("Not found", 404);

    const body = await req.json();
    const {
      title,
      description,
      thumbnail,
      category,
      level,
      accessType,
      isPublished,
      planIds,
      startDate,
      endDate,
      availabilityMode,
      enrollmentOpen,
      instructorId,
    } = body as {
      title?: string;
      description?: string | null;
      thumbnail?: string | null;
      category?: string | null;
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

    const existing = await db.course.findUnique({ where: { id } });
    if (!existing || existing.universityId !== user.universityId) {
      return errorResponse("Not found", 404);
    }

    const aType =
      accessType === "PAID"
        ? "PAID"
        : accessType === "FREE"
        ? "FREE"
        : existing.accessType;

    const validLevel =
      level === "INTERMEDIATE" || level === "ADVANCED" || level === "BEGINNER"
        ? level
        : existing.level;
    const validMode =
      availabilityMode === "SCHEDULED" ||
      availabilityMode === "LIMITED" ||
      availabilityMode === "ALWAYS"
        ? availabilityMode
        : existing.availabilityMode;

    // Parse dates — allow null/empty to clear
    const startDateParsed =
      startDate === undefined
        ? undefined
        : startDate === null || startDate === ""
          ? null
          : new Date(startDate);
    const endDateParsed =
      endDate === undefined
        ? undefined
        : endDate === null || endDate === ""
          ? null
          : new Date(endDate);

    if (
      startDateParsed &&
      endDateParsed &&
      endDateParsed < startDateParsed
    ) {
      return errorResponse("End date must be after start date", 400);
    }

    if (aType === "PAID" && planIds && planIds.length === 0) {
      return errorResponse("Paid courses must specify at least one plan", 400);
    }

    // Resolve instructorId — validate it belongs to this university and is active.
    // Pass null explicitly to unassign, undefined to leave unchanged.
    let instructorIdValue: string | null | undefined = undefined;
    if (instructorId !== undefined) {
      if (instructorId === null || instructorId === "") {
        instructorIdValue = null;
      } else {
        const instructor = await db.instructor.findFirst({
          where: {
            id: instructorId,
            universityId: user.universityId!,
            isActive: true,
          },
          select: { id: true },
        });
        if (!instructor) {
          return errorResponse(
            "Selected instructor is not part of your university",
            400
          );
        }
        instructorIdValue = instructor.id;
      }
    }

    await db.course.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined
          ? { description: description?.trim() || null }
          : {}),
        ...(thumbnail !== undefined ? { thumbnail: thumbnail?.trim() || null } : {}),
        ...(category !== undefined ? { category: category?.trim() || null } : {}),
        ...(level !== undefined ? { level: validLevel } : {}),
        ...(accessType !== undefined ? { accessType: aType } : {}),
        ...(isPublished !== undefined ? { isPublished: !!isPublished } : {}),
        ...(availabilityMode !== undefined ? { availabilityMode: validMode } : {}),
        ...(startDateParsed !== undefined ? { startDate: startDateParsed } : {}),
        ...(endDateParsed !== undefined ? { endDate: endDateParsed } : {}),
        ...(enrollmentOpen !== undefined ? { enrollmentOpen: !!enrollmentOpen } : {}),
        ...(instructorIdValue !== undefined ? { instructorId: instructorIdValue } : {}),
      },
    });

    if (planIds !== undefined) {
      if (aType === "FREE") {
        await db.coursePlanAccess.deleteMany({ where: { courseId: id } });
      } else {
        if (planIds.length > 0) {
          const found = await db.subscriptionPlan.findMany({
            where: { id: { in: planIds } },
            select: { id: true },
          });
          if (found.length !== planIds.length) {
            return errorResponse("One or more plans not found", 400);
          }
        }
        await db.coursePlanAccess.deleteMany({ where: { courseId: id } });
        if (planIds.length > 0) {
          await db.coursePlanAccess.createMany({
            data: planIds.map((pid) => ({ courseId: id, planId: pid })),
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/courses PUT]", e);
    // Return the specific error message for debugging
    const errMsg = e?.message || "Failed to update course";
    return errorResponse(errMsg, 500);
  }
}

/**
 * DELETE /api/university/courses/[id]
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUniversityOrInstructor();
    if (user.role === "INSTRUCTOR") {
      return errorResponse("Instructors cannot delete courses", 403, "INSTRUCTOR_NO_DELETE");
    }
    const { id } = await params;
    const owned = await verifyOwnership(id, user);
    if (!owned) return errorResponse("Not found", 404);

    await db.course.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/courses DELETE]", e);
    return errorResponse("Failed to delete course", 500);
  }
}

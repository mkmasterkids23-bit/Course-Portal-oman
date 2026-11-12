import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUniversity, handleAuthError, errorResponse } from "@/lib/auth";

/**
 * POST /api/university/courses/[id]/topics/reorder
 * Reorder topics for a course owned by the logged-in university.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUniversity();
    const { id } = await params;
    const body = await req.json();
    const { orderedIds } = body as { orderedIds?: string[] };

    if (!Array.isArray(orderedIds)) {
      return errorResponse("orderedIds must be an array", 400);
    }

    const course = await db.course.findUnique({
      where: { id },
      select: { universityId: true },
    });
    if (!course || course.universityId !== user.universityId) {
      return errorResponse("Not found", 404);
    }

    await Promise.all(
      orderedIds.map((tid, idx) =>
        db.topic.updateMany({
          where: { id: tid, courseId: id },
          data: { displayOrder: idx },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/topics reorder]", e);
    return errorResponse("Failed to reorder topics", 500);
  }
}

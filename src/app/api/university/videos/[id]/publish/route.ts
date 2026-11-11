import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUniversity, handleAuthError, errorResponse } from "@/lib/auth";

/**
 * PATCH /api/university/videos/[id]/publish
 * Toggle publish state for a video — verifies ownership via the video's course.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUniversity();
    const { id } = await params;
    const body = await req.json();
    const { isPublished } = body as { isPublished?: boolean };

    const existing = await db.videoLesson.findUnique({
      where: { id },
      include: { course: { select: { universityId: true } } },
    });
    if (!existing || existing.course.universityId !== user.universityId) {
      return errorResponse("Not found", 404);
    }

    const updated = await db.videoLesson.update({
      where: { id },
      data: { isPublished: !!isPublished },
    });

    return NextResponse.json({ ok: true, isPublished: updated.isPublished });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/videos publish]", e);
    return errorResponse("Failed to toggle video publish", 500);
  }
}

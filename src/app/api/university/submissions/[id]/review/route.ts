import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUniversity, handleAuthError, errorResponse } from "@/lib/auth";

/**
 * PATCH /api/university/submissions/[id]/review
 * Review a submission — verifies ownership via the assignment's course.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUniversity();
    const { id } = await params;
    const body = await req.json();
    const { status, reviewNotes } = body as {
      status?: string;
      reviewNotes?: string | null;
    };

    const existing = await db.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            course: { select: { universityId: true } },
          },
        },
      },
    });
    if (!existing) return errorResponse("Not found", 404);
    if (existing.assignment.course.universityId !== user.universityId) {
      return errorResponse("Not found", 404);
    }

    const newStatus = status === "REVIEWED" ? "REVIEWED" : existing.status;
    const updated = await db.assignmentSubmission.update({
      where: { id },
      data: {
        status: newStatus,
        reviewNotes:
          reviewNotes !== undefined
            ? reviewNotes?.trim() || null
            : existing.reviewNotes,
        reviewedAt: newStatus === "REVIEWED" ? new Date() : existing.reviewedAt,
      },
    });

    return NextResponse.json({ submission: updated });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/submissions review]", e);
    return errorResponse("Failed to review submission", 500);
  }
}

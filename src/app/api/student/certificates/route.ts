import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  handleAuthError,
} from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireStudent();

    const certificates = await db.certificate.findMany({
      where: { studentId: user.id },
      orderBy: { issuedAt: "desc" },
      include: { course: { select: { title: true } } },
    });

    return NextResponse.json({
      certificates: certificates.map((c) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        courseId: c.courseId,
        courseTitle: c.course.title,
        templateTitle: c.templateTitle,
        templateText: c.templateText,
        organizationName: c.organizationName,
        issuedAt: c.issuedAt,
      })),
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/certificates GET]", e);
    return NextResponse.json(
      { error: "Failed to load certificates" },
      { status: 500 }
    );
  }
}

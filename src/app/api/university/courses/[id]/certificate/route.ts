import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUniversity, handleAuthError, errorResponse } from "@/lib/auth";

const VALID_LAYOUTS = ["CLASSIC", "MODERN", "MINIMAL"];

/**
 * GET /api/university/courses/[id]/certificate
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUniversity();
    const { id } = await params;

    const course = await db.course.findUnique({
      where: { id },
      select: { universityId: true },
    });
    if (!course || course.universityId !== user.universityId) {
      return errorResponse("Not found", 404);
    }

    const template = await db.certificateTemplate.findUnique({
      where: { courseId: id },
    });

    if (!template) {
      return NextResponse.json({ template: null });
    }

    return NextResponse.json({
      template: {
        id: template.id,
        courseId: template.courseId,
        isEnabled: template.isEnabled,
        title: template.title,
        bodyText: template.bodyText,
        organizationName: template.organizationName,
        layout: template.layout,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/certificate GET]", e);
    return errorResponse("Failed to load certificate template", 500);
  }
}

/**
 * PUT /api/university/courses/[id]/certificate
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUniversity();
    const { id } = await params;
    const body = await req.json();
    const { isEnabled, title, bodyText, organizationName, layout } = body as {
      isEnabled?: boolean;
      title?: string;
      bodyText?: string;
      organizationName?: string;
      layout?: string;
    };

    const course = await db.course.findUnique({
      where: { id },
      select: { universityId: true },
    });
    if (!course || course.universityId !== user.universityId) {
      return errorResponse("Not found", 404);
    }

    const existing = await db.certificateTemplate.findUnique({
      where: { courseId: id },
    });

    const finalLayout = VALID_LAYOUTS.includes(layout || "")
      ? layout!
      : existing?.layout || "CLASSIC";

    const data: any = {
      isEnabled: isEnabled !== undefined ? !!isEnabled : existing?.isEnabled ?? true,
      title:
        title !== undefined
          ? title.trim() || "Certificate of Completion"
          : existing?.title || "Certificate of Completion",
      bodyText:
        bodyText !== undefined
          ? bodyText.trim() ||
            "This certificate is proudly presented to {{studentName}} for successfully completing the course {{courseName}}."
          : existing?.bodyText,
      organizationName:
        organizationName !== undefined
          ? organizationName.trim() || "CourseLearn"
          : existing?.organizationName || "CourseLearn",
      layout: finalLayout,
    };

    let template;
    if (existing) {
      template = await db.certificateTemplate.update({
        where: { courseId: id },
        data,
      });
    } else {
      template = await db.certificateTemplate.create({
        data: { courseId: id, ...data },
      });
    }

    return NextResponse.json({
      template: {
        id: template.id,
        courseId: template.courseId,
        isEnabled: template.isEnabled,
        title: template.title,
        bodyText: template.bodyText,
        organizationName: template.organizationName,
        layout: template.layout,
      },
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[university/certificate PUT]", e);
    return errorResponse("Failed to save certificate template", 500);
  }
}

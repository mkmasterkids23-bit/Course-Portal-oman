import { db } from "@/lib/db";
import {
  requireStudent,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";
import { buildCertificateHtml } from "@/lib/certificate-html";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const { id } = await params;

    const cert = await db.certificate.findUnique({
      where: { id },
      include: { course: { select: { title: true } } },
    });
    if (!cert) return errorResponse("Certificate not found", 404);
    if (cert.studentId !== user.id) {
      return errorResponse("Not authorized to view this certificate", 403);
    }

    const issueDateStr = new Date(cert.issuedAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = buildCertificateHtml({
      certificateNumber: cert.certificateNumber,
      studentName: user.name,
      courseTitle: cert.course.title,
      templateTitle: cert.templateTitle,
      bodyText: cert.templateText,
      organizationName: cert.organizationName,
      issueDate: issueDateStr,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/certificates preview]", e);
    return errorResponse("Failed to render certificate", 500);
  }
}

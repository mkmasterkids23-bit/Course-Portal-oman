import { db } from "@/lib/db";
import {
  requireStudent,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";
import { buildCertificateHtml } from "@/lib/certificate-html";

/**
 * Returns the certificate as a self-contained printable HTML page with a
 * "Save as PDF" button (uses `window.print()`). Browser print-to-PDF produces
 * a real PDF download while keeping the implementation lightweight — no
 * Playwright/chromium download required in the sandbox.
 *
 * The Content-Disposition header hints "attachment" so the browser offers to
 * download; for in-page viewing, the preview route returns the same HTML inline.
 */
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

    const safeStudent = user.name.replace(/[^a-zA-Z0-9-_]+/g, "_");
    const safeCourse = cert.course.title
      .replace(/[^a-zA-Z0-9-_]+/g, "_")
      .slice(0, 40);
    const filename = `Lumina-Certificate-${safeStudent}-${safeCourse}.html`;

    const html = buildCertificateHtml(
      {
        certificateNumber: cert.certificateNumber,
        studentName: user.name,
        courseTitle: cert.course.title,
        templateTitle: cert.templateTitle,
        bodyText: cert.templateText,
        organizationName: cert.organizationName,
        issueDate: issueDateStr,
      },
      { forPrint: true }
    );

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/certificates pdf]", e);
    return errorResponse("Failed to generate certificate", 500);
  }
}

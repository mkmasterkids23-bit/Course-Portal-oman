import { db } from "@/lib/db";
import {
  requireStudent,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";
import { buildCertificateHtml } from "@/lib/certificate-html";
import puppeteer from "puppeteer";

/**
 * Generates the certificate as a **real downloadable PDF file** using
 * Puppeteer (headless Chromium). The HTML certificate design is rendered
 * in a browser instance, converted to PDF, and returned with
 * `Content-Type: application/pdf` and a `Content-Disposition: attachment`
 * header so the browser downloads a `.pdf` file.
 *
 * The PDF uses landscape A4 orientation to match the certificate's wide
 * layout, with thin margins to preserve the border frame.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser;
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
    const filename = `LearnCourse-Certificate-${safeStudent}-${safeCourse}.pdf`;

    // Build the certificate HTML (no print toolbar — we're generating a PDF directly)
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
      { forPrint: false }
    );

    // Launch headless Chromium
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // avoids /dev/shm issues in containers
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set the HTML content and wait for network idle so Google Fonts load
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    // Give fonts a moment to render
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((r) => setTimeout(r, 500));

    // Generate the PDF — landscape A4, single page
    const pdfBuffer = await page.pdf({
      format: "a4",
      landscape: true,
      printBackground: true,
      pageRanges: "1", // only output the first page (certificate fits on one)
      scale: 0.82,
      margin: {
        top: "6mm",
        bottom: "6mm",
        left: "6mm",
        right: "6mm",
      },
    });

    await browser.close();
    browser = null;

    // Return the PDF as a downloadable attachment
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/certificates pdf]", e);
    return errorResponse("Failed to generate certificate PDF", 500);
  }
}

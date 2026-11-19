import { db } from "@/lib/db";
import {
  requireStudent,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";
import { buildCertificateHtml } from "@/lib/certificate-html";

// Dynamically import puppeteer — on Vercel/serverless it may not be available.
// The PDF endpoint will gracefully fall back to an HTML print page if
// Puppeteer can't launch.
// eslint-disable-next-line @typescript-eslint/no-require-imports
let puppeteer: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  puppeteer = require("puppeteer");
} catch {
  // Puppeteer not installed (e.g., on Vercel) — PDF generation will fall back
}

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
    const filename = `CourseLearn-Certificate-${safeStudent}-${safeCourse}.pdf`;

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

    // If Puppeteer isn't available (e.g., on Vercel serverless), fall back
    // to returning the HTML with a print dialog so the user can save as PDF
    // from their browser.
    if (!puppeteer) {
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // Launch headless Chromium
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((r) => setTimeout(r, 500));

    const pdfBuffer = await page.pdf({
      format: "a4",
      landscape: true,
      printBackground: true,
      pageRanges: "1",
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

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  getStudentSubscription,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";
import {
  canStudentAccessCourse,
  isCourseCompletedByStudent,
  generateCertificateNumber,
} from "@/lib/course-utils";
import { saveUploadedFile, ALLOWED_DOC_EXT, validateExt } from "@/lib/storage";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const { id } = await params;

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            certificateTemplate: true,
          },
        },
      },
    });
    if (!assignment) return errorResponse("Assignment not found", 404);
    if (!assignment.isPublished)
      return errorResponse("Assignment unavailable", 403);

    // (a) Course access
    const access = await canStudentAccessCourse(user.id, assignment.courseId);
    if (!access.allowed) {
      return errorResponse(access.reason || "Not allowed", 403, "NO_ACCESS");
    }

    // (b) Subscription active
    const subscription = await getStudentSubscription(user.id);
    if (!subscription || subscription.status !== "ACTIVE") {
      return errorResponse(
        "Subscription expired",
        403,
        "SUBSCRIPTION_EXPIRED"
      );
    }

    // (c) Course completed (all videos)
    const completed = await isCourseCompletedByStudent(
      user.id,
      assignment.courseId
    );
    if (!completed) {
      return errorResponse(
        "Complete all course lessons first",
        403,
        "COURSE_INCOMPLETE"
      );
    }

    // (d) Existing submission check
    const existing = await db.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: { assignmentId: id, studentId: user.id },
      },
    });
    if (existing && !assignment.allowResubmission) {
      return errorResponse(
        "You have already submitted this assignment",
        400,
        "ALREADY_SUBMITTED"
      );
    }

    // Handle file upload
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return errorResponse("Please upload a file", 400);
    }

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!validateExt(ext, ALLOWED_DOC_EXT)) {
      return errorResponse(
        "Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT",
        400
      );
    }
    if (file.size > 25 * 1024 * 1024) {
      return errorResponse("File must be under 25MB", 400);
    }

    const saved = await saveUploadedFile(file, "submissions");

    // Upsert the submission (handles allowResubmission=true case)
    const submission = await db.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: { assignmentId: id, studentId: user.id },
      },
      create: {
        assignmentId: id,
        studentId: user.id,
        fileUrl: saved.url,
        status: "SUBMITTED",
      },
      update: {
        fileUrl: saved.url,
        status: "SUBMITTED",
        reviewNotes: null,
        reviewedAt: null,
      },
    });

    // Auto-issue certificate if template exists and is enabled
    let certificateIssued = false;
    let certificateId: string | undefined;
    const tmpl = assignment.course.certificateTemplate;
    if (tmpl && tmpl.isEnabled) {
      const existingCert = await db.certificate.findUnique({
        where: {
          studentId_courseId: {
            studentId: user.id,
            courseId: assignment.courseId,
          },
        },
        select: { id: true },
      });
      if (!existingCert) {
        const certNumber = generateCertificateNumber();
        const issueDateStr = new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        const renderedText = tmpl.bodyText
          .replace(/\{\{studentName\}\}/g, user.name)
          .replace(/\{\{courseName\}\}/g, assignment.course.title)
          .replace(/\{\{issueDate\}\}/g, issueDateStr)
          .replace(/\{\{certificateNumber\}\}/g, certNumber)
          .replace(/\{\{organizationName\}\}/g, tmpl.organizationName);

        const cert = await db.certificate.create({
          data: {
            studentId: user.id,
            courseId: assignment.courseId,
            templateTitle: tmpl.title,
            templateText: renderedText,
            organizationName: tmpl.organizationName,
            certificateNumber: certNumber,
            issuedAt: new Date(),
          },
        });
        certificateIssued = true;
        certificateId = cert.id;
      } else {
        // Already had a certificate from a previous submission — surface its id.
        certificateIssued = true;
        certificateId = existingCert.id;
      }
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        fileUrl: submission.fileUrl,
        submittedAt: submission.submittedAt,
        status: submission.status as "SUBMITTED" | "REVIEWED",
        reviewNotes: submission.reviewNotes,
        reviewedAt: submission.reviewedAt,
      },
      certificateIssued,
      certificateId,
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/assignments submit]", e);
    return errorResponse("Failed to submit assignment", 500);
  }
}

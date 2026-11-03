import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";
import {
  canStudentAccessCourse,
  getCourseCompletionStats,
} from "@/lib/course-utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const { id } = await params;

    const access = await canStudentAccessCourse(user.id, id);
    if (!access.allowed) {
      return errorResponse(access.reason || "Not allowed", 403, "NO_ACCESS");
    }

    const course = await db.course.findUnique({
      where: { id },
      include: {
        topics: {
          orderBy: { displayOrder: "asc" },
          include: {
            videos: {
              where: { isPublished: true },
              orderBy: { displayOrder: "asc" },
            },
            materials: {
              where: { isPublished: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        materials: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          include: { topic: { select: { id: true, title: true } } },
        },
        assignments: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
        },
        certificateTemplate: true,
      },
    });

    if (!course) return errorResponse("Course not found", 404);

    // Fetch all video progress for this student in the course (single query)
    const videoIds = course.topics.flatMap((t) => t.videos.map((v) => v.id));
    const progressRows = await db.videoProgress.findMany({
      where: { studentId: user.id, videoId: { in: videoIds } },
      select: {
        videoId: true,
        lastPosition: true,
        watchTimeSeconds: true,
        duration: true,
        isCompleted: true,
        completedAt: true,
      },
    });
    const progressMap = new Map(progressRows.map((p) => [p.videoId, p]));

    // Fetch the student's submission for this course's assignment(s)
    const assignmentIds = course.assignments.map((a) => a.id);
    const submissions = await db.assignmentSubmission.findMany({
      where: { studentId: user.id, assignmentId: { in: assignmentIds } },
      select: {
        id: true,
        assignmentId: true,
        fileUrl: true,
        submittedAt: true,
        status: true,
        reviewNotes: true,
        reviewedAt: true,
      },
    });
    const submissionByAssignment = new Map(
      submissions.map((s) => [s.assignmentId, s])
    );

    const stats = await getCourseCompletionStats(user.id, course.id);

    const result = {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      category: course.category,
      accessType: course.accessType as "FREE" | "PAID",
      topics: course.topics.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        displayOrder: t.displayOrder,
        videos: t.videos.map((v) => {
          const p = progressMap.get(v.id);
          return {
            id: v.id,
            title: v.title,
            description: v.description,
            source: v.source as "UPLOAD" | "YOUTUBE" | "URL",
            videoUrl: v.videoUrl,
            thumbnail: v.thumbnail,
            displayOrder: v.displayOrder,
            duration: v.duration,
            progress: p
              ? {
                  lastPosition: p.lastPosition,
                  watchTimeSeconds: p.watchTimeSeconds,
                  duration: p.duration,
                  isCompleted: p.isCompleted,
                  completedAt: p.completedAt,
                }
              : null,
          };
        }),
        materials: t.materials.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          type: m.type,
          fileUrl: m.fileUrl,
        })),
      })),
      materials: course.materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        fileUrl: m.fileUrl,
        topic: m.topic,
      })),
      assignment:
        course.assignments[0] !== undefined
          ? {
              id: course.assignments[0].id,
              title: course.assignments[0].title,
              description: course.assignments[0].description,
              instructions: course.assignments[0].instructions,
              fileUrl: course.assignments[0].fileUrl,
              dueDate: course.assignments[0].dueDate,
              isPublished: course.assignments[0].isPublished,
              allowResubmission: course.assignments[0].allowResubmission,
            }
          : null,
      submission: submissionByAssignment.get(course.assignments[0]?.id ?? "")
        ? {
            id: submissionByAssignment.get(course.assignments[0].id)!.id,
            fileUrl: submissionByAssignment.get(course.assignments[0].id)!.fileUrl,
            submittedAt: submissionByAssignment.get(course.assignments[0].id)!
              .submittedAt,
            status: submissionByAssignment.get(course.assignments[0].id)!
              .status as "SUBMITTED" | "REVIEWED",
            reviewNotes: submissionByAssignment.get(course.assignments[0].id)!
              .reviewNotes,
            reviewedAt: submissionByAssignment.get(course.assignments[0].id)!
              .reviewedAt,
          }
        : null,
      courseCompletion: {
        totalVideos: stats.totalVideos,
        completedVideos: stats.completedVideos,
        percent: stats.percent,
        allCompleted:
          stats.totalVideos > 0 && stats.completedVideos === stats.totalVideos,
      },
      certificateTemplate: course.certificateTemplate
        ? {
            id: course.certificateTemplate.id,
            isEnabled: course.certificateTemplate.isEnabled,
            title: course.certificateTemplate.title,
            bodyText: course.certificateTemplate.bodyText,
            organizationName: course.certificateTemplate.organizationName,
            layout: course.certificateTemplate.layout,
          }
        : null,
    };

    return NextResponse.json({ course: result });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/courses GET id]", e);
    return errorResponse("Failed to load course", 500);
  }
}

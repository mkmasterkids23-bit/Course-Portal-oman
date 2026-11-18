import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const { id } = await params;

    // ─── Fetch course + subscription IN PARALLEL (saves ~2s vs sequential) ───
    // Include planAccess so we can check access inline (avoids canStudentAccessCourse
    // making 3 separate queries that duplicate this data).
    const [course, subscription] = await Promise.all([
      db.course.findUnique({
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
          planAccess: { select: { planId: true } },
        },
      }),
      db.subscription.findFirst({
        where: { studentId: user.id, status: "ACTIVE", expiryDate: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { planId: true },
      }),
    ]);

    if (!course) return errorResponse("Course not found", 404);

    // ─── Inline access check (replaces canStudentAccessCourse) ───
    if (course.accessType !== "FREE") {
      if (!subscription) {
        return errorResponse("No active subscription", 403, "NO_ACCESS");
      }
      if (!course.planAccess.some((pa) => pa.planId === subscription.planId)) {
        return errorResponse("Your plan does not include this course", 403, "NO_ACCESS");
      }
    }

    // ─── Fetch all student data IN PARALLEL (4 queries at once vs sequential) ───
    const videoIds = course.topics.flatMap((t) => t.videos.map((v) => v.id));
    const assignmentIds = course.assignments.map((a) => a.id);

    const [progressRows, videoQuestionsCount, passedAssessments, submissions] = await Promise.all([
      db.videoProgress.findMany({
        where: { studentId: user.id, videoId: { in: videoIds } },
        select: {
          videoId: true,
          lastPosition: true,
          watchTimeSeconds: true,
          duration: true,
          isCompleted: true,
          completedAt: true,
        },
      }),
      videoIds.length > 0
        ? db.videoQuestion.groupBy({
            by: ["videoId"],
            where: { videoId: { in: videoIds } },
            _count: { id: true },
          })
        : Promise.resolve([]),
      db.videoAssessment.findMany({
        where: { studentId: user.id, videoId: { in: videoIds }, passed: true },
        select: { videoId: true },
      }),
      assignmentIds.length > 0
        ? db.assignmentSubmission.findMany({
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
          })
        : Promise.resolve([]),
    ]);

    const progressMap = new Map(progressRows.map((p) => [p.videoId, p]));
    const questionCountMap = new Map(videoQuestionsCount.map((q) => [q.videoId, q._count.id]));
    const passedAssessmentSet = new Set(passedAssessments.map((a) => a.videoId));
    const submissionByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

    // ─── Compute completion stats inline (avoids 5 extra DB queries that
    // getCourseCompletionStats would make — all data is already fetched above) ───
    const allVideos = course.topics.flatMap((t) => t.videos);
    const totalVideos = allVideos.length;
    const completedVideoIds = new Set(
      videoIds.filter((vid) => {
        const p = progressMap.get(vid);
        return p?.isCompleted === true &&
          (!questionCountMap.has(vid) || passedAssessmentSet.has(vid));
      })
    );
    const completedVideos = completedVideoIds.size;
    // Group videos by topic for completedTopics count
    const videosByTopic = new Map<string, Set<string>>();
    for (const t of course.topics) {
      const vSet = new Set<string>();
      for (const v of t.videos) vSet.add(v.id);
      videosByTopic.set(t.id, vSet);
    }
    let completedTopics = 0;
    for (const [, vIds] of videosByTopic) {
      if (vIds.size > 0 && Array.from(vIds).every((id) => completedVideoIds.has(id))) {
        completedTopics++;
      }
    }
    const totalTopics = course.topics.length;
    const percent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 100;
    const allCompleted = completedVideos === totalVideos;

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
            hasQuestions: (questionCountMap.get(v.id) ?? 0) > 0,
            questionCount: questionCountMap.get(v.id) ?? 0,
            assessmentPassed: (questionCountMap.get(v.id) ?? 0) > 0
              ? passedAssessmentSet.has(v.id)
              : null, // null = no questions (no assessment needed)
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
      // ─── Assignment gating ───
      // The assignment details (title, description, instructions, fileUrl) are
      // ONLY returned when the student has completed ALL required video lessons.
      // Before that, we return a minimal placeholder so the frontend can show a
      // "locked" card without exposing any assignment content. This is enforced
      // on the backend so tech-savvy users can't bypass it by inspecting API
      // responses.
      assignment:
        course.assignments[0] !== undefined
          ? allCompleted
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
            : {
                // Locked placeholder — no content revealed
                id: course.assignments[0].id,
                title: null,
                description: null,
                instructions: null,
                fileUrl: null,
                dueDate: null,
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
        totalVideos,
        completedVideos,
        completedTopics,
        totalTopics,
        percent,
        allCompleted,
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

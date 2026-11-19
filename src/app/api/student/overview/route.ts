import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireStudent,
  getStudentSubscription,
  handleAuthError,
} from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireStudent();
    const firstName = user.name.split(" ")[0] || user.name;

    // ─── Fetch data in small batches (3 at a time) to avoid exhausting
    // the remote PostgreSQL connection pool ("too many clients already") ───
    const [subscription, allCourses, allVideoProgress] = await Promise.all([
      getStudentSubscription(user.id),
      db.course.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, thumbnail: true,
          planAccess: { select: { planId: true } },
          accessType: true,
          university: { select: { id: true, name: true, logo: true } },
        },
      }),
      db.videoProgress.findMany({
        where: { studentId: user.id },
        select: { videoId: true, isCompleted: true, updatedAt: true },
      }),
    ]);

    const [allVideoQuestions, allPassedAssessments, allPublishedVideos] = await Promise.all([
      db.videoQuestion.findMany({ distinct: ["videoId"], select: { videoId: true } }),
      db.videoAssessment.findMany({ where: { studentId: user.id, passed: true }, select: { videoId: true } }),
      db.videoLesson.findMany({
        where: { isPublished: true },
        select: { id: true, courseId: true, title: true, thumbnail: true, videoUrl: true, source: true, displayOrder: true },
        orderBy: { displayOrder: "asc" },
      }),
    ]);

    const [lastProgressRows, assignments, recentCertificatesRaw] = await Promise.all([
      db.videoProgress.findMany({
        where: { studentId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { videoId: true, updatedAt: true },
      }),
      db.assignment.findMany({
        where: { isPublished: true, course: { isPublished: true } },
        orderBy: { dueDate: "asc" },
        include: {
          course: { select: { id: true, title: true } },
          submissions: { where: { studentId: user.id }, select: { id: true }, take: 1 },
        },
      }),
      db.certificate.findMany({
        where: { studentId: user.id },
        orderBy: { issuedAt: "desc" },
        take: 5,
        include: { course: { select: { title: true } } },
      }),
    ]);

    // ─── Build lookup maps (in-memory, no DB queries) ───
    const isSubActive = subscription?.status === "ACTIVE";
    const subPlanId = subscription?.planId;

    const progressMap = new Map(allVideoProgress.map((p) => [p.videoId, p]));
    const questionVideoIds = new Set(allVideoQuestions.map((q) => q.videoId));
    const passedAssessmentSet = new Set(allPassedAssessments.map((a) => a.videoId));
    const videosByCourse = new Map<string, typeof allPublishedVideos>();
    for (const v of allPublishedVideos) {
      if (!videosByCourse.has(v.courseId)) videosByCourse.set(v.courseId, []);
      videosByCourse.get(v.courseId)!.push(v);
    }

    // ─── Determine accessible courses ───
    const accessibleCourseIds: string[] = [];
    const accessibleCourseSet = new Set<string>();
    for (const c of allCourses) {
      let allowed = false;
      if (c.accessType === "FREE") allowed = true;
      else if (isSubActive && subPlanId)
        allowed = c.planAccess.some((pa) => pa.planId === subPlanId);
      if (allowed) {
        accessibleCourseIds.push(c.id);
        accessibleCourseSet.add(c.id);
      }
    }

    // ─── Helper: compute completion stats for a course (in-memory) ───
    function computeStats(courseId: string) {
      const videos = videosByCourse.get(courseId) || [];
      const totalVideos = videos.length;
      if (totalVideos === 0) return { totalVideos: 0, completedVideos: 0, percent: 100 };
      let completedVideos = 0;
      for (const v of videos) {
        const p = progressMap.get(v.id);
        if (p?.isCompleted === true) {
          // Video is completed only if it has no questions OR the assessment is passed
          if (!questionVideoIds.has(v.id) || passedAssessmentSet.has(v.id)) {
            completedVideos++;
          }
        }
      }
      const percent = Math.round((completedVideos / totalVideos) * 100);
      return { totalVideos, completedVideos, percent };
    }

    // ─── Compute learning stats + continue learning ───
    let availableCourses = 0;
    let inProgressCourses = 0;
    let completedCourses = 0;
    let overallPercentSum = 0;
    const continueLearning: any[] = [];

    // Build a map of courseId → latest progress (for continue learning)
    const latestProgressByCourse = new Map<string, { videoId: string; updatedAt: Date }>();
    for (const p of lastProgressRows) {
      const video = allPublishedVideos.find((v) => v.id === p.videoId);
      if (video && accessibleCourseSet.has(video.courseId)) {
        const existing = latestProgressByCourse.get(video.courseId);
        if (!existing || p.updatedAt > existing.updatedAt) {
          latestProgressByCourse.set(video.courseId, { videoId: p.videoId, updatedAt: p.updatedAt });
        }
      }
    }

    for (const cid of accessibleCourseIds) {
      const stats = computeStats(cid);
      availableCourses++;
      overallPercentSum += stats.percent;
      if (stats.completedVideos === stats.totalVideos) {
        completedCourses++;
      } else if (stats.completedVideos > 0) {
        inProgressCourses++;
      }

      // Continue learning: if student has progress in this course
      const latest = latestProgressByCourse.get(cid);
      if (latest) {
        const courseMeta = allCourses.find((c) => c.id === cid);
        const video = allPublishedVideos.find((v) => v.id === latest.videoId);
        const firstVideo = videosByCourse.get(cid)?.[0];
        const uni = courseMeta?.university;
        if (courseMeta && video) {
          continueLearning.push({
            courseId: cid,
            courseTitle: courseMeta.title,
            thumbnail: courseMeta.thumbnail || firstVideo?.thumbnail || null,
            firstVideoUrl: firstVideo?.videoUrl || null,
            firstVideoSource: firstVideo?.source || null,
            lastVideoId: latest.videoId,
            lastVideoTitle: video.title,
            percent: stats.percent,
            university: uni ? { id: uni.id, name: uni.name, logo: uni.logo } : null,
          });
        }
      }
    }

    const overallPercent =
      availableCourses > 0 ? Math.round(overallPercentSum / availableCourses) : 0;

    // Sort continue-learning by recency, take 6
    continueLearning.sort((a, b) => {
      // Already sorted by updatedAt desc from latestProgressByCourse
      return 0;
    });
    continueLearning.splice(6);

    // ─── Upcoming assignments (inline access + completion check) ───
    const upcomingAssignments: any[] = [];
    for (const a of assignments) {
      if (!accessibleCourseSet.has(a.course.id)) continue;
      const stats = computeStats(a.course.id);
      const completed = stats.completedVideos === stats.totalVideos;
      upcomingAssignments.push({
        id: a.id,
        courseId: a.course.id,
        courseTitle: a.course.title,
        assignmentTitle: a.title,
        dueDate: a.dueDate,
        unlocked: isSubActive && completed,
        submitted: a.submissions.length > 0,
        coursePercent: stats.percent,
      });
    }

    // ─── Recent certificates ───
    const recentCertificates = recentCertificatesRaw.map((c) => ({
      id: c.id,
      courseTitle: c.course.title,
      issuedAt: c.issuedAt,
      certificateNumber: c.certificateNumber,
    }));

    // ─── Upcoming activities ───
    const upcomingActivities: any[] = [];

    // 1. Pending assignments
    for (const a of upcomingAssignments) {
      const dueMs = a.dueDate ? new Date(a.dueDate).getTime() - Date.now() : null;
      upcomingActivities.push({
        id: `asg-${a.id}`,
        type: "assignment",
        courseId: a.courseId,
        courseTitle: a.courseTitle,
        title: a.assignmentTitle,
        dueDate: a.dueDate,
        status: a.submitted ? "submitted" : a.unlocked ? "available" : "locked",
        priority: dueMs !== null && dueMs < 0 ? "overdue" : "normal",
      });
    }

    // 2. Pending video assessments (videos with questions not yet passed)
    for (const v of allPublishedVideos) {
      if (!questionVideoIds.has(v.id)) continue; // no questions
      if (passedAssessmentSet.has(v.id)) continue; // already passed
      if (!accessibleCourseSet.has(v.courseId)) continue; // not accessible
      const courseMeta = allCourses.find((c) => c.id === v.courseId);
      if (!courseMeta) continue;
      upcomingActivities.push({
        id: `va-${v.id}`,
        type: "assessment",
        courseId: v.courseId,
        courseTitle: courseMeta.title,
        title: v.title,
        dueDate: null,
        status: "pending",
        priority: "normal",
      });
    }

    // Sort: overdue first, then by due date
    upcomingActivities.sort((a, b) => {
      const pa = a.priority === "overdue" ? 0 : 1;
      const pb = b.priority === "overdue" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    });
    upcomingActivities.splice(8);

    return NextResponse.json({
      welcomeName: firstName,
      subscription,
      learning: {
        availableCourses,
        inProgressCourses,
        completedCourses,
        overallPercent,
      },
      continueLearning,
      upcomingAssignments,
      upcomingActivities,
      recentCertificates,
    });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[student/overview GET]", e);
    return NextResponse.json(
      { error: "Failed to load overview" },
      { status: 500 }
    );
  }
}

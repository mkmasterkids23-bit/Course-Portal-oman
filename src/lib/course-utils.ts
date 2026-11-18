import crypto from "crypto";
import { db } from "@/lib/db";

/**
 * Add months to a date handling month-end correctly.
 * e.g. adding 1 month to Jan 31 → Feb 28/29.
 */
export function addDurationToDate(
  start: Date,
  duration: number,
  unit: "DAYS" | "WEEKS" | "MONTHS" | "YEARS"
): Date {
  const result = new Date(start);
  switch (unit) {
    case "DAYS":
      result.setDate(result.getDate() + duration);
      break;
    case "WEEKS":
      result.setDate(result.getDate() + duration * 7);
      break;
    case "MONTHS": {
      const targetMonth = result.getMonth() + duration;
      const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);
      const newMonth = ((targetMonth % 12) + 12) % 12;
      // Handle month-end (e.g. Jan 31 + 1 month → Feb 28)
      const originalDay = result.getDate();
      const lastDayOfTargetMonth = new Date(targetYear, newMonth + 1, 0).getDate();
      const day = Math.min(originalDay, lastDayOfTargetMonth);
      result.setFullYear(targetYear, newMonth, day);
      break;
    }
    case "YEARS": {
      const targetYear = result.getFullYear() + duration;
      const originalDay = result.getDate();
      const originalMonth = result.getMonth();
      // Handle Feb 29 on leap year
      const lastDayOfTargetMonth = new Date(targetYear, originalMonth + 1, 0).getDate();
      const day = Math.min(originalDay, lastDayOfTargetMonth);
      result.setFullYear(targetYear, originalMonth, day);
      break;
    }
  }
  return result;
}

/**
 * Compute course completion statistics for a student.
 */
export async function getCourseCompletionStats(
  studentId: string,
  courseId: string
): Promise<{
  totalTopics: number;
  completedTopics: number;
  totalVideos: number;
  completedVideos: number;
  percent: number;
}> {
  const topics = await db.topic.findMany({
    where: { courseId },
    orderBy: { displayOrder: "asc" },
    select: { id: true },
  });
  if (topics.length === 0) {
    // No topics = no required content → course is considered fully watched
    // so the student can proceed to the assignment / certificate.
    return { totalTopics: 0, completedTopics: 0, totalVideos: 0, completedVideos: 0, percent: 100 };
  }
  const topicIds = topics.map((t) => t.id);
  const videos = await db.videoLesson.findMany({
    where: { courseId, topicId: { in: topicIds }, isPublished: true },
    select: { id: true, topicId: true },
  });
  if (videos.length === 0) {
    // No videos = nothing to watch → considered fully completed so the
    // assignment is unlocked and the certificate can be issued.
    return {
      totalTopics: topics.length,
      completedTopics: topics.length, // all (zero-video) topics are "done"
      totalVideos: 0,
      completedVideos: 0,
      percent: 100,
    };
  }
  const videoIds = videos.map((v) => v.id);
  const completedProgress = await db.videoProgress.findMany({
    where: { studentId, videoId: { in: videoIds }, isCompleted: true },
    select: { videoId: true },
  });
  const completedVideoIds = new Set(completedProgress.map((p) => p.videoId));

  // ─── Video Assessment Check ───
  // If a video has questions, the student must also pass the assessment (>= 70%)
  // for that video to be considered "fully completed" for topic-unlock purposes.
  // Fetch which videos have questions
  const videosWithQuestions = await db.videoQuestion.findMany({
    where: { videoId: { in: videoIds } },
    select: { videoId: true },
    distinct: ["videoId"],
  });
  const videoIdsWithQuestions = new Set(videosWithQuestions.map((q) => q.videoId));

  // Fetch passed assessments for this student
  const passedAssessments = await db.videoAssessment.findMany({
    where: { studentId, videoId: { in: videoIds }, passed: true },
    select: { videoId: true },
  });
  const passedAssessmentVideoIds = new Set(passedAssessments.map((a) => a.videoId));

  // A video is "fully completed" if:
  // 1. It's watched completely (in completedVideoIds), AND
  // 2. If it has questions, the assessment is passed (in passedAssessmentVideoIds)
  const fullyCompletedVideoIds = new Set(
    videoIds.filter(
      (vid) =>
        completedVideoIds.has(vid) &&
        (!videoIdsWithQuestions.has(vid) || passedAssessmentVideoIds.has(vid))
    )
  );

  // Group videos by topic
  const videosByTopic = new Map<string, Set<string>>();
  for (const v of videos) {
    if (!videosByTopic.has(v.topicId)) videosByTopic.set(v.topicId, new Set());
    videosByTopic.get(v.topicId)!.add(v.id);
  }
  let completedTopics = 0;
  for (const [, vIds] of videosByTopic) {
    const allDone = Array.from(vIds).every((id) => fullyCompletedVideoIds.has(id));
    if (allDone) completedTopics++;
  }

  const completedVideos = fullyCompletedVideoIds.size;
  const percent = Math.round((completedVideos / videos.length) * 100);
  return {
    totalTopics: topics.length,
    completedTopics,
    totalVideos: videos.length,
    completedVideos,
    percent,
  };
}

/**
 * Check whether all required video lessons in a course are completed by the student.
 */
export async function isCourseCompletedByStudent(
  studentId: string,
  courseId: string
): Promise<boolean> {
  const stats = await getCourseCompletionStats(studentId, courseId);
  // When there are no videos (totalVideos === 0), the course is considered
  // completed — the student can go straight to the assignment.
  return stats.completedVideos === stats.totalVideos;
}

/**
 * Determine whether a student is authorized to access a given course.
 *  - Free courses: any logged-in student.
 *  - Paid courses: student must have an ACTIVE subscription with a plan in the course's planAccess list.
 */
export async function canStudentAccessCourse(
  studentId: string,
  courseId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Fetch course WITH planAccess in a single query (was 2 separate queries)
  const [course, sub] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      select: { id: true, accessType: true, isPublished: true, planAccess: { select: { planId: true } } },
    }),
    db.subscription.findFirst({
      where: { studentId, status: "ACTIVE", expiryDate: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { planId: true },
    }),
  ]);

  if (!course) return { allowed: false, reason: "Course not found" };
  if (course.accessType === "FREE") return { allowed: true };

  if (!sub) return { allowed: false, reason: "No active subscription" };
  if (!course.planAccess.some((pa) => pa.planId === sub.planId)) {
    return { allowed: false, reason: "Your plan does not include this course" };
  }
  return { allowed: true };
}

/**
 * Generate a unique certificate number.
 */
export function generateCertificateNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `LL-${ts}-${rand}`;
}

/**
 * Default certificate settings used when a course has no explicit
 * CertificateTemplate configured. The admin can either:
 *   - Leave the course without a template → this default is used
 *   - Create a template with isEnabled=true  → the template is used
 *   - Create a template with isEnabled=false → no certificate is issued
 */
export const DEFAULT_CERTIFICATE = {
  title: "Certificate of Completion",
  bodyText:
    "This certificate is proudly presented to {{studentName}} for successfully completing the course {{courseName}}.",
  organizationName: "CourseLearn",
};

/**
 * Issue a certificate to a student for a completed course.
 *
 * This is called automatically when the student completes the LAST required
 * video lesson in a course. It handles three scenarios:
 *
 *   1. Course has a CertificateTemplate with isEnabled=true → use the template
 *   2. Course has a CertificateTemplate with isEnabled=false → do NOT issue
 *   3. Course has NO template → auto-generate using defaults (student name,
 *      course name, organization name)
 *
 * The function is idempotent — if a certificate already exists for the
 * (studentId, courseId) pair, it returns the existing one without creating
 * a duplicate.
 *
 * Returns `{ issued: boolean; certificateId: string | null; alreadyExisted: boolean }`.
 */
export async function issueCertificateIfNeeded(
  studentId: string,
  courseId: string
): Promise<{
  issued: boolean;
  certificateId: string | null;
  alreadyExisted: boolean;
}> {
  // 1. Check if a certificate already exists (idempotent — no duplicates)
  const existing = await db.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });
  if (existing) {
    return { issued: false, certificateId: existing.id, alreadyExisted: true };
  }

  // 2. Verify the course is actually completed (all required videos watched)
  const completed = await isCourseCompletedByStudent(studentId, courseId);
  if (!completed) {
    return { issued: false, certificateId: null, alreadyExisted: false };
  }

  // 3. Fetch the course + any certificate template
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      certificateTemplate: true,
    },
  });
  if (!course) return { issued: false, certificateId: null, alreadyExisted: false };

  // 4. Fetch the student name
  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { name: true },
  });
  if (!student) return { issued: false, certificateId: null, alreadyExisted: false };

  // 5. Determine which template to use
  const tmpl = course.certificateTemplate;
  // If a template exists but is explicitly disabled → do not issue
  if (tmpl && !tmpl.isEnabled) {
    return { issued: false, certificateId: null, alreadyExisted: false };
  }

  // Use the template if it exists; otherwise fall back to defaults
  const certTitle = tmpl?.title || DEFAULT_CERTIFICATE.title;
  const certBodyText = tmpl?.bodyText || DEFAULT_CERTIFICATE.bodyText;
  const orgName = tmpl?.organizationName || DEFAULT_CERTIFICATE.organizationName;

  // 6. Generate the certificate
  const certNumber = generateCertificateNumber();
  const issueDateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Replace placeholders in the body text
  const renderedText = certBodyText
    .replace(/\{\{studentName\}\}/g, student.name)
    .replace(/\{\{courseName\}\}/g, course.title)
    .replace(/\{\{issueDate\}\}/g, issueDateStr)
    .replace(/\{\{certificateNumber\}\}/g, certNumber)
    .replace(/\{\{organizationName\}\}/g, orgName);

  const cert = await db.certificate.create({
    data: {
      studentId,
      courseId,
      templateTitle: certTitle,
      templateText: renderedText,
      organizationName: orgName,
      certificateNumber: certNumber,
      issuedAt: new Date(),
    },
  });

  return { issued: true, certificateId: cert.id, alreadyExisted: false };
}


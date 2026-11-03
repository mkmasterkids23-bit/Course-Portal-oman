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
    return { totalTopics: 0, completedTopics: 0, totalVideos: 0, completedVideos: 0, percent: 0 };
  }
  const topicIds = topics.map((t) => t.id);
  const videos = await db.videoLesson.findMany({
    where: { courseId, topicId: { in: topicIds }, isPublished: true },
    select: { id: true, topicId: true },
  });
  if (videos.length === 0) {
    return {
      totalTopics: topics.length,
      completedTopics: 0,
      totalVideos: 0,
      completedVideos: 0,
      percent: 0,
    };
  }
  const videoIds = videos.map((v) => v.id);
  const completedProgress = await db.videoProgress.findMany({
    where: { studentId, videoId: { in: videoIds }, isCompleted: true },
    select: { videoId: true },
  });
  const completedVideoIds = new Set(completedProgress.map((p) => p.videoId));

  // Group videos by topic
  const videosByTopic = new Map<string, Set<string>>();
  for (const v of videos) {
    if (!videosByTopic.has(v.topicId)) videosByTopic.set(v.topicId, new Set());
    videosByTopic.get(v.topicId)!.add(v.id);
  }
  let completedTopics = 0;
  for (const [, vIds] of videosByTopic) {
    const allDone = Array.from(vIds).every((id) => completedVideoIds.has(id));
    if (allDone) completedTopics++;
  }

  const completedVideos = completedVideoIds.size;
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
  return stats.totalVideos > 0 && stats.completedVideos === stats.totalVideos;
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
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, accessType: true, isPublished: true },
  });
  if (!course) return { allowed: false, reason: "Course not found" };

  if (course.accessType === "FREE") return { allowed: true };

  // Paid course — check active subscription against plan access
  const sub = await db.subscription.findFirst({
    where: { studentId, status: "ACTIVE", expiryDate: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!sub) return { allowed: false, reason: "No active subscription" };

  const access = await db.coursePlanAccess.findFirst({
    where: { courseId, planId: sub.planId },
  });
  if (!access) return { allowed: false, reason: "Your plan does not include this course" };

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

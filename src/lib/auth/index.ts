import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./server";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STUDENT" | "UNIVERSITY" | "INSTRUCTOR";
  phone: string | null;
  bio: string | null;
  profilePhoto: string | null;
  universityId: string | null;
  universityName: string | null;
  universityLogo: string | null;
  instructorId?: string | null;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      bio: true,
      profilePhoto: true,
      university: { select: { id: true, name: true, logo: true } },
    },
  });
  if (!user) return null;

  let instructorId: string | null = null;
  let universityId: string | null = user.university?.id ?? null;
  let universityName: string | null = user.university?.name ?? null;
  let universityLogo: string | null = user.university?.logo ?? null;

  // For instructors, fetch their Instructor record to get the
  // university context (and the instructorId for filtering courses).
  if (user.role === "INSTRUCTOR") {
    const instructor = await db.instructor.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        university: { select: { id: true, name: true, logo: true } },
      },
    });
    if (instructor) {
      instructorId = instructor.id;
      if (instructor.university) {
        universityId = instructor.university.id;
        universityName = instructor.university.name;
        universityLogo = instructor.university.logo;
      }
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "STUDENT" | "UNIVERSITY" | "INSTRUCTOR",
    phone: user.phone,
    bio: user.bio,
    profilePhoto: user.profilePhoto,
    universityId,
    universityName,
    universityLogo,
    instructorId,
  };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("ADMIN_ONLY");
  }
  return user;
}

export async function requireStudent(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    throw new Error("STUDENT_ONLY");
  }
  return user;
}

export async function requireUniversity(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "UNIVERSITY" || !user.universityId) {
    throw new Error("UNIVERSITY_ONLY");
  }
  return user;
}

/** Allow either UNIVERSITY or INSTRUCTOR role (instructors belong to a university). */
export async function requireUniversityOrInstructor(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNIVERSITY_OR_INSTRUCTOR_ONLY");
  if (user.role !== "UNIVERSITY" && user.role !== "INSTRUCTOR") {
    throw new Error("UNIVERSITY_OR_INSTRUCTOR_ONLY");
  }
  if (!user.universityId) {
    throw new Error("UNIVERSITY_OR_INSTRUCTOR_ONLY");
  }
  return user;
}

/** Allow either ADMIN or UNIVERSITY role (for shared endpoints). */
export async function requireAdminOrUniversity(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "UNIVERSITY")) {
    throw new Error("ADMIN_OR_UNIVERSITY_ONLY");
  }
  return user;
}

export interface StudentSubscriptionInfo {
  subscriptionId: string;
  planId: string;
  planName: string;
  planPrice: number;
  planCurrency: string;
  planDuration: number;
  planDurationUnit: string;
  startDate: Date;
  expiryDate: Date;
  status: "ACTIVE" | "EXPIRED";
  remainingDays: number;
  elapsedPercent: number;
}

export async function getStudentSubscription(
  studentId: string
): Promise<StudentSubscriptionInfo | null> {
  // Get most recent subscription (active or expired)
  const sub = await db.subscription.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  if (!sub) return null;

  // Update status if expired
  const now = new Date();
  let status: "ACTIVE" | "EXPIRED" =
    sub.status === "ACTIVE" && now < sub.expiryDate ? "ACTIVE" : "EXPIRED";
  if (sub.status !== status) {
    await db.subscription.update({
      where: { id: sub.id },
      data: { status },
    });
  }

  const remainingMs = sub.expiryDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  const totalMs = sub.expiryDate.getTime() - sub.startDate.getTime();
  const elapsedMs = now.getTime() - sub.startDate.getTime();
  const elapsedPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  return {
    subscriptionId: sub.id,
    planId: sub.planId,
    planName: sub.planName,
    planPrice: sub.planPrice,
    planCurrency: sub.planCurrency,
    planDuration: sub.planDuration,
    planDurationUnit: sub.planDurationUnit,
    startDate: sub.startDate,
    expiryDate: sub.expiryDate,
    status,
    remainingDays,
    elapsedPercent,
  };
}

export async function isSubscriptionActive(studentId: string): Promise<boolean> {
  const sub = await getStudentSubscription(studentId);
  return sub?.status === "ACTIVE";
}

export interface ApiError {
  error: string;
  code?: string;
}

export function errorResponse(message: string, status = 400, code?: string) {
  return Response.json({ error: message, code }, { status });
}

export async function handleAuthError(e: unknown) {
  if (e instanceof Error) {
    if (e.message === "ADMIN_ONLY") return errorResponse("Admin access required", 403, "ADMIN_ONLY");
    if (e.message === "STUDENT_ONLY") return errorResponse("Student access required", 403, "STUDENT_ONLY");
    if (e.message === "UNIVERSITY_ONLY") return errorResponse("University access required", 403, "UNIVERSITY_ONLY");
    if (e.message === "ADMIN_OR_UNIVERSITY_ONLY") return errorResponse("Admin or university access required", 403, "ADMIN_OR_UNIVERSITY_ONLY");
    if (e.message === "UNIVERSITY_OR_INSTRUCTOR_ONLY") return errorResponse("University or instructor access required", 403, "UNIVERSITY_OR_INSTRUCTOR_ONLY");
  }
  return null;
}

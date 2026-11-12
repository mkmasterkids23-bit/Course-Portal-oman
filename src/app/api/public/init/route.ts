import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/server";
import { addDurationToDate } from "@/lib/course-utils";

/**
 * Idempotent setup: creates permanent demo accounts (admin, student, university)
 * and starter subscription plans. Also VERIFIES passwords on existing accounts
 * and resets them if they don't match the expected demo credentials.
 *
 * This ensures login credentials are PERMANENTLY available even after database
 * resets, schema migrations, or password changes.
 *
 * Called automatically on every visit to the public homepage.
 */
export async function GET() {
  try {
    let created: string[] = [];
    let fixed: string[] = [];

    // ─── Helper: create or fix an account ───
    async function ensureAccount(
      email: string,
      name: string,
      role: string,
      password: string
    ): Promise<{ created: boolean; fixed: boolean }> {
      const existing = await db.user.findUnique({ where: { email } });
      if (!existing) {
        await db.user.create({
          data: { email, name, role, passwordHash: hashPassword(password) },
        });
        return { created: true, fixed: false };
      }
      // Account exists — verify password works
      if (!verifyPassword(password, existing.passwordHash)) {
        // Password doesn't match expected demo credential — reset it
        await db.user.update({
          where: { id: existing.id },
          data: { passwordHash: hashPassword(password) },
        });
        return { created: false, fixed: true };
      }
      return { created: false, fixed: false };
    }

    // ─── 1. Admin account ───
    const adminResult = await ensureAccount(
      "admin@courselearn.dev", "Platform Administrator", "ADMIN", "admin123"
    );
    if (adminResult.created) created.push("admin");
    if (adminResult.fixed) fixed.push("admin-password");

    // ─── 2. Subscription plans (only if none exist) ───
    const planCount = await db.subscriptionPlan.count();
    if (planCount === 0) {
      await db.subscriptionPlan.createMany({
        data: [
          {
            name: "Basic", description: "Entry-level plan for getting started with self-paced learning.",
            price: 10, currency: "OMR", duration: 1, durationUnit: "MONTHS",
            features: JSON.stringify(["Access to selected training courses", "Recorded video lessons", "Course learning materials", "Assignment access"]),
            benefits: JSON.stringify(["Self-paced study", "Mobile-friendly access", "Progress tracking"]),
            isActive: true, isPopular: false,
          },
          {
            name: "Standard", description: "Most popular plan for committed learners who want full course access.",
            price: 25, currency: "OMR", duration: 3, durationUnit: "MONTHS",
            features: JSON.stringify(["Access to all standard training courses", "Recorded video lessons", "Course learning materials", "Assignment access", "Completion certificates", "Priority email support"]),
            benefits: JSON.stringify(["3 months of full access", "Progress tracking", "Verifiable certificates", "Priority support"]),
            isActive: true, isPopular: true,
          },
          {
            name: "Premium", description: "Annual plan for professionals seeking long-term access and benefits.",
            price: 90, currency: "OMR", duration: 1, durationUnit: "YEARS",
            features: JSON.stringify(["Access to all premium training courses", "Recorded video lessons", "Course learning materials", "Assignment access", "Completion certificates", "Direct instructor messaging", "Early access to new courses"]),
            benefits: JSON.stringify(["12 months of unlimited access", "Verifiable certificates", "Premium support", "Early course access"]),
            isActive: true, isPopular: false,
          },
        ],
      });
      created.push("plans");
    }

    // ─── 3. University account (Tech University) ───
    const uniResult = await ensureAccount(
      "tech@courselearn.dev", "Tech University", "UNIVERSITY", "tech123"
    );
    if (uniResult.created) created.push("university");
    if (uniResult.fixed) fixed.push("university-password");

    // Ensure university profile exists
    const uniUser = await db.user.findUnique({ where: { email: "tech@courselearn.dev" } });
    if (uniUser) {
      const existingUni = await db.university.findUnique({ where: { userId: uniUser.id } });
      if (!existingUni) {
        await db.university.create({
          data: {
            name: "Tech University",
            description: "A leading technology university offering professional courses in programming, design, and digital skills.",
            userId: uniUser.id,
          },
        });
        created.push("university-profile");
      }
    }

    // ─── 4. Demo Student account ───
    const studentResult = await ensureAccount(
      "demo@courselearn.dev", "Demo Student", "STUDENT", "password123"
    );
    if (studentResult.created) created.push("student");
    if (studentResult.fixed) fixed.push("student-password");

    // Ensure student has an active subscription
    const studentUser = await db.user.findUnique({ where: { email: "demo@courselearn.dev" } });
    if (studentUser) {
      const existingSub = await db.subscription.findFirst({
        where: { studentId: studentUser.id, status: "ACTIVE" },
      });
      if (!existingSub) {
        const standardPlan = await db.subscriptionPlan.findFirst({ where: { name: "Standard" } });
        if (standardPlan) {
          const startDate = new Date();
          const expiryDate = addDurationToDate(startDate, standardPlan.duration, standardPlan.durationUnit as "DAYS" | "WEEKS" | "MONTHS" | "YEARS");
          await db.subscription.create({
            data: {
              studentId: studentUser.id,
              planId: standardPlan.id,
              planName: standardPlan.name,
              planPrice: standardPlan.price,
              planCurrency: standardPlan.currency,
              planDuration: standardPlan.duration,
              planDurationUnit: standardPlan.durationUnit,
              startDate,
              expiryDate,
              status: "ACTIVE",
            },
          });
          created.push("student-subscription");
        }
      }
    }

    if (created.length > 0 || fixed.length > 0) {
      return NextResponse.json({
        seeded: true,
        created,
        fixed,
        credentials: {
          admin: { email: "admin@courselearn.dev", password: "admin123" },
          university: { email: "tech@courselearn.dev", password: "tech123" },
          student: { email: "demo@courselearn.dev", password: "password123" },
        },
      });
    }

    return NextResponse.json({ seeded: false });
  } catch (e) {
    console.error("[init]", e);
    return NextResponse.json({ error: "Init failed", detail: String(e) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/server";

/**
 * Idempotent setup: creates a default admin account and a couple of starter
 * subscription plans if the database is empty. Safe to call on every visit
 * to the public homepage.
 */
export async function GET() {
  try {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });

    if (adminCount === 0) {
      const password = "admin123";
      await db.user.create({
        data: {
          email: "admin@learncourse.dev",
          name: "Platform Administrator",
          role: "ADMIN",
          passwordHash: hashPassword(password),
        },
      });

      // Seed starter plans if none exist
      const planCount = await db.subscriptionPlan.count();
      if (planCount === 0) {
        await db.subscriptionPlan.createMany({
          data: [
            {
              name: "Basic",
              description: "Entry-level plan for getting started with self-paced learning.",
              price: 10,
              currency: "OMR",
              duration: 1,
              durationUnit: "MONTHS",
              features: JSON.stringify([
                "Access to selected training courses",
                "Recorded video lessons",
                "Course learning materials",
                "Assignment access",
              ]),
              benefits: JSON.stringify([
                "Self-paced study",
                "Mobile-friendly access",
                "Progress tracking",
              ]),
              isActive: true,
              isPopular: false,
            },
            {
              name: "Standard",
              description: "Most popular plan for committed learners who want full course access.",
              price: 25,
              currency: "OMR",
              duration: 3,
              durationUnit: "MONTHS",
              features: JSON.stringify([
                "Access to all standard training courses",
                "Recorded video lessons",
                "Course learning materials",
                "Assignment access",
                "Completion certificates",
                "Priority email support",
              ]),
              benefits: JSON.stringify([
                "3 months of full access",
                "Progress tracking",
                "Verifiable certificates",
                "Priority support",
              ]),
              isActive: true,
              isPopular: true,
            },
            {
              name: "Premium",
              description: "Annual plan for professionals seeking long-term access and benefits.",
              price: 90,
              currency: "OMR",
              duration: 1,
              durationUnit: "YEARS",
              features: JSON.stringify([
                "Access to all premium training courses",
                "Recorded video lessons",
                "Course learning materials",
                "Assignment access",
                "Completion certificates",
                "Direct instructor messaging",
                "Early access to new courses",
              ]),
              benefits: JSON.stringify([
                "12 months of unlimited access",
                "Verifiable certificates",
                "Premium support",
                "Early course access",
              ]),
              isActive: true,
              isPopular: false,
            },
          ],
        });
      }

      return NextResponse.json({
        seeded: true,
        admin: { email: "admin@learncourse.dev", password },
        message:
          "Default admin and starter subscription plans created. Please change the admin password after first login.",
      });
    }

    return NextResponse.json({ seeded: false });
  } catch (e) {
    console.error("[init]", e);
    return NextResponse.json({ error: "Init failed" }, { status: 500 });
  }
}

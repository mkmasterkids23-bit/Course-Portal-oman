import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signSession, SESSION_COOKIE } from "@/lib/auth/server";
import { addDurationToDate } from "@/lib/course-utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  planId: z.string().min(1, "Please select a subscription plan"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, password, planId } = parsed.data;

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Selected plan is not available" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const student = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: "STUDENT",
      },
    });

    const startDate = new Date();
    const expiryDate = addDurationToDate(
      startDate,
      plan.duration,
      plan.durationUnit as "DAYS" | "WEEKS" | "MONTHS" | "YEARS"
    );

    await db.subscription.create({
      data: {
        studentId: student.id,
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.price,
        planCurrency: plan.currency,
        planDuration: plan.duration,
        planDurationUnit: plan.durationUnit,
        startDate,
        expiryDate,
        status: "ACTIVE",
      },
    });

    const token = signSession({
      userId: student.id,
      role: "STUDENT",
      email: student.email,
      name: student.name,
    });

    const res = NextResponse.json({
      user: {
        id: student.id,
        email: student.email,
        name: student.name,
        role: "STUDENT",
        phone: null,
        bio: null,
        profilePhoto: null,
      },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

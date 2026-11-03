import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signSession, SESSION_COOKIE } from "@/lib/auth/server";
import { SESSION_COOKIE_OPTIONS } from "@/lib/auth/cookie-options";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
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
    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signSession({
      userId: user.id,
      role: user.role as "ADMIN" | "STUDENT",
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "ADMIN" | "STUDENT",
        phone: user.phone,
        bio: user.bio,
        profilePhoto: user.profilePhoto,
      },
    });
    res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return res;
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

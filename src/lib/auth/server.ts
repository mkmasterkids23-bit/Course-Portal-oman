import crypto from "crypto";

// PBKDF2 password hashing using Node's built-in crypto (no extra deps)
const ITERATIONS = 120_000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");
  return `pbkdf2$${ITERATIONS}$${DIGEST}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, iterStr, digest, salt, hash] = stored.split("$");
    if (scheme !== "pbkdf2") return false;
    const iterations = parseInt(iterStr, 10);
    const computed = crypto
      .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, digest)
      .toString("hex");
    // constant-time compare
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
  } catch {
    return false;
  }
}

// Session tokens: signed JWT-like tokens stored in httpOnly cookie
const SESSION_SECRET =
  process.env.SESSION_SECRET || "lumina-learning-dev-secret-change-in-production-9f3a72";

export interface SessionPayload {
  userId: string;
  role: "ADMIN" | "STUDENT" | "UNIVERSITY" | "INSTRUCTOR";
  email: string;
  name: string;
  universityId?: string | null; // set when role === "UNIVERSITY"
  issuedAt: number;
  expiresAt: number;
}

export function signSession(payload: Omit<SessionPayload, "issuedAt" | "expiresAt">): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 60 * 60 * 24 * 7; // 7 days
  const full: SessionPayload = { ...payload, issuedAt, expiresAt };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(body)
      .digest("base64url");
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
    if (payload.expiresAt < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "lumina_session";

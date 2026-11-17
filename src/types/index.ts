// Shared client-side types and route helpers

export type Role = "ADMIN" | "STUDENT" | "UNIVERSITY" | null;

export interface PublicUser {
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
}

export interface SubscriptionPlanPublic {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration: number;
  durationUnit: "DAYS" | "WEEKS" | "MONTHS" | "YEARS";
  features: string[];
  benefits: string[];
  isActive: boolean;
  isPopular: boolean;
  createdAt: string;
}

export interface CoursePublic {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  accessType: "FREE" | "PAID";
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isPublished: boolean;
  topicsCount: number;
  videosCount: number;
  planNames: string[];
  university?: { id: string; name: string; logo: string | null } | null;
}

// Route parser for hash-based SPA routing
export interface ParsedRoute {
  // raw hash string (without leading #)
  hash: string;
  // segments split by "/"
  segments: string[];
  // query string parsed
  query: Record<string, string>;
}

export function parseHash(hash: string): ParsedRoute {
  const clean = hash.replace(/^#\/?/, "");
  const [pathPart, queryPart] = clean.split("?");
  const segments = pathPart ? pathPart.split("/").filter(Boolean) : [];
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const pair of queryPart.split("&")) {
      const [k, v] = pair.split("=");
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
  }
  return { hash: clean, segments, query };
}

export function buildHash(segments: string[], query?: Record<string, string | undefined>): string {
  const path = segments.length ? "/" + segments.join("/") : "/";
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
      .join("&");
    return qs ? `${path}?${qs}` : path;
  }
  return path;
}

export function navigateHash(hash: string) {
  if (typeof window === "undefined") return;
  window.location.hash = hash;
}

export function durationUnitLabel(unit: string): string {
  switch (unit) {
    case "DAYS": return "Days";
    case "WEEKS": return "Weeks";
    case "MONTHS": return "Months";
    case "YEARS": return "Years";
    default: return unit;
  }
}

export function formatPrice(price: number, currency: string): string {
  const formatted = price.toLocaleString(undefined, {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fileExtIcon(ext: string): string {
  const e = ext.toLowerCase().replace(/^\./, "");
  switch (e) {
    case "pdf": return "PDF";
    case "doc":
    case "docx": return "DOC";
    case "ppt":
    case "pptx": return "PPT";
    case "txt": return "TXT";
    case "mp4":
    case "webm":
    case "mov": return "VIDEO";
    default: return e.toUpperCase();
  }
}

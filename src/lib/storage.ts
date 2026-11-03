import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export async function saveUploadedFile(
  file: File,
  subDir: string = ""
): Promise<{ url: string; size: number; ext: string }> {
  await ensureUploadDir();
  const targetDir = path.join(UPLOAD_DIR, subDir);
  await fs.mkdir(targetDir, { recursive: true });

  const ext = path.extname(file.name) || "";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`;
  const filePath = path.join(targetDir, name);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const url = `${PUBLIC_PREFIX}${subDir ? "/" + subDir : ""}/${name}`;
  return { url, size: buffer.length, ext: safeExt };
}

export const ALLOWED_VIDEO_EXT = [".mp4", ".webm", ".mov", ".mkv"];
export const ALLOWED_DOC_EXT = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"];
export const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];

export function validateExt(ext: string, allowed: string[]): boolean {
  return allowed.includes(ext.toLowerCase());
}

export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

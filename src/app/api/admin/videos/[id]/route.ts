import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import {
  saveUploadedFile,
  validateExt,
  ALLOWED_VIDEO_EXT,
  ALLOWED_IMAGE_EXT,
} from "@/lib/storage";

function normalizeYouTubeUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/embed\/([A-Za-z0-9_-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
    return url;
  } catch {
    return url;
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await db.videoLesson.findUnique({ where: { id } });
    if (!existing) return errorResponse("Video not found", 404);

    const formData = await req.formData();
    const title = (formData.get("title") as string | null)?.trim();
    const description = (formData.get("description") as string | null)?.trim() || null;
    const topicId = formData.get("topicId") as string | null;
    const source = (formData.get("source") as string | null) || existing.source;
    const videoUrlRaw = (formData.get("videoUrl") as string | null)?.trim() || "";
    const file = formData.get("file");
    const thumbnailFile = formData.get("thumbnail");
    const displayOrderStr = formData.get("displayOrder") as string | null;
    const isPublishedStr = formData.get("isPublished") as string | null;

    const data: any = {};
    if (title) data.title = title;
    if (description !== null) data.description = description;
    if (topicId) {
      const topic = await db.topic.findFirst({
        where: { id: topicId, courseId: existing.courseId },
      });
      if (!topic) return errorResponse("Topic not found in this course", 404);
      data.topicId = topicId;
    }

    const src = source === "YOUTUBE" || source === "URL" || source === "UPLOAD" ? source : existing.source;
    data.source = src;

    if (src === "UPLOAD") {
      if (file && file instanceof File) {
        const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
        if (!validateExt(ext, ALLOWED_VIDEO_EXT)) {
          return errorResponse(
            `Invalid video extension. Allowed: ${ALLOWED_VIDEO_EXT.join(", ")}`,
            400
          );
        }
        const saved = await saveUploadedFile(file, "videos");
        data.videoUrl = saved.url;
      } else if (videoUrlRaw) {
        // Allow swapping an uploaded video to a URL? — keep videoUrl if videoUrlRaw provided
        data.videoUrl = videoUrlRaw;
      }
      // else keep existing
    } else if (src === "YOUTUBE") {
      if (videoUrlRaw) data.videoUrl = normalizeYouTubeUrl(videoUrlRaw);
    } else {
      if (videoUrlRaw) data.videoUrl = videoUrlRaw;
    }

    if (thumbnailFile && thumbnailFile instanceof File) {
      const ext = "." + (thumbnailFile.name.split(".").pop() || "").toLowerCase();
      if (validateExt(ext, ALLOWED_IMAGE_EXT)) {
        const saved = await saveUploadedFile(thumbnailFile, "thumbnails");
        data.thumbnail = saved.url;
      }
    }

    if (displayOrderStr !== null && displayOrderStr !== "") {
      const parsed = parseInt(displayOrderStr, 10);
      if (!Number.isNaN(parsed)) data.displayOrder = parsed;
    }
    if (isPublishedStr !== null) {
      data.isPublished = isPublishedStr !== "false";
    }

    const updated = await db.videoLesson.update({ where: { id }, data });
    return NextResponse.json({ video: updated });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[admin/videos PUT]", e);
    return errorResponse("Failed to update video", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await db.videoLesson.findUnique({ where: { id } });
    if (!existing) return errorResponse("Video not found", 404);

    await db.videoLesson.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const authErr = await handleAuthError(e);
    if (authErr) return authErr;
    console.error("[admin/videos DELETE]", e);
    return errorResponse("Failed to delete video", 500);
  }
}

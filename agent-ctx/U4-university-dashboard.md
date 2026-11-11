# Task U4 — University Sub-Admin Dashboard

**Agent:** Z.ai Code (Claude)
**Task ID:** U4
**Status:** ✅ Complete
**Date:** 2026-11-11

## Summary

Built the complete **University Sub-Admin Dashboard** for the CourseLearn LMS — a fully-scoped
parallel to the admin dashboard, restricted to a single university's courses, materials,
assignments, submissions and certificates. The university cannot see or manage any other
university's content.

## What Was Created

### 1. University-Scoped API Routes (23 files)

All routes live under `src/app/api/university/` and use `requireUniversity()` + ownership
verification on every query. The `universityId` is auto-set when creating a course.

| Route | Methods | Purpose |
|---|---|---|
| `overview/route.ts` | GET | Stats scoped to the university |
| `courses/route.ts` | GET, POST | List/create courses (auto-scoped) |
| `courses/[id]/route.ts` | GET, PUT, DELETE | Verify ownership before any op |
| `courses/[id]/publish/route.ts` | PATCH | Toggle publish |
| `courses/[id]/thumbnail/route.ts` | POST | Upload thumbnail |
| `courses/[id]/topics/route.ts` | GET, POST | List/create topics |
| `courses/[id]/topics/reorder/route.ts` | POST | Reorder topics |
| `courses/[id]/videos/route.ts` | GET, POST | List/create videos (FormData) |
| `courses/[id]/materials/route.ts` | GET, POST | List/create materials (FormData) |
| `courses/[id]/assignments/route.ts` | GET, POST | List/create assignments (FormData) |
| `courses/[id]/certificate/route.ts` | GET, PUT | Certificate template config |
| `topics/[id]/route.ts` | PUT, DELETE | Verify topic's course ownership |
| `videos/[id]/route.ts` | PUT (FormData), DELETE | Verify video's course ownership |
| `videos/[id]/publish/route.ts` | PATCH | Verify ownership |
| `materials/[id]/route.ts` | PUT (FormData), DELETE | Verify material's course ownership |
| `materials/route.ts` | GET | Global list across university's courses |
| `assignments/[id]/route.ts` | PUT (FormData), DELETE | Verify assignment's course ownership |
| `assignments/route.ts` | GET | Global list across university's courses |
| `submissions/route.ts` | GET | Filter by university's courses |
| `submissions/[id]/route.ts` | GET | Verify submission's course ownership |
| `submissions/[id]/review/route.ts` | PATCH | Verify ownership |
| `certificates/route.ts` | GET | Issued certs for university's courses |
| `profile/route.ts` | GET, PUT, POST (logo upload) | University profile + logo |

**Ownership verification pattern** used everywhere:
```typescript
const course = await db.course.findUnique({
  where: { id: courseId },
  select: { universityId: true },
});
if (!course || course.universityId !== user.universityId) {
  return errorResponse("Not found", 404);
}
```

For nested resources (topics/videos/materials/assignments/submissions), ownership is verified
via the parent course's `universityId`.

### 2. University Dashboard Components (10 files)

All stubs in `src/components/university/` replaced with full implementations:

- **`university-sidebar.tsx`** — Premium sidebar with university brand header (logo + name),
  3 nav sections (Teaching, Assessment, Organization) with `Building2`, `BookOpen`, `FileText`,
  `ClipboardList`, `Inbox`, `Award`, `Settings` icons, user badge + logout footer.
- **`university-topbar.tsx`** — Sticky topbar with section title, university name as role badge
  (with `Building2` icon), avatar with university initials, dropdown menu with settings + logout.
- **`university-overview.tsx`** — Premium welcome header, 4 stat cards (Total Courses, Video
  Lessons, Pending Reviews, Certificates Issued), recent submissions panel, quick actions card,
  latest courses list. All fetch from `/api/university/overview`.
- **`university-courses.tsx`** — Premium card grid (same design as admin-courses), search +
  category + published filters, create course dialog, navigate to
  `["university", "courses", id]` on Manage.
- **`university-course-editor.tsx`** (~1100 lines) — Full editor with 5 tabs: Topics & Videos,
  Materials, Assignments, Certificate, Settings. All CRUD via `/api/university/*` endpoints.
  Modeled closely on admin-course-editor but with university API paths and `["university", …]`
  navigation.
- **`university-materials.tsx`** — Materials library table across all university courses, with
  search + course + type filters, add/edit dialog with course/topic selection, file-type badges.
- **`university-assignments.tsx`** — Assignments table across all university courses, with
  search + course filter, add/edit dialog, submission count links to submissions view.
- **`university-submissions.tsx`** — Submissions review table with search + status + course +
  assignment filters, detail dialog with student info, assignment brief, download, and review
  form (status + notes).
- **`university-certificates.tsx`** — Issued certificates table for the university's courses,
  with search + course filter, summary banner, certificate number, download link.
- **`university-settings.tsx`** — University overview stats, profile card (name, description,
  contact phone, bio, logo upload), change password form, signed-in account info.

### 3. Design Consistency

All components mirror the admin dashboard's premium design:
- Cards: `rounded-xl border border-border bg-card p-5 shadow-sm`
- Buttons: `h-9 rounded-lg`
- Table headers: `text-xs font-semibold uppercase tracking-wider`
- Same navy/teal (`primary`/`accent`) palette, no indigo/blue
- All transitions: `duration-200`
- Skeleton loaders for all async states
- Empty states with icons + actions
- AlertDialog confirmations for all destructive ops
- Mobile-first responsive layouts (`sm:`, `md:`, `lg:` breakpoints)

## Validation

- **`bun run lint`** → ✅ 0 errors, 0 warnings
- **`dev.log`** → No errors; only normal Prisma query logs and successful compiles
- **Smoke test** of `/api/university/overview`, `/api/university/courses`,
  `/api/university/materials`, `/api/university/profile` all returned `403` with
  `{"error":"University access required","code":"UNIVERSITY_ONLY"}` — proving the routes
  compile and the `requireUniversity()` guard works correctly.

## Files Created (33 total)

**API routes (23):**
- `src/app/api/university/overview/route.ts`
- `src/app/api/university/courses/route.ts`
- `src/app/api/university/courses/[id]/route.ts`
- `src/app/api/university/courses/[id]/publish/route.ts`
- `src/app/api/university/courses/[id]/thumbnail/route.ts`
- `src/app/api/university/courses/[id]/topics/route.ts`
- `src/app/api/university/courses/[id]/topics/reorder/route.ts`
- `src/app/api/university/courses/[id]/videos/route.ts`
- `src/app/api/university/courses/[id]/materials/route.ts`
- `src/app/api/university/courses/[id]/assignments/route.ts`
- `src/app/api/university/courses/[id]/certificate/route.ts`
- `src/app/api/university/topics/[id]/route.ts`
- `src/app/api/university/videos/[id]/route.ts`
- `src/app/api/university/videos/[id]/publish/route.ts`
- `src/app/api/university/materials/route.ts`
- `src/app/api/university/materials/[id]/route.ts`
- `src/app/api/university/assignments/route.ts`
- `src/app/api/university/assignments/[id]/route.ts`
- `src/app/api/university/submissions/route.ts`
- `src/app/api/university/submissions/[id]/route.ts`
- `src/app/api/university/submissions/[id]/review/route.ts`
- `src/app/api/university/certificates/route.ts`
- `src/app/api/university/profile/route.ts`

**UI components (10):**
- `src/components/university/university-sidebar.tsx`
- `src/components/university/university-topbar.tsx`
- `src/components/university/university-overview.tsx`
- `src/components/university/university-courses.tsx`
- `src/components/university/university-course-editor.tsx`
- `src/components/university/university-materials.tsx`
- `src/components/university/university-assignments.tsx`
- `src/components/university/university-submissions.tsx`
- `src/components/university/university-certificates.tsx`
- `src/components/university/university-settings.tsx`

## Notes for Downstream Agents

- No existing admin components or APIs were modified — only new files were created.
- The university dashboard shell at `src/components/university/university-dashboard.tsx` was
  already correct and needed no changes.
- The `requireUniversity()` helper at `src/lib/auth/index.ts` was used as-is — it returns a
  `CurrentUser` with `universityId` set.
- For global materials/assignments/certificates listings (needed by the
  university-materials/assignments/certificates components), I added `GET` endpoints at
  `/api/university/materials`, `/api/university/assignments`, `/api/university/certificates`
  that filter via `course: { universityId }`. These were not explicitly listed in the task but
  were required for the components to function.
- A `/api/university/profile` endpoint was added for the settings page to update university
  info and upload a logo.
- The hash-based routing uses segments `["university", section, courseId?]` consistently.

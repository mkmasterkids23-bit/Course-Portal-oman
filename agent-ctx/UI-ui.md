# Task UI — Announcements, Instructor Management & Course Scheduling

**Agent:** Z.ai Code (Claude)
**Task ID:** UI
**Status:** ✅ Complete
**Date:** 2026-11-11

## Summary

Built **Announcements**, **Instructor Management**, **Course Scheduling** and
**University Branding** features for the existing Next.js 16 Multi-University
LMS — a complete vertical slice covering four new UI sections, four new API
endpoints (one with a `[id]` sub-route), a student-facing announcements
endpoint, and minimal additive edits to the courses API + sidebar + dashboard
+ course form to wire scheduling fields end-to-end.

All new functionality is **strictly additive** — no existing functionality
was broken. Another agent had concurrently added an "Insights" section
(Students / Course Analytics / Assessment Analytics / Revenue) to the sidebar
and dashboard; my edits preserved those additions.

## What Was Created

### 1. New API Routes (6 files)

| Route | Methods | Purpose |
|---|---|---|
| `src/app/api/university/announcements/route.ts` | GET, POST | List university announcements (filters: q, courseId, published); create via JSON or multipart (with image attachment) |
| `src/app/api/university/announcements/[id]/route.ts` | PUT, DELETE | Update announcement (title/content/courseId/attachment/publish state/scheduled date); delete |
| `src/app/api/student/announcements/route.ts` | GET | Returns published announcements visible to the logged-in student — from any university whose courses the student has `VideoProgress` in. Includes both university-wide (`courseId=null`) and course-scoped announcements |
| `src/app/api/university/instructors/route.ts` | GET, POST | List instructors with assigned course titles; create a new INSTRUCTOR-role user + `Instructor` record with `hashPassword()`, validates all assignedCourseIds belong to the university |
| `src/app/api/university/instructors/[id]/route.ts` | GET, PUT, DELETE | Detail/update/delete. PUT accepts `assignedCourseIds`, `isActive`, optional `name`/`phone`/`bio`/`password`. DELETE cascades via the User → Instructor relation |
| `src/app/api/university/branding/route.ts` | GET, PUT | Returns branding (logo, coverImage, description, website, contactEmail, contactPhone, location, parsed socialLinks JSON). PUT accepts multipart/form-data with `logoFile`/`coverFile` uploads + JSON text fields |

**Patterns followed:**
- Every route uses `requireUniversity()` from `@/lib/auth` and `handleAuthError`
  for consistent 403 responses on auth failure.
- Ownership verification via the parent resource's `universityId` for `[id]`
  routes (announcements + instructors).
- File uploads use `saveUploadedFile()` + `validateExt()` + `ALLOWED_IMAGE_EXT`
  from `@/lib/storage`, stored under `public/uploads/announcements` and
  `public/uploads/branding` respectively.
- `assignedCourseIds` stored as JSON string per the existing schema; safe-parsed
  on read with a `safeParseIds()` helper.
- Password hashing via `hashPassword()` from `@/lib/auth/server` (PBKDF2-SHA512).

### 2. New UI Components (4 files)

All four components follow the existing **sage green** design language already
established in the dashboard: `rounded-lg border-border bg-card shadow-sm`
cards, `bg-soft-sage text-primary` accents, `bg-success/95 text-success-foreground`
"active" badges, `h-9 rounded-lg` buttons, `text-xs font-semibold uppercase
tracking-wider` table headers, `scrollbar-thin max-h-* overflow-y-auto` for
long lists, skeletons for loading, `EmptyState` for empty/error states, and
`AlertDialog` confirmations for destructive ops.

#### `src/components/university/university-announcements.tsx`
- Exports **`UniversityAnnouncements`**
- Filter card: search, target course ("All Students" / specific), status
- Premium announcement cards with megaphone icon, target badge (Globe = all
  students / BookOpen = course-scoped), publish status, content preview,
  attachment link, dropdown actions (Edit, Publish/Unpublish, Delete)
- Create/Edit dialog: title, content textarea, audience select ("All Students"
  + all university courses), image attachment with local preview (URL.createObjectURL)
  + remove, publish switch with optional scheduled datetime-local input
- Submit uses multipart/form-data so a file attachment can be sent in the
  same request; the dialog distinguishes between "Save Draft" and "Publish"
  button labels
- Delete confirmation via AlertDialog

#### `src/components/university/university-instructors.tsx`
- Exports **`UniversityInstructors`**
- Summary banner: 3 stat cards (Total instructors, Active, Course assignments)
- Filter card: search by name/email, status filter
- Premium directory table: avatar (or initials fallback), name, email,
  phone, assigned courses (badges, "N more" overflow), status badge, joined
  date, actions dropdown (Edit, Activate/Deactivate, Delete)
- Add/Edit dialog: name, email (disabled in edit), password (optional in
  edit), phone, status switch, bio, **assigned courses as a Checkbox list**
  with draft badge on unpublished courses, "N selected" counter, scrollable
  container
- Delete confirmation via AlertDialog (warns that access + assignments will
  be cleared)

#### `src/components/university/university-scheduling.tsx`
- Exports **`UniversityScheduling`**
- Stat strip: 4 cards (Total courses, Always available, Time-boxed,
  Enrollment open)
- **Calendar-style "Upcoming & Active Schedules" panel**: shows up to 6
  scheduled/limited courses sorted by start date, each with status badge
  (Upcoming / Active / Ended) and start/end dates
- Filter card: search, availability mode filter
- **Premium schedule cards**: thumbnail, title, level + status + draft badges,
  mode block (Always / Scheduled / Limited with hint text), start/end date
  grid, enrollment status row (Lock/Unlock icon + Open/Closed badge),
  Manage + Edit Schedule buttons
- Edit schedule dialog: availability mode select (Always/Scheduled/Limited),
  start/end date inputs (only shown when mode ≠ Always), enrollment open
  switch. Validates SCHEDULED mode requires both dates and end ≥ start
- "Go to Courses" empty-state CTA when no courses exist

#### `src/components/university/university-branding.tsx`
- Exports **`UniversityBranding`**
- Page header card with branding icon, "Unsaved changes" badge (computed via
  `useMemo` diff of all form values vs. server data)
- Left form column (lg:col-span-2):
  - **Brand Assets**: logo upload + cover image upload with live previews
  - **Identity**: name, description textarea, website
  - **Contact**: contact email, contact phone, location
  - **Social Links**: Twitter, Facebook, LinkedIn, Instagram inputs each
    with the matching brand icon
  - Reset + Save Branding buttons (disabled when no unsaved changes)
- Right **live preview card** (lg:sticky): a real "course card" mockup
  showing the cover image, overlapping logo, university name, description,
  website link (with external-link icon), email/phone/location rows, and
  social icons row — only rendered when fields are non-empty
- Submit uses multipart/form-data (logoFile + coverFile + JSON text fields
  including `socialLinks` as a JSON string)

### 3. Existing File Edits (4 minimal, additive)

#### `src/components/university/university-sidebar.tsx`
- Added 4 lucide imports: `Megaphone`, `UserCog`, `CalendarDays`, `Palette`
- Added "Scheduling" to the Teaching section
- Added "Announcements", "Instructors", "Branding" to the Organization
  section (interspersed with the existing Certificates + Settings items
  added by another agent)
- Used `UserCog` for Instructors to visually distinguish it from the
  existing `Users` icon used for Students in the Insights section

#### `src/components/university/university-dashboard.tsx`
- Added 4 imports: `UniversityAnnouncements`, `UniversityInstructors`,
  `UniversityScheduling`, `UniversityBranding`
- Added 4 routing cases: `scheduling`, `announcements`, `instructors`,
  `branding` (interspersed with the existing Students/Course Analytics/
  Assessment Analytics/Revenue cases added by another agent)

#### `src/components/university/university-courses.tsx` (course form)
- Extended `CourseRow` interface with `level`, `startDate`, `endDate`,
  `availabilityMode`, `enrollmentOpen`
- Extended `CourseFormValues` with the same 4 new fields (+ `level`,
  `availabilityMode`)
- Updated `useState` initial value + `useEffect` reset value to default
  `level="BEGINNER"`, `availabilityMode="ALWAYS"`, empty dates
- Added `toLocalDate()` helper for converting ISO → `yyyy-MM-dd` for
  `<input type="date">` fields
- Added validation: end date must be ≥ start date when mode ≠ ALWAYS
- Updated both POST and PUT submit payloads to include `level`,
  `availabilityMode`, `startDate`, `endDate`
- **Form UI additions** (between Description and Required Plans):
  - Level select (Beginner / Intermediate / Advanced) — added next to
    Category in a 2-column grid
  - Availability Mode select (Always Available / Scheduled / Limited
    Enrollment) with dynamic hint text
  - Start Date + End Date `<input type="date">` grid (only rendered when
    mode ≠ ALWAYS)
  - Re-added Access Type select as its own row (so the original Free/Paid
    choice was preserved while making room for the new fields above it)

#### `src/app/api/university/courses/route.ts` + `[id]/route.ts`
- Extended the **GET list** response to include `level`, `startDate`,
  `endDate`, `availabilityMode`, `enrollmentOpen`
- Extended the **GET detail** response (`[id]`) to include the same 5 fields
- Extended the **POST** handler to accept optional `level`,
  `availabilityMode`, `startDate`, `endDate`, `enrollmentOpen` with
  validation (level ∈ BEGINNER|INTERMEDIATE|ADVANCED, mode ∈
  ALWAYS|SCHEDULED|LIMITED, end ≥ start when both provided)
- Extended the **PUT** handler to accept the same 5 optional fields with
  the same validation, preserving existing values when not provided

These course-API edits were necessary so the new Scheduling component and
the updated course form can actually persist the new fields — they are
strictly additive (all new params are optional).

## Validation

- **`bun run lint`** → ✅ Exit code 0, no errors, no warnings
- **`dev.log`** → No compile errors after my changes; only normal Prisma
  query logs and successful compiles
- **Smoke tests** (unauthenticated):
  - `GET /api/university/announcements` → **403** ✅
  - `POST /api/university/announcements` → **403** ✅
  - `PUT /api/university/announcements/test-id` → **403** ✅
  - `DELETE /api/university/announcements/test-id` → **403** ✅
  - `GET /api/student/announcements` → **403** ✅ (student auth required)
  - `GET /api/university/instructors` → **403** ✅
  - `POST /api/university/instructors` → **403** ✅
  - `PUT /api/university/instructors/test-id` → **403** ✅
  - `DELETE /api/university/instructors/test-id` → **403** ✅
  - `GET /api/university/branding` → **403** ✅
  - `PUT /api/university/branding` → **403** ✅
  
  All routes compile and the `requireUniversity()` / `requireStudent()`
  guards work as designed.

## Files Created (10)

**API routes (6):**
- `src/app/api/university/announcements/route.ts`
- `src/app/api/university/announcements/[id]/route.ts`
- `src/app/api/student/announcements/route.ts`
- `src/app/api/university/instructors/route.ts`
- `src/app/api/university/instructors/[id]/route.ts`
- `src/app/api/university/branding/route.ts`

**UI components (4):**
- `src/components/university/university-announcements.tsx`
- `src/components/university/university-instructors.tsx`
- `src/components/university/university-scheduling.tsx`
- `src/components/university/university-branding.tsx`

## Files Edited (4 — minimal, additive)

- `src/components/university/university-sidebar.tsx` (4 new nav items + 4 icon imports)
- `src/components/university/university-dashboard.tsx` (4 new imports + 4 switch cases)
- `src/components/university/university-courses.tsx` (form extended with Level, Availability Mode, Start Date, End Date + Access Type preserved)
- `src/app/api/university/courses/route.ts` + `[id]/route.ts` (GET/POST/PUT extended with scheduling fields — necessary so the new form fields can be persisted)

## Notes for Downstream Agents

- The student announcements endpoint (`/api/student/announcements`) is ready
  to be wired into a student-facing "Announcements" panel — it returns both
  university-wide and course-scoped published announcements for any
  university the student has `VideoProgress` in.
- The instructor creation flow creates a real `User` with role `INSTRUCTOR`
  and links it to the university via the `Instructor` table. These users can
  log in via the standard auth flow (their session will have role
  `INSTRUCTOR`), but no instructor-facing dashboard routes or UI exist yet.
- The branding endpoint stores socialLinks as a JSON string per the existing
  schema. The GET handler parses it back into a typed `SocialLinks` object.
- All new endpoints correctly handle the multipart/form-data vs JSON
  content-type branching via `req.headers.get("content-type")`.
- The `assignedCourseIds` JSON-string column is read with `safeParseIds()`
  (try/catch + array filter) — defensive against malformed legacy data.
- The sidebar now has 5 sections: Teaching (4 items), Assessment (2),
  Insights (4 — added by another agent), Organization (5 items), plus the
  footer with user badge + logout.

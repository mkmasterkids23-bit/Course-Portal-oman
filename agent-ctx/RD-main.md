# Task RD — Revenue Dashboard, Enhanced Student Dashboard, Enhanced Course Discovery, University Profile — COMPLETED

Agent: RD (main)
Task: Build University Revenue Dashboard, Enhanced Student Dashboard, Public University Profile Page, Enhanced Course Discovery with faceted filters, plus sidebar/routing wiring.

## Status
**DONE** — All new APIs and components created, existing files edited with minimal changes. `bun run lint` → 0 errors / 0 warnings. Runtime smoke-tested via curl: `/api/public/universities/[id]` → 200, `/api/public/courses?level=&sort=` → 200 (filtering + sorting working), `/api/university/revenue` & `/api/student/recent-activity` return 403 when unauthenticated (expected — auth-gated).

## Files Created (NEW)

### APIs
- **`src/app/api/university/revenue/route.ts`** — `GET /api/university/revenue`. Returns `{ hasPaymentData, totalSales, grossRevenue, paidEnrollments, freeEnrollments, currency, courseRevenue[], monthlyTrend[] }`. Aggregates Subscription records of students with VideoProgress in the university's paid courses. Computes per-course enrollments/gross sales and a 6-month revenue trend bucketed by subscription startDate. Returns `hasPaymentData: false` with zeroed numerics when no paying enrollments exist (UI shows a "configure payments" placeholder).
- **`src/app/api/student/recent-activity/route.ts`** — `GET /api/student/recent-activity`. Merges VideoProgress completions, VideoAssessment results, AssignmentSubmissions, and Certificates into a single chronological timeline (max 10). Each item normalized to `{ id, type, courseId, courseTitle, title, detail, timestamp, score?, passed?, certificateNumber? }` with `type` ∈ `video_completed | assessment | submission | certificate`.
- **`src/app/api/public/universities/[id]/route.ts`** — `GET /api/public/universities/[id]`. Public university profile detail: branding (logo, coverImage, description, website, contactEmail, contactPhone, location, socialLinks parsed from JSON), enriched published courses (with `level`, topic/video counts, plan names, first-video thumbnail fallback), distinct categories, total course count. 404 if the university does not exist.

### Components
- **`src/components/university/university-revenue.tsx`** — exports `UniversityRevenue`. Premium sage-green header, 4 stat cards (Gross Revenue, Total Sales, Paid Enrollments, Free Enrollments), recharts AreaChart monthly trend (Deep Forest stroke + sage gradient fill), course-wise revenue table. When `hasPaymentData === false`, renders a professional "Revenue tracking will appear here once payment processing is configured" hero with placeholder stat tiles. Uses sage palette exclusively (`bg-primary`, `bg-accent`, `bg-soft-sage`, success/warning tones for differentiation).
- **`src/components/public/university-profile-page.tsx`** — exports `UniversityProfilePage({ universityId })`. Full page: cover banner (gradient fallback when no coverImage), overlapping logo card, name + badges (course count), website/enroll CTAs, description + contact info column (email/phone/location/socials), 4-card stats strip (Total Courses, Video Lessons, Categories, Free Courses), full faceted course catalog (search + category + level + type + duration + sort dropdowns), result count + clear-all-filters. Course cards show: free/paid badge, level badge (color-coded), category badge, thumbnail, university name via UniversityBadge, topics/lessons counts, plan names. Loading skeleton + 404 empty state handled.

## Files Edited (ENHANCED)

### API — extended to support `?level=` & `?sort=` and emit `level` field
- **`src/app/api/public/courses/route.ts`** — `GET(req)` now reads `level` & `sort` query params. Added `level` + `createdAt` to the Prisma select, added a distinct-student `popularity` count per course (via `db.videoProgress.groupBy`), and applies server-side sort: `newest` (default, createdAt desc), `popular` (by popularity), `alphabetical` (locale-aware title sort). Invalid `level` values fall through to "all" gracefully.
- **`src/app/api/student/courses/route.ts`** — Same `level` + `sort` support added; per-course `level`, `createdAt` (ISO), and `popularity` emitted on each accessible course. Server-side sort mirrors the public endpoint. Backward-compatible — existing response shape preserved, only new fields added.

### API — extended overview with upcoming activities
- **`src/app/api/student/overview/route.ts`** — Appended `upcomingActivities: []` to the response. Combines pending assignments (re-shaped from existing `upcomingAssignments`) with pending video assessments (videos with questions the student hasn't passed, scoped to accessible courses). Each item normalized to `{ id, type: "assignment" | "assessment", courseId, courseTitle, title, dueDate?, status, priority: "normal" | "overdue" }`. Sorted: overdue first, then due-date asc (nulls last), capped at 8.

### Student dashboard — added Upcoming Activities + Recent Activity timeline
- **`src/components/student/student-overview.tsx`** — Added a parallel `useApiFetch("/api/student/recent-activity")` call. New sections (in order, all existing sections kept intact):
  1. Welcome header (unchanged)
  2. Subscription status (unchanged)
  3. Summary stat cards (unchanged)
  4. Continue Learning (unchanged)
  5. Upcoming Assignments + Recent Certificates grid (unchanged)
  6. **NEW: Upcoming Activities** — grid of clickable cards combining pending assignments + assessments. Each card shows course name, deadline (with overdue highlight), status badge, and an `ArrowUpRight` icon. Clicking navigates to the course.
  7. **NEW: Recent Activity timeline** — vertical-spine timeline with node icons. Renders up to 10 merged events (video completions, assessments, submissions, certificates) with timestamp + contextual badge (Completed / Passed/Attempted · score% / Submitted / certificate number). Scrollable with `max-h-[28rem] overflow-y-auto scrollbar-thin`. Empty state with "Browse Courses" CTA.

### Course discovery — added faceted filters
- **`src/components/student/student-my-courses.tsx`** — Added 4 new filter/sort controls to the toolbar:
  - **Sort dropdown**: Newest / Most popular / Alphabetical (client-side re-sort; server already supports it too).
  - **Level filter**: All / Beginner / Intermediate / Advanced.
  - **Type filter**: All / Free / Paid (NEW — was not present).
  - **Duration filter**: All / Short (1–3 topics) / Medium (4–7) / Long (8+) — based on `topicsCount` via a `durationBucket()` helper.
  - Course cards now render a color-coded **level badge** alongside the existing free/paid + category badges.
  - Result count + clear-all-filters button remain, now reflecting the full filter set.
  - Toolbar layout reorganized into two rows on desktop (search + sort on row 1, six faceted dropdowns on row 2) for cleaner UX.

### University sidebar + dashboard wiring
- **`src/components/university/university-sidebar.tsx`** — Added `{ label: "Revenue", icon: TrendingUp, segments: ["university", "revenue"] }` to the existing "Insights" NAV_SECTION. Imported `TrendingUp` from lucide-react.
- **`src/components/university/university-dashboard.tsx`** — Imported `UniversityRevenue` and added `case "revenue": content = <UniversityRevenue />; break;` to the section switch (placed between `certificates` and `settings`).

### Public site routing — university profile route
- **`src/components/public/public-site.tsx`** — Added handling for `/#/university/:id`. Implemented a `UNIVERSITY_DASHBOARD_SECTIONS` Set (overview, courses, materials, assignments, submissions, certificates, settings, revenue, etc.) to distinguish reserved dashboard sub-routes from university IDs. When an unauthenticated visitor lands on `/#/university/<reserved-section>`, they are still redirected home (protected). For `/#/university/<anything-else>`, the page renders `<UniversityProfilePage universityId={segments[1]} />` inside the standard public layout (navbar + footer). Removed the now-unused `user` selector import.

### Type updates
- **`src/types/index.ts`** — Added optional `level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"` to `CoursePublic` so the new field is reflected on the public client type.

## Verification
- `bun run lint` → exit code 0, no errors or warnings.
- `curl http://localhost:3000/api/public/universities/cmwbnucuh0002qi5pqfw7ysdi` → 200 with full profile JSON.
- `curl "http://localhost:3000/api/public/courses?level=BEGINNER"` → 200, returns the BEGINNER course.
- `curl "http://localhost:3000/api/public/courses?level=ADVANCED"` → 200, returns `{"courses":[],"universities":[...]}` (filter applied).
- `curl "http://localhost:3000/api/public/courses?level=garbage"` → 200, gracefully returns all courses (invalid value ignored).
- `curl "http://localhost:3000/api/public/courses?sort=alphabetical"` → 200, sorted server-side.
- `curl http://localhost:3000/api/university/revenue` → 403 `UNIVERSITY_ONLY` (expected — auth-gated).
- `curl http://localhost:3000/api/student/recent-activity` → 403 `STUDENT_ONLY` (expected — auth-gated).
- Dev server log shows clean compiles, no runtime errors after the edits.

## Design Notes
- Sage palette used throughout: `bg-primary` (#344F42 Deep Forest) for hero gradients & primary CTAs, `bg-accent` (#789786 Primary Sage) for accents/icons, `bg-soft-sage` (#E8EFEA) for active states & subtle backgrounds, `text-success` (#43866A) / `text-warning` (#D9A441) / `text-destructive` (#C96A6A) for status differentiation.
- Recharts AreaChart uses a sage gradient (`#344F42` → `#789786` alpha fade) for the revenue trend.
- All new components match the existing premium card / stat-card / badge patterns established in `university-overview.tsx` and `student-overview.tsx` for visual consistency.
- Responsive design: filter toolbars collapse to single column on mobile, course grids use `sm:grid-cols-2 lg:grid-cols-3`.
- No breaking changes to existing functionality — all new fields are additive and all existing response shapes preserved.

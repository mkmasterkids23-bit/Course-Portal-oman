# Task U5 — Student Multi-University Course Browsing with Faceted Search — COMPLETED

Agent: U5
Task: Add multi-university course browsing and faceted search to the CourseLearn LMS. Students can now browse courses from ALL universities, filter by university, and explore a dedicated Universities directory.

## Status
**DONE** — All API routes updated, UI components extended with faceted search + university badges, dedicated Universities directory added. Lint: 0 errors, 0 warnings in code I authored (the 2 remaining warnings are pre-existing in `university-courses.tsx` and `university-sidebar.tsx` which I did not touch). Runtime verified: `GET /api/public/universities` → 200, `GET /api/public/courses` → 200 with `universities` array, Prisma client regenerated and dev server restarted cleanly.

## Files Created

### New API route
- **`src/app/api/public/universities/route.ts`** — `GET /api/public/universities` returns `{ universities: [{ id, name, logo, description, courseCount }] }`. Uses `db.university.findMany` with `include: { courses: { where: { isPublished: true }, select: { id: true } } }` and maps to a count.

### New shared component
- **`src/components/shared/university-badge.tsx`** — `UniversityBadge` pill component with `UniversityRef` type. Renders the university logo (small circular avatar) when available, otherwise falls back to a `Building2` icon. Sized `sm`/`xs`. Themed as `bg-light-teal text-accent border-accent/15`. Reused on every course card surface.

### New student page
- **`src/components/student/student-universities.tsx`** — `StudentUniversities` page component. Shows a navy-gradient hero header with total university count and total published course count, a search input, and a responsive grid of `UniversityCard` items. Each card shows the logo (or `GraduationCap` placeholder), name, description, and a `courseCount` badge. Clicking a card calls `navigate(["student", "courses"], { university: u.id })` to deep-link the My Courses page with a pre-applied filter.

## Files Modified

### API routes — added university relation to course responses + universities array for faceted filters
- **`src/app/api/public/courses/route.ts`** — Added `university: { select: { id, name, logo } }` to the course query, included `university` object (or null) per course, and added a parallel `db.university.findMany` query whose result is returned as a top-level `universities` array alongside `courses`. Both queries run via `Promise.all` to keep the response time the same.
- **`src/app/api/student/courses/route.ts`** — Same treatment: added `university` relation to the `db.course.findMany` select, surfaced `university` (or null) on each accessible course, and added a top-level `universities` array to the response.
- **`src/app/api/student/overview/route.ts`** — Added `university: { select: { id, name, logo } }` to the `allCourses` query and pushed `university` into each `continueLearning` entry so the overview can show university provenance on the "Continue Learning" cards.

### Routing / sidebar / dashboard wiring
- **`src/components/student/student-sidebar.tsx`** — Added `{ label: "Universities", icon: Building2, segments: ["student", "universities"] }` as a new NAV entry directly after "My Courses". Imported `Building2` from lucide-react.
- **`src/components/student/student-dashboard.tsx`** — Added `import { StudentUniversities }` and a `case "universities": content = <StudentUniversities />; break;` branch to the section switch. The "universities" section is intentionally NOT in the `isProtected` list (it's a browsing surface, doesn't require an active subscription).

### Faceted search on My Courses page
- **`src/components/student/student-my-courses.tsx`** — Rewrote the filter toolbar into a 4-column faceted grid: search input + university select + category select + status select. Added a `UniversityBadge` import and rendered it on every course card (xs size, below the title). Added a prominent "Showing courses from [University Name]" banner that appears when a university filter is active, with a "Clear university filter" button. Added an "Active filters" footer row inside the toolbar that lists the active facets and offers a "Clear all" button. Initial state of the `universityFilter` is seeded from the route query (`?university=ID`) so deep-links from the Universities directory work without an extra `useEffect` (avoiding the `react-hooks/set-state-in-effect` rule). The clear functions also strip the `?university` query from the URL so a reload doesn't re-apply it. Updated the `CourseItem` interface with `university?: UniversityRef | null` and added `universities?: UniversityRef[]` to `CoursesData`.

### Public Courses page — Explore by University + university filter + badges
- **`src/components/public/courses-page.tsx`** — Added an "Explore by University" section above the filters: a responsive grid of clickable university cards (logo or Building2 placeholder + name). Clicking toggles `universityFilter`; the active card shows a ring/border highlight. Added a university `<Select>` dropdown next to the search input. Added a "Filtered by: [Name]" banner above the result list. Rendered `UniversityBadge` on every course card. Added a "Clear all filters" affordance in the result-count row. Added a CTA card at the bottom when filtering by a specific university. Updated the `CoursesResponse` interface to include `universities?: UniversityRef[]`.

### Public Home page — university badge on featured course cards
- **`src/components/public/home-page.tsx`** — Imported `CardContent` (from `@/components/ui/card`) and `UniversityBadge`. Added a `UniversityBadge` (size xs) on each `CourseCardMini` between the title and description.

### Type extension
- **`src/types/index.ts`** — Added optional `university?: { id: string; name: string; logo: string | null } | null` to the `CoursePublic` interface (kept optional so existing call sites keep working).

## Dev Environment Note
The dev server was running with a cached PrismaClient instance from before the `University` model existed in the Prisma client build. After `bun run db:generate` regenerated the Prisma client to include `University`, the running next-server still had the old instance cached in `globalThis.prisma`. To bust the cache, I killed the stale `next-server` process and restarted `.zscripts/dev.sh` in the background. The new server picks up the regenerated client correctly: `GET /api/public/universities` → 200, `GET /api/public/courses` → 200 with `universities: []` alongside `courses: []`.

## Faceted Search UX Summary
- **My Courses page**: 4-way faceted toolbar (search / university / category / status) with active-filter summary, "Clear all" button, and a dedicated university filter banner that shows the active university name + a clear button.
- **Public Courses page**: same 4 facets, plus a visual "Explore by University" card grid above the toolbar that doubles as a quick filter shortcut.
- **Universities directory** (student area): independent page showing every university with its course count, deep-links into My Courses with a pre-applied filter.
- **Cross-page deep-link**: clicking a university anywhere navigates to `#/student/courses?university=<id>`, which the My Courses page picks up at mount time (no effect-based setState, so no rules-of-hooks violation).

## Lint Status
```
✖ 2 problems (0 errors, 2 warnings)
```
Both remaining warnings are in `src/components/university/university-courses.tsx` and `src/components/university/university-sidebar.tsx` — pre-existing unused `@next/next/no-img-element` eslint-disable directives in code authored by another agent. **My code: 0 errors, 0 warnings.**

## Dev Log Status
Last lines of `/home/z/my-project/dev.log` show only successful Prisma queries (now including `SELECT main.University ...`) and 200 HTTP responses for `/api/public/universities` and `/api/public/courses`. Zero runtime errors. Zero compilation errors after the dev server restart.

## Nothing Left Unimplemented
Every spec'd task is wired to a real API endpoint and a real UI surface:
1. ✅ Public courses API includes `university` per course + top-level `universities` array
2. ✅ Student courses API includes `university` per accessible course + top-level `universities` array
3. ✅ Student overview API includes `university` in continueLearning entries
4. ✅ My Courses page has faceted search (search + university + category + status) + university badge per card + filter banner
5. ✅ Public courses page has university filter dropdown + university badge per card + "Explore by University" section + filter banner
6. ✅ Public home page CourseCardMini shows university badge
7. ✅ Public Universities API returns universities with course counts
8. ✅ StudentUniversities directory component with university cards that deep-link to filtered My Courses
9. ✅ Student sidebar has "Universities" nav item with `Building2` icon
10. ✅ Student dashboard routes the "universities" section to `<StudentUniversities />`

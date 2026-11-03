# Task B — Student Portal Implementation — COMPLETED

Agent: B
Task: Build the complete Student Portal (APIs + UI pages) for Lumina Learning.

## Status
**DONE** — All API routes and UI components implemented, lint clean (0 errors, 0 warnings in code I authored), no runtime errors in dev.log. End-to-end student journey verified by live API tests.

## Files Created / Modified

### API route files (all new)
- `src/app/api/student/subscription/route.ts` — GET my subscription
- `src/app/api/student/subscription/renew/route.ts` — POST renew / subscribe to plan (deactivates prior ACTIVE subs, creates new one with plan snapshots + computed expiry via `addDurationToDate`)
- `src/app/api/student/courses/route.ts` — GET accessible courses with per-course completion stats + expired flag
- `src/app/api/student/courses/[id]/route.ts` — GET full course detail (topics, videos with progress, materials, assignment + submission, completion stats, certificate template)
- `src/app/api/student/progress/route.ts` — POST/GET video progress with strict completion rules
- `src/app/api/student/assignments/route.ts` — GET list of accessible assignments with locked/unlocked status + course completion
- `src/app/api/student/assignments/[id]/submit/route.ts` — POST FormData submission → auto-issues certificate when template enabled
- `src/app/api/student/certificates/route.ts` — GET list of student certificates
- `src/app/api/student/certificates/[id]/preview/route.ts` — GET HTML preview (inline, for iframe)
- `src/app/api/student/certificates/[id]/pdf/route.ts` — GET printable HTML with `Content-Disposition: attachment` (browser Save-as-PDF)
- `src/app/api/student/overview/route.ts` — GET overview stats (welcomeName, learning, continueLearning, upcomingAssignments, recentCertificates)

### Shared helper (new)
- `src/lib/certificate-html.ts` — `buildCertificateHtml(cert, {forPrint})` — produces self-contained professional HTML certificate (Deep Navy + Muted Teal palette, Cormorant Garamond + Inter fonts, corner flourishes, dual border frame, organization seal, signature lines, certificate ID + verify note). Includes `@media print` rules + a "Save as PDF" button that calls `window.print()`.

### UI component files (replaced stubs)
- `src/components/student/student-overview.tsx`
- `src/components/student/student-my-courses.tsx`
- `src/components/student/student-learning.tsx` (with HTML5 video tracking + YouTube fallback)
- `src/components/student/student-assignments.tsx`
- `src/components/student/student-subscription.tsx`
- `src/components/student/student-certificates.tsx`
- `src/components/student/student-profile.tsx`
- `src/components/student/expired-screen.tsx`

### Minor pre-existing fix
- `src/components/admin/admin-overview.tsx` — fixed a JSX ternary parsing error (`: data ? (...)` → `: data ? (...) : null`) that was blocking the entire app from compiling. NOT introduced by me, but was blocking my code from rendering.
- `src/components/student/student-dashboard.tsx` — re-ordered hook call to fix pre-existing `react-hooks/rules-of-hooks` violation (early return before `useApiFetch`).

## Video Completion Tracking Logic

### Backend (server is source of truth)
On `POST /api/student/progress`, completion is granted ONLY when ALL THREE conditions hold:
1. `duration > 0` (a real duration is known — either from client HTML5 video metadata or the stored `VideoLesson.duration` field)
2. `lastPosition >= duration - 2` (student reached within 2 seconds of the end — small tolerance because the browser `ended` event can fire slightly before `duration`)
3. `watchTimeSeconds >= duration * 0.85` (genuinely accumulated at least 85% of total playtime)

The client-supplied `isCompleted` flag is treated only as a hint. If the client claims completion but the server-side checks fail, the server records `isCompleted = false` and returns `rejectedCompletion: true` so the client can surface a toast ("You need to watch at least 85% of the video before it's marked complete.").

Watch time is preserved across sessions — the server merges `max(incoming_watchTime, existing_watchTime)` so re-watching doesn't lose credit.

### Frontend (HTML5 video)
- `loadedmetadata` → store `videoDuration`; resume to `lastPosition` from GET progress (capped at `duration - 3` to avoid instantly firing `ended`).
- `timeupdate` → compute `delta = currentTime - lastTime`. If `0 < delta <= 1.5` (normal forward playback), add `delta` to `watchTime`. Negative deltas (rewinds) and large positive deltas (seek-forward) are NOT counted. Update `lastTime = currentTime` always so the next delta is small.
- `timeupdate` (throttled to every 5s) → POST progress with current `lastPosition`, accumulated `watchTime`, `duration`. Server validates completion.
- `seeked` → reset `lastTime = currentTime` (no watchTime accumulation).
- `ended` → POST final progress with `isCompleted: true` hint. Server decides.
- Mount → `GET /api/student/progress?videoId=...` to resume from saved position.

### Frontend (YouTube)
YouTube iframes don't expose reliable playback events without the IFrame Player API. As a documented fallback:
- A timer starts when the iframe mounts and accumulates wall-clock watch time.
- A "Mark as complete" button is shown DISABLED until the timer has elapsed `>= duration * 0.85` seconds. The button submits a progress POST with `isCompleted: true` and the accumulated watch time. The server still applies the same 85% rule.
- A clear tooltip + info banner explain the limitation.

### End-to-end test results (verified via curl)
| Test | Watch Time | Position | Client Hint | Server Result |
|------|------------|----------|-------------|---------------|
| Insufficient watch time | 10s / 100s | 100s | isCompleted=true | **rejectedCompletion: true**, isCompleted=false |
| Sufficient watch time | 90s / 100s | 100s | isCompleted=true | **justCompleted: true**, isCompleted=true |
| Second video completion | 95s / 100s | 100s | isCompleted=true | justCompleted: true |
| After both videos complete → submit assignment | — | — | — | success + certificate auto-issued |

## Certificate PDF Approach
Chose the **self-contained printable HTML** approach over Playwright/chromium PDF generation:
- Pros: zero binary dependencies in the restricted sandbox; works in any browser; student gets a real downloadable file via `Content-Disposition: attachment`; the HTML includes a "Save as PDF" button that calls `window.print()` and uses `@media print` rules to render landscape, hide the toolbar, and produce a clean PDF via the browser's native print-to-PDF.
- The HTML uses Cormorant Garamond + Inter from Google Fonts, a Deep Navy/Muted Teal palette matching the brand, dual-border frame with corner flourishes, organization seal, signature lines, certificate number, issue date, and verify note. All user-provided fields are HTML-escaped to prevent injection.
- Two endpoints: `/preview` returns the HTML inline (for iframe embedding inside a Dialog), `/pdf` returns the same HTML with `Content-Disposition: attachment; filename="..."`.

## Lint Status
```
✖ 3 problems (0 errors, 3 warnings)
```
All 3 remaining warnings are pre-existing in files NOT authored by me (`public/courses-page.tsx`, `public/home-page.tsx`, `hooks/use-api.ts` — all unused eslint-disable directives in code written by other agents). **My code has 0 errors and 0 warnings.**

## Dev Log Status
Last ~50 lines of `/home/z/my-project/dev.log` show only successful Prisma queries + 200/403 HTTP responses. Zero runtime errors, zero compilation errors.

## End-to-End Journey Verified
1. ✅ Register student → subscription auto-created
2. ✅ GET /api/student/subscription → returns active sub with remainingDays + elapsedPercent
3. ✅ GET /api/student/courses → accessible courses with completion stats + expired flag
4. ✅ GET /api/student/courses/[id] → full course detail with topics, videos+progress, assignment, cert template
5. ✅ POST /api/student/progress (insufficient watch time) → rejectedCompletion: true
6. ✅ POST /api/student/progress (sufficient watch time) → justCompleted: true, completedAt set
7. ✅ GET /api/student/assignments → locked until course complete; reason surfaced
8. ✅ POST /api/student/assignments/[id]/submit (after course complete) → success + certificate auto-issued with placeholders replaced
9. ✅ GET /api/student/certificates → returns issued cert with rendered text
10. ✅ GET /api/student/certificates/[id]/preview → professional HTML
11. ✅ GET /api/student/certificates/[id]/pdf → same HTML with attachment disposition
12. ✅ POST /api/student/subscription/renew → switches plan, snapshots plan fields, computes new expiry
13. ✅ PUT /api/auth/profile (FormData) → updates name/phone/bio/photo
14. ✅ POST /api/auth/password → validates current, sets new

## Demo Credentials Seeded
A demo student account and a complete free course are pre-seeded so the user can immediately walk through the full journey:
- **Login**: `demo@lumina.dev` / `password123` (active "Standard" plan, 3 months)
- **Course**: "Test Free Course" — 2 topics, 2 published URL videos, 1 assignment (allowResubmission=true), certificate template enabled
- The student starts fresh — they must watch both videos to 85%+ to unlock the assignment, then submit a PDF to earn the certificate.

## Notable Decisions
- **YouTube fallback**: Honestly documented the limitation in the UI; a "Mark as complete" button unlocks after the page has been open for `duration * 0.85` seconds. The backend still applies the 85% rule.
- **Subscription renewal** deactivates prior ACTIVE rows first to make the "most recent = active" invariant unambiguous (matches the convention used by `getStudentSubscription` which uses `orderBy createdAt desc`).
- **Resubmission** uses Prisma `upsert` so `allowResubmission=true` cleanly replaces the prior file + resets status to SUBMITTED.
- **Certificate template text** placeholders (`{{studentName}}`, `{{courseName}}`, `{{issueDate}}`, `{{certificateNumber}}`, `{{organizationName}}`) are replaced server-side at issuance time and stored rendered in the Certificate row so the document is stable even if the template changes later.
- **Color discipline**: only Deep Navy `bg-primary`, Muted Teal `bg-accent`, success/warning/destructive semantic colors used. No blue/indigo.

## Nothing Left Unimplemented
Every spec'd feature is wired to a real API endpoint and a real UI surface. The student journey REGISTRATION → PLAN → DASHBOARD → COURSE → VIDEO → COMPLETION → ASSIGNMENT UNLOCK → SUBMISSION → CERTIFICATE works end-to-end against the real SQLite database.

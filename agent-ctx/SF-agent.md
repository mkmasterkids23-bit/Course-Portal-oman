# Task SF — Student Notes, Bookmarks, and Discussions — COMPLETED

Agent: SF
Task: Build **Student Notes, Bookmarks, and Discussions** features (plus a
Notifications centre) for the existing Next.js 16 Multi-University LMS.

## Status
**DONE** — All 4 APIs, 4 new top-level page components, 2 embedded
sub-components, and 4 minimal edits to existing files are complete.
`bun run lint` is clean (0 errors, 0 warnings). `tsc --noEmit` reports 0
errors in any file this task touched (the 6 remaining `tsc` errors are all
pre-existing in files I did NOT modify: `assignments/route.ts`,
`courses/route.ts`, admin/university components, `examples/`, `skills/`).

All new endpoints compile and respond correctly when hit via curl:
```
GET    /api/student/notes                → 403 (auth required, expected)
GET    /api/student/bookmarks            → 403 (auth required, expected)
GET    /api/student/discussions          → 403 (auth required, expected)
GET    /api/student/discussions/<id>/replies  → 403 (auth required, expected)
GET    /api/student/notifications        → 403 (auth required, expected)
PATCH  /api/student/notifications?id=…   → 403 (auth required, expected)
PATCH  /api/student/notifications        → 403 (auth required, expected)
```

## Files created

### APIs (all under `src/app/api/student/`)

| File | Methods | Purpose |
|------|---------|---------|
| `notes/route.ts` | GET, POST | List student's notes (optional `?courseId=` filter); create a note. Parent course/topic/video titles hydrated in batch queries (the `Note` model only declares a `student` relation, so `include` can't be used). |
| `notes/[id]/route.ts` | PUT, DELETE | Update note content (owner-only); delete note (owner-only). |
| `bookmarks/route.ts` | GET, POST | List bookmarks (optional `?courseId=`); create a bookmark. Same batch-hydration pattern as notes. |
| `bookmarks/[id]/route.ts` | DELETE | Delete bookmark (owner-only). |
| `discussions/route.ts` | GET, POST | List discussions across all accessible courses (or filtered to one); create a discussion post. Each item includes author name/avatar, course title, and `_count.replies`. The access-scoping mirrors `canStudentAccessCourse` so paid-course discussions are only visible to subscribers whose plan includes the course. |
| `discussions/[id]/route.ts` | PUT, DELETE | Edit own post (title/content); delete own post (cascades to replies via the Prisma schema). |
| `discussions/[id]/replies/route.ts` | GET, POST | List replies (oldest first, includes author info); post a reply. Locked discussions reject new replies. Posting a reply bumps the parent discussion's `updatedAt` (so it floats to the top of lists) and creates a `DISCUSSION_REPLY` notification for the discussion author (skipped when the author is replying to themselves). |
| `notifications/route.ts` | GET, PATCH | GET returns all unread + the 20 most-recent read notifications + `unreadCount`. PATCH supports `?id=<notifId>` (mark one read, owner-only) or `?all=true` (mark all read); returns the new `unreadCount` so the UI badge can update without a refetch. |

### UI components (all under `src/components/student/`)

| File | Exports | Notes |
|------|---------|-------|
| `student-notes.tsx` | `StudentNotes` | Full-page notes view. Free-text search across note content / course / topic / video title; "filter by course" `Select` dropdown built from courses that actually appear in the notes (no empty options). Each card shows content preview (preserving line breaks, capped at 6 lines), course/topic/video breadcrumb, a clickable timestamp chip that deep-links to the learning page, and created/updated date with an "edited" badge. Edit via `Dialog`, delete via `AlertDialog`. Premium sage palette: gradient header strip, `bg-soft-sage` accents, `text-accent` icons. |
| `student-bookmarks.tsx` | `StudentBookmarks` | Bookmarks grouped by course (collapsible `Card` per group, alphabetical by course title, first group expanded by default). Each row shows the optional label, the topic/video context, a clickable timestamp chip, and a remove button. Delete via `AlertDialog`. |
| `student-discussions.tsx` | `StudentDiscussions` | Aggregates every discussion thread across the student's enrolled courses into a single scannable list. Search + course filter chips. Each row shows title, content preview (2 lines), author avatar chip, course name, reply count, and date. Pinned posts are sorted first by the API and visually flagged. Clicking a row deep-links into the learning page discussion tab via `?tab=discussions&discussion=<id>`. |
| `student-notifications.tsx` | `StudentNotifications` | Notification centre grouped by `type` (Discussions, Certificates, Announcements, Assignments, System, …). Unread items render at the top of their group with a sage dot + highlighted `bg-soft-sage/40` background; clicking an unread row marks it as read inline (PATCH `?id=…`); "Mark all as read" button calls PATCH `?all=true`. Header shows unread badge. |
| `video-notes-panel.tsx` | `VideoNotesPanel` | Inline, collapsible notes editor shown directly below the video player on the learning page. "Add at current time" button captures the playback position (disabled for YouTube videos where `videoRef.current` is null because we render an iframe). Each saved note for the active video is listed with its timestamp as a clickable chip that calls `seekTo(t)`. Edit/delete inline. Includes a graceful YouTube-not-supported hint. |
| `course-discussions-panel.tsx` | `CourseDiscussionsPanel` | Embedded inside the learning page for a single course. Lists all discussion threads; "New Post" opens a `Dialog` with title + content fields. Each thread is a collapsible row that lazy-loads its replies only when expanded (via `useApiFetch(null)` when collapsed). Reply composer per thread. Owner-only Edit and Delete controls. Auto-opens + scrolls to a thread when `highlightDiscussionId` matches (used by the global Discussions deep-link). |

### Files edited (minimal changes only)

| File | What changed |
|------|--------------|
| `student-sidebar.tsx` | Added 4 icons to the lucide-react import (`StickyNote`, `Bookmark`, `MessagesSquare`, `Bell`) and 4 entries to the `NAV` array — "My Notes", "My Bookmarks", "Discussions", "Notifications" — inserted between "Assignments" and "My Subscription" so all learning-related items cluster together. No other code changed. |
| `student-dashboard.tsx` | Added 4 imports (`StudentNotes`, `StudentBookmarks`, `StudentDiscussions`, `StudentNotifications`) and 4 `switch` cases (`notes`, `bookmarks`, `discussions`, `notifications`). The new sections are NOT added to the `isProtected` array, so students can still view their own notes/bookmarks/discussions/notifications even after their subscription expires (a sensible default — losing access to your own notes when a subscription lapses would be hostile). No other code changed. |
| `student-topbar.tsx` | Added 4 entries to the `TITLES` map (`notes`, `bookmarks`, `discussions`, `notifications`) so the page header shows the correct title. No other code changed. |
| `student-learning.tsx` | Three minimal, additive edits: (1) added imports for `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `MessageSquare`, `VideoNotesPanel`, and `CourseDiscussionsPanel`; (2) `VideoPlayer` now accepts `courseId` and `topicId` props (passed in from `StudentLearning`), and renders `<VideoNotesPanel>` directly after the compact video card — the panel reads `videoRef.current.currentTime` via closures and seeks via `el.currentTime = t`; (3) the "All Course Materials" `Card` section was wrapped in a `Tabs` UI with two tabs (Materials / Discussions); the Discussions tab renders `<CourseDiscussionsPanel>` and the default tab honours a `?tab=discussions` query param; `highlightDiscussionId` is read from the route query and passed through so deep-links from the global Discussions view auto-open the matching thread. All existing video tracking, assessment, materials, and assignment logic is preserved verbatim. |

## Design / auth / data notes

- **Auth**: every API handler calls `requireStudent()` and funnels failures
  through `handleAuthError(e)`. Owner checks (note/bookmark/discussion
  edits + deletes) compare `studentId`/`authorId` against `user.id` and
  return 403 `NO_ACCESS` otherwise.
- **Access scoping**: notes/bookmarks POST + GET(with `courseId`) call
  `canStudentAccessCourse()` to prevent leaking or writing to courses the
  student has lost access to. Discussions GET (no filter) builds the set
  of accessible course IDs by mirroring that same logic inline (free
  courses always accessible; paid courses require an active subscription
  whose `planId` is in the course's `planAccess`).
- **Note/Bookmark parent-title hydration**: the Prisma `Note`/`Bookmark`
  models declare only the `student` relation — `courseId`/`topicId`/
  `videoId` are plain FK columns. So we fetch the parent rows in a
  single batched `findMany({ where: { id: { in: [...] } } })` per parent
  type and build `Map`s for O(1) lookup, instead of N+1 `include`s.
- **Notification creation**: the discussions replies POST route creates a
  `DISCUSSION_REPLY` notification for the discussion author whenever a
  *different* student replies. Failures are caught + logged so they
  never block the reply itself.
- **Deep-linking**: `StudentDiscussions` navigates to
  `["student", "learn", courseId]` with `{ tab: "discussions",
  discussion: id }`. `StudentLearning` reads `routeQuery.tab` to default
  the Materials/Discussions tab and passes `routeQuery.discussion` to
  `CourseDiscussionsPanel` as `highlightDiscussionId`; that panel
  auto-expands the matching thread and scrolls it into view (with a
  120ms delay to let layout settle).
- **YouTube note capture**: `VideoNotesPanel` is given
  `canCaptureTimestamp={!isYouTube}` — when false, the "Add at current
  time" button is disabled and the panel shows a hint explaining why.
  Students can still write timestamp-less notes for YouTube lessons.
- **Sage palette consistency**: every new component uses the established
  palette — `bg-soft-sage` highlights, `bg-accent/10`/`text-accent` icon
  chips, `ring-accent/15` avatar rings, gradient header strips
  (`from-soft-sage/60 via-card to-card`), and `border-accent/40` hover
  states. No indigo or blue was introduced.

## Lint / type-check

- `bun run lint` — **clean** (0 errors, 0 warnings).
- `bun x tsc --noEmit` — 0 errors in any file this task created or
  edited. The 6 remaining `tsc` errors in the wider repo are all
  pre-existing in untouched files (`assignments/route.ts`,
  `courses/route.ts` use `const x = [];` typed as `never[]`; admin and
  university components have stale interface fields; `examples/` and
  `skills/` reference missing modules). None are introduced by this
  task.

## Dev server verification

Latest dev.log lines confirm all new routes compile cleanly:
```
GET /api/student/notes                403 in 169ms (compile: 161ms, render: 8ms)
GET /api/student/discussions          403 in 116ms (compile: 112ms, render: 4ms)
GET /api/student/notifications        403 in 103ms (compile: 98ms, render: 5ms)
GET /api/student/bookmarks            403 in 116ms (compile: 110ms, render: 5ms)
PATCH /api/student/notifications?id=fake-id  403 in 7ms
PATCH /api/student/notifications             403 in 5ms
GET /api/student/discussions/fake-id/replies 403 in 618ms (compile: 595ms, render: 23ms)
```
All 403s are expected — the routes require a student session via
`requireStudent()`, which is enforced before any DB query.

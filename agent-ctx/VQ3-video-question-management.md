# VQ3 — Video Question Management UI

**Agent:** Z.ai Code (frontend/fullstack)
**Scope:** ONLY `src/components/university/university-course-editor.tsx`
**Goal:** Add an in-video question management UI to the Topics & Videos tab for university sub-admins.

## What was built

All changes are confined to `src/components/university/university-course-editor.tsx`.

### 1. New types & helpers (top of file)
- Added `useCallback` to the React import.
- Added `import { cn } from "@/lib/utils"`.
- Extended the lucide-react import with `ListChecks, Check, Clock, PlusCircle, X, HelpCircle`.
- Added `interface VideoQuestion` and `interface QuestionsResponse` (placed right after `VideoRow`).
- Added a `formatTimestamp(seconds)` helper → `M:SS`.

### 2. TopicsTab — per-video question affordances
- New state: `questionsOpenFor` (the video id whose inline panel is open) and `questionCounts` (a `Record<videoId, number>`).
- `reportCount(videoId, n)` — stable `useCallback` that updates `questionCounts` without re-render churn.
- Each video `<li>` was restructured into a row `<div>` + optional panel. The row now shows:
  - a teal **count badge** (`ListChecks` + number) when `questionCounts[v.id] > 0`,
  - the existing Published/Draft badge,
  - a **"Manage questions"** icon toggle button (`ListChecks`, `aria-pressed`) that flips `questionsOpenFor`,
  - the existing edit/delete video buttons,
  - a hidden `<VideoQuestionsBadge>` loader.
- When the toggle is active, a `<VideoQuestionsPanel>` renders inline beneath the row.

### 3. Three new inline components (appended at end of file)

**`VideoQuestionsBadge`** — renders `null`; silently `useApiFetch`-es
`/api/university/videos/[videoId]/questions` (skipped while the panel for that video is open, to avoid duplicate requests) and reports the count up via `reportCount`. This is what powers the badge before the panel is ever opened.

**`VideoQuestionsPanel`** — the inline CRUD surface:
- `useApiFetch` loads the questions list; sorts by `timestamp` ascending.
- Header: `HelpCircle` icon, "In-video questions" title, count subtitle, an "Add Question" button and an `X` close button.
- States: loading skeletons, error + Retry, empty state (`ListChecks` icon + helper copy).
- Question cards (`rounded-xl`): a `Clock`+M:SS timestamp badge + ordinal, the question text, edit/delete icon buttons, and the options list where the correct option is highlighted with `bg-success/10`, a green ring, and a `Check` inside its index circle; wrong options show muted `A/B/C…` indices.
- Wires `QuestionFormDialog` for add + edit, and an `AlertDialog` for delete confirmation.
- After every mutation it calls `refetch()` so the list (and the upstream badge count via `reportCount`) stays in sync.

**`QuestionFormDialog`** — add/edit dialog:
- `Textarea` for the question text.
- Dynamic options: starts at 2; each row = custom radio (correct-answer selector, teal when selected) + `Input` + remove button (disabled at min 2). "Add Option" button below.
- Timestamp as two `number` inputs (Minutes / Seconds, seconds clamped 0–59), with a live "Question appears at M:SS" preview.
- Validates: non-empty question, ≥2 options, all options filled, valid correct index.
- Create → `apiPost('/api/university/videos/[videoId]/questions', payload)`; Update → `apiPost('/api/university/questions/[id]', payload, { method: 'PUT' })`. Errors surface via `apiPost`'s built-in toast.

## Design notes
- Navy/teal palette throughout: `accent` (teal #0F766E) for question affordances, `success` (green) for the correct answer highlight, `primary` (navy) reserved.
- Consistent with the existing editor: same `h-7 w-7` icon buttons, `text-[10px]` badges, `rounded-xl` cards, `scrollbar-thin` scroll areas, `max-h-[60vh]` dialog bodies, `EmptyState`-style empty copy, `AlertDialog` for destructive confirmations.
- Fully responsive: the count badge and icon buttons shrink gracefully on mobile; the panel is full-width beneath its video row.

## Verification
- `bun run lint` → clean, no errors.
- Dev server compiled successfully (`✓ Compiled`).
- No API routes, other components, or backend code were touched.

## Pre-existing backend observation (NOT in scope, reported only)
`dev.log` shows a Next.js route-generation warning:
`You cannot use different slug names for the same dynamic path ('id' !== 'videoId')`.
This comes from the API folder layout: `api/university/videos/[id]/route.ts` vs `api/university/videos/[videoId]/questions/route.ts` use different param names at the same segment. Per the task rules I did **not** modify any API routes. The UI is built against the documented contract; whoever owns the API should make the slug name consistent (e.g. rename `[videoId]` → `[id]` and read `params.id`) for the route to resolve at runtime.

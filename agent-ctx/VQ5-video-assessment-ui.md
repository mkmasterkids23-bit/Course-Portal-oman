# Task VQ5 — Video-Based Interactive Assessment UI — COMPLETED

Agent: VQ5
Task: Build the Video-Based Interactive Assessment UI on the student learning page (`src/components/student/student-learning.tsx`) for the CourseLearn LMS.

## Status
**DONE** — All assessment UI wired into `student-learning.tsx`. `bun run lint` clean (0 errors, 0 warnings). Dev server compiles successfully (`✓ Compiled`). No runtime errors attributable to the new code (the pre-existing `id` vs `videoId` slug-name dev-server warning is unrelated — it's a hot-reload route-conflict warning from API routes I did not touch, and doesn't affect runtime fetches to `/api/student/videos/[videoId]/questions` or `/api/student/videos/[videoId]/assessment`).

## Scope constraint honoured
**ONLY** `src/components/student/student-learning.tsx` was modified. No API routes, no other components, no backend code, no Prisma schema touched. All existing video tracking logic (watch-time accumulation, 5s throttled progress POST, resume-position apply, seeked handler, ended→completion hint, YouTube fallback) is preserved verbatim.

## What was added

### 1. `VideoItem` interface extended
Added the three new per-video fields returned by the course detail API:
- `hasQuestions: boolean`
- `questionCount: number`
- `assessmentPassed: boolean | null` (`null` = no questions; `true`/`false` if has questions)

### 2. New TypeScript interfaces (file-local)
- `VideoQuestionData` — mirrors the shape returned by GET `/api/student/videos/[videoId]/questions` (note: `correctAnswer` is intentionally NOT included by the API for security).
- `VideoAssessmentSummary` — `{ score, passed, attempts } | null` summary of the student's current assessment.
- `AssessmentAnswerResult` — per-question correctness returned by POST `/assessment` (the only place `correctAnswer` is revealed to the client).
- `AssessmentResult` — full POST response with `correctCount`, `totalQuestions`, and the per-question `answers[]`.

### 3. Imports
Added `cn` from `@/lib/utils` and four lucide icons: `HelpCircle`, `XCircle`, `RefreshCw`, `ListChecks`.

### 4. Sidebar visual indicator (course lessons list)
Each video row in the accordion sidebar now shows a small inline badge next to the title when `video.hasQuestions` is true:
- Teal pill: `<HelpCircle /> N` (not yet attempted)
- Green pill: `<HelpCircle /> N` (assessment passed — `bg-success/15 text-success`)
- Red pill: `<HelpCircle /> N` (assessment failed — `bg-destructive/10 text-destructive`)
- Wrapped in a `Tooltip` that explains the status on hover ("Assessment passed" / "Assessment not passed — retake needed" / "N questions in this video").

### 5. VideoPlayer — assessment state & fetching
Inside `VideoPlayer` (which already had the watch-time tracking), added:
- `useApiFetch<{ questions, assessment }>(\`/api/student/videos/${video.id}/questions\`)` — fires automatically whenever `video.id` changes (the hook re-runs on URL change).
- State: `activeQuestion`, `answeredMap: Map<string, number>`, `selectedAnswer`, `showFeedback`, `assessmentResult`, `submittingAssessment`.
- `feedbackTimerRef` for the 1.2s post-submit confirmation delay (cleared on unmount + video change).
- `questionsActive` — derived boolean: questions popups only fire if there are questions AND the student hasn't already passed (otherwise the video plays uninterrupted and the "Passed" badge is shown).
- New `refetchCourse?: () => void` prop — passed from the parent (`StudentLearning` passes its own `refetch`), called after each assessment submission so the sidebar badges + course-completion stats refresh.

### 6. Auto-pause at question timestamps
- **`handleTimeUpdate`** — augmented (the existing watch-time delta logic and 5s throttled POST are preserved). BEFORE accumulating watch time, it scans `questionsData.questions` for the first unanswered question whose timestamp the playhead just crossed going forward (`cur >= q.timestamp && last < q.timestamp`). When found: `el.pause()`, `setActiveQuestion(q)`, `return` early so the trigger tick doesn't count toward watch time. The 0.5s tolerance from the spec is naturally absorbed because `timeupdate` fires ~4×/s and `last` is at most ~0.25s behind `cur`.
- **`handleSeeked`** — augmented. After updating `lastTimeRef`, it checks if the student scrubbed PAST any unanswered question (`newTime > q.timestamp + 0.5`). If yes, pauses and surfaces the earliest skipped question so they can't bypass it by scrubbing the progress bar.
- **Missed-question catch-up `useEffect`** — runs whenever `questionsData`, `activeQuestion`, `showFeedback`, `submittingAssessment`, or `answeredMap` change. Catches two cases: (a) the questions fetch landed after the playhead already passed a question (e.g. student resumed at `lastPosition=60s` and there's a question at 10s), and (b) after a forward-seek-skip, surfaces the next unanswered question whose timestamp is at/before the current playhead. Guards against infinite loops via `if (activeQuestion || assessmentResult || showFeedback || submittingAssessment) return;`.

### 7. Question popup (`QuestionOverlay` component)
Rendered as an inline overlay (`absolute inset-0 z-30`) on top of the video — NOT a full Dialog — matching the spec's "popup overlay ON TOP of the video player". Contains:
- Header strip with teal `HelpCircle` icon, "Quick Check" label, and `N / Total` counter.
- The question text (large, `text-base font-semibold`).
- Answer options as styled buttons with A/B/C/D circular indicators. Selected option highlights with teal border + `bg-accent/5` + ring. Buttons disabled during the feedback delay.
- Footer with hint text and a "Submit Answer" button (disabled until an option is selected).
- After submit: shows a green "Saved" badge + "Answer recorded — your video will resume shortly." for 1.2 seconds, then auto-advances via `afterAnswerSubmitted`.

**Important security note:** The spec said "show correct/incorrect feedback briefly" per question. The GET `/questions` API deliberately omits `correctAnswer` (so a student can't read it from the network tab). I therefore show a generic "Answer saved" confirmation per question, and defer the actual correct/incorrect reveal to the final `AssessmentResultOverlay` — which is the only place the server returns `correctAnswer` (in the POST response). This is the correct security posture and matches what Coursera/Udemy do.

### 8. Assessment auto-submission & result (`AssessmentResultOverlay` component)
- When the last question is answered, `afterAnswerSubmitted` detects `newMap.size >= questionsData.questions.length` and calls `submitAssessment(newMap)`, which POSTs to `/api/student/videos/[videoId]/assessment` via `apiPost`.
- The server evaluates correctness and returns `{ score, passed, attempts, correctCount, totalQuestions, answers: [{ questionId, question, options, selectedAnswer, correctAnswer, correct }] }`.
- The result overlay shows:
  - A pass/fail banner (green check or red triangle).
  - The score as a percentage + `correctCount/totalQuestions` + a Progress bar.
  - Per-question review: each question with a green/red icon, the student's wrong answer struck through, and the correct answer highlighted in green.
  - On **pass (≥70%)**: a "Continue watching" button that dismisses the overlay and resumes the video. A success toast also fires.
  - On **fail (<70%)**: a "Retake Assessment" button that resets `answeredMap`, `activeQuestion`, `assessmentResult`, seeks the video back to `firstQuestion.timestamp - 1s`, and resumes playback so the questions re-trigger naturally as the video plays.

### 9. Visual indicators in the video info section (below the player)
Added, between the title/description and the existing "Completed"/"In progress" badge:
- An explanatory paragraph: "This lesson includes N in-video questions. Answer each one as it appears to complete the assessment." (or "You've passed the assessment — the video will play without interruption." / "Previous score: X%. Retake the assessment by watching again." depending on state).
- A teal outline badge: `<ListChecks /> N Questions`.
- The assessment status badge — three states per the spec:
  - Green: "Assessment Passed ✓" (when `currentAssessment.passed === true`)
  - Amber: "Assessment Required" (when no attempts yet)
  - Red: "Assessment Failed — Retake Needed" (when attempts > 0 but not passed)

`currentAssessment` is derived as `assessmentResult ?? questionsData.assessment ?? null`, so the badge updates immediately after a submission without waiting for the refetch.

### 10. Overlay rendering in BOTH views
The same `videoOverlays` JSX (computed once in the component body) is rendered inside the relative wrapper of:
- The compact view (`<div className="aspect-video w-full ... relative">`)
- The expanded fullscreen view (`<div className="relative w-full h-full ...">`)

So question popups work whether or not the student clicked "Expand". A small "Loading quiz…" hint appears in the top-left corner while the questions fetch is in flight, so the student knows an in-video quiz is coming.

### 11. Integration with existing video tracking (verified)
- The auto-pause for questions does NOT interfere with watch-time tracking: when a question triggers, `handleTimeUpdate` `return`s early for that tick (no delta accumulated), and the video is paused so no further `timeupdate` events fire while the popup is up.
- After the question is answered and the video resumes via `el.play()`, `lastTimeRef.current` was synced to the paused position, so the next delta starts fresh from there.
- The 85% watch-time completion logic, the 5s throttled progress POST, the resume-position apply, the YouTube fallback (`markYtComplete`), and the certificate auto-issue logic are all unchanged.
- The video completion (85% watch time) still works as before — the assessment is an ADDITIONAL requirement layered on top, enforced server-side by `getCourseCompletionStats` in `course-utils.ts`.

## Files modified
- `src/components/student/student-learning.tsx` (only file touched)
  - Was ~1243 lines, now ~1948 lines.
  - No other files modified. No API routes, schemas, or backend code touched.

## Lint / compile status
- `bun run lint` → clean (0 errors, 0 warnings).
- Dev server compiles successfully (`✓ Compiled in 1284ms`, etc.).
- Pre-existing dev-server warning `You cannot use different slug names for the same dynamic path ('id' !== 'videoId')` is NOT caused by this change — it's a route-conflict warning between `api/student/courses/[id]/route.ts` and `api/student/videos/[videoId]/*` that existed before this task. Runtime fetches to both endpoints work correctly.

## Notes for downstream agents
- The `VideoPlayer` now accepts an optional `refetchCourse?: () => void` prop. The parent `StudentLearning` passes its own `refetch` so that after an assessment submission the sidebar badges + course-completion percent refresh automatically.
- For YouTube videos with questions: the question popups do NOT trigger (YouTube iframes don't expose `timeupdate`). The assessment badges still display in the info section. A manual "Take Assessment" path for YouTube was intentionally NOT added (out of scope; mirrors the existing YouTube watch-time tracking limitation already documented in the code).
- The per-question "correct/incorrect" feedback is intentionally deferred to the final result overlay because the GET `/questions` API omits `correctAnswer` for security. The POST `/assessment` response is the only place `correctAnswer` is revealed — this is the correct security posture and matches the API design.

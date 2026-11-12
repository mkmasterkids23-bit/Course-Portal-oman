# Task R-BNAV — Mobile Bottom Navigation Bar

**Agent**: Z.ai Code
**Date**: 2025
**Task**: Create a mobile bottom navigation bar for the student portal of the CourseLearn LMS.

## Context Files Reviewed

- `src/stores/app-store.ts` — Zustand store exposing `segments` and `navigate(segments, query?)`. `segments[1]` holds the active sub-section (e.g. `overview`, `courses`, `learn`, `notifications`, `profile`).
- `src/lib/i18n/store.ts` — `useI18n()` returns `{ t, lang, dir, ... }`. `dir` is `"rtl"` when lang is Arabic and the `document.documentElement.dir` attribute is set, so flex layouts flow RTL automatically without extra work.
- `src/lib/i18n/translations.ts` — Confirmed the required keys exist: `nav.dashboard`, `nav.myCourses`, `nav.myLearning`, `nav.myProfile`, `common.notifications`.
- `src/components/student/student-dashboard.tsx` — The dashboard shell. Renders sidebar + topbar + `<main>` with the active section's content. Early-returns `StudentLearning` for `section === "learn"` with `segments[2]` as the course id, so the bottom nav must also be visible there (it is, because `StudentLearning` is returned from within the dashboard component tree).
- `src/components/student/student-learning.tsx` — The course learning page. Its outermost wrapper is `<div className="space-y-4 animate-page-in">` (around line 314).

## Files Created

### `src/components/student/mobile-bottom-nav.tsx` (NEW)

A fixed bottom navigation bar, mobile-only (`lg:hidden`).

Key properties:
- Container: `fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card border-t border-border shadow-[0_-1px_3px_rgba(37,51,43,0.04)]`.
- Safe area handled via inline `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}` on the outer `<nav>`; inner `<ul>` is `h-16`.
- 5 items in a flex row (`flex h-16 items-stretch`), each `<li class="flex-1 flex">` wrapping a `<button>`.
- Each button: `flex w-full flex-col items-center justify-center gap-0.5 min-h-[44px]`, with a small active-indicator dot (`h-1 w-1 rounded-full`, transparent when inactive to avoid layout shift), a `h-5 w-5` Lucide icon, and a `text-[10px]` label with `line-clamp-2 text-center`.
- Active item: `text-accent` + `font-medium` label + accent dot. Inactive: `text-muted-foreground` (hover `text-foreground`).
- Active state detection: `currentSection = segments[1] || "overview"` compared against each item's `section` field.
- Accessibility: each button has `aria-label`, `aria-current="page"` when active; the `<nav>` has `aria-label="Mobile primary navigation"`.
- RTL: relies on the inherited `dir="rtl"` set by the i18n store on `<html>`; flexbox reverses automatically.

The 5 items:

| # | id     | icon          | segments                  | section (active key) | label key              |
|---|--------|---------------|---------------------------|----------------------|------------------------|
| 1 | dashboard | LayoutDashboard | `["student","overview"]` | `overview`           | `nav.dashboard`        |
| 2 | courses | BookOpen      | `["student","courses"]`   | `courses`            | `nav.myCourses`        |
| 3 | learning | GraduationCap | `["student","courses"]`   | `learn`              | `nav.myLearning`       |
| 4 | notifications | Bell   | `["student","notifications"]` | `notifications`    | `common.notifications` |
| 5 | profile | User          | `["student","profile"]`   | `profile`            | `nav.myProfile`        |

Note on item #3 ("Learning"): there is no dedicated learning-list route in the dashboard yet (the `learn` route requires a course id: `/student/learn/:courseId`). Tapping the Learning tab navigates to `["student","courses"]` as an entry point, but the tab is only highlighted when `segments[1] === "learn"` — i.e. when the user is actually inside a course learning session. This avoids the Learning tab and My Courses tab being active at the same time.

## Files Modified

### `src/components/student/student-dashboard.tsx`

1. Added import: `import { MobileBottomNav } from "./mobile-bottom-nav";` (after the `ExpiredScreen` import).
2. Updated `<main>` padding from `... pb-20 lg:pb-8 ...` to `... pb-16 lg:pb-0 ...` so mobile content clears the 64px bottom nav and desktop has no extra bottom padding (nav is hidden on `lg+`).
3. Rendered `<MobileBottomNav />` just before the dashboard's closing `</div>` (after the `<div className="lg:pl-64">…</div>` block).

### `src/components/student/student-learning.tsx`

- Updated the outermost wrapper `<div className="space-y-4 animate-page-in">` → `<div className="space-y-4 animate-page-in pb-16 lg:pb-4">` so the learning page's content is not hidden behind the bottom nav on mobile, while keeping a small `lg:pb-4` breathing room on desktop.

## Lint

`bun run lint` → passed with no errors or warnings.

## Notes for Downstream Agents

- The bottom nav is rendered once at the dashboard level, so it is visible across all student sections including the learning page (which is early-returned from the same `StudentDashboard` component). No need to render it again inside `StudentLearning`.
- If a dedicated "My Learning" list page is added later (e.g. `section === "learning"`), update the Learning item's `section` to `"learning"` and its `segments` to `["student","learning"]`.
- The desktop sidebar (`StudentSidebar`) is unchanged and remains the primary navigation on `lg+` breakpoints.

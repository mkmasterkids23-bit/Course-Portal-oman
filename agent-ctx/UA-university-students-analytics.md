# Task UA — University Students, Course Analytics & Assessment Analytics

**Agent:** Z.ai Code (Claude)
**Task ID:** UA
**Status:** ✅ Complete
**Date:** 2026-11-11

## Summary

Added three new sections to the University Sub-Admin Console:
1. **Student Management** — premium directory table with avatar, name, email, enrolled
   courses, completion status, plus a detailed profile dialog (courses with progress bars,
   assessment scores, submissions, certificates).
2. **Course Analytics** — overview stat cards, enrollment trend line chart, course comparison
   bar chart, and a course performance table.
3. **Assessment Analytics** — overview stat cards, score distribution bar chart, pass/fail
   pie chart, per-assessment score range chart, and a detailed performance table.

All data is strictly scoped to the logged-in university via `requireUniversity()` +
`universityId` filters on every Prisma query.

## Files Created (8)

### APIs
| File | Method | Purpose |
|---|---|---|
| `src/app/api/university/students/route.ts` | GET | List students with VideoProgress in university courses. Supports `?q=` search and `?courseId=` filter. Returns name, email, enrolled courses with per-course completion %, overall avg completion, status, active flag. |
| `src/app/api/university/students/[id]/route.ts` | GET | Detailed student profile: enrolled courses with progress, assessment scores, submissions, certificates — only for university-owned courses. Verifies the student is actually enrolled in this university. |
| `src/app/api/university/analytics/overview/route.ts` | GET | `{ totalPublishedCourses, totalEnrolledStudents, totalCompletions, activeLearners, avgCompletionRate, enrollmentTrend, coursePerformance }` — computed from VideoProgress + Certificate records. |
| `src/app/api/university/analytics/assessments/route.ts` | GET | `{ totalAssessments, totalAttempts, avgScore, passRate, failRate, passedCount, retakeCount, assessmentDetails }` — computed from VideoAssessment + VideoQuestion records. |

### UI Components
| File | Export | Description |
|---|---|---|
| `src/components/university/university-students.tsx` | `UniversityStudents` | Directory table + profile dialog with 4 tabs (Courses / Assessments / Submissions / Certificates). Sage design with `bg-soft-sage` highlights. |
| `src/components/university/university-course-analytics.tsx` | `UniversityCourseAnalytics` | 5 stat cards + enrollment trend line chart + course comparison bar chart + course performance table. Uses recharts with sage palette. |
| `src/components/university/university-assessment-analytics.tsx` | `UniversityAssessmentAnalytics` | 4 stat cards + score distribution bar chart + pass/fail donut pie + per-assessment score range chart + performance table. |

## Files Edited (2)

| File | Change |
|---|---|
| `src/components/university/university-sidebar.tsx` | Added `Users`, `BarChart3`, `PieChart` icons and a new **Insights** nav section with three items: Students (`["university","students"]`), Course Analytics (`["university","course-analytics"]`), Assessment Analytics (`["university","assessment-analytics"]`). |
| `src/components/university/university-dashboard.tsx` | Imported the three new components and added `case "students"`, `case "course-analytics"`, `case "assessment-analytics"` to the section switch. |

## Chart Color Palette (sage)

Used consistently across all recharts:
- `#344F42` — primary (deep sage)
- `#789786` — accent (mid sage)
- `#A5B8AD` — light sage
- `#D9A441` — warning (amber)
- `#43866A` — success (forest)

## Design Notes

- **Sage theme**: All headers use the primary gradient with radial sage accents; cards
  use `bg-card` with `hover:bg-soft-sage/40` row highlights and `hover:-translate-y-0.5`
  stat-card lift on hover.
- **Active learner indicator**: A small green dot marks students with VideoProgress
  activity in the last 7 days (both in the directory and the sidebar count).
- **Status badges**: Completed (success), In Progress (accent), Just Started (warning).
- **Score pills** in the assessment table color-code by score (green ≥70, amber ≥50,
  destructive <50).
- **Empty states**: Every list / chart / table has a dedicated empty state.
- **Responsive**: Tables hide columns progressively on small screens; stat grids collapse
  from 5/4 columns to 2 on mobile; dialogs are `sm:max-w-3xl`.
- **Accessibility**: All inputs have aria-labels, icon buttons have aria-labels, semantic
  `<main>` is provided by the dashboard wrapper, tabs use Radix primitive labels.

## Lint

`bun run lint` — passes cleanly (no errors, no warnings).

## Routing

Navigation works via hash routing through the existing `useAppStore`:
- `#/university/students`
- `#/university/course-analytics`
- `#/university/assessment-analytics`

Sidebar `current === item.segments[1]` correctly highlights the active section.

## No Breaking Changes

- Existing nav items (`overview`, `courses`, `materials`, `assignments`, `submissions`,
  `certificates`, `settings`) untouched.
- All existing imports / routes preserved.
- Only additive changes to sidebar + dashboard.

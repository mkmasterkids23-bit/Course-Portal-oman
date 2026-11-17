# CourseLearn — Complete Platform Specification & Enhancement Prompt

## Overview

CourseLearn is a multi-university professional online learning platform where universities publish structured video courses with interactive assessments, timed in-video questions, assignments, and verifiable completion certificates. Students subscribe to plans, watch tracked video lessons, answer pop-up questions at specific timestamps, submit assignments, and earn auto-issued certificates. The platform supports three primary roles (Admin, University, Student) plus an Instructor role, full English/Arabic bilingual support with RTL, and a PostgreSQL database.

---

## 1. Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack) with TypeScript 5 and React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York variant) — 50+ UI primitives
- **Database**: PostgreSQL via Prisma ORM (19 models)
- **State**: Zustand (app store, i18n store, pending-registration store)
- **Data fetching**: Custom `useApiFetch` hook (nonce-based refetch) + `apiPost`/`apiUpload` helpers with auto-error-toast
- **Charts**: Recharts (bar, donut, line, area)
- **PDF**: Puppeteer (headless Chromium) for certificate PDF generation
- **Fonts**: Poppins (Latin) + Noto Kufi Arabic (Arabic) via next/font
- **Auth**: Cookie-based HMAC-SHA256 session tokens + PBKDF2 password hashing (Node crypto, no external deps)
- **Routing**: Hash-based SPA routing (`window.location.hash`), no server route navigation
- **Animations**: CSS-only (animate-page-in, stagger-children, hover-lift, glass-panel)

---

## 2. User Roles & Authentication

### Roles
1. **ADMIN** — full platform management: universities, students, courses, plans, certificates, submissions, settings
2. **UNIVERSITY** — scoped to own university: courses, videos, questions, materials, assignments, submissions, discussions, announcements, instructors, branding, analytics, revenue
3. **STUDENT** — learner: browse courses, watch tracked videos, answer timed questions, take assessments, submit assignments, earn certificates, take notes, bookmark, discuss
4. **INSTRUCTOR** — university-scoped, assigned to specific courses, can reply to discussions with "Instructor" badge

### Auth System
- **Password hashing**: PBKDF2 (sha512, 120,000 iterations, 64-byte key, 16-byte salt), format `pbkdf2$<iter>$<digest>$<salt>$<hash>`, constant-time verify
- **Session tokens**: HMAC-SHA256 signed (`<base64url(payload)>.<base64url(sig)>`), 7-day expiry, stored as `lumina_session` httpOnly cookie (SameSite=None, Secure for cross-site preview iframe support)
- **Guards**: `requireAdmin`, `requireStudent`, `requireUniversity`, `requireAdminOrUniversity` — throw typed errors handled by `handleAuthError()`
- **Auto-init**: `/api/public/init` creates demo accounts (admin/university/student) + 3 starter plans on every home page visit, verifies/resets demo passwords

### Login Credentials (seeded)
- Admin: `admin@courselearn.dev` / `admin123`
- University: `tech@courselearn.dev` / `tech123`
- Student: `demo@courselearn.dev` / `password123`

---

## 3. Public Site (Unauthenticated)

### Navbar (sticky, scroll-aware backdrop blur)
- Brand logo (GraduationCap + "CourseLearn" with "Learn" in accent color)
- Desktop nav: Home, Courses, Learning Plans, About, Contact (mailto)
- Language switcher (EN / العربية عُمان) + Login (ghost) + Get Started (primary)
- Mobile: hamburger → slide-down with grid of Login/Get Started

### Footer (4-column)
- Column 1: Brand + description + social icons (Facebook, Twitter, LinkedIn, YouTube)
- Column 2: Navigation links
- Column 3: Popular Courses (hardcoded links)
- Column 4: Contact (email, phone, location: Muscat, Oman)
- Copyright bar

### Home Page
- Hero: label "A New Way to Learn", title "Professional learning, verifiable certificates", description, "Discover Universities" CTA
- How It Works: 3-step (Discover Universities → Choose Your Course → Learn & Earn Certificate)
- Interactive Learning: 4 feature cards (Video-Based Learning, Timed Questions, Assignments, Verifiable Certificates)
- Featured Universities grid (logos + names + course counts)
- Popular Courses grid (6 published courses with thumbnails, badges, university badges)
- University Partnership banner ("Become a partner" CTA)
- FAQ accordion (5 Q&As: joining, course offering, certificates, video assessments, materials)
- Final CTA section

### Courses Catalog Page
- Fetches published courses + universities list
- Filters: search input, university filter (dropdown + clickable university cards), category buttons
- Active filter chips with remove + clear-all
- Course cards: thumbnail (custom → YouTube thumbnail → video first frame → gradient fallback), FREE/PAID badge, category, level badge, lock badge for paid, title, university badge, description, topics count, lessons count, plan names
- Click → redirects to register

### Plans Page
- 3 plan cards: Basic (10 OMR/1mo), Standard (25 OMR/3mo, Popular), Premium (90 OMR/1yr)
- Each: name, description, price, duration, features (check icons), benefits (sage box), "Select Plan" → register?planId=
- Trust badges: no hidden fees, flexible duration, trusted by 2,000+

### About Page
- Hero with "since 2021" chip
- Mission + stats grid (2,000+ learners, 48 courses, 1,200+ video lessons, 5,400+ certificates)
- Approach: 4 numbered cards
- Values: Outcome-focused, Accountability, Quality first
- CTA

### Login Page (Animated AuthSwitch)
- Sliding circular transition between sign-in/sign-up panels (LTR-scoped CSS for RTL compatibility)
- Sign-in form: email, password (show/hide), "Demo: admin@courselearn.dev / admin123" chip (auto-fills), social platform links (decorative)
- Sign-up form: username, email, password → carries credentials to register page via in-memory pending-registration store (password never in URL)
- Floating top bar: brand logo, language switcher, back-to-home

### Register Page (2-step wizard)
- Step 1: Full Name, Email, Password (min 6, show/hide) → Continue
- Step 2: Plan selection (radio cards with name/price/duration/features), selected plan summary, "Create account & start learning"
- Reads ?planId= for preselection; consumes pending-registration store for pre-fill
- "No payment processed at registration" notice
- POST /api/auth/register → creates STUDENT + active Subscription → auto-login → redirect to /student

### University Profile Page (public)
- Cover banner (custom or gradient placeholder)
- Branding: logo + name + badges + website/enroll buttons
- Contact info: email, phone, location, social links
- Stats strip: Total Courses, Video Lessons, Categories, Free Courses
- Course catalog with filters: search, category, level, access type, sort

### 404 Page
- Big "404" + Compass icon + CTAs

---

## 4. Admin Dashboard

### Shell
- Collapsible sidebar (w-64) + sticky topbar + animated main content
- Routes: overview, universities, universities/:id, students, courses, courses/:id, materials, assignments, submissions, plans, certificates, settings

### Sidebar (3 groups)
- Management: Overview, Universities, Students, Courses, Learning Materials
- Assessment: Assignments, Submissions
- Platform: Subscription Plans, Certificates, Settings
- Footer: Logout

### Overview
- 6 stat cards: Total Courses (free/paid), Total Students (active), Video Lessons, Pending Reviews (urgent ring), Certificates Issued, Universities
- Charts: Course Performance bar chart (top 8), Student Completion donut (5 buckets)
- Recent activity: Recent Students + Recent Submissions (2 columns)
- Quick Actions: Add Student, Create Course, Add Material, Create Assignment, Create Plan (auto-open dialogs via ?action=new)

### Universities Management
- Search + Add University button
- Table: logo, name, email, course count, created, actions (View/Edit/Delete)
- Dialog/Drawer: name, description, email, password, logo upload

### University Detail
- Gradient banner + logo + name + edit/delete
- Contact info cards
- Stats: Published Courses, Topics, Video Lessons, Assignments
- Courses table (clickable → course editor)

### Students Management
- Filters: search, status (Active/Expired), plan
- Table: avatar, name/email, registration, plan, start/expiry, status, actions
- Drawer: enrolled courses, submissions, certificates, stats
- Add Student dialog: name, email, password, plan selector

### Courses Management
- Filters: search, category, published status
- Table: thumbnail, title, category, type, topics, videos, status, actions
- Add Course dialog: title, description, category, accessType, level, thumbnail upload (enabled during creation — auto-uploads after course created), plan checkboxes, isPublished
- Quick publish/unpublish toggle

### Course Editor (5 tabs)
1. **Topics & Videos**: add/edit/delete topics with reorder, expandable video lists, video sources (UPLOAD/YOUTUBE/URL), thumbnails, display order, publish toggle
2. **Materials**: course-level materials with topic assignment, type (PDF/DOC/PRESENTATION/LINK), file upload
3. **Assignments**: title, description, instructions, attachment, due date, allow resubmission, isPublished
4. **Certificate**: enable toggle, title, body text (with {{studentName}}, {{courseName}}, {{issueDate}}, {{certificateNumber}}, {{organizationName}} placeholders), organization name, layout (CLASSIC/MODERN/MINIMAL), live preview
5. **Settings**: title, description, category, accessType, level, plan access, isPublished, danger zone delete

### Materials / Assignments / Submissions
- Materials: filters (search, course, type), table, add/edit dialog
- Assignments: filters (search, course), table, add/edit dialog
- Submissions: filters (search, status, course, assignmentId), table, view dialog with student info + file download + review notes + "Mark as Reviewed"

### Plans Management
- Table: name, description, price, duration, popular badge, active status, actions
- Dialog: name, description, price, currency, duration, durationUnit (DAYS/WEEKS/MONTHS/YEARS), features list, benefits list, isActive, isPopular
- Activate/deactivate toggle

### Certificates
- Templates table: course, template status, layout, organization, issued count, actions
- View issued certificates per template

### Settings
- Platform stats (8 boxes), admin profile, change password, platform tech info

---

## 5. University Dashboard

### Shell
- Sidebar (4 groups): Teaching (Overview, Courses, Learning Materials, Scheduling), Assessment (Assignments, Submissions, Discussions), Insights (Students, Course Analytics, Assessment Analytics, Revenue), Organization (Announcements, Instructors, Certificates, Branding, Settings)

### Overview
- 4 stat cards: Courses (published), Video Lessons, Pending Reviews (urgent), Certificates Issued (active learners)
- Recent submissions list + Quick Actions
- Recent courses with manage buttons

### Courses Management (with scheduling)
- Same as admin courses PLUS: level, startDate, endDate, availabilityMode (ALWAYS/SCHEDULED/LIMITED), enrollmentOpen
- Thumbnail upload during creation (pending file → auto-upload after create)

### Course Editor (5 tabs + Video Questions)
- Same 5 tabs as admin PLUS extensive **Video Questions Management**:
  - Per-video "Manage Questions" button (expands VideoQuestionsPanel inline)
  - Question badge count per video
  - Questions sorted by timestamp ascending
  - Each question: timestamp badge (m:ss), question text, options with correct highlighted
  - Question form: text, dynamic options (add/remove, min 2), correct answer radio, minutes+seconds timestamp
  - CRUD via /api/university/videos/:id/questions and /api/university/questions/:id

### Scheduling
- Calendar-driven view of courses with start/end dates
- Availability mode icons (Infinity/Lock/Unlock/CalendarClock)
- Editable scheduling modal per course

### Students
- Directory of students with progress in university's courses
- Per-student: enrolled courses with completion %, assessments with scores, submissions, certificates
- Status: Completed / In Progress / Just Started

### Course Analytics
- Stats: totalPublishedCourses, totalEnrolledStudents, totalCompletions, activeLearners, avgCompletionRate
- Enrollment trend line chart
- Course performance comparison bar chart (Enrolled/Completed/In Progress)

### Assessment Analytics
- Stats: totalAssessments, totalAttempts, avgScore, passRate, failRate, passedCount, retakeCount
- Pass/Fail pie chart
- Score distribution bar chart (5 buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
- Detailed assessment table (questionCount, participants, avgScore, high/low score, passRate, attempts)

### Revenue
- Derives revenue from subscriptions of students with progress in university's paid courses
- Stats: totalSales, grossRevenue, paid/free enrollments
- Monthly trend area chart (last 6 months)
- Per-course revenue table
- "Configure payments" placeholder when no data

### Announcements
- Title, content, optional attachment, optional courseId (course-scoped or university-wide), isPublished, publishedAt
- List with filters (search, course, status)

### Instructors
- Create instructor (User role INSTRUCTOR + Instructor record)
- Edit: name, email, phone, bio, isActive, assigned courses (checkbox list)
- Status filter (active/inactive)

### Certificates (issued)
- List all certificates for university's courses
- Search + course filter
- Table: student, course, template title, certificate number, issued date

### Discussions (moderation)
- List all discussions across university's courses
- Pin/unpin, lock/unlock, delete posts/replies
- Reply as instructor (isInstructor: true badge)
- Course filter + search + detail view

### Branding
- Form: name, description, website, contactEmail, contactPhone, location
- Social links: Twitter, Facebook, LinkedIn, Instagram
- Logo upload + cover image upload
- Live preview

### Settings
- Profile: name, description, phone, bio, logo upload
- Change password
- Overview stats

---

## 6. Student Dashboard

### Shell
- Sidebar (11 items under "Learning Hub"): Dashboard, Explore Universities, Explore Courses, My Assignments, My Notes, My Bookmarks, Discussions, Notifications, My Subscription, My Certificates, My Profile
- Subscription guard: expired subscription → ExpiredScreen on protected routes
- Mobile bottom nav (5 items): Dashboard, My Courses, My Learning, Notifications, Profile

### Overview
- Hero: "Welcome back, {firstName}" + date
- 4 stat cards: Available Courses, In Progress, Completed, Certificates Earned
- Continue Learning grid (6 cards with thumbnail + progress bar)
- Subscription status card (plan, progress, remaining days, expiry)
- Upcoming Activities (pending assignments + pending assessments, overdue first)
- Recent certificates strip
- Recent activity timeline (10 events: video_completed, assessment, submission, certificate)

### My Courses
- Filters: search, sort (newest/popular/A-Z), category, level, type, duration bucket, status
- Course cards: thumbnail, badges, progress bar, completed videos, last watched, Continue/Start button
- University filter
- Expired banner if subscription expired

### Learning Page (major — 2000+ lines)
- Two-pane layout: video player (left) + sidebar tabs (right: Overview, Notes, Discussion, Resources)
- **Video Player**:
  - HTML5 `<video>` for UPLOAD/URL sources
  - YouTube IFrame Player API embed for YOUTUBE (real playback tracking via getCurrentTime/getDuration/onStateChange)
  - Watch-time tracking: accumulates real forward-playback deltas (0-1.5s), rejects seeks/rewinds
  - Throttled progress POST every 5 seconds
  - Resume from lastPosition (clamped to duration-3)
  - Fullscreen mode
  - Prev/Next lesson navigation
  - **In-video question popups**: pauses video at question timestamp, shows overlay with options, submit button, "Answer saved" confirmation
  - **Seek-past detection**: scrubbing past unanswered question → surfaces it
  - **Missed-question catch-up**: late-loading questions or resumed past question → surfaces it
  - **Assessment submission**: POST /api/student/videos/:id/assessment → server evaluates (70% pass), returns per-question review with correct answers revealed
  - **Assessment result overlay**: pass/fail banner, score ring, per-question review, retake button
  - **Passed state**: video plays freely, "Assessment Passed ✓" badge
  - **Certificate auto-issuance**: when last video completes → server issues certificate → "🎉 Certificate Issued!" toast
- **Notes Panel**: collapsible, notes with video timestamps, click timestamp → seek to that point, edit/delete
- **Discussions Panel**: course discussions, create/reply/edit/delete, pinned first, deep-link highlight
- **Assignment Panel**: shown when course is 100% complete (or no videos → auto-unlocked), file upload, submission status, reviewer notes, resubmit option

### Assignments Page
- All accessible assignments with unlock/locked state
- Per-assignment: locked (progress bar), available (download + upload), submitted (status), reviewed (notes + resubmit)

### Notes Page
- All notes across courses
- Search + course filter
- Card grid with edit/delete
- Clickable timestamp → deep-link to video

### Bookmarks Page
- Grouped by course
- Each: label, topic/video context, clickable timestamp, remove

### Discussions Page
- All discussions across accessible courses
- Search + course filter
- Pinned first, locked badge
- Click → deep-link to video discussion tab

### Notifications Page
- Types: DISCUSSION_REPLY, CERTIFICATE, COURSE, ANNOUNCEMENT, ASSIGNMENT, SYSTEM
- Grouped sections
- Mark as read (single/bulk)
- Unread count badge

### Subscription Page
- Active: plan name, price, duration, start/expiry, remaining days, progress bar
- Expired: banner + renew
- Available plans for renewal
- POST /api/student/subscription/renew

### Certificates Page
- Certificate cards: number, course, template title, organization, issued date
- View → HTML preview (decorative border, Cormorant Garamond + Inter fonts)
- PDF → real PDF download via Puppeteer

### Profile Page
- Photo upload (with preview), name, phone, bio
- Change password
- Member-since date

### Expired Screen
- Full-screen takeover when subscription expired
- Previous plan info
- Available plans for renewal
- History-preserved notice

---

## 7. Cross-Cutting Systems

### Internationalization (i18n)
- 522 keys × 2 languages (English + Arabic)
- Zustand store with localStorage persistence
- Auto-toggles dir="rtl" and font-arabic-active for Arabic
- Locale-aware date/price formatting (en-OM / ar-OM)
- Arabic OMR renders as "ر.ع"

### File Upload
- Local filesystem: public/uploads/<subdir>/<timestamp>-<hex>.<ext>
- Allowed: video (mp4/webm/mov/mkv), doc (pdf/doc/docx/ppt/pptx/txt), image (jpg/jpeg/png/webp/gif/svg)
- Size limits: images 5MB, submissions 25MB

### Video Tracking & Completion
- **HTML5**: timeupdate accumulates real watch time (deltas 0-1.5s), throttled POST every 5s
- **YouTube IFrame API**: onStateChange (PLAYING→poll 250ms, PAUSED→stop, ENDED→complete), getCurrentTime/getDuration for real tracking
- **Server validation**: completion requires `ended` flag (natural end or manual mark) + watchTime >= 70% of duration (relaxed from 85% for ended); mid-playback strict (85% + position near-end); no-video courses auto-complete
- **Anti-cheat**: seek-to-end with low watch time rejected; Infinity/NaN duration guarded

### Certificate System
- **3 modes**: no template (auto-generate defaults), enabled template (use custom), disabled template (no certificate)
- **Auto-issuance**: on video completion transition + on assignment submission (idempotent via @@unique)
- **Certificate number**: LL-<base36-timestamp>-<8-hex-random>
- **Placeholders**: {{studentName}}, {{courseName}}, {{issueDate}}, {{certificateNumber}}, {{organizationName}}
- **HTML rendering**: 1000px landscape, decorative double-border, corner accents, Cormorant Garamond + Inter, signature lines
- **PDF**: Puppeteer headless Chromium, landscape A4, scale 0.82, 6mm margins

### Question Popup System
- Questions with timestamp (minutes:seconds), options[], correctAnswer (index)
- Client fetches WITHOUT correctAnswer (security)
- Triggers on forward timestamp crossing during playback
- Seek-past detection + missed-question catch-up
- Server evaluates answers (70% pass threshold), reveals correct answers only in result
- Retake allowed, passed state = no more popups

### Subscription System
- 4 duration units: DAYS, WEEKS, MONTHS, YEARS
- Plan snapshots (immutable to plan edits)
- Paid courses use CoursePlanAccess junction
- Auto-refresh ACTIVE→EXPIRED
- Renewal: marks previous as EXPIRED, creates new ACTIVE starting now

### Discussion System
- Students: create, edit/delete own, reply (refused if locked)
- University/Instructor: pin/unpin, lock/unlock, delete (moderation), reply with instructor badge
- Reply bumps discussion.updatedAt
- DISCUSSION_REPLY notification to author

### Notification System
- Types: DISCUSSION_REPLY, CERTIFICATE, COURSE, ANNOUNCEMENT, ASSIGNMENT, SYSTEM
- Returns all unread + 20 recent read + unreadCount
- Mark as read (single/bulk)

---

## 8. Database Schema (19 Models)

User, University, Instructor, SubscriptionPlan, Subscription, CoursePlanAccess, Course, Topic, VideoLesson, LearningMaterial, VideoProgress, Assignment, AssignmentSubmission, CertificateTemplate, Certificate, VideoQuestion, VideoAssessment, Note, Bookmark, Discussion, Reply, Announcement, Notification

All with cuid IDs, timestamps, cascade/setNull delete rules, and appropriate indexes/unique constraints.

---

## 9. Complete API Endpoint Inventory (100+ endpoints)

### Public (7 endpoints)
GET /api/public/init, /api/public/plans, /api/public/universities, /api/public/universities/:id, /api/public/courses

### Auth (6 endpoints)
POST /api/auth/login, /api/auth/register, /api/auth/logout; GET /api/auth/me; POST /api/auth/password; PUT /api/auth/profile

### Admin (40+ endpoints)
Overview, students (CRUD), universities (CRUD), courses (CRUD + topics/videos/materials/assignments/certificate/thumbnail/publish), materials, assignments, submissions (review), plans (CRUD + activate), certificates

### University (50+ endpoints)
Overview, courses (CRUD + full editor), videos (CRUD + questions CRUD), materials, assignments, submissions (review), students, discussions (CRUD + replies + moderation), announcements, instructors (CRUD), certificates, branding, profile, revenue, analytics (overview + assessments), scheduling, settings

### Student (25+ endpoints)
Overview, courses, courses/:id, progress (POST + GET), videos/:id/questions, videos/:id/assessment (GET + POST), assignments, assignments/:id/submit, notes (CRUD), bookmarks (CRUD), discussions (CRUD + replies), certificates (list + preview + PDF), notifications (list + patch), subscription (GET + renew), announcements, recent-activity

---

## 10. Additional Enhancement Features

### 10.1 Payment Integration
- **Stripe/payment gateway**: real payment processing for plan subscriptions instead of "no payment processed" placeholder
- **Invoice generation**: PDF invoices for each subscription payment
- **Refund system**: admin can issue refunds
- **Coupon/discount codes**: percentage or fixed-amount discounts on plans
- **Free trial period**: X days free before charging

### 10.2 Course Enhancements
- **Course prerequisites**: require completing course A before course B
- **Course bundles**: group multiple courses at a discount
- **Course ratings & reviews**: students rate courses 1-5 stars + written reviews
- **Learning paths**: curated sequences of courses (e.g., "Full Stack Developer Path")
- **Drip content**: release topics on a schedule (e.g., one topic per week)
- **Course categories hierarchy**: nested categories (e.g., Programming > Web > Frontend)
- **Bulk import**: CSV import for courses, students, instructors
- **Course duplication**: clone an existing course as a starting point

### 10.3 Video & Assessment Enhancements
- **Video chapters/segments**: table of contents within a video (like YouTube chapters)
- **Playback speed control**: 0.5x, 1x, 1.25x, 1.5x, 2x
- **Video subtitles/captions**: SRT/VTT upload, multi-language subtitles
- **Adaptive questions**: question difficulty adjusts based on previous answers
- **Question pools**: randomize questions from a larger pool per student
- **Open-ended questions**: text/paragraph answers (not just multiple choice)
- **Code submission questions**: for programming courses — inline code editor + auto-grading
- **Peer review assignments**: students review each other's submissions
- ** timed exams**: full-course timed exams (not just per-video questions)

### 10.4 Student Experience
- **Gamification**: points, badges, streaks, leaderboards
- **Study calendar**: schedule learning sessions, reminders
- **Offline mode**: download videos for offline viewing (PWA)
- **Progress certificates**: certificates for partial completion (e.g., "Completed 50% of course")
- **Social learning**: study groups, peer messaging
- **AI study assistant**: chatbot that answers questions about course content
- **Smart notes**: auto-generated summary notes from video transcripts
- **Learning analytics for students**: personal dashboard with study time, best study hours, improvement suggestions
- **Course recommendations**: AI-powered "you might also like" based on progress
- **Mobile app**: native iOS/Android apps with offline sync

### 10.5 University Enhancements
- **Multi-tenant white-label**: custom domain, branding, theme per university
- **Course collaboration**: multiple instructors co-authoring a course
- **Automated email campaigns**: welcome series, completion nudges, re-engagement
- **Webhooks**: notify external systems on events (student enrolled, certificate issued, etc.)
- **Bulk student management**: import/export, bulk assign to courses
- **Custom certificate designs**: drag-and-drop certificate designer
- **Course versioning**: publish new versions without losing student progress
- **Live classes**: scheduled live video sessions (Zoom/Meet integration)
- **Assignment plagiarism check**: integrate plagiarism detection for text submissions

### 10.6 Admin & Platform
- **Advanced analytics**: cohort analysis, retention curves, funnel metrics
- **Content moderation**: AI-powered review of user-generated content (discussions, notes)
- **Audit log**: track all admin/university actions for compliance
- **Role-based access control (RBAC)**: custom roles with granular permissions
- **API rate limiting**: prevent abuse
- **Data export**: export all platform data (students, courses, etc.) as CSV/JSON
- **Email templates**: customizable email templates for all notifications
- **SMS notifications**: critical alerts via SMS
- **Multi-currency**: support USD, EUR, AED in addition to OMR

### 10.7 Communication
- **In-app messaging**: direct messages between students and instructors
- **Announcement comments**: students can comment on announcements
- **Discussion @mentions**: notify users when mentioned in discussions
- **Email digests**: daily/weekly summary of activity
- **Push notifications**: browser push for critical events

### 10.8 Accessibility & Compliance
- **WCAG 2.1 AA compliance**: full keyboard navigation, screen reader support, ARIA labels
- **High contrast mode**: accessibility theme
- **Dyslexia-friendly font option**
- **GDPR compliance**: data export, right to be forgotten, consent management
- **Content localization**: translate course content (not just UI) into multiple languages

### 10.9 Technical Enhancements
- **Real-time collaboration**: WebSocket-based live editing for course content
- **Search**: full-text search across all content (courses, videos, notes, discussions)
- **CDN for video delivery**: fast global video streaming
- **Progressive Web App (PWA)**: installable, offline-capable
- ** Automated backups**: scheduled database backups
- **Monitoring**: error tracking (Sentry), performance monitoring, uptime alerts
- **CI/CD pipeline**: automated testing and deployment
- **GraphQL API**: alternative to REST for flexible querying
- **Webhook system**: extensible event-driven integrations

### 10.10 Monetization
- **Commission system**: platform takes X% of each subscription, university gets rest
- **Featured listings**: universities pay to feature their courses
- **Marketplace**: sell individual courses without subscription
- **Corporate accounts**: B2B team accounts with bulk student seats
- **Affiliate program**: referral commissions
- **Sponsored content**: relevant sponsor cards in course catalog

---

## 11. Design System

### Color Palette
- Primary: deep forest green (#344F42)
- Accent: sage green (#789786)
- Background: warm off-white (#F8F8F5)
- Card: white
- Soft sage: light green tint for subtle backgrounds
- Success: green
- Warning: amber
- Destructive: red
- Muted: gray tones

### Typography
- Headings: Poppins (font-heading)
- Body: Poppins / Inter
- Arabic: Noto Kufi Arabic
- Certificate: Cormorant Garamond (serif) + Inter

### UI Patterns
- Cards with rounded corners (rounded-lg) and subtle shadows (shadow-sm/premium)
- Sticky headers and footers
- Responsive: mobile-first, sm/md/lg/xl breakpoints
- Mobile bottom nav for students
- Sidebar collapses to overlay on mobile
- Skeletons during loading
- Toast notifications for feedback
- Empty states with icon + title + description + action
- AlertDialog for destructive confirmations
- Dialog/Sheet for forms
- Tabs for multi-section content
- Accordion for FAQs
- Progress bars for completion
- Badges for status (FREE/PAID, Published/Draft, Active/Expired)
- DropdownMenu for row actions

### Animations
- Page transitions (animate-page-in)
- Stagger children on lists
- Hover lift on cards
- Scale-in on dialogs
- Pulse on active indicators
- Glass panel effect on navbar

---

## 12. Security

- Password hashing: PBKDF2 (sha512, 120k iterations)
- Session: HMAC-SHA256 signed tokens, httpOnly cookies, 7-day expiry
- Server-side validation: all API routes validate input with Zod or manual checks
- Correct answer protection: correctAnswer never sent to client until after assessment submission
- File upload validation: extension whitelist + size limits
- HTML escaping in certificate rendering
- Role guards on every API route
- Ownership verification (university can only edit own courses)
- Course access control (FREE = any student, PAID = active subscription with matching plan)

---

This specification covers every feature, UI element, API endpoint, user role, database model, and cross-cutting system in the CourseLearn platform, plus comprehensive enhancement suggestions across 10 categories.

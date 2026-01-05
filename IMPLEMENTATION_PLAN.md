## Implementation Plan (Educational MVP)

**Scope Summary**
- Goal: Lost & found web app to post, find, and connect.
- Tech: Next.js (TS, App Router), Tailwind CSS, Firebase (Auth + Firestore DB), Supabase Storage (images), Google Maps, Vercel deploy.
- Roles: Unregistered (browse/contact), Registered (post/manage), Admin (moderate).
- Constraint: 1 month timeline, keep simple and demonstrable.

**Phase 0 — Project Setup (Day 1–2)**
- Initialize tooling: Tailwind, ESLint, basic aliases, env management. - Done.
- Configure Firebase SDK (client) and Admin SDK (server-only in API routes). - Done
- Configure Supabase Storage via server route for signed uploads. - Done
- Add Google Maps script loading + API key from env.
- Create core folders: `app/(public)`, `app/(auth)`, `app/(me)`, `app/(admin)`, `lib/`, `components/`, `types/`, `app/api/*`.

**Phase 1 — Auth (Day 2–4)**
- Email/password registration, login, logout (Firebase Auth). - Done
- Password reset flow (email link). - Done
- Protect routes via middleware and server-side session checks. - Done
- User profile document created on first login; include role: `user|admin`. - Done

**Phase 2 — Data Model (Day 3–5)**
- Firestore collections (MVP): - Done
  - `users`: { role, name, email, phone?, blocked? }
  - `posts`: { userId, title, type: "lost|found", status, category, tags[], placeName, geo: { lat, lng }, createdAt, updatedAt } - Done
  - `photos`: { postId, url, alt } - Done
  - Optional later: `complaints`, `subscriptions`. - Done
- Indexes: by `type`, `category`, `createdAt desc`, `geo` bounding box fields. - Done
- Types: shared `types/*.ts` for Firestore shapes. - Done

**Phase 3 — Post CRUD (Day 5–8)**
- Create/edit/delete own posts: `app/posts/new`, `app/posts/[id]/edit`, `app/me/posts`.
- Photo uploads: Next.js API route issues Supabase signed URL; client PUTs image, then saves metadata.
- Validation: required fields, photo limit, simple anti-spam (honeypot + rate-limit).

**Phase 4 — Browse & Search (Day 7–10)**
- Listings: `app/lost`, `app/found` with filters (category, date range, location radius basic bbox).
- Search: keyword on title/tags; client-side filter if Firestore limits complex queries.
- Detail: `app/posts/[id]` with photos, map marker, status.

**Phase 5 — Map (Day 9–11)**
- `app/map`: Google Map with clustered markers for posts.
- Marker click opens quick card and links to detail.

**Phase 6 — Contact & Email (Day 10–12)**
- Contact form on post detail; sends email to author via API route.
- Email provider: simple SMTP (Nodemailer) or Resend; store minimal message log in Firestore.
- Add basic abuse guard: cooldown per IP/user, honeypot field.

**Phase 7 — Admin (Minimal) (Day 12–14)**
- `app/admin`: list recent posts; actions: hide/delete, mark status, block user.
- Role check server-side; surface simple stats (counts by type/status).

**Phase 8 — Static Pages & i18n (Day 14)**
- Static: `about`, `terms`, `privacy` as markdown rendered at build.
- i18n: single locale (lv); prepare keys for future but avoid routing complexity.

**Phase 9 — Quality, SEO, Perf (Day 15–18)**
- A11y sweep: labels, focus states, color contrast.
- SEO: metadata, OpenGraph, JSON-LD for posts, `robots.txt`, `sitemap`.
- Perf: `next/image`, lazy-load lists, avoid N+1 reads, cache map tiles by provider.

**Phase 10 — Tests & CI (Day 16–19)**
- Unit tests (Vitest) for utils, API handlers happy-paths.
- Light integration tests for auth and post create.
- GitHub Action: lint + typecheck; run tests if time permits.

**Phase 11 — Deploy & Handover (Day 20–22)**
- Vercel project wiring; set env vars.
- Smoke test flows; create demo accounts (user/admin).
- Write short README sections: setup, env, deploy, admin usage.

**Out of Scope for MVP (Backlog)**
- Real-time updates, notifications/digests, advanced moderation queue.
- Full CMS integration, multi-language routing, complex geo-search.
- Full E2E suite, analytics dashboards, exports.

**Environment Variables**
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`.
- `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (server-only for Admin SDK).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server route only).
- `GOOGLE_MAPS_API_KEY`, `EMAIL_SMTP_URL` or `RESEND_API_KEY`.

**Milestones (1 Month)**
- Week 1: Setup, Auth, base pages, data model.
- Week 2: Post CRUD, uploads, listings, detail.
- Week 3: Search/filters, Map, Admin minimal, static pages, SEO basics.
- Week 4: Polish, tests, deploy, docs, buffer.

**Open Clarifications**
- Categories/tags: final list for MVP? If none, use a short preset.
- Email provider: SMTP or Resend preference for coursework?
- Location input: fixed place list vs free text + map pin?
- Admin assignment: which account(s) should be seeded as `admin`?
- Notifications: include in MVP or move to backlog?

---

## Developer Details by Phase

Phase 0 - Project Setup (Day 1-2)
- Objectives
  - Stand up dev environment, styling, linting, and env management.
  - Wire Firebase (client + Admin), Supabase signed uploads, Google Maps loader.
- Tasks
  - Tailwind: add `tailwind.config.ts`, `postcss.config.js`; ensure `@tailwind base; @tailwind components; @tailwind utilities;` are in `app/globals.css`.
  - ESLint: extend `next/core-web-vitals`; ensure TS parser; scripts: `lint`, `typecheck`.
  - Env: create `.env.local.example` with all keys; never import server-only vars in client components.
  - Firebase client: `lib/firebase-client.ts` with `initializeApp` (guarded), `getAuth`, `getFirestore`.
  - Firebase admin: `lib/firebase-admin.ts` initializes Admin SDK from env; expose `verifyIdToken` helper.
  - Supabase server helper: `lib/supabase.ts` creates service client for storage ops only in API routes.
  - Maps loader: `lib/maps.ts` using `@googlemaps/js-api-loader` to load API key lazily.
  - `middleware.ts`: protect `/me/(.*)`, `/posts/(.*)/edit`, `/admin/(.*)`; allow public routes.
  - Folders: `app/(public)`, `(auth)`, `(me)`, `(admin)`, `app/api/*`, `components/`, `lib/`, `types/`.
- Acceptance
  - `npm run dev` runs; Tailwind styles render; lint/typecheck pass; secrets not exposed client-side.

Phase 1 - Auth (Day 2-4)
- Objectives
- Email/password auth with password reset; guard protected routes.
- Tasks
  - Pages: `app/(auth)/auth/sign-in/page.tsx`, `app/(auth)/auth/register/page.tsx`, `app/(auth)/auth/forgot/page.tsx`, `app/(auth)/auth/reset/page.tsx`.
  - Forms: Zod schemas; React Hook Form; minimal error messages; loading/disabled states.
  - Firebase Auth flows: `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `sendPasswordResetEmail`, `signOut`.
  - Server session: `lib/auth.ts` with `getServerUser()` using Admin SDK to verify ID token from cookies/headers in server components/actions.
  - On first login, create `users/{uid}` doc with `{ email, role: 'user', createdAt }`.
  - Header/UI: auth-aware navigation; sign-out server action.
- APIs
  - `app/api/auth/session/route.ts` GET: returns `{ uid, email, role }` if valid token.
  - Optional: `app/api/auth/verify/route.ts` to handle OOB code confirmation.
- Acceptance
  - Register -> login -> access protected pages -> logout works.

Phase 2 - Data Model (Day 3-5)
- Objectives
  - Define type-safe models and Firestore converters; add minimal indexes.
- Types
  - `types/user.ts`: `{ id, email, name?: string, phone?: string, role: 'user'|'admin', blocked?: boolean }`.
  - `types/post.ts`: `{ id, userId, title, type: 'lost'|'found', status: 'active'|'resolved'|'hidden', category: string, tags: string[], placeName?: string, geo?: { lat: number, lng: number }, createdAt: Timestamp, updatedAt: Timestamp }`.
  - `types/photo.ts`: `{ id, postId, url: string, alt?: string }`.
- Helpers
  - `lib/firestore.ts`: CRUD helpers with converters for `users`, `posts`, `photos`.
  - Index suggestions: create composite for `(type asc, createdAt desc)` and `(category asc, createdAt desc)`.
- Acceptance
  - Can create/read docs via helpers in a dev script or API route without type errors.

Phase 3 - Post CRUD (Day 5-8)
- Objectives
  - Implement create, edit, delete for own posts with photo upload.
- Tasks
  - UI pages: `app/posts/new/page.tsx`, `app/posts/[id]/edit/page.tsx`, `app/me/posts/page.tsx`.
  - Forms: Zod `PostCreateSchema`/`PostUpdateSchema` (title, type, category, tags[], optional geo, max N photos).
  - Upload: `app/api/upload-url/route.ts` POST returns `{ url, publicUrl }` using Supabase signed upload; client PUTs file -> save `photos` doc with `publicUrl`.
  - Server actions or API enforce ownership (`post.userId === current.uid`) for edit/delete.
  - Anti-spam: hidden input, server-side rate limit (simple memory store per uid or IP).
- APIs
  - `app/api/posts/route.ts` GET (my posts), POST (create post + photos meta).
  - `app/api/posts/[id]/route.ts` GET, PATCH (update), DELETE.
- Acceptance
  - User creates a post with up to 5 images; can edit fields; can delete; unauthorized operations are rejected.

Phase 4 - Browse & Search (Day 7-10)
- Objectives
  - Public browse for lost/found with filters and search; detail page.
- Tasks
  - Pages: `app/lost/page.tsx`, `app/found/page.tsx`, `app/posts/[id]/page.tsx` with gallery and map.
  - Filters: category select, date range, optional radius around a center (compute bbox and query approximate fields if stored).
  - Search: keyword match on `title`/`tags` (fallback to client filter for recent posts if Firestore query limits).
  - Pagination: simple `limit` + `startAfter` cursor or infinite scroll.
- API
  - `app/api/public/posts/route.ts` GET supports `type`, `category`, `q`, `from`, `to`, `cursor`.
- Acceptance
  - Filters and search update list; pagination works; detail shows data and photos.

Phase 5 - Map (Day 9-11)
- Objectives
  - Map with clustered markers from posts having `geo`.
- Tasks
  - Map page `app/map/page.tsx`; component `components/Map.tsx` using loader.
  - Cluster markers; click -> small card with title/status and link.
  - Bounds fit and refresh on filter changes.
- Acceptance
  - Map renders with markers; clicking navigates to detail.

Phase 6 - Contact & Email (Day 10-12)
- Objectives
  - Contact form sends email to post author; log minimal metadata.
- Tasks
  - UI form in post detail: name, email, message; honeypot and cooldown.
  - API `app/api/contact/route.ts` POST: validate (Zod), send via Nodemailer (`EMAIL_SMTP_URL`) or Resend, save log doc `messages`.
- Acceptance
  - Email successfully delivered (observable via provider or dev SMTP); repeated spam throttled.

Phase 7 - Admin (Minimal) (Day 12-14)
- Objectives
  - Moderation dashboard and minimal user controls.
- Tasks
  - Pages: `app/(admin)/admin/page.tsx` (stats), `app/(admin)/admin/moderation/page.tsx` (queue/table).
  - Actions: change `status`, hide/unhide post, delete post, block user.
  - Server-side role enforcement using Admin SDK; block hides user content in queries.
- APIs
  - `app/api/admin/posts/[id]/route.ts` PATCH/DELETE; `app/api/admin/users/[id]/route.ts` PATCH.
- Acceptance
  - Admin-only access; actions persist; blocked users cannot create posts.

Phase 8 - Static Pages & i18n (Day 14)
- Objectives
  - About, Terms, Privacy via markdown; single-locale app (lv).
- Tasks
  - MD files under `content/`; render with a simple MD parser component.
  - Centralize common strings in a small `lib/i18n.ts` object for future expansion.
- Acceptance
  - Pages render; no locale routing; strings centralized.

Phase 9 - Quality, SEO, Performance (Day 15-18)
- Objectives
  - Meet baseline A11y/SEO and reasonable perf.
- Tasks
  - A11y: form labels, aria attributes, keyboard nav, visible focus, color contrast.
  - SEO: `Metadata` in layout/pages; OG tags; JSON-LD on post detail.
  - Sitemap/robots: `app/sitemap.ts` and confirm `public/robots.txt`.
  - Perf: `next/image`, avoid heavy libs on initial route, code-split Map.
- Acceptance
  - Lighthouse acceptable; metadata present; no major A11y violations.

Phase 10 - Tests & CI (Day 16-19)
- Objectives
  - Minimal automated confidence.
- Tasks
  - Vitest + RTL config; tests for form validators, upload URL handler, posts API happy path.
  - GitHub Actions workflow: lint, typecheck, (optional) vitest.
- Acceptance
  - CI passes; tests run locally.

Phase 11 - Deploy & Handover (Day 20-22)
- Objectives
  - Production deploy on Vercel with setup docs.
- Tasks
  - Set env vars; connect repo; protect `main`.
  - Seed demo content; create admin user; provide creds securely to reviewers.
  - README updates: setup, env, auth, admin usage.
- Acceptance
  - Live URL works; smoke tests pass.

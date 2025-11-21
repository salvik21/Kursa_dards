# Project Implementation Plan Questionnaire

Fill in your answers directly under each question. If something does not apply, write N/A.

## 1) Goals & Scope
- What are the primary business goals and success metrics (KPIs)? - The main goal of the project is to develop a web application that helps people find lost items.
Users will be able to post announcements about lost items and report found items so that the owners can retrieve them.
The project is being developed as part of a coursework assignment, with the main objective of demonstrating the ability to design and implement a useful digital product.

Key Performance Indicators (KPIs):

Number of lost/found item posts;

Number of successful matches (when an owner finds their item through the platform);

Number of registered users;

User engagement (views, responses, and messages).
- Which features are in scope for MVP versus later phases? - All core features are planned to be implemented in the initial version of the project.
The application should be fully functional from the start, allowing users to find lost items and connect with people who have found them.
- Any must‑have constraints (budget, deadlines, technology choices)? - There are no major constraints for the project.
The only limitation is the time frame — the project must be completed within one month.
Since this is an academic project, there are no restrictions regarding budget or technology choices.

## 2) Users & Roles
- Who are the target user personas and their main jobs-to-be-done? - Target user personas and their main jobs-to-be-done

Unregistered users

Browse and search public announcements about lost or found people, animals, or items.

Use filters by category, location, and date.

Contact an announcement author through a built-in email form (no internal chat).

Request registration to access additional functionality.

Registered users

Create, edit, and delete their own announcements about lost or found objects.

Add photos, descriptions, and select the location using an integrated Google Maps interface.

Receive email notifications about new posts in selected areas or categories.

Report inappropriate or duplicate announcements.

Administrators

Moderate and manage all user announcements.

Delete or edit inappropriate content and block users.

Maintain the list of predefined locations, ensure data security, and generate usage statistics.
- What roles/permission levels exist (e.g., user, moderator, admin)? - Roles and permission levels
Role	Permissions
Unregistered user	View public information and announcements, use search and filters, send messages via contact form, request registration.
Registered user	Manage profile, create and update announcements, upload photos, receive notifications, report content violations.
Administrator	Full access: moderate announcements, manage users and system data, edit location list, export statistics, ensure GDPR compliance.
- What authentication method is required (email/password, OAuth, SSO, passwordless)? - Authentication method

Primary method: Email and password with email verification link.

Optional (future phase): Google OAuth login for easier access.

## 3) Pages & Navigation
- List required pages/flows (e.g., Home, About, Catalog, Detail, Checkout). - Required pages and main flows

Public (unregistered) pages

Home (/) – main landing page with quick search and recent lost/found posts.

About (/about) – information about the project and usage rules.

Lost items (/lost) – list view with category, date, and location filters.

Found items (/found) – same structure as “Lost.”

Map (/map) – interactive Google Maps view showing all posts by location.

Post detail (/posts/[id]) – photo, description, status, map location, and a contact form to reach the author (via email, not internal chat).

Search results (/search?q=...) – shows filtered or keyword-based results.

Contact page (/contact) – general email contact form.

Authentication

Sign In / Register (/auth/sign-in, /auth/register) – account access and creation.

Email verification (/auth/verify).

Forgot / Reset password (/auth/forgot, /auth/reset).

Registered-user pages

Create post (/posts/new) – form to publish a lost/found announcement with photo, description, and map location.

Edit post (/posts/[id]/edit).

My posts (/me/posts) – manage and update personal announcements.

Saved posts (/me/saved) – bookmarked announcements.

Notifications (/me/notifications) – manage email alerts by area or category.

Profile (/me/profile) – personal information and account settings.

Administrator pages

Dashboard (/admin) – overview of statistics and reports.

Moderation (/admin/moderation) – approve, edit, or delete announcements.

Users (/admin/users) – manage user accounts and access rights.

Locations (/admin/locations) – edit predefined public places.

Analytics / Exports (/admin/analytics).

System Settings (/admin/settings).

Utility pages

Legal (/terms, /privacy) – GDPR and privacy policies.

Error pages (/404, /500).

Main user flows

Create post: Register → Fill in form → Publish.

Contact author: Open Post → Send message via email form.

Moderation: Admin → Moderation → Approve/Edit/Delete.
- Any CMS-managed content or static pages? Which CMS if any? - CMS-managed or static content

For the initial one-month MVP, all informational pages (About, Terms, Privacy) will be static, stored directly in the project (e.g., Markdown or JSON files).

Later phases may integrate a headless CMS such as Strapi or Directus for easier content and category management.

This approach keeps the MVP simple and avoids complex integrations during development.
- Navigation structure and footer links? Any dynamic route patterns? - Navigation structure and dynamic routes

Top navigation

Logo → Home

Lost | Found | Map | Locations | About

“+ Post” button (visible only to logged-in users)

Authentication menu: Sign In / Register or User Profile menu

Footer links

About · Contact · Terms · Privacy

Language switch (LV/RU/EN)

Copyright © “Pazudušie un atrastie”

Dynamic route patterns

/posts/[id] – post details

/posts/[id]/edit – edit own post

/locations/[slug] – announcements by location

/search?q=...&category=...&location=... – search results

/admin/[section] – admin subpages

## 4) Data & Integrations
- What is the data model at a high level (key entities and relationships)? - 
1) High-level data model (key entities and relationships)

The system database consists of several core entities that describe users, posts, locations, and moderation data.

Main entities and their relationships

Lietotājs (User)
Fields: vārds, epasts, telefons, loma, ir_blokēts.
Relationships:

User 1–N Sludinājums (a user can create many posts)

User 1–N Sūdzība (complaints)

User 1–N Ziņojums (messages via email form)

User 1–N Lietotāju_adrese (addresses)

User 1–N Paziņojumu_abonements (subscriptions)

User 1–1 Autentifikācija (authentication record)

User 1–1 Slept (privacy settings)

Autentifikācija (Authentication)
Fields: parole, tips (email/password, OAuth), external_id.
Each user has one authentication record.
User 1–1 Authentication

Slept (Privacy settings)
Fields: Slepts_vārds, Slepts_epasts, Slepts_telefons.
Defines which data are publicly visible for a user.
User 1–1 Slept

Lietotāju_adrese (User Address)
Fields: nosaukums, adrese, pilsēta, mājas_Nr.
One user may have multiple addresses.
User 1–N Lietotāju_adrese

Sludinājums (Post / Announcement)
Fields: nosaukums, tips (lost/found), statuss, kategorija.
Relationships:

User 1–N Sludinājums

Vieta 1–N Sludinājums (each post is linked to a named place)

Atrašanās_vieta 1–N Sludinājums (each post also stores specific coordinates and address)

Sludinājums 1–N Apraksts (description)

Sludinājums 1–N Fotogrāfija (photo)

Sludinājums N–N Tag (tags)

Sludinājums 1–N Sūdzība (complaints)

Sludinājums 1–N Ziņojums (messages)

Apraksts (Description)
Fields: teksts, slepts.
Sludinājums 1–N Apraksts

Fotogrāfija (Photo)
Fields: url, nosaukums, slepts.
Sludinājums 1–N Fotogrāfija

Tag
Field: nosaukums
Sludinājums N–N Tag

Vieta (Place)
Field: nosaukums (e.g., “Centrālā stacija”, “Grīziņkalna parks”).
Vieta 1–N Sludinājums

Atrašanās_vieta (Location)
Fields: adrese, regions, platums, garums.
Atrašanās_vieta 1–N Sludinājums
and Atrašanās_vieta 1–N Paziņojumu_abonements

Paziņojumu_abonements (Notification subscription)
Field: radius_km.
Links user to an area for receiving new post alerts.
User 1–N Paziņojumu_abonements, Atrašanās_vieta 1–N Paziņojumu_abonements

Ziņojums (Message)
Field: saturs.
Used when a visitor contacts a post author via the built-in email form.
User 1–N Ziņojums, Sludinājums 1–N Ziņojums

Sūdzība (Complaint)
Fields: iemesls, statuss.
User 1–N Sūdzība, Sludinājums 1–N Sūdzība
- Which external APIs/services or databases will we integrate with? - Supabase: blob storage
Firebase: DB and auth
Google maps
Vercel for deployment and hosting

- Do we own the backend or integrate with an existing one? Provide API docs if available. - backend will be done in next js on ower side

- Any real-time needs (WebSockets), file uploads, or background jobs? - Real-Time Needs, File Uploads, and Background Jobs
Real-Time Functionality

The current version of the system (MVP) does not require real-time communication such as WebSockets.
All user interactions — including contacting a post author — occur via email forms rather than live chat.
However, real-time functionality (for example, instant admin notifications or message updates) can be added later using WebSockets or Server-Sent Events (SSE) if the project is extended.

File Uploads

File uploads are implemented using a signed URL approach:

The client requests a temporary upload link from the backend.

The backend generates a signed URL (e.g., for AWS S3 or Google Cloud Storage).

The client uploads the image directly to cloud storage, bypassing the main server.

The backend then saves the file metadata (URL, size, type) in the database.

This method increases performance and security while reducing the load on the backend server.

Background Jobs

Several asynchronous background processes ensure smooth and automated system operation:

Sending email verifications, password reset links, and notifications.

Processing uploaded images (resizing, thumbnail generation, removing EXIF metadata).

Spam and duplicate detection for posts and messages.

Auto-archiving posts with status “Returned to owner” after a certain period.

Sending daily or weekly notification digests to subscribed users.

## 5) Auth & Authorization
- Sign-up/sign-in flows needed? Password reset, email verification, 2FA? - es — the system includes sign-up and sign-in flows with email and password authentication.
Users can also reset their password via a secure email link and must verify their email address after registration.
Two-factor authentication (2FA) is not required for the MVP version but can be added in future for enhanced security.
- Protected routes? Role-based access control requirements? - es — the system includes protected routes and role-based access control.

Only authenticated users can access routes related to profile management and post creation (e.g., /posts/new, /me/profile, /me/posts).

Administrators have additional privileges, such as moderating posts, managing user accounts, and viewing system analytics.

Unregistered users can only view public pages (home, about, lost/found listings, and map).

Access control is enforced on both the frontend (route guards) and backend (JWT validation and user role checks).

Defined roles:

Unregistered User – can only view public information and contact authors via form.

Registered User – can create, edit, and delete their own posts, manage their profile, and subscribe to notifications.

Administrator – can moderate content, block users, manage system data, and view statistics.
- Session management, token lifetimes, and security considerations? - The system uses JWT-based authentication for secure session management.
Each user receives an access token with a limited lifetime, after which re-authentication is required.
All passwords are stored in encrypted form, and all communication is protected via HTTPS.
Basic security measures such as email verification and input validation are implemented to prevent unauthorized access.

## 6) Non-Functional Requirements
- Performance targets (Core Web Vitals), page load budgets? - The website should load within 3 seconds on standard broadband connections.

Frontend optimized for Core Web Vitals (LCP < 2.5s, CLS < 0.1, FID < 100ms).

Use caching, image compression, and lazy loading to reduce network load.

The backend must handle up to 100 concurrent users without performance degradation.
- Accessibility level (e.g., WCAG 2.1 AA)? - The interface follows WCAG 2.1 Level AA accessibility guidelines.

Includes semantic HTML, sufficient color contrast, and keyboard navigation support.

Images include descriptive alt text for screen readers.
- SEO needs (metadata, sitemap, robots, structured data)? - Pages include meta tags (title, description, keywords).

A dynamic sitemap.xml and robots.txt are generated automatically.

Structured data (JSON-LD) is used for posts to improve search visibility.
- Privacy/compliance (GDPR/CCPA), cookie consent, data retention? - The system complies with GDPR and local data protection laws.

Displays a cookie consent banner and stores consent preferences.

Users can delete their accounts and personal data upon request.

Personal data is stored securely and retained no longer than necessary.

All connections use HTTPS encryption to protect user information.

## 7) Design & Branding
- Do we have brand guidelines, logo, and assets? - The project does not have predefined brand guidelines or a logo,
as it is developed as part of a coursework project.
A simple and clean visual identity is used, featuring a blue and white color palette,
rounded shapes, and minimalistic icons to ensure clarity and accessibility.
- Do we have wireframes or high-fidelity designs? If not, who provides them? - There are no external design files or high-fidelity prototypes provided.
All page layouts and visual components are designed and implemented by the student
using best UI/UX practices and examples from similar web applications.
- Preferred styling approach (Tailwind CSS, CSS Modules, styled-components, other)? - The frontend uses Tailwind CSS for styling, due to its simplicity, speed, and responsiveness.
Tailwind allows consistent design and quick iteration without maintaining separate CSS files.
- Component library preference (e.g., Radix UI, MUI, Headless UI) or custom? - The project uses lightweight and accessible libraries such as Headless UI and Radix UI
for basic interactive components (dialogs, dropdowns, modals).
Custom styling and layout components are created where needed to match the project’s design.

## 8) Internationalization
- Which languages are required now and later? Default locale? - The system currently supports only one language — Latvian (lv).

Latvian is set as the default and sole locale for both the user interface and content.

All UI elements, notifications, and messages are written in Latvian.

User-generated content (posts, comments, descriptions) is also stored and displayed in Latvian.
- Locale routing strategy and translation source (files, CMS, service)? - Localization and Routing

Since only one language is supported, the application does not require locale-based routing (no /lv/ prefixes in URLs).

The system architecture, however, is designed in a way that allows easy addition of other languages (such as English or Russian) in future versions.

Translation Source

Static text is stored directly in the application code and does not rely on external translation files or services.

Future internationalization (i18n) could be implemented using JSON-based translation files or libraries such as i18next or Next-intl.

## 9) Environments & Deployment
- Target hosting (e.g., Vercel, AWS) and custom domains? - The application is hosted on Vercel, which provides free and reliable cloud hosting for web projects.

A custom domain is not required for the coursework version; the project is available under a Vercel-generated URL (e.g., project-name.vercel.app).

Hosting supports automatic SSL (HTTPS) and CDN-based content delivery for optimal performance.
- Environments needed (dev, staging, production)? Any preview deployments? - The project includes a single production environment, deployed automatically from the main branch of the GitHub repository.

A local development environment is used for testing and debugging before deployment.

A separate staging environment may be added later if extended collaboration or user testing is required.

Each commit triggers an automatic preview deployment (Vercel Preview) for quick verification of changes.
- Environment variables/secrets management approach? - Sensitive information such as API keys, database connection strings, and email service credentials
are stored in Vercel Environment Variables or in a local .env file (excluded from version control).

Access to environment variables is restricted to authorized users.

The following keys are typically defined:

DATABASE_URL – PostgreSQL database connection;

JWT_SECRET – authentication key for token signing;

EMAIL_API_KEY – credentials for sending email notifications;

GOOGLE_MAPS_API_KEY – integration with Google Maps API.

## 10) Testing & Quality
- Test levels required (unit, integration, E2E) and coverage goals? - he project implements basic testing to ensure stability and correct functionality of core components.

The main focus is on unit and integration tests:

Unit tests validate individual functions and components (e.g., form validation, API helpers).

Integration tests verify interactions between the frontend and backend (e.g., user registration, login).

End-to-End (E2E) testing is optional at this stage and may be added later for complete workflow validation.

Minimum test coverage target: 50–60% for key features.
Full coverage is not required due to the educational nature of the project.
- Preferred tools (Vitest/Jest, Testing Library, Playwright/Cypress)? - 
Vitest – used for unit and integration testing (fast and compatible with Vite-based projects).

Testing Library (React Testing Library) – for UI component testing and DOM interaction simulation.

Playwright (optional) – may be used for E2E testing of user flows such as login, post creation, and notifications.
- Error tracking, logging, and monitoring (Sentry, Logtail, Datadog)? - Error Tracking, Logging, and Monitoring

Basic error logging is implemented using browser console logs and backend error middleware (for Node.js/Express).

Sentry integration is planned for future phases to collect runtime errors and performance metrics.

The backend logs important events (authentication errors, failed API calls, database issues) to the console or log files for debugging.

Monitoring (availability, uptime) is handled manually during development and through Vercel’s built-in deployment analytics.

## 11) CI/CD & Workflow
- CI checks required (lint, typecheck, tests, build)? - Basic checks only: lint and build before deploy.
Optional (if time allows): typecheck (TypeScript) and a few unit tests for core flows.
- Release cadence and versioning strategy? Feature flags needed? - Continuous deploy on merge to main (Vercel).
Versioning: simple tags (e.g., v0.1, v0.2) or SemVer if needed later.
Feature flags: not needed for MVP.

## 12) Timeline & Milestones
- Target launch date and major milestones?
- Stakeholders for approvals and UAT process?

## 13) Additional Context
- Existing repositories, design files, or documentation links?
- Known risks, dependencies, or open questions?

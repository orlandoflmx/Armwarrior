FLORIDA ARMWRESTLING — LAUNCH BUILD

This package is the launch-ready website build for Armwarrior.com.

2026 official events included:
- Oct 17 — Garage Grinder Classic 2 — Eclipse Tattoo, Davenport — $40 per hand
- Nov 14 — Lucky U Cycles Motorcycle Pull — Fort Myers — $40 per class
- Dec 5 — Florida State Championship — Mudville Grill, Jacksonville — $40 per hand

Included:
- Public event schedule and event detail pages
- Official event flyers
- Athlete account registration and server-side registrations
- Clean public results/competitor empty states until real data is published
- Expanded FAA admin control center
- Event editing and registration status controls
- Results entry
- PWA/offline shell

Payments are intentionally deferred until the final launch stage, as requested.

Hosting:
- Node.js 18+
- Start command: node server.js
- Render can use npm install as the build command
- The server listens on the Render PORT and 0.0.0.0


V16 update: added a prominent FAA member account area with full-name account creation and sign-in. Auth token storage is unified for registration/admin access.


V19 cache fix: service-worker cache was bumped so updated account code replaces stale mobile-browser cached code.

FLORIDA ARMWRESTLING — V23 FULL DEPLOYMENT PACKAGE

Public site: Armwarrior.com

V23 changes:
- Public event registration does NOT require a member account.
- No public member sign-in or member account creation is required.
- Registration collects name, email, phone, city, event, category, arm, and weight when applicable.
- Amateur and Pro require a weight class.
- Kids, Ladies, and Masters do not require a weight class.
- Payment remains deferred for the final launch stage.
- Admin dashboard remains protected.

Files included:
- index.html
- admin.html
- server.js
- package.json
- manifest.webmanifest
- service-worker.js
- flyer-garage-grinder.jpg
- flyer-lucky-u.jpg
- flyer-state-championship.jpg

Render start command:
npm start

Admin:
Set ADMIN_EMAIL to the authorized admin email in Render environment variables.


V25 INTEGRATED CHAMPIONS
- Public athlete photo submissions are stored on the server for admin review.
- Admin can approve/hide athlete profiles and assign approved athletes to Right/Left champion slots for every weight class.
- Public Champions, Results, Events, and registration data read from the same server data store.
- Photos are resized in-browser before upload to keep the database manageable.


V27 fixes: Admin login now bootstraps the configured ADMIN_EMAIL account on first login if the deployed database is fresh/reset. The password is stored hashed. The public Social page Facebook buttons now link to the official Florida Armwrestling Facebook share URL provided for this deployment.

V28 AUTH FIX: Admin authentication now uses a signed stateless session token (with database-session compatibility), so Render multi-instance/restart behavior does not drop the admin session. The admin login also clears stale browser tokens before attempting a fresh login. Facebook uses the provided FAA link and renders as a full-width social button.


V33 ADMIN LOGIN FIX
Default admin password: FAAadmin2026!
The password can be overridden in Render with ADMIN_PASSWORD.
ADMIN_EMAIL remains the admin email.

V40: restored the global data-go navigation click handler. No registration/auth logic changed.


V45 PAYMENT / PRIVACY
- Public My Registrations / Upcoming Registrations UI removed. Registration records are managed in Admin only.
- Public event detail no longer returns registration records.
- Square Web Payments SDK card element is prepared.
- Optional Render environment variables: SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID, SQUARE_ACCESS_TOKEN, SQUARE_ENVIRONMENT=sandbox|production.
- Square access token is server-only and must never be placed in public HTML.

V54 PERSISTENT DATA / CONTENT
- Application data is no longer tied to the deployed ZIP directory when a Render persistent disk is available.
- The server uses ARM_WARRIOR_DATA_DIR first, then RENDER_DISK_PATH, then /var/data/armwarrior when /var/data exists.
- On first boot with an empty persistent location, the current bundled data/faa.json is copied once as the starting database.
- After that first copy, the persistent database is the source of truth. New ZIP deployments do not overwrite events, registrations, champions, photos, users, results, or other saved content.
- Champion photos and Admin Photos are stored in the persistent database and remain available after code updates.
- Events created in Admin remain available after code updates and continue to feed the public Events/Schedule and registration event selector.
- Registrations remain Admin-managed and persist across code updates.

RENDER PERSISTENT DISK SETUP (ONE-TIME)
1. Open the Armwarrior web service in Render.
2. Add a Persistent Disk to the service.
3. Use mount path: /var/data
4. Redeploy using this package.
5. The first deployment with the disk copies the existing bundled data once if the persistent database is empty. After that, future ZIP deployments leave the persistent data alone.

IMPORTANT: A ZIP file by itself cannot make a hosting provider's local filesystem permanent. The Render Persistent Disk is what makes the saved events, champions, photos, registrations, and other admin changes survive future deployments/redeploys.

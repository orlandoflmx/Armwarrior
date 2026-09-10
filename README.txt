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


V29 ADMIN LOGIN FIX
Default admin password: FAAadmin2026!
The password can be overridden in Render with ADMIN_PASSWORD.
ADMIN_EMAIL remains the admin email.

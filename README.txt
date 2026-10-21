ArmWarrior.com — Registration Close Fix
=========================================

Confirmed root cause
--------------------
Every API request runs `migrate(d)`. Its seeded-event loop used
`Object.assign(old, seed)`. Because the seed records have `status: 'open'`,
that overwrote an administrator's `status: 'closed'` on the next request.
The admin button could save "closed", but the following dashboard reload
changed it back to "open".

Patch included
--------------
`registration-close-fix.patch` changes migration so seed defaults are copied
only into fields that are missing (undefined/null). Existing values, including
event status, dates, flyers, registrations and results, are preserved.

Apply
-----
1. Back up the repository first.
2. From the repository root, run: `git apply registration-close-fix.patch`
   Or edit the `for(const seed of SEEDED_EVENTS){` loop in `server.js` to
   match the patch.
3. Commit the `server.js` change to `main` and deploy using your normal workflow.
4. Do not delete or recreate events, and do not modify the live database manually.

Verify after deployment
-----------------------
- Click CLOSE REGISTRATION for an event.
- Reload Admin; the status should stay `closed`.
- Attempt a new registration; the server should reject it with
  "Registration is closed for this event".
- Reopen registration and reload; status should stay `open`.
- Confirm existing registrations/results are still present.

Scope
-----
This fixes the actual cause of the close action reverting. The public Events
page currently renders one catalog rather than separate Upcoming and Past
sections; that display change is not included in this minimal server-side fix.

No files were committed. No deployment or live-site data was changed.

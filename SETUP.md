# Rung setup

## 1. Create the database

Create a Supabase project, open **SQL Editor**, and run the complete
[`schema.sql`](schema.sql) file. It is idempotent: re-run it after deploying this
version even if you used an earlier Rung schema. The current migrations add
workout groups, analytics fields, rest overrides, adjustable machine settings,
and the muscle data used for custom exercises.

For a private two-person app, enable Email authentication and choose whether email
confirmation is appropriate for you. Do not put a Supabase `service_role` key in
the browser.

## 2. Configure the app

Copy `config.example.js` to `config.js` and replace the two placeholders with the
project URL and **anon public** key from **Project Settings → API**. The anon key
is intentionally public; the RLS policies in `schema.sql` protect each account's
data.

`config.js` is included in the service-worker cache, so deploy it beside
`index.html`. Keep it out of a public Git repository only if you prefer not to
commit the public anon key.

## 3. Deploy every front-end file together

Deploy this entire folder to Vercel, Netlify, or another static host. Do not deploy
only `index.html`; the app also requires:

- `config.js`
- `progression-engine.js`
- `calibration-engine.js`
- `exercise-library.js`
- `manifest.json` and `sw.js`
- the `assets/` folder (Education illustrations)
- all four icon PNGs

The included engine checks can be run before deployment with:

```sh
node tests/progression-engine.test.js
node tests/calibration-engine.test.js
node tests/exercise-library.test.js
```

## 4. Install and update the PWA

On iPhone, open the deployed address in Safari and choose **Share → Add to Home
Screen**. On Android, use Chrome's **Install app** option.

The service worker is versioned in `sw.js`. For a future release, increment the
`CACHE` value (for example `progression-v26`) before deployment. This prevents an
installed app from combining an old page with new assets; reopen once after a
deploy to get the update.

## Everyday data safety

- Each signed-in account has a separate on-device cache and offline write queue.
- Mid-workout saves queue on a connection failure and sync in order on reconnect.
- The sync badge remains visible when the app needs attention; it no longer drops
  a server error silently.
- Use **Settings → Backup & restore → Export backup** before a phone change or
  major edit. Restore is a merge and never deletes current data.

## Starting-point calibration

New accounts are offered a skippable starting-point questionnaire. Its four lift
anchors are estimates only: it never assigns an unverified working weight. New
seeded exercises start at zero, and the progression engine learns from completed
sets plus effort tags. A user who selects the safety/caution path gets no automatic
load or cardio-target increases; this setting can be changed only by revisiting
**Settings → Starting point**.

The current calibration release also adds `cardio_sessions`; re-run `schema.sql`
before using the Cardio log.

## Optional AI coach

The supplied client calls a Supabase Edge Function named `deepseek`. Deploy your
own authenticated proxy function and keep the provider API key in Supabase secrets,
never in `config.js`. The workout app remains fully functional without AI.

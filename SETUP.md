# JobHackers Webinar Funnel — setup

A Vite + React funnel on the **JobHackers** design system, backed by **Supabase**
(Postgres + Auth + Edge Functions), with **Kit** email and **Zoom** event sync.

```
Landing (/)  →  Quiz (/quiz)  →  Thank-you (/thank-you)
                     │
            background lead score (Postgres)
                     │
   Kit countdown sequence  ·  Zoom next-event sync  ·  Admin CMS (/admin)
```

## Event model

Leads are stored as an **event log** in `public.jobhackers_leads`, one row per
(email, tag, stage):

| Event | stage | tag | source | score |
|-------|-------|-----|--------|-------|
| Webinar RSVP | `acquisition` | `EVENT->RSVP->WEBINAR-<chosen date>` | `?source=` from URL, else `direct` | 0 |
| Quiz submit  | `activation`  | `EVENT->ANSWER->WEBINAR-QUIZ` | `?source=` from URL, else `direct` | computed |

The same tags are applied to the subscriber in **Kit** (plus a `source-<x>` tag).

## 1. Frontend

```bash
npm install
npm run dev        # http://localhost:5173
```

## 2. Database

Apply the schema **once**. Supabase → SQL Editor → paste `supabase/apply_all.sql`
→ Run (idempotent). Then **bootstrap the dates** so the site shows real sessions
immediately: paste `supabase/seed_events.sql` → Run. (zoom-sync keeps it fresh
once deployed.)

CLI alternative: `supabase link --project-ref rizumeeeqojhxhaskbmx && supabase db push`.

## 3. Admin user

Supabase → Authentication → Users → Add user, then sign in at `/admin/login`.

## 4. Edge Functions (Kit + Zoom)

```bash
supabase secrets set --env-file .env.server   # incl. ZOOM_* creds
supabase functions deploy kit-enroll
supabase functions deploy zoom-sync
supabase functions deploy zoom-register
```

- **kit-enroll** — invoked on each event (RSVP + quiz). Subscribes in Kit, applies
  the event `tag` + `source-<x>` tag, writes custom fields.
- **zoom-sync** — pulls upcoming occurrences of the recurring meeting
  (`ZOOM_MEETING_IDS`) into `webinar_events`. The site shows the **nearest two**.
- **zoom-register** — binds the registrant to the date they pick.

### Zoom Server-to-Server scopes (one per operation)

| Operation | Scope | Endpoint |
|---|---|---|
| List/enumerate meetings | `meeting:read:list_meetings:admin` | `GET /users/{userId}/meetings?type=scheduled` |
| Read a meeting's occurrences | `meeting:read:meeting:admin` | `GET /meetings/{meetingId}` → `occurrences[]` |
| Register to chosen date | `meeting:write:registrant:admin` | `POST /meetings/{id}/registrants?occurrence_ids={id}` |

Sync runs **weekly, just after each session** via pg_cron (`zoom-sync-postmeeting`, `0 0 * * 3` — Wednesdays 00:00 UTC ≈ Wed midday NZ, after the Wed-morning meeting), so the finished date rolls off and the next two show:
```sql
select cron.schedule('zoom-sync-postmeeting','0 0 * * 3', $$
  select net.http_post(
    url:='https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/zoom-sync',
    headers:='{"Content-Type":"application/json","apikey":"<publishable key>"}'::jsonb,
    body:='{}'::jsonb
  );
$$);
```

## 6. A/B layout test (landing page)

Two landing layouts run behind `/`: **Variant A** (the current "New Rules" page,
`src/pages/LandingA.jsx`) and **Variant B** (a masterclass-style page,
`src/pages/LandingB.jsx`). `src/pages/Landing.jsx` buckets each visitor, sticks
their choice in `localStorage`, and records one exposure.

- **Schema:** apply `supabase/migrations/0007_ab_test.sql` (already folded into
  `apply_all.sql`). Adds `experiments`, `ab_exposures`, a `variant` column on
  leads, and a public `record_ab_exposure` RPC. `register_lead` now tags the
  lead's variant.
- **Default is OFF** — everyone sees Variant A until you flip the test on.
- **Admin → A/B Test tab:** toggle the test live, drag the traffic split (or use
  the 50/50, 80/20, 20/80 presets), and read **visitors / registrations /
  conversion rate** per variant. Conversion = registration.
- **Admin → Landing (B) tab:** edit every word of Variant B (same CMS editor as
  Variant A, page key `landing_b`).
- **Preview without skewing data:** `/?v=a` and `/?v=b` force a layout (not
  counted as exposures).

## 5. Kit countdown (event-anchored)

Kit's free plan has no automations, so reminders are sent as **scheduled
broadcasts** — one per occurrence × milestone (−48h / −24h / −1h / −15m),
targeted to that date's `EVENT->RSVP->WEBINAR-<date>` tag and anchored to the real
start time. The immediate confirmation (join link) is sent by Zoom on registration.

Function: `countdown-broadcasts` (deploy: `supabase functions deploy countdown-broadcasts`).
- Run (draft, review in Kit):  POST `/functions/v1/countdown-broadcasts`
- Go live (schedule sends):    POST `/functions/v1/countdown-broadcasts?reset=1&publish=1`
- Keep fresh weekly (pairs with zoom-sync):
```sql
select cron.schedule('countdown-weekly','30 0 * * 3', $$
  select net.http_post(
    url:='https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/countdown-broadcasts?publish=1',
    headers:='{"Content-Type":"application/json","apikey":"<publishable key>"}'::jsonb,
    body:='{}'::jsonb);
$$);
```
Copy for the emails lives in `emails/countdown-sequence.md`.

## Notes / still needed

- **Deploying functions** needs a Supabase access token (`supabase login`). Until
  then, lead capture + the funnel work (RPCs), and `seed_events.sql` shows real
  dates; Kit enrollment and Zoom registrant-binding activate once deployed.
- The meeting must have **registration enabled** for `zoom-register` to bind a
  registrant to an occurrence.
- `jobhackers_leads` has no per-answer column — only the computed `score` lands on
  the activation event. Ask and I'll add a `quiz_responses` table.

# JHG Webinar — Show-up Sequence (registration-anchored)

> **Mechanism:** this is a **Kit Sequence** (NOT a broadcast). `kit-enroll` adds each
> registrant the instant they sign up, so the welcome lands within seconds — while intent
> is highest. The event-anchored reminders (48h / 24h / 1h / 15m) stay as `countdown-broadcasts`.
>
> **Current scope:** ONE email — the immediate welcome. (Value email parked below, not live.)

**Merge fields available on the subscriber (set by `kit-enroll`):**
`{{ subscriber.first_name }}` · `{{ subscriber.webinar_date }}` · `{{ subscriber.webinar_time }}` ·
`{{ subscriber.join_url }}` · `{{ subscriber.occurrence_id }}` · `{{ subscriber.zoom_meeting_id }}`

**Calendar links** (one endpoint, per-person via merge fields, UTC so each person sees their own local time):
- Google → `https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/event-ics?o={{ subscriber.occurrence_id }}&m={{ subscriber.zoom_meeting_id }}&to=google`
- Outlook → `https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/event-ics?o={{ subscriber.occurrence_id }}&m={{ subscriber.zoom_meeting_id }}&to=outlook`
- Apple / .ics → `https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/event-ics?o={{ subscriber.occurrence_id }}&m={{ subscriber.zoom_meeting_id }}`

---

## Email 1 — Welcome (delay: 0 / immediate) — THE ONLY EMAIL IN THE SEQUENCE

**Subject:** You're in—now lock the time (takes 10 seconds)
**Preview:** Add it to your calendar and it'll show in your timezone automatically.

---

Hi {{ subscriber.first_name }},

You're registered for the free Job Hackers MasterClass—**{{ subscriber.webinar_date }} at {{ subscriber.webinar_time }}**. Good. That's the first real move.

Here's the truth about live classes: the single biggest thing that decides whether you get the win isn't the content—it's **whether you actually show up.** And the people who show up are the ones who put it in their calendar the moment they registered.

So let's do that right now, before anything else pulls your attention:

**📅 Add it to your calendar → it'll show in your own timezone automatically**
- **[Google Calendar](https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/event-ics?o={{ subscriber.occurrence_id }}&m={{ subscriber.zoom_meeting_id }}&to=google)**
- **[Outlook](https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/event-ics?o={{ subscriber.occurrence_id }}&m={{ subscriber.zoom_meeting_id }}&to=outlook)**
- **[Apple / other (.ics)](https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/event-ics?o={{ subscriber.occurrence_id }}&m={{ subscriber.zoom_meeting_id }})**

That one click sets a reminder and locks the time. No timezone math—your calendar handles it.

What this 90 minutes actually is: a live walk-through of the 3 Secrets behind getting hired in weeks, not months—**Job Hacking** (turn your search into an 8-week project), **Success Cloning** (copy the exact path of people already hired in your field), and **Hidden Job Market Hack #1** (get introduced to hiring managers before a role is ever posted). Taught live by David Perry and Laurent Simon. It's free, but it isn't a watered-down "webinar"—it's the real system, the hidden-market moves most job seekers never make.

Come with your toughest question. And bring the belief that's been slowing you down—"I don't know what to do," "I'm not good enough," or "people won't react well"—because each Secret is built to dismantle one of them, live. That's the shift we're after: from discouraged Job Seeker to confident JobHacker.

One more thing that takes ten seconds: **hit reply** and tell me the one role you're chasing right now (or the single thing slowing your search). I read these, and we aim the session at what you actually need.

See you inside,
David & Laurent
Co-founders & instructors, Job Hackers Global

*Can't make it live? Add it to your calendar anyway—we'll send your join link as it gets close, and you'll want the reminder. (One nudge to be there in person: there's a live-only bonus that isn't in the replay.)*

---
---

## PARKED — not in the sequence (revisit after launch)

> Value email. Dropped for now because a signup-anchored delay can land *after* the
> event for late registrants. Revisit as a lead-time-branched automation later.

**Subject:** Two lines that get replies—try this before the class
**Preview:** A ten-minute move you can make today. The class builds on it.

Hi {{ subscriber.first_name }},

Before we go live on {{ subscriber.webinar_date }}, here's something you can use today.

If your connection requests get accepted but your messages go quiet, it's almost never you—it's the ask. "Do you know of any openings?" hands the other person a job to do, so they do nothing.

Ask for a conversation instead. Two lines:

> *Hi [Name]—I'm exploring my next move in [your field] and your path caught my eye. Would you be open to 15 minutes so I can ask you two or three questions?*

No job ask. No pressure. Just a person asking a person for 15 minutes—which is exactly why it gets answered. And those conversations are where referrals, intros, and unadvertised roles actually come from.

Send it to one person today. Hit reply and tell me who you're sending it to—I read these.

That message is a taste of Secret #3—the Hidden Job Market Hack. The MasterClass is where you get all three. Your seat's saved:

**Join here → {{ subscriber.join_url }}**

See you soon,
The JobHackers team

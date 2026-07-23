# JHG Webinar — Full Show-up Sequence (welcome → last reminder)

The complete set of messages a registrant receives, in order. Two mechanisms:

- **Welcome** — a Kit **Sequence** email, fired instantly by `kit-enroll` on registration.
- **Reminders** — Kit **broadcasts** created by `countdown-broadcasts`, anchored to the event time.

**Merge fields:** `{{ first_name }}` · `{{ webinar_date }}` · `{{ webinar_time }}` · `{{ join_url }}` ·
`{{ occurrence_id }}` · `{{ zoom_meeting_id }}`
**Calendar link base:** `https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/event-ics?o={{ occurrence_id }}&m={{ zoom_meeting_id }}`
(append `&to=google` or `&to=outlook`; bare link = Apple/.ics). All times UTC → each person sees their own timezone.

---

## 0 · Welcome — sent immediately on registration
*Mechanism: Kit Sequence (via `kit-enroll`) · Primary CTA: add to calendar*

**Subject:** You're in—now lock the time (takes 10 seconds)
**Preview:** Add it to your calendar and it'll show in your timezone automatically.

---

Hi {{ first_name }},

You're registered for the free Job Hackers MasterClass—**{{ webinar_date }} at {{ webinar_time }}**. Good. That's the first real move.

Here's the truth about live classes: the single biggest thing that decides whether you get the win isn't the content—it's **whether you actually show up.** And the people who show up are the ones who put it in their calendar the moment they registered.

So let's do that right now, before anything else pulls your attention:

**📅 Add it to your calendar → it'll show in your own timezone automatically**
- **Google Calendar** → `…/event-ics?o={{ occurrence_id }}&m={{ zoom_meeting_id }}&to=google`
- **Outlook** → `…/event-ics?o={{ occurrence_id }}&m={{ zoom_meeting_id }}&to=outlook`
- **Apple / other (.ics)** → `…/event-ics?o={{ occurrence_id }}&m={{ zoom_meeting_id }}`

That one click sets a reminder and locks the time. No timezone math—your calendar handles it.

What this hour actually is: a live walk-through of the same system behind our 60-day bootcamp, taught by David Perry and Laurent Simon. It's free, but it isn't a watered-down "webinar." It's the real approach—the hidden-market moves most job seekers never make.

One more thing that takes ten seconds: **hit reply** and tell me the one role you're chasing right now (or the single thing slowing your search). I read these, and we aim the session at what you actually need.

See you inside,
David & Laurent
Co-founders & instructors, Job Hackers Global

*Can't make it live? Add it to your calendar anyway—we'll send your join link as it gets close, and you'll want the reminder.*

---

## 1 · 48 hours before
*Mechanism: countdown-broadcast · includes add-to-calendar block*

**Subject:** Two sleeps out—the 6-month search vs the 6-week one

---

Hi {{ first_name }},

Two sleeps to go. In **48 hours** (**{{ webinar_date }}, {{ webinar_time }}**) we go live, and here's the question the whole session answers.

Two people with the same experience apply for the same kind of role. One is still searching six months later. The other is hired in six weeks. The difference is almost never talent—it's that one of them is only fishing in the pond everyone else is fishing in.

Most roles that get filled were never advertised. They're filled through referrals and conversations before they ever reach a job board. That's the market the fast movers work, and the slow ones never touch—and it's exactly what we'll show you how to crack, live.

You've already registered. All you need to do now is show up. Here's your room:

**Confirm you're coming → {{ join_url }}**

**📅 Add it to your calendar** — it'll show in your own timezone automatically:
Google · Outlook · Apple / .ics

See you soon,
The JobHackers team

---

## 2 · 24 hours before
*Mechanism: countdown-broadcast · includes add-to-calendar block*

**Subject:** One sleep to go—three people, three different wins

---

Hi {{ first_name }},

One sleep to go—we're live in about **24 hours** (**{{ webinar_date }} at {{ webinar_time }}**). Before then, I want you to see yourself in this. These are results dedicated members have achieved, not promises—but they all started where you are now:

If you've been **out of work and stuck:** Daria was jobless for eight months, then hired in about 30 days.

If you're tired of **applying with nothing to show for it:** Alexandra landed two offers in three weeks.

If your job hunt **keeps dragging on:** Geetha landed her new job in 60 days.

Different starting points, same system—the one we walk through live. Which one is closest to you?

**Hit reply and tell me**—I'll make sure we cover it live. And here's your seat:

**Join here → {{ join_url }}**

**📅 Add it to your calendar** — it'll show in your own timezone automatically:
Google · Outlook · Apple / .ics

See you soon,
The JobHackers team

---

## 3 · Morning of — ~09:00 local *(conditional)*
*Mechanism: countdown-broadcast · only for afternoon/evening events; skipped when the 24h & 1h emails already bracket the start tightly (e.g. the current 9am events)*

**Subject:** Today's the day—quick gut check

---

Hi {{ first_name }},

Today's the day. You signed up because something about your search isn't working the way it should—that reason didn't go away overnight.

A few hours from now we go live at **{{ webinar_time }}**. Protect the time, bring your target role, and let's fix the part that's been costing you interviews.

**Here's your link for later → {{ join_url }}**

See you soon,
The JobHackers team

---

## 4 · 1 hour before
*Mechanism: countdown-broadcast*

**Subject:** We're live in an hour—here's the plan

---

Hi {{ first_name }},

We go live in **one hour.** Here's exactly what we'll cover, so you can come ready:

- **Your goal**—the role and salary you actually want in the next 60 days.
- **Your obstacle**—the one thing quietly slowing your search down.
- **The shift**—the hidden-market move most job seekers never make.

One thing: we post a replay, but the replay can't answer *your* question. The live Q&A is where we look at your specific situation—and you have to be in the room for that. Come with the role you're chasing in mind; the more specific you are, the more you walk away with.

**Join here → {{ join_url }}**

See you there,
The JobHackers team

---

## 5 · 15 minutes before
*Mechanism: countdown-broadcast*

**Subject:** We start in 15 minutes—your link's inside

---

Hi {{ first_name }},

We're starting in **15 minutes.** Grab a notebook, close the other tabs, and jump in. This is the part that doesn't come back—the live Q&A happens once, and only for the people in the room.

**Join now → {{ join_url }}**

See you inside,
The JobHackers team

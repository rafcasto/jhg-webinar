# JHG Webinar — "Elevate Anticipation" countdown sequence

Adapted from your *Sequence 2 — Elevate Anticipation* doc into the JobHackers voice,
anchored to the **next webinar event** (synced from Zoom). Triggered when a lead
registers (the `kit-enroll` function applies the `EVENT->RSVP->WEBINAR-<date>` tag).

> **Timing note.** Kit's native sequences drip *relative to subscribe time*, which
> won't line up with a fixed event. To send these at **event − 48h / − 24h / − 1h /
> − 15m**, use the scheduled `countdown-dispatch` job (event-anchored Kit broadcasts)
> rather than a plain Kit sequence. The Confirmation email is immediate and can be a
> normal sequence step or a transactional send on registration.

Merge fields used: `{{ subscriber.first_name }}`, `{{ event_date }}`, `{{ event_time }}`,
`{{ join_url }}`, `{{ playbook_url }}`, `{{ scorecard_url }}`.

---

## 1. Confirmation — sent immediately
**Subject:** You're in, {{ first_name }} 🎯

Hi {{ first_name }},

You're registered for the **Job Hacking workshop** on **{{ event_date }} at {{ event_time }}**. Nice move.

Here's what we'll cover live:
1. How to **crack the hidden job market** (where 80% of roles actually get filled)
2. How to turn your LinkedIn into a profile recruiters *come to*
3. How to **negotiate the offer you deserve** — without the awkwardness

Three things to do now:
- **Add it to your calendar** so future-you shows up.
- **Watch your inbox** — I'll send the join link and a couple of short prep lessons.
- **Reply** with the #1 thing you want to walk away with. I read every one.

See you soon,
The JobHackers team

---

## 2. 48-hour reminder — *the story*
**Subject:** Two sleeps to go — a quick confession, {{ first_name }}

Hi {{ first_name }},

In **48 hours** we go live. Before then, a confession: most people don't struggle to find a job because they're not good enough. They struggle because **nobody taught them the playbook.**

The visible job market — the postings everyone fights over — is only **20%** of the opportunities. The other **80%** is hidden, filled through networks and referrals. On {{ event_date }} I'll show you exactly how to crack it.

Block the time. It's the highest-leverage hour you'll spend on your search this month.

See you {{ event_date }},
The JobHackers team

---

## 3. 24-hour reminder — *proof*
**Subject:** Will it be worth it? (here's what members say)

Hi {{ first_name }},

Tomorrow at **{{ event_time }}** we go live. Prepping the room now.

A few members who used this exact playbook:

> "Three final-round interviews in a month after months of silence." — *Priya R.*
> "The negotiation piece alone got me +22% on my offer." — *Marcus T.*

Tomorrow you'll get the same starting point. Anything specific you want covered? Just reply.

The JobHackers team

---

## 4. One-hour reminder — *the agenda* (not a "confirmation")
**Subject:** AGENDA for today's workshop

Hi {{ first_name }},

We're live in **one hour**. Here's the agenda so you get maximum value:

- **GOAL:** the role + salary you want in the next 60 days
- **OBSTACLE:** the one thing currently slowing your search
- **SHIFT:** the hidden-market move most people never make

Join link: {{ join_url }}

I've set the room up so we won't be interrupted — see you there.
The JobHackers team

---

## 5. 15-minute reminder — *just the link*
**Subject:** We start in 15 minutes — your link

Hi {{ first_name }},

We're starting in **15 minutes**. Jump in here:
{{ join_url }}

Can't make it on video? Reply and we'll send the replay.
See you inside,
The JobHackers team

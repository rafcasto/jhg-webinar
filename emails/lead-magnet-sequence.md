# JHG — Lead-Magnet Sequence ("Career Compass" gift, quiz-anchored)

> **STATUS: DRAFT.** Placeholder copy — replace before launch. The lead-magnet
> asset itself is a **[LEAD MAGNET PLACEHOLDER]** (link/PDF/Notion) to be added later.
>
> **Mechanism:** this is a **Kit Sequence** (NOT a broadcast). `kit-enroll` enrolls
> the person the instant they finish the Compass quiz (lead `stage = activation`),
> so the gift lands within seconds. Set the sequence id as the `KIT_QUIZ_SEQUENCE_ID`
> Edge Function secret. A tag-based automation off `EVENT->QUIZ_COMPLETE->TRACKER`
> works as an alternative trigger.

**Merge fields available on the subscriber (set by `kit-enroll`):**
`{{ subscriber.first_name }}` · `{{ subscriber.source }}` · `{{ subscriber.location }}` ·
`{{ subscriber.lead_score }}` (0–6 readiness)

> _Optional:_ if you want to personalise by archetype/grade/obstacle, extend
> `kit-enroll` to also push `archetype`, `grade`, and `obstacle` as Kit custom fields
> (they're already stored on the lead row) — then merge them here.

---

## Email 1 — Deliver the gift (delay: 0 / immediate) — DRAFT

**Subject:** [DRAFT] Here's your JobHacker Career Compass 🧭
**Preview:** [DRAFT] Your personalised game plan is inside.

---

Hi {{ subscriber.first_name }},

Thanks for completing the Compass — here's the gift I promised.

👉 **[GET YOUR CAREER COMPASS]([LEAD MAGNET PLACEHOLDER — link/PDF/Notion])**

[DRAFT: one or two lines on what the Compass is and the single first action to take
with it. Replace this whole block with final copy.]

See you at the MasterClass,
David & Laurent
Co-founders & instructors, Job Hackers Global

*[DRAFT footer — replace.]*

---
---

## PARKED — Email 2 (value / nudge) — not live yet

> Optional follow-up 1–2 days later. Keep parked until Email 1 copy + the actual
> lead-magnet asset are finalised.

**Subject:** [DRAFT] Did the Compass point you somewhere useful?
**Preview:** [DRAFT]

[DRAFT body — replace before enabling.]

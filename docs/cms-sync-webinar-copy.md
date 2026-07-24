# CMS sync — webinar copy alignment (apply via /admin → Content Editor)

The JSX defaults were updated in code, but any `content_blocks` row that already
exists **overrides** the default. For every key below, set the row's value to the new
value (or **delete** the row to fall back to the new JSX default). Rows that don't
exist yet can be left alone — the new default renders.

> Em-dashes below are closed (word—word). Keep them closed when pasting.

---

## Page: `landing` (Variant A)

| key | new value |
|-----|-----------|
| `hero_eyebrow` | FREE LIVE MASTERCLASS—with David Perry & Laurent Simon |
| `hero_title` | How to Secure a Job You Love, at the Salary You Deserve—Without Applying Online |
| `hero_subtitle` | The free 90-minute live MasterClass for professionals stuck in limbo—job hunting, changing careers, or chasing the promotion you've earned. Learn the exact system 3,000+ professionals in 35 countries have used to get hired in weeks, not months. |
| `who_intro` | Whatever "stuck" looks like for you, the way out starts the same place—the 3 Secrets. |
| `who_1_title` | The Dreamer |
| `who_1_desc` | Overwhelmed and unsure what the first step even is. |
| `who_1_em` | You'll leave with the exact starting sequence—no more guessing. |
| `who_2_title` | The Wanderer |
| `who_2_desc` | You started—then got stuck or lost momentum. |
| `who_2_em` | You'll leave knowing precisely what to fix next, and in what order. |
| `who_3_title` | The Doer |
| `who_3_desc` | Big effort, little to show for it. Applications out, silence back. |
| `who_3_em` | You'll leave knowing where your hours actually pay. |
| `method_heading` | The 3 Secrets You'll Learn Live |
| `method_subline` | Each one kills the belief that's keeping you stuck. |
| `method_1_title` | Secret #1—Job Hacking. |
| `method_1_desc` | How to harness AI and our 8-step roadmap to make a good job an 8-week project—not a 12-month ordeal. For everyone thinking "I don't know what to do." |
| `method_2_title` | Secret #2—Success Cloning. |
| `method_2_desc` | How to ethically "steal" the exact path of people in your industry who've already landed—no reinventing yourself. For everyone thinking "I'm not good enough." |
| `method_3_title` | Secret #3—Hidden Job Market Hack #1. |
| `method_3_desc` | How to get introduced directly to hiring managers before the job is ever posted—no online applications. For everyone thinking "people won't react well if I reach out." |
| `method_4_title` | **DELETE row** (A now renders only 3 secrets) |
| `method_4_desc` | **DELETE row** |
| `method_5_title` | **DELETE row** |
| `method_5_desc` | **DELETE row** |
| `get_1` | The 3 Secrets—Job Hacking, Success Cloning, and Hidden Job Market Hack #1 |
| `get_2` | The 8-step JobHacking roadmap that turns your search into an 8-week project |
| `get_3` | Why the hidden job market (70–80% of roles) is where offers actually come from |
| `get_4` | What dedicated JobHackers do differently to land in 3–8 weeks vs the 26-week US average |
| `get_5` | Live Q&A with David & Laurent—bring your real situation |
| `bonus_heading` | There's a bonus. We're not telling you what it is. |
| `bonus_body` | Show up live and you'll get something we're deliberately keeping off this page. It's for live attendees only—it doesn't go out with the replay—and you'll understand why the moment you see it. |
| `action_statement` | The average US job search runs about 26 weeks. Every month it drags on is a month of salary you never get back. One free 90-minute MasterClass could change that math. |
| `identity_arc` | From discouraged Job Seeker to confident JobHacker. |
| `form_heading` | Save your seat. The live-only bonus isn't in the replay. |
| `form_button` | Save My Seat → |

**Optional (only if these rows already exist with spaced em-dashes — normalize to closed):**
`problem_1_desc`, `problem_2_desc`, `biz_body`. Wording unchanged; just close ` — ` → `—`.

---

## Page: `landing_b` (Variant B)

| key | new value |
|-----|-----------|
| `badge` | FREE LIVE MASTERCLASS—with David Perry & Laurent Simon |
| `hero_title` | How to Secure a Job You Love, at the Salary You Deserve |
| `hero_title_accent` | —Without Applying Online. |
| `hero_subtitle` | The free 90-minute live MasterClass for professionals stuck in limbo—job hunting, changing careers, or chasing the promotion you've earned. Learn the exact system 3,000+ professionals in 35 countries have used to get hired in weeks, not months. |
| `countdown_label` | Next MasterClass begins in |
| `proof_strip` | 3,000+ professionals coached · David Perry & Laurent Simon · 90-minute live MasterClass |
| `learn_heading` | Each one kills the belief that's keeping you stuck. |
| `part_1_kicker` | SECRET #1 |
| `part_1_title` | Job Hacking |
| `part_1_desc` | How to harness AI and our 8-step roadmap to make a good job an 8-week project—not a 12-month ordeal. For everyone thinking "I don't know what to do." |
| `part_2_kicker` | SECRET #2 |
| `part_2_title` | Success Cloning |
| `part_2_desc` | How to ethically "steal" the exact path of people in your industry who've already landed—no reinventing yourself. For everyone thinking "I'm not good enough." |
| `part_3_kicker` | SECRET #3 |
| `part_3_title` | Hidden Job Market Hack #1 |
| `part_3_desc` | How to get introduced directly to hiring managers before the job is ever posted—no online applications. For everyone thinking "people won't react well if I reach out." |
| `bonus_kicker` | LIVE-ONLY BONUS |
| `bonus_title` | We're keeping this one a secret. |
| `bonus_desc` | Attend live and you'll get a bonus we're deliberately not naming. Not sent with the replay. |
| `presenters_heading` | Your MasterClass Hosts |
| `closer_heading` | Don't miss this free MasterClass. |
| `closer_sub` | 90 minutes that could change your career. From discouraged Job Seeker to confident JobHacker—pick the session that suits you. It runs every fortnight. |
| `form_heading` | Save your seat. The live-only bonus isn't in the replay. |
| `form_button` | Save My Seat → |

---

## Page: `thankyou`

| key | new value |
|-----|-----------|
| `title` | You're in. One more move locks it in. |
| `subtitle` | Registrants who do the two steps below are the ones who show up live—and the ones who show up get the results. |
| `welcome_quote` | We built this MasterClass for professionals doing everything "right" and hearing nothing back. Bring your real situation—we'll bring the system 3,000+ professionals have used to get hired in weeks, not months. See you live. |
| `steps_title` | Complete next steps 👇 (unchanged) |
| `share_heading` | Someone in your network is stuck too. |
| `share_private` | Know one person stuck in their search? Send them your seat link. |
| `community_label` | Join the JobHackers community |
| `community_sublabel` | 4.5★ from 93 reviews—meet the people running the same playbook. |

**Important:** leave `hero_media_url` / `video_url` **empty** so the founder-quote
fallback renders (there's no welcome video yet). When a real welcome video exists,
set `hero_media_url` and it takes over automatically.

### `ctas` table (page `thankyou`)

Desired end-state — the thank-you page now renders a fixed 3-step flow
(Step 1 = calendar CTA, Step 2 = Share module in code, Step 3 = community):

- **Step 1 card** = `ctas[0]` (first enabled row, ordered by `position`). Keep the
  add-to-calendar card here (its existing `.ics` calendar URL). Suggested copy:
  - `icon`: 📅 · `label`: Add to your calendar · `sublabel`: Locks the time—and the people who add it are the ones who show up.
- **Step 3 card** = the row whose `url` contains `meetup.com` (or the code default):
  - `url`: https://www.meetup.com/job-hackers-global/ · `icon`: 🤝 · `label`: Join the JobHackers community · `sublabel`: 4.5★ from 93 reviews—meet the people running the same playbook.
- **Delete / disable** any obsolete thank-you CTAs (e.g. a "Mission Card download"
  card) — the bonus is now a live-only mystery and must not appear here.

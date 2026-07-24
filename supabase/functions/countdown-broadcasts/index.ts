// Edge Function: countdown-broadcasts
// Creates one Kit broadcast per upcoming occurrence × milestone
// (-48h / -24h / morning-of / -1h / -15m), targeted to that occurrence's RSVP
// tag and anchored to the real start time.
// Idempotent via the webinar_broadcasts table.
//
// Copy is v4 (webinar-aligned): the sequence now promises the SAME thing the
// webinar delivers — the 3 Secrets (Job Hacking · Success Cloning · Hidden Job
// Market Hack #1) — and the genuine, attend-or-miss live-only mystery bonus.
// Still claims-disciplined: numbers-free testimonials, no salary figures, no hard
// hidden-market percentages, no price, the bonus stays UNNAMED, closed em-dashes.
//
// The 48h + 24h emails include an "Add to calendar" block (Google / Outlook /
// Apple .ics). All calendar times are UTC, so each recipient's calendar app
// renders the event in THEIR local timezone — no per-attendee timezone logic.
//
// Query: ?publish=1  -> set send_at (schedules the real send). Default = draft (review first).
//        ?reset=1    -> delete previously-created countdown broadcasts first.
// Secrets: PROJECT_URL, SERVICE_KEY, KIT_API_KEY
// Invoke:  supabase.functions.invoke('countdown-broadcasts', { body:{} })  (or GET with ?publish=1)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KIT = "https://api.kit.com/v4";
const kitKey = Deno.env.get("KIT_API_KEY")!;
const ICS_BASE = "https://rizumeeeqojhxhaskbmx.supabase.co/functions/v1/event-ics";
const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: cors });

async function kit(path: string, init: RequestInit = {}) {
  const r = await fetch(`${KIT}${path}`, {
    ...init,
    headers: { "X-Kit-Api-Key": kitKey, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`Kit ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function ensureTag(name: string): Promise<number> {
  const { tags } = await kit(`/tags`);
  const found = (tags || []).find((t: any) => t.name === name);
  if (found) return found.id;
  const { tag } = await kit(`/tags`, { method: "POST", body: JSON.stringify({ name }) });
  return tag.id;
}

const fmt = (iso: string, tz?: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: tz });
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", timeZone: tz });
  return { date, time };
};

// Local hour (0–23) of the event start in the event's timezone.
const localHour = (iso: string, tz?: string) =>
  parseInt(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: tz }).format(new Date(iso)), 10);

// UTC compact stamp for calendar links: 2026-08-18T21:00:00Z -> 20260818T210000Z
const zstamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// "Add to calendar" block — Google / Outlook / Apple(.ics). All times UTC ->
// each recipient sees the event in their own timezone.
function calBlock(ev: any) {
  const start = new Date(ev.start_time);
  const end = new Date(start.getTime() + (ev.duration_min ?? 90) * 60000);
  const title = ev.topic || "JobHackers MasterClass";
  const join = ev.join_url || "";
  const details = `Your free 90-minute live MasterClass with David & Laurent. Join here: ${join}`;
  const g = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}` +
    `&dates=${zstamp(start)}/${zstamp(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(join)}`;
  const o = `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
    `&startdt=${start.toISOString()}&enddt=${end.toISOString()}&subject=${encodeURIComponent(title)}` +
    `&body=${encodeURIComponent(details)}&location=${encodeURIComponent(join)}`;
  const ics = `${ICS_BASE}?o=${encodeURIComponent(ev.occurrence_id)}&m=${encodeURIComponent(ev.zoom_meeting_id)}`;
  return `<p style="margin:18px 0;padding:12px 16px;background:#f4f6fb;border-radius:8px">` +
    `<b>📅 Add it to your calendar</b>—it'll show in your own timezone automatically:<br>` +
    `<a href="${g}">Google</a> &nbsp;·&nbsp; <a href="${o}">Outlook</a> &nbsp;·&nbsp; <a href="${ics}">Apple / .ics</a></p>`;
}

// milestone offsets (ms before start) + v4 copy
function milestones(ev: any) {
  const { date, time } = fmt(ev.start_time, ev.timezone);
  const join = ev.join_url || "#";
  const lh = localHour(ev.start_time, ev.timezone);
  const cal = calBlock(ev);
  const wrap = (h: string) =>
    `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#191c27">${h}</div>`;
  const sign = "<p>See you soon,<br>The JobHackers team</p>";

  const list: any[] = [];

  // 48 hours before — contrast + the 3 Secrets promise (soft hidden-market, no %)
  list.push({
    key: "48h",
    ms: 48 * 3600e3,
    subject: "Two sleeps out—the 6-month search vs the 6-week one",
    html: wrap(
      `<p>Hi {{ subscriber.first_name }},</p>` +
      `<p>Two sleeps to go. In <b>48 hours</b> (<b>${date}, ${time}</b>) we go live, and here's the question the whole MasterClass answers.</p>` +
      `<p>Two people with the same experience apply for the same kind of role. One is still searching six months later. The other is hired in six weeks. The difference is almost never talent—it's that one of them is only fishing in the pond everyone else is fishing in.</p>` +
      `<p>Most roles that get filled were never advertised. They're filled through referrals and conversations before they ever reach a job board. That's the market the fast movers work, and the slow ones never touch.</p>` +
      `<p>On the MasterClass we hand you the 3 Secrets behind the six-week version:</p>` +
      `<ul>` +
      `<li><b>Job Hacking</b>—turn your search into an 8-week project, not a 12-month ordeal.</li>` +
      `<li><b>Success Cloning</b>—copy the exact path of people already hired in your field.</li>` +
      `<li><b>Hidden Job Market Hack #1</b>—get introduced to hiring managers before a role is ever posted.</li>` +
      `</ul>` +
      `<p>You've already registered. All you need to do now is show up. Here's your room:</p>` +
      `<p><b>Confirm you're coming → <a href="${join}">${join}</a></b></p>` +
      cal +
      sign,
    ),
  });

  // 24 hours before — three real alumni, numbers-free framing, no salary figures
  list.push({
    key: "24h",
    ms: 24 * 3600e3,
    subject: "One sleep to go—three people, three different wins",
    html: wrap(
      `<p>Hi {{ subscriber.first_name }},</p>` +
      `<p>One sleep to go—we're live in about <b>24 hours</b> (<b>${date} at ${time}</b>). Before then, I want you to see yourself in this. These are results dedicated members have achieved, not promises—but they all started where you are now:</p>` +
      `<p>If you've been <b>out of work and stuck:</b> Daria was jobless for eight months, then hired in about 30 days.</p>` +
      `<p>If you're tired of <b>applying with nothing to show for it:</b> Alexandra landed two offers in three weeks.</p>` +
      `<p>If your job hunt <b>keeps dragging on:</b> Geetha landed her new job in 60 days.</p>` +
      `<p>Different starting points, same system—the 3 Secrets we walk through live. That's the road from discouraged Job Seeker to confident JobHacker. Which one is closest to you?</p>` +
      `<p><b>Hit reply and tell me</b>—I'll make sure we cover it live. And here's your seat:</p>` +
      `<p><b>Join here → <a href="${join}">${join}</a></b></p>` +
      cal +
      sign,
    ),
  });

  // Morning-of (conditional): only for afternoon/evening events (local start >= 12:00),
  // scheduled for ~09:00 local on the event day. Skipped for early-in-day events where
  // the 24h and 1h emails already bracket the start tightly.
  if (lh >= 12) {
    list.push({
      key: "morning",
      ms: (lh - 9) * 3600e3,
      subject: "Today's the day—quick gut check",
      html: wrap(
        `<p>Hi {{ subscriber.first_name }},</p>` +
        `<p>Today's the day. You signed up because something about your search isn't working the way it should—that reason didn't go away overnight.</p>` +
        `<p>A few hours from now we go live at <b>${time}</b>. Protect the time, bring your target role, and let's fix the part that's been costing you interviews.</p>` +
        `<p>One nudge to show up live: there's a bonus we're deliberately not naming here. It goes to the people in the room, and it isn't in the replay.</p>` +
        `<p><b>Here's your link for later → <a href="${join}">${join}</a></b></p>` +
        sign,
      ),
    });
  }

  // 1 hour before — GOAL / OBSTACLE / SHIFT agenda + live-only bonus reminder
  list.push({
    key: "1h",
    ms: 1 * 3600e3,
    subject: "We're live in an hour—here's the plan",
    html: wrap(
      `<p>Hi {{ subscriber.first_name }},</p>` +
      `<p>We go live in <b>one hour.</b> Here's exactly what we'll cover, so you can come ready:</p>` +
      `<ul>` +
      `<li><b>Your goal</b>—the role and salary you actually want in the next 60 days.</li>` +
      `<li><b>Your obstacle</b>—the one thing quietly slowing your search down.</li>` +
      `<li><b>The shift</b>—the hidden-market move most job seekers never make.</li>` +
      `</ul>` +
      `<p>One thing: we post a replay, but the replay can't answer <i>your</i> question. The live Q&A is where we look at your specific situation—and you have to be in the room for that. Come with the role you're chasing in mind; the more specific you are, the more you walk away with.</p>` +
      `<p>Reminder: the live-only bonus goes to the people in the room—it's not in the replay.</p>` +
      `<p><b>Join here → <a href="${join}">${join}</a></b></p>` +
      `<p>See you there,<br>The JobHackers team</p>`,
    ),
  });

  // 15 minutes before — urgency, one link, honest replay reframe
  list.push({
    key: "15m",
    ms: 15 * 60e3,
    subject: "We start in 15 minutes—your link's inside",
    html: wrap(
      `<p>Hi {{ subscriber.first_name }},</p>` +
      `<p>We're starting in <b>15 minutes.</b> Grab a notebook, close the other tabs, and jump in. Life happens—but the live Q&A and the live-only bonus can't be replayed.</p>` +
      `<p><b>Join now → <a href="${join}">${join}</a></b></p>` +
      `<p>See you inside,<br>The JobHackers team</p>`,
    ),
  });

  return list;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const params = new URL(req.url).searchParams;
    const publish = params.get("publish") === "1";
    const reset = params.get("reset") === "1";
    const admin = createClient(Deno.env.get("PROJECT_URL")!, Deno.env.get("SERVICE_KEY")!);
    const now = Date.now();

    // Clean slate: delete previously-created countdown broadcasts (drafts or scheduled).
    let deleted = 0;
    if (reset) {
      const r = await kit(`/broadcasts?per_page=500`);
      for (const b of (r.broadcasts || [])) {
        if ((b.description || "").startsWith("Countdown ")) {
          await fetch(`${KIT}/broadcasts/${b.id}`, { method: "DELETE", headers: { "X-Kit-Api-Key": kitKey } });
          deleted++;
        }
      }
      await admin.from("webinar_broadcasts").delete().neq("occurrence_id", "__none__");
    }

    const { data: events } = await admin.from("webinar_events").select("*").gt("start_time", new Date().toISOString());
    const { data: done } = await admin.from("webinar_broadcasts").select("occurrence_id,milestone");
    const seen = new Set((done || []).map((d) => `${d.occurrence_id}:${d.milestone}`));

    const created: any[] = [];
    for (const ev of events || []) {
      const tagName = `EVENT->RSVP->WEBINAR-${new Date(ev.start_time).toISOString().slice(0, 10)}`;
      let tagId: number | null = null;
      for (const m of milestones(ev)) {
        const dedupeKey = `${ev.occurrence_id}:${m.key}`;
        if (seen.has(dedupeKey)) continue;
        const sendAt = new Date(new Date(ev.start_time).getTime() - m.ms);
        if (sendAt.getTime() <= now) continue; // can't schedule a past send
        if (tagId === null) tagId = await ensureTag(tagName);

        const body: any = {
          subject: m.subject,
          content: m.html,
          description: `Countdown ${m.key} · ${tagName}`,
          public: false,
          subscriber_filter: [{ all: [{ type: "tag", ids: [tagId] }] }],
        };
        if (publish) body.send_at = sendAt.toISOString();

        const { broadcast } = await kit(`/broadcasts`, { method: "POST", body: JSON.stringify(body) });
        await admin.from("webinar_broadcasts").insert({
          occurrence_id: ev.occurrence_id, milestone: m.key, broadcast_id: broadcast.id,
          status: publish ? "scheduled" : "draft", send_at: sendAt.toISOString(),
        });
        created.push({ occurrence: ev.occurrence_id, milestone: m.key, id: broadcast.id, send_at: sendAt.toISOString() });
      }
    }
    return json({ ok: true, mode: publish ? "scheduled" : "draft", reset, deleted, created });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

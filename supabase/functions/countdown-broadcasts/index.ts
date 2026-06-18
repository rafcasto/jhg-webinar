// Edge Function: countdown-broadcasts
// Creates one Kit broadcast per upcoming occurrence × milestone (-48h/-24h/-1h/-15m),
// targeted to that occurrence's RSVP tag and anchored to the real start time.
// Idempotent via the webinar_broadcasts table.
//
// Query: ?publish=1  -> set send_at (schedules the real send). Default = draft (review first).
// Secrets: PROJECT_URL, SERVICE_KEY, KIT_API_KEY
// Invoke:  supabase.functions.invoke('countdown-broadcasts', { body:{} })  (or GET with ?publish=1)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KIT = "https://api.kit.com/v4";
const kitKey = Deno.env.get("KIT_API_KEY")!;
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

// milestone offsets (ms before start) + copy
function milestones(ev: any) {
  const { date, time } = fmt(ev.start_time, ev.timezone);
  const join = ev.join_url || "#";
  const wrap = (h: string) => `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#191c27">${h}</div>`;
  return [
    { key: "48h", ms: 48 * 3600e3,
      subject: "Two sleeps to go — here's why it matters",
      html: wrap(`<p>Hi {{ subscriber.first_name }},</p><p>In <b>48 hours</b> (<b>${date}, ${time}</b>) we go live. Most people don't struggle to get hired because they're not good enough — they struggle because <b>nobody taught them the playbook</b>.</p><p>The visible job market is only ~20% of the opportunities. The other 80% is hidden. We'll show you how to crack it. Block the time — see you soon.</p><p>— The JobHackers team</p>`) },
    { key: "24h", ms: 24 * 3600e3,
      subject: "Tomorrow: will it be worth it? (what members say)",
      html: wrap(`<p>Hi {{ subscriber.first_name }},</p><p>We go live <b>tomorrow, ${date} at ${time}</b>.</p><blockquote>"Two job offers within three weeks!" — Alexandra M.</blockquote><blockquote>"+30% salary increase while working full-time." — Zuber R.</blockquote><p>Anything specific you want covered? Just reply.</p><p>— The JobHackers team</p>`) },
    { key: "1h", ms: 1 * 3600e3,
      subject: "AGENDA for today's masterclass",
      html: wrap(`<p>Hi {{ subscriber.first_name }},</p><p>We're live in <b>one hour</b>. Agenda:</p><ul><li><b>GOAL</b> — the role + salary you want in 60 days</li><li><b>OBSTACLE</b> — the one thing slowing your search</li><li><b>SHIFT</b> — the hidden-market move most people miss</li></ul><p>Join here: <a href="${join}">${join}</a></p><p>See you there — The JobHackers team</p>`) },
    { key: "15m", ms: 15 * 60e3,
      subject: "We start in 15 minutes — your link",
      html: wrap(`<p>Hi {{ subscriber.first_name }},</p><p>We're starting in <b>15 minutes</b>. Jump in here:</p><p><a href="${join}">${join}</a></p><p>See you inside — The JobHackers team</p>`) },
  ];
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

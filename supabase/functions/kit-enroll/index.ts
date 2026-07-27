// Edge Function: kit-enroll
// Called after a lead event is recorded (RSVP or quiz). Subscribes the person
// in Kit and applies the event tag (e.g. EVENT->RSVP->WEBINAR-2026-06-25 or
// EVENT->QUIZ_COMPLETE->TRACKER), plus a source tag and custom fields.
//
// For webinar RSVPs it also looks up the matching occurrence in webinar_events
// (the tag encodes the date) and stamps calendar details onto the subscriber:
//   webinar_date, webinar_time, join_url, occurrence_id, zoom_meeting_id
// The immediate welcome email (a Kit Sequence step) uses these as merge fields
// so its "add to calendar" links are correct per-person.
//
// Secrets: PROJECT_URL, SERVICE_KEY, KIT_API_KEY
//          KIT_SEQUENCE_ID       (webinar show-up sequence: welcome + value email)
//          KIT_QUIZ_SEQUENCE_ID  (lead-magnet gift sequence, enrolled on quiz done)
//
// Invoke:  supabase.functions.invoke('kit-enroll', { body: { lead_id } })
//          where lead_id is a jobhackers_leads row id.
//
// The response includes `welcome_enrolled`, `quiz_enrolled` and a `warnings[]`
// array so enrollment failures are visible instead of being silently swallowed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KIT = "https://api.kit.com/v4";
const kitKey = Deno.env.get("KIT_API_KEY")!;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function kit(path: string, init: RequestInit = {}) {
  const res = await fetch(`${KIT}${path}`, {
    ...init,
    headers: { "X-Kit-Api-Key": kitKey, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`Kit ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

/** Find a tag by name or create it; returns its id. */
async function ensureTag(name: string): Promise<number> {
  const { tags } = await kit(`/tags`);
  const found = (tags || []).find((t: any) => t.name.toLowerCase() === name.toLowerCase());
  if (found) return found.id;
  const { tag } = await kit(`/tags`, { method: "POST", body: JSON.stringify({ name }) });
  return tag.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { lead_id } = await req.json();
    if (!lead_id) return json({ error: "lead_id required" }, 400);

    const admin = createClient(Deno.env.get("PROJECT_URL")!, Deno.env.get("SERVICE_KEY")!);
    const { data: lead, error } = await admin
      .from("jobhackers_leads").select("*").eq("id", lead_id).single();
    if (error || !lead) return json({ error: "lead not found" }, 404);

    const warnings: string[] = [];

    // Look up the webinar occurrence this RSVP is for (the tag encodes the date),
    // so we can attach calendar details for the per-person welcome email.
    const eventFields: Record<string, string> = {};
    const md = (lead.tag || "").match(/WEBINAR-(\d{4}-\d{2}-\d{2})/);
    if (md) {
      const day = md[1];
      const next = new Date(`${day}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      const { data: ev } = await admin
        .from("webinar_events").select("*")
        .gte("start_time", `${day}T00:00:00Z`)
        .lt("start_time", next.toISOString())
        .order("start_time", { ascending: true })
        .limit(1).maybeSingle();
      if (ev) {
        const start = new Date(ev.start_time);
        eventFields.webinar_date = start.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: ev.timezone });
        eventFields.webinar_time = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: ev.timezone });
        eventFields.join_url = ev.join_url || "";
        eventFields.occurrence_id = String(ev.occurrence_id ?? "");
        eventFields.zoom_meeting_id = String(ev.zoom_meeting_id ?? "");
      }
    }

    // 1) upsert subscriber + custom fields
    const { subscriber } = await kit(`/subscribers`, {
      method: "POST",
      body: JSON.stringify({
        email_address: lead.email,
        first_name: lead.first_name || undefined,
        fields: {
          last_name: lead.last_name || "",
          stage: lead.stage || "",
          source: lead.source || "",
          location: lead.location || "",
          lead_score: String(lead.score ?? ""),
          ...eventFields,
        },
      }),
    });

    // 2) apply the event tag + a source tag
    const tagNames = [lead.tag, `source-${lead.source || "direct"}`].filter(Boolean);
    for (const name of tagNames) {
      try {
        const tagId = await ensureTag(name);
        await kit(`/tags/${tagId}/subscribers/${subscriber.id}`, { method: "POST" });
      } catch (e) {
        warnings.push(`tag "${name}": ${String(e)}`);
      }
    }

    // 3a) welcome + value-email sequence (immediate welcome pushes calendar scheduling).
    //     Only enroll RSVPs (not quiz-only rows) so we don't welcome non-registrants.
    const seq = Deno.env.get("KIT_SEQUENCE_ID");
    let welcome_enrolled = false;
    if (seq && md) {
      try {
        await kit(`/sequences/${seq}/subscribers/${subscriber.id}`, { method: "POST" });
        welcome_enrolled = true;
      } catch (e) {
        warnings.push(`welcome sequence ${seq}: ${String(e)}`);
      }
    }

    // 3b) lead-magnet delivery: when the person completes the quiz (activation
    //     stage), enroll them in the gift sequence so Kit emails their
    //     "Find Your Target Role in 5 Prompts" playbook. The QUIZ_COMPLETE tag
    //     is applied above too, so a tag-based Kit automation works as well.
    const quizSeq = Deno.env.get("KIT_QUIZ_SEQUENCE_ID");
    let quiz_enrolled = false;
    if (lead.stage === "activation") {
      if (!quizSeq) {
        warnings.push("KIT_QUIZ_SEQUENCE_ID is not set — quiz-completer not enrolled in the gift sequence");
      } else {
        try {
          await kit(`/sequences/${quizSeq}/subscribers/${subscriber.id}`, { method: "POST" });
          quiz_enrolled = true;
        } catch (e) {
          warnings.push(`quiz sequence ${quizSeq}: ${String(e)}`);
        }
      }
    }

    if (warnings.length) console.error("[kit-enroll] warnings:", JSON.stringify(warnings));

    return json({
      ok: true,
      kit_subscriber_id: subscriber.id,
      subscriber_state: subscriber.state ?? null,
      stage: lead.stage,
      tags: tagNames,
      welcome_enrolled,
      quiz_enrolled,
      warnings,
      event: eventFields,
    });
  } catch (e) {
    console.error("[kit-enroll] fatal:", String(e));
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Edge Function: kit-enroll
// Called after a lead event is recorded (RSVP or quiz). Subscribes the person
// in Kit and applies the event tag (e.g. EVENT->RSVP->WEBINAR-2026-06-25 or
// EVENT->ANSWER->WEBINAR-QUIZ), plus a source tag and custom fields.
//
// Secrets: SUPABASE_URL, SUPABASE_SECRET_KEY, KIT_API_KEY
//          KIT_SEQUENCE_ID (optional)
//
// Invoke:  supabase.functions.invoke('kit-enroll', { body: { lead_id } })
//          where lead_id is a jobhackers_leads row id.

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
        },
      }),
    });

    // 2) apply the event tag + a source tag
    const tagNames = [lead.tag, `source-${lead.source || "direct"}`].filter(Boolean);
    for (const name of tagNames) {
      const tagId = await ensureTag(name);
      await kit(`/tags/${tagId}/subscribers/${subscriber.id}`, { method: "POST" }).catch(() => {});
    }

    // 3) optional countdown sequence (use scheduled dispatch for event-anchored timing)
    const seq = Deno.env.get("KIT_SEQUENCE_ID");
    if (seq) {
      await kit(`/sequences/${seq}/subscribers/${subscriber.id}`, { method: "POST" }).catch(() => {});
    }

    return json({ ok: true, kit_subscriber_id: subscriber.id, tags: tagNames });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

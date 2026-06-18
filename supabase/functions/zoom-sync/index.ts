// Edge Function: zoom-sync
// Fetches the next occurrences of the two recurring Zoom meetings and upserts
// them into webinar_events. Run on a schedule (e.g. hourly via pg_cron / a
// Supabase scheduled function) and/or on demand.
//
// Secrets:
//   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET  (Server-to-Server OAuth)
//   ZOOM_MEETING_IDS  (comma-separated, the two recurring meeting IDs)
//   SUPABASE_URL, SUPABASE_SECRET_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

async function zoomToken(): Promise<string> {
  const id = Deno.env.get("ZOOM_ACCOUNT_ID")!;
  const auth = btoa(`${Deno.env.get("ZOOM_CLIENT_ID")}:${Deno.env.get("ZOOM_CLIENT_SECRET")}`);
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${id}`,
    { method: "POST", headers: { Authorization: `Basic ${auth}` } }
  );
  if (!res.ok) throw new Error(`Zoom token ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function getMeeting(token: string, meetingId: string) {
  const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}?show_previous_occurrences=false`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Zoom meeting ${meetingId} ${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const ids = (Deno.env.get("ZOOM_MEETING_IDS") || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!ids.length) return new Response(JSON.stringify({ error: "ZOOM_MEETING_IDS not set" }), { status: 400, headers: cors });

    const token = await zoomToken();
    const admin = createClient(Deno.env.get("PROJECT_URL")!, Deno.env.get("SERVICE_KEY")!);
    const now = Date.now();
    const rows: any[] = [];

    for (const id of ids) {
      const m = await getMeeting(token, id);
      // Recurring meeting -> array of occurrences; single -> use start_time
      const occ = (m.occurrences || []).filter((o: any) =>
        o.status === "available" && new Date(o.start_time).getTime() > now);
      const list = occ.length ? occ : (m.start_time ? [{ occurrence_id: "0", start_time: m.start_time, duration: m.duration }] : []);
      for (const o of list) {
        rows.push({
          zoom_meeting_id: String(id),
          occurrence_id: String(o.occurrence_id ?? "0"),
          topic: m.topic,
          start_time: o.start_time,
          duration_min: o.duration ?? m.duration,
          timezone: m.timezone,
          join_url: m.join_url,
          registration_url: m.registration_url ?? null,
          status: "scheduled",
          fetched_at: new Date().toISOString(),
        });
      }
    }

    if (rows.length) {
      const { error } = await admin.from("webinar_events").upsert(rows, { onConflict: "zoom_meeting_id,occurrence_id" });
      if (error) throw error;
    }
    return new Response(JSON.stringify({ ok: true, synced: rows.length }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});

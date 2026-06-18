// Edge Function: zoom-register
// Registers the lead for the webinar. Tries to bind them to the specific
// occurrence (date) they chose; if the meeting's registration type rejects
// occurrence binding, falls back to a standard registration (register once).
// Scope: meeting:write:registrant:admin
//
// Secrets: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
// Invoke: supabase.functions.invoke('zoom-register',
//           { body: { meeting_id, occurrence_id, email, first_name, last_name } })

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function zoomToken(): Promise<string> {
  const id = Deno.env.get("ZOOM_ACCOUNT_ID")!;
  const auth = btoa(`${Deno.env.get("ZOOM_CLIENT_ID")}:${Deno.env.get("ZOOM_CLIENT_SECRET")}`);
  const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${id}`,
    { method: "POST", headers: { Authorization: `Basic ${auth}` } });
  if (!r.ok) throw new Error(`Zoom token ${r.status}`);
  return (await r.json()).access_token;
}

async function addRegistrant(token: string, meetingId: string, occ: string | null, body: unknown) {
  const qs = occ ? `?occurrence_ids=${occ}` : "";
  const r = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/registrants${qs}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, data: await r.json() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { meeting_id, occurrence_id, email, first_name, last_name } = await req.json();
    if (!meeting_id || !email) return json({ error: "meeting_id and email required" }, 400);

    const token = await zoomToken();
    const body = { email, first_name: first_name || email.split("@")[0], last_name: last_name || "-" };

    // 1) try to bind to the chosen occurrence
    let res = occurrence_id ? await addRegistrant(token, meeting_id, occurrence_id, body) : { ok: false };
    let bound = res.ok;
    // 2) fallback: standard registration (works for register-once meetings)
    if (!res.ok) res = await addRegistrant(token, meeting_id, null, body);

    if (!res.ok) return json({ error: "zoom_register_failed", detail: res.data }, res.status || 500);
    return json({ ok: true, occurrence_bound: bound, join_url: res.data.join_url, registrant_id: res.data.registrant_id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

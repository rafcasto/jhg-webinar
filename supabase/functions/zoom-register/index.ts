// Edge Function: zoom-register
// Binds a registrant to the specific occurrence (date) they chose.
// Backs: POST /meetings/{meetingId}/registrants?occurrence_ids={occurrence_id}
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { meeting_id, occurrence_id, email, first_name, last_name } = await req.json();
    if (!meeting_id || !occurrence_id || !email) return json({ error: "meeting_id, occurrence_id, email required" }, 400);

    const token = await zoomToken();
    const url = `https://api.zoom.us/v2/meetings/${meeting_id}/registrants?occurrence_ids=${occurrence_id}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, first_name: first_name || email.split("@")[0], last_name: last_name || "-" }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: "zoom_register_failed", detail: data }, r.status);

    // data.join_url is this registrant's personal join link for the chosen date
    return json({ ok: true, join_url: data.join_url, registrant_id: data.registrant_id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

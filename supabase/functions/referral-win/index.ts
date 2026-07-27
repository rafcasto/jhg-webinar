// Edge Function: referral-win
// Called (fire-and-forget) when a referrer crosses the referral target and
// earns a 30-minute mentor call. It tags the referrer in Kit as a winner so
// the (Kit-side) Calendly booking automation fires. The 3-email booking
// sequence + "stop when booked" logic lives in Kit, not here.
//
// Secrets: PROJECT_URL, SERVICE_KEY, KIT_API_KEY
//          KIT_REFERRAL_WON_TAG (optional, default 'EVENT->REFERRAL->WON_CALL')
//          KIT_REFERRAL_SEQUENCE_ID (optional — enroll into a Kit sequence too)
//
// Invoke: supabase.functions.invoke('referral-win', { body: { referrer_email } })

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KIT = "https://api.kit.com/v4";
const kitKey = Deno.env.get("KIT_API_KEY")!;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function kit(path: string, init: RequestInit = {}) {
  const res = await fetch(`${KIT}${path}`, {
    ...init,
    headers: { "X-Kit-Api-Key": kitKey, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`Kit ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

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
    const { referrer_email } = await req.json();
    if (!referrer_email) return json({ error: "referrer_email required" }, 400);

    const admin = createClient(Deno.env.get("PROJECT_URL")!, Deno.env.get("SERVICE_KEY")!);

    // Winner details (for the subscriber first_name + referral count merge field).
    const { data: win } = await admin
      .from("referral_winners").select("*").eq("email", referrer_email).maybeSingle();

    // Upsert the subscriber (they should already exist from registration).
    const { subscriber } = await kit(`/subscribers`, {
      method: "POST",
      body: JSON.stringify({
        email_address: referrer_email,
        first_name: win?.first_name || undefined,
        fields: { referral_count: String(win?.referral_count ?? "") },
      }),
    });

    // Apply the winner tag → triggers the Kit booking automation.
    const wonTag = Deno.env.get("KIT_REFERRAL_WON_TAG") || "EVENT->REFERRAL->WON_CALL";
    const tagId = await ensureTag(wonTag);
    await kit(`/tags/${tagId}/subscribers/${subscriber.id}`, { method: "POST" }).catch(() => {});

    // Optionally also enroll into a dedicated Kit sequence.
    const seq = Deno.env.get("KIT_REFERRAL_SEQUENCE_ID");
    if (seq) await kit(`/sequences/${seq}/subscribers/${subscriber.id}`, { method: "POST" }).catch(() => {});

    return json({ ok: true, kit_subscriber_id: subscriber.id, tag: wonTag });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

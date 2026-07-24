// Edge Function: event-ics
// One "add to calendar" endpoint for a webinar occurrence.
//   default        -> downloads an .ics (Apple Calendar, Outlook desktop, etc.)
//   ?to=google     -> 302 redirect to a Google Calendar "add event" URL
//   ?to=outlook    -> 302 redirect to an Outlook Web "add event" URL
//
// All times are UTC (…Z), so every calendar app renders the event in the
// recipient's OWN local timezone — no per-attendee merge fields needed. Because
// the only input is ?o=<occurrence_id>, email links can be built from a single
// merge field (e.g. ?o={{ subscriber.occurrence_id }}) and work per-person.
//
// Public (verify_jwt = false) so it can be opened straight from an email link.
//
// Secrets: PROJECT_URL, SERVICE_KEY
// Usage:   GET /functions/v1/event-ics?o=<occurrence_id>[&m=<meeting_id>][&to=google|outlook]

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ICS UTC stamp: 2026-08-18T21:00:00Z -> 20260818T210000Z
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// Escape per RFC 5545 (commas, semicolons, backslashes, newlines).
const esc = (s: string) => (s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
// Fold long lines to <=75 octets.
const fold = (line: string) => {
  const out: string[] = [];
  let s = line;
  while (s.length > 74) { out.push(s.slice(0, 74)); s = " " + s.slice(74); }
  out.push(s);
  return out.join("\r\n");
};

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const occ = url.searchParams.get("o");
    const meeting = url.searchParams.get("m");
    const to = url.searchParams.get("to");
    if (!occ) return new Response("missing ?o=<occurrence_id>", { status: 400 });

    const admin = createClient(Deno.env.get("PROJECT_URL")!, Deno.env.get("SERVICE_KEY")!);
    let q = admin.from("webinar_events").select("*").eq("occurrence_id", occ);
    if (meeting) q = q.eq("zoom_meeting_id", meeting);
    const { data: ev, error } = await q.limit(1).single();
    if (error || !ev) return new Response("event not found", { status: 404 });

    const start = new Date(ev.start_time);
    const end = new Date(start.getTime() + (ev.duration_min ?? 90) * 60000);
    const join = ev.join_url || "";
    const title = ev.topic || "JobHackers MasterClass";
    const detailsPlain =
      "Your free 90-minute live MasterClass with David & Laurent. Join here: " + join +
      "—come with the role you're chasing in mind.";

    // --- Redirect modes (Google / Outlook) ---
    if (to === "google") {
      const g = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}` +
        `&dates=${stamp(start)}/${stamp(end)}&details=${encodeURIComponent(detailsPlain)}&location=${encodeURIComponent(join)}`;
      return Response.redirect(g, 302);
    }
    if (to === "outlook") {
      const o = `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
        `&startdt=${start.toISOString()}&enddt=${end.toISOString()}&subject=${encodeURIComponent(title)}` +
        `&body=${encodeURIComponent(detailsPlain)}&location=${encodeURIComponent(join)}`;
      return Response.redirect(o, 302);
    }

    // --- Default: .ics download ---
    const desc =
      "Your free 90-minute live MasterClass with David & Laurent.\\n\\nJoin here: " + join +
      "\\n\\nCome with the role you're chasing in mind—the more specific you are, the more you walk away with.";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//JobHackers Global//Webinar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:webinar-${ev.zoom_meeting_id}-${ev.occurrence_id}@jobhackers.global`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      fold(`SUMMARY:${esc(title)}`),
      fold(`DESCRIPTION:${desc}`),
      fold(`LOCATION:${esc(join)}`),
      fold(`URL:${esc(join)}`),
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Your MasterClass starts in 30 minutes",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const body = lines.join("\r\n") + "\r\n";

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8; method=PUBLISH",
        "Content-Disposition": 'attachment; filename="masterclass.ics"',
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});

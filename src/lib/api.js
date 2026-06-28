import { supabase } from "./supabase.js";

/** Fetch all editable content blocks for a page as a { key: value } map. */
export async function getContent(page) {
  const { data, error } = await supabase
    .from("content_blocks")
    .select("key,value")
    .eq("page", page)
    .order("position");
  if (error) throw error;
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]));
}

/** Fetch enabled CTAs for a page, ordered. */
export async function getCtas(page) {
  const { data, error } = await supabase
    .from("ctas")
    .select("*")
    .eq("page", page)
    .eq("enabled", true)
    .order("position");
  if (error) throw error;
  return data || [];
}

/** Fetch the enabled quiz: questions with their options, ordered. */
export async function getQuiz() {
  const { data: questions, error } = await supabase
    .from("quiz_questions")
    .select("id,position,prompt,help_text,type,scored")
    .eq("enabled", true)
    .order("position");
  if (error) throw error;

  const ids = (questions || []).map((q) => q.id);
  if (!ids.length) return [];

  const { data: options, error: e2 } = await supabase
    .from("quiz_options")
    .select("id,question_id,position,label,value")
    .in("question_id", ids)
    .eq("enabled", true)
    .order("position");
  if (e2) throw e2;

  return questions.map((q) => ({
    ...q,
    options: (options || []).filter((o) => o.question_id === q.id),
  }));
}

/** The next upcoming webinar event (synced from Zoom), or null. */
export async function getNextEvent() {
  const { data, error } = await supabase
    .from("webinar_events")
    .select("*")
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/** The nearest N upcoming webinar events (for showing the 2 closest dates). */
export async function getNextEvents(limit = 2) {
  const { data, error } = await supabase
    .from("webinar_events")
    .select("*")
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ---------- Event taxonomy ----------

/** Source attribution: ?source= (or utm_source) from the URL, else 'direct'. */
export function readSource() {
  const p = new URLSearchParams(window.location.search);
  return p.get("source") || p.get("utm_source") || "direct";
}

/** Tag for a webinar RSVP, e.g. EVENT->RSVP->WEBINAR-2026-06-25. */
export function webinarRsvpTag(event) {
  let datePart = "TBD";
  if (event?.start_time) datePart = new Date(event.start_time).toISOString().slice(0, 10);
  return `EVENT->RSVP->WEBINAR-${datePart}`;
}

/** Tag for a quiz submission. */
export const QUIZ_TAG = "EVENT->ANSWER->WEBINAR-QUIZ";

/** Step 1 — record the RSVP (acquisition) event. Returns event row id. */
export async function registerLead({ first_name, last_name, email, location, phone, source, tag, variant }) {
  const { data, error } = await supabase.rpc("register_lead", {
    p_first_name: first_name,
    p_last_name: last_name || null,
    p_email: email,
    p_tag: tag,
    p_source: source || null,
    p_location: location || null,
    p_phone: phone || null,
    p_variant: variant || null,
  });
  if (error) throw error;
  return data; // uuid
}

/** Step 2 — record the quiz (activation) event + score. Returns { id, score }. */
export async function completeQuiz({ email, answers, source }) {
  const { data, error } = await supabase.rpc("complete_quiz", {
    p_email: email,
    p_answers: answers,
    p_source: source || null,
    p_tag: QUIZ_TAG,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Fire-and-forget Kit enrollment via the `kit-enroll` Edge Function.
 * Never blocks the funnel: if the function isn't deployed yet it just logs.
 */
export async function enrollInKit(eventId) {
  try {
    const { error } = await supabase.functions.invoke("kit-enroll", { body: { lead_id: eventId } });
    if (error) console.warn("[kit-enroll] not available yet:", error.message);
  } catch (e) {
    console.warn("[kit-enroll] skipped:", e.message);
  }
}


/**
 * Bind the registrant to the Zoom occurrence (date) they chose, via the
 * `zoom-register` Edge Function. Fire-and-forget: never blocks the funnel.
 */
export async function zoomRegister({ meeting_id, occurrence_id, email, first_name, last_name }) {
  if (!meeting_id || !occurrence_id) return;
  try {
    const { error } = await supabase.functions.invoke("zoom-register", {
      body: { meeting_id, occurrence_id, email, first_name, last_name },
    });
    if (error) console.warn("[zoom-register] not available yet:", error.message);
  } catch (e) {
    console.warn("[zoom-register] skipped:", e.message);
  }
}

// ---------- A/B layout test (admin) ----------

/** Read the landing experiment config. */
export async function getLandingExperiment() {
  const { data, error } = await supabase
    .from("experiments").select("*").eq("key", "landing").maybeSingle();
  if (error) throw error;
  return data;
}

/** Update the landing experiment (admin only — enforced by RLS). */
export async function saveLandingExperiment({ enabled, weight_a, weight_b }) {
  const { error } = await supabase
    .from("experiments")
    .update({ enabled, weight_a, weight_b })
    .eq("key", "landing");
  if (error) throw error;
}

/**
 * Pull A/B results: exposures per variant + unique registrations per variant.
 * Returns { a: {exposures, registrations}, b: {...} }.
 */
export async function getAbResults() {
  const [{ data: exp }, { data: leads }] = await Promise.all([
    supabase.from("ab_exposures").select("variant,count").eq("experiment", "landing"),
    supabase.from("jobhackers_leads").select("email,variant").eq("stage", "acquisition"),
  ]);

  const out = { a: { exposures: 0, registrations: 0 }, b: { exposures: 0, registrations: 0 } };
  (exp || []).forEach((r) => { if (out[r.variant]) out[r.variant].exposures = Number(r.count) || 0; });

  // unique emails per variant
  const seen = { a: new Set(), b: new Set() };
  (leads || []).forEach((l) => { if (l.variant && seen[l.variant]) seen[l.variant].add(l.email); });
  out.a.registrations = seen.a.size;
  out.b.registrations = seen.b.size;
  return out;
}

import { supabase } from "./supabase.js";

// Sticky storage key — once a visitor is bucketed they stay bucketed.
const LS_KEY = "jhg_ab_landing";
const EXPERIMENT = "landing";

/** Read the experiment config row (enabled + weights). Falls back to A-only. */
export async function getExperiment() {
  try {
    const { data } = await supabase
      .from("experiments").select("enabled,weight_a,weight_b").eq("key", EXPERIMENT).maybeSingle();
    return data || { enabled: false, weight_a: 100, weight_b: 0 };
  } catch {
    return { enabled: false, weight_a: 100, weight_b: 0 };
  }
}

/** Force a variant via ?v=a / ?v=b (for QA/preview). Returns 'a' | 'b' | null. */
function forcedVariant() {
  const v = new URLSearchParams(window.location.search).get("v");
  return v === "a" || v === "b" ? v : null;
}

function weightedPick(wa, wb) {
  const a = Math.max(0, Number(wa) || 0);
  const b = Math.max(0, Number(wb) || 0);
  if (a + b === 0) return "a";
  return Math.random() * (a + b) < a ? "a" : "b";
}

/**
 * Resolve which landing variant this visitor sees.
 * Returns { variant: 'a'|'b', forced: boolean }.
 * - ?v= always wins (forced, not counted as a real exposure).
 * - If the experiment is off, everyone gets A.
 * - Otherwise: reuse the visitor's stored bucket, or pick by weight and store it.
 */
export async function resolveVariant() {
  const forced = forcedVariant();
  if (forced) return { variant: forced, forced: true };

  const exp = await getExperiment();
  if (!exp.enabled) return { variant: "a", forced: false };

  let variant = localStorage.getItem(LS_KEY);
  if (variant !== "a" && variant !== "b") {
    variant = weightedPick(exp.weight_a, exp.weight_b);
    try { localStorage.setItem(LS_KEY, variant); } catch {}
  }
  return { variant, forced: false };
}

/** Count an impression for a variant (fire-and-forget, never blocks render). */
export function recordExposure(variant) {
  if (variant !== "a" && variant !== "b") return;
  supabase.rpc("record_ab_exposure", { p_experiment: EXPERIMENT, p_variant: variant })
    .then(({ error }) => { if (error) console.warn("[ab] exposure skipped:", error.message); })
    .catch(() => {});
}

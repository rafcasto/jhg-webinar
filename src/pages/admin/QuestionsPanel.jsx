import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";

const FLAGS = ["", "ai-anxious", "vip-signal", "below-icp", "manual-review"];
const FITS = ["", "qualified", "below-icp"];
const TYPES = ["single", "multi", "text"];

export default function QuestionsPanel() {
  const [questions, setQuestions] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: qs } = await supabase.from("quiz_questions").select("*").order("position");
    const { data: opts } = await supabase.from("quiz_options").select("*").order("position");
    setQuestions((qs || []).map((q) => ({ ...q, options: (opts || []).filter((o) => o.question_id === q.id) })));
  }
  useEffect(() => { load(); }, []);
  if (!questions) return <p className="muted">Loading…</p>;

  const setQ = (qid, patch) => setQuestions((qs) => qs.map((q) => q.id === qid ? { ...q, ...patch } : q));
  const setO = (qid, oid, patch) => setQuestions((qs) => qs.map((q) =>
    q.id !== qid ? q : { ...q, options: q.options.map((o) => o.id === oid ? { ...o, ...patch } : o) }));

  async function saveAll() {
    setSaving(true); setStatus("");
    try {
      for (const q of questions) {
        const { error: e1 } = await supabase.from("quiz_questions")
          .update({
            prompt: q.prompt, help_text: q.help_text, type: q.type,
            scored: q.scored, required: q.required, enabled: q.enabled, position: q.position,
          })
          .eq("id", q.id);
        if (e1) throw e1;
        for (const o of q.options) {
          const { error: e2 } = await supabase.from("quiz_options")
            .update({
              label: o.label, value: o.value, position: o.position, enabled: o.enabled,
              archetype: o.archetype || null,
              readiness: Number(o.readiness) || 0,
              fit_gate: o.fit_gate || null,
              obstacle: o.obstacle || null,
              flag: o.flag || null,
              is_other: !!o.is_other,
            })
            .eq("id", o.id);
          if (e2) throw e2;
        }
      }
      setStatus("Saved ✓");
      return true;
    } catch (e) { setStatus("Error: " + e.message); return false; }
    finally { setSaving(false); }
  }

  async function addQuestion() {
    await saveAll();
    const position = (questions.at(-1)?.position || 0) + 1;
    await supabase.from("quiz_questions").insert({ prompt: "New question", type: "single", position });
    load();
  }
  async function delQuestion(id) {
    if (!confirm("Delete this question and its options?")) return;
    await supabase.from("quiz_questions").delete().eq("id", id);
    load();
  }
  async function addOption(q) {
    await saveAll();
    const position = (q.options.at(-1)?.position || 0) + 1;
    await supabase.from("quiz_options").insert({ question_id: q.id, label: "New option", value: `opt_${position}`, readiness: 0, position });
    load();
  }
  async function delOption(id) {
    await supabase.from("quiz_options").delete().eq("id", id);
    load();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="adm-h" style={{ margin: 0 }}>Quiz — Compass</h1>
        <button className="btn btn--secondary" onClick={addQuestion}>+ Add question</button>
      </div>
      <p className="muted" style={{ marginBottom: 18, maxWidth: 760 }}>
        Scoring is driven by the <b>metadata on each option</b>, not question order — so you can reorder,
        rename, add or remove questions freely. <b>Readiness</b> (0–3) sums into the 0–6 score → heat.
        <b> Fit gate</b> caps the grade (any <code>below-icp</code> option caps at D/E). <b>Obstacle</b> routes
        messaging. <b>Archetype</b> sets the persona (Q1). <b>Flag</b> adds a signal. Set a question <b>Type</b> to
        <code> text</code> for an optional open-text question (no options).
      </p>

      {questions.map((q, i) => (
        <div className="adm-panel" key={q.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong>Q{i + 1}</strong>
            <button className="btn btn--ghost" onClick={() => delQuestion(q.id)}>Delete question</button>
          </div>
          <div className="adm-frow" style={{ marginBottom: 10 }}>
            <label>Prompt</label>
            <input className="admin-input" value={q.prompt} onChange={(e) => setQ(q.id, { prompt: e.target.value })} />
          </div>
          <div className="adm-frow" style={{ marginBottom: 12 }}>
            <label>Help text (optional)</label>
            <input className="admin-input" value={q.help_text || ""} onChange={(e) => setQ(q.id, { help_text: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 20, marginBottom: 14, alignItems: "center", fontFamily: "var(--font-display)", fontSize: 14, flexWrap: "wrap" }}>
            <label>Type&nbsp;
              <select className="admin-input" style={{ width: 100, display: "inline-block" }} value={q.type} onChange={(e) => setQ(q.id, { type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={q.required} onChange={(e) => setQ(q.id, { required: e.target.checked })} /> Required</label>
            <label><input type="checkbox" checked={q.enabled} onChange={(e) => setQ(q.id, { enabled: e.target.checked })} /> Enabled</label>
            <label>Order <input className="admin-input" style={{ width: 60, display: "inline-block" }} type="number" value={q.position} onChange={(e) => setQ(q.id, { position: Number(e.target.value) })} /></label>
          </div>

          {q.type === "text" ? (
            <p className="muted" style={{ margin: 0 }}>Open-text question — no options. Stored on the lead as context (not scored).</p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead><tr>
                    <th>Label</th><th>Value</th><th>Read.</th><th>Archetype</th>
                    <th>Fit gate</th><th>Obstacle</th><th>Flag</th><th>Other</th><th>On</th><th></th>
                  </tr></thead>
                  <tbody>
                    {q.options.map((o) => (
                      <tr key={o.id}>
                        <td><input className="admin-input" value={o.label} onChange={(e) => setO(q.id, o.id, { label: e.target.value })} /></td>
                        <td><input className="admin-input" style={{ width: 90 }} value={o.value} onChange={(e) => setO(q.id, o.id, { value: e.target.value })} /></td>
                        <td style={{ width: 64 }}><input className="admin-input" type="number" value={o.readiness ?? 0} onChange={(e) => setO(q.id, o.id, { readiness: Number(e.target.value) })} /></td>
                        <td><input className="admin-input" style={{ width: 120 }} value={o.archetype || ""} placeholder="—" onChange={(e) => setO(q.id, o.id, { archetype: e.target.value || null })} /></td>
                        <td>
                          <select className="admin-input" style={{ width: 100 }} value={o.fit_gate || ""} onChange={(e) => setO(q.id, o.id, { fit_gate: e.target.value || null })}>
                            {FITS.map((f) => <option key={f} value={f}>{f || "—"}</option>)}
                          </select>
                        </td>
                        <td><input className="admin-input" style={{ width: 96 }} value={o.obstacle || ""} placeholder="—" onChange={(e) => setO(q.id, o.id, { obstacle: e.target.value || null })} /></td>
                        <td>
                          <select className="admin-input" style={{ width: 120 }} value={o.flag || ""} onChange={(e) => setO(q.id, o.id, { flag: e.target.value || null })}>
                            {FLAGS.map((f) => <option key={f} value={f}>{f || "—"}</option>)}
                          </select>
                        </td>
                        <td style={{ width: 46 }}><input type="checkbox" checked={!!o.is_other} onChange={(e) => setO(q.id, o.id, { is_other: e.target.checked })} /></td>
                        <td style={{ width: 40 }}><input type="checkbox" checked={o.enabled} onChange={(e) => setO(q.id, o.id, { enabled: e.target.checked })} /></td>
                        <td style={{ width: 44 }}><button className="btn btn--ghost" onClick={() => delOption(o.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn--secondary" style={{ marginTop: 12 }} onClick={() => addOption(q)}>+ Add option</button>
            </>
          )}
        </div>
      ))}

      <div className="adm-savebar">
        <span className={"status" + (status.startsWith("Saved") ? " ok" : "")}>{status || "Edit then save. Adding/removing saves automatically."}</span>
        <button className="btn btn--primary" onClick={saveAll} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </>
  );
}

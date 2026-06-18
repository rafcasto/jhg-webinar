import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";

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
          .update({ prompt: q.prompt, scored: q.scored, enabled: q.enabled, position: q.position, help_text: q.help_text })
          .eq("id", q.id);
        if (e1) throw e1;
        for (const o of q.options) {
          const { error: e2 } = await supabase.from("quiz_options")
            .update({ label: o.label, value: o.value, score: o.score, archetype: o.archetype, enabled: o.enabled, position: o.position })
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
    await supabase.from("quiz_questions").insert({ prompt: "New question", position });
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
    await supabase.from("quiz_options").insert({ question_id: q.id, label: "New option", value: `opt_${position}`, score: 0, position });
    load();
  }
  async function delOption(id) {
    await supabase.from("quiz_options").delete().eq("id", id);
    load();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="adm-h" style={{ margin: 0 }}>Quiz questions</h1>
        <button className="btn btn--secondary" onClick={addQuestion}>+ Add question</button>
      </div>
      <p className="muted" style={{ marginBottom: 18 }}>
        Scores feed the background lead score; set a question to <b>not scored</b> for attribution only.
        Add an <b>archetype</b> on an option to tag the lead's persona.
      </p>

      {questions.map((q, i) => (
        <div className="adm-panel" key={q.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong>Q{i + 1}</strong>
            <button className="btn btn--ghost" onClick={() => delQuestion(q.id)}>Delete question</button>
          </div>
          <div className="adm-frow" style={{ marginBottom: 12 }}>
            <label>Prompt</label>
            <input className="admin-input" value={q.prompt} onChange={(e) => setQ(q.id, { prompt: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 24, marginBottom: 14, fontFamily: "var(--font-display)", fontSize: 14 }}>
            <label><input type="checkbox" checked={q.scored} onChange={(e) => setQ(q.id, { scored: e.target.checked })} /> Scored</label>
            <label><input type="checkbox" checked={q.enabled} onChange={(e) => setQ(q.id, { enabled: e.target.checked })} /> Enabled</label>
            <label>Order <input className="admin-input" style={{ width: 60, display: "inline-block" }} type="number" value={q.position} onChange={(e) => setQ(q.id, { position: Number(e.target.value) })} /></label>
          </div>
          <table className="admin-table">
            <thead><tr><th>Label</th><th>Value</th><th>Score</th><th>Archetype</th><th>On</th><th></th></tr></thead>
            <tbody>
              {q.options.map((o) => (
                <tr key={o.id}>
                  <td><input className="admin-input" value={o.label} onChange={(e) => setO(q.id, o.id, { label: e.target.value })} /></td>
                  <td><input className="admin-input" value={o.value} onChange={(e) => setO(q.id, o.id, { value: e.target.value })} /></td>
                  <td style={{ width: 84 }}><input className="admin-input" type="number" value={o.score} onChange={(e) => setO(q.id, o.id, { score: Number(e.target.value) })} /></td>
                  <td><input className="admin-input" value={o.archetype || ""} placeholder="—" onChange={(e) => setO(q.id, o.id, { archetype: e.target.value || null })} /></td>
                  <td style={{ width: 50 }}><input type="checkbox" checked={o.enabled} onChange={(e) => setO(q.id, o.id, { enabled: e.target.checked })} /></td>
                  <td style={{ width: 60 }}><button className="btn btn--ghost" onClick={() => delOption(o.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn--secondary" style={{ marginTop: 12 }} onClick={() => addOption(q)}>+ Add option</button>
        </div>
      ))}

      <div className="adm-savebar">
        <span className={"status" + (status.startsWith("Saved") ? " ok" : "")}>{status || "Edit then save. Adding/removing saves automatically."}</span>
        <button className="btn btn--primary" onClick={saveAll} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </>
  );
}

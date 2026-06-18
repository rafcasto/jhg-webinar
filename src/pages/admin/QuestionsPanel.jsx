import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function QuestionsPanel() {
  const [questions, setQuestions] = useState(null);

  async function load() {
    const { data: qs } = await supabase.from("quiz_questions").select("*").order("position");
    const { data: opts } = await supabase.from("quiz_options").select("*").order("position");
    setQuestions((qs || []).map((q) => ({ ...q, options: (opts || []).filter((o) => o.question_id === q.id) })));
  }
  useEffect(() => { load(); }, []);
  if (!questions) return <p className="muted">Loading…</p>;

  const updateQ = (id, patch) => supabase.from("quiz_questions").update(patch).eq("id", id).then(({ error }) => error && alert(error.message));
  const updateO = (id, patch) => supabase.from("quiz_options").update(patch).eq("id", id).then(({ error }) => error && alert(error.message));

  async function addQuestion() {
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
      <div className="admin-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Quiz questions</h1>
        <button className="btn btn--primary" onClick={addQuestion}>+ Add question</button>
      </div>
      <p className="muted">Scores feed the background lead score. Set a question to <b>not scored</b> for attribution-only (e.g. “how did you hear about us”).</p>

      {questions.map((q, i) => (
        <div className="admin-card" key={q.id}>
          <div className="admin-row" style={{ justifyContent: "space-between" }}>
            <strong>Q{i + 1}</strong>
            <button className="btn btn--ghost" onClick={() => delQuestion(q.id)}>Delete question</button>
          </div>
          <div className="field">
            <label>Prompt</label>
            <input className="admin-input" defaultValue={q.prompt} onBlur={(e) => updateQ(q.id, { prompt: e.target.value })} />
          </div>
          <div className="admin-row" style={{ gap: 24, marginBottom: 12 }}>
            <label><input type="checkbox" defaultChecked={q.scored} onChange={(e) => updateQ(q.id, { scored: e.target.checked })} /> Scored</label>
            <label><input type="checkbox" defaultChecked={q.enabled} onChange={(e) => updateQ(q.id, { enabled: e.target.checked })} /> Enabled</label>
            <label>Order: <input className="admin-input" style={{ width: 64, display: "inline-block" }} type="number" defaultValue={q.position} onBlur={(e) => updateQ(q.id, { position: Number(e.target.value) })} /></label>
          </div>

          <table className="admin-table">
            <thead><tr><th>Label</th><th>Value</th><th>Score</th><th>Archetype</th><th>On</th><th></th></tr></thead>
            <tbody>
              {q.options.map((o) => (
                <tr key={o.id}>
                  <td><input className="admin-input" defaultValue={o.label} onBlur={(e) => updateO(o.id, { label: e.target.value })} /></td>
                  <td><input className="admin-input" defaultValue={o.value} onBlur={(e) => updateO(o.id, { value: e.target.value })} /></td>
                  <td style={{ width: 90 }}><input className="admin-input" type="number" defaultValue={o.score} onBlur={(e) => updateO(o.id, { score: Number(e.target.value) })} /></td>
                  <td><input className="admin-input" defaultValue={o.archetype || ""} placeholder="—" onBlur={(e) => updateO(o.id, { archetype: e.target.value || null })} /></td>
                  <td style={{ width: 50 }}><input type="checkbox" defaultChecked={o.enabled} onChange={(e) => updateO(o.id, { enabled: e.target.checked })} /></td>
                  <td style={{ width: 70 }}><button className="btn btn--ghost" onClick={() => delOption(o.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn--secondary" style={{ marginTop: 12 }} onClick={() => addOption(q)}>+ Add option</button>
        </div>
      ))}
    </>
  );
}

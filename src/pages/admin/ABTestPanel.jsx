import React, { useEffect, useState } from "react";
import { getLandingExperiment, saveLandingExperiment, getAbResults } from "../../lib/api.js";

function rate(reg, exp) {
  if (!exp) return "—";
  return ((reg / exp) * 100).toFixed(1) + "%";
}

export default function ABTestPanel() {
  const [exp, setExp] = useState(null);
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [e, r] = await Promise.all([getLandingExperiment(), getAbResults()]);
    setExp(e);
    setResults(r);
  }
  useEffect(() => { load().catch(console.error); }, []);

  if (!exp) return <p className="muted">Loading…</p>;

  // weights normalised to a 0–100 split for the sliders
  const total = (exp.weight_a + exp.weight_b) || 1;
  const pctB = Math.round((exp.weight_b / total) * 100);

  function setSplit(bPct) {
    setExp((s) => ({ ...s, weight_a: 100 - bPct, weight_b: bPct }));
  }

  async function save() {
    setSaving(true); setStatus("");
    try {
      await saveLandingExperiment({ enabled: exp.enabled, weight_a: exp.weight_a, weight_b: exp.weight_b });
      setStatus("Saved ✓");
    } catch (e) {
      setStatus("Error: " + e.message);
    } finally { setSaving(false); }
  }

  const winner = results && results.a.exposures >= 30 && results.b.exposures >= 30
    ? (results.a.registrations / (results.a.exposures || 1) >= results.b.registrations / (results.b.exposures || 1) ? "A" : "B")
    : null;

  return (
    <>
      <h1 className="adm-h">A/B Test — Landing page</h1>

      {/* Control */}
      <div className="adm-panel">
        <h2 className="adm-panel__h">Test control</h2>

        <label className="ab-toggle">
          <input type="checkbox" checked={exp.enabled}
            onChange={(e) => setExp((s) => ({ ...s, enabled: e.target.checked }))} />
          <span>{exp.enabled ? "Test is LIVE — traffic is being split" : "Test is OFF — everyone sees Variant A (current layout)"}</span>
        </label>

        <div className={"ab-split" + (exp.enabled ? "" : " is-disabled")}>
          <div className="ab-split__row">
            <span className="ab-split__lab">A — Current layout</span>
            <span className="ab-split__pct">{100 - pctB}%</span>
          </div>
          <input type="range" min="0" max="100" step="5" value={pctB} disabled={!exp.enabled}
            onChange={(e) => setSplit(Number(e.target.value))} />
          <div className="ab-split__row">
            <span className="ab-split__lab">B — Masterclass layout</span>
            <span className="ab-split__pct">{pctB}%</span>
          </div>

          <div className="ab-presets">
            <button className="btn btn--secondary btn--sm" disabled={!exp.enabled} onClick={() => setSplit(50)}>50 / 50</button>
            <button className="btn btn--secondary btn--sm" disabled={!exp.enabled} onClick={() => setSplit(20)}>80 / 20</button>
            <button className="btn btn--secondary btn--sm" disabled={!exp.enabled} onClick={() => setSplit(80)}>20 / 80</button>
          </div>
        </div>

        <div className="adm-savebar">
          <span className={"status" + (status.startsWith("Saved") ? " ok" : "")}>{status || " "}</span>
          <button className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save test settings"}
          </button>
        </div>

        <p className="muted" style={{ marginTop: 6 }}>
          Preview either layout without affecting results:{" "}
          <a href="/?v=a" target="_blank" rel="noreferrer">/?v=a</a> ·{" "}
          <a href="/?v=b" target="_blank" rel="noreferrer">/?v=b</a>
        </p>
      </div>

      {/* Results */}
      <div className="adm-panel">
        <h2 className="adm-panel__h">Results <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· conversion = registration</span></h2>
        {!results ? <p className="muted">Loading…</p> : (
          <table className="admin-table">
            <thead>
              <tr><th>Variant</th><th>Visitors</th><th>Registrations</th><th>Conversion rate</th></tr>
            </thead>
            <tbody>
              <tr className={winner === "A" ? "ab-win" : ""}>
                <td><b>A</b> — Current {winner === "A" && "🏆"}</td>
                <td>{results.a.exposures}</td>
                <td>{results.a.registrations}</td>
                <td>{rate(results.a.registrations, results.a.exposures)}</td>
              </tr>
              <tr className={winner === "B" ? "ab-win" : ""}>
                <td><b>B</b> — Masterclass {winner === "B" && "🏆"}</td>
                <td>{results.b.exposures}</td>
                <td>{results.b.registrations}</td>
                <td>{rate(results.b.registrations, results.b.exposures)}</td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="muted" style={{ marginTop: 12 }}>
          {winner
            ? `Variant ${winner} is ahead. Keep running until you're confident, then set the split to 100% on the winner.`
            : "Gathering data — a leader is only highlighted once each variant has at least 30 visitors."}
        </p>
        <button className="btn btn--secondary btn--sm" onClick={() => load().catch(console.error)}>Refresh results</button>
      </div>
    </>
  );
}

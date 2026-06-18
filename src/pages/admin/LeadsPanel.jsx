import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function LeadsPanel() {
  const [rows, setRows] = useState(null);
  const [stage, setStage] = useState("all");

  useEffect(() => {
    supabase.from("jobhackers_leads").select("*").order("created_at", { ascending: false }).limit(1000)
      .then(({ data, error }) => { if (error) console.error(error); setRows(data || []); });
  }, []);

  const filtered = useMemo(
    () => (rows || []).filter((r) => stage === "all" || r.stage === stage),
    [rows, stage]
  );

  if (!rows) return <p className="muted">Loading…</p>;

  const stages = ["all", ...new Set(rows.map((r) => r.stage))];

  const csv = () => {
    const head = ["first_name", "last_name", "email", "stage", "tag", "source", "score", "archetype", "location", "created_at"];
    const lines = filtered.map((l) => head.map((k) => JSON.stringify(l[k] ?? "")).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "jobhackers-leads.csv"; a.click();
  };

  return (
    <>
      <div className="admin-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Lead events ({filtered.length})</h1>
        <div className="admin-row">
          <select className="admin-input" style={{ width: 180 }} value={stage} onChange={(e) => setStage(e.target.value)}>
            {stages.map((s) => <option key={s} value={s}>{s === "all" ? "All stages" : s}</option>)}
          </select>
          <button className="btn btn--secondary" onClick={csv}>Export CSV</button>
        </div>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Stage</th><th>Tag</th><th>Source</th><th>Score</th><th>Archetype</th><th>Location</th><th>When</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((l) => (
            <tr key={l.id}>
              <td>{[l.first_name, l.last_name].filter(Boolean).join(" ") || "—"}</td>
              <td>{l.email}</td>
              <td><span className={`pill pill--${l.stage === "acquisition" ? "B" : l.stage === "activation" ? "A" : "C"}`}>{l.stage}</span></td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{l.tag || "—"}</td>
              <td>{l.source || "—"}</td>
              <td><b>{l.score}</b></td>
              <td>{l.archetype || "—"}</td>
              <td>{l.location || "—"}</td>
              <td>{new Date(l.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

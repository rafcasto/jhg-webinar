import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function Dashboard() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    supabase.from("jobhackers_leads").select("*").order("created_at", { ascending: false }).limit(1000)
      .then(({ data, error }) => { if (error) console.error(error); setRows(data || []); });
  }, []);

  const m = useMemo(() => {
    if (!rows) return null;
    const acq = rows.filter((r) => r.stage === "acquisition");
    const act = rows.filter((r) => r.stage === "activation");
    const emails = new Set(rows.map((r) => r.email));
    const actEmails = new Set(act.map((r) => r.email));
    const scores = act.map((r) => r.score || 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const hot = act.filter((r) => r.score >= 55).length;
    const warm = act.filter((r) => r.score >= 30 && r.score < 55).length;
    const archCount = {};
    act.forEach((r) => { if (r.archetype) archCount[r.archetype] = (archCount[r.archetype] || 0) + 1; });
    const topArch = Object.entries(archCount).sort((a, b) => b[1] - a[1])[0];
    return {
      captured: emails.size,
      completed: actEmails.size,
      rate: emails.size ? Math.round((actEmails.size / emails.size) * 100) : 0,
      scored: act.filter((r) => r.score > 0).length,
      avg, hot, warm,
      topArch: topArch ? `${topArch[0]} (${topArch[1]})` : "—",
    };
  }, [rows]);

  if (!rows) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1 className="adm-h">Dashboard</h1>

      <div className="adm-stats">
        <Stat num={m.captured} label="Leads captured" />
        <Stat num={m.completed} label="Quiz completed" />
        <Stat num={`${m.rate}%`} label="Completion rate" />
        <Stat num={m.scored} label="Scored leads" />
      </div>

      <div className="adm-panel">
        <h2 className="adm-panel__h">Lead score &amp; segments</h2>
        <div className="adm-grid4">
          <Mini num={m.avg.toFixed(1)} label="Avg lead score" />
          <Mini num={m.hot} label="Hot (≥55)" />
          <Mini num={m.warm} label="Warm (30–54)" />
          <Mini num={m.topArch} label="Top archetype" />
        </div>
      </div>

      <h2 className="adm-panel__h" style={{ marginTop: 8 }}>Recent submissions</h2>
      <table className="admin-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Stage</th><th>Score</th><th>Archetype</th><th>Source</th><th>Date</th></tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((l) => (
            <tr key={l.id}>
              <td>{[l.first_name, l.last_name].filter(Boolean).join(" ") || "—"}</td>
              <td>{l.email}</td>
              <td><span className={`pill pill--${l.stage === "acquisition" ? "B" : l.stage === "activation" ? "A" : "C"}`}>{l.stage}</span></td>
              <td><b>{l.score}</b></td>
              <td>{l.archetype || "—"}</td>
              <td>{l.source || "—"}</td>
              <td>{new Date(l.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={7} className="muted">No submissions yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}

function Stat({ num, label }) {
  return <div className="adm-stat"><div className="num">{num}</div><div className="label">{label}</div></div>;
}
function Mini({ num, label }) {
  return <div className="adm-mini"><div className="num">{num}</div><div className="label">{label}</div></div>;
}

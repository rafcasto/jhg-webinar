import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function CtasPanel() {
  const [rows, setRows] = useState(null);

  const load = () =>
    supabase.from("ctas").select("*").order("page").order("position").then(({ data }) => setRows(data || []));
  useEffect(() => { load(); }, []);
  if (!rows) return <p className="muted">Loading…</p>;

  async function update(id, patch) {
    const { error } = await supabase.from("ctas").update(patch).eq("id", id);
    if (error) alert(error.message);
  }

  return (
    <>
      <h1>CTAs &amp; links</h1>
      <p className="muted">Edit the button labels and destination URLs shown across the funnel.</p>
      <table className="admin-table">
        <thead>
          <tr><th>Page</th><th>Slot</th><th>Icon</th><th>Label</th><th>Sublabel</th><th>URL</th><th>On</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.page}</td>
              <td>{r.slot}</td>
              <td style={{ width: 60 }}>
                <input className="admin-input" defaultValue={r.icon || ""} onBlur={(e) => update(r.id, { icon: e.target.value })} />
              </td>
              <td><input className="admin-input" defaultValue={r.label} onBlur={(e) => update(r.id, { label: e.target.value })} /></td>
              <td><input className="admin-input" defaultValue={r.sublabel || ""} onBlur={(e) => update(r.id, { sublabel: e.target.value })} /></td>
              <td><input className="admin-input" defaultValue={r.url} onBlur={(e) => update(r.id, { url: e.target.value })} /></td>
              <td>
                <input type="checkbox" defaultChecked={r.enabled} onChange={(e) => update(r.id, { enabled: e.target.checked })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

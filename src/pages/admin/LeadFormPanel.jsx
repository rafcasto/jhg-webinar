import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase.js";

const FIELDS = ["label", "sublabel", "url", "icon", "enabled"];

export default function LeadFormPanel() {
  const [rows, setRows] = useState(null);
  const [vals, setVals] = useState({});       // id -> {label,sublabel,url,icon,enabled}
  const original = useRef({});
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("ctas").select("*").order("page").order("position");
      if (error) console.error(error);
      setRows(data || []);
      const map = Object.fromEntries((data || []).map((r) =>
        [r.id, { label: r.label, sublabel: r.sublabel || "", url: r.url || "", icon: r.icon || "", enabled: r.enabled }]));
      setVals(map);
      original.current = JSON.parse(JSON.stringify(map));
    })();
  }, []);

  if (!rows) return <p className="muted">Loading…</p>;

  const dirtyIds = Object.keys(vals).filter((id) => JSON.stringify(vals[id]) !== JSON.stringify(original.current[id]));
  const setField = (id, k, v) => setVals((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));

  async function save() {
    if (!dirtyIds.length) return;
    setSaving(true); setStatus("");
    try {
      for (const id of dirtyIds) {
        const { error } = await supabase.from("ctas").update(vals[id]).eq("id", id);
        if (error) throw error;
      }
      original.current = JSON.parse(JSON.stringify(vals));
      setStatus("Saved ✓");
    } catch (e) { setStatus("Error: " + e.message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <h1 className="adm-h">Lead form &amp; CTAs</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 18 }}>
        Edit every button label, sub-text and destination URL across the funnel. The registration
        form fields (name, email, location) and the date picker are fixed.
      </p>

      <div className="adm-panel">
        <table className="admin-table">
          <thead>
            <tr><th>Page</th><th>Slot</th><th>Icon</th><th>Label</th><th>Sub-label</th><th>URL</th><th>On</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ textTransform: "capitalize" }}>{r.page}</td>
                <td className="muted">{r.slot}</td>
                <td style={{ width: 64 }}><input className="admin-input" value={vals[r.id].icon} onChange={(e) => setField(r.id, "icon", e.target.value)} /></td>
                <td><input className="admin-input" value={vals[r.id].label} onChange={(e) => setField(r.id, "label", e.target.value)} /></td>
                <td><input className="admin-input" value={vals[r.id].sublabel} onChange={(e) => setField(r.id, "sublabel", e.target.value)} /></td>
                <td><input className="admin-input" value={vals[r.id].url} onChange={(e) => setField(r.id, "url", e.target.value)} /></td>
                <td style={{ width: 50 }}><input type="checkbox" checked={vals[r.id].enabled} onChange={(e) => setField(r.id, "enabled", e.target.checked)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-savebar">
        <span className={"status" + (status.startsWith("Saved") ? " ok" : "")}>
          {status || (dirtyIds.length ? `${dirtyIds.length} unsaved change${dirtyIds.length > 1 ? "s" : ""}` : "All changes saved")}
        </span>
        <button className="btn btn--primary" onClick={save} disabled={saving || !dirtyIds.length}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </>
  );
}

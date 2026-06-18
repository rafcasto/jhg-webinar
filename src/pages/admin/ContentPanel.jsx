import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function ContentPanel() {
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = () =>
    supabase.from("content_blocks").select("*").order("page").order("position")
      .then(({ data }) => setRows(data || []));

  useEffect(() => { load(); }, []);
  if (!rows) return <p className="muted">Loading…</p>;

  async function save(row, value) {
    setSaving(row.id);
    const { error } = await supabase.from("content_blocks").update({ value }).eq("id", row.id);
    if (error) alert(error.message);
    setSaving(null);
  }

  const pages = [...new Set(rows.map((r) => r.page))];

  return (
    <>
      <h1>Page content</h1>
      {pages.map((page) => (
        <div className="admin-card" key={page}>
          <h3 style={{ textTransform: "capitalize", marginTop: 0 }}>{page}</h3>
          {rows.filter((r) => r.page === page).map((r) => (
            <div className="field" key={r.id}>
              <label>{r.label} <span className="muted">({r.key})</span></label>
              {r.type === "textarea" || r.type === "html" ? (
                <textarea className="admin-input" rows={3} defaultValue={r.value || ""}
                  onBlur={(e) => save(r, e.target.value)} />
              ) : (
                <input className="admin-input" defaultValue={r.value || ""}
                  placeholder={r.type === "url" ? "https://…" : ""}
                  onBlur={(e) => save(r, e.target.value)} />
              )}
              {saving === r.id && <span className="muted" style={{ fontSize: 12 }}>Saving…</span>}
            </div>
          ))}
        </div>
      ))}
      <p className="muted">Changes save automatically when you click out of a field.</p>
    </>
  );
}

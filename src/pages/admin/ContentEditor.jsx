import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function ContentEditor({ title, pages }) {
  const [rows, setRows] = useState(null);
  const [vals, setVals] = useState({});       // id -> current value
  const original = useRef({});
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("content_blocks").select("*").in("page", pages).order("page").order("position");
      if (error) console.error(error);
      setRows(data || []);
      const map = Object.fromEntries((data || []).map((r) => [r.id, r.value || ""]));
      setVals(map);
      original.current = { ...map };
    })();
  }, [pages.join(",")]);

  if (!rows) return <p className="muted">Loading…</p>;

  const dirtyIds = Object.keys(vals).filter((id) => vals[id] !== original.current[id]);

  async function save() {
    if (!dirtyIds.length) return;
    setSaving(true); setStatus("");
    try {
      for (const id of dirtyIds) {
        const { error } = await supabase.from("content_blocks").update({ value: vals[id] }).eq("id", id);
        if (error) throw error;
      }
      original.current = { ...vals };
      setStatus("Saved ✓");
    } catch (e) {
      setStatus("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // group by page
  const groups = pages.filter((p) => rows.some((r) => r.page === p));

  return (
    <>
      <h1 className="adm-h">{title}</h1>
      {groups.map((page) => (
        <div className="adm-panel" key={page}>
          <h2 className="adm-panel__h" style={{ textTransform: "capitalize" }}>{page}</h2>
          <div className="adm-fieldset">
            {rows.filter((r) => r.page === page).map((r) => (
              <div className="adm-frow" key={r.id}>
                <label>{r.label}<span className="k">{r.key}</span></label>
                {r.type === "textarea" || r.type === "html" ? (
                  <textarea className="admin-input" rows={3} value={vals[r.id] ?? ""}
                    onChange={(e) => setVals((v) => ({ ...v, [r.id]: e.target.value }))} />
                ) : (
                  <input className="admin-input" type={r.type === "url" ? "url" : "text"} value={vals[r.id] ?? ""}
                    placeholder={r.type === "url" ? "https://…" : ""}
                    onChange={(e) => setVals((v) => ({ ...v, [r.id]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

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

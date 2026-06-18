import React, { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "../lib/countries.js";

// Searchable country combobox. value/onChange use the ISO2 code.
export default function CountrySelect({ value, onChange, placeholder = "Select your country…" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrap = useRef(null);
  const inputRef = useRef(null);

  const selected = COUNTRIES.find((c) => c.code === value);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(s) || ("+" + c.dial).includes(s));
  }, [q]);

  useEffect(() => {
    const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const pick = (code) => { onChange(code); setOpen(false); setQ(""); };

  return (
    <div className="cselect" ref={wrap}>
      <button type="button" className="cselect__btn" onClick={() => setOpen((o) => !o)}>
        {selected ? <span>{selected.flag} {selected.name}</span> : <span className="cselect__ph">{placeholder}</span>}
        <span className="cselect__chev">▾</span>
      </button>
      {open && (
        <div className="cselect__panel">
          <input ref={inputRef} className="cselect__search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search country…" />
          <div className="cselect__list">
            {list.map((c) => (
              <button type="button" key={c.code}
                className={"cselect__opt" + (c.code === value ? " is-selected" : "")}
                onClick={() => pick(c.code)}>
                <span>{c.flag} {c.name}</span>
                <span className="cselect__dial">+{c.dial}</span>
              </button>
            ))}
            {list.length === 0 && <div className="cselect__empty">No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}

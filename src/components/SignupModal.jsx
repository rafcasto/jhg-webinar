import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui.jsx";
import { registerLead, enrollInKit, zoomRegister, readSource, webinarRsvpTag } from "../lib/api.js";
import { formatEvent } from "../lib/format.js";

export default function SignupModal({ events = [], initialIndex = 0, content = {}, onClose }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(initialIndex);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", location: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const chosen = events[idx] || null;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!form.first_name.trim()) { setErr("Please enter your first name."); return; }
    if (!form.email || !form.email.includes("@")) { setErr("Please enter a valid email."); return; }
    setBusy(true);
    try {
      const id = await registerLead({ ...form, source: readSource(), tag: webinarRsvpTag(chosen) });
      sessionStorage.setItem("jhg_lead_id", id);
      sessionStorage.setItem("jhg_email", form.email);
      enrollInKit(id);
      if (chosen) {
        zoomRegister({
          meeting_id: chosen.zoom_meeting_id,
          occurrence_id: chosen.occurrence_id,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
        });
      }
      navigate("/quiz");
    } catch (e2) {
      console.error(e2);
      setErr(e2.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Close">×</button>
        <h2>{content.register_title || "Save my seat"}</h2>
        <p className="modal-sub">Free · live on Zoom · pick your session</p>
        {err && <div className="form-error">{err}</div>}

        {events.length > 0 && (
          <div className="date-choices">
            {events.map((ev, i) => {
              const w = formatEvent(ev);
              return (
                <button type="button" key={ev.id || i}
                  className={"date-choice" + (i === idx ? " is-selected" : "")}
                  onClick={() => setIdx(i)}>
                  <span className="radio" />
                  <span>
                    <b>{w?.date}</b> · {w?.time} <span className="muted">({w?.tz})</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>First name</label>
            <input type="text" value={form.first_name} onChange={set("first_name")} placeholder="Priya" required />
          </div>
          <div className="field">
            <label>Last name (optional)</label>
            <input type="text" value={form.last_name} onChange={set("last_name")} placeholder="Ramesh" />
          </div>
          <div className="field">
            <label>Your email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" required />
          </div>
          <div className="field">
            <label>Location (optional)</label>
            <input type="text" value={form.location} onChange={set("location")} placeholder="City, Country" />
          </div>
          <Button variant="primary" size="lg" block disabled={busy}>
            {busy ? "Saving…" : (content.cta_label || "Save My Seat")}
          </Button>
          <p className="reg-fineprint">→ No credit card. We'll email your Zoom link + reminders.</p>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui.jsx";
import { registerLead, enrollInKit, zoomRegister, readSource, webinarRsvpTag } from "../lib/api.js";
import { formatEvent } from "../lib/format.js";
import { COUNTRIES, countryName } from "../lib/countries.js";

const DEFAULT_DISCLAIMER =
  "By opting in, you agree to receive logistics and marketing communications about this event via email and SMS, as well as occasional marketing messages via SMS and WhatsApp. Standard rates may apply. You can opt out at any time by replying STOP to SMS or WhatsApp messages.";

export default function RegistrationForm({ events = [], content = {}, dark = false, defaultSessionIdx = 0 }) {
  const navigate = useNavigate();
  const [f, setF] = useState({
    first_name: "", last_name: "", email: "",
    dial: "44", phone: "",
    session: events.length ? String(defaultSessionIdx) : "",
    country: "GB",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  // keep dial in step with chosen country
  const onCountry = (e) => {
    const code = e.target.value;
    const c = COUNTRIES.find((x) => x.code === code);
    setF((s) => ({ ...s, country: code, dial: c ? c.dial : s.dial }));
  };

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.first_name.trim()) return setErr("Please enter your first name.");
    if (!f.email.includes("@")) return setErr("Please enter a valid email.");
    if (!f.phone.trim()) return setErr("Please enter your mobile number.");
    if (events.length && f.session === "") return setErr("Please select a session.");
    if (!f.country) return setErr("Please select your location.");

    const chosen = events[Number(f.session)] || null;
    setBusy(true);
    try {
      const id = await registerLead({
        first_name: f.first_name,
        last_name: f.last_name,
        email: f.email,
        location: countryName(f.country),
        phone: `+${f.dial} ${f.phone.trim()}`,
        source: readSource(),
        tag: webinarRsvpTag(chosen),
      });
      sessionStorage.setItem("jhg_lead_id", id);
      sessionStorage.setItem("jhg_email", f.email);
      enrollInKit(id);
      if (chosen) zoomRegister({
        meeting_id: chosen.zoom_meeting_id, occurrence_id: chosen.occurrence_id,
        email: f.email, first_name: f.first_name, last_name: f.last_name,
      });
      navigate("/quiz");
    } catch (e2) {
      console.error(e2);
      setErr(e2.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className={"reg-card" + (dark ? " reg-card--dark" : "")} id="register">
      <h3>{content.form_heading || "Seats are limited. Secure yours now."}</h3>
      {err && <div className="form-error">{err}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><input type="text" value={f.first_name} onChange={set("first_name")} placeholder="First name *" required /></div>
          <div className="field"><input type="text" value={f.last_name} onChange={set("last_name")} placeholder="Last name" /></div>
        </div>
        <div className="field"><input type="email" value={f.email} onChange={set("email")} placeholder="Email *" required /></div>

        <div className="field">
          <label className="field-mini">Mobile *</label>
          <div className="phone-row">
            <select value={f.dial} onChange={set("dial")} aria-label="Country code">
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.dial}>{c.flag} +{c.dial}</option>
              ))}
            </select>
            <input type="tel" value={f.phone} onChange={set("phone")} placeholder="07400 123456" required />
          </div>
        </div>

        <div className="field">
          <label className="field-mini">Select session *</label>
          <select value={f.session} onChange={set("session")} required={events.length > 0}>
            {!events.length && <option value="">No sessions available</option>}
            {events.length > 0 && <option value="" disabled>Select session…</option>}
            {events.map((ev, i) => {
              const w = formatEvent(ev);
              return <option key={ev.id || i} value={i}>{w?.date} · {w?.time} ({w?.tz})</option>;
            })}
          </select>
        </div>

        <div className="field">
          <label className="field-mini">Where are you located? *</label>
          <select value={f.country} onChange={onCountry} required>
            <option value="" disabled>Select your country…</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        </div>

        <Button variant="primary" size="lg" block disabled={busy}>
          {busy ? "Registering…" : (content.form_button || "Register Now")}
        </Button>

        <p className="reg-disclaimer">{content.register_disclaimer || DEFAULT_DISCLAIMER}</p>
      </form>
    </div>
  );
}

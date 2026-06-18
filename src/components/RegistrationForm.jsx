import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui.jsx";
import CountrySelect from "./CountrySelect.jsx";
import { registerLead, enrollInKit, zoomRegister, readSource, webinarRsvpTag } from "../lib/api.js";
import { formatEvent } from "../lib/format.js";
import { countryName, dialFor, localeCountry, detectCountry } from "../lib/countries.js";

const DEFAULT_DISCLAIMER =
  "By opting in, you agree to receive logistics and marketing communications about this event via email and SMS, as well as occasional marketing messages via SMS and WhatsApp. Standard rates may apply. You can opt out at any time by replying STOP to SMS or WhatsApp messages.";

export default function RegistrationForm({ events = [], content = {}, dark = false, plain = false, id, defaultSessionIdx = 0, onDone }) {
  const navigate = useNavigate();
  const [f, setF] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    session: events.length ? String(defaultSessionIdx) : "",
    country: localeCountry() || "GB",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const touchedCountry = useRef(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  // auto-detect country (IP → locale) unless the user already picked one
  useEffect(() => {
    let alive = true;
    detectCountry().then((code) => {
      if (alive && code && !touchedCountry.current) setF((s) => ({ ...s, country: code }));
    });
    return () => { alive = false; };
  }, []);

  const dial = dialFor(f.country) || "44";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.first_name.trim()) return setErr("Please enter your first name.");
    if (!f.email.includes("@")) return setErr("Please enter a valid email.");
    if (events.length && f.session === "") return setErr("Please select a session.");
    if (!f.country) return setErr("Please select your location.");

    const chosen = events[Number(f.session)] || null;
    setBusy(true);
    try {
      const leadId = await registerLead({
        first_name: f.first_name,
        last_name: f.last_name,
        email: f.email,
        location: countryName(f.country),
        phone: f.phone.trim() ? `+${dial} ${f.phone.trim()}` : null,
        source: readSource(),
        tag: webinarRsvpTag(chosen),
      });
      sessionStorage.setItem("jhg_lead_id", leadId);
      sessionStorage.setItem("jhg_email", f.email);
      enrollInKit(leadId);
      if (chosen) zoomRegister({
        meeting_id: chosen.zoom_meeting_id, occurrence_id: chosen.occurrence_id,
        email: f.email, first_name: f.first_name, last_name: f.last_name,
      });
      onDone?.();
      navigate("/quiz");
    } catch (e2) {
      console.error(e2);
      setErr(e2.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const cls = "reg-card" + (dark ? " reg-card--dark" : "") + (plain ? " reg-card--plain" : "");

  return (
    <div className={cls} id={id}>
      <h3>{content.form_heading || "Seats are limited. Secure yours now."}</h3>
      {err && <div className="form-error">{err}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><input type="text" value={f.first_name} onChange={set("first_name")} placeholder="First name *" required /></div>
          <div className="field"><input type="text" value={f.last_name} onChange={set("last_name")} placeholder="Last name" /></div>
        </div>
        <div className="field"><input type="email" value={f.email} onChange={set("email")} placeholder="Email *" required /></div>

        <div className="field">
          <label className="field-mini">Mobile (optional)</label>
          <div className="phone-row">
            <span className="phone-prefix">+{dial}</span>
            <input type="tel" value={f.phone} onChange={set("phone")} placeholder="7400 123456" />
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
          <CountrySelect
            value={f.country}
            onChange={(code) => { touchedCountry.current = true; setF((s) => ({ ...s, country: code })); }}
          />
        </div>

        <Button variant="primary" size="lg" block disabled={busy}>
          {busy ? "Registering…" : (content.form_button || "Register Now")}
        </Button>

        <p className="reg-disclaimer">{content.register_disclaimer || DEFAULT_DISCLAIMER}</p>
      </form>
    </div>
  );
}

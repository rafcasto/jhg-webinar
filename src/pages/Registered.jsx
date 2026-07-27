import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter.jsx";
import { Button } from "../components/ui.jsx";
import { getContent, getNextEvent } from "../lib/api.js";
import { formatEvent } from "../lib/format.js";

/**
 * /registered — the lead-magnet gate shown immediately after registration.
 * Confirms the seat, then trades the free "Find Your Target Role in 5 Prompts"
 * playbook (a Kit email delivered after the quiz) for completing the quiz.
 */
export default function Registered() {
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [event, setEvent] = useState(null);
  const email = sessionStorage.getItem("jhg_email");

  useEffect(() => {
    if (!email) { navigate("/"); return; }
    (async () => {
      try {
        const [content, ev] = await Promise.all([getContent("registered"), getNextEvent()]);
        setC(content);
        setEvent(ev);
      } catch (e) { console.error(e); setC({}); }
    })();
  }, [email, navigate]);

  if (!c) return <div className="page-loading">Loading…</div>;

  const T = (k, def) => (c[k] && c[k].length ? c[k] : def);
  const when = formatEvent(event);

  return (
    <>
      <main className="ty-page">
        <div className="ty-inner">
          <div className="ty-check">✓</div>
          <div className="ty-eyebrow">{T("eyebrow", "YOU'RE REGISTERED")}</div>
          <h1 className="ty-title">{T("title", "You're In. One Last Step.")}</h1>
          <p className="ty-sub">{T("subtitle", "Your seat is saved — check your inbox for the confirmation. Before you go, claim the free resource below.")}</p>
          {when && (
            <p className="ty-date">📅 {when.date} · 🕒 {when.time} ({when.tz})</p>
          )}

          <div className="ty-magnet">
            <h2 className="ty-magnet__title">{T("magnet_name", "Find Your Target Role in 5 Prompts")}</h2>
            <p className="ty-magnet__desc">
              {T("magnet_desc", "Answer 5 quick questions and we'll send you the copy-paste AI prompts that turn \"I don't know what to do\" into a shortlist of best-fit roles — in under an hour.")}
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate("/quiz")}>
              {T("cta_label", "Send Me The 5 Prompts →")}
            </Button>
            <p className="ty-magnet__foot">{T("footnote", "Takes less than 60 seconds. Your gift arrives by email right after.")}</p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

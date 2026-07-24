import React, { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Testimonials from "../components/Testimonials.jsx";
import MeetupProof from "../components/MeetupProof.jsx";
import SignupModal from "../components/SignupModal.jsx";
import { Portrait, Button } from "../components/ui.jsx";
import { getContent, getNextEvents } from "../lib/api.js";
import { formatEvent, formatRange } from "../lib/format.js";

const PRESENTERS = [
  { name: "David Perry", src: "/assets/founder-david-perry.jpeg",
    bio: "Legendary recruiter and author of \"Guerrilla Marketing for Job Hunters.\" Co-creator of the JobHackers playbook—he's helped thousands crack the hidden job market and get hired faster." },
  { name: "Laurent Simon", src: "/assets/founder-laurent-simon.jpeg",
    bio: "Co-founder of JobHackers Global. Turned a proven 60-day roadmap into the live cohort that's helped members land roles they love—often with double-digit salary increases." },
];

// The 3 Secrets—same message as Variant A, adapted to B's compact "parts" cards.
const SECRETS = [
  { kicker: "SECRET #1", title: "Job Hacking",
    desc: "How to harness AI and our 8-step roadmap to make a good job an 8-week project—not a 12-month ordeal. For everyone thinking \"I don't know what to do.\"" },
  { kicker: "SECRET #2", title: "Success Cloning",
    desc: "How to ethically \"steal\" the exact path of people in your industry who've already landed—no reinventing yourself. For everyone thinking \"I'm not good enough.\"" },
  { kicker: "SECRET #3", title: "Hidden Job Market Hack #1",
    desc: "How to get introduced directly to hiring managers before the job is ever posted—no online applications. For everyone thinking \"people won't react well if I reach out.\"" },
];

function Countdown({ target, label }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const cells = [["DAYS", d], ["HOURS", h], ["MIN", m], ["SEC", s]];
  return (
    <div className="mc-count">
      <div className="mc-count__label">{label}</div>
      <div className="mc-count__row">
        {cells.map(([k, v]) => (
          <div className="mc-count__cell" key={k}>
            <div className="mc-count__num">{pad(v)}</div>
            <div className="mc-count__k">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingB({ variant = "b" }) {
  const [c, setC] = useState(null);
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [startIdx, setStartIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [content, evs] = await Promise.all([getContent("landing_b"), getNextEvents(2)]);
        setC(content);
        setEvents(evs);
      } catch (e) { console.error(e); setC({}); }
    })();
  }, []);

  if (!c) return <div className="page-loading">Loading…</div>;

  const T = (k, def) => (c[k] && c[k].length ? c[k] : def);
  const cta = T("cta_label", "Claim Your Free Seat");
  const openModal = (i = 0) => { setStartIdx(i); setOpen(true); };
  const next = events[0] || null;

  const parts = [1, 2, 3].map((n) => ({
    kicker: T(`part_${n}_kicker`, SECRETS[n - 1].kicker),
    title: T(`part_${n}_title`, SECRETS[n - 1].title),
    desc: T(`part_${n}_desc`, SECRETS[n - 1].desc),
  }));
  const proof = T("proof_strip", "3,000+ professionals coached · David Perry & Laurent Simon · 90-minute live MasterClass")
    .split("·").map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <SiteHeader onRegister={openModal} ctaLabel={cta} />

      {/* HERO—centered, countdown-driven */}
      <section className="mc-hero">
        <div className="container mc-narrow center">
          <div className="mc-badge">● {T("badge", "FREE LIVE MASTERCLASS—with David Perry & Laurent Simon")}</div>
          <h1 className="mc-h1">
            {T("hero_title", "How to Secure a Job You Love, at the Salary You Deserve")}
            <span className="accent">{T("hero_title_accent", "—Without Applying Online.")}</span>
          </h1>
          <p className="mc-sub">{T("hero_subtitle",
            "The free 90-minute live MasterClass for professionals stuck in limbo—job hunting, changing careers, or chasing the promotion you've earned. Learn the exact system 3,000+ professionals in 35 countries have used to get hired in weeks, not months.")}</p>

          <Button variant="primary" size="lg" onClick={() => openModal(0)}>{cta} →</Button>

          <Countdown target={next?.start_time} label={T("countdown_label", "Next MasterClass begins in")} />
          {next && (
            <div className="mc-when">
              {formatEvent(next)?.date} · {formatRange(next)}
            </div>
          )}

          <ul className="mc-proof">
            {proof.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN—the 3 Secrets */}
      <section className="section section--tint">
        <div className="container mc-narrow">
          <div className="mc-kicker center">THE 3 SECRETS YOU'LL LEARN LIVE</div>
          <h2 className="mc-h2 center">{T("learn_heading", "Each one kills the belief that's keeping you stuck.")}</h2>

          <div className="mc-parts">
            {parts.map((p, i) => (
              <div className="mc-part" key={i}>
                <div className="mc-part__kicker">{p.kicker}</div>
                <h3 className="mc-part__title">{p.title}</h3>
                <p className="mc-part__desc">{p.desc}</p>
              </div>
            ))}

            <div className="mc-part mc-part--bonus">
              <div className="mc-part__tag">{T("bonus_kicker", "LIVE-ONLY BONUS")}</div>
              <h3 className="mc-part__title">{T("bonus_title", "We're keeping this one a secret.")}</h3>
              <p className="mc-part__desc">{T("bonus_desc",
                "Attend live and you'll get a bonus we're deliberately not naming. Not sent with the replay.")}</p>
            </div>
          </div>

          <div className="center" style={{ marginTop: 40 }}>
            <Button variant="primary" size="lg" onClick={() => openModal(0)}>{cta} →</Button>
          </div>
        </div>
      </section>

      {/* PRESENTERS */}
      <section className="section">
        <div className="container mc-narrow">
          <div className="mc-kicker center">YOUR INSTRUCTORS</div>
          <h2 className="mc-h2 center">{T("presenters_heading", "Your MasterClass Hosts")}</h2>
          <div className="mc-hosts">
            {PRESENTERS.map((p) => (
              <div className="mc-host" key={p.name}>
                <Portrait size="lg" src={p.src} alt={p.name} />
                <div className="mc-host__name">{p.name}</div>
                <div className="mc-host__bio">{p.bio}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF (shared components) */}
      <Testimonials />
      <MeetupProof />

      {/* CLOSER */}
      <section className="section section--dark center">
        <div className="container mc-narrow">
          <h2 className="mc-h2" style={{ color: "#fff" }}>{T("closer_heading", "Don't miss this free MasterClass.")}</h2>
          <p className="mc-closer-sub">{T("closer_sub",
            "90 minutes that could change your career. From discouraged Job Seeker to confident JobHacker—pick the session that suits you. It runs every fortnight.")}</p>

          {events.length > 0 && (
            <div className="mc-dates">
              {events.map((ev, i) => {
                const w = formatEvent(ev);
                return (
                  <div className="mc-date" key={ev.id || i}>
                    <div className="mc-date__v">{w?.date}</div>
                    <div className="mc-date__t">{formatRange(ev)}</div>
                    <Button variant="primary" block onClick={() => openModal(i)}>{cta} →</Button>
                  </div>
                );
              })}
            </div>
          )}
          {events.length === 0 && (
            <Button variant="primary" size="lg" onClick={() => openModal(0)}>{cta} →</Button>
          )}
        </div>
      </section>

      <SiteFooter />

      {open && <SignupModal events={events} content={c} variant={variant} initialIndex={startIdx} onClose={() => setOpen(false)} />}
    </>
  );
}

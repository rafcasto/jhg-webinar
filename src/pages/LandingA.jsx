import React, { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import LogoBar from "../components/LogoBar.jsx";
import Testimonials from "../components/Testimonials.jsx";
import MeetupProof from "../components/MeetupProof.jsx";
import RegistrationForm from "../components/RegistrationForm.jsx";
import SignupModal from "../components/SignupModal.jsx";
import { Portrait, SectionHead, Button } from "../components/ui.jsx";
import { getContent, getNextEvents } from "../lib/api.js";
import { toEmbed, formatEvent, formatRange } from "../lib/format.js";

// ---- Spec defaults. CMS (content_blocks) overrides any key that exists. ----
const PROBLEMS = [
  { t: "You're blurry.", d: "You're qualified, but the market can't tell what you do or where you fit — so you get filtered out, undervalued, or ignored." },
  { t: "You're applying into the void.", d: "Volume and hope. Endless applications, generic résumés, and silence back. That's panic with Wi-Fi — not a strategy." },
  { t: "You sound like everyone else.", d: "\"Experienced professional with strong communication skills.\" Your profile blurs into a thousand lookalikes the moment AI flooded the market." },
];
const AUDIENCE = [
  { t: "The Job Seeker", d: "You lost your job and need to land fast. You've been applying for months with no traction, stuck in limbo.", e: "You'll learn how to compress your time-to-value and get hired sooner." },
  { t: "The Career Changer", d: "You feel stuck in the wrong role and you're ready to reinvent — to pivot into work that delivers more value and sits closer to what drives you.", e: "You'll learn how to reposition your experience for a new lane the market will pay for." },
  { t: "The Promotion Seeker", d: "You're employed but underpaid and under-promoted. You want the raise and title where you are — or a better deal elsewhere.", e: "You'll learn how to prove your value and negotiate like a pro." },
];
const METHOD = [
  { t: "Find your lane.", d: "State what you do in one sentence the market instantly understands. Your lane isn't a prison cell — it's a firing position." },
  { t: "Follow the pain to the paycheck.", d: "Map your skills to the expensive problems employers actually pay to solve." },
  { t: "Build proof.", d: "Convert vague skills into believable evidence: skill + situation + result. Proof beats claim." },
  { t: "Signal \"operator.\"", d: "Rebuild your résumé and LinkedIn so recruiters find you and read \"operator,\" not \"applicant.\"" },
  { t: "Run the system.", d: "Your Mission Card, pipeline dashboard, and weekly reset — momentum protected by rhythm, not hope." },
];
const YOU_GET = [
  "Your one-sentence lane",
  "A pain-to-paycheck map of your skills",
  "The proof-bullet formula (skill + situation + result)",
  "Recruiter-ready résumé & LinkedIn fixes",
  "The Mission Card operating template",
];
const PRESENTERS = [
  { name: "David Perry", src: "/assets/founder-david-perry.jpeg",
    bio: "Co-host and co-creator of the JobHackers playbook. A legendary recruiter and author of \"Guerrilla Marketing for Job Hunters,\" he's helped thousands crack the hidden job market and get hired faster." },
  { name: "Laurent Simon", src: "/assets/founder-laurent-simon.jpeg",
    bio: "Co-founder of JobHackers Global. Laurent turned a proven 60-day roadmap into the live cohort that's helped members land roles they love — often with double-digit salary increases." },
];

function HeroMedia({ type, url }) {
  const embed = toEmbed(url);
  if (type === "image" && url) return <img className="whero__media-img" src={url} alt="" />;
  if (embed) return <iframe src={embed} title="Workshop intro" allow="autoplay; fullscreen; picture-in-picture" />;
  return <span className="whero__video-ph">▶ {type === "image" ? "Image" : "Workshop intro"}</span>;
}

export default function LandingA({ variant = "a" }) {
  const [c, setC] = useState(null);
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [startIdx, setStartIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [content, evs] = await Promise.all([getContent("landing"), getNextEvents(2)]);
        setC(content);
        setEvents(evs);
      } catch (e) { console.error(e); setC({}); }
    })();
  }, []);

  if (!c) return <div className="page-loading">Loading…</div>;

  const T = (k, def) => (c[k] && c[k].length ? c[k] : def);
  const cta = T("cta_label", "Save My Seat");
  const openModal = (i = 0) => { setStartIdx(i); setOpen(true); };

  const problems = PROBLEMS.map((p, i) => ({ t: T(`problem_${i + 1}_title`, p.t), d: T(`problem_${i + 1}_desc`, p.d) }));
  const audience = AUDIENCE.map((a, i) => ({ t: T(`who_${i + 1}_title`, a.t), d: T(`who_${i + 1}_desc`, a.d), e: T(`who_${i + 1}_em`, a.e) }));
  const method = METHOD.map((m, i) => ({ t: T(`method_${i + 1}_title`, m.t), d: T(`method_${i + 1}_desc`, m.d) }));
  const youGet = YOU_GET.map((g, i) => T(`get_${i + 1}`, g));

  const mediaType = T("hero_media_type", "video");
  const mediaUrl = c.hero_media_url || c.video_url || "";

  return (
    <>
      <SiteHeader onRegister={openModal} ctaLabel={cta} />

      {/* 1 — HERO (centered head · media + sessions left · form right) */}
      <section className="whero">
        <div className="container">
          <div className="whero__head center">
            <div className="whero__tagline">{T("hero_eyebrow", "The New Rules of Getting Hired Masterclass")}</div>
            <h1 className="whero__h1">{T("hero_title", "You Did Everything Right. The Rules Changed Anyway.")}</h1>
            <p className="whero__sub">
              {T("hero_subtitle",
                "The free fortnightly masterclass for professionals who are stuck — whether you're job hunting, changing careers, or chasing the promotion you've earned. With David Perry & Laurent Simon.")}
            </p>
          </div>

          <div className="whero__grid">
            <div className="whero__left">
              <div className="whero__media"><HeroMedia type={mediaType} url={mediaUrl} /></div>
              {events.length > 0 && (
                <div className="sessions">
                  {events.slice(0, 2).map((ev, i) => {
                    const w = formatEvent(ev);
                    return (
                      <div className="session" key={ev.id || i}>
                        <div className="session__k">{i === 0 ? "NEXT SESSION:" : "FUTURE SESSION:"}</div>
                        <div className="session__date">{w?.date}</div>
                        <div className="session__time">{formatRange(ev)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="whero__right">
              <RegistrationForm events={events} content={c} variant={variant} dark id="register" />
            </div>
          </div>
        </div>
      </section>

      {/* 2 — LOGO BAR */}
      <LogoBar caption={T("logo_strip", "As featured in")} />

      {/* 3 — THE PROBLEM */}
      <section className="section section--tint">
        <div className="container">
          <SectionHead title={T("problem_heading", "The Problem Isn't You. It's How the Market Reads You.")} />
          <div className="grid-3">
            {problems.map((p, i) => (
              <div className="pcard" key={i}>
                <div className="pcard__eyebrow">Problem {i + 1}</div>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — WHO IS IT FOR */}
      <section className="section" id="who">
        <div className="container">
          <SectionHead title={T("who_heading", "Who Is It For")}
            lede={T("who_intro", "Whatever \"stuck\" looks like for you, the fix starts the same way — clarity.")} />
          <div className="grid-3">
            {audience.map((a, i) => (
              <div className="pcard" key={i}>
                <h3>{a.t}</h3>
                <p>{a.d}</p>
                <span className="em">{a.e}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — THE METHOD */}
      <section className="section section--tint" id="method">
        <div className="container">
          <SectionHead eyebrow={T("method_subline", "Clarity → Proof → System")} title={T("method_heading", "The Method")} />
          <div className="method-list">
            {method.map((m, i) => (
              <div className="mstep" key={i}>
                <div className="mstep__num">{i + 1}</div>
                <div>
                  <div className="mstep__title">{m.t}</div>
                  <p className="mstep__desc">{m.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — YOU WILL GET + PRESENTED BY */}
      <section className="section">
        <div className="container">
          <div className="get-grid">
            <div>
              <SectionHead title={T("get_heading", "You Will Get")} />
              <ul className="checklist">
                {youGet.map((g, i) => <li key={i}><span className="tick">✔</span>{g}</li>)}
              </ul>
            </div>
            <div>
              <SectionHead title="Presented By" />
              <div className="presenters-2">
                {PRESENTERS.map((p) => (
                  <div className="presenter" key={p.name}>
                    <Portrait size="lg" src={p.src} alt={p.name} />
                    <div className="presenter__name">{p.name}</div>
                    <div className="presenter__bio">{p.bio}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 — THE BONUS */}
      <section className="section">
        <div className="container">
          <div className="bonus">
            <div>
              <h2>{T("bonus_heading", "The Bonus")}</h2>
              <p>{T("bonus_body",
                "Register and you'll get the JobHacker Mission Card — the one-page operating system that turns a chaotic job hunt into a disciplined campaign: daily non-negotiables, a pipeline dashboard, and a weekly reset.")}</p>
            </div>
            <div className="bonus__art">🗂️</div>
          </div>
        </div>
      </section>

      {/* 8 — HERO QUOTE */}
      <section className="section section--tint">
        <div className="container hquote">
          <blockquote>“{T("hero_quote", "3 job offers in about 30 days… and a $60,000 raise! Hands down the best decision I've made.")}”</blockquote>
          <cite>— {T("hero_quote_attr", "Bill Gibbs, Sales & Marketing Executive 🇺🇸")}</cite>
        </div>
      </section>

      {/* 8b — SAVE THE DATE (pick a session) */}
      <section className="section" id="dates">
        <div className="container">
          <SectionHead title="Save the Date" lede="Pick the session that suits you — it runs every fortnight." />
          {events.length > 0 ? (
            <div className="when-grid">
              {events.map((ev, i) => {
                const w = formatEvent(ev);
                return (
                  <div className="when-card" key={ev.id || i}>
                    <div className="when-card__when">
                      <div className="when-card__v">{w?.date}</div>
                      <div className="when-card__t">{formatRange(ev)}</div>
                      <div className="when-card__loc">{T("event_location", "Online · Zoom")}</div>
                    </div>
                    <Button variant="primary" block onClick={() => openModal(i)}>{cta} →</Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="when-card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
              <div className="when-card__v">{T("event_date", "TBA")}</div>
              <Button variant="primary" size="lg" onClick={() => openModal(0)}>{cta} →</Button>
            </div>
          )}
          <div className="recur-note center">Can't make either? Register and we'll see you at the next fortnightly session.</div>
        </div>
      </section>

      {/* 9 — TESTIMONIALS + Meetup rating proof */}
      <Testimonials />
      <MeetupProof />

      {/* 10 — BUSINESS FOR GOOD */}
      <section className="section">
        <div className="container center">
          <SectionHead title={T("biz_heading", "Business for Good")} />
          <p className="section__lede">
            {T("biz_body",
              "JobHackers exists to put clarity and confidence back in the hands of people the market overlooked. A share of every program goes toward helping job seekers who can't yet afford support — because everyone deserves to be understood and chosen.")}
          </p>
        </div>
      </section>

      {/* 11 — TAKE ACTION */}
      <section className="section section--dark center">
        <div className="container">
          <h2 className="section__title">{T("action_statement_title", "The market changed the rules. Learn the new ones.")}</h2>
          <p className="section__lede" style={{ marginBottom: 28 }}>
            {T("action_statement", "Hope is not a strategy. Drift is not a strategy. Volume is not a strategy. Your next session starts soon.")}
          </p>
          <Button variant="primary" size="lg" onClick={openModal}>{cta} →</Button>
        </div>
      </section>

      <SiteFooter />

      {open && <SignupModal events={events} content={c} variant={variant} initialIndex={startIdx} onClose={() => setOpen(false)} />}
    </>
  );
}

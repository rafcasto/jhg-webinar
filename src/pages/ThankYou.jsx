import React, { useEffect, useState } from "react";
import SiteFooter from "../components/SiteFooter.jsx";
import ShareModule from "../components/ShareModule.jsx";
import { Portrait, Button } from "../components/ui.jsx";
import { getContent, getCtas, getNextEvent } from "../lib/api.js";
import { toEmbed, formatEvent } from "../lib/format.js";

const MEETUP_URL = "https://www.meetup.com/job-hackers-global/";

const FOUNDERS = [
  { name: "David Perry", src: "/assets/founder-david-perry.jpeg" },
  { name: "Laurent Simon", src: "/assets/founder-laurent-simon.jpeg" },
];

export default function ThankYou() {
  const [c, setC] = useState(null);
  const [cards, setCards] = useState([]);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [content, ctas, ev] = await Promise.all([
          getContent("thankyou"),
          getCtas("thankyou"),
          getNextEvent(),
        ]);
        setC(content);
        setCards(ctas);
        setEvent(ev);
      } catch (e) {
        console.error(e);
        setC({});
      }
    })();
  }, []);

  if (!c) return <div className="page-loading">Loading…</div>;

  const T = (k, def) => (c[k] && c[k].length ? c[k] : def);
  const mediaType = c.hero_media_type || "video";
  const mediaUrl = c.hero_media_url || c.video_url || "";
  const embed = toEmbed(mediaUrl);
  const hasMedia = (mediaType === "image" && mediaUrl) || embed;
  const when = formatEvent(event);

  // Step 1 — calendar card (first configured CTA, else a default calendar card).
  const calendarCta = cards[0] || null;

  // Step 3 — community card (a configured Meetup CTA, else the default Meetup card).
  const communityCta =
    cards.find((c) => (c.url || "").includes("meetup.com")) || null;

  return (
    <>
      <section className="ty-hero">
        <img className="ty-hero__hand" src="/assets/logo-hand.png" alt="" />
        <div className="container">
          <h1>{T("title", "You're in. One more move locks it in.")}</h1>
          <p>{T("subtitle", "Registrants who do the two steps below are the ones who show up live—and the ones who show up get the results.")}</p>
          {when && (
            <p style={{ marginTop: 14, color: "#fff", fontWeight: 600 }}>
              📅 {when.date} · 🕒 {when.time} ({when.tz})
            </p>
          )}

          {/* Video code path preserved: if CMS media is set later, it takes over;
              when empty, render the signed founder quote (no empty player). */}
          {hasMedia ? (
            <div className="ty-video">
              {mediaType === "image" && mediaUrl ? (
                <img src={mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <iframe src={embed} title="Welcome video" allow="autoplay; fullscreen; picture-in-picture" />
              )}
            </div>
          ) : (
            <div className="ty-quote">
              <div className="ty-quote__faces">
                {FOUNDERS.map((f) => (
                  <Portrait key={f.name} size="lg" src={f.src} alt={f.name} />
                ))}
              </div>
              <blockquote>
                {T("welcome_quote", "We built this MasterClass for professionals doing everything \"right\" and hearing nothing back. Bring your real situation—we'll bring the system 3,000+ professionals have used to get hired in weeks, not months. See you live.")}
              </blockquote>
              <cite>—David &amp; Laurent</cite>
            </div>
          )}
        </div>
      </section>

      <section className="ty-steps">
        <div className="container">
          <h2>{T("steps_title", "Complete next steps 👇")}</h2>

          {/* Step 1 — Add to calendar (primary ask) */}
          <div className="ty-step">
            <div className="ty-step__num">1</div>
            {calendarCta ? (
              <a className="ty-card ty-card--wide" href={calendarCta.url || "#"}
                 target={calendarCta.url && calendarCta.url.startsWith("http") ? "_blank" : undefined}
                 rel="noreferrer">
                <div className="ty-card__icon">{calendarCta.icon || "📅"}</div>
                <div className="ty-card__label">{calendarCta.label || "Add to your calendar"}</div>
                <div className="ty-card__sub">{calendarCta.sublabel || "Locks the time—and the people who add it are the ones who show up."}</div>
                <span className="btn btn--primary btn--block">{calendarCta.label || "Add to calendar"}</span>
              </a>
            ) : (
              <div className="ty-card ty-card--wide">
                <div className="ty-card__icon">📅</div>
                <div className="ty-card__label">Add to your calendar</div>
                <div className="ty-card__sub">Your join link and reminder will arrive by email. Adding it now is what separates the people who show up from the people who forget.</div>
              </div>
            )}
          </div>

          {/* Step 2 — Share it */}
          <div className="ty-step">
            <div className="ty-step__num">2</div>
            <ShareModule content={c} />
          </div>

          {/* Step 3 — Join the community */}
          <div className="ty-step">
            <div className="ty-step__num">3</div>
            <a className="ty-card ty-card--wide"
               href={communityCta?.url || MEETUP_URL}
               target="_blank" rel="noreferrer">
              <div className="ty-card__icon">{communityCta?.icon || "🤝"}</div>
              <div className="ty-card__label">{communityCta?.label || T("community_label", "Join the JobHackers community")}</div>
              <div className="ty-card__sub">{communityCta?.sublabel || T("community_sublabel", "4.5★ from 93 reviews—meet the people running the same playbook.")}</div>
              <span className="btn btn--primary btn--block">{communityCta?.label || "Join the community"}</span>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

import React, { useEffect, useState } from "react";
import SiteFooter from "../components/SiteFooter.jsx";
import { getContent, getCtas, getNextEvent } from "../lib/api.js";
import { toEmbed, formatEvent } from "../lib/format.js";

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

  const mediaType = c.hero_media_type || "video";
  const mediaUrl = c.hero_media_url || c.video_url || "";
  const embed = toEmbed(mediaUrl);
  const when = formatEvent(event);

  return (
    <>
      <section className="ty-hero">
        <img className="ty-hero__hand" src="/assets/logo-hand.png" alt="" />
        <div className="container">
          <h1>{c.title || "You're in! Next, watch this video"}</h1>
          <p>{c.subtitle || "Complete the next steps below so you get the most out of the workshop."}</p>
          {when && (
            <p style={{ marginTop: 14, color: "#fff", fontWeight: 600 }}>
              📅 {when.date} · 🕒 {when.time} ({when.tz})
            </p>
          )}
          <div className="ty-video">
            {mediaType === "image" && mediaUrl ? (
              <img src={mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : embed ? (
              <iframe src={embed} title="Welcome video" allow="autoplay; fullscreen; picture-in-picture" />
            ) : (
              <div className="ty-video-ph">▶ {mediaType === "image" ? "Image" : "Welcome video"}</div>
            )}
          </div>
        </div>
      </section>

      <section className="ty-steps">
        <div className="container">
          <h2>{c.steps_title || "Complete next steps 👇"}</h2>
          <div className="ty-cards">
            {cards.map((cta, i) => (
              <a className="ty-card" key={cta.id} href={cta.url || "#"}
                 target={cta.url && cta.url.startsWith("http") ? "_blank" : undefined}
                 rel="noreferrer">
                <div className="ty-card__num">{i + 1}.</div>
                <div className="ty-card__icon">{cta.icon || "✅"}</div>
                <div className="ty-card__sub">{cta.sublabel}</div>
                <span className="btn btn--primary btn--block">{cta.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

import React from "react";

// Real Meetup social proof (from job-hackers-global feedback overview).
// Reviews there are rating/tag-based (free-text reviews aren't public),
// so we feature the genuine rating + top "what people liked" tags.
const RATING = 4.5;
const COUNT = 93;
const TAGS = [
  ["Engaging", 50],
  ["Welcoming host", 40],
  ["Made an impact", 34],
  ["Inclusive attendees", 26],
  ["Was as described", 24],
  ["Punctual start", 23],
];
const URL = "https://www.meetup.com/job-hackers-global/feedback-overview/";

function Stars({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="mu-stars" aria-label={`${value} out of 5`}>
      {"★".repeat(full)}{half ? "½" : ""}
    </span>
  );
}

export default function MeetupProof() {
  return (
    <section className="section mu-proof" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="mu-card">
          <div className="mu-card__score">
            <div className="mu-card__num">{RATING.toFixed(1)}</div>
            <Stars value={RATING} />
            <a className="mu-card__count" href={URL} target="_blank" rel="noreferrer">
              {COUNT} reviews on Meetup →
            </a>
          </div>
          <div className="mu-card__tags">
            <div className="mu-card__tags-head">What attendees liked</div>
            <div className="mu-tags">
              {TAGS.map(([t, n]) => (
                <span className="mu-tag" key={t}>{t} <b>{n}</b></span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { Portrait, SectionHead } from "./ui.jsx";

// Real, attributed reviews published on jobhackers.global.
// (Meetup feedback page is JS-rendered and couldn't be scraped statically —
//  swap to Meetup reviews once Chrome/Meetup API access is available.)
const ITEMS = [
  { quote: "€22,000 extra in only 45 days. I interviewed with 8 companies and secured a job I really love. I wholeheartedly recommend the JHG experience.", name: "Natalie Owen", role: "Insurance Professional 🇩🇪" },
  { quote: "Jobless for 8 months, hired in about 30 days. Outstanding support from the mentors and the community, with a robust process and tools that deliver real results.", name: "Daria Pinchuk", role: "Software Tester 🇦🇺" },
  { quote: "Two job offers within three weeks! JobHackers Global 100% surpasses the traditional outplacement paid by my former employer.", name: "Alexandra Moorhouse", role: "Chief Digital Officer 🇺🇸" },
];

export default function Testimonials() {
  return (
    <section className="section section--tint" id="stories">
      <div className="container">
        <SectionHead eyebrow="Success stories" title="Real members. Real offers." />
        <div className="grid-3 testimonial-grid">
          {ITEMS.map((t, i) => (
            <div className="testimonial-card testimonial-card--grid" key={i}>
              <p className="testimonial-card__quote">“{t.quote}”</p>
              <div className="testimonial-card__attr">
                <Portrait initials={t.name.split(" ").map((w) => w[0]).join("")} />
                <div>
                  <div className="testimonial-card__name">{t.name}</div>
                  <div className="testimonial-card__role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

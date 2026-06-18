import React from "react";

// "As seen in" press logos (from JHG media kit). Static brand assets.
const LOGOS = [
  { src: "/assets/logos/forbes.svg", alt: "Forbes" },
  { src: "/assets/logos/fortune.svg", alt: "Fortune" },
  { src: "/assets/logos/wsj.svg", alt: "The Wall Street Journal" },
  { src: "/assets/logos/nyt.svg", alt: "The New York Times" },
  { src: "/assets/logos/msnbc.svg", alt: "MSNBC" },
  { src: "/assets/logos/insead.svg", alt: "INSEAD" },
];

export default function LogoBar({ caption }) {
  return (
    <section className="section logo-bar-wrap" style={{ paddingTop: 0 }}>
      <div className="container">
        {caption && <p className="center muted logo-bar__cap">{caption}</p>}
        <div className="logo-bar">
          {LOGOS.map((l) => (
            <img key={l.alt} src={l.src} alt={l.alt} loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { Portrait, SectionHead } from "./ui.jsx";

const PEOPLE = [
  { name: "Laurent Simon", role: "Co-founder, JobHackers", src: "/assets/founder-laurent-simon.jpeg",
    bio: "Built the 30-day Job Hacking challenge that's coached 1,200+ members." },
  { name: "Rafael Castillo", role: "Co-founder, JobHackers", src: "/assets/founder-rafael-castillo.jpeg",
    bio: "Turns the playbook into done-for-you systems members actually use." },
  { name: "David Perry", role: "Contributor · Author", src: "/assets/founder-david-perry.jpeg",
    bio: "Author of \"Guerrilla Marketing for Job Hunters\" — the hidden-market specialist." },
];

export default function Presenters() {
  return (
    <section className="section" id="presenters">
      <div className="container">
        <SectionHead eyebrow="Your presenters" title="Hosted by the people who wrote the playbook" />
        <div className="founders">
          {PEOPLE.map((p) => (
            <div className="founder" key={p.name}>
              <Portrait size="lg" src={p.src} alt={p.name} />
              <div>
                <div className="founder__name">{p.name}</div>
                <div className="founder__role">{p.role}</div>
              </div>
              <p className="founder__bio">{p.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

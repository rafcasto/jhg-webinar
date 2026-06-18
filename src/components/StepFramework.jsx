import React from "react";
import { SectionHead } from "./ui.jsx";

const STEPS = [
  { emoji: "🎯", title: "Focus", desc: "Start with clear objectives." },
  { emoji: "💎", title: "Value", desc: "Craft a compelling value proposition and resume(s)." },
  { emoji: "💼", title: "Profile", desc: "Boost your LinkedIn profile." },
  { emoji: "✅", title: "Applications", desc: "Crack the visible job market (20% of results)." },
  { emoji: "🤝", title: "Network", desc: "Crack the hidden job market (80% of results)." },
  { emoji: "💬", title: "Interviews", desc: "Ace your interviews." },
  { emoji: "🤑", title: "Deal", desc: "Maximize your offer(s)." },
];

export default function StepFramework() {
  return (
    <section className="section" id="playbook">
      <div className="container">
        <SectionHead
          eyebrow="The Playbook"
          title="The 7-step Job Hacking framework"
          lede="The exact path we walk you through live — from a clear goal to a signed offer."
        />
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-card__num">{i + 1}</div>
              <div className="step-card__emoji">{s.emoji}</div>
              <div className="step-card__title">{s.title}</div>
              <div className="step-card__desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

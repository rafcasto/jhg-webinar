import React from "react";
import { SectionHead } from "./ui.jsx";

// NOTE: This component is not currently imported/rendered anywhere. Kept in sync with
// canon (8-step roadmap; hidden market = 70–80% of roles). The 8th step's content is
// NOT in the self-contained copy plan, so it's marked [PLACEHOLDER] rather than invented.
const STEPS = [
  { emoji: "🎯", title: "Focus", desc: "Start with clear objectives." },
  { emoji: "💎", title: "Value", desc: "Craft a compelling value proposition and resume(s)." },
  { emoji: "💼", title: "Profile", desc: "Boost your LinkedIn profile." },
  { emoji: "✅", title: "Applications", desc: "Work the visible job market (the minority of roles)." },
  { emoji: "🤝", title: "Network", desc: "Crack the hidden job market (70–80% of roles are never advertised)." },
  { emoji: "💬", title: "Interviews", desc: "Ace your interviews." },
  { emoji: "🤑", title: "Deal", desc: "Maximize your offer(s)." },
  { emoji: "🧭", title: "[PLACEHOLDER]", desc: "[PLACEHOLDER — confirm step 8 from the 8-step roadmap]" },
];

export default function StepFramework() {
  return (
    <section className="section" id="playbook">
      <div className="container">
        <SectionHead
          eyebrow="The Playbook"
          title="The 8-step Job Hacking framework"
          lede="The exact path we walk you through live—from a clear goal to a signed offer."
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

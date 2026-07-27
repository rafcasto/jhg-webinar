import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter.jsx";
import { Button } from "../components/ui.jsx";
import { getContent, getReferralProgress } from "../lib/api.js";

const LINKEDIN_SHARE_URL = "https://www.linkedin.com/feed/?shareActive=true";
const origin = () => (typeof window !== "undefined" ? window.location.origin : "");

function useCopy() {
  const [copied, setCopied] = useState("");
  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }
  return [copied, copy];
}

/**
 * /referral — the share-to-win page shown after the quiz. Replaces the old
 * thank-you. The person shares their unique invite link (or a templated email);
 * when enough people register via it they win a 30-minute mentor call (the
 * booking automation is handled Kit-side once they're tagged as a winner).
 */
export default function Referral() {
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [p, setP] = useState(null); // { code, referral_count, target, won }
  const [copied, copy] = useCopy();
  const email = sessionStorage.getItem("jhg_email");

  useEffect(() => {
    if (!email) { navigate("/"); return; }
    (async () => {
      try {
        const [content, prog] = await Promise.all([getContent("referral"), getReferralProgress(email)]);
        setC(content);
        setP(prog || {});
      } catch (e) { console.error(e); setC({}); setP({}); }
    })();
  }, [email, navigate]);

  if (!c || !p) return <div className="page-loading">Loading…</div>;

  // Fall back to the default only when the CMS has no row for this key.
  // If an admin clears a field (empty string), render it empty — don't re-inject the default.
  const T = (k, def) => (Object.prototype.hasOwnProperty.call(c, k) ? (c[k] ?? "") : def);
  const count = Number(p.referral_count || 0);
  const target = Number(p.target || 15);
  const left = Math.max(0, target - count);
  const pct = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;
  const won = !!p.won;

  const link = `${origin()}/?ref=${p.code || ""}`;
  const post =
    `AI changed hiring faster than most of us changed our job-search habits. ` +
    `David Perry (author of "Guerrilla Marketing for Job Hunters") and Laurent Simon are teaching a free live ` +
    `MasterClass on how to secure a role you love — without applying online. Worth a look for anyone navigating this market: ${link}`;
  const emailSubject = "A free MasterClass that's worth your time";
  const emailBody =
    `Hi,\n\nI just registered for a free live MasterClass with David Perry and Laurent Simon on getting hired ` +
    `without applying online — genuinely useful for anyone navigating this job market.\n\n` +
    `You can grab a free seat here: ${link}\n\nWorth a look.`;
  const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const progressLabel = T("target_label", "{count} of {target} referrals — {left} to go")
    .replace("{count}", count).replace("{target}", target).replace("{left}", left);

  return (
    <>
      <main className="ty-page">
        <div className="ty-inner ref-wrap">
          <div className="ty-check">🎉</div>
          <div className="ty-eyebrow">{T("eyebrow", "ALL DONE")}</div>
          <h1 className="ty-title">{T("title", "Your 5 Prompts Are On Their Way.")}</h1>
          <p className="ty-sub">{T("subtitle", "Check your inbox in the next few minutes for your copy-paste prompt playbook. While you wait — here's how to unlock a free 1-to-1 call with a JobHackers mentor.")}</p>

          {won && (
            <div className="ref-win">
              <h2>{T("success_title", "🎉 You did it — your mentor call is unlocked!")}</h2>
              <p>{T("success_body", "Keep an eye on your inbox — we'll email you a link to book your free 30-minute call with a JobHackers mentor.")}</p>
            </div>
          )}

          <div className="ref-block">
            <h2 className="ref-block__title">{T("reward_title", "Refer friends. Win a 30-minute mentor call.")}</h2>
            <p className="ref-block__body">{T("reward_body", "Share your invite link (or the templated email) with people who'd benefit. When enough of them register for the MasterClass, you earn a private 30-minute call with one of our Global mentors.")}</p>

            {!won && (
              <div className="ref-progress">
                <div className="ref-progress__bar"><div className="ref-progress__fill" style={{ width: `${pct}%` }} /></div>
                <div className="ref-progress__label">{progressLabel}</div>
              </div>
            )}

            <h3 className="ref-share__h">{T("share_heading", "Invite someone who's stuck too.")}</h3>

            {/* Unique invite link */}
            <div className="ref-field">
              <label className="field-mini">Your invite link</label>
              <div className="ref-copyrow">
                <input className="admin-input" readOnly value={link} onFocus={(e) => e.target.select()} />
                <Button variant="secondary" onClick={() => copy(link, "link")}>{copied === "link" ? "Copied ✓" : "Copy link"}</Button>
              </div>
            </div>

            <div className="ref-actions">
              {/* LinkedIn: copy the post, then open LinkedIn */}
              <Button variant="secondary" onClick={() => copy(post, "post")}>{copied === "post" ? "Copied ✓" : "Copy LinkedIn post"}</Button>
              <Button variant="primary" href={LINKEDIN_SHARE_URL} target="_blank" rel="noreferrer">
                {T("cta_label", "Share on LinkedIn →")}
              </Button>
              {/* Templated email */}
              <Button variant="secondary" href={mailto}>Send templated email</Button>
              <Button variant="secondary" onClick={() => copy(emailBody, "email")}>{copied === "email" ? "Copied ✓" : "Copy email"}</Button>
            </div>
            <p className="ref-note">Copy the post, then paste it into LinkedIn. Anyone who registers through your link counts toward your call.</p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

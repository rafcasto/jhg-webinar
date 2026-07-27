import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter.jsx";
import { Button } from "../components/ui.jsx";
import { getContent, getReferralProgress } from "../lib/api.js";

const origin = () => (typeof window !== "undefined" ? window.location.origin : "");

// Referral integrity first. The feed composer's ?text= link gets rebuilt into a
// card off the page's canonical/og:url, which drops the ?ref= code. share-offsite
// forces the card to be our EXACT referral URL, so the ref code always survives.
// It can't pre-fill a caption, so we copy the caption to the clipboard on click.
const linkedInShare = (url) =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

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

/** Fetch referral progress with a couple of quick retries — the RPC generates
 *  the person's share code, so a transient failure must not leave the link
 *  empty. Returns the row ({ code, won, ... }) or null. */
async function fetchProgress(email, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const p = await getReferralProgress(email);
      if (p?.code) return p;
    } catch (e) {
      console.warn(`[referral progress] attempt ${i + 1} failed:`, e?.message || e);
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

/**
 * /referral — the share-to-win page shown after the quiz. The person shares
 * their unique invite link (or a templated email); when enough people register
 * via it they win a 30-minute mentor call (booking is handled Kit-side once
 * they're tagged as a winner). No live counter is shown — the tally lives in
 * the admin Call Winners tab.
 */
export default function Referral() {
  const navigate = useNavigate();
  const [c, setC] = useState(null);   // CMS content map for page 'referral'
  const [code, setCode] = useState(null);
  const [won, setWon] = useState(false);
  const [copied, copy] = useCopy();
  const email = sessionStorage.getItem("jhg_email");

  useEffect(() => {
    if (!email) { navigate("/"); return; }
    // Content and progress are independent: a failure in one must never blank
    // the other (the old Promise.all wiped the whole page — and the link —
    // whenever the progress RPC hiccuped).
    getContent("referral").then(setC).catch((e) => { console.error(e); setC({}); });
    fetchProgress(email).then((p) => {
      if (!p) return;
      setCode(p.code || null);
      setWon(!!p.won);
    });
  }, [email, navigate]);

  if (!c) return <div className="page-loading">Loading…</div>;

  // Content-driven rendering. Missing key → fall back to the seeded default.
  // Present-but-empty (an admin cleared the field) → treated as hidden.
  const val = (k, def) => (Object.prototype.hasOwnProperty.call(c, k) ? (c[k] ?? "") : def);
  const has = (k, def) => String(val(k, def)).trim() !== "";

  const ready = !!code;
  const link = ready ? `${origin()}/?ref=${code}` : "";

  const post =
    `AI changed hiring faster than most of us changed our job-search habits. ` +
    `David Perry (author of "Guerrilla Marketing for Job Hunters") and Laurent Simon are teaching a free live ` +
    `MasterClass on how to secure a role you love — without applying online. Worth a look for anyone navigating this market: ${link}`;
  const emailBody =
    `Hi,\n\nI just registered for a free live MasterClass with David Perry and Laurent Simon on getting hired ` +
    `without applying online — genuinely useful for anyone navigating this job market.\n\n` +
    `You can grab a free seat here: ${link}\n\nWorth a look.`;

  const showReward = has("reward_title", "Refer friends. Win a 30-minute mentor call.") ||
                     has("reward_body", "x");

  return (
    <>
      <main className="ty-page">
        <div className="ty-inner ref-wrap">
          {won && has("success_title", "🎉 You did it — your mentor call is unlocked!") && (
            <div className="ref-win">
              <h2>{val("success_title", "🎉 You did it — your mentor call is unlocked!")}</h2>
              {has("success_body", "x") && (
                <p>{val("success_body", "Keep an eye on your inbox — we'll email you a link to book your free 30-minute call with a JobHackers mentor.")}</p>
              )}
            </div>
          )}

          {/* 1 — headline */}
          {has("title", "Your 5 Prompts Are On Their Way.") && (
            <h1 className="ty-title">{val("title", "Your 5 Prompts Are On Their Way.")}</h1>
          )}

          {/* 2 — subtitle */}
          {has("subtitle", "x") && (
            <p className="ty-sub">{val("subtitle", "Check your inbox in the next few minutes for your copy-paste prompt playbook. While you wait — here's how to unlock a free 1-to-1 call with a JobHackers mentor.")}</p>
          )}

          {showReward && (
            <div className="ref-block">
              {/* 3 — reward heading + body */}
              {has("reward_title", "Refer friends. Win a 30-minute mentor call.") && (
                <h2 className="ref-block__title">{val("reward_title", "Refer friends. Win a 30-minute mentor call.")}</h2>
              )}
              {has("reward_body", "x") && (
                <p className="ref-block__body">{val("reward_body", "Share your invite link (or the templated email) with people who'd benefit. When enough of them register for the MasterClass, you earn a private 30-minute call with one of our Global mentors.")}</p>
              )}

              {/* 4 — invite link + copy */}
              <div className="ref-field">
                <label className="field-mini">Your invite link</label>
                <div className="ref-copyrow">
                  <input
                    className="admin-input"
                    readOnly
                    value={ready ? link : "Generating your link…"}
                    onFocus={(e) => ready && e.target.select()}
                  />
                  <Button variant="secondary" disabled={!ready} onClick={() => copy(link, "link")}>
                    {copied === "link" ? "Copied ✓" : "Copy link"}
                  </Button>
                </div>
              </div>

              {/* 5 — primary LinkedIn share: attaches the ?ref= link, copies the caption */}
              {ready ? (
                <Button variant="primary" block href={linkedInShare(link)} target="_blank" rel="noreferrer"
                  onClick={() => copy(post, "post")}>
                  {val("cta_label", "Share on LinkedIn →")}
                </Button>
              ) : (
                <Button variant="primary" block disabled>
                  {val("cta_label", "Share on LinkedIn →")}
                </Button>
              )}
              <p className="ref-hint">
                {copied === "post"
                  ? "Your referral link is attached and the caption is copied — paste (⌘/Ctrl+V), then Post."
                  : "Opens LinkedIn with your referral link attached; your caption copies so you can paste it in."}
              </p>

              {/* 6 — or copy the templated email */}
              <div className="ref-or"><span>or you can:</span></div>
              <div className="ref-emailbox">
                <label className="field-mini">Copy this email and send it to anyone who'd benefit</label>
                <textarea className="admin-input ref-emailtext" readOnly rows={7} value={ready ? emailBody : "Generating your link…"} />
                <Button variant="secondary" block disabled={!ready} onClick={() => copy(emailBody, "email")}>
                  {copied === "email" ? "Copied ✓" : "Copy email"}
                </Button>
              </div>

              <p className="ref-note">Anyone who registers through your link counts toward your mentor call.</p>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

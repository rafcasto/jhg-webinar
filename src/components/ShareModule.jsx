import React, { useState } from "react";
import { Button } from "./ui.jsx";

// The landing page IS the registration page — never hardcode a domain.
const origin = () => (typeof window !== "undefined" ? window.location.origin : "");

const LINKEDIN_SHARE_URL = "https://www.linkedin.com/feed/?shareActive=true";

// Identity-safe: frames sharing as recommending a resource, NOT "I'm job hunting."
const publicPost = (url) =>
  `AI changed hiring faster than most of us changed our job-search habits. David Perry (author of "Guerrilla Marketing for Job Hunters") and Laurent Simon are teaching a free live MasterClass on how to secure a role you love—without applying online. Worth a look for anyone navigating this market: ${url}`;

function CopyButton({ text, label = "Copy", copiedLabel = "Copied ✓" }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="secondary" onClick={copy} type="button">
      {copied ? copiedLabel : label}
    </Button>
  );
}

export default function ShareModule({ content = {} }) {
  const url = origin();
  const post = publicPost(url);

  return (
    <div className="share-module">
      <h3 className="share-module__title">
        {content.share_heading || "Someone in your network is stuck too."}
      </h3>

      <div className="share-grid">
        {/* Public path — recommend a resource, identity-safe */}
        <div className="share-card">
          <div className="share-card__k">Post it to LinkedIn</div>
          <p className="share-card__preview">{post}</p>
          <div className="share-card__actions">
            <CopyButton text={post} label="Copy post" copiedLabel="Copied ✓" />
            <Button variant="primary" href={LINKEDIN_SHARE_URL} target="_blank" rel="noreferrer">
              Open LinkedIn →
            </Button>
          </div>
          <p className="share-card__note">Copy the post, then paste it into LinkedIn.</p>
        </div>

        {/* Private path — send the seat link directly */}
        <div className="share-card">
          <div className="share-card__k">Send it to one person</div>
          <p className="share-card__preview">
            {content.share_private || "Know one person stuck in their search? Send them your seat link."}
          </p>
          <div className="share-card__actions">
            <CopyButton text={url} label="Copy link" copiedLabel="Copied ✓" />
          </div>
          <p className="share-card__note">{url}</p>
        </div>
      </div>
    </div>
  );
}

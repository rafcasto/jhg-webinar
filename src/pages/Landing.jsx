import React, { useEffect, useState } from "react";
import LandingA from "./LandingA.jsx";
import LandingB from "./LandingB.jsx";
import { resolveVariant, recordExposure } from "../lib/abtest.js";

/**
 * A/B router for the landing page. Resolves the visitor's variant from the
 * experiment config (sticky per visitor), counts one exposure, then renders
 * the matching layout. ?v=a / ?v=b forces a variant for QA (not counted).
 */
export default function Landing() {
  const [variant, setVariant] = useState(null);

  useEffect(() => {
    let alive = true;
    resolveVariant().then(({ variant, forced }) => {
      if (!alive) return;
      setVariant(variant);
      if (!forced) recordExposure(variant);
    });
    return () => { alive = false; };
  }, []);

  if (!variant) return <div className="page-loading">Loading…</div>;
  return variant === "b" ? <LandingB variant="b" /> : <LandingA variant="a" />;
}

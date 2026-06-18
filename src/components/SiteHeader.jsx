import React from "react";
import { Button } from "./ui.jsx";

export default function SiteHeader({ onRegister, ctaLabel = "Save My Seat" }) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a className="site-header__logo" href="/">
          <img src="/assets/logo-jobhackers.png" alt="JobHackers.global" />
        </a>
        <nav className="site-header__nav">
          <a href="#who">Who it's for</a>
          <a href="#method">The Method</a>
          <a href="#stories">Stories</a>
        </nav>
        <div className="site-header__cta">
          <Button variant="primary" onClick={onRegister}>{ctaLabel}</Button>
        </div>
      </div>
    </header>
  );
}

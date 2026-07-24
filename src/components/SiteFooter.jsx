import React from "react";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div>
            <div className="site-footer__logo">
              <img src="/assets/logo-jobhackers.png" alt="JobHackers.global" />
            </div>
            <div className="site-footer__tagline">Live life on your own terms</div>
          </div>
          <div className="site-footer__col">
            <h4>Program</h4>
            <ul>
              <li><a href="https://jobhackers.global" target="_blank" rel="noreferrer">The Challenge</a></li>
              <li><a href="#playbook">The 8-step Playbook</a></li>
              <li><a href="#stories">Success Stories</a></li>
            </ul>
          </div>
          <div className="site-footer__col">
            <h4>Company</h4>
            <ul>
              <li><a href="https://jobhackers.global" target="_blank" rel="noreferrer">jobhackers.global</a></li>
              <li><a href="https://www.meetup.com/job-hackers-global/" target="_blank" rel="noreferrer">Meetup community</a></li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} JobHackers Global</span>
          <span>Share the ❤ but don't steal the IP</span>
        </div>
      </div>
    </footer>
  );
}

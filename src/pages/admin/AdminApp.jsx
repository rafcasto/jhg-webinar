import React, { useEffect, useState } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Dashboard from "./Dashboard.jsx";
import ContentEditor from "./ContentEditor.jsx";
import LeadFormPanel from "./LeadFormPanel.jsx";
import QuestionsPanel from "./QuestionsPanel.jsx";
import ResultsPanel from "./ResultsPanel.jsx";

const TABS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/site", label: "Site & Meta" },
  { to: "/admin/landing", label: "Landing" },
  { to: "/admin/leadform", label: "Lead Form" },
  { to: "/admin/questions", label: "Questions" },
  { to: "/admin/results", label: "Results" },
];

export default function AdminApp() {
  const navigate = useNavigate();
  const [session, setSession] = useState(undefined); // undefined = loading
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  if (session === undefined) return <div className="page-loading">Loading…</div>;
  if (!session) return <Navigate to="/admin/login" replace />;
  if (isAdmin === null) return <div className="page-loading">Checking access…</div>;
  if (isAdmin === false) {
    return (
      <div className="login-wrap">
        <div className="login-card center">
          <h2 style={{ fontFamily: "var(--font-display)" }}>No admin access</h2>
          <p className="muted">{session.user.email} isn't on the admin allowlist.</p>
          <button className="btn btn--secondary" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm">
      <div className="adm-top">
        <div className="adm-top__in">
          <div className="adm-top__brand">⚙️ JobHackers Admin</div>
          <div className="adm-top__right">
            <span className="email">{session.user.email}</span>
            <a href="/" target="_blank" rel="noreferrer"><u>View site</u> ↗</a>
            <button onClick={signOut}>Sign out</button>
          </div>
        </div>
      </div>

      <div className="adm-tabsbar">
        <nav className="adm-tabs">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={({ isActive }) => "adm-tab" + (isActive ? " active" : "")}>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="adm-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="site" element={
            <ContentEditor title="Site & Meta" pages={["thankyou", "quiz"]} />} />
          <Route path="landing" element={
            <ContentEditor title="Landing page content" pages={["landing"]} />} />
          <Route path="leadform" element={<LeadFormPanel />} />
          <Route path="questions" element={<QuestionsPanel />} />
          <Route path="results" element={<ResultsPanel />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

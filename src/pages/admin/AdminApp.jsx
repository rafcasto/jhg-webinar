import React, { useEffect, useState } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import LeadsPanel from "./LeadsPanel.jsx";
import ContentPanel from "./ContentPanel.jsx";
import CtasPanel from "./CtasPanel.jsx";
import QuestionsPanel from "./QuestionsPanel.jsx";

export default function AdminApp() {
  const navigate = useNavigate();
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div className="page-loading">Loading…</div>;
  if (!session) return <Navigate to="/admin/login" replace />;

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="brand">JHG Admin</div>
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : "")}>Leads</NavLink>
        <NavLink to="/admin/content" className={({ isActive }) => (isActive ? "active" : "")}>Page content</NavLink>
        <NavLink to="/admin/ctas" className={({ isActive }) => (isActive ? "active" : "")}>CTAs &amp; links</NavLink>
        <NavLink to="/admin/questions" className={({ isActive }) => (isActive ? "active" : "")}>Quiz questions</NavLink>
        <a href="#" onClick={(e) => { e.preventDefault(); signOut(); }} style={{ marginTop: 24, opacity: .7 }}>Sign out</a>
        <a href="/" style={{ opacity: .7 }}>← View site</a>
      </aside>
      <main className="admin__main">
        <Routes>
          <Route index element={<LeadsPanel />} />
          <Route path="content" element={<ContentPanel />} />
          <Route path="ctas" element={<CtasPanel />} />
          <Route path="questions" element={<QuestionsPanel />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./styles/tokens.css";
import "./styles/app.css";

import Landing from "./pages/Landing.jsx";
import Registered from "./pages/Registered.jsx";
import Quiz from "./pages/Quiz.jsx";
import Referral from "./pages/Referral.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminApp from "./pages/admin/AdminApp.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registered" element={<Registered />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/referral" element={<Referral />} />
        {/* Old thank-you is replaced by the referral share page. */}
        <Route path="/thank-you" element={<Navigate to="/referral" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

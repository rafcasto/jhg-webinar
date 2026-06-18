import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui.jsx";
import { getQuiz, completeQuiz, enrollInKit, readSource } from "../lib/api.js";

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: [optionValue] }
  const [busy, setBusy] = useState(false);
  const email = sessionStorage.getItem("jhg_email");

  useEffect(() => {
    if (!email) { navigate("/"); return; }
    getQuiz().then(setQuestions).catch((e) => { console.error(e); setQuestions([]); });
  }, [email, navigate]);

  if (!questions) return <div className="page-loading">Loading…</div>;
  if (!questions.length) return <div className="page-loading">No questions configured.</div>;

  const total = questions.length;
  const q = questions[idx];
  const selected = answers[q.id] || [];
  const pct = Math.round((idx / total) * 100);

  function choose(value) {
    setAnswers((a) => {
      if (q.type === "multi") {
        const cur = new Set(a[q.id] || []);
        cur.has(value) ? cur.delete(value) : cur.add(value);
        return { ...a, [q.id]: [...cur] };
      }
      return { ...a, [q.id]: [value] };
    });
  }

  async function next() {
    if (idx < total - 1) { setIdx(idx + 1); return; }
    setBusy(true);
    try {
      const res = await completeQuiz({ email, answers, source: readSource() });
      sessionStorage.setItem("jhg_quiz", JSON.stringify(res || {}));
      if (res?.id) enrollInKit(res.id);
      navigate("/thank-you");
    } catch (e) {
      console.error(e);
      setBusy(false);
      navigate("/thank-you"); // never trap the user
    }
  }

  function back() {
    if (idx > 0) setIdx(idx - 1);
    else navigate("/");
  }

  const canAdvance = selected.length > 0;

  return (
    <div className="quiz-wrap">
      <div className="quiz-progress">
        <div className="quiz-progress__bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="quiz-progress__label">{pct}% Complete</div>

      <div className="quiz-main">
        <div className="quiz-card">
          <button className="quiz-back" onClick={back}>← Back</button>
          {idx === 0 && q.help_text && <p className="quiz-intro">{q.help_text}</p>}
          <h1 className="quiz-q">{q.prompt}</h1>
          <div className="quiz-options">
            {q.options.map((o) => {
              const on = selected.includes(o.value);
              return (
                <button key={o.id} className={"quiz-opt" + (on ? " is-selected" : "")} onClick={() => choose(o.value)}>
                  <span className="radio" />
                  {o.label}
                </button>
              );
            })}
          </div>
          <div className="quiz-foot">
            <Button variant="primary" size="lg" onClick={next} disabled={!canAdvance || busy}>
              {idx < total - 1 ? "Next →" : busy ? "Submitting…" : "Finish →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

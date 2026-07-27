import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";

/**
 * Winners — everyone who hit the referral target and earned the 30-minute
 * mentor call. Rows are written server-side by record_referral(). The actual
 * booking sequence is handled Kit-side once the winner is tagged.
 */
export default function WinnersPanel() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    supabase.from("referral_winners").select("*").order("won_at", { ascending: false })
      .then(({ data, error }) => { if (error) console.error(error); setRows(data || []); });
  }, []);

  if (!rows) return <p className="muted">Loading…</p>;

  const csv = () => {
    const head = ["email", "first_name", "referral_count", "target", "won_at"];
    const lines = rows.map((r) => head.map((k) => JSON.stringify(r[k] ?? "")).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "referral-winners.csv"; a.click();
  };

  return (
    <>
      <div className="adm-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="adm-h" style={{ margin: 0 }}>Call Winners — {rows.length}</h1>
        <button className="btn btn--secondary" onClick={csv} disabled={!rows.length}>Export CSV</button>
      </div>
      <p className="muted" style={{ marginBottom: 18, maxWidth: 720 }}>
        People who reached the referral target and earned a free 30-minute mentor call.
        Booking is triggered Kit-side when they're tagged as a winner.
      </p>

      <div className="adm-panel">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Referrals</th><th>Target</th><th>Won at</th></tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.email}>
                <td>{w.first_name || "—"}</td>
                <td>{w.email}</td>
                <td><b>{w.referral_count}</b></td>
                <td>{w.target}</td>
                <td>{new Date(w.won_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="muted">No winners yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

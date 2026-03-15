import { useState } from "react";
import { getInsights } from "../api";

export default function InsightsPanel() {
  const [userId, setUserId] = useState("");
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getInsights(userId.trim());
      setInsights(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ambienceEmoji = { forest: "🌲", ocean: "🌊", mountain: "⛰️" };

  return (
    <div className="fade-in">
      {/* Search */}
      <div className="card soft-shadow" style={{ marginBottom: "2rem", padding: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" htmlFor="insightsUserId">User ID</label>
            <input
              id="insightsUserId"
              className="form-input"
              type="text"
              placeholder="Enter user ID to view insights"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInsights()}
            />
          </div>
          <button className="btn btn-primary" onClick={fetchInsights} disabled={loading}>
            {loading ? <div className="spinner" /> : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>insights</span>
                Load Insights
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "var(--error-container)", color: "var(--on-error-container)", marginBottom: "1rem", padding: "1rem" }}>
          {error}
        </div>
      )}

      {!insights && !loading && (
        <div className="card soft-shadow">
          <div className="empty-state">
            <span className="material-symbols-outlined">bar_chart</span>
            <p>Enter a User ID and click "Load Insights" to view your emotional journey.</p>
          </div>
        </div>
      )}

      {insights && insights.totalEntries === 0 && (
        <div className="card soft-shadow">
          <div className="empty-state">
            <span className="material-symbols-outlined">edit_note</span>
            <p>No entries found for this user. Start writing journal entries to see insights!</p>
          </div>
        </div>
      )}

      {insights && insights.totalEntries > 0 && (
        <div className="fade-in">
          {/* Stat Cards */}
          <div className="insights-grid" style={{ marginBottom: "2rem" }}>
            <div className="card soft-shadow stat-card">
              <div className="stat-value">{insights.totalEntries}</div>
              <div className="stat-label">Total Entries</div>
            </div>
            <div className="card soft-shadow stat-card">
              <div className="stat-value" style={{ fontSize: "1.75rem", textTransform: "capitalize" }}>
                {insights.topEmotion || "—"}
              </div>
              <div className="stat-label">Top Emotion</div>
            </div>
            <div className="card soft-shadow stat-card">
              <div className="stat-value" style={{ fontSize: "1.75rem" }}>
                {ambienceEmoji[insights.mostUsedAmbience] || ""} {insights.mostUsedAmbience || "—"}
              </div>
              <div className="stat-label">Favorite Ambience</div>
            </div>
          </div>

          {/* Keywords */}
          {insights.recentKeywords && insights.recentKeywords.length > 0 && (
            <div className="card soft-shadow" style={{ padding: "2rem" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 className="card-title">Recent Keywords</h2>
                <p className="card-subtitle">Extracted from your last 10 analyzed entries</p>
              </div>
              <div className="keyword-cloud">
                {insights.recentKeywords.map((kw, i) => (
                  <span key={i} className="keyword-chip">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tip Card */}
          <div className="card-accent analyze-card" style={{ marginTop: "2rem" }}>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.5rem" }}>
              💡 Insight Tip
            </h3>
            <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
              Write more journal entries and analyze them to build a richer emotional profile.
              The more data you provide, the more meaningful your insights become!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

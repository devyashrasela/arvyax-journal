import { useState } from "react";
import { getEntries, analyzeText } from "../api";

export default function EntriesList() {
  const [userId, setUserId] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});
  const [error, setError] = useState(null);

  const fetchEntries = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEntries(userId.trim());
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (entry) => {
    setAnalyzing(entry.id);
    try {
      const result = await analyzeText(entry.text);
      setAnalysisResults((prev) => ({ ...prev, [entry.id]: result }));
    } catch (err) {
      setAnalysisResults((prev) => ({
        ...prev,
        [entry.id]: { error: err.message },
      }));
    } finally {
      setAnalyzing(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ambienceClass = {
    forest: "ambience-forest",
    ocean: "ambience-ocean",
    mountain: "ambience-mountain",
  };

  const ambienceEmoji = { forest: "🌲", ocean: "🌊", mountain: "⛰️" };

  return (
    <div className="fade-in">
      {/* Search bar */}
      <div className="card soft-shadow" style={{ marginBottom: "2rem", padding: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" htmlFor="searchUserId">User ID</label>
            <input
              id="searchUserId"
              className="form-input"
              type="text"
              placeholder="Enter user ID to view entries"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchEntries()}
            />
          </div>
          <button className="btn btn-primary" onClick={fetchEntries} disabled={loading}>
            {loading ? <div className="spinner" /> : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>
                Load Entries
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

      {/* Entries */}
      {entries.length === 0 && !loading && (
        <div className="card soft-shadow">
          <div className="empty-state">
            <span className="material-symbols-outlined">auto_stories</span>
            <p>Enter a User ID and click "Load Entries" to view journal entries.</p>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="card soft-shadow" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 className="card-title">Journal Entries</h2>
              <p className="card-subtitle">{entries.length} entries found for user {userId}</p>
            </div>
            <span className="tag tag-primary">{entries.length} entries</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {entries.map((entry) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-meta">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span className={`ambience-chip ${ambienceClass[entry.ambience] || ""}`}>
                      {ambienceEmoji[entry.ambience] || ""} {entry.ambience}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--outline)" }}>
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "0.5rem 1rem" }}
                    onClick={() => handleAnalyze(entry)}
                    disabled={analyzing === entry.id}
                  >
                    {analyzing === entry.id ? (
                      <div className="spinner spinner-dark" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>psychology</span>
                        Analyze
                      </>
                    )}
                  </button>
                </div>

                <p className="entry-text">{entry.text}</p>

                {/* Show cached emotion if available */}
                {entry.emotion && !analysisResults[entry.id] && (
                  <div className="entry-emotions">
                    <span className="tag tag-secondary">{entry.emotion}</span>
                    {entry.keywords && entry.keywords.map((kw, i) => (
                      <span key={i} className="keyword-chip" style={{ fontSize: 10, padding: "0.2rem 0.6rem" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Show live analysis result */}
                {analysisResults[entry.id] && !analysisResults[entry.id].error && (
                  <div className="analysis-result fade-in" style={{ marginTop: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span className="material-symbols-outlined icon-filled" style={{ color: "var(--primary)", fontSize: 28 }}>
                        sentiment_satisfied
                      </span>
                      <span className="analysis-emotion">{analysisResults[entry.id].emotion}</span>
                      {analysisResults[entry.id].cached && <span className="tag tag-tertiary">Cached</span>}
                    </div>
                    <p className="analysis-summary">{analysisResults[entry.id].summary}</p>
                    <div className="keyword-cloud">
                      {analysisResults[entry.id].keywords.map((kw, i) => (
                        <span key={i} className="keyword-chip">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResults[entry.id]?.error && (
                  <div style={{ marginTop: "0.75rem", color: "var(--error)", fontSize: "0.8rem" }}>
                    ⚠ {analysisResults[entry.id].error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

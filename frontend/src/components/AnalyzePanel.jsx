import { useState } from "react";
import { analyzeText } from "../api";

export default function AnalyzePanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeText(text.trim());
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="card-dark soft-shadow" style={{ marginBottom: "2rem", padding: "2.5rem", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "40%",
            height: "100%",
            background: "radial-gradient(circle at top right, rgba(100,62,36,0.3), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="tag" style={{ background: "rgba(255,255,255,0.1)", color: "white", marginBottom: "1rem", display: "inline-flex" }}>
            AI Emotion Analysis
          </span>
          <h2 className="font-headline" style={{ fontWeight: 800, fontSize: "1.75rem", color: "white" }}>
            Analyze Your Emotions
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Powered by Google Gemini — paste any journal text to understand your emotional state.
          </p>
        </div>
      </div>

      <div className="grid-12">
        <div className="col-8">
          <div className="card soft-shadow" style={{ padding: "2rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="analyzeText">Journal Text to Analyze</label>
              <textarea
                id="analyzeText"
                className="form-textarea"
                style={{ minHeight: 180 }}
                placeholder="Paste or type a journal entry here...&#10;&#10;Example: I felt calm today after listening to the rain falling on the forest canopy."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !text.trim()}>
              {loading ? (
                <>
                  <div className="spinner" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>psychology</span>
                  Analyze Emotions
                </>
              )}
            </button>
          </div>
        </div>

        <div className="col-4">
          {/* Result Card */}
          {!result && !error && (
            <div className="card-alt" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="empty-state">
                <span className="material-symbols-outlined">neurology</span>
                <p>Enter text and click "Analyze Emotions" to see AI-powered emotional insights.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="card soft-shadow fade-in" style={{ padding: "2rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "var(--primary-fixed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: 36, color: "var(--primary)" }}>
                    sentiment_satisfied
                  </span>
                </div>
                <p className="analysis-emotion">{result.emotion}</p>
                {result.cached && <span className="tag tag-tertiary" style={{ marginTop: "0.5rem" }}>Cached Result</span>}
              </div>

              <p className="analysis-summary" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                {result.summary}
              </p>

              <div>
                <p className="form-label" style={{ marginBottom: "0.75rem" }}>Detected Keywords</p>
                <div className="keyword-cloud" style={{ justifyContent: "center" }}>
                  {result.keywords.map((kw, i) => (
                    <span key={i} className="keyword-chip">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ background: "var(--error-container)", color: "var(--on-error-container)", padding: "1.5rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Analysis Failed</p>
              <p style={{ fontSize: "0.8rem" }}>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

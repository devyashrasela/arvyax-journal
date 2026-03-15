import { useState } from "react";
import { createEntry } from "../api";

export default function JournalForm({ onEntryCreated }) {
  const [userId, setUserId] = useState("");
  const [ambience, setAmbience] = useState("forest");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !text.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      await createEntry(userId.trim(), ambience, text.trim());
      showToast("Journal entry saved successfully!");
      setText("");
      if (onEntryCreated) onEntryCreated();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const ambienceOptions = [
    { value: "forest", label: "🌲 Forest", desc: "Woodland serenity" },
    { value: "ocean", label: "🌊 Ocean", desc: "Coastal calm" },
    { value: "mountain", label: "⛰️ Mountain", desc: "Alpine peace" },
  ];

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="card soft-shadow hero-section" style={{ marginBottom: "2rem", padding: "2.5rem" }}>
        <div className="hero-bg-accent" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="tag tag-primary" style={{ marginBottom: "1rem" }}>New Journal Entry</span>
          <h2 className="font-headline" style={{ fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.025em" }}>
            Record Your Nature Session
          </h2>
          <p style={{ color: "var(--outline)", marginTop: "0.5rem", fontSize: "0.875rem", maxWidth: 420 }}>
            Capture your thoughts and emotions after your immersive nature experience.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid-12">
        <div className="col-8">
          <div className="card soft-shadow" style={{ padding: "2rem" }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="userId">User ID</label>
                <input
                  id="userId"
                  className="form-input"
                  type="text"
                  placeholder="Enter your user ID (e.g. 123)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ambience">Session Ambience</label>
                <select
                  id="ambience"
                  className="form-select"
                  value={ambience}
                  onChange={(e) => setAmbience(e.target.value)}
                >
                  {ambienceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="journalText">Your Journal Entry</label>
                <textarea
                  id="journalText"
                  className="form-textarea"
                  placeholder="How did you feel during your nature session today?&#10;&#10;Describe your thoughts, emotions, and the surroundings..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                    Save Entry
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Ambience Info */}
        <div className="col-4">
          <div className="card-accent analyze-card" style={{ marginBottom: "1rem" }}>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.5rem" }}>
              About Ambiences
            </h3>
            <p style={{ fontSize: "0.75rem", opacity: 0.7, marginBottom: "1.25rem" }}>
              Each nature session type helps target different aspects of mental wellness.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {ambienceOptions.map((opt) => (
                <div
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    background: "rgba(255,255,255,0.15)",
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{opt.label.split(" ")[0]}</span>
                  <div>
                    <p style={{ fontSize: "0.8rem", fontWeight: 600 }}>{opt.label.split(" ")[1]}</p>
                    <p style={{ fontSize: "0.7rem", opacity: 0.7 }}>{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default function Sidebar({ activePage, onNavigate }) {
  const navItems = [
    { key: "write", icon: "edit_note", label: "Write Entry" },
    { key: "entries", icon: "auto_stories", label: "My Entries" },
    { key: "analyze", icon: "psychology", label: "Analyze" },
    { key: "insights", icon: "insights", label: "Insights" },
  ];

  return (
    <aside className="sidebar sidebar-glass">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon kpi-gradient">
          <span className="material-symbols-outlined icon-filled" style={{ color: "white", fontSize: 24 }}>
            self_improvement
          </span>
        </div>
        <div>
          <h1>ArvyaX Journal</h1>
          <p>Nature Therapy</p>
        </div>
      </div>

      <nav className="sidebar-nav no-scrollbar">
        <div className="sidebar-section-label">Journal Console</div>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={activePage === item.key ? "active" : ""}
            onClick={() => onNavigate(item.key)}
          >
            <span
              className={`material-symbols-outlined${activePage === item.key ? " icon-filled" : ""}`}
              style={{ fontSize: 20 }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(213,195,185,0.1)" }}>
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.75rem",
            background: "var(--surface-container-lowest)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--primary-fixed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 20 }}>
              person
            </span>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700 }}>Journal User</p>
            <p style={{ fontSize: 10, color: "var(--outline)" }}>Nature Explorer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

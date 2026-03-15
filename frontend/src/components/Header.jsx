const pageTitles = {
  write: "Write Entry",
  entries: "My Entries",
  analyze: "Analyze",
  insights: "Insights",
};

export default function Header({ activePage }) {
  return (
    <header className="top-header glass-panel">
      <div className="breadcrumb">
        <span className="crumb-dim">Journal</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-active">{pageTitles[activePage] || "Dashboard"}</span>
      </div>
      <div className="header-actions">
        <button className="header-btn" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="header-btn" title="Settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}

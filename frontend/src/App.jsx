import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import JournalForm from "./components/JournalForm";
import EntriesList from "./components/EntriesList";
import AnalyzePanel from "./components/AnalyzePanel";
import InsightsPanel from "./components/InsightsPanel";

export default function App() {
  const [activePage, setActivePage] = useState("write");

  const renderPage = () => {
    switch (activePage) {
      case "write":
        return <JournalForm onEntryCreated={() => {}} />;
      case "entries":
        return <EntriesList />;
      case "analyze":
        return <AnalyzePanel />;
      case "insights":
        return <InsightsPanel />;
      default:
        return <JournalForm />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        <Header activePage={activePage} />
        <div className="content-area no-scrollbar">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

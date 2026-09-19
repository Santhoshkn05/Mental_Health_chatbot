import React from "react";
import SidebarHistory from "./History";
import ChatWindow from "./ChatWindow";

const DashboardMainContent = ({
  sessions,
  setSessions,
  activeSessionId,
  setActiveSessionId,
  theme,
  setCrisisDetected,
  isSidebarOpen,
  setIsSidebarOpen
}) => {
  // =========================================================
  // DEFAULT AI PROMPTS
  // =========================================================

  const defaultQueries = [
    {
      icon: "🧘",
      text: "How can I manage my anxiety better?",
      title: "Anxiety Management",
      description: "Learn techniques to cope with anxiety",
      category: "Anxiety"
    },
    {
      icon: "💭",
      text: "I'm feeling overwhelmed with stress",
      title: "Stress Relief",
      description: "Find ways to manage daily stress",
      category: "Stress"
    },
    {
      icon: "🌙",
      text: "Help me improve my sleep quality",
      title: "Better Sleep",
      description: "Get tips for improving your sleep",
      category: "Sleep"
    },
    {
      icon: "💬",
      text: "I'm feeling sad and need support",
      title: "Emotional Support",
      description: "Get help with difficult emotions",
      category: "Support"
    },
    {
      icon: "🎯",
      text: "I need help with exam preparation",
      title: "Academic Support",
      description: "Get study tips and exam strategies",
      category: "Academic"
    }
  ];

  return (
    <div
      className="d-flex flex-grow-1 overflow-hidden position-relative"
      style={{
        backgroundColor: theme.bg,
        minHeight: 0
      }}
    >

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className="dashboard-sidebar"
        style={{
          width: isSidebarOpen ? "280px" : "0px",
          minWidth: isSidebarOpen ? "280px" : "0px",
          maxWidth: isSidebarOpen ? "280px" : "0px",
          height: "100%",
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: theme.sidebar,
          borderRight: isSidebarOpen
            ? `1px solid ${theme.border}`
            : "none",
          transition:
            "width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease"
        }}
      >
        <div
          style={{
            width: "280px",
            height: "100%"
          }}
        >
          <SidebarHistory
            sessions={sessions}
            setSessions={setSessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            theme={theme}
            isOpen={isSidebarOpen}
            onToggle={() =>
              setIsSidebarOpen(!isSidebarOpen)
            }
          />
        </div>
      </aside>

      {/* =====================================================
          MAIN CHAT AREA
      ===================================================== */}

      <section
        className="flex-grow-1 d-flex flex-column overflow-hidden position-relative"
        style={{
          minWidth: 0,
          height: "100%"
        }}
      >
        <ChatWindow
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          sessions={sessions}
          setSessions={setSessions}
          theme={theme}
          setCrisisDetected={setCrisisDetected}
          defaultQueries={defaultQueries}
          isSidebarOpen={isSidebarOpen}
        />
      </section>

      {/* =====================================================
          RESPONSIVE STYLES
      ===================================================== */}

      <style>{`

        .dashboard-sidebar {
          display: block;
        }

        @media (max-width: 900px) {

          .dashboard-sidebar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 1000;

            box-shadow:
              8px 0 30px rgba(0, 0, 0, 0.15);
          }

        }

        @media (max-width: 600px) {

          .dashboard-sidebar {
            width: ${isSidebarOpen ? "280px" : "0px"} !important;
            min-width: ${isSidebarOpen ? "280px" : "0px"} !important;
            max-width: ${isSidebarOpen ? "280px" : "0px"} !important;
          }

        }

      `}</style>

    </div>
  );
};

export default DashboardMainContent;
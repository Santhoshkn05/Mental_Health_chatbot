import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Import the separate dashboard components
import DashboardNavbar from "./DashboardNavbar";
import DashboardMainContent from "./DashboardMainContent";
import ProfilePopup from "./ProfilePopup";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleProfileClick = (e) => {
    setShowProfile(true);
  };

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("mindease-theme");
    return saved ? JSON.parse(saved) : true;
  });

  const [sessions, setSessions] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.email) {
      const userSessionsKey = `mindease-sessions-${user.email}`;
      const saved = localStorage.getItem(userSessionsKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed;
        } catch (parseError) {
          console.error('Error parsing sessions:', parseError);
          const newSessionId = Date.now();
          const initialSessions = [{ id: newSessionId, title: "New Chat", messages: [] }];
          localStorage.setItem(userSessionsKey, JSON.stringify(initialSessions));
          console.log('Created fallback sessions:', initialSessions);
          return initialSessions;
        }
      } else {
        console.log('No saved sessions found, creating new ones');
        const newSessionId = Date.now();
        const initialSessions = [{ id: newSessionId, title: "New Chat", messages: [] }];
        localStorage.setItem(userSessionsKey, JSON.stringify(initialSessions));
        console.log('Created new sessions:', initialSessions);
        return initialSessions;
      }
    } else {
      // No authenticated user - create empty sessions
      console.log('No authenticated user, creating empty sessions');
      const newSessionId = Date.now();
      const initialSessions = [{ id: newSessionId, title: "New Chat", messages: [] }];
      localStorage.setItem("mindease-sessions", JSON.stringify(initialSessions));
      console.log('Created new sessions:', initialSessions);
      return initialSessions;
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.email) {
      const userSessionsKey = `mindease-sessions-${user.email}`;
      const saved = localStorage.getItem(userSessionsKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length > 0) {
            const firstId = parsed[0]?.id;
            console.log('Initial activeSessionId set:', firstId);
            return firstId;
          } else {
            // Create new session if array is empty
            const newSessionId = Date.now();
            const initialSessions = [{ id: newSessionId, title: "New Chat", messages: [] }];
            localStorage.setItem(userSessionsKey, JSON.stringify(initialSessions));
            console.log('Created new session and set activeSessionId:', newSessionId);
            return newSessionId;
          }
        } catch (parseError) {
          console.error('Error parsing sessions for active ID:', parseError);
          const newSessionId = Date.now();
          const initialSessions = [{ id: newSessionId, title: "New Chat", messages: [] }];
          localStorage.setItem(userSessionsKey, JSON.stringify(initialSessions));
          console.log('Created fallback session and set activeSessionId:', newSessionId);
          return newSessionId;
        }
      } else {
        console.log('No saved sessions found, creating new active session ID');
        const newSessionId = Date.now();
        const initialSessions = [{ id: newSessionId, title: "New Chat", messages: [] }];
        localStorage.setItem(userSessionsKey, JSON.stringify(initialSessions));
        console.log('Created new session and set activeSessionId:', newSessionId);
        return newSessionId;
      }
    } else {
      // No authenticated user - create empty sessions
      console.log('No authenticated user, creating empty active session ID');
      const newSessionId = Date.now();
      const initialSessions = [{ id: newSessionId, title: "New Chat", messages: [] }];
      localStorage.setItem("mindease-sessions", JSON.stringify(initialSessions));
      console.log('Created new session and set activeSessionId:', newSessionId);
      return newSessionId;
    }
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem("mindease-theme", JSON.stringify(isDarkMode));
    
    // ADDED: Use user-specific session storage
    const user = JSON.parse(localStorage.getItem("user"));
    const userSessionsKey = user?.email ? `mindease-sessions-${user.email}` : "mindease-sessions";
    localStorage.setItem(userSessionsKey, JSON.stringify(sessions));
    
    // ADDED: Force session refresh for debugging
    console.log('Session sync completed:', {
      user: user?.email,
      sessionsCount: sessions.length,
      activeSessionId,
      sessions: sessions
    });
  }, [isDarkMode, sessions, activeSessionId]);

  const theme = {
    bg: isDarkMode ? "#0f172a" : "#f8fafc",
    sidebar: isDarkMode ? "#1e293b" : "#ffffff", 
    text: isDarkMode ? "#f1f5f9" : "#0f172a",
    subtext: isDarkMode ? "#94a3b8" : "#475569",
    primary: "#6366f1", // Modern indigo
    accent: "#22d3ee", // Cyan accent
    border: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.2)",
    input: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(248, 250, 252, 0.9)",
    card: isDarkMode ? "#1e293b" : "#ffffff",
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", position: 'relative' }}>
      {/* Navbar Component */}
      <DashboardNavbar 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        setShowProfile={setShowProfile}
        navigate={navigate}
        theme={theme}
        crisisDetected={crisisDetected}
        setCrisisDetected={setCrisisDetected}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onProfileClick={handleProfileClick}
      />

      {/* Main Content Component */}
      <DashboardMainContent 
        sessions={sessions}
        setSessions={setSessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        theme={theme}
        setCrisisDetected={setCrisisDetected}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Profile Popup Component */}
      <ProfilePopup 
        show={showProfile} 
        onClose={() => setShowProfile(false)} 
        theme={theme} 
        navigate={navigate} 
      />

    </div>
  );
};

export default Dashboard;
import React, { useEffect } from "react";
import { Brain, Sun, Moon, User, AlertTriangle, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { playAlarmSound, requestNotificationPermission } from "../utils/crisisDetection";

const DashboardNavbar = ({ isDarkMode, setIsDarkMode, setShowProfile, navigate, theme, crisisDetected, setCrisisDetected, isSidebarOpen, setIsSidebarOpen, onProfileClick }) => {
  useEffect(() => {
    // Request notification permission on component mount
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (crisisDetected) {
      // Play alarm sound when crisis is detected
      playAlarmSound();
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 Crisis Alert', {
          body: 'Crisis keywords detected in conversation',
          icon: '/favicon.ico',
          requireInteraction: true
        });
      }
    }
  }, [crisisDetected]);
  return (
    <>
      <style>{`
        .dynamic-brand { background: linear-gradient(90deg, #b2d8d0, #7c3aed, #b2d8d0); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradientFlow 4s linear infinite; cursor:pointer; }
        @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
      `}</style>

      <nav className="px-4 py-3 d-flex justify-content-between align-items-center shadow-sm" 
           style={{ borderBottom: `1px solid ${theme.border}`, zIndex: 10, background: theme.bg }}>
        
        {/* Left Section - Sidebar Toggle */}
        <div className="d-flex align-items-center gap-3">
          <button 
            className="btn p-2 border-0 rounded-circle d-flex align-items-center justify-content-center"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ 
              color: theme.primary,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              width: '36px',
              height: '36px',
              transition: 'all 0.3s ease'
            }}
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          
          {/* Branding - Centered */}
          <div className="d-flex align-items-center gap-2" onClick={() => navigate("/")} style={{cursor:'pointer'}}>
            <Brain size={28} color={theme.accent} />
            <span className="fw-bold fs-4" style={{ 
              background: 'linear-gradient(90deg, #6366f1, #22d3ee)', 
              backgroundSize: '200% auto', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              animation: 'gradientFlow 4s linear infinite'
            }}>
              Mental Health Chatbot
            </span>
          </div>
        </div>

        {/* Right Section - Theme, Profile, Logout */}
        <div className="d-flex align-items-center gap-3">
          {/* Crisis Detection Flag */}
          {crisisDetected && (
            <div className="d-flex align-items-center justify-content-center rounded-circle" 
                 style={{ 
                   width: '40px', 
                   height: '40px', 
                   backgroundColor: '#ff4444', 
                   animation: 'pulse 1s infinite',
                   cursor: 'pointer'
                 }}
                 onClick={() => setCrisisDetected(false)}>
              <AlertTriangle size={20} color="#ffffff" />
            </div>
          )}
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} 
                  className="btn p-2 border-0 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    color: theme.primary,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    width: '36px',
                    height: '36px'
                  }}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button onClick={onProfileClick} 
                  className="btn p-2 border-0 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    color: theme.primary,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    width: '36px',
                    height: '36px'
                  }}>
            <User size={18} />
          </button>
          
          <button onClick={() => {
            if (window.confirm("Are you sure you want to sign out?")) {
              localStorage.removeItem("mindease-user");
              navigate("/");
            }
          }}
                  className="btn p-2 border-0 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    color: theme.primary,
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    width: '36px',
                    height: '36px'
                  }}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>
    </>
  );
};

export default DashboardNavbar;

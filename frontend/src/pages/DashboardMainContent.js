import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SidebarHistory from "./History";
import ChatWindow from "./ChatWindow";

const DashboardMainContent = ({ sessions, setSessions, activeSessionId, setActiveSessionId, theme, setCrisisDetected, isSidebarOpen, setIsSidebarOpen }) => {
  
  // Add useful default queries that connect to AI and get proper responses
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
    <div className="d-flex flex-grow-1 overflow-hidden position-relative" style={{ backgroundColor: theme.bg }}>
      {/* Sidebar Component */}
      <div 
        className={`transition-all duration-300 ${isSidebarOpen ? 'w-25' : 'w-0'} overflow-hidden position-relative`}
        style={{ 
          minWidth: isSidebarOpen ? '280px' : '0px',
          maxWidth: isSidebarOpen ? '280px' : '0px'
        }}
      >
        <SidebarHistory 
          sessions={sessions} 
          setSessions={setSessions} 
          activeSessionId={activeSessionId} 
          setActiveSessionId={setActiveSessionId} 
          theme={theme} 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden position-relative">
        {/* Chat Window Component */}
        <ChatWindow 
          activeSessionId={activeSessionId} 
          sessions={sessions} 
          setSessions={setSessions} 
          theme={theme}
          setCrisisDetected={setCrisisDetected}
          defaultQueries={defaultQueries}
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    </div>
  );
};

export default DashboardMainContent;

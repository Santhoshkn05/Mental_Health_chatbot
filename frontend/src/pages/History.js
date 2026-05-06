import React, { useState, useEffect } from "react";
import { Plus, MessageSquare, Clock, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const SidebarHistory = ({ sessions, setSessions, activeSessionId, setActiveSessionId, theme, isOpen, onToggle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Fetch chat history from backend
  const fetchChatHistory = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("No authentication token found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/chats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const chatData = await response.json();
      
      // Group chats by session_id and convert to session format
      const sessionsMap = new Map();
      
      chatData.forEach(chat => {
        const sessionId = chat.session_id;
        if (!sessionsMap.has(sessionId)) {
          sessionsMap.set(sessionId, {
            id: sessionId,
            title: chat.message.length > 30 ? chat.message.substring(0, 30) + '...' : chat.message,
            messages: [],
            createdAt: chat.timestamp,
            lastUpdated: chat.timestamp
          });
        }
        
        const session = sessionsMap.get(sessionId);
        session.messages.push({
          id: chat.id,
          role: chat.role === 'bot' ? 'ai' : 'user',  // Convert 'bot' to 'ai'
          text: chat.message,                        // Use 'text' field instead of 'content'
          time: new Date(chat.timestamp).toLocaleTimeString(),  // Format time
          timestamp: chat.timestamp
        });
        
        // Update lastUpdated timestamp
        if (new Date(chat.timestamp) > new Date(session.lastUpdated)) {
          session.lastUpdated = chat.timestamp;
        }
      });

      const sessionsArray = Array.from(sessionsMap.values()).sort((a, b) => 
        new Date(b.lastUpdated) - new Date(a.lastUpdated)
      );

      setSessions(sessionsArray);
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setError("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  // Load chat history on component mount
  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  // Get user-specific session key (fallback for new sessions)
  const getUserSessionsKey = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.email ? `mindease-sessions-${user.email}` : "mindease-sessions";
  };

  const createNewSession = () => {
    const id = Date.now();
    const newSession = { 
      id, 
      title: "New Chat", 
      messages: [], 
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    // Use user-specific session storage
    const userSessionsKey = getUserSessionsKey();
    const existingSessions = JSON.parse(localStorage.getItem(userSessionsKey)) || [];
    const updatedSessions = [newSession, ...existingSessions];
    localStorage.setItem(userSessionsKey, JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
    setActiveSessionId(id);
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    const token = getAuthToken();
    if (!token) {
      setError("No authentication token found");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/chats/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the chat history after deletion
      await fetchChatHistory();
      
      // Update active session if needed
      if (activeSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setActiveSessionId(remainingSessions[0].id);
        }
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      setError("Failed to delete chat session");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <aside className="p-3 d-flex flex-column transition-all duration-300" 
           style={{ 
             width: "280px", 
             backgroundColor: theme.sidebar, 
             borderRight: `1px solid ${theme.border}`,
             minWidth: '280px'
           }}>
      <style>{`
        .sidebar-item { 
          padding: 12px; 
          border-radius: 12px; 
          cursor: pointer; 
          transition: all 0.2s ease; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          border: 1px solid transparent; 
          margin-bottom: 6px;
          position: relative;
        }
        .sidebar-item:hover { 
          background: rgba(124, 58, 237, 0.08); 
          border-color: ${theme.primary}20;
        }
        .sidebar-active { 
          background: linear-gradient(135deg, ${theme.primary}15, ${theme.accent}15) !important; 
          border-color: ${theme.primary} !important;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
        }
        .delete-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .sidebar-item:hover .delete-btn {
          opacity: 1;
        }
      `}</style>
      
      {/* Header */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: theme.text }}>
          <MessageSquare size={18} color={theme.primary} />
          Chat History
        </h6>
        <button className="btn w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm" 
                onClick={createNewSession}
                style={{ 
                  backgroundColor: theme.primary, 
                  color: "#ffffff", 
                  borderRadius: "12px", 
                  border: 'none',
                  transition: 'all 0.3s ease'
                }}>
          <Plus size={18} /> New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-grow-1" style={{ overflowY: "auto" }}>
        <div className="d-flex align-items-center gap-2 mb-3 px-2">
          <Clock size={14} color={theme.subtext} />
          <p className="small opacity-50 mb-0 fw-bold">RECENT CHATS</p>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm mb-2" role="status" style={{ color: theme.primary }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="small opacity-50" style={{ color: theme.subtext }}>Loading chat history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="alert alert-danger small" role="alert">
              {error}
              <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchChatHistory}>
                Retry
              </button>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-4">
            <MessageSquare size={32} color={theme.subtext} className="mb-2 opacity-50" />
            <p className="small opacity-50" style={{ color: theme.subtext }}>No chats yet</p>
            <p className="small opacity-50">Start a new conversation!</p>
          </div>
        ) : (
          sessions.map(s => (
            <div key={s.id} 
                 onClick={() => setActiveSessionId(s.id)} 
                 className={`sidebar-item ${activeSessionId === s.id ? 'sidebar-active' : ''}`}
                 style={{ color: theme.text }}>
              <div className="d-flex align-items-center gap-2 text-truncate flex-grow-1">
                <MessageSquare size={14} color={activeSessionId === s.id ? theme.primary : theme.accent} />
                <div className="text-truncate">
                  <div className="small fw-medium text-truncate">{s.title}</div>
                  {s.lastUpdated && (
                    <div className="small opacity-50" style={{ fontSize: '11px' }}>
                      {formatTime(s.lastUpdated)}
                    </div>
                  )}
                </div>
              </div>
              <button 
                className="delete-btn btn p-1 border-0 rounded-circle"
                onClick={(e) => deleteSession(s.id, e)}
                style={{ 
                  color: theme.subtext,
                  backgroundColor: 'transparent'
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-top" style={{ borderColor: theme.border }}>
        <div className="small opacity-50 text-center px-2">
          <div>{sessions.length} chat{sessions.length !== 1 ? 's' : ''}</div>
          <div className="mt-1">MindEase AI</div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarHistory;

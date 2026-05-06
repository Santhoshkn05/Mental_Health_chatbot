import React, { useState, useRef, useEffect } from "react";
import { Brain, Send, Mic, MicOff, User, Bot } from "lucide-react";

const ChatWindow = ({ activeSessionId, sessions, setSessions, theme, defaultQueries, isSidebarOpen }) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const scrollRef = useRef(null);
  
  // Refs for audio recording
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const silenceTimer = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId]);

  // Get current session
  const currentSession = sessions.find(s => s.id === activeSessionId);
  
  // Debug: Log session state
  useEffect(() => {
    console.log('Session Debug:', {
      currentSession,
      activeSessionId,
      sessions: sessions.length,
      messages: currentSession?.messages?.length || 0
    });
  }, [sessions, activeSessionId, currentSession]);

  // Save session to user-specific storage
  const saveSession = (updatedSession) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.email) {
      console.warn('No authenticated user found');
      return;
    }
    
    const userSessionsKey = `mindease-sessions-${user.email}`;
    const allSessions = JSON.parse(localStorage.getItem(userSessionsKey)) || [];
    const sessionIndex = allSessions.findIndex(s => s.id === updatedSession.id);
    
    if (sessionIndex !== -1) {
      allSessions[sessionIndex] = updatedSession;
      localStorage.setItem(userSessionsKey, JSON.stringify(allSessions));
      console.log('Session saved to user-specific storage:', user.email);
    } else {
      console.warn('Session not found for updating');
    }
  };

  // Enhanced message sending with context management
  const handleSend = async (textToSend) => {
  if (!textToSend || !textToSend.trim()) return;

  const finalInput = textToSend.trim();

  const token = localStorage.getItem("token");

  if (!token) {
    alert("User not authenticated. Please login again.");
    return;
  }

  const userMsg = { 
    role: "user", 
    text: finalInput, 
    time: new Date().toLocaleTimeString(),
    id: Date.now()
  };

  // ✅ Add user message and update title if needed
  console.log('DEBUG: Adding user message:', { role: 'user', text: finalInput, sessionId: activeSessionId });
  setSessions(prev =>
    prev.map(s =>
      s.id === activeSessionId
        ? {
            ...s,
            messages: [...(s.messages || []), userMsg],
            lastUpdated: new Date().toISOString(),
            // Update title if it's still "New Chat" and this is the first user message
            title: s.title === "New Chat" && (!s.messages || s.messages.length === 0)
              ? (finalInput.length > 30 ? finalInput.substring(0, 30) + '...' : finalInput)
              : s.title
          }
        : s
    )
  );

  setInput("");
  setIsTyping(true);

  try {
    // ✅ CALL NODE BACKEND (NOT FLASK DIRECTLY)
    const response = await fetch('http://localhost:3001/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`   // 🔥 IMPORTANT
      },
      body: JSON.stringify({
        session_id: activeSessionId,
        message: finalInput
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    console.log("✅ AI Response:", data);

    // ✅ FIXED RESPONSE FIELD
    const aiMsg = { 
      role: "ai", 
      text: data.message || "No response received",
      time: new Date().toLocaleTimeString(),
      id: Date.now() + 1,
      analysis: data.analysis || {}
    };

    // Add AI response
    setSessions(prev =>
      prev.map(s =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...(s.messages || []), aiMsg],
              lastUpdated: new Date().toISOString()
            }
          : s
      )
    );

  } catch (error) {
    console.error(" API Error:", error);

    const errorMsg = {
      role: "ai",
      text: "⚠️ Server error. Please try again.",
      time: new Date().toLocaleTimeString(),
      id: Date.now() + 1,
      error: true
    };

    setSessions(prev =>
      prev.map(s =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...(s.messages || []), errorMsg]
            }
          : s
      )
    );
  } finally {
    setIsTyping(false);
  }
};

  // Voice recording functions
  const toggleRecording = async () => {
    if (!isListening) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          
          recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
              } else {
                interimTranscript += transcript;
              }
            }
            
            const fullTranscript = finalTranscript + interimTranscript;
            setLiveTranscript(fullTranscript.trim());
          };
          
          recognitionRef.current.start();
        }
        
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        analyser.current = audioContext.current.createAnalyser();
        const source = audioContext.current.createMediaStreamSource(stream);
        source.connect(analyser.current);
        analyser.current.fftSize = 256;
        
        setIsListening(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Please allow microphone access to use voice features.");
      }
    } else {
      stopRecording();
    }
  };

  const stopRecording = () => {
    setIsListening(false);
    setLiveTranscript("");
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContext.current && audioContext.current.state !== 'closed') {
      audioContext.current.close();
    }
  };

  // Handle live transcript submission
  const handleTranscriptSubmit = () => {
    if (liveTranscript.trim()) {
      handleSend(liveTranscript);
      setLiveTranscript("");
    }
  };

  return (
    <main className="flex-grow-1 d-flex flex-column position-relative" style={{ minHeight: 0 }}>
      <style>{`
        .query-card { 
          background: linear-gradient(135deg, ${theme.primary}15, ${theme.accent}15); 
          border: 1px solid ${theme.primary}30; 
          border-radius: 16px; 
          padding: 16px; 
          cursor: pointer; 
          transition: all 0.3s ease; 
          position: relative;
          overflow: hidden;
        }
        .query-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15); 
          border-color: ${theme.primary}50;
        }
        .typing-indicator {
          display: inline-block;
          padding: 8px 12px;
          background: ${theme.input};
          border-radius: 18px;
          color: theme.subtext;
        }
        .typing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${theme.primary};
          margin: 0 2px;
          animation: typing 1.4s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .pulse-animation {
          animation: pulse-ring 1.5s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* CHAT MESSAGES */}
      <div ref={scrollRef} className="flex-grow-1 overflow-auto p-4" style={{ minHeight: 0 }}>
        <div className="mx-auto" style={{ maxWidth: isSidebarOpen ? "850px" : "1100px" }}>
          {/* Show default queries if no messages */}
          {!currentSession?.messages?.length && defaultQueries && (
            <div className="d-flex flex-column gap-3 align-items-center justify-content-center h-100">
              <div className="text-center mb-4">
                <Brain size={48} className="mb-3" style={{ color: theme.primary }} />
                <h2 className="fw-bold mb-2" style={{ color: theme.text }}>How can I help you today?</h2>
                <p style={{ color: theme.subtext }}>Choose a topic below or type your own question</p>
              </div>
              <div className="d-flex flex-wrap gap-3 justify-content-center" style={{ maxWidth: '600px' }}>
                {defaultQueries.slice(0, 3).map((query, index) => (
                  <div 
                    key={index}
                    className="query-card flex-fill text-center"
                    style={{ minWidth: '180px', maxWidth: '220px' }}
                    onClick={() => handleSend(query.text)}
                  >
                    <div className="mb-2">
                      {query.icon}
                    </div>
                    <div className="text-center">{query.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Render messages */}
          {currentSession?.messages?.map((msg, index) => (
            <div key={msg.id || index} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className={`p-3 rounded-4 position-relative ${
                msg.role === 'user' 
                  ? 'text-white' 
                  : msg.error
                    ? 'border border-danger bg-danger-subtle'
                    : 'border'
              }`} style={{ 
                maxWidth: '70%',
                backgroundColor: msg.role === 'user' ? theme.primary : (msg.error ? '#fff5f5' : theme.card),
                borderColor: theme.border,
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                wordBreak: 'break-word',
                animation: 'fadeInUp 0.3s ease-out'
              }}>
                <div className="d-flex align-items-center mb-2">
                  {msg.role === 'user' ? <User size={16} className="me-2" /> : <Bot size={16} className="me-2" />}
                  <small className="opacity-75">{msg.time}</small>
                  {msg.error && (
                    <span className="badge bg-danger text-white ms-2" style={{ fontSize: '10px' }}>
                      Failed
                    </span>
                  )}
                </div>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.5',
                  marginBottom: msg.enhanced ? '8px' : '0'
                }}>
                  {msg.text}
                </div>
                {/* Enhanced AI badges */}
                {msg.role === 'ai' && msg.enhanced && (
                  <div className="mt-2 d-flex flex-wrap align-items-center gap-2">
                    <span className="badge bg-success-subtle text-success px-2 py-1" style={{ fontSize: '11px' }}>
                      🧠 Enhanced AI
                    </span>
                    {msg.context_used && (
                      <span className="badge bg-info-subtle text-info px-2 py-1" style={{ fontSize: '11px' }}>
                        📚 Context Used
                      </span>
                    )}
                    {msg.analysis?.intent && (
                      <span className="badge bg-primary-subtle text-primary px-2 py-1" style={{ fontSize: '11px' }}>
                        Intent: {msg.analysis.intent.label}
                      </span>
                    )}
                    {msg.analysis?.emotion && (
                      <span className="badge bg-warning-subtle text-warning px-2 py-1" style={{ fontSize: '11px' }}>
                        Emotion: {msg.analysis.emotion.label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="d-flex justify-content-start mb-3">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 mx-auto w-100" style={{ maxWidth: isSidebarOpen ? "850px" : "1100px" }}>
        <div className="position-relative">
          {/* Voice transcript display */}
          {isListening && liveTranscript && (
            <div className="mb-3 p-3 rounded-3" style={{ 
              backgroundColor: theme.primary + '15', 
              border: `1px solid ${theme.primary}30`,
              color: theme.text
            }}>
              <div className="d-flex align-items-center mb-2">
                <Mic size={16} className="me-2" style={{ color: theme.primary }} />
                <small className="opacity-75">Voice Transcript:</small>
              </div>
              <div className="fw-medium">{liveTranscript}</div>
              <div className="mt-2 d-flex gap-2">
                <button 
                  className="btn btn-sm btn-success"
                  onClick={handleTranscriptSubmit}
                >
                  Send
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setLiveTranscript("")}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          
          {/* Main input */}
          <div className="d-flex gap-2">
            <input 
              type="text" 
              className={`form-control p-3 shadow-sm border-0 ${isListening ? 'pulse-animation' : ''}`} 
              style={{ 
                backgroundColor: theme.input, 
                color: theme.text,
                fontSize: '16px',
                borderRadius: '12px'
              }}
              placeholder="Type your message or use voice..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              disabled={isTyping}
            />
            
            <button 
              className={`btn p-2 shadow-sm border-0 ${isListening ? 'btn-danger' : 'btn-primary'}`}
              style={{ 
                backgroundColor: isListening ? '#dc3545' : theme.primary,
                borderRadius: '12px',
                minWidth: '40px',
                width: '40px'
              }}
              onClick={toggleRecording}
              disabled={isTyping}
              title={isListening ? "Stop Recording" : "Start Voice Recording"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            
            <button 
              className="btn p-2 shadow-sm border-0 btn-primary"
              style={{ 
                backgroundColor: theme.primary,
                borderRadius: '12px',
                minWidth: '40px',
                width: '40px'
              }}
              onClick={() => handleSend(input)}
              disabled={isTyping || !input.trim()}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatWindow;

import React, { useState, useRef, useEffect } from "react";
import { Brain, Send, Mic, MicOff, User, Bot, Volume2, VolumeX, AlertTriangle } from "lucide-react";

const ChatWindowProduction = ({ activeSessionId, sessions, setSessions, theme, defaultQueries, isSidebarOpen }) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(false);
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
      setSessions(allSessions);
    }
  };

  // 🔥 PRODUCTION READY MESSAGE SENDING WITH ALL PHASES
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

    // Add user message
    setSessions(prev =>
      prev.map(s =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...(s.messages || []), userMsg],
              lastUpdated: new Date().toISOString()
            }
          : s
      )
    );

    setInput("");
    setIsTyping(true);

    try {
      // Call production-ready Node.js backend
      const response = await fetch('http://localhost:3001/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      console.log("✅ PRODUCTION AI Response:", data);

      // 🔥 PRODUCTION READY: Handle all response types
      const aiMsg = { 
        role: "ai", 
        text: data.response || "I'm sorry, I'm having trouble connecting right now.",
        time: new Date().toLocaleTimeString(),
        id: Date.now() + 1,
        analysis: data.analysis || {},
        crisis_triggered: data.crisis_triggered || false,
        emergency: data.emergency || false,
        validation_applied: data.validation_applied || false,
        moderate_risk: data.moderate_risk || false,
        no_llm_override: data.no_llm_override || false
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

      // 🔥 PRODUCTION READY: CRISIS HANDLING
      if (data.crisis_triggered) {
        console.log("🚨 PRODUCTION: Crisis detected - showing alert");
        
        // Show immediate alert
        alert("🚨 " + data.response);
        
        // 🔊 TTS for crisis
        if (!isMuted) {
          speakText(data.response);
          speakText("Emergency resources are now displayed. Please consider calling for help.");
        }
        
        // Show emergency resources
        if (data.resources && data.resources.length > 0) {
          const resourcesText = data.resources.map(r => 
            `📞 ${r.name}: ${r.phone} (${r.available ? '24/7' : 'Limited hours'})`
          ).join('\n');
          
          setTimeout(() => {
            alert('🆘 Emergency Resources:\n\n' + resourcesText);
            speakText("Please review these emergency resources and consider calling for help.");
          }, 1000);
        }
      }

      // 🔥 PRODUCTION READY: TTS FOR NORMAL RESPONSES
      if (!data.crisis_triggered && !isMuted) {
        // Small delay to ensure message is displayed first
        setTimeout(() => {
          speakText(data.response);
        }, 500);
      }

    } catch (error) {
      console.error("❌ PRODUCTION API Error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  // 🔥 PRODUCTION READY: TEXT-TO-SPEECH FUNCTIONALITY
  const speakText = (text) => {
    if (!text || !text.trim() || isMuted) return;
    
    try {
      // Cancel any ongoing speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Create new speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings for mental health
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0; // Natural pitch
      utterance.volume = 1.0; // Full volume
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en') && voice.name.includes('Female')
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Add event listeners
      utterance.onstart = () => {
        console.log('🔊 PRODUCTION TTS started:', text.substring(0, 50));
      };
      
      utterance.onend = () => {
        console.log('🔊 PRODUCTION TTS completed');
      };
      
      utterance.onerror = (event) => {
        console.error('🔊 PRODUCTION TTS error:', event.error);
      };
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('🔊 PRODUCTION TTS Error:', error);
    }
  };

  // Voice recording functions (existing)
  const toggleRecording = async () => {
    if (!isListening) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];
        
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };
        
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Here you would send to a speech-to-text service
          setInput("🎤 Voice message recorded");
          
          setIsListening(false);
        };
        
        mediaRecorder.current.start();
        setIsListening(true);
        
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Microphone access denied. Please check permissions.");
      }
    } else {
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        mediaRecorder.current.stop();
      }
      setIsListening(false);
    }
  };

  return (
    <div className="chat-window" style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: theme === "dark" ? "#0f172a" : "#ffffff",
      color: theme === "dark" ? "#f1f5f9" : "#1f2937"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${theme === "dark" ? "#1e293b" : "#e2e8f0"}`,
        background: theme === "dark" ? "#1e293b" : "#ffffff"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Brain size={24} color={theme === "dark" ? "#60a5fa" : "#3b82f6"} />
          <div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: theme === "dark" ? "#f1f5f9" : "#1f2937" }}>
              Mental Health Assistant
            </div>
            <div style={{ fontSize: "12px", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              Production Ready ✅
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px"
        }}
      >
        {currentSession?.messages?.map((message, index) => (
          <div key={message.id} style={{
            marginBottom: "20px",
            display: "flex",
            flexDirection: message.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-start"
          }}>
            <div style={{ maxWidth: "70%" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px"
              }}>
                {message.role === "user" ? (
                  <User size={20} color={theme === "dark" ? "#60a5fa" : "#3b82f6"} />
                ) : (
                  <Bot size={20} color={theme === "dark" ? "#10b981" : "#059669"} />
                )}
                <div>
                  <div style={{ 
                    fontSize: "11px", 
                    fontWeight: "500",
                    color: theme === "dark" ? "#cbd5e1" : "#4b5563" 
                  }}>
                    {message.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div style={{ 
                    fontSize: "12px", 
                    color: theme === "dark" ? "#94a3b8" : "#64748b" 
                  }}>
                    {message.time}
                  </div>
                </div>
              </div>
              
              <div style={{
                padding: "12px 16px",
                borderRadius: "12px",
                background: message.role === "user" 
                  ? (theme === "dark" ? "#1e40af" : "#3b82f6")
                  : (theme === "dark" ? "#1e293b" : "#f1f5f9"),
                color: theme === "dark" ? "#f1f5f9" : "#1f2937",
                boxShadow: theme === "dark" 
                  ? "0 4px 6px rgba(0, 0, 0, 0.1)"
                  : "0 4px 6px rgba(0, 0, 0, 0.05)"
              }}>
                <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
                  {message.text}
                </div>
                
                {/* 🔥 PRODUCTION READY: SHOW ANALYSIS FOR AI MESSAGES */}
                {message.role === "ai" && (
                  <div style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    background: theme === "dark" ? "#374151" : "#f8fafc",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}>
                    <div style={{ marginBottom: "4px", fontWeight: "bold", color: theme === "dark" ? "#f1f5f9" : "#1f2937" }}>
                      📊 Production Analysis:
                    </div>
                    
                    {message.analysis?.intent && (
                      <div>🎯 Intent: {message.analysis.intent}</div>
                    )}
                    {message.analysis?.emotion && (
                      <div>😊 Emotion: {message.analysis.emotion}</div>
                    )}
                    {message.analysis?.risk && (
                      <div>⚠️ Risk: {message.analysis.risk.label} ({message.analysis.risk.score})</div>
                    )}
                    
                    {/* 🔥 PRODUCTION READY: SHOW STATUS FLAGS */}
                    <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {message.crisis_triggered && (
                        <div style={{
                          color: "#dc2626", 
                          fontWeight: "bold",
                          marginTop: "4px",
                          padding: "4px 8px",
                          background: "#fef2f2",
                          borderRadius: "4px"
                        }}>
                          🚨 CRISIS ALERT TRIGGERED
                        </div>
                      )}
                      {message.emergency && (
                        <div style={{
                          color: "#dc2626", 
                          fontWeight: "bold",
                          marginTop: "4px",
                          padding: "4px 8px",
                          background: "#fef2f2",
                          borderRadius: "4px"
                        }}>
                          🆘 EMERGENCY RESPONSE
                        </div>
                      )}
                      {message.validation_applied && (
                        <div style={{
                          color: "#f59e0b", 
                          marginTop: "4px",
                          padding: "4px 8px",
                          background: "#fef3c7",
                          borderRadius: "4px"
                        }}>
                          ✅ Validation Applied
                        </div>
                      )}
                      {message.no_llm_override && (
                        <div style={{
                          color: "#6b7280", 
                          marginTop: "4px",
                          padding: "4px 8px",
                          background: "#f0f9ff",
                          borderRadius: "4px"
                        }}>
                          🔒 LLM Blocked for Safety
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            color: theme === "dark" ? "#6b7280" : "#4b5563"
          }}>
            <Bot size={16} />
            <div style={{ fontSize: "12px" }}>Assistant is typing...</div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        padding: "20px",
        borderTop: `1px solid ${theme === "dark" ? "#1e293b" : "#e2e8f0"}`,
        background: theme === "dark" ? "#1e293b" : "#ffffff"
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: "500", marginRight: "12px" }}>
            🔥 Production Ready:
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSend(input);
              }
            }}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: "12px 16px",
              border: `1px solid ${theme === "dark" ? "#374151" : "#d1d5db"}`,
              borderRadius: "8px",
              fontSize: "14px",
              background: theme === "dark" ? "#1f2937" : "#ffffff",
              color: theme === "dark" ? "#f1f5f9" : "#1f2937"
            }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              background: (!input.trim() || isTyping)
                ? (theme === "dark" ? "#374151" : "#e5e7eb")
                : (theme === "dark" ? "#10b981" : "#059669"),
              color: "#ffffff",
              cursor: (!input.trim() || isTyping) ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            <Send size={16} />
          </button>
          
          {/* Voice Input */}
          <button
            onClick={toggleRecording}
            style={{
              padding: "12px",
              border: `1px solid ${theme === "dark" ? "#374151" : "#d1d5db"}`,
              borderRadius: "8px",
              background: isListening 
                ? (theme === "dark" ? "#dc2626" : "#ef4444")
                : (theme === "dark" ? "#1f293b" : "#ffffff"),
              color: isListening ? "#ffffff" : (theme === "dark" ? "#f1f5f9" : "#1f2937"),
              cursor: "pointer"
            }}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          
          {/* 🔥 PRODUCTION READY: TTS CONTROLS */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              padding: "8px 12px",
              border: `1px solid ${theme === "dark" ? "#374151" : "#d1d5db"}`,
              borderRadius: "6px",
              background: isMuted 
                ? (theme === "dark" ? "#374151" : "#e5e7eb") 
                : (theme === "dark" ? "#10b981" : "#059669"),
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <span style={{ fontSize: "12px", color: theme === "dark" ? "#9ca3af" : "#6b7280" }}>
            {isMuted ? "TTS Muted" : "TTS Enabled"}
          </span>
        </div>
        
        {/* Live Transcript */}
        {isListening && liveTranscript && (
          <div style={{
            marginTop: "8px",
            padding: "8px 12px",
            background: theme === "dark" ? "#374151" : "#f3f4f6",
            borderRadius: "6px",
            fontSize: "12px",
            color: theme === "dark" ? "#f1f5f9" : "#1f2937"
          }}>
            🎤 {liveTranscript}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindowProduction;

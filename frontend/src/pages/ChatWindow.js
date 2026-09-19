import React, { useState, useRef, useEffect } from "react";
import {
  Brain,
  Send,
  Mic,
  MicOff,
  User,
  Bot,
  Sparkles,
  Heart,
  Moon,
  Wind,
  BookOpen,
  ArrowUp,
  X,
  ShieldCheck
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL;

const normalizeSessionId = (sessionId) =>
  String(sessionId);

const ChatWindow = ({
  activeSessionId,
  setActiveSessionId,
  sessions,
  setSessions,
  theme,
  defaultQueries,
  isSidebarOpen
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [liveTranscript, setLiveTranscript] =
    useState("");

  const scrollRef = useRef(null);

  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // =====================================================
  // CURRENT SESSION
  // =====================================================

  const normalizedActiveSessionId =
    normalizeSessionId(activeSessionId);

  const currentSession =
    sessions.find(
      (session) =>
        normalizeSessionId(session.id) ===
        normalizedActiveSessionId
    );

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [
    sessions,
    activeSessionId,
    isTyping
  ]);

  // =====================================================
  // FALLBACK SESSION
  // =====================================================

  useEffect(() => {
    if (
      !currentSession &&
      sessions.length > 0 &&
      setActiveSessionId
    ) {
      setActiveSessionId(
        normalizeSessionId(
          sessions[0].id
        )
      );
    }
  }, [
    currentSession,
    sessions,
    setActiveSessionId
  ]);

  // =====================================================
  // SAVE SESSION
  // =====================================================

  const saveSession = (updatedSession) => {
    const user =
      JSON.parse(
        localStorage.getItem("user")
      );

    if (!user?.email) {
      return;
    }

    const userSessionsKey =
      `mindease-sessions-${user.email}`;

    const allSessions =
      JSON.parse(
        localStorage.getItem(
          userSessionsKey
        )
      ) || [];

    const sessionIndex =
      allSessions.findIndex(
        (session) =>
          normalizeSessionId(
            session.id
          ) ===
          normalizeSessionId(
            updatedSession.id
          )
      );

    if (sessionIndex !== -1) {
      allSessions[sessionIndex] = {
        ...updatedSession,
        id: normalizeSessionId(
          updatedSession.id
        )
      };

      localStorage.setItem(
        userSessionsKey,
        JSON.stringify(allSessions)
      );
    }
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSend = async (
    textToSend
  ) => {
    if (
      !textToSend ||
      !textToSend.trim() ||
      isTyping
    ) {
      return;
    }

    const finalInput =
      textToSend.trim();

    const token =
      localStorage.getItem("token");

    if (!token) {
      alert(
        "Your session has expired. Please login again."
      );

      return;
    }

    let sessionIdToUse =
      currentSession
        ? normalizedActiveSessionId
        : sessions.length > 0
        ? normalizeSessionId(
            sessions[0].id
          )
        : null;

    // Create fallback session
    if (!sessionIdToUse) {
      sessionIdToUse =
        normalizeSessionId(
          Date.now()
        );

      const fallbackSession = {
        id: sessionIdToUse,
        title: "New Chat",
        messages: [],
        createdAt:
          new Date().toISOString(),
        lastUpdated:
          new Date().toISOString()
      };

      setSessions((prev) => [
        fallbackSession,
        ...prev
      ]);

      setActiveSessionId(
        sessionIdToUse
      );
    }

    // =================================================
    // USER MESSAGE
    // =================================================

    const userMsg = {
      role: "user",
      text: finalInput,
      time:
        new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        ),
      id: Date.now()
    };

    setSessions((prev) =>
      prev.map((session) =>
        normalizeSessionId(
          session.id
        ) === sessionIdToUse
          ? {
              ...session,

              id: normalizeSessionId(
                session.id
              ),

              messages: [
                ...(session.messages ||
                  []),
                userMsg
              ],

              title:
                session.title ===
                  "New Chat" &&
                (!session.messages ||
                  session.messages
                    .length === 0)
                  ? finalInput.length >
                    35
                    ? `${finalInput.substring(
                        0,
                        35
                      )}...`
                    : finalInput
                  : session.title,

              lastUpdated:
                new Date().toISOString()
            }
          : session
      )
    );

    setInput("");
    setIsTyping(true);

    try {
      // =================================================
      // NODE BACKEND
      // =================================================

      const response =
        await fetch(
          `${API_URL}/api/chats`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              session_id:
                sessionIdToUse,

              message:
                finalInput
            })
          }
        );

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "MindEase AI:",
        data
      );

      // =================================================
      // AI MESSAGE
      // =================================================

      const aiMsg = {
        role: "ai",

        text:
          data.message ||
          "I'm here with you. Could you tell me a little more?",

        time:
          new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          ),

        id:
          Date.now() + 1,

        analysis:
          data.analysis || {},

        safety:
          data.safety || {},

        enhanced:
          data.enhanced || false,

        context_used:
          data.context_used || false
      };

      setSessions((prev) =>
        prev.map((session) =>
          normalizeSessionId(
            session.id
          ) === sessionIdToUse
            ? {
                ...session,

                messages: [
                  ...(session.messages ||
                    []),
                  aiMsg
                ],

                lastUpdated:
                  new Date().toISOString()
              }
            : session
        )
      );

    } catch (error) {
      console.error(
        "MindEase API Error:",
        error
      );

      const errorMsg = {
        role: "ai",

        text:
          "I'm having trouble connecting right now. Please try again.",

        time:
          new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          ),

        id:
          Date.now() + 1,

        error: true
      };

      setSessions((prev) =>
        prev.map((session) =>
          normalizeSessionId(
            session.id
          ) === sessionIdToUse
            ? {
                ...session,

                messages: [
                  ...(session.messages ||
                    []),
                  errorMsg
                ]
              }
            : session
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // =====================================================
  // VOICE INPUT
  // =====================================================

  const toggleRecording =
    async () => {
      if (isListening) {
        stopRecording();
        return;
      }

      try {
        const SpeechRecognition =
          window.SpeechRecognition ||
          window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          alert(
            "Voice input is not supported in this browser. Please use Chrome or Edge."
          );

          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true
            }
          );

        streamRef.current =
          stream;

        const recognition =
          new SpeechRecognition();

        recognition.continuous =
          true;

        recognition.interimResults =
          true;

        recognition.lang =
          "en-US";

        recognition.onresult =
          (event) => {
            let transcript = "";

            for (
              let i =
                event.resultIndex;
              i <
              event.results.length;
              i++
            ) {
              transcript +=
                event.results[i][0]
                  .transcript;
            }

            setLiveTranscript(
              transcript.trim()
            );
          };

        recognition.onerror =
          (event) => {
            console.error(
              "Speech recognition error:",
              event.error
            );

            stopRecording();
          };

        recognition.onend =
          () => {
            if (
              isListening
            ) {
              try {
                recognition.start();
              } catch (error) {
                console.error(
                  error
                );
              }
            }
          };

        recognitionRef.current =
          recognition;

        recognition.start();

        setIsListening(
          true
        );

      } catch (error) {
        console.error(
          "Microphone error:",
          error
        );

        alert(
          "Please allow microphone access to use voice input."
        );
      }
    };

  // =====================================================
  // STOP VOICE
  // =====================================================

  const stopRecording = () => {
    setIsListening(
      false
    );

    if (
      recognitionRef.current
    ) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error(
          error
        );
      }

      recognitionRef.current =
        null;
    }

    if (
      streamRef.current
    ) {
      streamRef.current
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      streamRef.current =
        null;
    }
  };

  // =====================================================
  // SEND VOICE TRANSCRIPT
  // =====================================================

  const sendVoiceMessage =
    () => {
      if (
        liveTranscript.trim()
      ) {
        const transcript =
          liveTranscript.trim();

        setLiveTranscript("");

        stopRecording();

        handleSend(
          transcript
        );
      }
    };

  // =====================================================
  // RECOMMENDATION HANDLER
  // =====================================================

  const handleRecommendation =
    (query) => {
      handleSend(
        query.text
      );
    };

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.stop();
        } catch (error) {}
      }

      if (
        streamRef.current
      ) {
        streamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      }
    };
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <main
      className="flex-grow-1 d-flex flex-column position-relative"
      style={{
        minHeight: 0,
        background:
          theme.bg
      }}
    >

      <style>{`

        .mindease-chat {
          scrollbar-width: thin;
          scrollbar-color: ${theme.border} transparent;
        }

        .mindease-chat::-webkit-scrollbar {
          width: 6px;
        }

        .mindease-chat::-webkit-scrollbar-thumb {
          background: ${theme.border};
          border-radius: 10px;
        }

        .welcome-card {
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .welcome-card:hover {
          transform: translateY(-4px);
          border-color: ${theme.primary};
          box-shadow:
            0 12px 30px rgba(99, 102, 241, 0.15);
        }

        .recommendation-card {
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .recommendation-card:hover {
          transform: translateY(-3px);
          border-color: ${theme.primary};
        }

        .message-user {
          animation: messageIn 0.3s ease;
        }

        .message-ai {
          animation: messageIn 0.3s ease;
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
          background: ${theme.primary};
          margin: 0 3px;
          animation: typing 1.3s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }

          30% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }

        .voice-active {
          animation: voicePulse 1.5s infinite;
        }

        @keyframes voicePulse {
          0% {
            box-shadow:
              0 0 0 0 rgba(239, 68, 68, 0.4);
          }

          70% {
            box-shadow:
              0 0 0 12px rgba(239, 68, 68, 0);
          }

          100% {
            box-shadow:
              0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        .composer {
          transition: all 0.25s ease;
        }

        .composer:focus-within {
          border-color: ${theme.primary} !important;

          box-shadow:
            0 8px 30px rgba(99, 102, 241, 0.15);
        }

        .send-button {
          transition: all 0.2s ease;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .quick-chip {
          transition: all 0.2s ease;
        }

        .quick-chip:hover {
          border-color: ${theme.primary} !important;
          background: ${theme.primary}12 !important;
        }

        @media (max-width: 1100px) {
          .recommendations-panel {
            display: none !important;
          }
        }

        @media (max-width: 700px) {
          .welcome-grid {
            grid-template-columns: 1fr !important;
          }

          .message-bubble {
            max-width: 88% !important;
          }

          .composer-container {
            padding: 12px !important;
          }

          .quick-suggestions {
            display: none !important;
          }
        }

      `}</style>

      {/* =================================================
          MAIN CHAT LAYOUT
      ================================================= */}

      <div
        className="d-flex flex-grow-1"
        style={{
          minHeight: 0
        }}
      >

        {/* =================================================
            CENTER CHAT
        ================================================= */}

        <section
          className="flex-grow-1 d-flex flex-column"
          style={{
            minWidth: 0
          }}
        >

          {/* CHAT HEADER */}

          <div
            className="px-4 py-3 d-flex align-items-center justify-content-between"
            style={{
              borderBottom:
                `1px solid ${theme.border}`
            }}
          >

            <div
              className="d-flex align-items-center gap-3"
            >

              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background:
                    `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff"
                }}
              >
                <Sparkles
                  size={21}
                />
              </div>

              <div>
                <div
                  className="fw-bold"
                  style={{
                    color: theme.text
                  }}
                >
                  MindEase AI
                </div>

                <div
                  style={{
                    color:
                      theme.subtext,
                    fontSize: 12
                  }}
                >
                  Your private AI companion
                </div>
              </div>

            </div>

            <div
              className="d-flex align-items-center gap-2"
              style={{
                color: "#10b981",
                fontSize: 12
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background:
                    "#10b981"
                }}
              />

              Online
            </div>

          </div>

          {/* =================================================
              CHAT CONTENT
          ================================================= */}

          <div
            ref={scrollRef}
            className="mindease-chat flex-grow-1 overflow-auto px-4 py-4"
            style={{
              minHeight: 0
            }}
          >

            <div
              style={{
                maxWidth: 900,
                margin: "0 auto"
              }}
            >

              {/* =================================================
                  EMPTY STATE
              ================================================= */}

              {!currentSession?.messages?.length ? (

                <div
                  className="d-flex flex-column justify-content-center"
                  style={{
                    minHeight:
                      "calc(100vh - 250px)"
                  }}
                >

                  <div
                    className="text-center mb-5"
                  >

                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 24,
                        background:
                          `linear-gradient(135deg, ${theme.primary}20, ${theme.accent}20)`,
                        border:
                          `1px solid ${theme.primary}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                        margin:
                          "0 auto 20px"
                      }}
                    >

                      <Brain
                        size={36}
                        style={{
                          color:
                            theme.primary
                        }}
                      />

                    </div>

                    <h1
                      className="fw-bold mb-2"
                      style={{
                        color:
                          theme.text,
                        fontSize:
                          "clamp(28px, 4vw, 42px)"
                      }}
                    >
                      How are you feeling today?
                    </h1>

                    <p
                      style={{
                        color:
                          theme.subtext,
                        maxWidth: 520,
                        margin:
                          "0 auto",
                        lineHeight: 1.7
                      }}
                    >
                      I'm here to listen,
                      support you, and help
                      you understand what
                      you're going through.
                    </p>

                  </div>

                  {/* QUICK PROMPTS */}

                  <div
                    className="welcome-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, 1fr)",
                      gap: 12,
                      maxWidth: 680,
                      width: "100%",
                      margin:
                        "0 auto"
                    }}
                  >

                    {defaultQueries
                      ?.slice(0, 4)
                      .map(
                        (
                          query,
                          index
                        ) => (

                          <button
                            key={index}
                            className="welcome-card text-start p-3"
                            onClick={() =>
                              handleRecommendation(
                                query
                              )
                            }
                            style={{
                              background:
                                theme.card,
                              border:
                                `1px solid ${theme.border}`,
                              borderRadius:
                                16,
                              color:
                                theme.text
                            }}
                          >

                            <div
                              className="d-flex align-items-center gap-3"
                            >

                              <div
                                style={{
                                  fontSize:
                                    26,
                                  width: 44,
                                  height: 44,
                                  borderRadius:
                                    13,
                                  background:
                                    `${theme.primary}12`,
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center"
                                }}
                              >
                                {
                                  query.icon
                                }
                              </div>

                              <div>

                                <div
                                  className="fw-semibold"
                                  style={{
                                    fontSize:
                                      14
                                  }}
                                >
                                  {
                                    query.title
                                  }
                                </div>

                                <div
                                  style={{
                                    color:
                                      theme.subtext,
                                    fontSize:
                                      12,
                                    marginTop:
                                      3
                                  }}
                                >
                                  {
                                    query.description
                                  }
                                </div>

                              </div>

                            </div>

                          </button>

                        )
                      )}

                  </div>

                </div>

              ) : (

                /* =================================================
                   MESSAGES
                ================================================= */

                <div
                  className="d-flex flex-column gap-4"
                >

                  {currentSession.messages.map(
                    (
                      msg,
                      index
                    ) => (

                      <div
                        key={
                          msg.id ||
                          index
                        }
                        className={
                          msg.role ===
                          "user"
                            ? "message-user d-flex justify-content-end"
                            : "message-ai d-flex justify-content-start"
                        }
                      >

                        <div
                          className="d-flex gap-3"
                          style={{
                            maxWidth:
                              "78%",
                            flexDirection:
                              msg.role ===
                              "user"
                                ? "row-reverse"
                                : "row"
                          }}
                        >

                          {/* AVATAR */}

                          <div
                            style={{
                              flexShrink: 0,
                              width: 36,
                              height: 36,
                              borderRadius:
                                12,
                              background:
                                msg.role ===
                                "user"
                                  ? theme.primary
                                  : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color:
                                "#fff"
                            }}
                          >

                            {msg.role ===
                            "user" ? (
                              <User
                                size={17}
                              />
                            ) : (
                              <Bot
                                size={18}
                              />
                            )}

                          </div>

                          {/* MESSAGE */}

                          <div
                            className="message-bubble"
                            style={{
                              background:
                                msg.role ===
                                "user"
                                  ? theme.primary
                                  : theme.card,

                              color:
                                msg.role ===
                                "user"
                                  ? "#fff"
                                  : theme.text,

                              border:
                                msg.role ===
                                "user"
                                  ? "none"
                                  : `1px solid ${theme.border}`,

                              borderRadius:
                                18,

                              borderTopRightRadius:
                                msg.role ===
                                "user"
                                  ? 5
                                  : 18,

                              borderTopLeftRadius:
                                msg.role ===
                                "ai"
                                  ? 5
                                  : 18,

                              padding:
                                "14px 17px",

                              boxShadow:
                                msg.role ===
                                "user"
                                  ? "0 6px 18px rgba(99,102,241,0.18)"
                                  : "0 4px 15px rgba(0,0,0,0.05)"
                            }}
                          >

                            <div
                              style={{
                                whiteSpace:
                                  "pre-wrap",
                                lineHeight:
                                  1.65,
                                fontSize:
                                  14
                              }}
                            >
                              {
                                msg.text
                              }
                            </div>

                            {msg.role === "ai" &&
                              (msg.safety?.crisis_triggered === true ||
                                msg.safety?.emergency === true) && (
                                <div
                                  role="alert"
                                  style={{
                                    marginTop: 12,
                                    padding: 12,
                                    borderRadius: 10,
                                    background: "rgba(239, 68, 68, 0.12)",
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                    color: theme.text
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-2 fw-semibold">
                                    <ShieldCheck size={16} />
                                    Immediate support is available
                                  </div>

                                  {Array.isArray(msg.safety?.resources) &&
                                    msg.safety.resources.length > 0 && (
                                      <div className="mt-2">
                                        {msg.safety.resources.map((resource, resourceIndex) => (
                                          <div key={resourceIndex} style={{ fontSize: 12 }}>
                                            {resource.name}: {resource.phone}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              )}

                            {msg.role === "ai" &&
                              (msg.safety?.moderate_risk === true ||
                                msg.safety?.alert === true) &&
                              msg.safety?.crisis_triggered !== true &&
                              msg.safety?.emergency !== true && (
                                <div
                                  role="status"
                                  className="mt-2"
                                  style={{
                                    fontSize: 12,
                                    color: theme.accent
                                  }}
                                >
                                  Extra support may be helpful right now.
                                </div>
                              )}

                            {msg.role === "ai" &&
                              msg.safety?.validation_applied === true &&
                              msg.safety?.rejected === true && (
                                <div
                                  role="status"
                                  className="mt-2"
                                  style={{
                                    fontSize: 12,
                                    color: theme.subtext
                                  }}
                                >
                                  Response kept within mental-health support topics.
                                </div>
                              )}

                            {msg.role === "ai" &&
                              (msg.safety?.degraded === true ||
                                msg.safety?.fallback === true) && (
                                <div
                                  role="status"
                                  className="mt-2"
                                  style={{
                                    fontSize: 12,
                                    color: theme.subtext
                                  }}
                                >
                                  A fallback response was provided while the AI service was unavailable.
                                </div>
                              )}

                            <div
                              className="mt-2"
                              style={{
                                fontSize:
                                  10,
                                opacity:
                                  0.55
                              }}
                            >
                              {
                                msg.time
                              }
                            </div>

                            {/* AI ANALYSIS */}

                            {msg.role ===
                              "ai" &&
                              msg.analysis &&
                              (msg.analysis
                                .emotion ||
                                msg.analysis
                                  .intent) && (

                                <div
                                  className="d-flex flex-wrap gap-2 mt-3"
                                >

                                  {msg.analysis
                                    ?.emotion
                                    ?.label && (

                                    <span
                                      style={{
                                        padding:
                                          "4px 8px",
                                        borderRadius:
                                          8,
                                        background:
                                          `${theme.primary}15`,
                                        color:
                                          theme.primary,
                                        fontSize:
                                          10
                                      }}
                                    >
                                      Emotion:{" "}
                                      {
                                        msg
                                          .analysis
                                          .emotion
                                          .label
                                      }
                                    </span>

                                  )}

                                  {msg.analysis
                                    ?.intent
                                    ?.label && (

                                    <span
                                      style={{
                                        padding:
                                          "4px 8px",
                                        borderRadius:
                                          8,
                                        background:
                                          `${theme.accent}15`,
                                        color:
                                          theme.accent,
                                        fontSize:
                                          10
                                      }}
                                    >
                                      Intent:{" "}
                                      {
                                        msg
                                          .analysis
                                          .intent
                                          .label
                                      }
                                    </span>

                                  )}

                                </div>

                              )}

                          </div>

                        </div>

                      </div>

                    )
                  )}

                  {/* =================================================
                      TYPING
                  ================================================= */}

                  {isTyping && (

                    <div
                      className="d-flex gap-3"
                    >

                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          background:
                            `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          color: "#fff"
                        }}
                      >
                        <Bot
                          size={18}
                        />
                      </div>

                      <div
                        style={{
                          background:
                            theme.card,
                          border:
                            `1px solid ${theme.border}`,
                          padding:
                            "14px 16px",
                          borderRadius:
                            18,
                          borderTopLeftRadius:
                            5
                        }}
                      >

                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />

                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>

          </div>

          {/* =================================================
              COMPOSER
          ================================================= */}

          <div
            className="composer-container px-4 pb-4"
          >

            <div
              style={{
                maxWidth: 900,
                margin: "0 auto"
              }}
            >

              {/* VOICE TRANSCRIPT */}

              {isListening &&
                liveTranscript && (

                  <div
                    className="mb-2 p-3"
                    style={{
                      background:
                        `${theme.primary}10`,
                      border:
                        `1px solid ${theme.primary}30`,
                      borderRadius: 14,
                      color:
                        theme.text
                    }}
                  >

                    <div
                      className="d-flex align-items-center gap-2 mb-1"
                    >

                      <Mic
                        size={15}
                        style={{
                          color:
                            "#ef4444"
                        }}
                      />

                      <span
                        style={{
                          fontSize:
                            11,
                          color:
                            theme.subtext
                        }}
                      >
                        Listening...
                      </span>

                    </div>

                    <div
                      style={{
                        fontSize:
                          13
                      }}
                    >
                      {
                        liveTranscript
                      }
                    </div>

                  </div>

                )}

              {/* VOICE CONTROL */}

              {isListening && (

                <div
                  className="d-flex align-items-center justify-content-between mb-2"
                >

                  <span
                    style={{
                      color:
                        theme.subtext,
                      fontSize:
                        12
                    }}
                  >
                    Speak naturally. MindEase is listening.
                  </span>

                  <button
                    onClick={
                      sendVoiceMessage
                    }
                    disabled={
                      !liveTranscript.trim()
                    }
                    style={{
                      border:
                        "none",
                      background:
                        theme.primary,
                      color:
                        "#fff",
                      padding:
                        "7px 12px",
                      borderRadius:
                        9,
                      fontSize:
                        12
                    }}
                  >
                    Send Voice
                  </button>

                </div>

              )}

              {/* COMPOSER */}

              <div
                className="composer d-flex align-items-end gap-2"
                style={{
                  background:
                    theme.card,
                  border:
                    `1px solid ${theme.border}`,
                  borderRadius:
                    20,
                  padding:
                    "8px 9px 8px 16px"
                }}
              >

                <textarea
                  value={input}
                  onChange={(e) =>
                    setInput(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                        "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();

                      handleSend(
                        input
                      );
                    }
                  }}
                  disabled={
                    isTyping
                  }
                  rows={1}
                  placeholder={
                    isListening
                      ? "Listening to you..."
                      : "Share what's on your mind..."
                  }
                  style={{
                    flex: 1,
                    resize:
                      "none",
                    border:
                      "none",
                    outline:
                      "none",
                    background:
                      "transparent",
                    color:
                      theme.text,
                    fontSize:
                      14,
                    padding:
                      "10px 0",
                    maxHeight:
                      120
                  }}
                />

                {/* MICROPHONE */}

                <button
                  type="button"
                  onClick={
                    toggleRecording
                  }
                  disabled={
                    isTyping
                  }
                  className={
                    isListening
                      ? "voice-active"
                      : ""
                  }
                  style={{
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    borderRadius:
                      13,
                    border:
                      "none",
                    background:
                      isListening
                        ? "#ef4444"
                        : `${theme.primary}12`,
                    color:
                      isListening
                        ? "#fff"
                        : theme.primary,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    cursor:
                      isTyping
                        ? "not-allowed"
                        : "pointer"
                  }}
                  title={
                    isListening
                      ? "Stop listening"
                      : "Voice input"
                  }
                >

                  {isListening ? (
                    <MicOff
                      size={18}
                    />
                  ) : (
                    <Mic
                      size={18}
                    />
                  )}

                </button>

                {/* SEND */}

                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      input
                    )
                  }
                  disabled={
                    isTyping ||
                    !input.trim()
                  }
                  className="send-button"
                  style={{
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    borderRadius:
                      13,
                    border:
                      "none",
                    background:
                      theme.primary,
                    color:
                      "#fff",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    cursor:
                      "pointer"
                  }}
                  title="Send message"
                >

                  <ArrowUp
                    size={19}
                  />

                </button>

              </div>

              {/* DISCLAIMER */}

              <div
                className="text-center mt-2"
                style={{
                  color:
                    theme.subtext,
                  fontSize:
                    10
                }}
              >
                MindEase is an AI support
                companion. It is not a
                replacement for professional
                medical care.
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RIGHT RECOMMENDATIONS
        ================================================= */}

        <aside
          className="recommendations-panel"
          style={{
            width: 260,
            flexShrink: 0,
            borderLeft:
              `1px solid ${theme.border}`,
            padding: 20,
            overflowY: "auto"
          }}
        >

          <div
            className="d-flex align-items-center gap-2 mb-4"
          >

            <Sparkles
              size={17}
              style={{
                color:
                  theme.primary
              }}
            />

            <span
              className="fw-bold"
              style={{
                color:
                  theme.text,
                fontSize:
                  14
              }}
            >
              For You
            </span>

          </div>

          <p
            style={{
              color:
                theme.subtext,
              fontSize:
                11,
              lineHeight:
                1.5
            }}
          >
            Small activities that may
            help you feel better.
          </p>

          {/* BREATHING */}

          <button
            className="recommendation-card w-100 text-start border-0 p-3 mb-2"
            onClick={() =>
              handleSend(
                "Can you guide me through a short breathing exercise?"
              )
            }
            style={{
              background:
                theme.card,
              border:
                `1px solid ${theme.border}`,
              borderRadius:
                14,
              color:
                theme.text
            }}
          >

            <Wind
              size={20}
              style={{
                color:
                  "#14b8a6"
              }}
            />

            <div
              className="fw-semibold mt-2"
              style={{
                fontSize:
                  13
              }}
            >
              Breathing
            </div>

            <div
              style={{
                color:
                  theme.subtext,
                fontSize:
                  11,
                marginTop:
                  3
              }}
            >
              2 minute calming exercise
            </div>

          </button>

          {/* SLEEP */}

          <button
            className="recommendation-card w-100 text-start border-0 p-3 mb-2"
            onClick={() =>
              handleSend(
                "Help me create a relaxing routine for better sleep."
              )
            }
            style={{
              background:
                theme.card,
              border:
                `1px solid ${theme.border}`,
              borderRadius:
                14,
              color:
                theme.text
            }}
          >

            <Moon
              size={20}
              style={{
                color:
                  "#8b5cf6"
              }}
            />

            <div
              className="fw-semibold mt-2"
              style={{
                fontSize:
                  13
              }}
            >
              Better Sleep
            </div>

            <div
              style={{
                color:
                  theme.subtext,
                fontSize:
                  11,
                marginTop:
                  3
              }}
            >
              Build a calming bedtime routine
            </div>

          </button>

          {/* SUPPORT */}

          <button
            className="recommendation-card w-100 text-start border-0 p-3 mb-2"
            onClick={() =>
              handleSend(
                "I'm feeling overwhelmed. Can you help me calm down?"
              )
            }
            style={{
              background:
                theme.card,
              border:
                `1px solid ${theme.border}`,
              borderRadius:
                14,
              color:
                theme.text
            }}
          >

            <Heart
              size={20}
              style={{
                color:
                  "#ec4899"
              }}
            />

            <div
              className="fw-semibold mt-2"
              style={{
                fontSize:
                  13
              }}
            >
              Emotional Support
            </div>

            <div
              style={{
                color:
                  theme.subtext,
                fontSize:
                  11,
                marginTop:
                  3
              }}
            >
              Talk through what's bothering you
            </div>

          </button>

          {/* JOURNAL */}

          <button
            className="recommendation-card w-100 text-start border-0 p-3 mb-2"
            onClick={() =>
              handleSend(
                "Give me a simple journaling prompt for today."
              )
            }
            style={{
              background:
                theme.card,
              border:
                `1px solid ${theme.border}`,
              borderRadius:
                14,
              color:
                theme.text
            }}
          >

            <BookOpen
              size={20}
              style={{
                color:
                  "#f59e0b"
              }}
            />

            <div
              className="fw-semibold mt-2"
              style={{
                fontSize:
                  13
              }}
            >
              Journal
            </div>

            <div
              style={{
                color:
                  theme.subtext,
                fontSize:
                  11,
                marginTop:
                  3
              }}
            >
              Reflect on your thoughts
            </div>

          </button>

          {/* PRIVACY */}

          <div
            className="mt-4 p-3"
            style={{
              background:
                `${theme.primary}08`,
              border:
                `1px solid ${theme.primary}18`,
              borderRadius:
                13
            }}
          >

            <ShieldCheck
              size={17}
              style={{
                color:
                  theme.primary
              }}
            />

            <div
              className="fw-semibold mt-2"
              style={{
                fontSize:
                  11,
                color:
                  theme.text
              }}
            >
              Private conversation
            </div>

            <div
              style={{
                color:
                  theme.subtext,
                fontSize:
                  10,
                lineHeight:
                  1.5,
                marginTop:
                  3
              }}
            >
              Your conversation is
              associated with your
              MindEase account.
            </div>

          </div>

        </aside>

      </div>

    </main>
  );
};

export default ChatWindow;
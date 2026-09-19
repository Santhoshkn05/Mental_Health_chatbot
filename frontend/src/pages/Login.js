import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sun,
  Moon,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Sparkles
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();

  const [view, setView] = useState("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme =
      localStorage.getItem("mindease-theme");

    return savedTheme
      ? JSON.parse(savedTheme)
      : true;
  });

  useEffect(() => {
    localStorage.setItem(
      "mindease-theme",
      JSON.stringify(isDarkMode)
    );
  }, [isDarkMode]);

  // =========================
  // THEME
  // =========================

  const theme = {
    bg: isDarkMode
      ? "#070511"
      : "#f7f7fb",

    card: isDarkMode
      ? "rgba(19, 15, 38, 0.88)"
      : "#ffffff",

    cardSecondary: isDarkMode
      ? "rgba(124, 58, 237, 0.08)"
      : "#f8f7ff",

    text: isDarkMode
      ? "#ffffff"
      : "#171326",

    subtext: isDarkMode
      ? "rgba(255,255,255,0.62)"
      : "#6b7280",

    border: isDarkMode
      ? "rgba(255,255,255,0.09)"
      : "rgba(30,27,75,0.10)",

    input: isDarkMode
      ? "rgba(255,255,255,0.045)"
      : "#f8f8fc",

    primary: "#7c3aed",

    primaryHover: "#6d28d9",

    accent: "#14b8a6",

    success: "#10b981",

    warning: "#f59e0b",

    error: "#ef4444"
  };

  // =========================
  // CLEAR MESSAGES
  // =========================

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();

    clearMessages();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!normalizedEmail.endsWith("@gmail.com")) {
      setError(
        "Only @gmail.com addresses are permitted."
      );
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: normalizedEmail,
            password
          })
        }
      );

      const data =
        await response.json();

      // Login success
      if (response.ok) {
        setMessage("Login successful.");

        // Save JWT
        localStorage.setItem(
          "token",
          data.token
        );

        // Save user
        const user = {
          name: data.name,
          email: data.email,
          userId:
            data.userId ||
            data.id
        };

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        // Create first chat session
        try {
          const userSessionsKey =
            `mindease-sessions-${data.email}`;

          const existingSessions =
            JSON.parse(
              localStorage.getItem(
                userSessionsKey
              )
            ) || [];

          /*
           * Only create Welcome Chat
           * if this user doesn't have
           * any sessions.
           */
          if (
            existingSessions.length === 0
          ) {
            const newSession = {
              id: Date.now(),

              title: "Welcome Chat",

              messages: [],

              createdAt:
                new Date().toISOString(),

              lastUpdated:
                new Date().toISOString()
            };

            localStorage.setItem(
              userSessionsKey,
              JSON.stringify([
                newSession
              ])
            );
          }

        } catch (storageError) {
          console.error(
            "Session storage error:",
            storageError
          );
        }

        // Navigate to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 800);

        return;
      }

      // Backend errors
      if (response.status === 403) {
        setError(
          data.error ||
            "Please verify your email address before logging in."
        );

        return;
      }

      if (response.status === 401) {
        setError(
          data.error ||
            "Invalid email or password."
        );

        return;
      }

      setError(
        data.error ||
          "Login failed. Please try again."
      );

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        "Unable to connect to the server. Please try again."
      );

    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // REQUEST OTP
  // =========================

  const handleRequestOTP = async (e) => {
    e.preventDefault();

    clearMessages();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!normalizedEmail.endsWith("@gmail.com")) {
      setError(
        "Only @gmail.com addresses are permitted."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: normalizedEmail
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setMessage(
          "A 6-digit verification code has been sent to your email."
        );

        setView("otp");

        return;
      }

      setError(
        data.error ||
          "Failed to send verification code."
      );

    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      setError(
        "Unable to connect to the server."
      );

    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // VERIFY OTP
  // =========================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    clearMessages();

    if (otp.length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email:
              email.trim().toLowerCase(),
            otp
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setMessage(
          "Code verified successfully."
        );

        setView("reset");

        return;
      }

      setError(
        data.error ||
          "Invalid verification code."
      );

    } catch (err) {
      console.error(
        "OTP verification error:",
        err
      );

      setError(
        "Unable to verify the code."
      );

    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // RESET PASSWORD
  // =========================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    clearMessages();

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email:
              email.trim().toLowerCase(),

            otp,

            newPassword
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setMessage(
          "Password changed successfully. You can now sign in."
        );

        setTimeout(() => {
          setView("signin");
          setPassword("");
          setNewPassword("");
          setOtp("");
          setMessage("");
        }, 1800);

        return;
      }

      setError(
        data.error ||
          "Unable to update password."
      );

    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      setError(
        "Unable to connect to the server."
      );

    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // STATUS ALERT
  // =========================

  const StatusAlert = () => {
    if (!error && !message) {
      return null;
    }

    const isError =
      Boolean(error);

    const text =
      error || message;

    return (
      <AnimatePresence mode="wait">

        <motion.div
          key={text}
          initial={{
            opacity: 0,
            y: -8
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -8
          }}
          style={{
            display: "flex",
            alignItems:
              "flex-start",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "12px",
            marginBottom: "20px",

            background:
              isError
                ? "rgba(239,68,68,0.10)"
                : "rgba(16,185,129,0.10)",

            border:
              `1px solid ${
                isError
                  ? "rgba(239,68,68,0.25)"
                  : "rgba(16,185,129,0.25)"
              }`,

            color:
              isError
                ? theme.error
                : theme.success,

            fontSize: "13px",

            lineHeight: "1.5"
          }}
        >

          {isError ? (
            <AlertCircle
              size={17}
              style={{
                flexShrink: 0,
                marginTop: "1px"
              }}
            />
          ) : (
            <CheckCircle
              size={17}
              style={{
                flexShrink: 0,
                marginTop: "1px"
              }}
            />
          )}

          <span>{text}</span>

        </motion.div>

      </AnimatePresence>
    );
  };

  // =========================
  // CHANGE VIEW
  // =========================

  const changeView = (newView) => {
    clearMessages();

    setView(newView);
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily:
          "'Inter', 'Plus Jakarta Sans', sans-serif",
        position: "relative",
        overflow: "hidden"
      }}
    >

      {/* Background glow */}

      <div
        style={{
          position: "absolute",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background:
            "rgba(124,58,237,0.13)",
          filter: "blur(120px)",
          top: "-220px",
          left: "-180px",
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background:
            "rgba(20,184,166,0.10)",
          filter: "blur(120px)",
          bottom: "-200px",
          right: "-150px",
          pointerEvents: "none"
        }}
      />

      {/* ================= HEADER ================= */}

      <header
        style={{
          position: "relative",
          zIndex: 10,

          borderBottom:
            `1px solid ${theme.border}`,

          background:
            isDarkMode
              ? "rgba(7,5,17,0.75)"
              : "rgba(255,255,255,0.8)",

          backdropFilter:
            "blur(16px)"
        }}
      >

        <div
          className="container-fluid px-4 px-md-5 py-3 d-flex justify-content-between align-items-center"
        >

          {/* Brand */}

          <div
            onClick={() =>
              navigate("/")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer"
            }}
          >

            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "linear-gradient(135deg,#7c3aed,#14b8a6)"
              }}
            >

              <Brain
                size={22}
                color="#ffffff"
              />

            </div>

            <div>

              <div
                style={{
                  fontSize: "19px",
                  fontWeight: "800",
                  letterSpacing: "-0.4px"
                }}
              >
                MindEase
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: theme.subtext,
                  letterSpacing: "1px"
                }}
              >
                MENTAL WELLNESS
              </div>

            </div>

          </div>

          {/* Theme */}

          <button
            type="button"
            onClick={() =>
              setIsDarkMode(
                (prev) => !prev
              )
            }
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              border:
                `1px solid ${theme.border}`,
              background:
                theme.input,
              color: theme.text,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              cursor: "pointer"
            }}
          >

            {isDarkMode ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}

          </button>

        </div>

      </header>

      {/* ================= MAIN ================= */}

      <main
        className="container"
        style={{
          minHeight:
            "calc(100vh - 73px)",

          display: "flex",
          alignItems: "center",

          paddingTop: "45px",
          paddingBottom: "45px",

          position: "relative",
          zIndex: 2
        }}
      >

        <div
          className="row w-100 align-items-center g-5"
        >

          {/* ================= LEFT SIDE ================= */}

          <div
            className="col-lg-6 d-none d-lg-block"
          >

            <motion.div
              initial={{
                opacity: 0,
                x: -30
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                duration: 0.6
              }}
              style={{
                maxWidth: "500px"
              }}
            >

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",

                  padding:
                    "7px 12px",

                  borderRadius:
                    "50px",

                  background:
                    theme.cardSecondary,

                  border:
                    `1px solid ${theme.border}`,

                  color:
                    theme.accent,

                  fontSize: "12px",
                  fontWeight: "700",

                  marginBottom: "22px"
                }}
              >

                <Sparkles size={14} />

                WELCOME BACK

              </div>

              <h1
                style={{
                  fontSize:
                    "clamp(38px, 4vw, 58px)",

                  lineHeight: "1.05",

                  fontWeight: "800",

                  letterSpacing: "-2px",

                  marginBottom: "22px"
                }}
              >

                Your safe space
                <br />

                is always
                <span
                  style={{
                    background:
                      "linear-gradient(90deg,#7c3aed,#14b8a6)",

                    WebkitBackgroundClip:
                      "text",

                    WebkitTextFillColor:
                      "transparent"
                  }}
                >
                  {" "}here.
                </span>

              </h1>

              <p
                style={{
                  color: theme.subtext,
                  fontSize: "16px",
                  lineHeight: "1.8",
                  maxWidth: "450px",
                  marginBottom: "32px"
                }}
              >
                Continue your MindEase journey.
                Your personalized mental wellness
                space is waiting for you.
              </p>

              {/* Security card */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",

                  padding: "18px",

                  borderRadius: "16px",

                  background:
                    theme.cardSecondary,

                  border:
                    `1px solid ${theme.border}`,

                  maxWidth: "410px"
                }}
              >

                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    minWidth: "44px",

                    borderRadius: "13px",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    background:
                      "rgba(20,184,166,0.10)",

                    color:
                      theme.accent
                  }}
                >

                  <ShieldCheck
                    size={21}
                  />

                </div>

                <div>

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      marginBottom: "3px"
                    }}
                  >
                    Your privacy matters
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: theme.subtext,
                      lineHeight: "1.5"
                    }}
                  >
                    Your account and conversations
                    are protected.
                  </div>

                </div>

              </div>

            </motion.div>

          </div>

          {/* ================= RIGHT SIDE ================= */}

          <div
            className="col-lg-6 d-flex justify-content-center"
          >

            <AnimatePresence mode="wait">

              {/* ================= SIGN IN ================= */}

              {view === "signin" && (

                <motion.div
                  key="signin"

                  initial={{
                    opacity: 0,
                    y: 20
                  }}

                  animate={{
                    opacity: 1,
                    y: 0
                  }}

                  exit={{
                    opacity: 0,
                    x: -20
                  }}

                  transition={{
                    duration: 0.35
                  }}

                  style={{
                    width: "100%",
                    maxWidth: "470px",

                    background:
                      theme.card,

                    border:
                      `1px solid ${theme.border}`,

                    borderRadius: "24px",

                    padding: "34px",

                    boxShadow:
                      isDarkMode
                        ? "0 30px 80px rgba(0,0,0,0.35)"
                        : "0 30px 80px rgba(30,27,75,0.10)",

                    backdropFilter:
                      "blur(20px)"
                  }}
                >

                  <CardHeader
                    icon={
                      <ShieldCheck
                        size={21}
                      />
                    }
                    title="Welcome back"
                    subtitle="Sign in to continue to your MindEase dashboard."
                    theme={theme}
                  />

                  <StatusAlert />

                  <form
                    onSubmit={handleLogin}
                  >

                    <InputField
                      label="Email address"
                      icon={
                        <Mail size={18} />
                      }
                      theme={theme}
                    >

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="you@gmail.com"
                        className="mindease-input"
                        required
                      />

                    </InputField>

                    <InputField
                      label="Password"
                      icon={
                        <Lock size={18} />
                      }
                      theme={theme}
                    >

                      <div
                        style={{
                          position:
                            "relative"
                        }}
                      >

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(e) => {
                            setPassword(
                              e.target.value
                            );
                            setError("");
                          }}
                          placeholder="Enter your password"
                          className="mindease-input"
                          style={{
                            paddingRight:
                              "48px"
                          }}
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (prev) =>
                                !prev
                            )
                          }
                          className="password-toggle"
                        >

                          {showPassword ? (
                            <EyeOff
                              size={18}
                            />
                          ) : (
                            <Eye
                              size={18}
                            />
                          )}

                        </button>

                      </div>

                    </InputField>

                    <div
                      style={{
                        textAlign:
                          "right",
                        marginTop:
                          "-8px",
                        marginBottom:
                          "22px"
                      }}
                    >

                      <button
                        type="button"
                        onClick={() =>
                          changeView(
                            "forgot"
                          )
                        }
                        style={{
                          border:
                            "none",
                          background:
                            "transparent",
                          color:
                            theme.primary,
                          fontSize:
                            "13px",
                          fontWeight:
                            "700",
                          cursor:
                            "pointer",
                          padding: 0
                        }}
                      >
                        Forgot password?
                      </button>

                    </div>

                    <PrimaryButton
                      loading={
                        isLoading
                      }
                      loadingText="Signing in..."
                      text="Sign In"
                      icon={
                        <ArrowRight
                          size={18}
                        />
                      }
                    />

                  </form>

                  <Divider
                    theme={theme}
                  />

                  <div
                    style={{
                      textAlign:
                        "center",
                      color:
                        theme.subtext,
                      fontSize:
                        "13px"
                    }}
                  >

                    Don't have an account?{" "}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/register"
                        )
                      }
                      style={{
                        border:
                          "none",
                        background:
                          "transparent",
                        color:
                          theme.primary,
                        fontWeight:
                          "700",
                        cursor:
                          "pointer",
                        padding: 0
                      }}
                    >
                      Create account
                    </button>

                  </div>

                </motion.div>
              )}

              {/* ================= FORGOT ================= */}

              {view === "forgot" && (

                <motion.div
                  key="forgot"

                  initial={{
                    opacity: 0,
                    x: 20
                  }}

                  animate={{
                    opacity: 1,
                    x: 0
                  }}

                  exit={{
                    opacity: 0,
                    x: -20
                  }}

                  transition={{
                    duration: 0.35
                  }}

                  style={{
                    width: "100%",
                    maxWidth: "470px",
                    background:
                      theme.card,
                    border:
                      `1px solid ${theme.border}`,
                    borderRadius: "24px",
                    padding: "34px",
                    boxShadow:
                      isDarkMode
                        ? "0 30px 80px rgba(0,0,0,0.35)"
                        : "0 30px 80px rgba(30,27,75,0.10)",
                    backdropFilter:
                      "blur(20px)"
                  }}
                >

                  <CardHeader
                    icon={
                      <KeyRound
                        size={21}
                      />
                    }
                    title="Reset your password"
                    subtitle="Enter your email and we'll send you a verification code."
                    theme={theme}
                  />

                  <StatusAlert />

                  <form
                    onSubmit={
                      handleRequestOTP
                    }
                  >

                    <InputField
                      label="Email address"
                      icon={
                        <Mail size={18} />
                      }
                      theme={theme}
                    >

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="you@gmail.com"
                        className="mindease-input"
                        required
                      />

                    </InputField>

                    <PrimaryButton
                      loading={
                        isLoading
                      }
                      loadingText="Sending code..."
                      text="Send Verification Code"
                    />

                  </form>

                  <BackButton
                    onClick={() =>
                      changeView(
                        "signin"
                      )
                    }
                    text="Back to Sign In"
                    theme={theme}
                  />

                </motion.div>
              )}

              {/* ================= OTP ================= */}

              {view === "otp" && (

                <motion.div
                  key="otp"

                  initial={{
                    opacity: 0,
                    scale: 0.96
                  }}

                  animate={{
                    opacity: 1,
                    scale: 1
                  }}

                  transition={{
                    duration: 0.35
                  }}

                  style={{
                    width: "100%",
                    maxWidth: "470px",
                    background:
                      theme.card,
                    border:
                      `1px solid ${theme.border}`,
                    borderRadius: "24px",
                    padding: "34px",
                    boxShadow:
                      isDarkMode
                        ? "0 30px 80px rgba(0,0,0,0.35)"
                        : "0 30px 80px rgba(30,27,75,0.10)",
                    backdropFilter:
                      "blur(20px)"
                  }}
                >

                  <CardHeader
                    icon={
                      <ShieldCheck
                        size={21}
                      />
                    }
                    title="Verify your code"
                    subtitle={`Enter the 6-digit code sent to ${email}.`}
                    theme={theme}
                  />

                  <StatusAlert />

                  <form
                    onSubmit={
                      handleVerifyOTP
                    }
                  >

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => {
                        const value =
                          e.target.value.replace(
                            /\D/g,
                            ""
                          );

                        setOtp(value);
                        setError("");
                      }}
                      placeholder="000000"
                      className="mindease-input otp-input"
                      required
                    />

                    <PrimaryButton
                      loading={
                        isLoading
                      }
                      loadingText="Verifying..."
                      text="Verify Code"
                      disabled={
                        otp.length !== 6
                      }
                      icon={
                        <ArrowRight
                          size={18}
                        />
                      }
                    />

                  </form>

                  <BackButton
                    onClick={() =>
                      changeView(
                        "forgot"
                      )
                    }
                    text="Use another email"
                    theme={theme}
                  />

                </motion.div>
              )}

              {/* ================= RESET ================= */}

              {view === "reset" && (

                <motion.div
                  key="reset"

                  initial={{
                    opacity: 0,
                    y: 20
                  }}

                  animate={{
                    opacity: 1,
                    y: 0
                  }}

                  transition={{
                    duration: 0.35
                  }}

                  style={{
                    width: "100%",
                    maxWidth: "470px",
                    background:
                      theme.card,
                    border:
                      `1px solid ${theme.border}`,
                    borderRadius: "24px",
                    padding: "34px",
                    boxShadow:
                      isDarkMode
                        ? "0 30px 80px rgba(0,0,0,0.35)"
                        : "0 30px 80px rgba(30,27,75,0.10)",
                    backdropFilter:
                      "blur(20px)"
                  }}
                >

                  <CardHeader
                    icon={
                      <Lock
                        size={21}
                      />
                    }
                    title="Create a new password"
                    subtitle="Choose a strong password for your MindEase account."
                    theme={theme}
                  />

                  <StatusAlert />

                  <form
                    onSubmit={
                      handleResetPassword
                    }
                  >

                    <InputField
                      label="New password"
                      icon={
                        <Lock size={18} />
                      }
                      theme={theme}
                    >

                      <div
                        style={{
                          position:
                            "relative"
                        }}
                      >

                        <input
                          type={
                            showNewPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            newPassword
                          }
                          onChange={(e) => {
                            setNewPassword(
                              e.target.value
                            );
                            setError("");
                          }}
                          placeholder="Enter new password"
                          className="mindease-input"
                          style={{
                            paddingRight:
                              "48px"
                          }}
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(
                              (prev) =>
                                !prev
                            )
                          }
                          className="password-toggle"
                        >

                          {showNewPassword ? (
                            <EyeOff
                              size={18}
                            />
                          ) : (
                            <Eye
                              size={18}
                            />
                          )}

                        </button>

                      </div>

                    </InputField>

                    <div
                      style={{
                        color:
                          theme.subtext,
                        fontSize:
                          "12px",
                        marginTop:
                          "-8px",
                        marginBottom:
                          "20px"
                      }}
                    >
                      Minimum 8 characters.
                    </div>

                    <PrimaryButton
                      loading={
                        isLoading
                      }
                      loadingText="Updating..."
                      text="Update Password"
                      icon={
                        <CheckCircle
                          size={18}
                        />
                      }
                      disabled={
                        newPassword.length <
                        8
                      }
                    />

                  </form>

                </motion.div>
              )}

            </AnimatePresence>

          </div>

        </div>

      </main>

      {/* ================= STYLES ================= */}

      <style>{`

        .mindease-input {
          width: 100%;
          height: 50px;
          padding: 0 15px;
          border-radius: 11px;
          border: 1px solid ${theme.border};
          background: ${theme.input};
          color: ${theme.text};
          outline: none;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .mindease-input::placeholder {
          color: ${theme.subtext};
        }

        .mindease-input:focus {
          border-color: ${theme.primary};

          box-shadow:
            0 0 0 3px
            rgba(124,58,237,0.12);
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform:
            translateY(-50%);
          border: none;
          background: transparent;
          color: ${theme.subtext};
          cursor: pointer;
          padding: 0;
          display: flex;
        }

        .password-toggle:hover {
          color: ${theme.primary};
        }

        .otp-input {
          text-align: center;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 10px;
          margin-bottom: 20px;
        }

        @media (max-width: 576px) {

          .otp-input {
            letter-spacing: 6px;
          }

        }

      `}</style>

    </div>
  );
};


// ======================================
// CARD HEADER
// ======================================

const CardHeader = ({
  icon,
  title,
  subtitle,
  theme
}) => {

  return (
    <div
      style={{
        marginBottom: "27px"
      }}
    >

      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "13px",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          background:
            "rgba(124,58,237,0.10)",

          color:
            theme.primary,

          marginBottom: "17px"
        }}
      >
        {icon}
      </div>

      <h2
        style={{
          fontSize: "27px",
          fontWeight: "800",
          letterSpacing: "-0.7px",
          marginBottom: "7px"
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: theme.subtext,
          fontSize: "13px",
          lineHeight: "1.6",
          margin: 0
        }}
      >
        {subtitle}
      </p>

    </div>
  );
};


// ======================================
// INPUT FIELD
// ======================================

const InputField = ({
  label,
  icon,
  theme,
  children
}) => {

  return (
    <div
      style={{
        marginBottom: "20px"
      }}
    >

      <label
        style={{
          display: "block",
          color: theme.subtext,
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          marginBottom: "7px"
        }}
      >
        {label}
      </label>

      <div
        style={{
          position: "relative"
        }}
      >

        {React.cloneElement(
          icon,
          {
            style: {
              position:
                "absolute",
              left: "14px",
              top: "50%",
              transform:
                "translateY(-50%)",
              color:
                theme.subtext,
              pointerEvents:
                "none",
              zIndex: 2
            }
          }
        )}

        <div
          style={{
            paddingLeft: "30px"
          }}
        >
          {children}
        </div>

      </div>

    </div>
  );
};


// ======================================
// PRIMARY BUTTON
// ======================================

const PrimaryButton = ({
  loading,
  loadingText,
  text,
  icon,
  disabled = false
}) => {

  return (
    <button
      type="submit"
      disabled={
        loading || disabled
      }
      style={{
        width: "100%",
        height: "52px",

        border: "none",
        borderRadius: "13px",

        background:
          "linear-gradient(135deg,#7c3aed,#6d28d9)",

        color: "#ffffff",

        fontSize: "14px",
        fontWeight: "750",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "9px",

        cursor:
          loading || disabled
            ? "not-allowed"
            : "pointer",

        opacity:
          loading || disabled
            ? 0.65
            : 1,

        boxShadow:
          "0 10px 25px rgba(124,58,237,0.22)"
      }}
    >

      {loading ? (
        <>
          <Loader2
            size={18}
            style={{
              animation:
                "mindeaseSpin 1s linear infinite"
            }}
          />

          {loadingText}
        </>
      ) : (
        <>
          {text}

          {icon && icon}
        </>
      )}

    </button>
  );
};


// ======================================
// BACK BUTTON
// ======================================

const BackButton = ({
  onClick,
  text,
  theme
}) => {

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        marginTop: "18px",
        border: "none",
        background: "transparent",
        color: theme.primary,
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer"
      }}
    >
      ← {text}
    </button>
  );
};


// ======================================
// DIVIDER
// ======================================

const Divider = ({
  theme
}) => {

  return (
    <div
      style={{
        height: "1px",
        background:
          theme.border,
        margin:
          "25px 0 20px"
      }}
    />
  );
};

export default Login;
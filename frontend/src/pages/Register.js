import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Moon,
  Sun
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [emailStatus, setEmailStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("mindease-theme");
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

  /*
   * If VerifyEmail redirects back to:
   *
   * /register?verified=true&email=user@gmail.com
   *
   * then mark the email as verified.
   */
  useEffect(() => {
    const verified =
      searchParams.get("verified");

    const verifiedEmail =
      searchParams.get("email");

    if (
      verified === "true" &&
      verifiedEmail
    ) {
      setFormData((prev) => ({
        ...prev,
        email: verifiedEmail
      }));

      setEmailStatus("verified");

      setMessage(
        "Your email has been verified. You can now create your account."
      );

      setMessageType("success");
    }
  }, [searchParams]);

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
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setMessage("");

    /*
     * Changing the email means the previous
     * verification no longer belongs to this email.
     */
    if (name === "email") {
      setEmailStatus("idle");
    }
  };

  // =========================
  // SEND VERIFICATION EMAIL
  // =========================

  const handleVerifyEmail = async () => {
    setMessage("");

    const name =
      formData.name.trim();

    const email =
      formData.email.trim().toLowerCase();

    const password =
      formData.password;

    const confirmPassword =
      formData.confirmPassword;

    // Name
    if (!name) {
      setMessage("Please enter your name first.");
      setMessageType("error");
      return;
    }

    if (name.length < 2) {
      setMessage(
        "Name should be at least 2 characters long."
      );
      setMessageType("error");
      return;
    }

    // Email
    if (!email) {
      setMessage(
        "Please enter your email address."
      );
      setMessageType("error");
      return;
    }

    if (!email.endsWith("@gmail.com")) {
      setMessage(
        "Only @gmail.com addresses are permitted."
      );
      setMessageType("error");
      return;
    }

    // Password
    if (password.length < 8) {
      setMessage(
        "Password must be at least 8 characters long."
      );
      setMessageType("error");
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setMessage(
        "Passwords do not match."
      );
      setMessageType("error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        /*
         * The backend has created the account
         * as unverified and sent the email.
         */
        setEmailStatus("verifying");

        setMessage(
          "Verification email sent. Check your inbox and click the verification link."
        );

        setMessageType("success");

        return;
      }

      setMessage(
        data.error ||
          "Unable to send verification email."
      );

      setMessageType("error");

    } catch (error) {
      console.error(
        "Verification error:",
        error
      );

      setMessage(
        "Unable to connect to the server. Please try again."
      );

      setMessageType("error");

    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // CREATE ACCOUNT
  // =========================

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");

    /*
     * User hasn't even clicked Verify.
     */
    if (emailStatus === "idle") {
      setMessage(
        "Please verify your email first."
      );

      setMessageType("error");
      return;
    }

    /*
     * Verification email was sent,
     * but user hasn't clicked it yet.
     */
    if (emailStatus === "verifying") {
      setMessage(
        "Please verify your email using the link sent to your inbox."
      );

      setMessageType("error");
      return;
    }

    /*
     * Only verified users can continue.
     */
    if (emailStatus !== "verified") {
      setMessage(
        "Please verify your email first."
      );

      setMessageType("error");
      return;
    }

    const email =
      formData.email.trim().toLowerCase();

    setIsLoading(true);

    try {
      /*
       * We DON'T call /api/register here.
       *
       * The account was already created when
       * Verify was clicked.
       *
       * The next backend endpoint will check
       * whether this email is verified.
       */

      const response = await fetch(
        `${API_URL}/api/check-email-verification?email=${encodeURIComponent(email)}`
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Please verify your email first."
        );

        setMessageType("error");
        return;
      }

      if (data.verified) {
        /*
         * Email is verified.
         * Go to login.
         */
        navigate("/login");
      } else {
        setMessage(
          "Please verify your email first."
        );

        setMessageType("error");
      }

    } catch (error) {
      console.error(
        "Account verification check error:",
        error
      );

      setMessage(
        "Unable to verify account status. Please try again."
      );

      setMessageType("error");

    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // UI
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
            onClick={() => navigate("/")}
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
          position: "relative",
          zIndex: 2,
          minHeight:
            "calc(100vh - 73px)",
          display: "flex",
          alignItems: "center",
          paddingTop: "45px",
          paddingBottom: "45px"
        }}
      >

        <div
          className="row w-100 align-items-center g-5"
        >

          {/* ================= LEFT ================= */}

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

              {/* Small label */}

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding:
                    "7px 12px",
                  borderRadius: "50px",
                  background:
                    theme.cardSecondary,
                  border:
                    `1px solid ${theme.border}`,
                  color: theme.accent,
                  fontSize: "12px",
                  fontWeight: "700",
                  marginBottom: "22px"
                }}
              >

                <Sparkles size={14} />

                YOUR WELLNESS SPACE

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

                A calmer mind
                <br />

                starts with
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
                  {" "}MindEase.
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
                Create your private MindEase account
                and begin a personalized journey toward
                better mental wellness.
              </p>

              {/* Features */}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px"
                }}
              >

                <Feature
                  icon={<ShieldCheck size={19} />}
                  title="Private & Secure"
                  description="Your conversations are protected."
                  theme={theme}
                />

                <Feature
                  icon={<Brain size={19} />}
                  title="AI-Powered Support"
                  description="Personalized conversations when you need them."
                  theme={theme}
                />

                <Feature
                  icon={<Sparkles size={19} />}
                  title="Built Around You"
                  description="A supportive space designed for your journey."
                  theme={theme}
                />

              </div>

            </motion.div>

          </div>

          {/* ================= RIGHT ================= */}

          <div
            className="col-lg-6 d-flex justify-content-center"
          >

            <motion.div
              initial={{
                opacity: 0,
                y: 25
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.6,
                delay: 0.1
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

              {/* Card heading */}

              <div
                style={{
                  marginBottom: "28px"
                }}
              >

                <h2
                  style={{
                    fontSize: "27px",
                    fontWeight: "800",
                    letterSpacing: "-0.7px",
                    marginBottom: "7px"
                  }}
                >
                  Create your account
                </h2>

                <p
                  style={{
                    color: theme.subtext,
                    fontSize: "14px",
                    margin: 0
                  }}
                >
                  Start your MindEase journey today.
                </p>

              </div>

              {/* Message */}

              <AnimatePresence>
                {message && (
                  <motion.div
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
                      gap: "10px",
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      marginBottom: "20px",
                      background:
                        messageType === "success"
                          ? "rgba(16,185,129,0.10)"
                          : "rgba(239,68,68,0.10)",
                      border:
                        `1px solid ${
                          messageType === "success"
                            ? "rgba(16,185,129,0.25)"
                            : "rgba(239,68,68,0.25)"
                        }`,
                      color:
                        messageType === "success"
                          ? theme.success
                          : theme.error,
                      fontSize: "13px",
                      lineHeight: "1.5"
                    }}
                  >

                    {messageType === "success" ? (
                      <CheckCircle
                        size={17}
                        style={{
                          flexShrink: 0,
                          marginTop: "1px"
                        }}
                      />
                    ) : (
                      <AlertCircle
                        size={17}
                        style={{
                          flexShrink: 0,
                          marginTop: "1px"
                        }}
                      />
                    )}

                    <span>{message}</span>

                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={handleRegister}
              >

                {/* NAME */}

                <FormField
                  label="Full name"
                  icon={<User size={18} />}
                  theme={theme}
                >

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="mindease-input"
                    required
                  />

                </FormField>

                {/* EMAIL */}

                <FormField
                  label="Email address"
                  icon={<Mail size={18} />}
                  theme={theme}
                >

                  <div
                    style={{
                      position: "relative"
                    }}
                  >

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@gmail.com"
                      className="mindease-input"
                      disabled={
                        emailStatus === "verified"
                      }
                      required
                      style={{
                        paddingRight:
                          "100px"
                      }}
                    />

                    {emailStatus === "idle" && (
                      <button
                        type="button"
                        onClick={
                          handleVerifyEmail
                        }
                        disabled={isLoading}
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          border: "none",
                          borderRadius: "8px",
                          padding:
                            "7px 12px",
                          background:
                            theme.primary,
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: isLoading
                            ? "not-allowed"
                            : "pointer",
                          opacity: isLoading
                            ? 0.6
                            : 1
                        }}
                      >
                        Verify
                      </button>
                    )}

                    {emailStatus === "verifying" && (
                      <div
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          padding:
                            "7px 11px",
                          borderRadius: "8px",
                          background:
                            "rgba(245,158,11,0.15)",
                          color:
                            theme.warning,
                          fontSize: "12px",
                          fontWeight: "700"
                        }}
                      >
                        Pending
                      </div>
                    )}

                    {emailStatus === "verified" && (
                      <div
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding:
                            "7px 10px",
                          borderRadius: "8px",
                          background:
                            "rgba(16,185,129,0.14)",
                          color:
                            theme.success,
                          fontSize: "12px",
                          fontWeight: "700"
                        }}
                      >

                        <CheckCircle
                          size={14}
                        />

                        Verified

                      </div>
                    )}

                  </div>

                  <div
                    style={{
                      marginTop: "7px",
                      color: theme.subtext,
                      fontSize: "11px"
                    }}
                  >
                    Verification link expires in
                    15 minutes.
                  </div>

                </FormField>

                {/* PASSWORD */}

                <FormField
                  label="Password"
                  icon={<Lock size={18} />}
                  theme={theme}
                >

                  <div
                    style={{
                      position: "relative"
                    }}
                  >

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className="mindease-input"
                      required
                      style={{
                        paddingRight: "48px"
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",
                        border: "none",
                        background:
                          "transparent",
                        color:
                          theme.subtext,
                        cursor: "pointer"
                      }}
                    >

                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>

                  <div
                    style={{
                      marginTop: "7px",
                      color: theme.subtext,
                      fontSize: "11px"
                    }}
                  >
                    Use at least 8 characters.
                  </div>

                </FormField>

                {/* CONFIRM PASSWORD */}

                <FormField
                  label="Confirm password"
                  icon={<Lock size={18} />}
                  theme={theme}
                >

                  <div
                    style={{
                      position: "relative"
                    }}
                  >

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={
                        formData.confirmPassword
                      }
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      className="mindease-input"
                      required
                      style={{
                        paddingRight: "48px"
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",
                        border: "none",
                        background:
                          "transparent",
                        color:
                          theme.subtext,
                        cursor: "pointer"
                      }}
                    >

                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>

                </FormField>

                {/* CREATE ACCOUNT */}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: "13px",
                    padding: "14px",
                    marginTop: "5px",
                    background:
                      "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: "750",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "9px",
                    cursor: isLoading
                      ? "not-allowed"
                      : "pointer",
                    opacity: isLoading
                      ? 0.7
                      : 1,
                    boxShadow:
                      "0 10px 25px rgba(124,58,237,0.22)"
                  }}
                >

                  {isLoading
                    ? "Checking..."
                    : "Create Account"}

                  {!isLoading && (
                    <ArrowRight
                      size={18}
                    />
                  )}

                </button>

              </form>

              {/* LOGIN */}

              <div
                style={{
                  textAlign: "center",
                  marginTop: "22px",
                  paddingTop: "20px",
                  borderTop:
                    `1px solid ${theme.border}`,
                  color: theme.subtext,
                  fontSize: "13px"
                }}
              >

                Already have an account?{" "}

                <button
                  type="button"
                  onClick={() =>
                    navigate("/login")
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: theme.primary,
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Sign in
                </button>

              </div>

            </motion.div>

          </div>

        </div>

      </main>

      {/* GLOBAL INPUT STYLES */}

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
            0 0 0 3px rgba(124,58,237,0.12);
        }

        .mindease-input:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        @media (max-width: 576px) {

          .mindease-input {
            height: 48px;
          }

        }

      `}</style>

    </div>
  );
};


// =========================
// FORM FIELD COMPONENT
// =========================

const FormField = ({
  label,
  icon,
  theme,
  children
}) => {

  return (
    <div
      style={{
        marginBottom: "19px"
      }}
    >

      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: "700",
          color: theme.subtext,
          marginBottom: "7px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
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
              position: "absolute",
              left: "14px",
              top: "50%",
              transform:
                "translateY(-50%)",
              color: theme.subtext,
              pointerEvents: "none",
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


// =========================
// FEATURE COMPONENT
// =========================

const Feature = ({
  icon,
  title,
  description,
  theme
}) => {

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px"
      }}
    >

      <div
        style={{
          width: "40px",
          height: "40px",
          minWidth: "40px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "rgba(124,58,237,0.10)",
          color: theme.primary
        }}
      >
        {icon}
      </div>

      <div>

        <div
          style={{
            fontSize: "14px",
            fontWeight: "700",
            marginBottom: "2px"
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "12px",
            color: theme.subtext
          }}
        >
          {description}
        </div>

      </div>

    </div>
  );
};

export default Register;
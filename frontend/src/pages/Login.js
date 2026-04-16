import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sun, Moon, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, CheckCircle } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("signin"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("mindease-theme");
    return savedTheme ? JSON.parse(savedTheme) : true;
  });

  useEffect(() => {
    localStorage.setItem("mindease-theme", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const theme = {
    bg: isDarkMode ? "#05020a" : "#fdfaff",
    text: isDarkMode ? "#ffffff" : "#2e1065",
    subtext: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "#5b21b6",
    primary: "#7c3aed",
    accent: "#b2d8d0",
    card: isDarkMode ? "rgba(124, 58, 237, 0.05)" : "#ffffff",
    border: isDarkMode ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.1)",
    input: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(124, 58, 237, 0.03)"
  };

  // --- 1. REQUEST OTP FROM BACKEND ---
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("Sending secure code...");

    try {
      const response = await fetch('http://localhost:3001/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Verification code sent to your email.");
        setView("otp");
      } else {
        setError(data.error || "Failed to send OTP.");
        setMessage("");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  // --- 2. VERIFY OTP AGAINST BACKEND ---
  const handleVerifyOTP = async (e) => {
  e.preventDefault();
  setError("");
  try {
    const response = await fetch('http://localhost:3001/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    if (response.ok) {
      setMessage(""); 
      setView("reset"); 
      setError("");
    } else {
      const data = await response.json();
      setError(data.error || "Invalid verification code.");
    }
  } catch (err) {
    setError("Network error. Try again.");
  }
};

const handleResetPassword = async (e) => {
  e.preventDefault();
  setError("");
  try {
    const response = await fetch('http://localhost:3001/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await response.json();
    if (response.ok) {
      // 1. Set the success message first
      setMessage("Password changed successfully.");
      
      // 2. Wait 2 seconds so the user can actually read it on the RESET screen
      setTimeout(() => {
        setView("signin"); // Move to login screen
        setNewPassword(""); // Clear the field
        // Note: Do NOT clear the message yet, so it shows on the Sign-In screen too
      }, 2000);

      // 3. Optional: Clear the green message after 5 seconds total
      setTimeout(() => setMessage(""), 5000);
      
    } else {
      setError(data.error);
    }
  } catch (err) {
    setError("Could not update password. Check your connection.");
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  try {
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success || response.ok) {
      // SUCCESS LOGIN NOTIFICATION
      setMessage("Login Successful.");
      localStorage.setItem("token", data.token);
      
      // ADDED: Enhanced localStorage verification
      try {
        localStorage.setItem("user", JSON.stringify({ 
          name: data.name, 
          email: data.email,
          userId: data.userId || data.id  // Use unique user ID
        }));
        
        // ADDED: Verify user data was saved
        const savedUser = JSON.parse(localStorage.getItem("user"));
        console.log('User data saved to localStorage:', savedUser);
        
        if (!savedUser || !savedUser.email) {
          console.error('❌ User data not saved properly!');
          setError("Login data could not be saved. Please try again.");
          return;
        }
        
        // Initialize user-specific sessions storage
        const userSessionsKey = `mindease-sessions-${data.email}`;
        const existingSessions = JSON.parse(localStorage.getItem(userSessionsKey)) || [];
        
        // Create a new session for logged-in user
        const newSessionId = Date.now();
        const newSession = {
          id: newSessionId,
          title: "Welcome Chat",
          messages: [],
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        // Add new session to existing sessions
        const updatedSessions = [newSession, ...existingSessions];
        localStorage.setItem(userSessionsKey, JSON.stringify(updatedSessions));
        console.log('User sessions initialized with new session:', updatedSessions);
        console.log('New session created:', newSession);
        console.log('Session key used:', userSessionsKey);
        
        // ADDED: Verify session storage
        const verifySession = JSON.parse(localStorage.getItem(userSessionsKey));
        console.log('Session storage verification:', verifySession);
        console.log('Session storage length:', verifySession?.length || 0);
        
      } catch (storageError) {
        console.error('❌ localStorage error:', storageError);
        setError("Browser storage error. Please try again.");
        return;
      }
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500); // Small delay so user sees the success message
    } else {
      setError(data.error || "Login failed");
    }
  } catch (err) {
    setError("Backend not reachable.");
  }
};

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <style>{`
        .dynamic-brand { background: linear-gradient(90deg, #b2d8d0, #7c3aed, #b2d8d0); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradientFlow 4s linear infinite; cursor: pointer; }
        @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .glass-input { background: ${theme.input}; border: 1px solid ${theme.border}; color: ${theme.text}; padding: 12px 15px 12px 45px; border-radius: 12px; width: 100%; outline: none; transition: 0.3s; }
        .glass-input:focus { border-color: ${theme.primary}; box-shadow: 0 0 15px rgba(124,58,237,0.2); }
        .input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: ${theme.primary}; opacity: 0.7; }
      `}</style>

      {/* Navbar */}
      <nav className="navbar fixed-top px-4 py-3" style={{ backdropFilter: "blur(10px)", zIndex: 100 }}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2" onClick={() => navigate("/")} style={{cursor:'pointer'}}>
            <Brain size={30} color={theme.primary} />
            <span className="fw-bold fs-4 dynamic-brand">MindEase</span>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn p-0 border-0" style={{ color: theme.text }}>
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>
      </nav>

      <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <AnimatePresence mode="wait">
          {/* --- SIGN IN VIEW --- */}
          {view === "signin" && (
            <motion.div key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="p-5 rounded-5 border shadow-lg w-100" style={{ maxWidth: '420px', backgroundColor: theme.card, borderColor: theme.border, backdropFilter: "blur(20px)" }}>
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">Welcome Back</h2>
                <p className="small" style={{ color: theme.subtext }}>Log in to your MindEase Dashboard</p>
              </div>
              {error && <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3"><AlertCircle size={14} /> {error}</div>}
              {message && <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3"><CheckCircle size={14} /> {message}</div>}
              <form onSubmit={handleLogin}>
                <div className="mb-3 position-relative"><Mail className="input-icon" size={18} /><input type="email" placeholder="Email Address" required className="glass-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="mb-2 position-relative"><Lock className="input-icon" size={18} /><input type="password" placeholder="Password" required className="glass-input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <div className="text-end mb-4"><span onClick={() => setView("forgot")} style={{ color: theme.primary, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>Forgot Password?</span></div>
                <button type="submit" className="btn btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 mb-4 shadow-sm" style={{ backgroundColor: theme.primary, color: "#ffffff", borderRadius: "14px", border: 'none' }}>Sign In <ArrowRight size={20} /></button>
                <p className="text-center small mb-0" style={{ color: theme.subtext }}>Don't have an account? <span onClick={() => navigate("/register")} style={{ color: theme.primary, cursor: "pointer", fontWeight: "700" }}>Sign Up</span></p>
              </form>
            </motion.div>
          )}

          {/* --- FORGOT PASSWORD --- */}
          {view === "forgot" && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-5 rounded-5 border shadow-lg w-100" style={{ maxWidth: '420px', backgroundColor: theme.card, borderColor: theme.border, backdropFilter: "blur(20px)" }}>
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">Recovery</h2>
                <p className="small" style={{ color: theme.subtext }}>Enter your email to receive a reset code</p>
              </div>
              {error && <div className="alert alert-danger py-2 px-3 small mb-3">{error}</div>}
              {message && <div className="alert alert-success py-2 px-3 small mb-3">{message}</div>}
              <form onSubmit={handleRequestOTP}>
                <div className="mb-4 position-relative"><Mail className="input-icon" size={18} /><input type="email" placeholder="Email Address" required className="glass-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <button type="submit" className="btn btn-lg w-100 py-3 fw-bold mb-4" style={{ backgroundColor: theme.primary, color: "#ffffff", borderRadius: "14px", border: 'none' }}>Send Reset Code</button>
                <p className="text-center small mb-0"><span onClick={() => setView("signin")} style={{ color: theme.primary, cursor: "pointer", fontWeight: "700" }}>Back to Login</span></p>
              </form>
            </motion.div>
          )}

          {/* --- OTP VERIFICATION --- */}
          {view === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-5 border shadow-lg w-100" style={{ maxWidth: '420px', backgroundColor: theme.card, borderColor: theme.border }}>
              <div className="text-center mb-4"><ShieldCheck size={50} color={theme.primary} className="mb-2"/><h2 className="fw-bold">Verify Code</h2><p className="small" style={{ color: theme.subtext }}>Enter the code sent to your email</p></div>
              {error && <div className="alert alert-danger small mb-3">{error}</div>}
              <form onSubmit={handleVerifyOTP}>
                <input type="text" placeholder="------" maxLength="6" required className="glass-input text-center fs-4 mb-4" style={{ letterSpacing: '8px' }} value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button type="submit" className="btn btn-lg w-100 py-3 fw-bold mb-3" style={{ backgroundColor: theme.primary, color: "#ffffff", borderRadius: "14px", border: 'none' }}>Verify Code</button>
              </form>
            </motion.div>
          )}

          {/* --- RESET PASSWORD --- */}
          {view === "reset" && (
            <motion.div key="reset" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-5 border shadow-lg w-100" style={{ maxWidth: '420px', backgroundColor: theme.card, borderColor: theme.border }}>
              <div className="text-center mb-4"><h2 className="fw-bold">Reset Password</h2><p className="small" style={{ color: theme.subtext }}>Create a secure new password</p></div>
              {error && <div className="alert alert-danger small mb-3">{error}</div>}
              {message && <div className="alert alert-success small mb-3">{message}</div>}
              <form onSubmit={handleResetPassword}>
                <div className="mb-4 position-relative"><Lock className="input-icon" size={18} /><input type="password" placeholder="New Password" required className="glass-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                <button type="submit" className="btn btn-lg w-100 py-3 fw-bold" style={{ backgroundColor: theme.primary, color: "#ffffff", borderRadius: "14px", border: 'none' }}>Update Password</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Login;
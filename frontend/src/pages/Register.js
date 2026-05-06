import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Sun, Moon, User, Mail, Lock, ArrowRight, AlertCircle, Shield } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  
  // Theme Persistence
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Rule: Only @gmail.com addresses allowed
    if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
      setError("Only @gmail.com addresses are permitted.");
      return;
    }

    // 2. Rule: Password must be at least 8 characters
    if (formData.password.length < 8) {
      setError("Password must be at least 8 digits long.");
      return;
    }

    // 3. Rule: Passwords must match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Call backend API
    try {
      setError("");
      console.log("Attempting to register...");
      console.log("API URL: http://localhost:3001/api/register");
      console.log("Form data:", { name: formData.name, email: formData.email, password: "***" });
      
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password })
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok) {
        alert("Account created successfully!");
        navigate("/login");
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div style={{ 
      backgroundColor: theme.bg, color: theme.text, minHeight: "100vh", 
      transition: "all 0.5s ease", fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative", overflow: "hidden"
    }}>
      
      <style>{`
        @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .dynamic-brand { background: linear-gradient(90deg, #b2d8d0, #7c3aed, #b2d8d0); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradientFlow 4s linear infinite; cursor: pointer; }
        .bubble { position: absolute; border-radius: 50%; filter: blur(80px); opacity: ${isDarkMode ? 0.1 : 0.05}; pointer-events: none; z-index: 0; }
        .glass-input { background: ${theme.input}; border: 1px solid ${theme.border}; color: ${theme.text}; padding: 12px 15px 12px 45px; border-radius: 12px; width: 100%; transition: 0.3s; outline: none; }
        .glass-input:focus { border-color: ${theme.primary}; box-shadow: 0 0 15px rgba(124, 58, 237, 0.2); }
        .input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: ${theme.primary}; opacity: 0.7; }
      `}</style>

      {/* Floating Background Orbs */}
      <div className="bubble" style={{ width: '400px', height: '400px', background: theme.primary, top: '-10%', left: '-5%' }} />
      <div className="bubble" style={{ width: '300px', height: '300px', background: theme.accent, bottom: '5%', right: '-5%' }} />

      {/* HEADER */}
      <nav className="navbar fixed-top px-4 py-3" style={{ backdropFilter: "blur(10px)", zIndex: 100 }}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2" onClick={() => navigate("/")}>
            <Brain size={30} color={theme.primary} />
            <span className="fw-bold fs-4 dynamic-brand">MindEase</span>
          </div>
          <div className="d-flex align-items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn p-0 border-0" style={{ color: theme.text }}>
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* REGISTER FORM */}
      <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 rounded-5 border shadow-lg" style={{ maxWidth: '450px', width: '100%', backgroundColor: theme.card, borderColor: theme.border, backdropFilter: "blur(20px)" }}>
          
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">Create Account</h2>
            <p className="small opacity-75" style={{ color: theme.subtext }}>Secure your mental wellness journey</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-3 p-2 rounded d-flex align-items-center gap-2" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "12px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister}>
            <div className="mb-3 position-relative">
              <User className="input-icon" size={18} />
              <input type="text" placeholder="Full Name" required className="glass-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="mb-3 position-relative">
              <Mail className="input-icon" size={18} />
              <input type="email" placeholder="Email" required className="glass-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="mb-3 position-relative">
              <Lock className="input-icon" size={18} />
              <input type="password" placeholder="Password" required className="glass-input" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>

            <div className="mb-4 position-relative">
              <Lock className="input-icon" size={18} />
              <input type="password" placeholder="Confirm Password" required className="glass-input" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>

            <button type="submit" className="btn btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3 shadow-lg" style={{ backgroundColor: theme.primary, color: "#ffffff", borderRadius: "15px", border: 'none' }}>
              Create Account <ArrowRight size={20} />
            </button>

            <p className="text-center small mb-0" style={{ color: theme.subtext }}>
              Already have an account? <span onClick={() => navigate("/login")} style={{ color: theme.primary, cursor: "pointer", fontWeight: "700" }}>Sign In</span>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
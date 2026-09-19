import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Ensure you have react-router-dom installed
import { motion } from "framer-motion";
import { Brain, ArrowRight, Sparkles, Sun, Moon, Heart, Search, Shield } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const Landing = () => {
  const navigate = useNavigate();
  const [mood, setMood] = useState(50);
  
  // 1. Initialize state from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("mindease-theme");
    return savedTheme ? JSON.parse(savedTheme) : true;
  });

  // 2. Update localStorage whenever the theme changes
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
    border: isDarkMode ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
  };

  return (
    <div style={{ 
      backgroundColor: theme.bg, 
      color: theme.text, 
      minHeight: "100vh", 
      transition: "background-color 0.5s ease, color 0.5s ease",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative",
      overflowX: "hidden"
    }}>
      
      {/* 🛠️ Dynamic Animations & Bubble Styles */}
      <style>{`
        @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .dynamic-brand { background: linear-gradient(90deg, #b2d8d0, #7c3aed, #b2d8d0); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradientFlow 4s linear infinite; }
        
        @keyframes float { 0% { transform: translate(0, 0); } 50% { transform: translate(40px, -40px); } 100% { transform: translate(0, 0); } }
        .bubble { position: absolute; border-radius: 50%; filter: blur(80px); opacity: ${isDarkMode ? 0.1 : 0.05}; animation: float 15s infinite ease-in-out; pointer-events: none; z-index: 0; }
        
        .form-range::-webkit-slider-thumb { background: #7c3aed; margin-top: -6px; border: 2px solid white; box-shadow: 0 0 15px rgba(124,58,237,0.4); cursor: pointer; }
        .form-range::-webkit-slider-runnable-track { background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.1)'}; height: 8px; border-radius: 10px; }
      `}</style>

      {/* --- FLOATING BUBBLES --- */}
      <div className="bubble" style={{ width: '450px', height: '450px', background: theme.primary, top: '5%', left: '-5%' }} />
      <div className="bubble" style={{ width: '350px', height: '350px', background: theme.accent, top: '40%', right: '-10%', animationDelay: '2s' }} />
      <div className="bubble" style={{ width: '300px', height: '300px', background: '#ec4899', bottom: '10%', left: '10%', animationDelay: '4s' }} />

      {/* Navbar */}
    <nav className="navbar fixed-top px-4 py-3" style={{ backdropFilter: "blur(10px)", zIndex: 100 }}>
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>
          <Brain size={30} color={theme.primary} />
          <span className="fw-bold fs-4 dynamic-brand">MindEase</span>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn p-0 border-0 me-2" style={{ color: theme.text }}>
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          
          {/* Updated Register Button */}
          <button 
            className="btn fw-bold px-4 py-2" 
            onClick={() => navigate("/register")} // This matches the path in App.js
            style={{ 
              border: `1px solid ${theme.primary}`, 
              color: theme.primary, 
              borderRadius: "12px", 
              backgroundColor: 'transparent' 
            }}
          >
            Register
          </button>

          {/* Updated Sign In Button */}
          <button 
            className="btn fw-bold px-4 py-2 shadow-sm me-2" 
            onClick={() => navigate("/login")} // This matches the path in App.js
            style={{ 
              backgroundColor: theme.primary, 
              borderRadius: "12px", 
              color: "#ffffff", 
              border: 'none' 
            }}
          >
            Sign In
          </button>

          {/* Admin Button */}
          <button 
            className="btn fw-bold px-4 py-2 shadow-sm" 
            onClick={() => navigate("/admin/login")} 
            style={{ 
              backgroundColor: "rgba(124, 58, 237, 0.1)",
              borderRadius: "12px", 
              color: theme.text, 
              border: `1px solid ${theme.border}`,
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(124, 58, 237, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(124, 58, 237, 0.1)";
            }}
          >
            <Shield size={16} />
            <span className="ms-2">Admin</span>
          </button>
        </div>
      </div>
    </nav>

      {/* --- HERO & SLIDER --- */}
      <header className="container text-center" style={{ paddingTop: '150px', paddingBottom: '50px', position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="mb-4 d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill border" style={{ background: "rgba(124, 58, 237, 0.05)", fontSize: "12px", color: theme.primary, borderColor: theme.border }}>
            <Sparkles size={14} /> AI-Powered Emotional Intelligence
          </div>
          <h1 className="fw-bold mb-4" style={{ fontSize: "clamp(3.5rem, 8vw, 7rem)", letterSpacing: "-4px", lineHeight: "1" }}>
            Find <span style={{ color: theme.accent }}>Peace</span> <br /> 
            <span style={{ color: isDarkMode ? '#fff' : theme.text }}>of Mind</span>
          </h1>
          <p className="opacity-75 fs-5 mx-auto mb-5" style={{ maxWidth: "650px", color: theme.subtext }}>
            Experience a new way of emotional support. Our AI companion is here to listen, understand, and guide you through life's journey.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="p-5 rounded-5 border mx-auto shadow-lg text-center mt-4" 
          style={{ maxWidth: '600px', backgroundColor: theme.card, borderColor: theme.border, backdropFilter: "blur(20px)" }}
        >
          <p className="mb-5 fw-bold" style={{ color: theme.subtext }}>Whatever you're feeling, we're here to listen</p>
          <div className="d-flex justify-content-between mb-4">
            {['😔', '😐', '😌', '😊', '✨'].map((emoji, i) => (
              <div key={i} className="text-center">
                <span style={{ 
                  fontSize: "3rem", display: "block", transition: '0.4s', 
                  opacity: Math.abs((i * 25) - mood) < 15 ? 1 : 0.2, 
                  filter: Math.abs((i * 25) - mood) < 15 ? "none" : "grayscale(100%)" 
                }}>{emoji}</span>
                <small style={{ fontSize: "11px", color: theme.primary, fontWeight: 700, display: 'block', opacity: Math.abs((i * 25) - mood) < 15 ? 1 : 0 }}>
                    {['Down','Content','Peaceful','Happy','Excited'][i]}
                </small>
              </div>
            ))}
          </div>
          <input type="range" className="form-range mb-4" min="0" max="100" value={mood} onChange={(e) => setMood(e.target.value)} style={{ accentColor: theme.primary }} />
          <button className="btn btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 mt-2" 
                  onClick={() => navigate("/register")}
                  style={{ backgroundColor: theme.primary, color: "#ffffff", borderRadius: "16px", border: 'none' }}>
            Begin Your Journey <ArrowRight size={22} />
          </button>
        </motion.div>
      </header>

      {/* --- FEATURE CARDS --- */}
      <section className="container py-5" style={{ paddingBottom: '100px', position: "relative", zIndex: 1 }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-3">How MindEase Helps You</h2>
          <p className="opacity-50 fw-bold" style={{color: theme.subtext}}>Expert emotional support, powered by empathetic AI</p>
        </div>
        
        <div className="row g-4 justify-content-center">
          {[
            { icon: <Heart size={28}/>, title: "24/7 Support", text: "Always here to listen and support you, any time of day." },
            { icon: <Search size={28}/>, title: "Smart Insights", text: "Personalized guidance powered by emotional intelligence." },
            { icon: <Shield size={28}/>, title: "Private & Secure", text: "Your conversations are always confidential and encrypted." }
          ].map((card, i) => (
            <div key={i} className="col-md-4">
              <motion.div 
                className="p-5 h-100 rounded-4 border shadow-sm" 
                style={{ backgroundColor: theme.card, borderColor: theme.border, cursor: 'pointer' }}
                whileHover={{ 
                  y: -15, 
                  backgroundColor: isDarkMode ? "rgba(124, 58, 237, 0.1)" : "rgba(124, 58, 237, 0.03)",
                  boxShadow: `0 20px 40px ${isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(124, 58, 237, 0.1)'}` 
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="mb-4" style={{ color: theme.primary }}>{card.icon}</div>
                <h5 className="fw-bold mb-3">{card.title}</h5>
                <p className="small opacity-75 m-0 lh-base" style={{ color: theme.subtext }}>{card.text}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      <footer className="w-100 py-4 text-center mt-auto" style={{ borderTop: `1px solid ${theme.border}`, opacity: 0.5, fontSize: '12px', fontWeight: 600 }}>
        © 2026 MindEase AI | Built for Human Connection | All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
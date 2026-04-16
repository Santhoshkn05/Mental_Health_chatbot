import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, Trash2, Mail } from "lucide-react";
import { deleteAccount, getCurrentUser } from "../utils/auth";

const ProfilePopup = ({ show, onClose, theme, navigate }) => {
  const user = getCurrentUser();
  const popupRef = useRef(null);
  
  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ This will permanently delete your account and all chat history. This action cannot be undone.")) {
      const success = await deleteAccount();
      if (success) {
        alert("✅ Account deleted successfully.");
        navigate("/");
      } else {
        alert("❌ Failed to delete account. Please try again.");
      }
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.9, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="rounded-4 p-0 shadow-lg position-absolute"
          style={{ 
            backgroundColor: theme.card, 
            border: `1px solid ${theme.border}`,
            width: '320px',
            maxWidth: '90vw',
            top: '60px',
            right: '10px',
            transform: 'translateY(0)',
            zIndex: 3000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{ borderColor: theme.border }}>
            <h4 className="fw-bold mb-0" style={{ color: theme.text }}>Profile</h4>
            <button 
              className="btn p-1 border-0 rounded-circle"
              onClick={onClose}
              style={{ color: theme.subtext }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Profile Info */}
            <div className="text-center mb-4">
              <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '80px', height: '80px' }}>
                <User size={32} color={theme.primary} />
              </div>
              <h5 className="fw-bold mb-1" style={{ color: theme.text }}>{user?.name || 'User'}</h5>
              <p className="small mb-0 opacity-75" style={{ color: theme.subtext }}>{user?.email || 'user@example.com'}</p>
            </div>
            
            {/* Email */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <Mail size={16} color={theme.subtext} />
                <span className="small fw-medium" style={{ color: theme.text }}>Email</span>
              </div>
              <p className="small mb-0" style={{ color: theme.subtext }}>{user?.email || 'user@example.com'}</p>
            </div>

            {/* Action */}
            <div className="d-grid gap-2">
              <button 
                className="btn btn-outline-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={handleDeleteAccount}
              >
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePopup;
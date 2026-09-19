import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const verificationStarted = useRef(false);

  useEffect(() => {
    // React Strict Mode deliberately re-runs effects in development. A
    // verification token is single-use, so a second request would correctly
    // receive 400 after the first request has already verified the account.
    if (verificationStarted.current) {
      return;
    }
    verificationStarted.current = true;

    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      const verificationRequestKey = `mindease-verification-requested:${token}`;
      if (sessionStorage.getItem(verificationRequestKey)) {
        return;
      }
      sessionStorage.setItem(verificationRequestKey, "true");

      try {
        console.log("[DEBUG] Sending verification request to backend");

        const response = await fetch(
          `${API_URL}/api/verify-email?token=${encodeURIComponent(token)}`
        );

        const data = await response.json();

        console.log("[DEBUG] Verification response:", data);

        if (response.ok) {
          setStatus("success");
          setMessage(
            "Your email has been verified successfully. You can now login."
          );
        } else {
          setStatus("error");
          setMessage(
            data.error || "Unable to verify your email."
          );
        }
      } catch (error) {
        console.error("[DEBUG] Email verification error:", error);

        setStatus("error");
        setMessage(
          "Unable to connect to the server. Please try again."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0514",
        color: "#ffffff",
        fontFamily: "'Inter', sans-serif",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "40px",
          borderRadius: "20px",
          textAlign: "center",
          background: "rgba(30, 27, 75, 0.4)",
          border: "1px solid rgba(124, 58, 237, 0.2)"
        }}
      >

        {status === "verifying" && (
          <>
            <Loader2
              size={50}
              className="spin-icon"
              style={{ color: "#7c3aed" }}
            />

            <h2 style={{ marginTop: "20px" }}>
              Verifying your email...
            </h2>

            <p style={{ color: "rgba(255,255,255,0.6)" }}>
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle
              size={60}
              style={{ color: "#10b981" }}
            />

            <h2 style={{ marginTop: "20px" }}>
              Email Verified
            </h2>

            <p style={{ color: "rgba(255,255,255,0.6)" }}>
              {message}
            </p>

            <button
              onClick={() => navigate("/login")}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                border: "none",
                borderRadius: "10px",
                background: "#7c3aed",
                color: "#ffffff",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle
              size={60}
              style={{ color: "#ef4444" }}
            />

            <h2 style={{ marginTop: "20px" }}>
              Verification Failed
            </h2>

            <p style={{ color: "rgba(255,255,255,0.6)" }}>
              {message}
            </p>

            <button
              onClick={() => navigate("/register")}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                border: "none",
                borderRadius: "10px",
                background: "#7c3aed",
                color: "#ffffff",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Back to Register
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;

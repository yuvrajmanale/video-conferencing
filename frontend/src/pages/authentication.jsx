
import React, { useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { Alert, CircularProgress } from "@mui/material";

export default function Authentication() {
  const router = useNavigate();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0 = Login, 1 = Signup
  const [loading, setLoading] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (formState === 0) {
        // Login
        let result = await handleLogin(username, password);
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          router("/home");
        }, 1000);
      } else {
        // Signup
        let result = await handleRegister(name, username, password);
        setMessage(result);
        setUsername("");
        setPassword("");
        setName("");
        setFormState(0);
      }
    } catch (err) {
      let message = err.response?.data?.message || "Error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-panel">
        <div className="auth-image-content">
          <h2>Welcome Back</h2>
          <p>Connect with anyone, anywhere, anytime. Premium video conferencing made simple.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <h1>{formState === 0 ? "Sign In" : "Create Account"}</h1>
              <p>{formState === 0 ? "Welcome back!" : "Join our community"}</p>
            </div>

            {message && <div className="auth-success-message">{message}</div>}

            <div className="auth-tabs">
              <button
                className={`auth-tab ${formState === 0 ? "active" : ""}`}
                onClick={() => {
                  setFormState(0);
                  setError("");
                  setMessage("");
                }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${formState === 1 ? "active" : ""}`}
                onClick={() => {
                  setFormState(1);
                  setError("");
                  setMessage("");
                }}
              >
                Sign Up
              </button>
            </div>

            <div>
              {formState === 1 && (
                <div className="auth-form-group">
                  <label className="auth-label">Full Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="auth-form-group">
                <label className="auth-label">Username</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                className="auth-button-primary"
                onClick={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : formState === 0 ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

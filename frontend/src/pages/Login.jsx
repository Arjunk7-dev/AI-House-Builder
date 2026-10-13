
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    // Demo-only login; replace with backend authentication.
    localStorage.setItem(
      "ai_builder_user",
      JSON.stringify({ email: email.trim() })
    );

    nav("/dashboard");
  }

  return (
    <Auth
      title="Welcome Back"
      subtitle="Sign in to your AI House Builder workspace"
    >
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field">
          <span>Email address</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-submit" type="submit">
          Sign In <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="auth-footer">
        New here? <Link to="/register">Create account</Link>
      </p>
    </Auth>
  );
}

export function Auth({ title, subtitle, children }) {
  return (
    <main className="auth">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">⌂</span>
          <span>AI HOUSE BUILDER</span>
        </Link>

        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        {children}
      </section>
    </main>
  );
}

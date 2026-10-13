

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Auth } from "./Login";


export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Demo-only registration using localStorage.
    const users = JSON.parse(
      localStorage.getItem("ai_builder_users") || "[]"
    );

    const alreadyExists = users.some(
      (user) => user.email === cleanEmail
    );

    if (alreadyExists) {
      setError("An account with this email already exists.");
      return;
    }

    users.push({
      name: cleanName,
      email: cleanEmail,
      password: password,
    });

    localStorage.setItem("ai_builder_users", JSON.stringify(users));

    // Save the current user for the dashboard.
    localStorage.setItem(
      "ai_builder_user",
      JSON.stringify({ name: cleanName, email: cleanEmail })
    );

    nav("/dashboard");
  }

  return (
    <Auth
      title="Create Your Account"
      subtitle="Start designing intelligent floor plans"
    >
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field">
          <span>Full name</span>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>

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
            placeholder="Create a password (minimum 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-submit" type="submit">
          Create Account <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/">Sign In</Link>
      </p>
    </Auth>
  );
}

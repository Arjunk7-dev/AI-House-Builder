
import React from "react";
import { Link, useNavigate } from "react-router-dom";

const features = [
  {
    icon: "✦",
    title: "AI Planning",
    description:
      "Gemini converts natural language into a structured room plan.",
    tag: "AI POWERED",
  },
  {
    icon: "⌗",
    title: "2D Floor Plan",
    description:
      "Explore room dimensions, layout, doors and windows.",
    tag: "INTERACTIVE",
  },
  {
    icon: "◇",
    title: "3D Preview",
    description:
      "Explore your house concept in an interactive 3D view.",
    tag: "3D DESIGN",
  },
];

const rooms = [
  { name: "Living Room", icon: "🛋️", color: "blue" },
  { name: "Bedroom 01", icon: "🛏️", color: "purple" },
  { name: "Kitchen", icon: "🍳", color: "orange" },
  { name: "Bedroom 02", icon: "🛏️", color: "green" },
  { name: "Bathroom", icon: "🚿", color: "pink" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const savedUser = JSON.parse(
    localStorage.getItem("ai_builder_user") || "{}"
  );

  const displayName = savedUser.name || savedUser.email || "Architect";

  function logout() {
    localStorage.removeItem("ai_builder_user");
    navigate("/", { replace: true });
  }

  return (
    <div className="dashboard">
      <header className="dashboard-nav">
        <Link to="/dashboard" className="dashboard-brand">
          <span className="dashboard-logo">⌂</span>
          <span>
            AI HOUSE BUILDER
            <small>ARCHITECTURE STUDIO</small>
          </span>
        </Link>

        <div className="dashboard-user">
          <div className="user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="user-email">{displayName}</span>
          <button
            type="button"
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div className="hero-copy">
            <span className="dashboard-eyebrow">
              <span className="status-dot" />
              YOUR PERSONAL AI ARCHITECT
            </span>

            <h1>
              Turn your idea into a
              <br />
              <span>complete house plan.</span>
            </h1>

            <p>
              Describe your plot, rooms and preferences. Let AI help
              you create a structured floor plan with 2D drawings
              and an interactive 3D concept.
            </p>

            <div className="hero-actions">
              <Link to="/generator" className="dashboard-primary">
                Generate House Plan <span>→</span>
              </Link>
              <a href="#features" className="dashboard-secondary">
                Explore features
              </a>
            </div>

            <div className="hero-trust">
              <span>✦ AI-assisted planning</span>
              <span>⌗ 2D layouts</span>
              <span>◇ 3D concepts</span>
            </div>
          </div>

          <div className="house-preview">
            <div className="preview-top">
              <div>
                <span className="preview-label">DESIGN PREVIEW</span>
                <h3>Modern Residence</h3>
              </div>
              <span className="preview-status">CONCEPT</span>
            </div>

            <div className="blueprint">
              <div className="blueprint-grid" />
              <div className="floorplan">
                <div className="plan-room plan-living">
                  <span>01</span>
                  <strong>LIVING</strong>
                  <small>16' × 14'</small>
                </div>
                <div className="plan-room plan-bedroom">
                  <span>02</span>
                  <strong>BEDROOM</strong>
                  <small>12' × 12'</small>
                </div>
                <div className="plan-room plan-kitchen">
                  <span>03</span>
                  <strong>KITCHEN</strong>
                  <small>10' × 10'</small>
                </div>
                <div className="plan-room plan-bath">
                  <span>04</span>
                  <strong>BATH</strong>
                  <small>6' × 8'</small>
                </div>
              </div>
              <div className="blueprint-caption">
                <span>⌗ FLOOR PLAN CONCEPT</span>
                <span>NOT TO SCALE</span>
              </div>
            </div>

            <div className="preview-bottom">
              <div>
                <span className="preview-mini-icon">✦</span>
                <span>
                  <strong>AI-assisted design</strong>
                  <small>Built around your requirements</small>
                </span>
              </div>
              <span className="preview-arrow">↗</span>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">GET STARTED</span>
              <h2>Your design workspace</h2>
              <p>Everything you need to plan your dream home.</p>
            </div>
            <Link to="/generator" className="section-link">
              Start designing →
            </Link>
          </div>

          <div className="room-grid">
            {rooms.map((room) => (
              <button
                type="button"
                className="room-card"
                key={room.name}
                onClick={() => navigate("/generator")}
              >
                <span className={`room-icon ${room.color}`}>
                  {room.icon}
                </span>
                <span className="room-name">{room.name}</span>
                <span className="room-arrow">↗</span>
              </button>
            ))}
          </div>

          <p className="room-note">
            Select a category to open the generator and configure your
            own house requirements.
          </p>
        </section>

        <section className="dashboard-section" id="features">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">POWERFUL TOOLS</span>
              <h2>From idea to visualization</h2>
              <p>Explore the tools available in your design workflow.</p>
            </div>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-card-top">
                  <span className="feature-icon">{feature.icon}</span>
                  <span className="feature-tag">{feature.tag}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Link to="/generator" className="feature-link">
                  Explore tool <span>→</span>
                </Link>
                <span className="feature-number">
                  0{index + 1}
                </span>
              </article>
            ))}
          </div>
        </section>

        <footer className="dashboard-footer">
          <Link to="/dashboard" className="footer-brand">
            ⌂ AI HOUSE BUILDER
          </Link>
          <span>Design smarter. Build with confidence.</span>
        </footer>
      </main>
    </div>
  );
}

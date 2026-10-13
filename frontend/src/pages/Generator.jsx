
import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import FloorCanvas from "../components/FloorCanvas";
import House3D from "../components/House3D";

const initialForm = {
  plotWidth: "30",
  plotLength: "40",
  floors: "1",
  bedrooms: "3",
  bathrooms: "2",
  kitchenType: "Closed",
  livingRoom: true,
  parking: true,
  garden: false,
  poojaRoom: false,
  balcony: true,
  facing: "East",
  budget: "2500000",
  designStyle: "Modern",
  additionalRequirements: "",
};

function Field({ label, hint, children }) {
  return (
    <label className="house-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Choice({ label, checked, onChange }) {
  return (
    <label className="house-choice">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function formatINR(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

export default function Generator() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function generateHouse(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    const width = Number(form.plotWidth);
    const length = Number(form.plotLength);
    const floors = Number(form.floors);
    const bedrooms = Number(form.bedrooms);
    const bathrooms = Number(form.bathrooms);
    const budget = Number(form.budget);

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(length) ||
      width < 10 ||
      length < 10 ||
      width > 500 ||
      length > 500
    ) {
      setError("Plot dimensions must be between 10 and 500 feet.");
      return;
    }

    if (![1, 2, 3].includes(floors)) {
      setError("Select between 1 and 3 floors.");
      return;
    }

    if (
      !Number.isInteger(bedrooms) ||
      bedrooms < 0 ||
      bedrooms > 12 ||
      !Number.isInteger(bathrooms) ||
      bathrooms < 0 ||
      bathrooms > 12
    ) {
      setError("Bedrooms and bathrooms must be whole numbers from 0 to 12.");
      return;
    }

    if (!Number.isFinite(budget) || budget < 0) {
      setError("Enter a valid budget in INR.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        plotSize: `${width} x ${length} feet`,
        plotWidth: width,
        plotLength: length,
        floors,
        bedrooms,
        bathrooms,
        kitchenType: form.kitchenType,
        livingRoom: form.livingRoom,
        parking: form.parking,
        garden: form.garden,
        poojaRoom: form.poojaRoom,
        balcony: form.balcony,
        facing: form.facing,
        budget,
        designStyle: form.designStyle,
        additionalRequirements: form.additionalRequirements.trim(),
      };

      const response = await api.post("/generate", payload);
      const data = response.data;

      if (!data?.success || !data?.result) {
        throw new Error(
          data?.error || "The backend did not return a valid house plan."
        );
      }

      if (!Array.isArray(data.result.rooms)) {
        throw new Error("The generated plan does not contain a valid room list.");
      }

      setResult(data.result);

      window.setTimeout(() => {
        document.getElementById("generated-plan")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      console.error("House generation error:", err);

      if (err.response?.status === 404) {
        setError("API endpoint not found. Check the backend /generate route.");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. Please try again.");
      } else if (!err.response) {
        setError("Cannot connect to the backend. Start the server on port 5000.");
      } else {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Could not generate the house plan."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ ...initialForm });
    setResult(null);
    setError("");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/dashboard" className="brand">
          <span aria-hidden="true">⌂</span>
          AI HOUSE BUILDER
        </Link>

        <Link to="/dashboard" className="ghost">
          ← Dashboard
        </Link>
      </header>

      <main className="generator">
        <section className="prompt-card">
          <div className="eyebrow">✦ PERSONALIZED AI ARCHITECT</div>

          <h1>Design Your Dream House</h1>

          <p>
            Customize your plot, rooms, budget and design preferences.
            Generate a personalized house concept with an interactive
            2D floor plan and 3D preview.
          </p>

          <form onSubmit={generateHouse}>
            <h2>01. Plot & Floors</h2>

            <div className="house-form-grid">
              <Field label="Plot width (feet)">
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="0.5"
                  required
                  value={form.plotWidth}
                  onChange={(e) => update("plotWidth", e.target.value)}
                />
              </Field>

              <Field label="Plot length (feet)">
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="0.5"
                  required
                  value={form.plotLength}
                  onChange={(e) => update("plotLength", e.target.value)}
                />
              </Field>

              <Field label="Number of floors">
                <select
                  value={form.floors}
                  onChange={(e) => update("floors", e.target.value)}
                >
                  <option value="1">Ground floor</option>
                  <option value="2">G+1 · 2 floors</option>
                  <option value="3">G+2 · 3 floors</option>
                </select>
              </Field>

              <Field label="House facing">
                <select
                  value={form.facing}
                  onChange={(e) => update("facing", e.target.value)}
                >
                  <option>North</option>
                  <option>South</option>
                  <option>East</option>
                  <option>West</option>
                </select>
              </Field>
            </div>

            <h2>02. Rooms & Facilities</h2>

            <div className="house-form-grid">
              <Field label="Bedrooms">
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="1"
                  required
                  value={form.bedrooms}
                  onChange={(e) => update("bedrooms", e.target.value)}
                />
              </Field>

              <Field label="Bathrooms">
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="1"
                  required
                  value={form.bathrooms}
                  onChange={(e) => update("bathrooms", e.target.value)}
                />
              </Field>

              <Field label="Kitchen type">
                <select
                  value={form.kitchenType}
                  onChange={(e) => update("kitchenType", e.target.value)}
                >
                  <option>Open</option>
                  <option>Closed</option>
                </select>
              </Field>
            </div>

            <div className="house-options">
              <Choice
                label="Living room"
                checked={form.livingRoom}
                onChange={(v) => update("livingRoom", v)}
              />
              <Choice
                label="Car parking"
                checked={form.parking}
                onChange={(v) => update("parking", v)}
              />
              <Choice
                label="Garden"
                checked={form.garden}
                onChange={(v) => update("garden", v)}
              />
              <Choice
                label="Pooja room"
                checked={form.poojaRoom}
                onChange={(v) => update("poojaRoom", v)}
              />
              <Choice
                label="Balcony"
                checked={form.balcony}
                onChange={(v) => update("balcony", v)}
              />
            </div>

            <h2>03. Budget & Design</h2>

            <div className="house-form-grid">
              <Field label="Budget (INR ₹)">
                <input
                  type="number"
                  min="0"
                  max="10000000000"
                  step="10000"
                  required
                  value={form.budget}
                  onChange={(e) => update("budget", e.target.value)}
                />
              </Field>

              <Field label="Design style">
                <select
                  value={form.designStyle}
                  onChange={(e) => update("designStyle", e.target.value)}
                >
                  <option>Modern</option>
                  <option>Traditional</option>
                  <option>Luxury</option>
                  <option>Minimalist</option>
                </select>
              </Field>
            </div>

            <Field label="Additional requirements">
              <textarea
                rows={4}
                maxLength={2000}
                value={form.additionalRequirements}
                onChange={(e) =>
                  update("additionalRequirements", e.target.value)
                }
                placeholder="e.g. home office, elderly-friendly rooms, extra windows..."
              />
            </Field>

            {error && (
              <div className="error" role="alert">
                <strong>Generation failed</strong>
                <p>{error}</p>
              </div>
            )}

            <div className="actions">
              <button
                type="submit"
                className="primary"
                disabled={loading}
              >
                {loading ? "Generating your design..." : "✦ Generate My House →"}
              </button>

              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Reset
              </button>
            </div>

            {loading && (
              <p role="status" aria-live="polite">
                Your requirements are being processed by AI. This may take
                a little time.
              </p>
            )}
          </form>
        </section>

        {result && (
          <div id="generated-plan">
            <section className="summary">
              <div>
                <span>PROJECT</span>
                <strong>{result.title || "Personalized House Plan"}</strong>
              </div>
              <div>
                <span>PLOT SIZE</span>
                <strong>{result.plotSize || `${form.plotWidth} × ${form.plotLength} ft`}</strong>
              </div>
              <div>
                <span>BEDROOMS</span>
                <strong>{result.bedrooms ?? form.bedrooms}</strong>
              </div>
              <div>
                <span>BATHROOMS</span>
                <strong>{result.bathrooms ?? form.bathrooms}</strong>
              </div>
              <div>
                <span>FACING</span>
                <strong>{result.facing || form.facing}</strong>
              </div>
              <div>
                <span>ESTIMATED COST</span>
                <strong>
                  ₹{formatINR(result.costEstimate?.estimatedCost)}
                </strong>
              </div>
            </section>

            {result.summary && (
              <section className="panel">
                <h2>Design Summary</h2>
                <p>{result.summary}</p>
                <p>
                  <strong>Style:</strong> {result.designStyle || form.designStyle}
                  {" · "}
                  <strong>Floors:</strong> {result.floors ?? form.floors}
                </p>
              </section>
            )}

            {result.warnings?.length > 0 && (
              <section className="panel">
                <h2>Design Warnings</h2>
                <ul>
                  {result.warnings.map((warning, index) => (
                    <li key={`${index}-${warning}`}>{warning}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="panel">
              <h2>📐 2D Floor Plan</h2>
              <FloorCanvas rooms={result.rooms} plan={result} />
            </section>

            <section className="panel">
              <h2>🏗️ 3D House Preview</h2>
              <House3D rooms={result.rooms} plan={result} />
            </section>

            <section className="panel">
              <h2>Room Dimensions</h2>

              {result.rooms.length === 0 ? (
                <p>
                  No valid rooms were returned. Review the warnings and
                  generate again.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Floor</th>
                        <th>Dimensions</th>
                        <th>Area</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rooms.map((room, index) => (
                        <tr key={`${room.name}-${room.floor}-${index}`}>
                          <td>{room.name}</td>
                          <td>{Number(room.floor || 0) + 1}</td>
                          <td>
                            {room.breadth ?? room.width} × {room.length} ft
                          </td>
                          <td>{room.area ?? "—"} sq ft</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p>
                <strong>Cost estimate:</strong>{" "}
                {result.costEstimate?.disclaimer ||
                  "This is an indicative estimate, not a construction quotation."}
              </p>

              {result.costEstimate?.withinBudget !== null &&
                result.costEstimate?.withinBudget !== undefined && (
                  <p>
                    <strong>Budget status:</strong>{" "}
                    {result.costEstimate.withinBudget
                      ? "Within your entered budget"
                      : "Above your entered budget"}
                  </p>
                )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
